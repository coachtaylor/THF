// NOTE (2026-05-12 cleanup): This file used to host the WorkoutProvider /
// useWorkout lifecycle that backed the legacy ActiveWorkoutScreen flow. That
// flow was never reachable (no navigator pointed to it, no screen wrapped
// the app in WorkoutProvider) so the entire lifecycle was dead code.
//
// What survives are the type exports — `ActiveWorkout`, `SetLog`, and
// `WorkoutPhase` — because they're still imported by code that touches
// AssembledWorkout shapes (e.g., the old workoutSession storage was deleted
// alongside this rewrite). The filename / module path is preserved to keep
// import sites stable; if more callers go away this file can move to
// `src/types/`.
//
// Active workout state during a session is owned by SessionPlayer.tsx via
// local React state + the `sessions` table in services/sessionLogger.ts.

import { ExerciseInstance } from '../types/plan';
import { SafetyCheckpoint } from '../services/rulesEngine/rules/types';
import { AssembledWorkout } from '../services/workoutGeneration/workoutAssembler';

/** Tracks which section of a workout is in progress. */
export type WorkoutPhase = 'warmup' | 'main' | 'cooldown';

/** One completed set logged during a session. */
export interface SetLog {
  exercise_id: string;
  set_number: number;
  reps: number;
  weight: number;
  rpe: number;
  timestamp: Date;
}

/** Workout payload as held during an active session — adds last-performance
 *  hints + an exercise-name cache on top of the AssembledWorkout shape. */
export interface ActiveWorkout extends Omit<AssembledWorkout, 'main_workout'> {
  id: string;
  main_workout: Array<ExerciseInstance & {
    exercise_name?: string;
    last_performed?: {
      reps: number;
      weight: number;
    };
    suggested_weight?: number;
  }>;
}

/** SafetyCheckpoint annotated with the exercise / timing that triggered it. */
export interface SafetyCheckpointWithTrigger extends SafetyCheckpoint {
  trigger_exercise_id?: string;
  timing_minutes?: number;
}
