import * as Linking from 'expo-linking';
import { supabase } from '../../utils/supabase';
import { verifyEmail } from './auth';
import { notifyError, notifySuccess } from '../../utils/toast';

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
 * Handle deep link URL
 * Supports both legacy format and Supabase auth callback format
 */
export async function handleDeepLink(
  url: string,
  navigation: any
): Promise<DeepLinkResult> {
  try {
    const { hostname, path, queryParams } = Linking.parse(url);

    if (__DEV__) {
      console.log('🔗 Deep link received:', { hostname, path, queryParams });
    }

    // Handle Supabase auth callback format: /auth/callback?token_hash=xxx&type=signup|recovery|magiclink
    if (path === 'auth/callback' || path?.includes('auth/callback')) {
      const tokenHash = queryParams?.token_hash as string;
      const type = queryParams?.type as string;

      if (!tokenHash) {
        const error = 'Invalid link: missing verification token';
        notifyError(error);
        return { success: false, handled: true, error };
      }

      try {
        // Use Supabase's verifyOtp for email verification
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type === 'signup' ? 'signup' : type === 'recovery' ? 'recovery' : 'magiclink',
        });

        if (error) {
          console.error('Auth callback error:', error);
          const errorMessage = error.message || 'This link is invalid or has expired.';
          notifyError(errorMessage);
          navigation.navigate('Login', { error: errorMessage });
          return { success: false, handled: true, error: errorMessage };
        }

        // Handle based on type
        if (type === 'signup') {
          notifySuccess('Email verified successfully!');
          navigation.navigate('Login', {
            message: 'Email verified! Please log in to continue.',
          });
        } else if (type === 'recovery') {
          // For password reset, navigate to reset password screen
          // The user is now authenticated, they can set a new password
          navigation.navigate('ResetPassword', {
            authenticated: true,
          });
        } else if (type === 'magiclink') {
          // Magic link login - user is now authenticated
          notifySuccess('Logged in successfully!');
          // Navigate to main app - the auth state listener should handle this
        }

        return { success: true, handled: true };
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to verify link';
        console.error('Auth callback exception:', error);
        notifyError(errorMessage);
        navigation.navigate('Login', { error: errorMessage });
        return { success: false, handled: true, error: errorMessage };
      }
    }

    // Legacy format: Email verification: /verify-email?token=xxx
    if (path === 'verify-email' && queryParams?.token) {
      try {
        const result = await verifyEmail(queryParams.token as string);

        if (result && result.success) {
          notifySuccess('Email verified successfully!');
          navigation.navigate('Login', {
            message: 'Email verified! Please log in to continue.',
          });
          return { success: true, handled: true };
        } else {
          const error = 'Verification link is invalid or has expired.';
          notifyError(error);
          navigation.navigate('Login', { error });
          return { success: false, handled: true, error };
        }
      } catch (error: any) {
        const errorMessage = error.message || 'Verification link is invalid or has expired.';
        console.error('Email verification error:', error);
        notifyError(errorMessage);
        navigation.navigate('Login', { error: errorMessage });
        return { success: false, handled: true, error: errorMessage };
      }
    }

    // Legacy format: Password reset: /reset-password?token=xxx
    if (path === 'reset-password' && queryParams?.token) {
      navigation.navigate('ResetPassword', {
        token: queryParams.token,
      });
      return { success: true, handled: true };
    }

    // Unknown deep link path
    if (__DEV__) {
      console.log('🔗 Unhandled deep link path:', path);
    }
    return { success: true, handled: false };

  } catch (error: any) {
    const errorMessage = error.message || 'Failed to process link';
    console.error('❌ Deep link handling error:', error);
    notifyError('Failed to open link. Please try again.');
    return { success: false, handled: false, error: errorMessage };
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
          console.log('🔗 Initial deep link URL:', url);
        }
        try {
          const result = await handleDeepLink(url, navigation);
          if (__DEV__) {
            console.log('🔗 Initial deep link result:', result);
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
      console.log('🔗 Deep link URL received:', url);
    }
    try {
      const result = await handleDeepLink(url, navigation);
      if (__DEV__) {
        console.log('🔗 Deep link result:', result);
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

