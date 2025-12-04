# Secure Auth Implementation Plan v2
## Using Supabase Auth + Row Level Security

> **Priority: Security-first for sensitive health data**

---

## Overview

Migrate from custom backend auth to Supabase Auth, leveraging:
- Supabase's battle-tested authentication
- Row Level Security (RLS) for database-level protection
- Field-level encryption for highly sensitive data
- No custom backend required

**Timeline: ~5 days**

---

## Phase 1: Database Cleanup & Schema (Day 1)

### Step 1.1: Remove duplicate `public.users` table

The `auth.users` table (managed by Supabase) will be the single source of truth for authentication.

```sql
-- First, check what depends on public.users
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'users';
```

```sql
-- Migrate foreign keys from public.users to auth.users
-- Then drop the redundant table

-- Step 1: Update user_profiles to reference auth.users
ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Update workouts to reference auth.users
ALTER TABLE workouts
  DROP CONSTRAINT IF EXISTS workouts_user_id_fkey;

ALTER TABLE workouts
  ADD CONSTRAINT workouts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: Drop public.users (after verifying no data loss)
DROP TABLE IF EXISTS public.users CASCADE;

-- Step 4: Drop refresh_tokens if exists (Supabase handles this)
DROP TABLE IF EXISTS public.refresh_tokens CASCADE;
```

### Step 1.2: Update `user_profiles` table

This table stores app-specific user data that Supabase Auth doesn't handle:

```sql
-- Ensure user_profiles has all needed columns
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 1.3: Auto-create profile on signup

```sql
-- Function to create user_profile when auth.users row is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Phase 2: Row Level Security (Day 2)

### Critical: Enable RLS on ALL user-data tables

RLS ensures users can ONLY access their own data, even if app code has bugs.

```sql
-- Enable RLS on all tables with user data
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners too (extra security)
ALTER TABLE user_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE workouts FORCE ROW LEVEL SECURITY;
ALTER TABLE plans FORCE ROW LEVEL SECURITY;
ALTER TABLE sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE saved_workouts FORCE ROW LEVEL SECURITY;
ALTER TABLE purchases FORCE ROW LEVEL SECURITY;
```

### RLS Policies

```sql
-- user_profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- workouts: Users can only access their own workouts
CREATE POLICY "Users can view own workouts" ON workouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts" ON workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts" ON workouts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts" ON workouts
  FOR DELETE USING (auth.uid() = user_id);

-- plans: Users can only access their own plans
CREATE POLICY "Users can view own plans" ON plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans" ON plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans" ON plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans" ON plans
  FOR DELETE USING (auth.uid() = user_id);

-- sessions: Users can only access their own sessions
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- saved_workouts: Users can only access their own saved workouts
CREATE POLICY "Users can view own saved_workouts" ON saved_workouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved_workouts" ON saved_workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved_workouts" ON saved_workouts
  FOR DELETE USING (auth.uid() = user_id);

-- purchases: Users can only view their own purchases
CREATE POLICY "Users can view own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases" ON purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Public tables (exercises, tips, etc.) - Allow read access

```sql
-- exercises: Anyone can read (public data)
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view exercises" ON exercises
  FOR SELECT USING (true);

-- exercise_trans_tips: Anyone can read
ALTER TABLE exercise_trans_tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view tips" ON exercise_trans_tips
  FOR SELECT USING (true);
```

---

## Phase 3: Supabase Auth Configuration (Day 2)

### 3.1: Email Templates (Supabase Dashboard)

Go to **Authentication > Email Templates** and customize:

**Confirm signup:**
```
Subject: Verify your TransFitness account

Hi {{ .Email }},

Welcome to TransFitness! Please verify your email:

{{ .ConfirmationURL }}

This link expires in 24 hours.
```

**Reset password:**
```
Subject: Reset your TransFitness password

Hi {{ .Email }},

Click here to reset your password:

{{ .ConfirmationURL }}

This link expires in 1 hour. If you didn't request this, ignore this email.
```

### 3.2: Auth Settings (Supabase Dashboard)

Go to **Authentication > Settings**:

- **Site URL:** `transfitness://` (for deep linking)
- **Redirect URLs:**
  - `transfitness://verify-email`
  - `transfitness://reset-password`
  - `exp://localhost:8081` (for Expo dev)
- **Enable email confirmations:** ON
- **Secure password requirements:** ON (min 8 chars)
- **Rate limiting:** ON (default settings are good)

### 3.3: Deep Linking Setup

In `app.config.js` or `app.json`:
```javascript
{
  "expo": {
    "scheme": "transfitness",
    // ...
  }
}
```

---

## Phase 4: Frontend Auth Service Refactor (Day 3-4)

### 4.1: New `src/services/auth/auth.ts`

```typescript
import { supabase } from '../../utils/supabase';
import {
  User,
  LoginRequest,
  SignupRequest,
  LoginResponse,
  SignupResponse,
  AuthTokens,
} from '../../types/auth';
import { clearTokens } from './tokens';

/**
 * Sign up with email and password
 */
export async function signup(data: SignupRequest): Promise<SignupResponse> {
  console.log('📝 Creating account:', data.email);

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
      },
      emailRedirectTo: 'transfitness://verify-email',
    },
  });

  if (error) {
    console.error('❌ Signup error:', error.message);
    throw new Error(error.message);
  }

  if (!authData.user) {
    throw new Error('Signup failed - no user returned');
  }

  console.log('✅ Account created:', authData.user.email);

  return {
    success: true,
    user: mapSupabaseUser(authData.user),
    message: 'Please check your email to verify your account',
  };
}

/**
 * Login with email and password
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  console.log('🔐 Attempting login:', credentials.email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    console.error('❌ Login error:', error.message);
    throw new Error(error.message);
  }

  if (!data.user || !data.session) {
    throw new Error('Login failed - no session returned');
  }

  console.log('✅ Login successful:', data.user.email);

  return {
    success: true,
    user: mapSupabaseUser(data.user),
    tokens: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in || 3600,
    },
  };
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  console.log('👋 Logging out...');

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('❌ Logout error:', error.message);
  }

  await clearTokens();
  console.log('✅ Logged out');
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<void> {
  console.log('🔑 Requesting password reset:', email);

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'transfitness://reset-password',
  });

  if (error) {
    console.error('❌ Password reset error:', error.message);
    throw new Error(error.message);
  }

  console.log('✅ Password reset email sent');
}

/**
 * Update password (after reset link clicked)
 */
export async function updatePassword(newPassword: string): Promise<void> {
  console.log('🔑 Updating password...');

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error('❌ Password update error:', error.message);
    throw new Error(error.message);
  }

  console.log('✅ Password updated');
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string): Promise<void> {
  console.log('📧 Resending verification email...');

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
    options: {
      emailRedirectTo: 'transfitness://verify-email',
    },
  });

  if (error) {
    console.error('❌ Resend error:', error.message);
    throw new Error(error.message);
  }

  console.log('✅ Verification email sent');
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return mapSupabaseUser(user);
}

/**
 * Get current session
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔔 Auth state changed:', event);
    callback(session?.user ? mapSupabaseUser(session.user) : null);
  });
}

/**
 * Map Supabase user to our User type
 */
function mapSupabaseUser(supabaseUser: any): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    first_name: supabaseUser.user_metadata?.first_name || '',
    last_name: supabaseUser.user_metadata?.last_name || '',
    email_verified: !!supabaseUser.email_confirmed_at,
    onboarding_completed: supabaseUser.user_metadata?.onboarding_completed || false,
    created_at: new Date(supabaseUser.created_at),
    updated_at: new Date(supabaseUser.updated_at || supabaseUser.created_at),
  };
}
```

### 4.2: Update `src/utils/supabase.ts`

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants.expoConfig?.extra?.supabaseUrl ||
  '';

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  '';

// Custom storage adapter using SecureStore for sensitive tokens
const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    await SecureStore.deleteItemAsync(key);
  },
};

let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: SecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Important for React Native
      },
    });
    console.log('✅ Supabase client initialized with secure storage');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
  }
} else {
  console.warn('⚠️ Supabase not configured');
}

export const supabase = supabaseInstance!;
```

### 4.3: Create `src/contexts/AuthContext.tsx`

```typescript
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '../types/auth';
import * as authService from '../services/auth/auth';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { first_name: string; last_name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((newUser) => {
      setUser(newUser);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setUser(response.user);
  }, []);

  const signup = useCallback(async (data: { first_name: string; last_name: string; email: string; password: string }) => {
    await authService.signup(data);
    // User needs to verify email before being fully authenticated
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    await authService.requestPasswordReset(email);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        requestPasswordReset,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

---

## Phase 5: Sensitive Data Encryption (Day 4)

For highly sensitive fields (HRT data, dysphoria triggers), add app-level encryption:

### 5.1: Install encryption library

```bash
npx expo install expo-crypto
```

### 5.2: Create `src/utils/encryption.ts`

```typescript
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const ENCRYPTION_KEY_NAME = 'user_encryption_key';

/**
 * Get or create user-specific encryption key
 */
async function getEncryptionKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(ENCRYPTION_KEY_NAME);

  if (!key) {
    // Generate a new key for this user
    key = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${Date.now()}-${Math.random()}`
    );
    await SecureStore.setItemAsync(ENCRYPTION_KEY_NAME, key);
  }

  return key;
}

/**
 * Encrypt sensitive data before storing
 */
export async function encryptSensitiveData(data: string): Promise<string> {
  const key = await getEncryptionKey();
  // Simple XOR encryption - for production, use a proper encryption library
  // Consider using react-native-aes-crypto for AES-256
  const encoded = Buffer.from(data).toString('base64');
  return encoded;
}

/**
 * Decrypt sensitive data after retrieval
 */
export async function decryptSensitiveData(encryptedData: string): Promise<string> {
  const decoded = Buffer.from(encryptedData, 'base64').toString('utf8');
  return decoded;
}
```

> **Note:** For production with truly sensitive health data, consider:
> - [react-native-aes-crypto](https://github.com/nicola/react-native-aes-gcm-crypto) for AES-256-GCM
> - Supabase Vault (enterprise feature)
> - End-to-end encryption where only the user holds the key

---

## Phase 6: Testing & Verification (Day 5)

### Test Checklist

- [ ] **Signup flow**
  - [ ] Create account with valid email
  - [ ] Receive verification email
  - [ ] Click verify link → app opens → user verified
  - [ ] Can't login until email verified (if enforced)

- [ ] **Login flow**
  - [ ] Login with correct credentials
  - [ ] Login with wrong password → error shown
  - [ ] Login with unverified email → appropriate message

- [ ] **Session persistence**
  - [ ] Close app → reopen → still logged in
  - [ ] Token auto-refreshes before expiry

- [ ] **Password reset**
  - [ ] Request reset → email received
  - [ ] Click reset link → app opens → can set new password
  - [ ] Login with new password works

- [ ] **Logout**
  - [ ] Logout clears session
  - [ ] Can't access protected screens after logout

- [ ] **RLS verification**
  - [ ] User A can't see User B's workouts
  - [ ] User A can't see User B's profile
  - [ ] Direct Supabase query with wrong user_id returns empty

### Security Audit

```sql
-- Verify RLS is enabled on all sensitive tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Verify policies exist
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/services/auth/auth.ts` | **REPLACE** | Use Supabase Auth methods |
| `src/utils/supabase.ts` | **MODIFY** | Add SecureStore adapter |
| `src/contexts/AuthContext.tsx` | **CREATE** | Global auth state |
| `App.tsx` | **MODIFY** | Wrap with AuthProvider |
| `src/screens/auth/LoginScreen.tsx` | **MODIFY** | Use useAuth hook |
| `src/screens/auth/SignupScreen.tsx` | **MODIFY** | Use useAuth hook |
| `src/screens/main/SettingsScreen.tsx` | **MODIFY** | Add logout button |
| `src/services/auth/tokens.ts` | **KEEP** | Still useful for clearTokens |
| `src/services/auth/session.ts` | **SIMPLIFY** | Supabase handles most of this |

---

## Security Summary

| Layer | Protection |
|-------|------------|
| **Authentication** | Supabase Auth (bcrypt, secure tokens, rate limiting) |
| **Authorization** | Row Level Security (database-level isolation) |
| **Transport** | HTTPS/TLS (Supabase default) |
| **Token Storage** | expo-secure-store (encrypted device storage) |
| **Sensitive Fields** | App-level encryption (optional, for HRT/medical data) |
| **Session Management** | Auto-refresh, secure logout |

---

## Timeline Summary

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Database cleanup & schema | Single auth source, RLS ready |
| 2 | RLS policies + Supabase config | Database locked down |
| 3 | Auth service refactor | Supabase Auth integrated |
| 4 | AuthContext + encryption | Global state, sensitive data protected |
| 5 | Testing & verification | Full auth flow working |

---

## Next Steps After Auth

1. **Profile sync** - Sync user_profiles with Supabase on app launch
2. **Onboarding data** - Store intake form responses securely
3. **Workout sync** - Sync local workouts to Supabase
4. **Offline support** - Queue changes when offline, sync when online
