/**
 * Supabase Client Configuration
 *
 * SECURITY NOTES:
 *
 * 1. Certificate Pinning (v1.0 KNOWN LIMITATION):
 *    - NOT implemented in v1.0 release
 *    - Risk: Man-in-the-middle attacks possible on untrusted networks (public WiFi)
 *    - Mitigation: All data encrypted in transit via TLS 1.2+
 *
 *    v1.1 Implementation Plan:
 *    - Add 'react-native-ssl-pinning' package
 *    - Requires custom Expo dev client (expo prebuild)
 *    - Pin the Supabase domain certificate (*.supabase.co) for iOS and Android
 *    - See: https://docs.expo.dev/develop/development-builds/create-a-build/
 *
 * 2. Current Security Measures (v1.0):
 *    - All connections use HTTPS (TLS 1.2+)
 *    - Auth tokens stored in SecureStore (iOS Keychain / Android Keystore)
 *    - Session auto-refresh enabled
 *    - URL detection disabled for React Native security
 *    - Sensitive health data encrypted at rest
 *
 * 3. Required Actions for Production:
 *    - Ensure Supabase RLS policies are properly configured
 *    - Rotate the anon key if ever exposed
 *    - Enable multi-factor authentication in Supabase dashboard
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';

// Read from environment variables
// Prefer EXPO_PUBLIC_ prefix for Expo compatibility
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  Constants.expoConfig?.extra?.supabaseUrl ||
  '';

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  '';

// SecureStore adapter for Supabase Auth session storage
const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    await SecureStore.deleteItemAsync(key);
  },
};

let supabaseInstance: SupabaseClient | null = null;

// SECURITY: Validate that required environment variables are configured
// These must be set via .env file (dev) or EAS Secrets (production)
const isMissingConfig = !supabaseUrl || !supabaseAnonKey;

if (__DEV__) {
  // Diagnostic logging (development only - never log keys in production)
  console.log('🔧 Supabase Configuration Check:');
  console.log(`   SUPABASE_URL: ${supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ NOT SET'}`);
  console.log(`   SUPABASE_ANON_KEY: ${supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : '❌ NOT SET'}`);
}

if (isMissingConfig) {
  // SECURITY: In production, missing config is a critical error
  // The app should not silently fail - this indicates a deployment issue
  const errorMsg = 'SECURITY ERROR: Supabase credentials not configured. ' +
    'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY via environment variables.';

  if (__DEV__) {
    console.warn('⚠️ ' + errorMsg);
    console.warn('   To fix: Create a .env file with your Supabase credentials');
  } else {
    // In production, log the error but don't expose details to users
    console.error('🔒 ' + errorMsg);
  }
} else if (supabaseUrl.startsWith('http')) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: SecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Important for React Native
      },
    });
    if (__DEV__) console.log('✅ Supabase client initialized with secure storage');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
  }
}

export const supabase = supabaseInstance!;
