/**
 * Workout Session Persistence
 *
 * Saves and restores workout session state to/from SQLite
 * so users can resume interrupted workouts.
 */

import * as SQLite from 'expo-sqlite';
import { ActiveWorkout, SetLog, WorkoutPhase } from '../../contexts/WorkoutContext';

const DB_NAME = 'transfitness.db';

interface PersistedSession {
  id: string;
  user_id: string;
  workout_data: string; // JSON stringified ActiveWorkout
  current_exercise_index: number;
  current_set_number: number;
  current_phase: WorkoutPhase;
  phase_exercise_index: number;
  completed_sets: string; // JSON stringified SetLog[]
  completed_warmup: string; // JSON stringified string[]
  completed_cooldown: string; // JSON stringified string[]
  workout_duration: number;
  started_at: string;
  updated_at: string;
}

export interface ResumableSession {
  workout: ActiveWorkout;
  currentExerciseIndex: number;
  currentSetNumber: number;
  currentPhase: WorkoutPhase;
  phaseExerciseIndex: number;
  completedSets: SetLog[];
  completedWarmupExercises: string[];
  completedCooldownExercises: string[];
  workoutDuration: number;
  startedAt: Date;
}

let db: SQLite.SQLiteDatabase | null = null;

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await initializeSessionTable();
  }
  return db;
}

async function initializeSessionTable(): Promise<void> {
  const database = await SQLite.openDatabaseAsync(DB_NAME);
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      workout_data TEXT NOT NULL,
      current_exercise_index INTEGER DEFAULT 0,
      current_set_number INTEGER DEFAULT 1,
      current_phase TEXT DEFAULT 'warmup',
      phase_exercise_index INTEGER DEFAULT 0,
      completed_sets TEXT DEFAULT '[]',
      completed_warmup TEXT DEFAULT '[]',
      completed_cooldown TEXT DEFAULT '[]',
      workout_duration INTEGER DEFAULT 0,
      started_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

/**
 * Save current workout session state
 */
export async function saveSession(
  userId: string,
  workout: ActiveWorkout,
  state: {
    currentExerciseIndex: number;
    currentSetNumber: number;
    currentPhase: WorkoutPhase;
    phaseExerciseIndex: number;
    completedSets: SetLog[];
    completedWarmupExercises: string[];
    completedCooldownExercises: string[];
    workoutDuration: number;
  }
): Promise<void> {
  try {
    const database = await getDatabase();
    const now = new Date().toISOString();

    // Check if session exists
    const existing = await database.getFirstAsync<{ id: string }>(
      'SELECT id FROM workout_sessions WHERE user_id = ?',
      [userId]
    );

    if (existing) {
      // Update existing session
      await database.runAsync(
        `UPDATE workout_sessions SET
          workout_data = ?,
          current_exercise_index = ?,
          current_set_number = ?,
          current_phase = ?,
          phase_exercise_index = ?,
          completed_sets = ?,
          completed_warmup = ?,
          completed_cooldown = ?,
          workout_duration = ?,
          updated_at = ?
        WHERE user_id = ?`,
        [
          JSON.stringify(workout),
          state.currentExerciseIndex,
          state.currentSetNumber,
          state.currentPhase,
          state.phaseExerciseIndex,
          JSON.stringify(state.completedSets),
          JSON.stringify(state.completedWarmupExercises),
          JSON.stringify(state.completedCooldownExercises),
          state.workoutDuration,
          now,
          userId,
        ]
      );
    } else {
      // Create new session
      await database.runAsync(
        `INSERT INTO workout_sessions (
          id, user_id, workout_data, current_exercise_index, current_set_number,
          current_phase, phase_exercise_index, completed_sets, completed_warmup,
          completed_cooldown, workout_duration, started_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `session_${userId}_${Date.now()}`,
          userId,
          JSON.stringify(workout),
          state.currentExerciseIndex,
          state.currentSetNumber,
          state.currentPhase,
          state.phaseExerciseIndex,
          JSON.stringify(state.completedSets),
          JSON.stringify(state.completedWarmupExercises),
          JSON.stringify(state.completedCooldownExercises),
          state.workoutDuration,
          now,
          now,
        ]
      );
    }
  } catch (error) {
    console.error('Failed to save workout session:', error);
    throw error;
  }
}

/**
 * Get any saved session for a user
 */
export async function getSession(userId: string): Promise<ResumableSession | null> {
  try {
    const database = await getDatabase();

    const session = await database.getFirstAsync<PersistedSession>(
      'SELECT * FROM workout_sessions WHERE user_id = ?',
      [userId]
    );

    if (!session) {
      return null;
    }

    // Check if session is stale (older than 24 hours)
    const updatedAt = new Date(session.updated_at);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceUpdate > 24) {
      // Session too old, delete it
      await clearSession(userId);
      return null;
    }

    // Parse stored data
    const workout: ActiveWorkout = JSON.parse(session.workout_data);
    const completedSets: SetLog[] = JSON.parse(session.completed_sets).map((set: any) => ({
      ...set,
      timestamp: new Date(set.timestamp),
    }));

    return {
      workout,
      currentExerciseIndex: session.current_exercise_index,
      currentSetNumber: session.current_set_number,
      currentPhase: session.current_phase as WorkoutPhase,
      phaseExerciseIndex: session.phase_exercise_index,
      completedSets,
      completedWarmupExercises: JSON.parse(session.completed_warmup),
      completedCooldownExercises: JSON.parse(session.completed_cooldown),
      workoutDuration: session.workout_duration,
      startedAt: new Date(session.started_at),
    };
  } catch (error) {
    console.error('Failed to get workout session:', error);
    return null;
  }
}

/**
 * Check if there's a resumable session
 */
export async function hasResumableSession(userId: string): Promise<boolean> {
  try {
    const session = await getSession(userId);
    return session !== null;
  } catch {
    return false;
  }
}

/**
 * Clear saved session (after completion or explicit discard)
 */
export async function clearSession(userId: string): Promise<void> {
  try {
    const database = await getDatabase();
    await database.runAsync(
      'DELETE FROM workout_sessions WHERE user_id = ?',
      [userId]
    );
  } catch (error) {
    console.error('Failed to clear workout session:', error);
  }
}

/**
 * Get session summary for resume prompt
 */
export async function getSessionSummary(userId: string): Promise<{
  workoutName: string;
  exercisesCompleted: number;
  totalExercises: number;
  duration: number;
  lastUpdated: Date;
} | null> {
  try {
    const session = await getSession(userId);
    if (!session) return null;

    const totalExercises = session.workout.main_workout.length;

    return {
      workoutName: session.workout.id || 'Workout',
      exercisesCompleted: session.currentExerciseIndex,
      totalExercises,
      duration: session.workoutDuration,
      lastUpdated: new Date(session.startedAt),
    };
  } catch {
    return null;
  }
}
