// Cloud Sync Service for TransFitness
// Handles background syncing of local data to Supabase
// Includes exponential backoff retry logic for failed syncs

import { AppState, AppStateStatus } from "react-native";
import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../utils/supabase";
import { getProfile, syncProfileToCloud } from "./profile";
import { logger } from "../../utils/logger";
import { notifySyncError } from "../../utils/toast";
import { syncAllUnsyncedFeedback } from "../feedback/feedbackReport";

// Lazy-initialized database connection
// Prevents crash when module is imported before React Native runtime is ready
let _syncDb: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!_syncDb) {
    _syncDb = SQLite.openDatabaseSync("transfitness.db");
  }
  return _syncDb;
}

// Sync status tracking
let isSyncing = false;
let lastSyncAttempt: Date | null = null;
let syncErrors: string[] = [];

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 5,
  baseDelayMs: 1000, // 1 second
  maxDelayMs: 32000, // 32 seconds (1 + 2 + 4 + 8 + 16 = 31, capped at 32)
};

// Retry queue stored in AsyncStorage
const RETRY_QUEUE_KEY = "@transfitness/sync_retry_queue";
const RETRY_COUNT_KEY = "@transfitness/sync_retry_count";

interface RetryQueueItem {
  type: "session" | "plan" | "profile" | "feedback";
  id: string;
  data: any;
  addedAt: string;
  retryCount: number;
}

// Track pending items for UI status
let pendingSyncCount = 0;
let retryTimeoutId: ReturnType<typeof setTimeout> | null = null;
let consecutiveFailures = 0;

export interface SyncResult {
  success: boolean;
  profileSynced: boolean;
  sessionsSynced: number;
  plansSynced: number;
  feedbackSynced: number;
  pendingRetries: number;
  errors: string[];
}

// ============================================
// RETRY QUEUE MANAGEMENT
// ============================================

/**
 * Load retry queue from AsyncStorage
 */
async function loadRetryQueue(): Promise<RetryQueueItem[]> {
  try {
    const queueJson = await AsyncStorage.getItem(RETRY_QUEUE_KEY);
    if (queueJson) {
      return JSON.parse(queueJson);
    }
  } catch (error) {
    console.error("Failed to load retry queue:", error);
  }
  return [];
}

/**
 * Save retry queue to AsyncStorage
 */
async function saveRetryQueue(queue: RetryQueueItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(queue));
    pendingSyncCount = queue.length;
  } catch (error) {
    console.error("Failed to save retry queue:", error);
  }
}

/**
 * Add item to retry queue
 */
async function addToRetryQueue(
  item: Omit<RetryQueueItem, "addedAt" | "retryCount">,
): Promise<void> {
  const queue = await loadRetryQueue();

  // Check if item already exists in queue
  const existingIndex = queue.findIndex(
    (q) => q.type === item.type && q.id === item.id,
  );
  if (existingIndex >= 0) {
    // Increment retry count for existing item
    queue[existingIndex].retryCount++;
    queue[existingIndex].data = item.data; // Update with latest data
  } else {
    // Add new item
    queue.push({
      ...item,
      addedAt: new Date().toISOString(),
      retryCount: 0,
    });
  }

  await saveRetryQueue(queue);

  if (__DEV__) {
    console.log(
      `☁️ Added to retry queue: ${item.type}/${item.id}. Queue size: ${queue.length}`,
    );
  }
}

/**
 * Remove item from retry queue after successful sync
 */
async function removeFromRetryQueue(type: string, id: string): Promise<void> {
  const queue = await loadRetryQueue();
  const filtered = queue.filter((q) => !(q.type === type && q.id === id));
  await saveRetryQueue(filtered);
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(retryCount: number): number {
  const delay = RETRY_CONFIG.baseDelayMs * Math.pow(2, retryCount);
  return Math.min(delay, RETRY_CONFIG.maxDelayMs);
}

/**
 * Process items in retry queue with exponential backoff
 */
async function processRetryQueue(userId: string): Promise<number> {
  const queue = await loadRetryQueue();
  if (queue.length === 0) return 0;

  if (__DEV__) {
    console.log(`☁️ Processing retry queue: ${queue.length} items`);
  }

  let successCount = 0;
  const updatedQueue: RetryQueueItem[] = [];

  for (const item of queue) {
    // Skip items that have exceeded max retries
    if (item.retryCount >= RETRY_CONFIG.maxRetries) {
      if (__DEV__) {
        console.log(
          `☁️ Max retries exceeded for ${item.type}/${item.id}, removing from queue`,
        );
      }
      continue; // Don't add to updated queue - item will be dropped
    }

    try {
      let success = false;

      switch (item.type) {
        case "session":
          success = await retrySyncSession(userId, item);
          break;
        case "plan":
          success = await retrySyncPlan(userId, item);
          break;
        case "profile":
          success = await retrySyncProfile(item);
          break;
        // Feedback handled separately
      }

      if (success) {
        successCount++;
        consecutiveFailures = 0;
      } else {
        // Add back to queue with incremented retry count
        updatedQueue.push({
          ...item,
          retryCount: item.retryCount + 1,
        });
      }
    } catch (error) {
      // Add back to queue for retry
      updatedQueue.push({
        ...item,
        retryCount: item.retryCount + 1,
      });
    }
  }

  await saveRetryQueue(updatedQueue);

  // Schedule next retry if there are still items in queue
  if (updatedQueue.length > 0) {
    const nextRetryDelay = calculateBackoffDelay(consecutiveFailures);
    consecutiveFailures++;

    if (__DEV__) {
      console.log(
        `☁️ Scheduling retry in ${nextRetryDelay}ms. Failures: ${consecutiveFailures}`,
      );
    }

    // Clear existing timeout if any
    if (retryTimeoutId) {
      clearTimeout(retryTimeoutId);
    }

    retryTimeoutId = setTimeout(() => {
      syncToCloud().catch(console.error);
    }, nextRetryDelay);

    // Notify user after 3 consecutive failures
    if (consecutiveFailures >= 3) {
      notifySyncError();
    }
  }

  return successCount;
}

/**
 * Retry syncing a single session
 */
async function retrySyncSession(
  userId: string,
  item: RetryQueueItem,
): Promise<boolean> {
  try {
    const { error } = await supabase.from("workout_sessions").upsert({
      ...item.data,
      user_id: userId,
      synced_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Retry session sync error:", error);
      return false;
    }

    // Mark as synced locally
    const updateStmt = getDb().prepareSync(
      "UPDATE sessions SET synced_at = ? WHERE id = ?;",
    );
    updateStmt.executeSync([new Date().toISOString(), item.id]);
    updateStmt.finalizeSync();

    await removeFromRetryQueue("session", item.id);
    return true;
  } catch (error) {
    console.error("Retry session sync failed:", error);
    return false;
  }
}

/**
 * Retry syncing a single plan
 */
async function retrySyncPlan(
  userId: string,
  item: RetryQueueItem,
): Promise<boolean> {
  try {
    const { error } = await supabase.from("workout_plans").upsert({
      ...item.data,
      user_id: userId,
      synced_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Retry plan sync error:", error);
      return false;
    }

    // Mark as synced locally
    const updateStmt = getDb().prepareSync(
      "UPDATE plans SET synced_at = ? WHERE id = ?;",
    );
    updateStmt.executeSync([new Date().toISOString(), item.id]);
    updateStmt.finalizeSync();

    await removeFromRetryQueue("plan", item.id);
    return true;
  } catch (error) {
    console.error("Retry plan sync failed:", error);
    return false;
  }
}

/**
 * Retry syncing profile
 */
async function retrySyncProfile(item: RetryQueueItem): Promise<boolean> {
  try {
    await syncProfileToCloud(item.data);
    await removeFromRetryQueue("profile", item.id);
    return true;
  } catch (error) {
    console.error("Retry profile sync failed:", error);
    return false;
  }
}

/**
 * Initialize sync service with AppState listener
 * Syncs data when app comes to foreground
 */
export function initSyncService(): () => void {
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === "active") {
      // App came to foreground - trigger sync
      syncToCloud().catch((error) => {
        console.error("Background sync failed:", error);
      });
    }
  };

  const subscription = AppState.addEventListener(
    "change",
    handleAppStateChange,
  );

  // Initial sync on startup
  syncToCloud().catch((error) => {
    console.error("Initial sync failed:", error);
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
      console.log("☁️ Sync already in progress, skipping");
    }
    const retryQueue = await loadRetryQueue();
    return {
      success: false,
      profileSynced: false,
      sessionsSynced: 0,
      plansSynced: 0,
      feedbackSynced: 0,
      pendingRetries: retryQueue.length,
      errors: ["Sync already in progress"],
    };
  }

  // Check if we have a valid Supabase session
  if (!supabase) {
    return {
      success: false,
      profileSynced: false,
      sessionsSynced: 0,
      plansSynced: 0,
      feedbackSynced: 0,
      pendingRetries: 0,
      errors: ["Supabase not configured"],
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
    feedbackSynced: 0,
    pendingRetries: 0,
    errors: [],
  };

  try {
    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      if (__DEV__) {
        console.log("☁️ No auth session, skipping sync");
      }
      result.errors.push("No auth session");
      return result;
    }

    if (__DEV__) {
      console.log("☁️ Starting cloud sync...");
    }

    // First, process any items in the retry queue
    const retriedCount = await processRetryQueue(session.user.id);
    if (retriedCount > 0) {
      if (__DEV__) {
        console.log(`☁️ Retried ${retriedCount} items from queue`);
      }
    }

    // Sync profile
    try {
      const profile = await getProfile();
      if (profile && !profile.synced_at) {
        await syncProfileToCloud(profile);
        result.profileSynced = true;
        consecutiveFailures = 0; // Reset on success
        if (__DEV__) {
          console.log("☁️ Profile synced");
        }
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Profile sync failed";
      result.errors.push(errorMsg);
      console.error("☁️ Profile sync error:", error);
      // Add profile to retry queue
      const profile = await getProfile();
      if (profile) {
        await addToRetryQueue({
          type: "profile",
          id: profile.user_id || "current",
          data: profile,
        });
      }
    }

    // Sync unsynced sessions
    try {
      const sessionsSynced = await syncUnsyncedSessions(session.user.id);
      result.sessionsSynced = sessionsSynced;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Sessions sync failed";
      result.errors.push(errorMsg);
      console.error("☁️ Sessions sync error:", error);
    }

    // Sync unsynced plans
    try {
      const plansSynced = await syncUnsyncedPlans(session.user.id);
      result.plansSynced = plansSynced;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Plans sync failed";
      result.errors.push(errorMsg);
      console.error("☁️ Plans sync error:", error);
    }

    // Sync unsynced feedback reports
    try {
      const feedbackSynced = await syncAllUnsyncedFeedback(session.user.id);
      result.feedbackSynced = feedbackSynced;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Feedback sync failed";
      result.errors.push(errorMsg);
      console.error("☁️ Feedback sync error:", error);
    }

    // Get current retry queue size
    const retryQueue = await loadRetryQueue();
    result.pendingRetries = retryQueue.length;

    result.success = result.errors.length === 0 && result.pendingRetries === 0;

    // Notify user if sync failed (only on explicit sync, not background)
    if (!result.success && result.errors.length > 0) {
      syncErrors = result.errors;
    }

    if (__DEV__) {
      console.log("☁️ Sync complete:", result);
    }
  } catch (error) {
    result.success = false;
    const errorMsg = error instanceof Error ? error.message : "Sync failed";
    result.errors.push(errorMsg);
    console.error("☁️ Sync error:", error);
  } finally {
    isSyncing = false;
  }

  return result;
}

/**
 * Sync unsynced workout sessions to cloud
 * Adds failed syncs to retry queue for exponential backoff
 */
async function syncUnsyncedSessions(userId: string): Promise<number> {
  let syncedCount = 0;

  try {
    // Get unsynced sessions
    const stmt = getDb().prepareSync(
      "SELECT * FROM sessions WHERE synced_at IS NULL LIMIT 50;",
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
        const { error } = await supabase.from("workout_sessions").upsert({
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
          console.error("Session sync error:", error);
          // Add to retry queue instead of just continuing
          await addToRetryQueue({
            type: "session",
            id: session.id,
            data: {
              id: session.id,
              plan_id: session.plan_id,
              workout_data: session.workout_data,
              started_at: session.started_at,
              completed_at: session.completed_at,
              duration_minutes: session.duration_minutes,
            },
          });
          continue;
        }

        // Mark as synced locally
        const updateStmt = getDb().prepareSync(
          "UPDATE sessions SET synced_at = ? WHERE id = ?;",
        );
        updateStmt.executeSync([new Date().toISOString(), session.id]);
        updateStmt.finalizeSync();

        syncedCount++;
        consecutiveFailures = 0; // Reset on any success
      } catch (error) {
        console.error("Error syncing session:", session.id, error);
        // Add to retry queue on any error
        await addToRetryQueue({
          type: "session",
          id: session.id,
          data: {
            id: session.id,
            plan_id: session.plan_id,
            workout_data: session.workout_data,
            started_at: session.started_at,
            completed_at: session.completed_at,
            duration_minutes: session.duration_minutes,
          },
        });
      }
    }
  } catch (error) {
    // Table might not exist yet
    if (__DEV__) {
      console.log("☁️ Sessions table may not exist:", error);
    }
  }

  return syncedCount;
}

/**
 * Sync unsynced workout plans to cloud
 * Adds failed syncs to retry queue for exponential backoff
 */
async function syncUnsyncedPlans(userId: string): Promise<number> {
  let syncedCount = 0;

  try {
    // Get unsynced plans
    const stmt = getDb().prepareSync(
      "SELECT * FROM plans WHERE synced_at IS NULL LIMIT 10;",
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
        const { error } = await supabase.from("workout_plans").upsert({
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
          console.error("Plan sync error:", error);
          // Add to retry queue instead of just continuing
          await addToRetryQueue({
            type: "plan",
            id: plan.id,
            data: {
              id: plan.id,
              block_length: plan.block_length,
              start_date: plan.start_date,
              goals: plan.goals,
              goal_weighting: plan.goal_weighting,
              plan_data: plan.plan_data,
            },
          });
          continue;
        }

        // Mark as synced locally
        const updateStmt = getDb().prepareSync(
          "UPDATE plans SET synced_at = ? WHERE id = ?;",
        );
        updateStmt.executeSync([new Date().toISOString(), plan.id]);
        updateStmt.finalizeSync();

        syncedCount++;
        consecutiveFailures = 0; // Reset on any success
      } catch (error) {
        console.error("Error syncing plan:", plan.id, error);
        // Add to retry queue on any error
        await addToRetryQueue({
          type: "plan",
          id: plan.id,
          data: {
            id: plan.id,
            block_length: plan.block_length,
            start_date: plan.start_date,
            goals: plan.goals,
            goal_weighting: plan.goal_weighting,
            plan_data: plan.plan_data,
          },
        });
      }
    }
  } catch (error) {
    // Table might not exist yet
    if (__DEV__) {
      console.log("☁️ Plans table may not exist:", error);
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
  pendingSyncCount: number;
  consecutiveFailures: number;
  errors: string[];
} {
  return {
    isSyncing,
    lastSyncAttempt,
    pendingSyncCount,
    consecutiveFailures,
    errors: syncErrors,
  };
}

/**
 * Get the number of items waiting to be synced
 * Useful for displaying sync status in UI
 */
export async function getPendingSyncCount(): Promise<number> {
  const queue = await loadRetryQueue();
  return queue.length;
}

/**
 * Clear the retry queue (for testing/debugging)
 */
export async function clearRetryQueue(): Promise<void> {
  await saveRetryQueue([]);
  consecutiveFailures = 0;
  if (retryTimeoutId) {
    clearTimeout(retryTimeoutId);
    retryTimeoutId = null;
  }
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
