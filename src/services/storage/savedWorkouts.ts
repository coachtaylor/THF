import { db } from '../../utils/database';
import { supabase } from '../../utils/supabase';

/**
 * Saved workout entry
 */
export interface SavedWorkout {
  id: string;
  user_id: string;
  plan_id?: string;
  day_number?: number;
  duration: number;
  workout_name: string;
  workout_data: any;
  notes?: string;
  saved_at: Date;
  last_used_at?: Date;
  use_count: number;
}

/**
 * Save a workout to favorites
 */
export async function saveWorkout(
  userId: string,
  workout: {
    planId?: string;
    dayNumber?: number;
    duration: number;
    name: string;
    data: any;
    notes?: string;
  }
): Promise<string> {
  const id = `saved_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const savedAt = new Date().toISOString();
  const workoutDataJson = JSON.stringify(workout.data);

  console.log(`💾 Saving workout for user: ${userId}, name: ${workout.name}`);

  try {
    // Save to local SQLite
    db.withTransactionSync(() => {
      const stmt = db.prepareSync(
        `INSERT INTO saved_workouts (
          id, user_id, plan_id, day_number, duration, workout_name, workout_data, notes, saved_at, use_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
      );
      stmt.executeSync([
        id,
        userId,
        workout.planId || null,
        workout.dayNumber || null,
        workout.duration,
        workout.name,
        workoutDataJson,
        workout.notes || null,
        savedAt,
      ]);
      stmt.finalizeSync();
    });

    console.log(`✓ Saved workout: ${id} for user: ${userId}`);

    // Sync to Supabase if available
    if (supabase) {
      try {
        await supabase.from('saved_workouts').insert({
          id,
          user_id: userId,
          plan_id: workout.planId,
          day_number: workout.dayNumber,
          duration: workout.duration,
          workout_name: workout.name,
          workout_data: workout.data,
          notes: workout.notes,
        });
      } catch (error) {
        console.error('Failed to sync saved workout to Supabase:', error);
        // Don't throw - local save succeeded
      }
    }

    return id;
  } catch (error) {
    console.error('❌ Failed to save workout:', error);
    throw error;
  }
}

/**
 * Get all saved workouts for a user
 */
export async function getSavedWorkouts(userId: string): Promise<SavedWorkout[]> {
  console.log(`📖 Getting saved workouts for user: ${userId}`);

  try {
    let workouts: any[] = [];

    db.withTransactionSync(() => {
      const stmt = db.prepareSync(
        `SELECT * FROM saved_workouts
         WHERE user_id = ?
         ORDER BY saved_at DESC`
      );
      workouts = stmt.executeSync([userId]).getAllSync() as any[];
      stmt.finalizeSync();
    });

    console.log(`📖 Found ${workouts.length} saved workouts`);

    return workouts.map((w: any) => ({
      id: w.id,
      user_id: w.user_id,
      plan_id: w.plan_id,
      day_number: w.day_number,
      duration: w.duration,
      workout_name: w.workout_name,
      workout_data: JSON.parse(w.workout_data),
      notes: w.notes,
      saved_at: new Date(w.saved_at),
      last_used_at: w.last_used_at ? new Date(w.last_used_at) : undefined,
      use_count: w.use_count,
    }));
  } catch (error) {
    console.error('❌ Failed to get saved workouts:', error);
    return [];
  }
}

/**
 * Get a single saved workout by ID
 */
export async function getSavedWorkout(id: string): Promise<SavedWorkout | null> {
  try {
    let workout: any = null;

    db.withTransactionSync(() => {
      const stmt = db.prepareSync('SELECT * FROM saved_workouts WHERE id = ?');
      const rows = stmt.executeSync([id]).getAllSync() as any[];
      stmt.finalizeSync();

      if (rows.length > 0) {
        workout = rows[0];
      }
    });

    if (!workout) return null;

    return {
      id: workout.id,
      user_id: workout.user_id,
      plan_id: workout.plan_id,
      day_number: workout.day_number,
      duration: workout.duration,
      workout_name: workout.workout_name,
      workout_data: JSON.parse(workout.workout_data),
      notes: workout.notes,
      saved_at: new Date(workout.saved_at),
      last_used_at: workout.last_used_at ? new Date(workout.last_used_at) : undefined,
      use_count: workout.use_count,
    };
  } catch (error) {
    console.error('❌ Failed to get saved workout:', error);
    return null;
  }
}

/**
 * Delete a saved workout
 */
export async function deleteSavedWorkout(id: string): Promise<void> {
  try {
    db.withTransactionSync(() => {
      const stmt = db.prepareSync('DELETE FROM saved_workouts WHERE id = ?');
      stmt.executeSync([id]);
      stmt.finalizeSync();
    });

    console.log(`✓ Deleted saved workout: ${id}`);

    // Sync to Supabase if available
    if (supabase) {
      try {
        await supabase.from('saved_workouts').delete().eq('id', id);
      } catch (error) {
        console.error('Failed to delete saved workout from Supabase:', error);
      }
    }
  } catch (error) {
    console.error('❌ Failed to delete saved workout:', error);
    throw error;
  }
}

/**
 * Check if a specific workout is saved
 */
export async function isWorkoutSaved(
  userId: string,
  planId: string,
  dayNumber: number,
  duration: number
): Promise<boolean> {
  try {
    let count = 0;

    db.withTransactionSync(() => {
      const stmt = db.prepareSync(
        `SELECT COUNT(*) as count FROM saved_workouts
         WHERE user_id = ? AND plan_id = ? AND day_number = ? AND duration = ?`
      );
      const result = stmt.executeSync([userId, planId, dayNumber, duration]).getFirstSync() as { count: number };
      count = result?.count || 0;
      stmt.finalizeSync();
    });

    return count > 0;
  } catch (error) {
    console.error('❌ Failed to check if workout saved:', error);
    return false;
  }
}

/**
 * Find saved workout by plan details
 */
export async function findSavedWorkout(
  userId: string,
  planId: string,
  dayNumber: number,
  duration: number
): Promise<SavedWorkout | null> {
  try {
    let workout: any = null;

    db.withTransactionSync(() => {
      const stmt = db.prepareSync(
        `SELECT * FROM saved_workouts
         WHERE user_id = ? AND plan_id = ? AND day_number = ? AND duration = ?
         LIMIT 1`
      );
      const rows = stmt.executeSync([userId, planId, dayNumber, duration]).getAllSync() as any[];
      stmt.finalizeSync();

      if (rows.length > 0) {
        workout = rows[0];
      }
    });

    if (!workout) return null;

    return {
      id: workout.id,
      user_id: workout.user_id,
      plan_id: workout.plan_id,
      day_number: workout.day_number,
      duration: workout.duration,
      workout_name: workout.workout_name,
      workout_data: JSON.parse(workout.workout_data),
      notes: workout.notes,
      saved_at: new Date(workout.saved_at),
      last_used_at: workout.last_used_at ? new Date(workout.last_used_at) : undefined,
      use_count: workout.use_count,
    };
  } catch (error) {
    console.error('❌ Failed to find saved workout:', error);
    return null;
  }
}

/**
 * Record workout usage (for sorting by frequently used)
 */
export async function recordWorkoutUsage(id: string): Promise<void> {
  const now = new Date().toISOString();

  try {
    db.withTransactionSync(() => {
      const stmt = db.prepareSync(
        `UPDATE saved_workouts
         SET use_count = use_count + 1, last_used_at = ?
         WHERE id = ?`
      );
      stmt.executeSync([now, id]);
      stmt.finalizeSync();
    });

    console.log(`✓ Recorded usage for saved workout: ${id}`);

    // Sync to Supabase if available
    if (supabase) {
      try {
        await supabase
          .from('saved_workouts')
          .update({ use_count: supabase.rpc('increment_use_count'), last_used_at: now })
          .eq('id', id);
      } catch (error) {
        // Supabase may not support increment function, fallback
        console.log('Note: Supabase increment not available, skipping sync');
      }
    }
  } catch (error) {
    console.error('❌ Failed to record workout usage:', error);
    throw error;
  }
}

/**
 * Update saved workout notes
 */
export async function updateSavedWorkoutNotes(id: string, notes: string): Promise<void> {
  try {
    db.withTransactionSync(() => {
      const stmt = db.prepareSync('UPDATE saved_workouts SET notes = ? WHERE id = ?');
      stmt.executeSync([notes, id]);
      stmt.finalizeSync();
    });

    console.log(`✓ Updated notes for saved workout: ${id}`);

    if (supabase) {
      try {
        await supabase.from('saved_workouts').update({ notes }).eq('id', id);
      } catch (error) {
        console.error('Failed to sync notes update to Supabase:', error);
      }
    }
  } catch (error) {
    console.error('❌ Failed to update saved workout notes:', error);
    throw error;
  }
}
