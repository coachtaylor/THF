/**
 * Google OAuth Authentication Service
 *
 * SECURITY NOTES:
 *
 * 1. ID Token Validation:
 *    - Supabase validates the ID token signature on the server side
 *    - We perform additional client-side validation for defense in depth
 *    - Token audience (aud) claim is verified against our client ID
 *
 * 2. Nonce Handling:
 *    - Native Google Sign-In SDK doesn't support custom nonce in the standard flow
 *    - Supabase accepts tokens without nonce when using signInWithIdToken
 *    - We implement additional security checks to compensate
 *
 * 3. Rate Limiting:
 *    - Auth attempts are rate-limited to prevent abuse
 *    - Failed attempts trigger exponential backoff
 *
 * 4. Token Freshness:
 *    - ID tokens have short validity (typically 1 hour)
 *    - We verify the token was issued recently before use
 */

import {
  GoogleSignin,
  statusCodes,
  isSuccessResponse,
  isErrorWithCode,
} from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { supabase } from '../../utils/supabase';
import { checkRateLimit, recordAttempt, formatRetryTime } from '../../utils/rateLimiter';
import { sanitizeErrorMessage, logError } from '../../utils/errorMessages';

export interface GoogleAuthResult {
  success: boolean;
  user?: any;
  error?: string;
  isNewUser?: boolean;
}

/**
 * Parsed JWT payload structure for Google ID tokens
 */
interface GoogleIdTokenPayload {
  iss: string;      // Issuer (accounts.google.com or https://accounts.google.com)
  aud: string;      // Audience (our client ID)
  sub: string;      // Subject (Google user ID)
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  iat: number;      // Issued at (Unix timestamp)
  exp: number;      // Expiration (Unix timestamp)
  nonce?: string;   // Optional nonce
}

let isConfigured = false;
let configuredWebClientId: string | null = null;

/**
 * SECURITY: Valid Google token issuers
 * Google ID tokens can come from either of these issuers
 */
const VALID_GOOGLE_ISSUERS = [
  'accounts.google.com',
  'https://accounts.google.com',
];

/**
 * SECURITY: Maximum token age in seconds
 * Reject tokens that were issued too long ago (even if not expired)
 * This helps prevent replay attacks with stolen tokens
 */
const MAX_TOKEN_AGE_SECONDS = 300; // 5 minutes

/**
 * SECURITY: Parse and validate a Google ID token (client-side validation)
 *
 * NOTE: This is defense-in-depth. Supabase performs full cryptographic
 * verification on the server side. This client-side check catches obvious
 * issues early and validates claims we care about.
 *
 * @param idToken The raw JWT string from Google
 * @returns Parsed payload or null if validation fails
 */
function parseAndValidateIdToken(idToken: string): GoogleIdTokenPayload | null {
  try {
    // JWT format: header.payload.signature
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      if (__DEV__) console.warn('🔐 Invalid JWT format');
      return null;
    }

    // Decode payload (middle part) - base64url to JSON
    const payloadBase64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const payloadJson = atob(payloadBase64);
    const payload: GoogleIdTokenPayload = JSON.parse(payloadJson);

    // SECURITY: Validate issuer
    if (!VALID_GOOGLE_ISSUERS.includes(payload.iss)) {
      if (__DEV__) console.warn('🔐 Invalid token issuer:', payload.iss);
      return null;
    }

    // SECURITY: Validate audience matches our client ID
    if (configuredWebClientId && payload.aud !== configuredWebClientId) {
      if (__DEV__) console.warn('🔐 Token audience mismatch');
      return null;
    }

    // SECURITY: Check token is not expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      if (__DEV__) console.warn('🔐 Token is expired');
      return null;
    }

    // SECURITY: Check token was issued recently (prevent replay)
    const tokenAge = now - payload.iat;
    if (tokenAge > MAX_TOKEN_AGE_SECONDS) {
      if (__DEV__) console.warn('🔐 Token is too old:', tokenAge, 'seconds');
      return null;
    }

    // SECURITY: Ensure token was not issued in the future (clock skew check)
    // Allow 30 seconds of clock skew
    if (payload.iat > now + 30) {
      if (__DEV__) console.warn('🔐 Token issued in the future');
      return null;
    }

    return payload;
  } catch (error) {
    if (__DEV__) console.error('🔐 Error parsing ID token:', error);
    return null;
  }
}

function configureGoogleSignIn(): void {
  if (isConfigured) return;

  const webClientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    process.env.GOOGLE_WEB_CLIENT_ID ||
    Constants.expoConfig?.extra?.googleWebClientId;

  const iosClientId =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
    process.env.GOOGLE_IOS_CLIENT_ID ||
    Constants.expoConfig?.extra?.googleIosClientId;

  if (!webClientId) {
    console.warn('Google Web Client ID not configured');
    return;
  }

  // Store for later validation
  configuredWebClientId = webClientId;

  GoogleSignin.configure({
    webClientId,
    iosClientId,
    offlineAccess: true,
    scopes: ['profile', 'email'],
  });

  isConfigured = true;
  if (__DEV__) console.log('🔐 Google Sign-In configured');
}

/**
 * Sign in with Google using native SDK and Supabase signInWithIdToken
 *
 * SECURITY FEATURES:
 * - Rate limiting to prevent brute force / abuse
 * - ID token validation (issuer, audience, expiration, freshness)
 * - Error sanitization to prevent information leakage
 */
export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  try {
    // SECURITY: Check rate limit before proceeding
    const rateLimitCheck = checkRateLimit('login', 'google_oauth');
    if (!rateLimitCheck.allowed) {
      const retryTime = formatRetryTime(rateLimitCheck.retryAfterMs!);
      return {
        success: false,
        error: `Too many sign-in attempts. Please try again in ${retryTime}.`,
      };
    }

    if (__DEV__) console.log('🔐 Starting native Google Sign-In...');

    configureGoogleSignIn();

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      // User cancelled - don't count as failed attempt
      return { success: false, error: 'Sign-in was cancelled' };
    }

    const { idToken } = response.data;

    if (!idToken) {
      recordAttempt('login', 'google_oauth', false);
      logError('Google Sign-In', { message: 'No ID token received' });
      return { success: false, error: 'Authentication failed. Please try again.' };
    }

    // SECURITY: Validate ID token before sending to Supabase
    // This is defense-in-depth; Supabase also validates on the server
    const tokenPayload = parseAndValidateIdToken(idToken);
    if (!tokenPayload) {
      recordAttempt('login', 'google_oauth', false);
      logError('Google Sign-In', { message: 'ID token validation failed' });
      return { success: false, error: 'Authentication failed. Please try again.' };
    }

    if (__DEV__) {
      console.log('🔐 ID token validated, authenticating with Supabase...');
      console.log('🔐 Token claims:', {
        iss: tokenPayload.iss,
        aud: tokenPayload.aud ? `${tokenPayload.aud.substring(0, 20)}...` : 'none',
        email: tokenPayload.email ? `${tokenPayload.email.substring(0, 5)}...` : 'none',
      });
    }

    // SECURITY NOTE: Native Google Sign-In SDK doesn't support custom nonce.
    // Supabase accepts tokens without nonce when using signInWithIdToken.
    // We compensate with additional security measures:
    // 1. Token freshness check (MAX_TOKEN_AGE_SECONDS)
    // 2. Audience validation
    // 3. Rate limiting
    // 4. Server-side signature verification by Supabase
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      recordAttempt('login', 'google_oauth', false);
      logError('Supabase auth', error);
      const userMessage = sanitizeErrorMessage(error);
      return { success: false, error: userMessage };
    }

    if (!data.user) {
      recordAttempt('login', 'google_oauth', false);
      return { success: false, error: 'Authentication failed. Please try again.' };
    }

    // SECURITY: Record successful attempt (resets rate limit)
    recordAttempt('login', 'google_oauth', true);

    if (__DEV__) console.log('🔐 Google Sign-In successful');

    const isNewUser = !data.user?.user_metadata?.onboarding_completed;

    return {
      success: true,
      user: data.user,
      isNewUser,
    };
  } catch (error: any) {
    // Don't log full error in production - may contain sensitive info
    if (__DEV__) console.error('🔐 Google Sign-In error:', error);

    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          // User cancelled - don't count as failed attempt or log error
          return { success: false, error: 'Sign-in was cancelled' };
        case statusCodes.IN_PROGRESS:
          return { success: false, error: 'Sign-in is already in progress' };
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          return { success: false, error: 'Google Play Services not available' };
        default:
          recordAttempt('login', 'google_oauth', false);
          logError('Google Sign-In', error);
          return { success: false, error: 'Google Sign-In failed. Please try again.' };
      }
    }

    recordAttempt('login', 'google_oauth', false);
    logError('Google Sign-In', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Sign out from Google
 * Cleans up local Google Sign-In state
 */
export async function signOutFromGoogle(): Promise<void> {
  try {
    await GoogleSignin.signOut();
    if (__DEV__) console.log('🔐 Signed out from Google');
  } catch (error) {
    // Non-critical error - user may not have been signed in
    if (__DEV__) console.warn('🔐 Google sign-out error:', error);
  }
}

/**
 * Check if user is currently signed in to Google
 */
export async function isGoogleSignedIn(): Promise<boolean> {
  try {
    return await GoogleSignin.isSignedIn();
  } catch {
    return false;
  }
}

/**
 * Get current Google user (if signed in)
 */
export async function getCurrentGoogleUser() {
  try {
    return await GoogleSignin.getCurrentUser();
  } catch {
    return null;
  }
}

// Legacy function kept for compatibility
export function getRedirectUri(): string {
  return 'native://google-signin';
}
