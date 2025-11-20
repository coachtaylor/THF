// src/services/exerciseService.ts
// Service for fetching exercises from Supabase

import { supabase } from '../utils/supabase';
import { mapSupabaseExercises } from '../utils/supabaseMapper';
import { Exercise, Equipment } from '../types';

/**
 * Fetch all exercises from Supabase
 */
export async function fetchAllExercises(): Promise<Exercise[]> {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*');

    if (error) {
      console.error('❌ Failed to fetch exercises:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ No exercises found in database');
      return [];
    }

    const exercises = mapSupabaseExercises(data);
    console.log(`✅ Fetched ${exercises.length} exercises from Supabase`);
    
    return exercises;
  } catch (error) {
    console.error('❌ Error fetching exercises:', error);
    return [];
  }
}

/**
 * Fetch exercises by specific IDs
 */
export async function fetchExercisesByIds(ids: string[]): Promise<Exercise[]> {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .in('id', ids);

    if (error) {
      console.error('❌ Failed to fetch exercises by IDs:', error);
      throw error;
    }

    return mapSupabaseExercises(data || []);
  } catch (error) {
    console.error('❌ Error fetching exercises by IDs:', error);
    return [];
  }
}

/**
 * Fetch exercises by equipment type
 */
export async function fetchExercisesByEquipment(equipment: Equipment[]): Promise<Exercise[]> {
  try {
    // Fetch all exercises first, then filter
    // (Supabase doesn't easily query JSON arrays)
    const allExercises = await fetchAllExercises();
    
    return allExercises.filter(ex =>
      ex.equipment.some(eq => equipment.includes(eq))
    );
  } catch (error) {
    console.error('❌ Error fetching exercises by equipment:', error);
    return [];
  }
}

/**
 * Fetch exercises by difficulty
 */
export async function fetchExercisesByDifficulty(
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): Promise<Exercise[]> {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('difficulty', difficulty);

    if (error) {
      console.error('❌ Failed to fetch exercises by difficulty:', error);
      throw error;
    }

    return mapSupabaseExercises(data || []);
  } catch (error) {
    console.error('❌ Error fetching exercises by difficulty:', error);
    return [];
  }
}

/**
 * Fetch binder-aware exercises only
 */
export async function fetchBinderAwareExercises(): Promise<Exercise[]> {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('binder_aware', true);

    if (error) {
      console.error('❌ Failed to fetch binder-aware exercises:', error);
      throw error;
    }

    return mapSupabaseExercises(data || []);
  } catch (error) {
    console.error('❌ Error fetching binder-aware exercises:', error);
    return [];
  }
}

/**
 * Get count of total exercises in database
 */
export async function getExerciseCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Failed to get exercise count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('❌ Error getting exercise count:', error);
    return 0;
  }
}

/**
 * Check if database has exercises
 */
export async function hasExercises(): Promise<boolean> {
  const count = await getExerciseCount();
  return count > 0;
}

/**
 * Refresh/cache exercises (call on app start)
 */
let cachedExercises: Exercise[] | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCachedExercises(): Promise<Exercise[]> {
  const now = Date.now();
  
  if (cachedExercises && now - cacheTime < CACHE_DURATION) {
    console.log('📦 Using cached exercises');
    return cachedExercises;
  }
  
  console.log('🔄 Fetching fresh exercises');
  cachedExercises = await fetchAllExercises();
  cacheTime = now;
  
  return cachedExercises;
}

/**
 * Clear exercise cache
 */
export function clearExerciseCache(): void {
  cachedExercises = null;
  cacheTime = 0;
  console.log('🗑️ Exercise cache cleared');
}