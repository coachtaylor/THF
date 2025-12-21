import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '../types/auth';
import * as authService from '../services/auth/auth';
import { signInWithGoogle as googleSignIn, GoogleAuthResult } from '../services/auth/googleAuth';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { first_name: string; last_name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  signInWithGoogle: () => Promise<GoogleAuthResult>;
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

  const signInWithGoogle = useCallback(async (): Promise<GoogleAuthResult> => {
    const result = await googleSignIn();
    if (result.success && result.user) {
      // Map the Supabase user to our User type
      const mappedUser: User = {
        id: result.user.id,
        email: result.user.email || '',
        first_name: result.user.user_metadata?.first_name || result.user.user_metadata?.full_name?.split(' ')[0] || '',
        last_name: result.user.user_metadata?.last_name || result.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        email_verified: !!result.user.email_confirmed_at,
        onboarding_completed: result.user.user_metadata?.onboarding_completed || false,
        created_at: new Date(result.user.created_at),
        updated_at: new Date(result.user.updated_at || result.user.created_at),
      };
      setUser(mappedUser);
    }
    return result;
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
        signInWithGoogle,
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
