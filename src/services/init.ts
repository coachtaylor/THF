import { initDatabase } from "../utils/database";
import { initProfileStorage } from "./storage/profile";
import { initPlanStorage } from "./storage/plan";
import { initWorkoutLogStorage } from "./storage/workoutLog";
import { initPRStorage } from "./storage/personalRecords";
import { initAnalytics } from "./analytics";
import { initSyncService } from "./storage/sync";

// Cleanup function for sync service
let cleanupSync: (() => void) | null = null;

/**
 * Initialize all app services (database, storage, etc.)
 */
export async function initializeApp(): Promise<void> {
  try {
    await initDatabase();
    await initProfileStorage();
    await initPlanStorage();
    await initWorkoutLogStorage();
    await initPRStorage();
    await initAnalytics();

    // Initialize cloud sync service (starts background sync)
    cleanupSync = initSyncService();

    console.log("✅ App initialization complete");
  } catch (error) {
    console.error("❌ App initialization failed:", error);
    throw error;
  }
}

/**
 * Cleanup function for app teardown
 */
export function cleanupApp(): void {
  if (cleanupSync) {
    cleanupSync();
    cleanupSync = null;
  }
}
