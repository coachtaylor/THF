import * as SQLite from "expo-sqlite";
import {
  PRType,
  PersonalRecord,
  PRDetectionResult,
  ExercisePRs,
  PRWithExercise,
  ExercisePRGroup,
} from "../../types/personalRecords";

// Lazy-initialized database connection (same db as workoutLog)
// Prevents crash when module is imported before React Native runtime is ready
let prDb: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!prDb) {
    prDb = SQLite.openDatabaseSync("transfitness.db");
  }
  return prDb;
}

// In-memory cache for PRs during workout session (performance optimization)
const prCache = new Map<string, ExercisePRs>();

/**
 * Initialize personal records storage table
 */
export async function initPRStorage(): Promise<void> {
  try {
    const db = getDb();
    db.withTransactionSync(() => {
      // Personal records table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS personal_records (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          exercise_id TEXT NOT NULL,
          pr_type TEXT NOT NULL,
          value REAL NOT NULL,
          weight REAL,
          reps INTEGER,
          achieved_at TEXT NOT NULL,
          workout_log_id TEXT,
          set_log_id TEXT,
          previous_value REAL,
          improvement_percent REAL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, exercise_id, pr_type)
        );
      `);

      // Indexes for fast queries
      db.execSync(`
        CREATE INDEX IF NOT EXISTS idx_pr_user_exercise
        ON personal_records(user_id, exercise_id);
      `);

      db.execSync(`
        CREATE INDEX IF NOT EXISTS idx_pr_achieved_at
        ON personal_records(achieved_at DESC);
      `);

      db.execSync(`
        CREATE INDEX IF NOT EXISTS idx_pr_user_type
        ON personal_records(user_id, pr_type);
      `);
    });
    console.log("✓ Personal records storage initialized");
  } catch (error) {
    console.error("❌ Personal records storage initialization failed:", error);
    throw error;
  }
}

/**
 * Calculate estimated 1 rep max using Epley formula
 * 1RM = weight * (1 + reps/30)
 *
 * Note: Most accurate for reps <= 10. For higher reps, accuracy decreases.
 */
export function calculateEstimated1RM(weight: number, reps: number): number {
  if (reps === 0 || weight === 0) return 0;
  if (reps === 1) return weight; // Actual 1RM

  // Epley formula
  const e1rm = weight * (1 + reps / 30);
  return Math.round(e1rm * 10) / 10; // Round to 1 decimal
}

/**
 * Get all existing PRs for an exercise
 */
export async function getExercisePRs(
  userId: string,
  exerciseId: string,
): Promise<ExercisePRs> {
  // Check cache first
  const cacheKey = `${userId}:${exerciseId}`;
  if (prCache.has(cacheKey)) {
    return prCache.get(cacheKey)!;
  }

  const result: ExercisePRs = {
    max_weight: null,
    max_reps: null,
    volume: null,
    estimated_1rm: null,
  };

  try {
    const db = getDb();
    const stmt = db.prepareSync(
      `SELECT * FROM personal_records
       WHERE user_id = ? AND exercise_id = ?`,
    );
    const rows = stmt.executeSync([userId, exerciseId]).getAllSync() as Array<{
      id: string;
      user_id: string;
      exercise_id: string;
      pr_type: PRType;
      value: number;
      weight: number | null;
      reps: number | null;
      achieved_at: string;
      workout_log_id: string | null;
      set_log_id: string | null;
      previous_value: number | null;
      improvement_percent: number | null;
    }>;
    stmt.finalizeSync();

    for (const row of rows) {
      const pr: PersonalRecord = {
        id: row.id,
        user_id: row.user_id,
        exercise_id: row.exercise_id,
        pr_type: row.pr_type,
        value: row.value,
        weight: row.weight,
        reps: row.reps,
        achieved_at: new Date(row.achieved_at),
        workout_log_id: row.workout_log_id,
        set_log_id: row.set_log_id,
        previous_value: row.previous_value,
        improvement_percent: row.improvement_percent,
      };
      result[row.pr_type] = pr;
    }

    // Cache the result
    prCache.set(cacheKey, result);
  } catch (error) {
    console.error("Failed to get exercise PRs:", error);
  }

  return result;
}

/**
 * Save a new personal record
 */
async function savePR(params: {
  userId: string;
  exerciseId: string;
  prType: PRType;
  value: number;
  weight: number;
  reps: number;
  workoutLogId: string | null;
  setLogId: string | null;
  previousValue: number | null;
  improvementPercent: number | null;
}): Promise<PersonalRecord> {
  const prId = `pr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const achievedAt = new Date().toISOString();

  try {
    const db = getDb();
    db.withTransactionSync(() => {
      // Use INSERT OR REPLACE to update existing PR for this exercise/type
      const stmt = db.prepareSync(
        `INSERT OR REPLACE INTO personal_records (
          id, user_id, exercise_id, pr_type, value, weight, reps,
          achieved_at, workout_log_id, set_log_id, previous_value, improvement_percent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      stmt.executeSync([
        prId,
        params.userId,
        params.exerciseId,
        params.prType,
        params.value,
        params.weight,
        params.reps,
        achievedAt,
        params.workoutLogId,
        params.setLogId,
        params.previousValue,
        params.improvementPercent,
      ]);
      stmt.finalizeSync();
    });

    // Invalidate cache for this exercise
    invalidatePRCache(params.userId, params.exerciseId);

    console.log(
      `✓ Saved PR: ${params.prType} = ${params.value} for exercise ${params.exerciseId}`,
    );
  } catch (error) {
    console.error("Failed to save PR:", error);
    throw error;
  }

  return {
    id: prId,
    user_id: params.userId,
    exercise_id: params.exerciseId,
    pr_type: params.prType,
    value: params.value,
    weight: params.weight,
    reps: params.reps,
    achieved_at: new Date(achievedAt),
    workout_log_id: params.workoutLogId,
    set_log_id: params.setLogId,
    previous_value: params.previousValue,
    improvement_percent: params.improvementPercent,
  };
}

/**
 * Detect all PR types for a completed set
 * Called immediately after set completion
 */
export async function detectAllPRs(
  userId: string,
  exerciseId: string,
  weight: number,
  reps: number,
  workoutLogId: string | null,
  setLogId: string | null,
  exerciseName?: string,
): Promise<PRDetectionResult> {
  const result: PRDetectionResult = {
    is_pr: false,
    pr_types: [],
    records: [],
    exercise_name: exerciseName,
  };

  // Skip PR detection for bodyweight exercises with 0 weight (for now)
  // We still track max_reps for these
  if (weight === 0 && reps === 0) {
    return result;
  }

  try {
    // Calculate current values
    const currentVolume = weight * reps;
    const currentE1RM = calculateEstimated1RM(weight, reps);

    // Fetch existing PRs for this exercise
    const existingPRs = await getExercisePRs(userId, exerciseId);

    // Define PR checks
    const prChecks: Array<{
      type: PRType;
      current: number;
      existing: PersonalRecord | null;
    }> = [
      { type: "max_weight", current: weight, existing: existingPRs.max_weight },
      { type: "max_reps", current: reps, existing: existingPRs.max_reps },
      { type: "volume", current: currentVolume, existing: existingPRs.volume },
      {
        type: "estimated_1rm",
        current: currentE1RM,
        existing: existingPRs.estimated_1rm,
      },
    ];

    // Check each PR type
    for (const check of prChecks) {
      // Skip if current value is 0 (e.g., bodyweight exercise for max_weight)
      if (check.current <= 0) continue;

      const existingValue = check.existing?.value || 0;

      // New PR if current value strictly exceeds existing
      if (check.current > existingValue) {
        result.is_pr = true;
        result.pr_types.push(check.type);

        const improvement =
          existingValue > 0
            ? ((check.current - existingValue) / existingValue) * 100
            : null; // First PR has no improvement percentage

        const record = await savePR({
          userId,
          exerciseId,
          prType: check.type,
          value: check.current,
          weight,
          reps,
          workoutLogId,
          setLogId,
          previousValue: existingValue > 0 ? existingValue : null,
          improvementPercent: improvement,
        });

        result.records.push(record);
      }
    }

    if (result.is_pr) {
      console.log(
        `🏆 New PR(s) detected! Types: ${result.pr_types.join(", ")}`,
      );
    }
  } catch (error) {
    console.error("PR detection failed:", error);
    // Non-critical - don't throw, just return empty result
  }

  return result;
}

/**
 * Invalidate cache for an exercise (called after saving new PR)
 */
export function invalidatePRCache(userId: string, exerciseId: string): void {
  prCache.delete(`${userId}:${exerciseId}`);
}

/**
 * Clear entire PR cache (call at workout start/end)
 */
export function clearPRCache(): void {
  prCache.clear();
}

/**
 * Get recent PRs for display (most recent first)
 */
export async function getRecentPRs(
  userId: string,
  limit: number = 10,
): Promise<PRWithExercise[]> {
  try {
    const db = getDb();
    const stmt = db.prepareSync(
      `SELECT pr.*,
              COALESCE(
                (SELECT name FROM exercises WHERE id = pr.exercise_id),
                pr.exercise_id
              ) as exercise_name
       FROM personal_records pr
       WHERE pr.user_id = ?
       ORDER BY pr.achieved_at DESC
       LIMIT ?`,
    );
    const rows = stmt.executeSync([userId, limit]).getAllSync() as Array<{
      id: string;
      user_id: string;
      exercise_id: string;
      exercise_name: string;
      pr_type: PRType;
      value: number;
      weight: number | null;
      reps: number | null;
      achieved_at: string;
      workout_log_id: string | null;
      set_log_id: string | null;
      previous_value: number | null;
      improvement_percent: number | null;
    }>;
    stmt.finalizeSync();

    return rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      exercise_id: row.exercise_id,
      exercise_name: row.exercise_name || row.exercise_id,
      pr_type: row.pr_type,
      value: row.value,
      weight: row.weight,
      reps: row.reps,
      achieved_at: new Date(row.achieved_at),
      workout_log_id: row.workout_log_id,
      set_log_id: row.set_log_id,
      previous_value: row.previous_value,
      improvement_percent: row.improvement_percent,
    }));
  } catch (error) {
    console.error("Failed to get recent PRs:", error);
    return [];
  }
}

/**
 * Get all PRs grouped by exercise
 */
export async function getAllPRsByExercise(
  userId: string,
): Promise<ExercisePRGroup[]> {
  try {
    const db = getDb();
    const stmt = db.prepareSync(
      `SELECT pr.*,
              COALESCE(
                (SELECT name FROM exercises WHERE id = pr.exercise_id),
                pr.exercise_id
              ) as exercise_name
       FROM personal_records pr
       WHERE pr.user_id = ?
       ORDER BY pr.exercise_id, pr.pr_type`,
    );
    const rows = stmt.executeSync([userId]).getAllSync() as Array<{
      id: string;
      user_id: string;
      exercise_id: string;
      exercise_name: string;
      pr_type: PRType;
      value: number;
      weight: number | null;
      reps: number | null;
      achieved_at: string;
      workout_log_id: string | null;
      set_log_id: string | null;
      previous_value: number | null;
      improvement_percent: number | null;
    }>;
    stmt.finalizeSync();

    // Group by exercise
    const groupMap = new Map<string, ExercisePRGroup>();

    for (const row of rows) {
      const pr: PersonalRecord = {
        id: row.id,
        user_id: row.user_id,
        exercise_id: row.exercise_id,
        exercise_name: row.exercise_name,
        pr_type: row.pr_type,
        value: row.value,
        weight: row.weight,
        reps: row.reps,
        achieved_at: new Date(row.achieved_at),
        workout_log_id: row.workout_log_id,
        set_log_id: row.set_log_id,
        previous_value: row.previous_value,
        improvement_percent: row.improvement_percent,
      };

      if (!groupMap.has(row.exercise_id)) {
        groupMap.set(row.exercise_id, {
          exercise_id: row.exercise_id,
          exercise_name: row.exercise_name || row.exercise_id,
          prs: [],
        });
      }
      groupMap.get(row.exercise_id)!.prs.push(pr);
    }

    return Array.from(groupMap.values());
  } catch (error) {
    console.error("Failed to get all PRs by exercise:", error);
    return [];
  }
}

/**
 * Get PRs filtered by type
 */
export async function getPRsByType(
  userId: string,
  prType: PRType,
): Promise<PRWithExercise[]> {
  try {
    const db = getDb();
    const stmt = db.prepareSync(
      `SELECT pr.*,
              COALESCE(
                (SELECT name FROM exercises WHERE id = pr.exercise_id),
                pr.exercise_id
              ) as exercise_name
       FROM personal_records pr
       WHERE pr.user_id = ? AND pr.pr_type = ?
       ORDER BY pr.achieved_at DESC`,
    );
    const rows = stmt.executeSync([userId, prType]).getAllSync() as Array<{
      id: string;
      user_id: string;
      exercise_id: string;
      exercise_name: string;
      pr_type: PRType;
      value: number;
      weight: number | null;
      reps: number | null;
      achieved_at: string;
      workout_log_id: string | null;
      set_log_id: string | null;
      previous_value: number | null;
      improvement_percent: number | null;
    }>;
    stmt.finalizeSync();

    return rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      exercise_id: row.exercise_id,
      exercise_name: row.exercise_name || row.exercise_id,
      pr_type: row.pr_type,
      value: row.value,
      weight: row.weight,
      reps: row.reps,
      achieved_at: new Date(row.achieved_at),
      workout_log_id: row.workout_log_id,
      set_log_id: row.set_log_id,
      previous_value: row.previous_value,
      improvement_percent: row.improvement_percent,
    }));
  } catch (error) {
    console.error("Failed to get PRs by type:", error);
    return [];
  }
}

/**
 * Get total PR count for a user
 */
export async function getPRCount(userId: string): Promise<number> {
  try {
    const db = getDb();
    const stmt = db.prepareSync(
      `SELECT COUNT(*) as count FROM personal_records WHERE user_id = ?`,
    );
    const result = stmt.executeSync([userId]).getFirstSync() as {
      count: number;
    } | null;
    stmt.finalizeSync();
    return result?.count || 0;
  } catch (error) {
    console.error("Failed to get PR count:", error);
    return 0;
  }
}

/**
 * Format PR type for display
 */
export function formatPRType(prType: PRType): string {
  switch (prType) {
    case "max_weight":
      return "Max Weight";
    case "max_reps":
      return "Max Reps";
    case "volume":
      return "Volume";
    case "estimated_1rm":
      return "Est. 1RM";
    default:
      return prType;
  }
}

/**
 * Format PR value for display
 */
export function formatPRValue(pr: PersonalRecord): string {
  switch (pr.pr_type) {
    case "max_weight":
      return `${pr.value} lbs`;
    case "max_reps":
      return `${pr.value} reps`;
    case "volume":
      return `${pr.value.toLocaleString()} lbs`;
    case "estimated_1rm":
      return `${pr.value} lbs`;
    default:
      return String(pr.value);
  }
}

/**
 * Get icon name for PR type (Ionicons)
 */
export function getPRTypeIcon(prType: PRType): string {
  switch (prType) {
    case "max_weight":
      return "barbell";
    case "max_reps":
      return "repeat";
    case "volume":
      return "stats-chart";
    case "estimated_1rm":
      return "calculator";
    default:
      return "trophy";
  }
}
