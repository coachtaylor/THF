import { useState, useEffect, useCallback } from 'react';
import {
  SavedWorkout,
  getSavedWorkouts,
  saveWorkout,
  deleteSavedWorkout,
  isWorkoutSaved,
  findSavedWorkout,
  recordWorkoutUsage,
} from '../services/storage/savedWorkouts';

interface UseSavedWorkoutsReturn {
  savedWorkouts: SavedWorkout[];
  loading: boolean;
  error: string | null;
  save: (workout: {
    planId?: string;
    dayNumber?: number;
    duration: number;
    name: string;
    data: any;
    notes?: string;
  }) => Promise<string>;
  remove: (id: string) => Promise<void>;
  checkIsSaved: (planId: string, dayNumber: number, duration: number) => Promise<boolean>;
  toggleSave: (workout: {
    planId?: string;
    dayNumber?: number;
    duration: number;
    name: string;
    data: any;
  }) => Promise<{ saved: boolean; id?: string }>;
  recordUsage: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useSavedWorkouts(userId: string): UseSavedWorkoutsReturn {
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSavedWorkouts = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const workouts = await getSavedWorkouts(userId);
      setSavedWorkouts(workouts);
    } catch (err) {
      console.error('Failed to load saved workouts:', err);
      setError('Failed to load saved workouts');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSavedWorkouts();
  }, [loadSavedWorkouts]);

  const save = useCallback(
    async (workout: {
      planId?: string;
      dayNumber?: number;
      duration: number;
      name: string;
      data: any;
      notes?: string;
    }) => {
      const id = await saveWorkout(userId, workout);
      await loadSavedWorkouts();
      return id;
    },
    [userId, loadSavedWorkouts]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteSavedWorkout(id);
      await loadSavedWorkouts();
    },
    [loadSavedWorkouts]
  );

  const checkIsSaved = useCallback(
    async (planId: string, dayNumber: number, duration: number) => {
      return isWorkoutSaved(userId, planId, dayNumber, duration);
    },
    [userId]
  );

  const toggleSave = useCallback(
    async (workout: {
      planId?: string;
      dayNumber?: number;
      duration: number;
      name: string;
      data: any;
    }): Promise<{ saved: boolean; id?: string }> => {
      if (!workout.planId || workout.dayNumber === undefined) {
        // Can't toggle without plan details, just save
        const id = await save(workout);
        return { saved: true, id };
      }

      // Check if already saved
      const existing = await findSavedWorkout(
        userId,
        workout.planId,
        workout.dayNumber,
        workout.duration
      );

      if (existing) {
        // Already saved, remove it
        await remove(existing.id);
        return { saved: false };
      } else {
        // Not saved, save it
        const id = await save(workout);
        return { saved: true, id };
      }
    },
    [userId, save, remove]
  );

  const recordUsage = useCallback(async (id: string) => {
    await recordWorkoutUsage(id);
    await loadSavedWorkouts();
  }, [loadSavedWorkouts]);

  return {
    savedWorkouts,
    loading,
    error,
    save,
    remove,
    checkIsSaved,
    toggleSave,
    recordUsage,
    refresh: loadSavedWorkouts,
  };
}
