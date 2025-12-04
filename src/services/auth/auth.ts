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
 * Reset password with token (alias for updatePassword for backward compatibility)
 */
export async function resetPassword(_token: string, newPassword: string): Promise<void> {
  // In Supabase, the token is handled via the deep link which sets up the session
  // We just need to update the password
  return updatePassword(newPassword);
}

/**
 * Verify email - handled by Supabase via deep links
 * This is called after the user clicks the verification link
 */
export async function verifyEmail(_token: string): Promise<{ success: boolean; message: string }> {
  // In Supabase, email verification is handled automatically via the confirmation URL
  // The token is processed by Supabase when the user clicks the link
  // We just need to check if the current user is verified
  const user = await getCurrentUser();

  if (user?.email_verified) {
    return { success: true, message: 'Email verified successfully' };
  }

  return { success: false, message: 'Email not yet verified' };
}

/**
 * Refresh access token - Supabase handles this automatically
 */
export async function refreshAccessToken(_refreshToken: string): Promise<AuthTokens> {
  console.log('🔄 Refreshing access token...');

  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    console.error('❌ Token refresh error:', error.message);
    throw new Error(error.message);
  }

  if (!data.session) {
    throw new Error('No session returned from refresh');
  }

  console.log('✅ Token refreshed');

  return {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in: data.session.expires_in || 3600,
  };
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
