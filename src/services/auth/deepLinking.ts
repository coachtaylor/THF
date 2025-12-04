import * as Linking from 'expo-linking';
import { verifyEmail } from './auth';

const prefix = Linking.createURL('/');

/**
 * Handle deep link URL
 */
export async function handleDeepLink(
  url: string,
  navigation: any
): Promise<void> {
  try {
    const { hostname, path, queryParams } = Linking.parse(url);

    console.log('🔗 Deep link received:', { hostname, path, queryParams });

    // Email verification: /verify-email?token=xxx
    if (path === 'verify-email' && queryParams?.token) {
      try {
        const result = await verifyEmail(queryParams.token as string);

        if (result && result.success) {
          // Navigate to Login with success message
          navigation.navigate('Login', {
            message: 'Email verified! Please log in to continue.',
          });
        } else {
          // Navigate to Login with error message
          navigation.navigate('Login', {
            error: 'Verification link is invalid or has expired.',
          });
        }
      } catch (error: any) {
        console.error('Email verification error:', error);
        navigation.navigate('Login', {
          error: error.message || 'Verification link is invalid or has expired.',
        });
      }
    }

    // Password reset: /reset-password?token=xxx
    if (path === 'reset-password' && queryParams?.token) {
      navigation.navigate('ResetPassword', {
        token: queryParams.token,
      });
    }
  } catch (error) {
    console.error('❌ Deep link handling error:', error);
  }
}

/**
 * Setup deep linking listener
 */
export function setupDeepLinking(navigation: any): () => void {
  // Handle initial URL (app launched from link)
  Linking.getInitialURL()
    .then((url) => {
      if (url) {
        console.log('🔗 Initial deep link URL:', url);
        handleDeepLink(url, navigation);
      }
    })
    .catch((error) => {
      console.error('Error getting initial URL:', error);
    });

  // Handle subsequent URLs (app already open)
  const subscription = Linking.addEventListener('url', ({ url }) => {
    console.log('🔗 Deep link URL received:', url);
    handleDeepLink(url, navigation);
  });

  // Return cleanup function
  return () => {
    subscription.remove();
  };
}

