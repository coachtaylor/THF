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
    slug: row.slug,
    pattern: row.pattern,
    goal: row.goal,
    difficulty: row.difficulty as Exercise['difficulty'],
    equipment: Array.isArray(row.equipment) ? row.equipment : [],
    binder_aware: row.binder_aware,
    pelvic_floor_safe: row.pelvic_floor_safe,
    heavy_binding_safe: row.heavy_binding_safe,
    contraindications: row.contraindications || [],
    target_muscles: row.target_muscles,
    secondary_muscles: row.secondary_muscles,
    gender_goal_emphasis: row.gender_goal_emphasis as Exercise['gender_goal_emphasis'],
    cue_primary: row.cue_primary,
    breathing: row.breathing,
    rep_range_beginner: row.rep_range_beginner,
    rep_range_intermediate: row.rep_range_intermediate,
    rep_range_advanced: row.rep_range_advanced,
    effectiveness_rating: row.effectiveness_rating,
    source: row.source,
    notes: row.notes,
    dysphoria_tags: row.dysphoria_tags,
    post_op_safe_weeks: row.post_op_safe_weeks,
    created_at: new Date(row.created_at),
    version: row.version,
    flags_reviewed: row.flags_reviewed,
    reviewer: row.reviewer,
  };
}

// Helper: Get exercises by pattern
export async function getExercisesByPattern(pattern: string): Promise<Exercise[]> {
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
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .in('gender_goal_emphasis', emphasis);
  
  if (error) throw error;
  return data.map(mapDatabaseToExercise);
}