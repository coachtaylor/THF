// TransFitness Plan Types
// Re-exports core types from index.ts and adds additional specialized types

// Re-export core types from index.ts for backward compatibility
export type {
  Plan,
  Day,
  Workout,
  ExerciseInstance,
  WarmupCooldownSection,
  InjectedCheckpoint,
  WorkoutMetadata,
  Exercise,
} from './index';

// Additional types specific to plan.ts

export interface Swap {
  exercise_id: string;
  rationale: string;
}

/**
 * Detailed exercise information with trans-specific tips.
 * This type combines core exercise data with filtered trans tips based on user profile.
 */
export interface ExerciseDetail {
  id: number;
  slug: string;
  name: string;
  pattern: string | null;
  goal: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
  binderAware: boolean;
  pelvicFloorSafe: boolean;
  targetMuscles?: string | null;
  secondaryMuscles?: string | null;
  mediaThumb?: string | null;
  cuePrimary: string | null;
  cues: string[];
  breathing: string | null;
  coachingPoints: string[];
  commonErrors: string[];
  progressions: string[];
  regressions: string[];
  transTips: {
    population: string | null;
    context: string | null;
    tips: string[];
  }[];
}
