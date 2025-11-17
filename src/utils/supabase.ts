import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Read from environment variables (loaded by dotenv in app.config.js)
// Fallback to Constants.expoConfig.extra (populated from app.config.js)
const supabaseUrl =
  process.env.SUPABASE_URL ||
  Constants.expoConfig?.extra?.supabaseUrl ||
  '';
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  '';

// Only create Supabase client if we have valid credentials
// This prevents errors when Supabase isn't configured yet
let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.warn('⚠️ Failed to initialize Supabase client:', error);
  }
} else {
  console.log('ℹ️ Supabase not configured - cloud sync will be disabled');
}

export const supabase = supabaseInstance;
