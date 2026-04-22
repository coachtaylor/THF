import * as Linking from 'expo-linking';
import { supabase } from '../../utils/supabase';
import { verifyEmail } from './auth';
import { notifyError, notifySuccess } from '../../utils/toast';
import { sanitizeErrorMessage, logError } from '../../utils/errorMessages';
import { checkRateLimit, recordAttempt, formatRetryTime } from '../../utils/rateLimiter';

const prefix = Linking.createURL('/');

/**
 * Deep link result type for better error handling
 */
export interface DeepLinkResult {
  success: boolean;
  handled: boolean;
  error?: string;
}

/**
 * Allowed OTP types for verification
 * SECURITY: Whitelist valid types to prevent injection
 */
const ALLOWED_OTP_TYPES = ['signup', 'recovery', 'magiclink'] as const;
type OtpType = typeof ALLOWED_OTP_TYPES[number];

/**
 * Validate token hash format
 * SECURITY: Supabase token hashes are base64url-encoded strings
 * They should be alphanumeric with allowed special chars (- _ =)
 */
function isValidTokenHash(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // Token should be a reasonable length (not too short or too long)
  if (token.length < 20 || token.length > 500) {
    return false;
  }

  // Must be base64url-safe characters only
  const base64UrlPattern = /^[A-Za-z0-9_-]+={0,2}$/;
  return base64UrlPattern.test(token);
}

/**
 * Validate and normalize OTP type
 * SECURITY: Only allow whitelisted types
 */
function normalizeOtpType(type: string | undefined): OtpType {
  if (type && ALLOWED_OTP_TYPES.includes(type as OtpType)) {
    return type as OtpType;
  }
  // Default to 'magiclink' for backward compatibility, but log it
  if (__DEV__) {
    console.warn('🔗 Unknown OTP type received:', type);
  }
  return 'magiclink';
}

/**
 * Validate deep link URL origin
 * SECURITY: Only accept deep links from expected sources
 */
function isValidDeepLinkSource(url: string): boolean {
  try {
    const { hostname, scheme } = Linking.parse(url);

    // Accept our app scheme
    if (scheme === 'transfitness') {
      return true;
    }

    // Accept our web domain
    if (hostname === 'transfitness.app' || hostname === 'www.transfitness.app') {
      return true;
    }

    // Accept Expo development URLs
    if (__DEV__ && (scheme === 'exp' || hostname?.includes('localhost'))) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Handle deep link URL
 * Supports both legacy format and Supabase auth callback format
 *
 * SECURITY FEATURES:
 * - Rate limiting to prevent brute force attacks
 * - Token format validation
 * - Type parameter whitelisting
 * - URL origin validation
 */
export async function handleDeepLink(
  url: string,
  navigation: any
): Promise<DeepLinkResult> {
  try {
    // SECURITY: Validate URL source
    if (!isValidDeepLinkSource(url)) {
      if (__DEV__) {
        console.warn('🔗 Rejected deep link from unknown source:', url);
      }
      return { success: false, handled: false, error: 'Invalid link source' };
    }

    const { hostname, path, queryParams } = Linking.parse(url);

    if (__DEV__) {
      // Don't log full query params in production - they contain tokens
      console.log('🔗 Deep link received:', { hostname, path, hasParams: !!queryParams });
    }

    // Handle Supabase auth callback format: /auth/callback?token_hash=xxx&type=signup|recovery|magiclink
    if (path === 'auth/callback' || path?.includes('auth/callback')) {
      const tokenHash = queryParams?.token_hash as string;
      const type = queryParams?.type as string;

      // SECURITY: Rate limit verification attempts
      const rateLimitCheck = checkRateLimit('emailVerification');
      if (!rateLimitCheck.allowed) {
        const retryTime = formatRetryTime(rateLimitCheck.retryAfterMs!);
        const error = `Too many verification attempts. Please try again in ${retryTime}.`;
        notifyError(error);
        return { success: false, handled: true, error };
      }

      // SECURITY: Validate token format
      if (!tokenHash) {
        recordAttempt('emailVerification', undefined, false);
        const error = 'Invalid link: missing verification token';
        notifyError(error);
        return { success: false, handled: true, error };
      }

      if (!isValidTokenHash(tokenHash)) {
        recordAttempt('emailVerification', undefined, false);
        const error = 'Invalid link: malformed verification token';
        notifyError(error);
        if (__DEV__) {
          console.warn('🔗 Invalid token hash format received');
        }
        return { success: false, handled: true, error };
      }

      // SECURITY: Normalize and validate type
      const normalizedType = normalizeOtpType(type);

      try {
        // Use Supabase's verifyOtp for email verification
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: normalizedType,
        });

        if (error) {
          // Record failed attempt for rate limiting
          recordAttempt('emailVerification', undefined, false);

          // SECURITY: Sanitize error message before showing to user
          logError('Auth callback', error);
          const userMessage = sanitizeErrorMessage(error);
          notifyError(userMessage);
          navigation.navigate('Login', { error: userMessage });
          return { success: false, handled: true, error: userMessage };
        }

        // Record successful attempt (resets rate limit)
        recordAttempt('emailVerification', undefined, true);

        // Handle based on type
        if (normalizedType === 'signup') {
          notifySuccess('Email verified successfully!');
          navigation.navigate('Login', {
            message: 'Email verified! Please log in to continue.',
          });
        } else if (normalizedType === 'recovery') {
          // For password reset, navigate to reset password screen
          // The user is now authenticated, they can set a new password
          navigation.navigate('ResetPassword', {
            authenticated: true,
          });
        } else if (normalizedType === 'magiclink') {
          // Magic link login - user is now authenticated
          notifySuccess('Logged in successfully!');
          // Navigate to main app - the auth state listener should handle this
        }

        return { success: true, handled: true };
      } catch (error: any) {
        // Record failed attempt for rate limiting
        recordAttempt('emailVerification', undefined, false);

        // SECURITY: Sanitize error message before showing to user
        logError('Auth callback exception', error);
        const userMessage = sanitizeErrorMessage(error);
        notifyError(userMessage);
        navigation.navigate('Login', { error: userMessage });
        return { success: false, handled: true, error: userMessage };
      }
    }

    // Legacy format: Email verification: /verify-email?token=xxx
    if (path === 'verify-email' && queryParams?.token) {
      const token = queryParams.token as string;

      // SECURITY: Rate limit verification attempts
      const rateLimitCheck = checkRateLimit('emailVerification');
      if (!rateLimitCheck.allowed) {
        const retryTime = formatRetryTime(rateLimitCheck.retryAfterMs!);
        const error = `Too many verification attempts. Please try again in ${retryTime}.`;
        notifyError(error);
        return { success: false, handled: true, error };
      }

      // SECURITY: Validate token format
      if (!isValidTokenHash(token)) {
        recordAttempt('emailVerification', undefined, false);
        const error = 'Invalid verification link format';
        notifyError(error);
        return { success: false, handled: true, error };
      }

      try {
        const result = await verifyEmail(token);

        if (result && result.success) {
          recordAttempt('emailVerification', undefined, true);
          notifySuccess('Email verified successfully!');
          navigation.navigate('Login', {
            message: 'Email verified! Please log in to continue.',
          });
          return { success: true, handled: true };
        } else {
          recordAttempt('emailVerification', undefined, false);
          const error = 'Verification link is invalid or has expired.';
          notifyError(error);
          navigation.navigate('Login', { error });
          return { success: false, handled: true, error };
        }
      } catch (error: any) {
        recordAttempt('emailVerification', undefined, false);
        // SECURITY: Sanitize error message before showing to user
        logError('Email verification', error);
        const userMessage = sanitizeErrorMessage(error);
        notifyError(userMessage);
        navigation.navigate('Login', { error: userMessage });
        return { success: false, handled: true, error: userMessage };
      }
    }

    // Legacy format: Password reset: /reset-password?token=xxx
    if (path === 'reset-password' && queryParams?.token) {
      const token = queryParams.token as string;

      // SECURITY: Validate token format
      if (!isValidTokenHash(token)) {
        const error = 'Invalid password reset link format';
        notifyError(error);
        navigation.navigate('Login', { error });
        return { success: false, handled: true, error };
      }

      navigation.navigate('ResetPassword', {
        token: token,
      });
      return { success: true, handled: true };
    }

    // Unknown deep link path
    if (__DEV__) {
      console.log('🔗 Unhandled deep link path:', path);
    }
    return { success: true, handled: false };

  } catch (error: any) {
    // SECURITY: Sanitize error message before showing to user
    logError('Deep link handling', error);
    const userMessage = sanitizeErrorMessage(error);
    notifyError(userMessage);
    return { success: false, handled: false, error: userMessage };
  }
}

/**
 * Setup deep linking listener
 * Properly handles async deep link processing with error handling
 */
export function setupDeepLinking(navigation: any): () => void {
  // Handle initial URL (app launched from link)
  Linking.getInitialURL()
    .then(async (url) => {
      if (url) {
        if (__DEV__) {
          console.log('🔗 Initial deep link URL received');
        }
        try {
          const result = await handleDeepLink(url, navigation);
          if (__DEV__) {
            console.log('🔗 Initial deep link result:', result.success ? 'success' : 'failed');
          }
        } catch (error) {
          console.error('Error handling initial deep link:', error);
          notifyError('Failed to process the link. Please try again.');
        }
      }
    })
    .catch((error) => {
      console.error('Error getting initial URL:', error);
    });

  // Handle subsequent URLs (app already open)
  const subscription = Linking.addEventListener('url', async ({ url }) => {
    if (__DEV__) {
      console.log('🔗 Deep link URL received');
    }
    try {
      const result = await handleDeepLink(url, navigation);
      if (__DEV__) {
        console.log('🔗 Deep link result:', result.success ? 'success' : 'failed');
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
      notifyError('Failed to process the link. Please try again.');
    }
  });

  // Return cleanup function
  return () => {
    subscription.remove();
  };
}
