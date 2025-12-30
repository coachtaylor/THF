import { useState, useEffect, useCallback } from 'react';
import { getProfile, updateProfile as updateProfileService, Profile, Surgery } from '../services/storage/profile';
import { migrateOldProfileToNew, needsMigration } from '../utils/profileMigration';

/**
 * Compute hrt_months_duration from hrt_start_date
 * This ensures HRT rules always have accurate duration data
 */
function computeHrtMonthsDuration(profile: Profile): number | undefined {
  if (!profile.on_hrt || !profile.hrt_start_date) {
    return undefined;
  }

  const now = new Date();
  const startDate = new Date(profile.hrt_start_date);

  // Calculate months difference
  const diffTime = now.getTime() - startDate.getTime();
  const diffMonths = Math.floor(diffTime / (30.44 * 24 * 60 * 60 * 1000)); // Average days per month

  return Math.max(0, diffMonths);
}

/**
 * Recalculate weeks_post_op for all surgeries based on their dates
 * This ensures the recovery context is always up-to-date for plan generation
 */
function recalculateSurgeryWeeks(surgeries: Surgery[] | undefined): Surgery[] | undefined {
  if (!surgeries || surgeries.length === 0) return surgeries;

  const now = Date.now();
  return surgeries.map(surgery => {
    if (!surgery.date) return surgery;

    const surgeryDate = new Date(surgery.date);
    const weeksSinceSurgery = Math.floor(
      (now - surgeryDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    // Update weeks_post_op and fully_healed status
    // Generally consider fully healed after 12+ weeks for most surgeries
    const fullyHealed = surgery.fully_healed ?? weeksSinceSurgery >= 12;

    return {
      ...surgery,
      weeks_post_op: weeksSinceSurgery,
      fully_healed: fullyHealed,
    };
  });
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let loadedProfile = await getProfile();

      if (loadedProfile && needsMigration(loadedProfile)) {
        console.log('🔄 Migrating old profile to new structure...');
        const migratedProfile = migrateOldProfileToNew(loadedProfile);
        await updateProfileService(migratedProfile);
        loadedProfile = migratedProfile;
        console.log('✅ Profile migration completed');
      }

      // Recalculate surgery weeks_post_op dynamically
      if (loadedProfile && loadedProfile.surgeries && loadedProfile.surgeries.length > 0) {
        const updatedSurgeries = recalculateSurgeryWeeks(loadedProfile.surgeries);
        if (updatedSurgeries) {
          loadedProfile = {
            ...loadedProfile,
            surgeries: updatedSurgeries,
          };
        }
      }

      // Compute hrt_months_duration dynamically
      if (loadedProfile && loadedProfile.on_hrt && loadedProfile.hrt_start_date) {
        const hrtMonths = computeHrtMonthsDuration(loadedProfile);
        if (hrtMonths !== undefined) {
          loadedProfile = {
            ...loadedProfile,
            hrt_months_duration: hrtMonths,
          };
        }
      }

      setProfile(loadedProfile);
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

