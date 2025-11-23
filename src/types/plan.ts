export interface Plan {
  id: string;
  blockLength: 1 | 4; // weeks
  startDate: Date;
  goals: string[]; // e.g., ["strength", "endurance"]
  goalWeighting: { primary: number; secondary: number }; // e.g., { primary: 70, secondary: 30 }
  days: Day[];
}

export interface Day {
  dayNumber: number; // 0-6 for 1-week, 0-27 for 4-week
  date: Date;
  variants: {
    5: Workout | null;
    15: Workout | null;
    30: Workout | null;
    45: Workout | null;
  };
}

export interface Workout {
  duration: 5 | 15 | 30 | 45;
  exercises: ExerciseInstance[];
  totalMinutes: number;
}

export interface ExerciseInstance {
  exerciseId: string;
  sets: number;
  reps: number;
  format: 'EMOM' | 'AMRAP' | 'straight_sets';
  restSeconds: number;
}

export interface Exercise {
  id: string;
  name: string;
  equipment: string[]; // Canonical equipment categories (e.g., ["bodyweight"], ["dumbbells"])
  rawEquipment: string[]; // Raw equipment labels from database, normalized to UPPERCASE (e.g., ["BODY WEIGHT"], ["DUMBBELL"])
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[]; // e.g., ["lower_body", "strength"]
  binder_aware: boolean;
  heavy_binding_safe: boolean;
  pelvic_floor_aware: boolean;
  pressure_level: 'low' | 'medium' | 'high';
  neutral_cues: string[];
  breathing_cues: string[];
  swaps: Swap[];
  trans_notes: {
    binder: string;
    pelvic_floor: string;
  };
  target_muscles?: string | null; // Target muscles for the exercise
}

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
