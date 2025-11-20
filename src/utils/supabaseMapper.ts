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
  // NEW: Body region and muscle targeting fields
  target_muscles: string | null;
  secondary_muscles: string | null;
  raw_equipment: string | null;
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
 * Infer body region tags from pattern and muscle groups
 * Maps database fields to user-facing body focus selections
 */
function inferBodyRegionTags(
  pattern: string,
  targetMuscles: string | null,
  secondaryMuscles: string | null
): string[] {
  const tags: string[] = [];

  // Pattern-based inference
  const patternLower = pattern.toLowerCase();

  // Lower body patterns
  if (['squat', 'lunge', 'hinge', 'gait'].includes(patternLower)) {
    tags.push('lower_body', 'legs');
  }

  // Upper body patterns
  if (patternLower === 'push') {
    tags.push('upper_body', 'upper_push');
  }
  if (patternLower === 'pull') {
    tags.push('upper_body', 'upper_pull');
  }

  // Core
  if (patternLower === 'core') {
    tags.push('core', 'abdomen');
  }

  // Cardio/conditioning
  if (patternLower === 'conditioning') {
    tags.push('cardio', 'full_body');
  }

  // Carry
  if (patternLower === 'carry') {
    tags.push('core', 'full_body');
  }

  // Muscle-based inference
  const muscles = `${targetMuscles || ''} ${secondaryMuscles || ''}`.toLowerCase();

  // Specific body parts from target_muscles
  if (muscles.includes('quad') || muscles.includes('hamstring')) {
    tags.push('legs');
  }
  if (muscles.includes('glute')) {
    tags.push('glutes');
  }
  if (muscles.includes('pectoral') || muscles.includes('chest')) {
    tags.push('chest');
  }
  if (muscles.includes('delt') || muscles.includes('shoulder')) {
    tags.push('shoulders');
  }
  if (muscles.includes('bicep') || muscles.includes('tricep') || muscles.includes('forearm')) {
    tags.push('arms');
  }
  if (muscles.includes('lat') || muscles.includes('trap') || muscles.includes('upper back') || muscles.includes('spine')) {
    tags.push('back');
  }
  if (muscles.includes('abs') || muscles.includes('oblique') || muscles.includes('core')) {
    tags.push('core', 'abdomen');
  }
  if (muscles.includes('hip') || muscles.includes('pelvis') || muscles.includes('adduct') || muscles.includes('abduct')) {
    tags.push('hips');
  }
  if (muscles.includes('calves') || muscles.includes('calf')) {
    tags.push('legs', 'lower_legs');
  }

  // Deduplicate tags
  return [...new Set(tags)];
}

/**
 * Main mapper: Convert Supabase row to Exercise type
 */
export function mapSupabaseExercise(raw: SupabaseExerciseRow): Exercise {
  const equipmentArray = safeJsonParse<string[]>(raw.equipment, []);
  const cuesArray = safeJsonParse<string[]>(raw.cues, []);
  const swapsArray = safeJsonParse<string[]>(raw.swaps, []);

  // Generate body region tags from pattern + muscles
  const bodyRegionTags = inferBodyRegionTags(
    raw.pattern,
    raw.target_muscles,
    raw.secondary_muscles
  );

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
      // Core attributes
      raw.difficulty,
      raw.pattern,
      raw.goal,
      // Equipment
      ...equipmentArray,
      // Body regions (NEW!)
      ...bodyRegionTags,
      // Muscle groups (NEW!)
      raw.target_muscles,
      raw.secondary_muscles,
    ].filter(Boolean) as string[],
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