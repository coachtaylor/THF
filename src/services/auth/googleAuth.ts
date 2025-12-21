import {
  GoogleSignin,
  statusCodes,
  isSuccessResponse,
  isErrorWithCode,
} from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { supabase } from '../../utils/supabase';

export interface GoogleAuthResult {
  success: boolean;
  user?: any;
  error?: string;
  isNewUser?: boolean;
}

let isConfigured = false;

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

  GoogleSignin.configure({
    webClientId,
    iosClientId,
    offlineAccess: true,
    scopes: ['profile', 'email'],
  });

  isConfigured = true;
  console.log('Google Sign-In configured');
}

/**
 * Sign in with Google using native SDK and Supabase signInWithIdToken
 */
export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  try {
    console.log('Starting native Google Sign-In...');

    configureGoogleSignIn();

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      return { success: false, error: 'Sign-in was cancelled' };
    }

    const { idToken } = response.data;

    if (!idToken) {
      console.error('No ID token received from Google');
      return { success: false, error: 'No ID token received from Google' };
    }

    console.log('Got Google ID token, authenticating with Supabase...');

    // Note: We don't pass a nonce because the native Google Sign-In SDK
    // doesn't include a nonce in the ID token by default.
    // Supabase will accept tokens without nonce when no nonce is passed.
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      console.error('Supabase auth error:', error.message);
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Authentication failed - no user returned' };
    }

    console.log('Google Sign-In successful');

    const isNewUser = !data.user?.user_metadata?.onboarding_completed;

    return {
      success: true,
      user: data.user,
      isNewUser,
    };
  } catch (error: any) {
    console.error('Google Sign-In error:', error);

    if (isErrorWithCode(error)) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          return { success: false, error: 'Sign-in was cancelled' };
        case statusCodes.IN_PROGRESS:
          return { success: false, error: 'Sign-in is already in progress' };
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          return { success: false, error: 'Google Play Services not available' };
        default:
          return { success: false, error: error.message || 'Google Sign-In failed' };
      }
    }

    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

/**
 * Sign out from Google
 */
export async function signOutFromGoogle(): Promise<void> {
  try {
    await GoogleSignin.signOut();
    console.log('Signed out from Google');
  } catch (error) {
    console.warn('Google sign-out error:', error);
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
