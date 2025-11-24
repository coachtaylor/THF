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
      const profile: Profile = JSON.parse(result.profile_data || '{}');
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
        currentProfile = JSON.parse(existing.profile_data || '{}');
        currentProfile.id = existing.id;
        if (existing.email) currentProfile.email = existing.email;
      } else {
        // Create new profile with required fields
        currentProfile = {
          id: updates.id || 'default',
          user_id: updates.user_id || 'default-user',
          gender_identity: updates.gender_identity || 'nonbinary',
          primary_goal: updates.primary_goal || 'general_fitness',
          fitness_experience: updates.fitness_experience || updates.fitness_level || 'beginner',
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

      // Merge updates
      const updatedProfile: Profile = {
        ...currentProfile,
        ...updates,
        id: updates.id || currentProfile.id || 'default',
      };

      // Save to database
      const profileDataJson = JSON.stringify(updatedProfile);
      const { id, email } = updatedProfile;

      // Use prepared statement pattern for expo-sqlite
      const insertStmt = profileDb.prepareSync(
        `INSERT OR REPLACE INTO profiles_storage (id, email, profile_data, synced_at)
         VALUES (?, ?, ?, ?);`
      );
      insertStmt.executeSync([id, email || null, profileDataJson, updatedProfile.synced_at || null]);
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
