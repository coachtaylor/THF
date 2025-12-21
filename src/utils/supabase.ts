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

// Diagnostic logging (development only)
if (__DEV__) {
  console.log('🔧 Supabase Configuration Check:');
  console.log(`   SUPABASE_URL: ${supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET'}`);
  console.log(`   SUPABASE_ANON_KEY: ${supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET'}`);
}

if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
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
} else if (__DEV__) {
  console.warn('⚠️ Supabase not configured - auth will be disabled');
  console.warn('   To fix: Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
}

export const supabase = supabaseInstance!;
