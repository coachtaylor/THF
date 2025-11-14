import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const env = typeof process !== 'undefined' ? process.env : undefined;
const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl ||
  env?.SUPABASE_URL ||
  '';
const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  env?.SUPABASE_ANON_KEY ||
  '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
