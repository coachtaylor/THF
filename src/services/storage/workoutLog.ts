import * as SQLite from "expo-sqlite";
import { SetLog } from "../../contexts/WorkoutContext";

// Lazy-initialized database connection for workout log storage
// Prevents crash when module is imported before React Native runtime is ready
let workoutLogDb: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!workoutLogDb) {
    workoutLogDb = SQLite.openDatabaseSync("transfitness.db");
  }
  return workoutLogDb;
}

/**
 * Workout log entry with all sets
 */
export interface WorkoutLog {
  id: string;
  user_id: string;
  workout_id: string;
  workout_date: Date;
  status: "in_progress" | "completed" | "abandoned";
  started_at: Date;
  completed_at?: Date;
  duration_minutes?: number;
  exercises_completed: number;
  total_volume: number;
  average_rpe: number;
  workout_rating?: number;
  performance_notes?: string;
  body_checkin?: "connected" | "neutral" | "disconnected" | "skip";
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
    getDb().withTransactionSync(() => {
      // Workout logs table
      getDb().execSync(`
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
          performance_notes TEXT,
          body_checkin TEXT
        );
      `);

      // Set logs table
      getDb().execSync(`
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
      getDb().execSync(`
        CREATE INDEX IF NOT EXISTS idx_set_logs_workout_log_id 
        ON set_logs(workout_log_id);
      `);

      getDb().execSync(`
        CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id
        ON workout_logs(user_id);
      `);

      getDb().execSync(`
        CREATE INDEX IF NOT EXISTS idx_workout_logs_workout_date
        ON workout_logs(workout_date);
      `);

      // Migration: Add body_checkin column if it doesn't exist
      // This handles existing databases that don't have the column yet
      try {
        getDb().execSync(`
          ALTER TABLE workout_logs ADD COLUMN body_checkin TEXT;
        `);
      } catch {
        // Column already exists, ignore error
      }
    });
    console.log("✓ Workout log storage initialized");
  } catch (error) {
    console.error("❌ Workout log storage initialization failed:", error);
    throw error;
  }
}

/**
 * Start a workout log
 */
export async function startWorkoutLog(
  userId: string,
  workoutId: string,
): Promise<string> {
  try {
    const logId = `wlog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const workoutDate = new Date().toISOString().split("T")[0];
    const startedAt = new Date().toISOString();

    getDb().withTransactionSync(() => {
      const stmt = getDb().prepareSync(
        `INSERT INTO workout_logs (
          id, user_id, workout_id, workout_date, status, started_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
      );
      stmt.executeSync([
        logId,
        userId,
        workoutId,
        workoutDate,
        "in_progress",
        startedAt,
      ]);
      stmt.finalizeSync();
    });

    console.log(`✓ Started workout log: ${logId}`);
    return logId;
  } catch (error) {
    console.error("❌ Failed to start workout log:", error);
    throw error;
  }
}

/**
 * Log a completed set
 * Returns the set ID for PR tracking
 */
export async function logSet(
  workoutLogId: string,
  setData: SetLog & { rest_duration_seconds?: number },
): Promise<string> {
  const setId = `set_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const loggedAt = new Date().toISOString();

    getDb().withTransactionSync(() => {
      const stmt = getDb().prepareSync(
        `INSERT INTO set_logs (
          id, workout_log_id, exercise_id, set_number, reps, weight, rpe, rest_duration_seconds, logged_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    return setId;
  } catch (error) {
    console.error("❌ Failed to log set:", error);
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
    body_checkin?: "connected" | "neutral" | "disconnected" | "skip";
  },
): Promise<void> {
  try {
    getDb().withTransactionSync(() => {
      // Calculate total volume and average RPE from sets
      const statsStmt = getDb().prepareSync(
        `SELECT 
          COALESCE(SUM(reps * weight), 0) as total_volume,
          COALESCE(AVG(rpe), 0) as avg_rpe
         FROM set_logs
         WHERE workout_log_id = ?`,
      );
      const statsResult = statsStmt
        .executeSync([workoutLogId])
        .getFirstSync() as {
        total_volume: number;
        avg_rpe: number;
      } | null;
      statsStmt.finalizeSync();

      const totalVolume = statsResult?.total_volume || 0;
      const avgRpe = statsResult?.avg_rpe || 0;
      const completedAt = new Date().toISOString();

      // Update workout log
      const updateStmt = getDb().prepareSync(
        `UPDATE workout_logs
         SET
           status = 'completed',
           completed_at = ?,
           duration_minutes = ?,
           exercises_completed = ?,
           total_volume = ?,
           average_rpe = ?,
           workout_rating = ?,
           performance_notes = ?,
           body_checkin = ?
         WHERE id = ?`,
      );
      updateStmt.executeSync([
        completedAt,
        data.duration_minutes,
        data.exercises_completed,
        totalVolume,
        avgRpe,
        data.workout_rating || null,
        data.performance_notes || null,
        data.body_checkin || null,
        workoutLogId,
      ]);
      updateStmt.finalizeSync();
    });

    console.log(`✓ Completed workout log: ${workoutLogId}`);
  } catch (error) {
    console.error("❌ Failed to complete workout log:", error);
    throw error;
  }
}

/**
 * Get workout log with all sets
 */
export async function getWorkoutLog(
  workoutLogId: string,
): Promise<WorkoutLog | null> {
  try {
    let log: any = null;

    getDb().withTransactionSync(() => {
      const logStmt = getDb().prepareSync(
        "SELECT * FROM workout_logs WHERE id = ?",
      );
      const logRows = logStmt.executeSync([workoutLogId]).getAllSync() as any[];
      logStmt.finalizeSync();

      if (logRows.length === 0) {
        return;
      }

      log = logRows[0];

      // Get all sets for this workout
      const setsStmt = getDb().prepareSync(
        `SELECT * FROM set_logs 
         WHERE workout_log_id = ? 
         ORDER BY logged_at`,
      );
      const setRows = setsStmt
        .executeSync([workoutLogId])
        .getAllSync() as any[];
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
      status: log.status as "in_progress" | "completed" | "abandoned",
      started_at: new Date(log.started_at),
      completed_at: log.completed_at ? new Date(log.completed_at) : undefined,
      duration_minutes: log.duration_minutes,
      exercises_completed: log.exercises_completed,
      total_volume: log.total_volume,
      average_rpe: log.average_rpe,
      workout_rating: log.workout_rating,
      performance_notes: log.performance_notes,
      body_checkin: log.body_checkin,
      sets: log.sets || [],
    };
  } catch (error) {
    console.error("❌ Failed to get workout log:", error);
    throw error;
  }
}

/**
 * Get user's workout history
 */
export async function getWorkoutHistory(
  userId: string,
  limit: number = 10,
): Promise<WorkoutLog[]> {
  try {
    let logs: any[] = [];

    getDb().withTransactionSync(() => {
      const stmt = getDb().prepareSync(
        `SELECT * FROM workout_logs 
         WHERE user_id = ? AND status = 'completed'
         ORDER BY workout_date DESC, started_at DESC
         LIMIT ?`,
      );
      logs = stmt.executeSync([userId, limit]).getAllSync() as any[];
      stmt.finalizeSync();
    });

    return logs.map((log: any) => ({
      id: log.id,
      user_id: log.user_id,
      workout_id: log.workout_id,
      workout_date: new Date(log.workout_date),
      status: log.status as "in_progress" | "completed" | "abandoned",
      started_at: new Date(log.started_at),
      completed_at: log.completed_at ? new Date(log.completed_at) : undefined,
      duration_minutes: log.duration_minutes,
      exercises_completed: log.exercises_completed,
      total_volume: log.total_volume,
      average_rpe: log.average_rpe,
      workout_rating: log.workout_rating,
      performance_notes: log.performance_notes,
      body_checkin: log.body_checkin,
      sets: [], // Load separately if needed for performance
    }));
  } catch (error) {
    console.error("❌ Failed to get workout history:", error);
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
  currentReps: number,
): Promise<boolean> {
  try {
    let maxValue: number = 0;

    getDb().withTransactionSync(() => {
      const stmt = getDb().prepareSync(
        `SELECT MAX(weight * reps) as max_value
         FROM set_logs
         WHERE workout_log_id IN (
           SELECT id FROM workout_logs 
           WHERE user_id = ? AND status = 'completed'
         ) AND exercise_id = ?`,
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
    console.error("❌ Failed to detect PRs:", error);
    // Return false on error to be safe
    return false;
  }
}

/**
 * Get PR for a specific exercise
 */
export async function getExercisePR(
  userId: string,
  exerciseId: string,
): Promise<{ weight: number; reps: number; value: number } | null> {
  try {
    let pr: any = null;

    getDb().withTransactionSync(() => {
      const stmt = getDb().prepareSync(
        `SELECT weight, reps, (weight * reps) as value
         FROM set_logs
         WHERE workout_log_id IN (
           SELECT id FROM workout_logs 
           WHERE user_id = ? AND status = 'completed'
         ) AND exercise_id = ?
         ORDER BY (weight * reps) DESC
         LIMIT 1`,
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
    console.error("❌ Failed to get exercise PR:", error);
    return null;
  }
}

/**
 * Abandon a workout log (user exits early)
 */
export async function abandonWorkoutLog(workoutLogId: string): Promise<void> {
  try {
    getDb().withTransactionSync(() => {
      const stmt = getDb().prepareSync(
        `UPDATE workout_logs
         SET status = 'abandoned', completed_at = ?
         WHERE id = ?`,
      );
      stmt.executeSync([new Date().toISOString(), workoutLogId]);
      stmt.finalizeSync();
    });

    console.log(`✓ Abandoned workout log: ${workoutLogId}`);
  } catch (error) {
    console.error("❌ Failed to abandon workout log:", error);
    throw error;
  }
}

/**
 * Get workout logs for a specific week
 * Returns logs for the week starting from the given date
 */
export async function getWeekWorkoutLogs(
  userId: string,
  weekStartDate: Date,
): Promise<WorkoutLog[]> {
  try {
    const weekEnd = new Date(weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const startDateStr = weekStartDate.toISOString().split("T")[0];
    const endDateStr = weekEnd.toISOString().split("T")[0];

    let logs: any[] = [];

    getDb().withTransactionSync(() => {
      const stmt = getDb().prepareSync(
        `SELECT * FROM workout_logs
         WHERE user_id = ?
           AND workout_date >= ?
           AND workout_date < ?
         ORDER BY workout_date DESC`,
      );
      logs = stmt
        .executeSync([userId, startDateStr, endDateStr])
        .getAllSync() as any[];
      stmt.finalizeSync();
    });

    return logs.map((log: any) => ({
      id: log.id,
      user_id: log.user_id,
      workout_id: log.workout_id,
      workout_date: new Date(log.workout_date),
      status: log.status as "in_progress" | "completed" | "abandoned",
      started_at: new Date(log.started_at),
      completed_at: log.completed_at ? new Date(log.completed_at) : undefined,
      duration_minutes: log.duration_minutes,
      exercises_completed: log.exercises_completed,
      total_volume: log.total_volume,
      average_rpe: log.average_rpe,
      workout_rating: log.workout_rating,
      performance_notes: log.performance_notes,
      body_checkin: log.body_checkin,
      sets: [], // Load separately if needed for performance
    }));
  } catch (error) {
    console.error("❌ Failed to get week workout logs:", error);
    return [];
  }
}

/**
 * Last performance data for an exercise
 */
export interface LastPerformance {
  date: Date;
  sets: number;
  avgReps: number;
  avgWeight: number;
  avgRPE: number;
  maxWeight: number;
  bestSet: {
    reps: number;
    weight: number;
    rpe: number;
  };
}

/**
 * Get the last performance data for a specific exercise
 * Returns the most recent performance for the given exercise
 */
export async function getLastPerformance(
  userId: string,
  exerciseId: string,
): Promise<LastPerformance | null> {
  try {
    let lastPerf: LastPerformance | null = null;

    getDb().withTransactionSync(() => {
      // Find the most recent completed workout that includes this exercise
      const findStmt = getDb().prepareSync(
        `SELECT DISTINCT wl.id, wl.workout_date
         FROM workout_logs wl
         JOIN set_logs sl ON sl.workout_log_id = wl.id
         WHERE wl.user_id = ?
           AND wl.status = 'completed'
           AND sl.exercise_id = ?
         ORDER BY wl.workout_date DESC
         LIMIT 1`,
      );
      const workoutResult = findStmt
        .executeSync([userId, exerciseId])
        .getFirstSync() as {
        id: string;
        workout_date: string;
      } | null;
      findStmt.finalizeSync();

      if (!workoutResult) {
        return;
      }

      // Get all sets for this exercise in that workout
      const setsStmt = getDb().prepareSync(
        `SELECT reps, weight, rpe
         FROM set_logs
         WHERE workout_log_id = ? AND exercise_id = ?
         ORDER BY set_number`,
      );
      const sets = setsStmt
        .executeSync([workoutResult.id, exerciseId])
        .getAllSync() as {
        reps: number;
        weight: number;
        rpe: number;
      }[];
      setsStmt.finalizeSync();

      if (sets.length === 0) {
        return;
      }

      // Calculate aggregates
      const totalReps = sets.reduce((sum, s) => sum + s.reps, 0);
      const totalWeight = sets.reduce((sum, s) => sum + s.weight, 0);
      const totalRPE = sets.reduce((sum, s) => sum + s.rpe, 0);
      const maxWeight = Math.max(...sets.map((s) => s.weight));

      // Find best set (highest weight × reps)
      let bestSet = sets[0];
      let bestValue = sets[0].weight * sets[0].reps;
      for (const set of sets) {
        const value = set.weight * set.reps;
        if (value > bestValue) {
          bestValue = value;
          bestSet = set;
        }
      }

      lastPerf = {
        date: new Date(workoutResult.workout_date),
        sets: sets.length,
        avgReps: Math.round(totalReps / sets.length),
        avgWeight: Math.round(totalWeight / sets.length),
        avgRPE: Math.round((totalRPE / sets.length) * 10) / 10,
        maxWeight,
        bestSet: {
          reps: bestSet.reps,
          weight: bestSet.weight,
          rpe: bestSet.rpe,
        },
      };
    });

    return lastPerf;
  } catch (error) {
    console.error("❌ Failed to get last performance:", error);
    return null;
  }
}

/**
 * Get last performance for multiple exercises at once (for workout loading)
 */
export async function getLastPerformanceForExercises(
  userId: string,
  exerciseIds: string[],
): Promise<Map<string, LastPerformance>> {
  const results = new Map<string, LastPerformance>();

  // Get performance for each exercise in parallel
  const promises = exerciseIds.map(async (exerciseId) => {
    const perf = await getLastPerformance(userId, exerciseId);
    if (perf) {
      results.set(exerciseId, perf);
    }
  });

  await Promise.all(promises);
  return results;
}

/**
 * Calculate suggested weight based on last performance
 * Uses RPE-based progression logic
 */
export function calculateSuggestedWeight(lastPerf: LastPerformance): number {
  const { avgWeight, avgRPE, maxWeight } = lastPerf;

  // If RPE was low (< 7), suggest increasing weight
  if (avgRPE < 7) {
    // Increase by 5 lbs (2.5kg equivalent)
    return Math.round((avgWeight + 5) / 5) * 5;
  }

  // If RPE was moderate (7-8), suggest same weight
  if (avgRPE <= 8) {
    return Math.round(avgWeight / 5) * 5;
  }

  // If RPE was high (> 8), suggest same or slightly lower
  // (user was working hard, maintain or slight deload)
  return Math.round(avgWeight / 5) * 5;
}

/**
 * Get count of completed workouts in the current week
 * Used for free tier workout limit enforcement
 * Week starts on Monday
 */
export async function getWeeklyCompletedWorkoutCount(
  userId: string,
): Promise<number> {
  try {
    // Calculate start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    const weekStartStr = weekStart.toISOString().split("T")[0];

    let count = 0;

    getDb().withTransactionSync(() => {
      const stmt = getDb().prepareSync(
        `SELECT COUNT(*) as count
         FROM workout_logs
         WHERE user_id = ?
           AND status = 'completed'
           AND workout_date >= ?`,
      );
      const result = stmt
        .executeSync([userId, weekStartStr])
        .getFirstSync() as {
        count: number;
      } | null;
      stmt.finalizeSync();

      count = result?.count || 0;
    });

    return count;
  } catch (error) {
    console.error("❌ Failed to get weekly workout count:", error);
    return 0;
  }
}

/**
 * Check if user can start a new workout (free tier limit check)
 * Returns true if user can start, false if limit reached
 */
export async function canStartWorkout(
  userId: string,
  weeklyLimit: number,
): Promise<{ canStart: boolean; currentCount: number; limit: number }> {
  const currentCount = await getWeeklyCompletedWorkoutCount(userId);
  return {
    canStart: currentCount < weeklyLimit,
    currentCount,
    limit: weeklyLimit,
  };
}

/**
 * Get workout log for a specific date
 * Returns the workout log for the given date, or null if none exists
 */
export async function getWorkoutLogByDate(
  userId: string,
  date: Date,
): Promise<WorkoutLog | null> {
  try {
    const dateStr = date.toISOString().split("T")[0];
    let log: any = null;

    getDb().withTransactionSync(() => {
      const stmt = getDb().prepareSync(
        `SELECT * FROM workout_logs
         WHERE user_id = ? AND workout_date = ?
         ORDER BY started_at DESC
         LIMIT 1`,
      );
      const rows = stmt.executeSync([userId, dateStr]).getAllSync() as any[];
      stmt.finalizeSync();

      if (rows.length > 0) {
        log = rows[0];
      }
    });

    if (!log) return null;

    return {
      id: log.id,
      user_id: log.user_id,
      workout_id: log.workout_id,
      workout_date: new Date(log.workout_date),
      status: log.status as "in_progress" | "completed" | "abandoned",
      started_at: new Date(log.started_at),
      completed_at: log.completed_at ? new Date(log.completed_at) : undefined,
      duration_minutes: log.duration_minutes,
      exercises_completed: log.exercises_completed,
      total_volume: log.total_volume,
      average_rpe: log.average_rpe,
      workout_rating: log.workout_rating,
      performance_notes: log.performance_notes,
      body_checkin: log.body_checkin,
      sets: [],
    };
  } catch (error) {
    console.error("❌ Failed to get workout log by date:", error);
    return null;
  }
}
