import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Store access token securely
 */
export async function storeAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

/**
 * Store refresh token securely
 */
export async function storeRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

/**
 * Get access token
 */
export async function getAccessToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

/**
 * Get refresh token
 */
export async function getRefreshToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

/**
 * Store both tokens
 */
export async function storeTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    storeAccessToken(accessToken),
    storeRefreshToken(refreshToken),
  ]);
}

/**
 * Clear all tokens (logout)
 */
export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

/**
 * Check if token is expired
 *
 * SECURITY NOTE: This only checks the expiration time for UI/UX purposes
 * (e.g., determining whether to proactively refresh). Actual authentication
 * decisions MUST use supabase.auth.getUser() which validates the token
 * signature server-side.
 *
 * @param token - JWT access token
 * @param bufferSeconds - Optional buffer to trigger refresh before actual expiration (default: 300 = 5 min)
 * @returns true if token is expired or will expire within buffer period
 */
export function isTokenExpired(token: string, bufferSeconds: number = 300): boolean {
  try {
    // Basic format validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true;
    }

    // Decode payload (base64url -> base64 -> JSON)
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));

    // Check for required exp claim
    if (typeof payload.exp !== 'number') {
      return true;
    }

    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const bufferMs = bufferSeconds * 1000;

    // Return true if expired OR will expire within buffer period
    return Date.now() >= expirationTime - bufferMs;
  } catch (error) {
    // If we can't decode, assume expired to trigger refresh
    return true;
  }
}

/**
 * Get token expiration time in milliseconds
 * Returns null if token is invalid
 */
export function getTokenExpirationTime(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));

    if (typeof payload.exp !== 'number') {
      return null;
    }

    return payload.exp * 1000;
  } catch {
    return null;
  }
}

