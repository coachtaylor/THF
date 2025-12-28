export type TimerFormat = 'EMOM' | 'AMRAP' | 'straight_sets';

export interface TimerState {
  format: TimerFormat;
  currentSet: number;
  totalSets: number;
  elapsedSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
}

export interface CompletedSet {
  exerciseId: string;
  setNumber: number;
  rpe: number;
  reps: number;
  weight?: number; // Weight in lbs
  completedAt: string;
  skipped?: boolean; // True if set was skipped
}

export interface SessionState {
  currentExerciseIndex: number;
  exercises: string[];
  completedSets: CompletedSet[];
  startedAt: string;
  completedAt: string | null;
}
