// Safety Checkpoint Injection for Trans-Specific Workout Safety
// Injects critical safety reminders (binder breaks, post-op care, etc.) into workouts
// This is CRITICAL for user safety

import { SafetyContext, SafetyCheckpoint } from '../rulesEngine/rules/types';
import { ExerciseInstance } from '../../types';

/**
 * Exercise prescription with timing information for checkpoint calculation
 */
interface ExercisePrescription {
  exercise_name: string;
  sets: number;
  rest_seconds: number;
  reps: number;
}

/**
 * Injected checkpoint with position and timing information
 */
export interface InjectedCheckpoint extends SafetyCheckpoint {
  position: 'before_workout' | 'during_workout' | 'after_workout';
  timing_minutes?: number; // For during-workout checkpoints
}

/**
 * Inject safety checkpoints into workout based on Rules Engine requirements
 * Positions checkpoints strategically (before/during/after) based on trigger type
 * 
 * Example checkpoints:
 * - "Remove binder for 30+ minutes" (after_workout)
 * - "Check incision sites for swelling" (before_workout, if post-op)
 * - "Take scheduled HRT medication" (before_workout)
 * - "Binder break - time to remove for at least 30 minutes" (every_90_minutes)
 * 
 * @param prescriptions - Exercise prescriptions with sets, reps, rest times
 * @param safetyContext - Safety context from Rules Engine with required checkpoints
 * @param totalWorkoutDuration - Total workout duration in minutes
 * @returns Array of injected checkpoints sorted by timing
 */
export function injectSafetyCheckpoints(
  prescriptions: ExercisePrescription[],
  safetyContext: SafetyContext,
  totalWorkoutDuration: number
): InjectedCheckpoint[] {
  const checkpoints: InjectedCheckpoint[] = [];

  // Process each required checkpoint from Rules Engine
  for (const checkpoint of safetyContext.required_checkpoints) {
    const injected = mapCheckpointToPosition(
      checkpoint,
      prescriptions,
      totalWorkoutDuration
    );
    checkpoints.push(injected);
  }

  // Sort by timing (before → during → after)
  checkpoints.sort((a, b) => {
    if (a.position === 'before_workout') return -1;
    if (b.position === 'before_workout') return 1;
    if (a.position === 'after_workout') return 1;
    if (b.position === 'after_workout') return -1;
    return (a.timing_minutes || 0) - (b.timing_minutes || 0);
  });

  console.log(`✅ Injected ${checkpoints.length} safety checkpoints`);
  checkpoints.forEach(cp => {
    const timing = cp.position === 'during_workout' 
      ? `at ${cp.timing_minutes} min` 
      : cp.position.replace('_', ' ');
    console.log(`   • ${cp.message} (${timing})`);
  });

  return checkpoints;
}

/**
 * Map checkpoint trigger to appropriate position and timing
 * 
 * @param checkpoint - Safety checkpoint from Rules Engine
 * @param prescriptions - Exercise prescriptions for timing calculation
 * @param totalDuration - Total workout duration
 * @returns Injected checkpoint with position and timing
 */
function mapCheckpointToPosition(
  checkpoint: SafetyCheckpoint,
  prescriptions: ExercisePrescription[],
  totalDuration: number
): InjectedCheckpoint {
  switch (checkpoint.trigger) {
    case 'every_90_minutes':
      // If workout > 90 min, inject at 90-min mark
      // This is critical for binder safety - users need breaks
      if (totalDuration > 90) {
        return {
          ...checkpoint,
          position: 'during_workout',
          timing_minutes: 90
        };
      } else {
        // Otherwise, remind at end
        return {
          ...checkpoint,
          position: 'after_workout'
        };
      }

    case 'before_cardio':
      // Find first cardio exercise
      // Cardio with binder is particularly risky - need reminder
      const cardioIndex = prescriptions.findIndex(p =>
        p.exercise_name.toLowerCase().includes('cardio') ||
        p.exercise_name.toLowerCase().includes('run') ||
        p.exercise_name.toLowerCase().includes('bike') ||
        p.exercise_name.toLowerCase().includes('jump')
      );

      if (cardioIndex !== -1) {
        const timingMinutes = estimateTimeToExercise(prescriptions, cardioIndex);
        return {
          ...checkpoint,
          position: 'during_workout',
          timing_minutes: timingMinutes
        };
      }

      // If no cardio found, remind before workout starts
      return {
        ...checkpoint,
        position: 'before_workout'
      };

    case 'cool_down':
    case 'workout_completion':
      // Post-workout reminders (scar care, binder removal, etc.)
      return {
        ...checkpoint,
        position: 'after_workout'
      };

    default:
      // Default to before workout for safety
      return {
        ...checkpoint,
        position: 'before_workout'
      };
  }
}

/**
 * Estimate time in minutes until a specific exercise
 * Accounts for warm-up, previous exercises (work + rest time)
 * 
 * @param prescriptions - Exercise prescriptions with timing info
 * @param exerciseIndex - Index of target exercise
 * @returns Estimated time in minutes to reach that exercise
 */
function estimateTimeToExercise(
  prescriptions: ExercisePrescription[],
  exerciseIndex: number
): number {
  let totalMinutes = 5; // Warm-up duration

  // Sum up time for all exercises before target
  for (let i = 0; i < exerciseIndex; i++) {
    const p = prescriptions[i];
    if (!p) continue;

    // Rough estimate: 3 seconds per rep for work time
    // More realistic: assume average tempo, plus rest between sets
    const workTime = (p.sets * p.reps * 3) / 60; // Convert to minutes
    const restTime = (p.sets * p.rest_seconds) / 60; // Convert to minutes
    totalMinutes += workTime + restTime;
  }

  return Math.round(totalMinutes);
}

/**
 * Convert ExerciseInstance array to ExercisePrescription format
 * Helper function to bridge workout generation with checkpoint injection
 * 
 * @param exercises - Exercise instances from workout
 * @param exerciseMap - Map of exercise IDs to exercise names
 * @returns Exercise prescriptions for checkpoint timing calculation
 */
export function convertToPrescriptions(
  exercises: ExerciseInstance[],
  exerciseMap: Map<string, string> // exerciseId -> exerciseName
): ExercisePrescription[] {
  return exercises.map(ex => ({
    exercise_name: exerciseMap.get(ex.exerciseId) || 'Exercise',
    sets: ex.sets,
    rest_seconds: ex.restSeconds,
    reps: typeof ex.reps === 'number' ? ex.reps : 10 // Default if reps is range string
  }));
}

