// TransFitness - Personal Records Type Definitions

/**
 * Types of personal records tracked
 */
export type PRType = "max_weight" | "max_reps" | "volume" | "estimated_1rm";

/**
 * Personal record entry
 */
export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  exercise_name?: string; // Populated when joining with exercise data
  pr_type: PRType;
  value: number; // The PR value (weight, reps, volume, or 1RM estimate)
  weight: number | null; // Weight used (for context)
  reps: number | null; // Reps performed (for context)
  achieved_at: Date;
  workout_log_id: string | null;
  set_log_id: string | null;
  previous_value: number | null; // Previous PR value for showing improvement
  improvement_percent: number | null; // Percentage improvement over previous
}

/**
 * Result from PR detection after completing a set
 */
export interface PRDetectionResult {
  is_pr: boolean;
  pr_types: PRType[]; // Can be multiple (e.g., both max_weight AND volume)
  records: PersonalRecord[];
  exercise_name?: string; // For display in celebration UI
}

/**
 * Existing PRs for an exercise (used for comparison)
 */
export interface ExercisePRs {
  max_weight: PersonalRecord | null;
  max_reps: PersonalRecord | null;
  volume: PersonalRecord | null;
  estimated_1rm: PersonalRecord | null;
}

/**
 * PR with exercise details for display
 */
export interface PRWithExercise extends PersonalRecord {
  exercise_name: string;
}

/**
 * Grouped PRs by exercise for history display
 */
export interface ExercisePRGroup {
  exercise_id: string;
  exercise_name: string;
  prs: PersonalRecord[];
}
