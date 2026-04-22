import { User, AuthTokens, SessionState } from '../../types/auth';
import {
  storeTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  isTokenExpired,
  getTokenExpirationTime,
} from './tokens';
import { refreshAccessToken, getCurrentUser } from './auth';

// Retry configuration for token refresh
const MAX_REFRESH_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

/**
 * Sleep utility for exponential backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Attempt token refresh with exponential backoff
 */
async function refreshWithRetry(refreshToken: string): Promise<AuthTokens> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_REFRESH_RETRIES; attempt++) {
    try {
      const newTokens = await refreshAccessToken(refreshToken);
      return newTokens;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_REFRESH_RETRIES - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        if (__DEV__) console.log(`⏳ Retry ${attempt + 1} in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('Token refresh failed after retries');
}

/**
 * Initialize session on app launch
 *
 * SECURITY: Uses server-side validation via supabase.auth.getUser()
 * instead of trusting locally stored JWT claims.
 */
export async function initializeSession(): Promise<SessionState> {
  try {
    if (__DEV__) console.log('🔍 Initializing session...');

    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();

    if (!accessToken || !refreshToken) {
      if (__DEV__) console.log('❌ No tokens found');
      return {
        isAuthenticated: false,
        user: null,
        tokens: null,
        loading: false,
      };
    }

    // Check if access token is expired or expiring soon (5 min buffer)
    if (isTokenExpired(accessToken)) {
      if (__DEV__) console.log('⏰ Access token expired/expiring, attempting refresh...');

      try {
        const newTokens = await refreshWithRetry(refreshToken);
        await storeTokens(newTokens.access_token, newTokens.refresh_token);

        // SECURITY: Get user from Supabase server (validates token signature)
        const user = await getCurrentUser();

        if (!user) {
          if (__DEV__) console.log('❌ Failed to get user after refresh');
          await clearTokens();
          return {
            isAuthenticated: false,
            user: null,
            tokens: null,
            loading: false,
          };
        }

        if (__DEV__) console.log('✅ Session refreshed');
        return {
          isAuthenticated: true,
          user,
          tokens: newTokens,
          loading: false,
        };
      } catch (error) {
        if (__DEV__) console.error('❌ Token refresh failed:', error);
        await clearTokens();
        return {
          isAuthenticated: false,
          user: null,
          tokens: null,
          loading: false,
        };
      }
    }

    // SECURITY: Validate token server-side, don't just decode locally
    const user = await getCurrentUser();

    if (!user) {
      if (__DEV__) console.log('❌ Token invalid (server validation failed)');
      await clearTokens();
      return {
        isAuthenticated: false,
        user: null,
        tokens: null,
        loading: false,
      };
    }

    // Get actual expiration from token for accurate expires_in
    const expiresAt = getTokenExpirationTime(accessToken);
    const expiresIn = expiresAt ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)) : 3600;

    if (__DEV__) console.log('✅ Valid session found');
    return {
      isAuthenticated: true,
      user,
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn,
      },
      loading: false,
    };
  } catch (error) {
    if (__DEV__) console.error('❌ Session initialization error:', error);
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
  if (__DEV__) console.log('💾 Session saved');
}

/**
 * Clear session (logout)
 */
export async function clearSession(): Promise<void> {
  await clearTokens();
  if (__DEV__) console.log('🗑️ Session cleared');
}

/**
 * Get user info from JWT token
 *
 * @deprecated Use getCurrentUser() from auth.ts instead for server-validated user info.
 * This function is kept for backward compatibility but should not be used for
 * authentication decisions as it doesn't validate the token signature.
 */
export async function getUserFromToken(token: string): Promise<User> {
  // SECURITY: Prefer server-side validation
  const serverUser = await getCurrentUser();
  if (serverUser) {
    return serverUser;
  }

  // Fallback to local decode only if server is unreachable
  // This should only happen in offline scenarios
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    // Decode payload (base64url -> base64 -> JSON)
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));

    return {
      id: payload.sub || payload.user_id,
      email: payload.email,
      first_name: payload.first_name || payload.user_metadata?.first_name || '',
      last_name: payload.last_name || payload.user_metadata?.last_name || '',
      email_verified: payload.email_verified || !!payload.email_confirmed_at,
      onboarding_completed: payload.onboarding_completed || payload.user_metadata?.onboarding_completed || false,
      created_at: new Date(payload.created_at || Date.now()),
      updated_at: new Date(payload.updated_at || payload.created_at || Date.now()),
    };
  } catch (error) {
    if (__DEV__) console.error('Failed to decode token:', error);
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

/**
 * Schedule proactive token refresh before expiration
 * Call this after successful authentication to set up background refresh
 */
export function scheduleTokenRefresh(
  tokens: AuthTokens,
  onRefresh: (newTokens: AuthTokens) => void,
  onError: (error: Error) => void
): () => void {
  const expiresAt = getTokenExpirationTime(tokens.access_token);
  if (!expiresAt) {
    return () => {}; // No cleanup needed
  }

  // Refresh 5 minutes before expiration
  const refreshAt = expiresAt - 5 * 60 * 1000;
  const now = Date.now();
  const delay = Math.max(0, refreshAt - now);

  if (delay <= 0) {
    // Token is already expiring, refresh immediately
    refreshWithRetry(tokens.refresh_token)
      .then(onRefresh)
      .catch(onError);
    return () => {};
  }

  const timeoutId = setTimeout(async () => {
    try {
      const newTokens = await refreshWithRetry(tokens.refresh_token);
      await storeTokens(newTokens.access_token, newTokens.refresh_token);
      onRefresh(newTokens);

      // Schedule next refresh
      scheduleTokenRefresh(newTokens, onRefresh, onError);
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }, delay);

  // Return cleanup function
  return () => clearTimeout(timeoutId);
}
