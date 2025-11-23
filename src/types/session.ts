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
  completedAt: string;
}

export interface SessionState {
  currentExerciseIndex: number;
  exercises: string[];
  completedSets: CompletedSet[];
  startedAt: string;
  completedAt: string | null;
}
