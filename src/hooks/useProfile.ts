import { useState, useEffect, useCallback } from 'react';
import { getProfile, updateProfile as updateProfileService, Profile } from '../services/storage/profile';
import { migrateOldProfileToNew, needsMigration } from '../utils/profileMigration';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedProfile = await getProfile();
      
      if (loadedProfile && needsMigration(loadedProfile)) {
        console.log('🔄 Migrating old profile to new structure...');
        const migratedProfile = migrateOldProfileToNew(loadedProfile);
        await updateProfileService(migratedProfile);
        setProfile(migratedProfile);
        console.log('✅ Profile migration completed');
      } else {
        setProfile(loadedProfile);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function updateProfile(updates: Partial<Profile>) {
    try {
      setError(null);
      await updateProfileService(updates);
      await loadProfile(); // Reload profile after update
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile: loadProfile,
  };
}

