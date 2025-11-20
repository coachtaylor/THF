// src/utils/supabaseMapper.ts
// Maps raw Supabase data to TypeScript types, handling JSON parsing

import { Exercise, ExerciseCategory, Equipment } from '../types';

interface SupabaseExerciseRow {
  id: number;
  slug: string;
  name: string;
  pattern: string;
  goal: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string; // JSON string: "[\"bodyweight\"]"
  binder_aware: boolean;
  pelvic_floor_safe: boolean;
  contraindications: string; // JSON string
  cue_primary: string;
  cues: string; // JSON string
  breathing: string;
  coaching_points: string; // JSON string
  common_errors: string; // JSON string
  progressions: string; // JSON string
  regressions: string; // JSON string
  swaps: string; // JSON string
  rep_5min: string;
  rep_15min: string;
  rep_30min: string;
  rep_45min: string;
  version: string;
  last_reviewed_at: string;
  reviewer: string;
  created_at: string;
  updated_at: string;
  difficulty_source: string;
  binder_aware_source: string;
  pelvic_floor_source: string;
  flags_reviewed: boolean;
}

/**
 * Safely parse JSON string, return default value if parsing fails
 */
function safeJsonParse<T>(jsonString: string | null | undefined, defaultValue: T): T {
  if (!jsonString || jsonString === 'null' || jsonString === '') {
    return defaultValue;
  }
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON:', jsonString, error);
    return defaultValue;
  }
}

/**
 * Map Supabase pattern to ExerciseCategory
 */
function mapPatternToCategory(pattern: string): ExerciseCategory {
  const mapping: Record<string, ExerciseCategory> = {
    'mobility': 'lower_body', // Default mobility exercises to lower_body
    'strength': 'full_body',
    'cardio': 'cardio',
    'core': 'core',
    'upper': 'upper_push',
    'lower': 'lower_body',
  };
  
  const normalized = pattern.toLowerCase();
  for (const [key, value] of Object.entries(mapping)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  return 'full_body'; // Default fallback
}

/**
 * Infer pressure level from difficulty and exercise properties
 */
function inferPressureLevel(
  difficulty: string,
  binderAware: boolean
): 'low' | 'medium' | 'high' {
  if (!binderAware) {
    return 'high'; // Not safe for binders = high pressure
  }
  
  if (difficulty === 'beginner') {
    return 'low';
  } else if (difficulty === 'intermediate') {
    return 'medium';
  }
  
  return 'high';
}

/**
 * Main mapper: Convert Supabase row to Exercise type
 */
export function mapSupabaseExercise(raw: SupabaseExerciseRow): Exercise {
  const equipmentArray = safeJsonParse<string[]>(raw.equipment, []);
  const cuesArray = safeJsonParse<string[]>(raw.cues, []);
  const swapsArray = safeJsonParse<string[]>(raw.swaps, []);
  
  return {
    id: raw.id.toString(),
    name: raw.name,
    category: mapPatternToCategory(raw.pattern),
    equipment: equipmentArray as Equipment[], // Cast after parsing
    difficulty: raw.difficulty,
    binder_aware: raw.binder_aware,
    heavy_binding_safe: raw.binder_aware, // Assuming same for MVP
    pelvic_floor_aware: raw.pelvic_floor_safe,
    pressure_level: inferPressureLevel(raw.difficulty, raw.binder_aware),
    neutral_cues: [raw.cue_primary, ...cuesArray].filter(Boolean),
    breathing_cues: raw.breathing ? [raw.breathing] : [],
    trans_notes: {
      binder: raw.binder_aware 
        ? 'Safe for binder use - minimal chest compression' 
        : undefined,
      pelvic_floor: raw.pelvic_floor_safe
        ? 'Pelvic floor aware - gentle engagement cues'
        : undefined,
    },
    swaps: swapsArray.map(exerciseId => ({
      exerciseId: exerciseId,
      rationale: 'Alternative option',
    })),
    videoUrl: '', // Not in CSV, add later
    tags: [
      raw.difficulty,
      raw.pattern,
      raw.goal,
      ...equipmentArray,
    ].filter(Boolean),
  };
}

/**
 * Batch mapper for array of Supabase rows
 */
export function mapSupabaseExercises(rows: SupabaseExerciseRow[]): Exercise[] {
  return rows.map(mapSupabaseExercise).filter(ex => ex !== null) as Exercise[];
}

/**
 * Type guard to check if equipment is valid
 */
export function isValidEquipment(equipment: string): equipment is Equipment {
  const validEquipment: Equipment[] = ['bodyweight', 'dumbbells', 'bands', 'kettlebell'];
  return validEquipment.includes(equipment as Equipment);
}

/**
 * Filter and validate equipment array
 */
export function validateEquipment(equipment: string[]): Equipment[] {
  return equipment.filter(isValidEquipment);
}