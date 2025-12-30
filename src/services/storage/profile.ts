import * as SQLite from "expo-sqlite";
import { supabase } from "../../utils/supabase";
// Profile and Surgery types are now in src/types/index.ts
export { Profile, Surgery } from "../../types/index";
import type { Profile, Surgery } from "../../types/index";
import { logger } from "../../utils/logger";

// Lazy-initialized database connection for profile storage
// Prevents crash when module is imported before React Native runtime is ready
let profileDb: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!profileDb) {
    profileDb = SQLite.openDatabaseSync("transfitness.db");
  }
  return profileDb;
}

// Ensure profiles table exists with correct schema (stores full profile as JSON)
export async function initProfileStorage(): Promise<void> {
  try {
    getDb().withTransactionSync(() => {
      getDb().execSync(`
        CREATE TABLE IF NOT EXISTS profiles_storage (
          id TEXT PRIMARY KEY,
          email TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          profile_data TEXT,
          synced_at TEXT
        );
      `);
    });
    logger.log("✅ Profile storage initialized");
  } catch (error) {
    console.error("❌ Profile storage initialization failed:", error);
    throw error;
  }
}

// Get current profile
export async function getProfile(): Promise<Profile | null> {
  try {
    type ProfileRow = {
      id: string;
      email: string | null;
      profile_data: string;
      synced_at: string | null;
      created_at: string | null;
    };

    const resultRef: { value: ProfileRow | null } = { value: null };

    getDb().withTransactionSync(() => {
      const stmt = getDb().prepareSync(
        "SELECT id, email, profile_data, synced_at, created_at FROM profiles_storage LIMIT 1;",
      );
      const rows = stmt.executeSync().getAllSync() as any[];
      if (rows.length > 0) {
        resultRef.value = rows[0] as ProfileRow;
      }
      stmt.finalizeSync();
    });

    const result = resultRef.value;
    if (result) {
      const parsed = JSON.parse(result.profile_data || "{}");
      // Convert date strings back to Date objects
      if (parsed.created_at && typeof parsed.created_at === "string") {
        parsed.created_at = new Date(parsed.created_at);
      }
      if (parsed.updated_at && typeof parsed.updated_at === "string") {
        parsed.updated_at = new Date(parsed.updated_at);
      }
      if (parsed.hrt_start_date && typeof parsed.hrt_start_date === "string") {
        parsed.hrt_start_date = new Date(parsed.hrt_start_date);
      }
      if (parsed.date_of_birth && typeof parsed.date_of_birth === "string") {
        parsed.date_of_birth = new Date(parsed.date_of_birth);
      }
      if (
        parsed.hrt_injection_start_date &&
        typeof parsed.hrt_injection_start_date === "string"
      ) {
        parsed.hrt_injection_start_date = new Date(
          parsed.hrt_injection_start_date,
        );
      }
      const profile: Profile = parsed as Profile;
      // Ensure required fields are set from row data
      profile.id = result.id;
      if (result.email) profile.email = result.email;
      if (result.synced_at) profile.synced_at = result.synced_at;
      if (result.created_at) profile.created_at = new Date(result.created_at);
      return profile;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting profile:", error);
    // Return null instead of throwing to prevent app crashes on corrupted data
    return null;
  }
}

// Update profile (merge with existing profile)
export async function updateProfile(updates: Partial<Profile>): Promise<void> {
  try {
    getDb().withTransactionSync(() => {
      // Get current profile or create new one
      let existing: {
        id: string;
        email: string | null;
        profile_data: string;
      } | null = null;
      const selectStmt = getDb().prepareSync(
        "SELECT id, email, profile_data FROM profiles_storage LIMIT 1;",
      );
      const rows = selectStmt.executeSync().getAllSync() as Array<{
        id: string;
        email: string | null;
        profile_data: string;
      }>;
      if (rows.length > 0) {
        existing = rows[0];
      }
      selectStmt.finalizeSync();

      let currentProfile: Profile;
      if (existing) {
        const parsed = JSON.parse(existing.profile_data || "{}");
        // Convert date strings back to Date objects
        if (parsed.created_at && typeof parsed.created_at === "string") {
          parsed.created_at = new Date(parsed.created_at);
        }
        if (parsed.updated_at && typeof parsed.updated_at === "string") {
          parsed.updated_at = new Date(parsed.updated_at);
        }
        if (
          parsed.hrt_start_date &&
          typeof parsed.hrt_start_date === "string"
        ) {
          parsed.hrt_start_date = new Date(parsed.hrt_start_date);
        }
        if (parsed.date_of_birth && typeof parsed.date_of_birth === "string") {
          parsed.date_of_birth = new Date(parsed.date_of_birth);
        }
        if (
          parsed.hrt_injection_start_date &&
          typeof parsed.hrt_injection_start_date === "string"
        ) {
          parsed.hrt_injection_start_date = new Date(
            parsed.hrt_injection_start_date,
          );
        }
        currentProfile = parsed as Profile;
        currentProfile.id = existing.id;
        if (existing.email) currentProfile.email = existing.email;
      } else {
        // Create new profile with required fields
        currentProfile = {
          id: updates.id || "default",
          user_id: updates.user_id || "default-user",
          gender_identity: updates.gender_identity || "nonbinary",
          primary_goal: updates.primary_goal || "general_fitness",
          fitness_experience: (updates.fitness_experience ||
            updates.fitness_level ||
            "beginner") as "beginner" | "intermediate" | "advanced",
          workout_frequency: updates.workout_frequency ?? 3,
          session_duration: updates.session_duration ?? 30,
          binds_chest: updates.binds_chest ?? false,
          on_hrt: updates.on_hrt ?? false,
          surgeries: updates.surgeries || [],
          equipment: updates.equipment || [],
          created_at: new Date(),
          updated_at: new Date(),
          email: updates.email || "",
        };
      }

      // Merge updates - ALWAYS update the updated_at timestamp
      const updatedProfile: Profile = {
        ...currentProfile,
        ...updates,
        id: updates.id || currentProfile.id || "default",
        updated_at: new Date(), // Always update this timestamp
      };

      // Convert Date objects to ISO strings for JSON storage
      const profileDataJson = JSON.stringify(updatedProfile, (key, value) => {
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      });
      // Use prepared statement pattern for expo-sqlite
      const insertStmt = getDb().prepareSync(
        `INSERT OR REPLACE INTO profiles_storage (id, email, profile_data, synced_at)
         VALUES (?, ?, ?, ?);`,
      );
      const idValue: string = updatedProfile.id || "default";
      const emailValue: string | null = updatedProfile.email
        ? String(updatedProfile.email)
        : null;
      const syncedAtValue: string | null = updatedProfile.synced_at
        ? String(updatedProfile.synced_at)
        : null;
      insertStmt.executeSync([
        idValue,
        emailValue,
        profileDataJson,
        syncedAtValue,
      ]);
      insertStmt.finalizeSync();

      logger.log("✅ Profile updated:", updatedProfile);
    });
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    throw error;
  }
}

// Sync profile to Supabase (optional cloud sync)
export async function syncProfileToCloud(profile: Profile): Promise<void> {
  if (!profile.cloud_sync_enabled) {
    logger.log("Cloud sync disabled, skipping");
    return;
  }

  if (!supabase) {
    console.warn("⚠️ Supabase not configured - cannot sync to cloud");
    return;
  }

  try {
    const { error } = await supabase.from("profiles").upsert({
      id: profile.id,
      email: profile.email || null,
      profile: profile,
    });

    if (error) {
      console.error("❌ Supabase sync error:", error);
      throw error;
    }

    // Update synced_at timestamp locally
    await updateProfile({
      ...profile,
      synced_at: new Date().toISOString(),
    });

    logger.log("✅ Profile synced to Supabase");
  } catch (error) {
    console.error("❌ Error syncing profile to cloud:", error);
    throw error;
  }
}

/**
 * Log equipment request to Supabase for product analytics
 * This helps identify popular equipment types to add to the app
 * Fire-and-forget: errors are logged but don't block the UI
 */
export async function logEquipmentRequest(
  equipmentText: string,
): Promise<void> {
  if (!supabase) {
    logger.log("Supabase not configured, skipping equipment request log");
    return;
  }

  try {
    // Get current user ID if available
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("equipment_requests").insert({
      equipment_text: equipmentText,
      user_id: user?.id || null,
    });

    if (error) {
      console.warn("Failed to log equipment request:", error.message);
    } else {
      logger.log("✅ Equipment request logged for analytics");
    }
  } catch (error) {
    console.warn("Error logging equipment request:", error);
  }
}

// Add this function to inspect the database
export async function debugProfileStorage(): Promise<void> {
  try {
    getDb().withTransactionSync(() => {
      // Check profiles_storage table
      const stmt = getDb().prepareSync(
        "SELECT id, email, created_at, profile_data FROM profiles_storage;",
      );
      const rows = stmt.executeSync().getAllSync() as any[];

      logger.log(`📊 Found ${rows.length} profile(s) in profiles_storage:`);
      rows.forEach((row, index) => {
        logger.log(`\nProfile ${index + 1}:`);
        logger.log(`  ID: ${row.id}`);
        logger.log(`  Email: ${row.email || "none"}`);
        logger.log(`  Created: ${row.created_at}`);
        logger.log(
          `  Data: ${row.profile_data ? JSON.parse(row.profile_data) : "empty"}`,
        );
      });
      stmt.finalizeSync();
    });
  } catch (error) {
    console.error("❌ Error checking profile storage:", error);
  }
}

/**
 * Delete the current profile (resets onboarding status)
 * After calling this, restart the app to see onboarding again
 */
export async function deleteProfile(): Promise<void> {
  try {
    getDb().withTransactionSync(() => {
      const deleteStmt = getDb().prepareSync("DELETE FROM profiles_storage;");
      deleteStmt.executeSync();
      deleteStmt.finalizeSync();
    });
    logger.log("✅ Profile deleted - onboarding will reset on next app start");
  } catch (error) {
    console.error("❌ Error deleting profile:", error);
    throw error;
  }
}
