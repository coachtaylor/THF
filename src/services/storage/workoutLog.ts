import * as SQLite from 'expo-sqlite';
import { SetLog } from '../../contexts/WorkoutContext';

// Open database connection for workout log storage
const workoutLogDb = SQLite.openDatabaseSync('transfitness.db');

/**
 * Workout log entry with all sets
 */
export interface WorkoutLog {
  id: string;
  user_id: string;
  workout_id: string;
  workout_date: Date;
  status: 'in_progress' | 'completed' | 'abandoned';
  started_at: Date;
  completed_at?: Date;
  duration_minutes?: number;
  exercises_completed: number;
  total_volume: number;
  average_rpe: number;
  workout_rating?: number;
  performance_notes?: string;
  sets: SetLogEntry[];
}

/**
 * Set log entry (extended from SetLog with database fields)
 */
export interface SetLogEntry {
  id: string;
  exercise_id: string;
  set_number: number;
  reps: number;
  weight: number;
  rpe: number;
  rest_duration_seconds?: number;
  logged_at: Date;
}

/**
 * Initialize workout logging tables
 */
export async function initWorkoutLogStorage(): Promise<void> {
  try {
    workoutLogDb.withTransactionSync(() => {
      // Workout logs table
      workoutLogDb.execSync(`
        CREATE TABLE IF NOT EXISTS workout_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          workout_id TEXT NOT NULL,
          workout_date TEXT NOT NULL,
          status TEXT NOT NULL,
          started_at TEXT NOT NULL,
          completed_at TEXT,
          duration_minutes INTEGER,
          exercises_completed INTEGER DEFAULT 0,
          total_volume REAL DEFAULT 0,
          average_rpe REAL DEFAULT 0,
          workout_rating INTEGER,
          performance_notes TEXT
        );
      `);

      // Set logs table
      workoutLogDb.execSync(`
        CREATE TABLE IF NOT EXISTS set_logs (
          id TEXT PRIMARY KEY,
          workout_log_id TEXT NOT NULL,
          exercise_id TEXT NOT NULL,
          set_number INTEGER NOT NULL,
          reps INTEGER NOT NULL,
          weight REAL NOT NULL,
          rpe INTEGER NOT NULL,
          rest_duration_seconds INTEGER,
          logged_at TEXT NOT NULL,
          FOREIGN KEY (workout_log_id) REFERENCES workout_logs(id) ON DELETE CASCADE
        );
      `);

      // Create index for faster queries
      workoutLogDb.execSync(`
        CREATE INDEX IF NOT EXISTS idx_set_logs_workout_log_id 
        ON set_logs(workout_log_id);
      `);

      workoutLogDb.execSync(`
        CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id 
        ON workout_logs(user_id);
      `);

      workoutLogDb.execSync(`
        CREATE INDEX IF NOT EXISTS idx_workout_logs_workout_date 
        ON workout_logs(workout_date);
      `);
    });
    console.log('✓ Workout log storage initialized');
  } catch (error) {
    console.error('❌ Workout log storage initialization failed:', error);
    throw error;
  }
}

/**
 * Start a workout log
 */
export async function startWorkoutLog(
  userId: string,
  workoutId: string
): Promise<string> {
  try {
    const logId = `wlog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const workoutDate = new Date().toISOString().split('T')[0];
    const startedAt = new Date().toISOString();

    workoutLogDb.withTransactionSync(() => {
      const stmt = workoutLogDb.prepareSync(
        `INSERT INTO workout_logs (
          id, user_id, workout_id, workout_date, status, started_at
        ) VALUES (?, ?, ?, ?, ?, ?)`
      );
      stmt.executeSync([logId, userId, workoutId, workoutDate, 'in_progress', startedAt]);
      stmt.finalizeSync();
    });

    console.log(`✓ Started workout log: ${logId}`);
    return logId;
  } catch (error) {
    console.error('❌ Failed to start workout log:', error);
    throw error;
  }
}

/**
 * Log a completed set
 */
export async function logSet(
  workoutLogId: string,
  setData: SetLog & { rest_duration_seconds?: number }
): Promise<void> {
  try {
    const setId = `set_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const loggedAt = new Date().toISOString();

    workoutLogDb.withTransactionSync(() => {
      const stmt = workoutLogDb.prepareSync(
        `INSERT INTO set_logs (
          id, workout_log_id, exercise_id, set_number, reps, weight, rpe, rest_duration_seconds, logged_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      stmt.executeSync([
        setId,
        workoutLogId,
        setData.exercise_id,
        setData.set_number,
        setData.reps,
        setData.weight,
        setData.rpe,
        setData.rest_duration_seconds || null,
        loggedAt,
      ]);
      stmt.finalizeSync();
    });

    console.log(`✓ Logged set: ${setId}`);
  } catch (error) {
    console.error('❌ Failed to log set:', error);
    throw error;
  }
}

/**
 * Complete a workout log
 */
export async function completeWorkoutLog(
  workoutLogId: string,
  data: {
    duration_minutes: number;
    exercises_completed: number;
    workout_rating?: number;
    performance_notes?: string;
  }
): Promise<void> {
  try {
    workoutLogDb.withTransactionSync(() => {
      // Calculate total volume and average RPE from sets
      const statsStmt = workoutLogDb.prepareSync(
        `SELECT 
          COALESCE(SUM(reps * weight), 0) as total_volume,
          COALESCE(AVG(rpe), 0) as avg_rpe
         FROM set_logs
         WHERE workout_log_id = ?`
      );
      const statsResult = statsStmt.executeSync([workoutLogId]).getFirstSync() as {
        total_volume: number;
        avg_rpe: number;
      } | null;
      statsStmt.finalizeSync();

      const totalVolume = statsResult?.total_volume || 0;
      const avgRpe = statsResult?.avg_rpe || 0;
      const completedAt = new Date().toISOString();

      // Update workout log
      const updateStmt = workoutLogDb.prepareSync(
        `UPDATE workout_logs 
         SET 
           status = 'completed',
           completed_at = ?,
           duration_minutes = ?,
           exercises_completed = ?,
           total_volume = ?,
           average_rpe = ?,
           workout_rating = ?,
           performance_notes = ?
         WHERE id = ?`
      );
      updateStmt.executeSync([
        completedAt,
        data.duration_minutes,
        data.exercises_completed,
        totalVolume,
        avgRpe,
        data.workout_rating || null,
        data.performance_notes || null,
        workoutLogId,
      ]);
      updateStmt.finalizeSync();
    });

    console.log(`✓ Completed workout log: ${workoutLogId}`);
  } catch (error) {
    console.error('❌ Failed to complete workout log:', error);
    throw error;
  }
}

/**
 * Get workout log with all sets
 */
export async function getWorkoutLog(workoutLogId: string): Promise<WorkoutLog | null> {
  try {
    let log: any = null;

    workoutLogDb.withTransactionSync(() => {
      const logStmt = workoutLogDb.prepareSync(
        'SELECT * FROM workout_logs WHERE id = ?'
      );
      const logRows = logStmt.executeSync([workoutLogId]).getAllSync() as any[];
      logStmt.finalizeSync();

      if (logRows.length === 0) {
        return;
      }

      log = logRows[0];

      // Get all sets for this workout
      const setsStmt = workoutLogDb.prepareSync(
        `SELECT * FROM set_logs 
         WHERE workout_log_id = ? 
         ORDER BY logged_at`
      );
      const setRows = setsStmt.executeSync([workoutLogId]).getAllSync() as any[];
      setsStmt.finalizeSync();

      log.sets = setRows.map((s: any) => ({
        id: s.id,
        exercise_id: s.exercise_id,
        set_number: s.set_number,
        reps: s.reps,
        weight: s.weight,
        rpe: s.rpe,
        rest_duration_seconds: s.rest_duration_seconds,
        logged_at: new Date(s.logged_at),
      }));
    });

    if (!log) return null;

    return {
      id: log.id,
      user_id: log.user_id,
      workout_id: log.workout_id,
      workout_date: new Date(log.workout_date),
      status: log.status as 'in_progress' | 'completed' | 'abandoned',
      started_at: new Date(log.started_at),
      completed_at: log.completed_at ? new Date(log.completed_at) : undefined,
      duration_minutes: log.duration_minutes,
      exercises_completed: log.exercises_completed,
      total_volume: log.total_volume,
      average_rpe: log.average_rpe,
      workout_rating: log.workout_rating,
      performance_notes: log.performance_notes,
      sets: log.sets || [],
    };
  } catch (error) {
    console.error('❌ Failed to get workout log:', error);
    throw error;
  }
}

/**
 * Get user's workout history
 */
export async function getWorkoutHistory(
  userId: string,
  limit: number = 10
): Promise<WorkoutLog[]> {
  try {
    let logs: any[] = [];

    workoutLogDb.withTransactionSync(() => {
      const stmt = workoutLogDb.prepareSync(
        `SELECT * FROM workout_logs 
         WHERE user_id = ? AND status = 'completed'
         ORDER BY workout_date DESC, started_at DESC
         LIMIT ?`
      );
      logs = stmt.executeSync([userId, limit]).getAllSync() as any[];
      stmt.finalizeSync();
    });

    return logs.map((log: any) => ({
      id: log.id,
      user_id: log.user_id,
      workout_id: log.workout_id,
      workout_date: new Date(log.workout_date),
      status: log.status as 'in_progress' | 'completed' | 'abandoned',
      started_at: new Date(log.started_at),
      completed_at: log.completed_at ? new Date(log.completed_at) : undefined,
      duration_minutes: log.duration_minutes,
      exercises_completed: log.exercises_completed,
      total_volume: log.total_volume,
      average_rpe: log.average_rpe,
      workout_rating: log.workout_rating,
      performance_notes: log.performance_notes,
      sets: [], // Load separately if needed for performance
    }));
  } catch (error) {
    console.error('❌ Failed to get workout history:', error);
    throw error;
  }
}

/**
 * Detect PRs (Personal Records)
 * Returns true if current weight × reps is greater than previous max
 */
export async function detectPRs(
  userId: string,
  exerciseId: string,
  currentWeight: number,
  currentReps: number
): Promise<boolean> {
  try {
    let maxValue: number = 0;

    workoutLogDb.withTransactionSync(() => {
      const stmt = workoutLogDb.prepareSync(
        `SELECT MAX(weight * reps) as max_value
         FROM set_logs
         WHERE workout_log_id IN (
           SELECT id FROM workout_logs 
           WHERE user_id = ? AND status = 'completed'
         ) AND exercise_id = ?`
      );
      const result = stmt.executeSync([userId, exerciseId]).getFirstSync() as {
        max_value: number | null;
      } | null;
      stmt.finalizeSync();

      maxValue = result?.max_value || 0;
    });

    const currentValue = currentWeight * currentReps;
    return currentValue > maxValue;
  } catch (error) {
    console.error('❌ Failed to detect PRs:', error);
    // Return false on error to be safe
    return false;
  }
}

/**
 * Get PR for a specific exercise
 */
export async function getExercisePR(
  userId: string,
  exerciseId: string
): Promise<{ weight: number; reps: number; value: number } | null> {
  try {
    let pr: any = null;

    workoutLogDb.withTransactionSync(() => {
      const stmt = workoutLogDb.prepareSync(
        `SELECT weight, reps, (weight * reps) as value
         FROM set_logs
         WHERE workout_log_id IN (
           SELECT id FROM workout_logs 
           WHERE user_id = ? AND status = 'completed'
         ) AND exercise_id = ?
         ORDER BY (weight * reps) DESC
         LIMIT 1`
      );
      const result = stmt.executeSync([userId, exerciseId]).getFirstSync() as {
        weight: number;
        reps: number;
        value: number;
      } | null;
      stmt.finalizeSync();

      pr = result;
    });

    return pr;
  } catch (error) {
    console.error('❌ Failed to get exercise PR:', error);
    return null;
  }
}

/**
 * Abandon a workout log (user exits early)
 */
export async function abandonWorkoutLog(workoutLogId: string): Promise<void> {
  try {
    workoutLogDb.withTransactionSync(() => {
      const stmt = workoutLogDb.prepareSync(
        `UPDATE workout_logs 
         SET status = 'abandoned', completed_at = ?
         WHERE id = ?`
      );
      stmt.executeSync([new Date().toISOString(), workoutLogId]);
      stmt.finalizeSync();
    });

    console.log(`✓ Abandoned workout log: ${workoutLogId}`);
  } catch (error) {
    console.error('❌ Failed to abandon workout log:', error);
    throw error;
  }
}

