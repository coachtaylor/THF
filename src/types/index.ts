// TransFitness - TypeScript Type Definitions

export interface Profile {
  id: string;
  goals: Goal[];
  goalWeighting: { primary: number; secondary: number };
  constraints: Constraint[];
  preferences: Preferences;
}

export type Goal = 'strength' | 'cardio' | 'flexibility' | 'custom';
export type Constraint = 'binder_aware' | 'heavy_binding' | 'post_op' | 'hrt';

export interface Preferences {
  workoutDurations: (5 | 15 | 30 | 45)[];
  blockLength: 1 | 4;
  equipment: Equipment[];
  lowSensoryMode: boolean;
}

export type Equipment = 'bodyweight' | 'dumbbells' | 'bands' | 'kettlebell';

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  equipment: Equipment[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  binder_aware: boolean;
  heavy_binding_safe: boolean;
  pelvic_floor_aware: boolean;
  pressure_level: 'low' | 'medium' | 'high';
  neutral_cues: string[];
  breathing_cues: string[];
  trans_notes: {
    binder?: string;
    pelvic_floor?: string;
  };
  swaps: Swap[];
  videoUrl: string;
  tags: string[];
}

export type ExerciseCategory = 
  | 'lower_body' 
  | 'core' 
  | 'upper_push' 
  | 'upper_pull' 
  | 'cardio' 
  | 'full_body';

export interface Swap {
  exerciseId: string;
  rationale: string;
}

export interface Plan {
  id: string;
  blockLength: 1 | 4;
  startDate: Date;
  goals: Goal[];
  goalWeighting: { primary: number; secondary: number };
  days: Day[];
}

export interface Day {
  dayNumber: number;
  date: Date;
  variants: {
    5: Workout | null;
    15: Workout;
    30: Workout;
    45: Workout;
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

export interface Session {
  id: string;
  planId: string;
  workoutDuration: 5 | 15 | 30 | 45;
  exercises: CompletedExercise[];
  startedAt: Date;
  completedAt: Date;
  durationMinutes: number;
}

export interface CompletedExercise {
  exerciseId: string;
  sets: CompletedSet[];
  swappedTo: string | null;
  painFlagged: boolean;
}

export interface CompletedSet {
  rpe: number;
  reps: number;
  completedAt: Date;
}

export interface Subscription {
  tier: 'free' | 'core' | 'plus';
  status: 'active' | 'trial' | 'canceled' | 'expired';
  trialEndsAt: Date | null;
  renewsAt: Date | null;
  purchaseType: 'monthly' | 'annual' | 'lifetime' | null;
}

export interface Streak {
  id: string;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: Date | null;
  graceDaysUsedThisWeek: number;
  weekStartDate: Date;
}
