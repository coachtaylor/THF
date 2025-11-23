// src/services/sessionLogger.ts
import { db } from '../utils/database';
import { CompletedSet } from '../types/session';

export interface SessionData {
  id: string;
  planId: string;
  workoutDuration: number;
  exercises: Array<{
    exerciseId: string;
    sets: Array<{
      rpe: number;
      reps: number;
      completedAt: string;
    }>;
    swappedTo: string | null;
    painFlagged: boolean;
  }>;
  startedAt: string;
  completedAt: string;
  durationMinutes: number;
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
  completedAt: string
): SessionData {
  // Group sets by exercise
  const exerciseMap = new Map<string, SessionData['exercises'][0]>();

  completedSets.forEach(set => {
    if (!exerciseMap.has(set.exerciseId)) {
      exerciseMap.set(set.exerciseId, {
        exerciseId: set.exerciseId,
        sets: [],
        swappedTo: null,
        painFlagged: false,
      });
    }

    const exercise = exerciseMap.get(set.exerciseId)!;
    exercise.sets.push({
      rpe: set.rpe,
      reps: set.reps,
      completedAt: set.completedAt,
    });
  });

  const durationMinutes = Math.round(
    (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000 / 60
  );

  return {
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    planId,
    workoutDuration,
    exercises: Array.from(exerciseMap.values()),
    startedAt,
    completedAt,
    durationMinutes,
  };
}

