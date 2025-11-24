import { supabase } from '../utils/supabase';
import { Exercise } from '../types/plan';

interface DatabaseExercise {
  id: number;
  slug: string;
  name: string;
  pattern: string;
  goal: string;
  difficulty: string;
  equipment: string[];
  
  binder_aware: boolean;
  pelvic_floor_safe: boolean;
  heavy_binding_safe: boolean;
  contraindications: string[];
  
  target_muscles?: string;
  secondary_muscles?: string;
  gender_goal_emphasis?: string;
  
  cue_primary?: string;
  breathing?: string;
  rep_range_beginner?: string;
  rep_range_intermediate?: string;
  rep_range_advanced?: string;
  
  effectiveness_rating?: number;
  source?: string;
  notes?: string;
  dysphoria_tags?: string;
  post_op_safe_weeks?: number;
  
  created_at: string;
  version: string;
  flags_reviewed: boolean;
  reviewer?: string;
}

export async function loadExercises(): Promise<Exercise[]> {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }
  const { data, error } = await supabase
    .from('exercises')
    .select('*');

  if (error) {
    console.error('Error loading exercises:', error);
    throw error;
  }

  return data.map(mapDatabaseToExercise);
}

function mapDatabaseToExercise(row: DatabaseExercise): Exercise {
  return {
    id: row.id.toString(),
    name: row.name,
    slug: row.slug || row.id.toString(),
    pattern: row.pattern || '',
    goal: row.goal || '',
    difficulty: row.difficulty as Exercise['difficulty'],
    equipment: Array.isArray(row.equipment) ? row.equipment : [],
    tags: [], // Will be populated from pattern and goal
    binder_aware: row.binder_aware,
    pelvic_floor_safe: row.pelvic_floor_safe,
    heavy_binding_safe: row.heavy_binding_safe,
    pelvic_floor_aware: row.pelvic_floor_safe, // Alias for backward compatibility
    contraindications: row.contraindications || [],
    pressure_level: 'medium', // Default pressure level
    target_muscles: row.target_muscles || undefined,
    secondary_muscles: row.secondary_muscles || undefined,
    gender_goal_emphasis: row.gender_goal_emphasis as Exercise['gender_goal_emphasis'],
    cue_primary: row.cue_primary,
    breathing: row.breathing,
    neutral_cues: [],
    breathing_cues: [],
    rep_range_beginner: row.rep_range_beginner,
    rep_range_intermediate: row.rep_range_intermediate,
    rep_range_advanced: row.rep_range_advanced,
    effectiveness_rating: row.effectiveness_rating,
    source: row.source,
    notes: row.notes,
    dysphoria_tags: row.dysphoria_tags,
    post_op_safe_weeks: row.post_op_safe_weeks,
    created_at: new Date(row.created_at || Date.now()),
    version: row.version || '1.0',
    flags_reviewed: row.flags_reviewed || false,
    reviewer: row.reviewer,
    swaps: [],
    trans_notes: {
      binder: row.binder_aware ? 'Safe for binding' : 'Use caution with binding',
      pelvic_floor: row.pelvic_floor_safe ? 'Pelvic floor safe' : 'Use caution with pelvic floor',
    },
    commonErrors: [],
  };
}

// Helper: Get exercises by pattern
export async function getExercisesByPattern(pattern: string): Promise<Exercise[]> {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('pattern', pattern);
  
  if (error) throw error;
  return data.map(mapDatabaseToExercise);
}

// Helper: Get exercises by gender emphasis
export async function getExercisesByGenderEmphasis(
  emphasis: string[]
): Promise<Exercise[]> {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .in('gender_goal_emphasis', emphasis);
  
  if (error) throw error;
  return data.map(mapDatabaseToExercise);
}