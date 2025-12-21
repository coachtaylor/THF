// Cloud Sync Service for TransFitness
// Handles background syncing of local data to Supabase

import { AppState, AppStateStatus } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { supabase } from '../../utils/supabase';
import { getProfile, syncProfileToCloud } from './profile';
import { logger } from '../../utils/logger';
import { notifySyncError } from '../../utils/toast';

const db = SQLite.openDatabaseSync('transfitness.db');

// Sync status tracking
let isSyncing = false;
let lastSyncAttempt: Date | null = null;
let syncErrors: string[] = [];

export interface SyncResult {
  success: boolean;
  profileSynced: boolean;
  sessionsSynced: number;
  plansSynced: number;
  errors: string[];
}

/**
 * Initialize sync service with AppState listener
 * Syncs data when app comes to foreground
 */
export function initSyncService(): () => void {
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // App came to foreground - trigger sync
      syncToCloud().catch((error) => {
        console.error('Background sync failed:', error);
      });
    }
  };

  const subscription = AppState.addEventListener('change', handleAppStateChange);

  // Initial sync on startup
  syncToCloud().catch((error) => {
    console.error('Initial sync failed:', error);
  });

  return () => {
    subscription.remove();
  };
}

/**
 * Sync all unsynced data to cloud
 */
export async function syncToCloud(): Promise<SyncResult> {
  // Prevent concurrent syncs
  if (isSyncing) {
    if (__DEV__) {
      console.log('☁️ Sync already in progress, skipping');
    }
    return {
      success: false,
      profileSynced: false,
      sessionsSynced: 0,
      plansSynced: 0,
      errors: ['Sync already in progress'],
    };
  }

  // Check if we have a valid Supabase session
  if (!supabase) {
    return {
      success: false,
      profileSynced: false,
      sessionsSynced: 0,
      plansSynced: 0,
      errors: ['Supabase not configured'],
    };
  }

  isSyncing = true;
  lastSyncAttempt = new Date();
  syncErrors = [];

  const result: SyncResult = {
    success: true,
    profileSynced: false,
    sessionsSynced: 0,
    plansSynced: 0,
    errors: [],
  };

  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      if (__DEV__) {
        console.log('☁️ No auth session, skipping sync');
      }
      result.errors.push('No auth session');
      return result;
    }

    if (__DEV__) {
      console.log('☁️ Starting cloud sync...');
    }

    // Sync profile
    try {
      const profile = await getProfile();
      if (profile && !profile.synced_at) {
        await syncProfileToCloud(profile);
        result.profileSynced = true;
        if (__DEV__) {
          console.log('☁️ Profile synced');
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Profile sync failed';
      result.errors.push(errorMsg);
      console.error('☁️ Profile sync error:', error);
    }

    // Sync unsynced sessions
    try {
      const sessionsSynced = await syncUnsyncedSessions(session.user.id);
      result.sessionsSynced = sessionsSynced;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Sessions sync failed';
      result.errors.push(errorMsg);
      console.error('☁️ Sessions sync error:', error);
    }

    // Sync unsynced plans
    try {
      const plansSynced = await syncUnsyncedPlans(session.user.id);
      result.plansSynced = plansSynced;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Plans sync failed';
      result.errors.push(errorMsg);
      console.error('☁️ Plans sync error:', error);
    }

    result.success = result.errors.length === 0;

    // Notify user if sync failed (only on explicit sync, not background)
    if (!result.success && result.errors.length > 0) {
      syncErrors = result.errors;
    }

    if (__DEV__) {
      console.log('☁️ Sync complete:', result);
    }
  } catch (error) {
    result.success = false;
    const errorMsg = error instanceof Error ? error.message : 'Sync failed';
    result.errors.push(errorMsg);
    console.error('☁️ Sync error:', error);
  } finally {
    isSyncing = false;
  }

  return result;
}

/**
 * Sync unsynced workout sessions to cloud
 */
async function syncUnsyncedSessions(userId: string): Promise<number> {
  let syncedCount = 0;

  try {
    // Get unsynced sessions
    const stmt = db.prepareSync(
      'SELECT * FROM sessions WHERE synced_at IS NULL LIMIT 50;'
    );
    const unsyncedSessions = stmt.executeSync().getAllSync() as Array<{
      id: string;
      user_id: string;
      plan_id: string;
      workout_data: string;
      started_at: string;
      completed_at: string;
      duration_minutes: number;
    }>;
    stmt.finalizeSync();

    if (unsyncedSessions.length === 0) {
      return 0;
    }

    // Sync each session
    for (const session of unsyncedSessions) {
      try {
        const { error } = await supabase.from('workout_sessions').upsert({
          id: session.id,
          user_id: userId,
          plan_id: session.plan_id,
          workout_data: session.workout_data,
          started_at: session.started_at,
          completed_at: session.completed_at,
          duration_minutes: session.duration_minutes,
          synced_at: new Date().toISOString(),
        });

        if (error) {
          console.error('Session sync error:', error);
          continue;
        }

        // Mark as synced locally
        const updateStmt = db.prepareSync(
          'UPDATE sessions SET synced_at = ? WHERE id = ?;'
        );
        updateStmt.executeSync([new Date().toISOString(), session.id]);
        updateStmt.finalizeSync();

        syncedCount++;
      } catch (error) {
        console.error('Error syncing session:', session.id, error);
      }
    }
  } catch (error) {
    // Table might not exist yet
    if (__DEV__) {
      console.log('☁️ Sessions table may not exist:', error);
    }
  }

  return syncedCount;
}

/**
 * Sync unsynced workout plans to cloud
 */
async function syncUnsyncedPlans(userId: string): Promise<number> {
  let syncedCount = 0;

  try {
    // Get unsynced plans
    const stmt = db.prepareSync(
      'SELECT * FROM plans WHERE synced_at IS NULL LIMIT 10;'
    );
    const unsyncedPlans = stmt.executeSync().getAllSync() as Array<{
      id: string;
      user_id: string;
      block_length: number;
      start_date: string;
      goals: string;
      goal_weighting: string;
      plan_data: string;
    }>;
    stmt.finalizeSync();

    if (unsyncedPlans.length === 0) {
      return 0;
    }

    // Sync each plan
    for (const plan of unsyncedPlans) {
      try {
        const { error } = await supabase.from('workout_plans').upsert({
          id: plan.id,
          user_id: userId,
          block_length: plan.block_length,
          start_date: plan.start_date,
          goals: plan.goals,
          goal_weighting: plan.goal_weighting,
          plan_data: plan.plan_data,
          synced_at: new Date().toISOString(),
        });

        if (error) {
          console.error('Plan sync error:', error);
          continue;
        }

        // Mark as synced locally
        const updateStmt = db.prepareSync(
          'UPDATE plans SET synced_at = ? WHERE id = ?;'
        );
        updateStmt.executeSync([new Date().toISOString(), plan.id]);
        updateStmt.finalizeSync();

        syncedCount++;
      } catch (error) {
        console.error('Error syncing plan:', plan.id, error);
      }
    }
  } catch (error) {
    // Table might not exist yet
    if (__DEV__) {
      console.log('☁️ Plans table may not exist:', error);
    }
  }

  return syncedCount;
}

/**
 * Get sync status
 */
export function getSyncStatus(): {
  isSyncing: boolean;
  lastSyncAttempt: Date | null;
  errors: string[];
} {
  return {
    isSyncing,
    lastSyncAttempt,
    errors: syncErrors,
  };
}

/**
 * Force immediate sync with user notification
 */
export async function forceSyncNow(): Promise<SyncResult> {
  const result = await syncToCloud();

  // Notify user of sync failure on explicit sync request
  if (!result.success && result.errors.length > 0) {
    notifySyncError();
  }

  return result;
}
