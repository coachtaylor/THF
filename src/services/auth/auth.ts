import { getSupabaseClient } from '../supabase';
import {
  User,
  LoginRequest,
  SignupRequest,
  LoginResponse,
  SignupResponse,
  AuthError,
  AuthTokens,
} from '../../types/auth';
import {
  storeTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
} from './tokens';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.transfitness.app';

/**
 * Login with email and password
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    console.log('🔐 Attempting login:', credentials.email);

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    console.log('✅ Login successful:', data.user.email);

    // Store tokens securely
    if (data.tokens) {
      await storeTokens(data.tokens.access_token, data.tokens.refresh_token);
    }

    return data;
  } catch (error) {
    console.error('❌ Login error:', error);
    throw error;
  }
}

/**
 * Create new account
 */
export async function signup(data: SignupRequest): Promise<SignupResponse> {
  try {
    console.log('📝 Creating account:', data.email);

    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Signup failed');
    }

    console.log('✅ Account created:', result.user.email);

    // Store tokens if provided (some backends return tokens immediately)
    if (result.tokens) {
      await storeTokens(result.tokens.access_token, result.tokens.refresh_token);
    }

    return result;
  } catch (error) {
    console.error('❌ Signup error:', error);
    throw error;
  }
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log('📧 Verifying email...');

    const response = await fetch(`${API_URL}/auth/verify-email?token=${token}`, {
      method: 'GET',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Verification failed');
    }

    console.log('✅ Email verified');
    return data;
  } catch (error) {
    console.error('❌ Email verification error:', error);
    throw error;
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(userId: string): Promise<void> {
  try {
    console.log('📧 Resending verification email...');

    const response = await fetch(`${API_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Resend failed');
    }

    console.log('✅ Verification email sent');
  } catch (error) {
    console.error('❌ Resend verification error:', error);
    throw error;
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    console.log('🔑 Requesting password reset:', email);

    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Request failed');
    }

    console.log('✅ Password reset email sent');
  } catch (error) {
    console.error('❌ Password reset request error:', error);
    throw error;
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  try {
    console.log('🔑 Resetting password...');

    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, new_password: newPassword }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Reset failed');
    }

    console.log('✅ Password reset successful');
  } catch (error) {
    console.error('❌ Password reset error:', error);
    throw error;
  }
}

/**
 * Logout (clear session)
 */
export async function logout(): Promise<void> {
  try {
    console.log('👋 Logging out...');

    // Call logout endpoint to invalidate refresh token
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Logged out');
  } catch (error) {
    console.error('❌ Logout error:', error);
    // Don't throw - still clear local tokens
  } finally {
    // Always clear local tokens
    await clearTokens();
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  try {
    console.log('🔄 Refreshing access token...');

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Token refresh failed');
    }

    console.log('✅ Token refreshed');

    // Store new tokens
    if (data.tokens) {
      await storeTokens(data.tokens.access_token, data.tokens.refresh_token);
    }

    return data.tokens;
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    throw error;
  }
}

/**
 * Get current authenticated user from API
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return null;
    }

    console.log('👤 Fetching current user...');

    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token invalid, try to refresh
        const refreshToken = await getRefreshToken();
        if (refreshToken) {
          try {
            const newTokens = await refreshAccessToken(refreshToken);
            // Retry with new token
            const retryResponse = await fetch(`${API_URL}/auth/me`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${newTokens.access_token}`,
              },
            });
            if (retryResponse.ok) {
              const data = await retryResponse.json();
              console.log('✅ Current user fetched:', data.user?.email);
              return data.user;
            }
          } catch {
            return null;
          }
        }
      }
      return null;
    }

    const data = await response.json();
    console.log('✅ Current user fetched:', data.user?.email);
    return data.user;
  } catch (error) {
    console.error('❌ Error getting current user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated and token is valid
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return false;
    }

    // Check if token is expired
    if (isTokenExpired(accessToken)) {
      // Try to refresh
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        return false;
      }
      try {
        await refreshAccessToken(refreshToken);
        return true;
      } catch {
        return false;
      }
    }

    // Verify token is valid by calling /auth/me
    const user = await getCurrentUser();
    return user !== null;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}
