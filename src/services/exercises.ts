// src/services/exercises.ts

import { supabase } from '../utils/supabase';

export interface Exercise {
  id: number;
  slug: string;
  name: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  binder_aware: boolean;
  heavy_binding_safe: boolean;
  pelvic_floor_safe: boolean;
  pattern: string;
  goal: string;
  equipment: string[];
}

/**
 * Get exercises by single equipment type
 * 
 * ✅ Uses RPC function (recommended approach)
 * 
 * ❌ OLD - Won't work anymore:
 * const { data } = await supabase
 *   .from('exercises')
 *   .select('*')
 *   .eq('equipment', equipment_type); // This never worked!
 */
export async function getExercisesByEquipment(
  equipment: string,
  filters?: {
    difficulty?: string;
    binderAware?: boolean;
  }
): Promise<Exercise[]> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  // ✅ NEW - Use RPC function
  const { data, error } = await supabase.rpc('get_exercises_by_equipment', {
    equipment_filter: equipment,
    difficulty_filter: filters?.difficulty || null,
    binder_aware_filter: filters?.binderAware ?? null,
  });

  if (error) {
    console.error('Error fetching exercises:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get exercises by equipment using junction table (alternative approach)
 * 
 * ✅ Alternative: Use junction table directly
 * This approach queries the exercise_equipment junction table
 */
export async function getExercisesByEquipmentJunction(
  equipment: string
): Promise<Exercise[]> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  // ✅ Alternative: Use junction table directly
  const { data, error } = await supabase
    .from('exercises')
    .select(`
      *,
      exercise_equipment!inner (equipment_type)
    `)
    .eq('exercise_equipment.equipment_type', equipment);

  if (error) {
    console.error('Error fetching exercises via junction table:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get exercises by multiple equipment types
 */
export async function getExercisesByEquipmentList(
  equipmentList: string[],
  filters?: {
    difficulty?: string;
    binderAware?: boolean;
  }
): Promise<Exercise[]> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase.rpc('get_exercises_by_equipment_list', {
    equipment_filters: equipmentList,
    difficulty_filter: filters?.difficulty || null,
    binder_aware_filter: filters?.binderAware ?? null,
  });

  if (error) {
    console.error('Error fetching exercises:', error);
    throw error;
  }

  return data || [];
}

/**
 * Example usage in your components
 */
export async function exampleUsage() {
  // Get all dumbbell exercises
  const dumbbellExercises = await getExercisesByEquipment('dumbbells');
  
  // Get beginner bodyweight exercises that are binder-aware
  const beginnerBodyweight = await getExercisesByEquipment('bodyweight', {
    difficulty: 'beginner',
    binderAware: true,
  });
  
  // Get exercises that use dumbbells OR bands
  const dumbbellsOrBands = await getExercisesByEquipmentList(['dumbbells', 'bands']);
  
  console.log('Dumbbell exercises:', dumbbellExercises.length);
  console.log('Beginner bodyweight:', beginnerBodyweight.length);
  console.log('Dumbbells or bands:', dumbbellsOrBands.length);
}