// src/services/autoRegress.ts
import { ExerciseInstance, ExerciseDetail } from '../types/plan';
import { Exercise } from '../types';
import { fetchAllExercises } from './exerciseService';
import { getExerciseDetail } from '../data/exercises';
import { Profile } from './storage/profile';

export interface AutoRegressionResult {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  originalSets: number;
  originalReps: number;
  regressionUsed: string | null;
}

/**
 * Auto-regress an exercise when pain is flagged.
 * 
 * Logic:
 * 1. Fetch ExerciseDetail to get regressions array
 * 2. Find a safer variant (regression) from regressions
 * 3. If no regression available, keep same exercise but reduce volume by 20%
 * 4. Reduce sets/reps by 20% (round down, minimum 1)
 * 
 * @param exercise - The current exercise being performed
 * @param exerciseInstance - The current exercise instance with sets/reps
 * @param profile - User profile (optional, for fetching exercise detail)
 * @returns AutoRegressionResult with new exercise ID and reduced volume
 */
export async function autoRegress(
  exercise: Exercise,
  exerciseInstance: ExerciseInstance,
  profile?: Profile | null
): Promise<AutoRegressionResult> {
  const originalSets = exerciseInstance.sets;
  const originalReps = exerciseInstance.reps;

  // Try to find a regression (safer variant)
  let regressionExercise: Exercise | null = null;
  let regressionUsed: string | null = null;

  // Try to get exercise detail to access regressions
  let exerciseDetail: ExerciseDetail | null = null;
  if (profile) {
    const exerciseIdNum = parseInt(exercise.id, 10);
    if (!isNaN(exerciseIdNum)) {
      try {
        exerciseDetail = await getExerciseDetail(exerciseIdNum, profile);
      } catch (error) {
        console.warn('Failed to fetch exercise detail for regressions:', error);
      }
    }
  }

  // Check for regressions in exercise detail
  const regressions = exerciseDetail?.regressions || [];
  
  if (regressions.length > 0) {
    // Get the first regression (safest variant)
    const regressionSlug = regressions[0];
    
    try {
      // Try to find regression by slug or name
      const allExercises = await fetchAllExercises();
      regressionExercise = allExercises.find(
        (ex) => ex.id === regressionSlug || 
                ex.name.toLowerCase().includes(regressionSlug.toLowerCase()) ||
                ex.id.toString() === regressionSlug ||
                (exerciseDetail && ex.id === exerciseDetail.id.toString())
      ) || null;

      if (regressionExercise) {
        regressionUsed = regressionSlug;
      }
    } catch (error) {
      console.warn('Failed to fetch regression exercise:', error);
    }
  }

  // Calculate 20% volume reduction
  const reducedSets = Math.max(1, Math.floor(originalSets * 0.8));
  const reducedReps = Math.max(1, Math.floor(originalReps * 0.8));

  // Use regression if found, otherwise use original exercise with reduced volume
  const newExerciseId = regressionExercise?.id || exercise.id;
  const newExerciseName = regressionExercise?.name || exercise.name;

  return {
    exerciseId: newExerciseId,
    exerciseName: newExerciseName,
    sets: reducedSets,
    reps: reducedReps,
    originalSets,
    originalReps,
    regressionUsed,
  };
}

/**
 * Get a human-readable description of the auto-regression
 */
export function getAutoRegressionDescription(result: AutoRegressionResult): string {
  if (result.regressionUsed) {
    return `Switched to ${result.exerciseName} (safer variant) and reduced volume by 20%`;
  }
  return `Reduced volume by 20% (${result.originalSets} sets → ${result.sets} sets, ${result.originalReps} reps → ${result.reps} reps)`;
}

