// src/services/exerciseService.ts
// FIXED: Properly uses supabaseMapper to parse equipment

import { supabase } from '../utils/supabase';
import { mapSupabaseExercises } from '../utils/supabaseMapper';
import { Exercise } from '../types';

/**
 * Fetch all exercises from Supabase with proper parsing
 */
export async function fetchAllExercises(): Promise<Exercise[]> {
  try {
    console.log('🔄 Fetching exercises from Supabase...');

    const { data, error } = await supabase
      .from('exercises')
      .select('*');

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ No exercises found in database');
      return [];
    }

    console.log(`✅ Fetched ${data.length} raw exercises from Supabase`);
    
    // Log first exercise to see raw format
    console.log('📋 Sample raw exercise from DB:', {
      name: data[0]?.name,
      equipment: data[0]?.equipment,
      equipment_type: typeof data[0]?.equipment,
      raw_equipment: data[0]?.raw_equipment,
    });

    // Map using supabaseMapper (this parses the JSON strings)
    const exercises = mapSupabaseExercises(data);
    
    console.log(`✅ Mapped to ${exercises.length} exercises`);
    
    // Log first mapped exercise
    if (exercises.length > 0) {
      console.log('📋 Sample mapped exercise:', {
        name: exercises[0].name,
        equipment: exercises[0].equipment,
        equipment_length: exercises[0].equipment.length,
      });
    }

    return exercises;
  } catch (error) {
    console.error('❌ Error in fetchAllExercises:', error);
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

    if (error) throw error;

    return mapSupabaseExercises(data || []);
  } catch (error) {
    console.error('❌ Error fetching exercises by IDs:', error);
    return [];
  }
}

/**
 * Get exercise count
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
 * Cached exercise loading
 */
let cachedExercises: Exercise[] | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCachedExercises(): Promise<Exercise[]> {
  const now = Date.now();
  
  if (cachedExercises && now - cacheTime < CACHE_DURATION) {
    console.log('📦 Using cached exercises:', cachedExercises.length);
    return cachedExercises;
  }
  
  console.log('🔄 Fetching fresh exercises (cache expired or empty)');
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