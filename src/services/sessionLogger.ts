// src/services/sessionLogger.ts
import { db } from '../utils/database';
import { CompletedSet } from '../types/session';

export interface SessionData {
  id: string;
  planId: string;
  workoutName?: string;
  // Day number on the plan that this session was scheduled against —
  // used to detect "completed early" workouts on Home + Upcoming cards.
  scheduledDayNumber?: number;
  workoutDuration: number;
  exercises: Array<{
    exerciseId: string;
    name?: string;
    sets: Array<{
      rpe: number;
      reps: number;
      weight?: number; // Weight in lbs
      completedAt: string;
      // True when the user tapped "Skip Set" mid-workout. Consumers must
      // exclude these from aggregates (totalSets, totalReps, volume, RPE
      // average) so reporting reflects actual training, not the act of
      // hitting Skip. Legacy sessions saved before 2026-05-13 lack the
      // flag; readers can identify legacy-effectively-skipped sets by the
      // {reps:0, rpe:0, weight:0|undefined} shape that handleSkipSet wrote.
      skipped?: boolean;
    }>;
    swappedTo: string | null;
    painFlagged: boolean;
  }>;
  startedAt: string;
  completedAt: string;
  durationMinutes: number;
}

/**
 * Returns true if a saved set should be excluded from reporting aggregates
 * (totalSets, totalReps, volume, RPE average). Handles two cases:
 *
 * 1. **Explicit skip:** sets written by handleSkipSet from 2026-05-13 onward
 *    carry `skipped: true`.
 * 2. **Legacy skip:** sets written before the flag was persisted have the
 *    exact shape `{ reps: 0, rpe: 0, weight: 0 | undefined }` that
 *    handleSkipSet wrote. Detecting this shape lets aggregate counts come
 *    out right for old sessions without a data backfill.
 *
 * The legacy heuristic only matches when ALL THREE numeric fields are zero,
 * not just reps — a genuine 0-rep set with non-zero RPE/weight (e.g. user
 * logged a failed lift attempt) is real data and stays counted.
 */
export function isSetSkipped(set: {
  rpe?: number;
  reps?: number;
  weight?: number;
  skipped?: boolean;
}): boolean {
  if (set.skipped === true) return true;
  if (set.skipped === undefined) {
    const zeroReps = (set.reps ?? 0) === 0;
    const zeroRpe = (set.rpe ?? 0) === 0;
    const zeroOrMissingWeight = set.weight === undefined || set.weight === 0;
    return zeroReps && zeroRpe && zeroOrMissingWeight;
  }
  return false;
}

/**
 * One-time migration: reassign sessions saved under the legacy
 * 'default' user_id to the resolved profile user_id.
 *
 * Earlier builds called saveSession() without a userId, so workouts
 * landed under user_id='default' while HomeScreen reads stats from the
 * profile-derived id (e.g. 'default-user'). Without this, weekly
 * counts stay at 0 even though sessions exist.
 */
export async function reassignDefaultSessions(targetUserId: string): Promise<number> {
  if (!targetUserId || targetUserId === 'default') return 0;
  try {
    let updated = 0;
    db.withTransactionSync(() => {
      const stmt = db.prepareSync(
        `UPDATE sessions SET user_id = ? WHERE user_id = 'default'`
      );
      const result = stmt.executeSync([targetUserId]);
      updated = result.changes ?? 0;
      stmt.finalizeSync();
    });
    if (updated > 0) {
      console.log(`🔁 Reassigned ${updated} legacy session(s) from 'default' to '${targetUserId}'`);
    }
    return updated;
  } catch (error) {
    console.error('Failed to reassign legacy sessions:', error);
    return 0;
  }
}

/**
 * Save a completed workout session to SQLite
 */
export async function saveSession(
  sessionData: SessionData,
  userId: string = 'default'
): Promise<void> {
  try {
    db.withTransactionSync(() => {
      const stmt = db.prepareSync(`
        INSERT OR REPLACE INTO sessions (
          id, user_id, plan_id, workout_data, 
          started_at, completed_at, duration_minutes, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.executeSync([
        sessionData.id,
        userId,
        sessionData.planId,
        JSON.stringify(sessionData),
        sessionData.startedAt,
        sessionData.completedAt,
        sessionData.durationMinutes,
        null, // synced_at - will be set when synced to cloud
      ]);

      stmt.finalizeSync();
    });

    console.log(`✅ Session ${sessionData.id} saved to database`);
  } catch (error) {
    console.error('❌ Failed to save session:', error);
    throw error;
  }
}

/**
 * Get all sessions for a user
 */
export async function getSessions(userId: string = 'default'): Promise<SessionData[]> {
  try {
    const stmt = db.prepareSync(`
      SELECT workout_data FROM sessions 
      WHERE user_id = ? 
      ORDER BY completed_at DESC
    `);

    const result = stmt.executeSync([userId]);
    const rows = result.getAllSync() as Array<{ workout_data: string }>;
    stmt.finalizeSync();

    return rows.map(row => JSON.parse(row.workout_data) as SessionData);
  } catch (error) {
    console.error('❌ Failed to get sessions:', error);
    return [];
  }
}

/**
 * Get a specific session by ID
 */
export async function getSessionById(
  sessionId: string,
  userId: string = 'default'
): Promise<SessionData | null> {
  try {
    const stmt = db.prepareSync(`
      SELECT workout_data FROM sessions 
      WHERE id = ? AND user_id = ?
    `);

    const result = stmt.executeSync([sessionId, userId]);
    const rows = result.getAllSync() as Array<{ workout_data: string }>;
    stmt.finalizeSync();

    if (rows.length === 0) return null;
    return JSON.parse(rows[0].workout_data) as SessionData;
  } catch (error) {
    console.error('❌ Failed to get session:', error);
    return null;
  }
}

/**
 * Convert CompletedSet array to SessionData format
 */
export function buildSessionData(
  completedSets: CompletedSet[],
  planId: string,
  workoutDuration: number,
  startedAt: string,
  completedAt: string,
  swappedExercises?: Map<string, string>,
  painFlaggedExercises?: Set<string>,
  workoutName?: string,
  scheduledDayNumber?: number,
): SessionData {
  // Group sets by exercise
  const exerciseMap = new Map<string, SessionData['exercises'][0]>();

  completedSets.forEach(set => {
    if (!exerciseMap.has(set.exerciseId)) {
      exerciseMap.set(set.exerciseId, {
        exerciseId: set.exerciseId,
        sets: [],
        swappedTo: swappedExercises?.get(set.exerciseId) || null,
        painFlagged: painFlaggedExercises?.has(set.exerciseId) || false,
      });
    }

    const exercise = exerciseMap.get(set.exerciseId)!;
    exercise.sets.push({
      rpe: set.rpe,
      reps: set.reps,
      weight: set.weight,
      completedAt: set.completedAt,
      // Only carry the flag through when it's actually true — keeps the
      // saved JSON tidy and makes the field's meaning unambiguous (presence
      // = skipped).
      ...(set.skipped ? { skipped: true } : {}),
    });
  });

  const durationMinutes = Math.round(
    (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000 / 60
  );

  return {
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    planId,
    workoutName,
    scheduledDayNumber,
    workoutDuration,
    exercises: Array.from(exerciseMap.values()),
    startedAt,
    completedAt,
    durationMinutes,
  };
}

