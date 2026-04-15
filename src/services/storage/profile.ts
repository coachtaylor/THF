import * as SQLite from "expo-sqlite";
import { supabase } from "../../utils/supabase";
// Profile and Surgery types are now in src/types/index.ts
export { Profile, Surgery } from "../../types/index";
import type { Profile, Surgery } from "../../types/index";
import { logger } from "../../utils/logger";
import {
  encryptSensitiveFields,
  decryptSensitiveFields,
  PROFILE_FIELD_TYPES,
  clearEncryptionKey,
} from "../../utils/encryption";

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
// SECURITY: Decrypts sensitive health data fields after retrieval
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
      let parsed = JSON.parse(result.profile_data || "{}");

      // SECURITY: Decrypt sensitive fields
      parsed = await decryptSensitiveFields(parsed, PROFILE_FIELD_TYPES);

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
// SECURITY: Encrypts sensitive health data fields before storage
export async function updateProfile(updates: Partial<Profile>): Promise<void> {
  try {
    // Get current profile first (outside transaction for async decryption)
    let existing: {
      id: string;
      email: string | null;
      profile_data: string;
    } | null = null;

    getDb().withTransactionSync(() => {
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
    });

    let currentProfile: Profile;
    if (existing) {
      let parsed = JSON.parse(existing.profile_data || "{}");

      // SECURITY: Decrypt existing data before merging
      parsed = await decryptSensitiveFields(parsed, PROFILE_FIELD_TYPES);

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
    let updatedProfile: Profile = {
      ...currentProfile,
      ...updates,
      id: updates.id || currentProfile.id || "default",
      updated_at: new Date(), // Always update this timestamp
    };

    // Convert Date objects to ISO strings for JSON storage
    const profileForStorage = JSON.parse(JSON.stringify(updatedProfile, (key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }));

    // SECURITY: Encrypt sensitive fields before storage
    const encryptedProfile = await encryptSensitiveFields(profileForStorage);
    const profileDataJson = JSON.stringify(encryptedProfile);

    // Store in database
    getDb().withTransactionSync(() => {
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
    });

    logger.log("✅ Profile updated (encrypted)");
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
    // SECURITY: Re-encrypt sensitive fields before cloud transmission
    // The profile object in memory is decrypted — must encrypt before Supabase upsert
    const encryptedProfile = await encryptSensitiveFields(profile);

    const { error } = await supabase.from("profiles").upsert({
      id: profile.id,
      email: profile.email || null,
      profile: encryptedProfile,
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

    logger.log("✅ Profile synced to Supabase (encrypted)");
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
// SECURITY: Only logs non-sensitive metadata in development builds
export async function debugProfileStorage(): Promise<void> {
  if (!__DEV__) {
    logger.log("Debug function not available in production");
    return;
  }

  try {
    getDb().withTransactionSync(() => {
      // Check profiles_storage table
      const stmt = getDb().prepareSync(
        "SELECT id, created_at FROM profiles_storage;",
      );
      const rows = stmt.executeSync().getAllSync() as any[];

      logger.log(`📊 Found ${rows.length} profile(s) in profiles_storage`);
      rows.forEach((row, index) => {
        logger.log(`\nProfile ${index + 1}:`);
        logger.log(`  ID: ${row.id ? row.id.substring(0, 8) + '...' : 'none'}`);
        logger.log(`  Created: ${row.created_at}`);
      });
      stmt.finalizeSync();
    });
  } catch (error) {
    console.error("❌ Error checking profile storage:", error);
  }
}

/**
 * Delete the current profile from LOCAL storage only (resets onboarding status)
 * After calling this, restart the app to see onboarding again
 * NOTE: For full data deletion including cloud data, use deleteAllUserData()
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

/**
 * Result type for data deletion operations
 */
export interface DataDeletionResult {
  success: boolean;
  localDataDeleted: boolean;
  cloudDataDeleted: boolean;
  authAccountDeleted: boolean;
  errors: string[];
}

/**
 * GDPR/CCPA compliant full data deletion
 *
 * Deletes ALL user data from:
 * 1. Local SQLite database (profiles, sessions, plans, etc.)
 * 2. Supabase cloud tables (profiles, workout_sessions, workout_plans, etc.)
 * 3. Secure storage (auth tokens)
 * 4. Signs out the user
 *
 * IMPORTANT: This action is IRREVERSIBLE. Implement a confirmation flow in the UI.
 *
 * @returns DataDeletionResult with status of each deletion step
 */
export async function deleteAllUserData(): Promise<DataDeletionResult> {
  const result: DataDeletionResult = {
    success: false,
    localDataDeleted: false,
    cloudDataDeleted: false,
    authAccountDeleted: false,
    errors: [],
  };

  try {
    // Step 1: Get current user ID before we start deleting
    let userId: string | null = null;

    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || null;
      } catch (error) {
        logger.log("⚠️ Could not get user ID, continuing with local deletion only");
      }
    }

    // Step 2: Delete cloud data if user is authenticated and supabase is configured
    if (supabase && userId) {
      try {
        const cloudDeletionErrors: string[] = [];

        // Delete from all cloud tables (order matters due to potential foreign keys)
        const tablesToDelete = [
          'rules_audit_log',      // Safety audit logs
          'feedback_reports',      // User feedback
          'saved_workouts',        // Saved workout favorites
          'workout_sessions',      // Completed workout sessions
          'workout_plans',         // Generated workout plans
          'onboarding_feedback',   // Onboarding survey responses
          'equipment_requests',    // Equipment requests (may have null user_id)
          'profiles',              // User profile (delete last)
        ];

        for (const table of tablesToDelete) {
          try {
            const { error } = await supabase
              .from(table)
              .delete()
              .eq('user_id', userId);

            if (error) {
              // Some tables might use 'id' instead of 'user_id' for the profiles table
              if (table === 'profiles') {
                const { error: profileError } = await supabase
                  .from('profiles')
                  .delete()
                  .eq('id', userId);

                if (profileError) {
                  cloudDeletionErrors.push(`${table}: ${profileError.message}`);
                }
              } else {
                cloudDeletionErrors.push(`${table}: ${error.message}`);
              }
            }
          } catch (tableError) {
            cloudDeletionErrors.push(`${table}: ${String(tableError)}`);
          }
        }

        if (cloudDeletionErrors.length === 0) {
          result.cloudDataDeleted = true;
          logger.log("✅ Cloud data deleted from all tables");
        } else {
          result.errors.push(...cloudDeletionErrors);
          logger.log("⚠️ Some cloud data could not be deleted:", cloudDeletionErrors);
        }
      } catch (cloudError) {
        result.errors.push(`Cloud deletion error: ${String(cloudError)}`);
        console.error("❌ Cloud data deletion failed:", cloudError);
      }

      // Step 3: Delete auth account via Edge Function, then sign out
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const { error: deleteAuthError } = await supabase.functions.invoke('delete-account', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (deleteAuthError) {
            result.errors.push(`Auth account deletion error: ${String(deleteAuthError)}`);
            logger.log("⚠️ Auth account deletion failed, signing out anyway");
          } else {
            result.authAccountDeleted = true;
            logger.log("✅ Auth account permanently deleted via Edge Function");
          }
        }
        await supabase.auth.signOut();
        logger.log("✅ User signed out, auth session cleared");
      } catch (signOutError) {
        result.errors.push(`Sign out error: ${String(signOutError)}`);
      }
    }

    // Step 4: Delete local data (always do this, even if cloud deletion fails)
    try {
      getDb().withTransactionSync(() => {
        // Delete from all local tables
        const stmt = getDb().prepareSync(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
        );
        const tables = stmt.executeSync().getAllSync() as Array<{ name: string }>;
        stmt.finalizeSync();

        for (const { name } of tables) {
          try {
            getDb().execSync(`DELETE FROM ${name};`);
          } catch {
            // Table might not exist or be locked, which is fine
          }
        }
      });

      result.localDataDeleted = true;
      logger.log("✅ Local data deleted from all tables");
    } catch (localError) {
      result.errors.push(`Local deletion error: ${String(localError)}`);
      console.error("❌ Local data deletion failed:", localError);
    }

    // Step 5: Clear secure storage (auth tokens)
    try {
      const { clearTokens } = await import('../auth/tokens');
      await clearTokens();
      logger.log("✅ Auth tokens cleared from secure storage");
    } catch (tokenError) {
      result.errors.push(`Token clearing error: ${String(tokenError)}`);
    }

    // Step 6: Clear encryption key (SECURITY: ensures data cannot be decrypted if remnants remain)
    try {
      await clearEncryptionKey();
      logger.log("✅ Encryption key cleared from secure storage");
    } catch (encryptionError) {
      result.errors.push(`Encryption key clearing error: ${String(encryptionError)}`);
    }

    // Determine overall success
    result.success = result.localDataDeleted && (result.cloudDataDeleted || !supabase);

    if (result.success) {
      logger.log("✅ Full data deletion completed successfully");
    } else {
      logger.log("⚠️ Data deletion completed with some errors:", result.errors);
    }

    return result;
  } catch (error) {
    result.errors.push(`Unexpected error: ${String(error)}`);
    console.error("❌ Data deletion failed:", error);
    return result;
  }
}
