import { User, AuthTokens, SessionState } from '../../types/auth';
import {
  storeTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  isTokenExpired,
} from './tokens';
import { refreshAccessToken } from './auth';

/**
 * Initialize session on app launch
 *
 * Checks for existing tokens and validates them
 */
export async function initializeSession(): Promise<SessionState> {
  try {
    console.log('🔍 Initializing session...');

    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();

    if (!accessToken || !refreshToken) {
      console.log('❌ No tokens found');
      return {
        isAuthenticated: false,
        user: null,
        tokens: null,
        loading: false,
      };
    }

    // Check if access token is expired
    if (isTokenExpired(accessToken)) {
      console.log('⏰ Access token expired, attempting refresh...');

      try {
        const newTokens = await refreshAccessToken(refreshToken);
        await storeTokens(newTokens.access_token, newTokens.refresh_token);

        // Get user from new token
        const user = await getUserFromToken(newTokens.access_token);

        console.log('✅ Session refreshed');
        return {
          isAuthenticated: true,
          user,
          tokens: newTokens,
          loading: false,
        };
      } catch (error) {
        console.error('❌ Token refresh failed:', error);
        await clearTokens();
        return {
          isAuthenticated: false,
          user: null,
          tokens: null,
          loading: false,
        };
      }
    }

    // Access token is valid
    const user = await getUserFromToken(accessToken);

    console.log('✅ Valid session found:', user.email);
    return {
      isAuthenticated: true,
      user,
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: 3600, // Default 1 hour
      },
      loading: false,
    };
  } catch (error) {
    console.error('❌ Session initialization error:', error);
    return {
      isAuthenticated: false,
      user: null,
      tokens: null,
      loading: false,
    };
  }
}

/**
 * Save session after login/signup
 */
export async function saveSession(user: User, tokens: AuthTokens): Promise<void> {
  await storeTokens(tokens.access_token, tokens.refresh_token);
  console.log('💾 Session saved:', user.email);
}

/**
 * Clear session (logout)
 */
export async function clearSession(): Promise<void> {
  await clearTokens();
  console.log('🗑️ Session cleared');
}

/**
 * Get user info from JWT token
 */
export async function getUserFromToken(token: string): Promise<User> {
  try {
    // Decode JWT payload
    const payload = JSON.parse(atob(token.split('.')[1]));

    return {
      id: payload.sub || payload.user_id,
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      email_verified: payload.email_verified,
      onboarding_completed: payload.onboarding_completed,
      created_at: new Date(payload.created_at),
      updated_at: new Date(payload.updated_at || payload.created_at),
    };
  } catch (error) {
    console.error('Failed to decode token:', error);
    throw new Error('Invalid token');
  }
}

/**
 * Check if user needs onboarding
 */
export function needsOnboarding(user: User): boolean {
  return user.email_verified && !user.onboarding_completed;
}

/**
 * Check if user needs email verification
 */
export function needsEmailVerification(user: User): boolean {
  return !user.email_verified;
}
