import { useState, useEffect } from 'react';
import { getExerciseDetail } from '../data/exercises';
import { ExerciseDetail } from '../types/plan';
import { Profile } from '../services/storage/profile';

/**
 * React hook for loading exercise detail with trans-specific tips.
 * 
 * Automatically fetches exercise detail when both exerciseId and profile are available.
 * Refetches when either exerciseId or profile changes.
 * 
 * @param exerciseId - Numeric ID of the exercise (null to skip fetch)
 * @param profile - User profile for filtering trans tips (null to skip fetch)
 * @returns Object with exercise detail and loading state
 */
export function useExerciseDetail(
  exerciseId: number | null,
  profile: Profile | null
): {
  exercise: ExerciseDetail | null;
  loading: boolean;
} {
  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only fetch if both exerciseId and profile are available
    if (exerciseId === null || profile === null) {
      setExercise(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadExerciseDetail() {
      setLoading(true);

      try {
        const exerciseDetail = await getExerciseDetail(exerciseId, profile);

        // Don't update state if component unmounted or dependency changed
        if (!cancelled) {
          setExercise(exerciseDetail);
        }
      } catch (err) {
        console.error(`Error loading exercise detail for ${exerciseId}:`, err);
        // Don't update state if component unmounted or dependency changed
        if (!cancelled) {
          setExercise(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadExerciseDetail();

    // Cleanup: mark as cancelled if component unmounts or dependencies change
    return () => {
      cancelled = true;
    };
  }, [exerciseId, profile]);

  return {
    exercise,
    loading,
  };
}


