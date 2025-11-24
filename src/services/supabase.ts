import { supabase } from '../utils/supabase';

/**
 * Get Supabase client instance
 * Helper function for services that need Supabase access
 */
export function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }
  return supabase;
}

