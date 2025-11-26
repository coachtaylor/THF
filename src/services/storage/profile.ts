import * as SQLite from 'expo-sqlite';
import { supabase } from '../../utils/supabase';
// Profile and Surgery types are now in src/types/index.ts
export { Profile, Surgery } from '../../types/index';
import type { Profile, Surgery } from '../../types/index';

// Open database connection for profile storage
const profileDb = SQLite.openDatabaseSync('transfitness.db');

// Ensure profiles table exists with correct schema (stores full profile as JSON)
export async function initProfileStorage(): Promise<void> {
  try {
    profileDb.withTransactionSync(() => {
      profileDb.execSync(`
        CREATE TABLE IF NOT EXISTS profiles_storage (
          id TEXT PRIMARY KEY,
          email TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          profile_data TEXT,
          synced_at TEXT
        );
      `);
    });
    console.log('✅ Profile storage initialized');
  } catch (error) {
    console.error('❌ Profile storage initialization failed:', error);
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

    profileDb.withTransactionSync(() => {
      const stmt = profileDb.prepareSync(
        'SELECT id, email, profile_data, synced_at, created_at FROM profiles_storage LIMIT 1;'
      );
      const rows = stmt.executeSync().getAllSync() as any[];
      if (rows.length > 0) {
        resultRef.value = rows[0] as ProfileRow;
      }
      stmt.finalizeSync();
    });

    const result = resultRef.value;
    if (result) {
      const parsed = JSON.parse(result.profile_data || '{}');
      // Convert date strings back to Date objects
      if (parsed.created_at && typeof parsed.created_at === 'string') {
        parsed.created_at = new Date(parsed.created_at);
      }
      if (parsed.updated_at && typeof parsed.updated_at === 'string') {
        parsed.updated_at = new Date(parsed.updated_at);
      }
      if (parsed.hrt_start_date && typeof parsed.hrt_start_date === 'string') {
        parsed.hrt_start_date = new Date(parsed.hrt_start_date);
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
    console.error('Error getting profile:', error);
    throw error;
  }
}

// Update profile (merge with existing profile)
export async function updateProfile(updates: Partial<Profile>): Promise<void> {
  try {
    profileDb.withTransactionSync(() => {
      // Get current profile or create new one
      let existing: { id: string; email: string | null; profile_data: string } | null = null;
      const selectStmt = profileDb.prepareSync(
        'SELECT id, email, profile_data FROM profiles_storage LIMIT 1;'
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
        const parsed = JSON.parse(existing.profile_data || '{}');
        // Convert date strings back to Date objects
        if (parsed.created_at && typeof parsed.created_at === 'string') {
          parsed.created_at = new Date(parsed.created_at);
        }
        if (parsed.updated_at && typeof parsed.updated_at === 'string') {
          parsed.updated_at = new Date(parsed.updated_at);
        }
        if (parsed.hrt_start_date && typeof parsed.hrt_start_date === 'string') {
          parsed.hrt_start_date = new Date(parsed.hrt_start_date);
        }
        currentProfile = parsed as Profile;
        currentProfile.id = existing.id;
        if (existing.email) currentProfile.email = existing.email;
      } else {
        // Create new profile with required fields
        currentProfile = {
          id: updates.id || 'default',
          user_id: updates.user_id || 'default-user',
          gender_identity: updates.gender_identity || 'nonbinary',
          primary_goal: updates.primary_goal || 'general_fitness',
          fitness_experience: (updates.fitness_experience || updates.fitness_level || 'beginner') as 'beginner' | 'intermediate' | 'advanced',
          workout_frequency: updates.workout_frequency ?? 3,
          session_duration: updates.session_duration ?? 30,
          binds_chest: updates.binds_chest ?? false,
          on_hrt: updates.on_hrt ?? false,
          surgeries: updates.surgeries || [],
          equipment: updates.equipment || [],
          created_at: new Date(),
          updated_at: new Date(),
          email: updates.email || '',
        };
      }

      // Merge updates - ALWAYS update the updated_at timestamp
      const updatedProfile: Profile = {
        ...currentProfile,
        ...updates,
        id: updates.id || currentProfile.id || 'default',
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
      const insertStmt = profileDb.prepareSync(
        `INSERT OR REPLACE INTO profiles_storage (id, email, profile_data, synced_at)
         VALUES (?, ?, ?, ?);`
      );
      const idValue: string = updatedProfile.id || 'default';
      const emailValue: string | null = updatedProfile.email ? String(updatedProfile.email) : null;
      const syncedAtValue: string | null = updatedProfile.synced_at ? String(updatedProfile.synced_at) : null;
      insertStmt.executeSync([idValue, emailValue, profileDataJson, syncedAtValue]);
      insertStmt.finalizeSync();

      console.log('✅ Profile updated:', updatedProfile);
    });
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    throw error;
  }
}

// Sync profile to Supabase (optional cloud sync)
export async function syncProfileToCloud(profile: Profile): Promise<void> {
  if (!profile.cloud_sync_enabled) {
    console.log('Cloud sync disabled, skipping');
    return;
  }

  if (!supabase) {
    console.warn('⚠️ Supabase not configured - cannot sync to cloud');
    return;
  }

  try {
    const { error } = await supabase.from('profiles').upsert({
      id: profile.id,
      email: profile.email || null,
      profile: profile,
    });

    if (error) {
      console.error('❌ Supabase sync error:', error);
      throw error;
    }

    // Update synced_at timestamp locally
    await updateProfile({
      ...profile,
      synced_at: new Date().toISOString(),
    });

    console.log('✅ Profile synced to Supabase');
  } catch (error) {
    console.error('❌ Error syncing profile to cloud:', error);
    throw error;
  }
}

// Add this function to inspect the database
export async function debugProfileStorage(): Promise<void> {
  try {
    profileDb.withTransactionSync(() => {
      // Check profiles_storage table
      const stmt = profileDb.prepareSync(
        'SELECT id, email, created_at, profile_data FROM profiles_storage;'
      );
      const rows = stmt.executeSync().getAllSync() as any[];
      
      console.log(`📊 Found ${rows.length} profile(s) in profiles_storage:`);
      rows.forEach((row, index) => {
        console.log(`\nProfile ${index + 1}:`);
        console.log(`  ID: ${row.id}`);
        console.log(`  Email: ${row.email || 'none'}`);
        console.log(`  Created: ${row.created_at}`);
        console.log(`  Data: ${row.profile_data ? JSON.parse(row.profile_data) : 'empty'}`);
      });
      stmt.finalizeSync();
    });
  } catch (error) {
    console.error('❌ Error checking profile storage:', error);
  }
}

/**
 * Delete the current profile (resets onboarding status)
 * After calling this, restart the app to see onboarding again
 */
export async function deleteProfile(): Promise<void> {
  try {
    profileDb.withTransactionSync(() => {
      const deleteStmt = profileDb.prepareSync(
        'DELETE FROM profiles_storage;'
      );
      deleteStmt.executeSync();
      deleteStmt.finalizeSync();
    });
    console.log('✅ Profile deleted - onboarding will reset on next app start');
  } catch (error) {
    console.error('❌ Error deleting profile:', error);
    throw error;
  }
}
