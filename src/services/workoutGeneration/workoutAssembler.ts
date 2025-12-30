// Workout Assembler - Combines all workout sections into final structure
// Orchestrates warm-up, main workout, cool-down, and safety checkpoints

import { Exercise, Profile } from '../../types';
import { DayTemplate, SelectedTemplate } from './templates/types';
import { WarmupCooldownSection } from './warmupCooldown';
import { InjectedCheckpoint } from './checkpointInjection';
import { SafetyContext } from '../rulesEngine/rules/types';
import { ExerciseInstance } from '../../types';

/**
 * Complete assembled workout with all sections
 */
export interface AssembledWorkout {
  workout_name: string;
  estimated_duration_minutes: number;
  warm_up: WarmupCooldownSection;
  main_workout: ExerciseInstance[]; // Exercise prescriptions
  cool_down: WarmupCooldownSection;
  safety_checkpoints: InjectedCheckpoint[];
  metadata: WorkoutMetadata;
}

/**
 * Metadata about the workout generation process
 */
export interface WorkoutMetadata {
  template_name: string;
  day_focus: string;
  user_goal: string;
  hrt_adjusted: boolean;
  rules_applied: string[];
  exercises_excluded_count: number;
  total_exercises: number;
  generation_timestamp: Date;
}

/**
 * Assemble complete workout from all sections
 * Combines warm-up, main workout, cool-down, and safety checkpoints
 * 
 * @param dayTemplate - Day template defining workout structure
 * @param template - Selected template with HRT adjustments
 * @param selectedExercises - Selected exercises (for context)
 * @param prescriptions - Exercise prescriptions (ExerciseInstance[])
 * @param warmup - Warm-up section
 * @param cooldown - Cool-down section
 * @param checkpoints - Safety checkpoints
 * @param safetyContext - Safety context from Rules Engine
 * @param profile - User profile
 * @returns Complete assembled workout
 */
export function assembleWorkout(
  dayTemplate: DayTemplate,
  template: SelectedTemplate,
  selectedExercises: Exercise[],
  prescriptions: ExerciseInstance[],
  warmup: WarmupCooldownSection,
  cooldown: WarmupCooldownSection,
  checkpoints: InjectedCheckpoint[],
  safetyContext: SafetyContext,
  profile: Profile
): AssembledWorkout {
  // Calculate total duration
  const estimatedDuration =
    warmup.total_duration_minutes +
    cooldown.total_duration_minutes +
    estimatePrescriptionsDuration(prescriptions);

  // Generate workout name
  const workoutName = generateWorkoutName(dayTemplate, profile);

  console.log(`\n🎉 Workout assembled: ${workoutName}`);
  console.log(`   Duration: ${estimatedDuration} minutes`);
  console.log(`   Exercises: ${prescriptions.length}`);
  console.log(`   Checkpoints: ${checkpoints.length}`);

  return {
    workout_name: workoutName,
    estimated_duration_minutes: estimatedDuration,
    warm_up: warmup,
    main_workout: prescriptions,
    cool_down: cooldown,
    safety_checkpoints: checkpoints,
    metadata: {
      template_name: template.name,
      day_focus: dayTemplate.focus,
      user_goal: profile.primary_goal,
      hrt_adjusted: template.adjusted_for_hrt,
      rules_applied: safetyContext.rules_applied.map(r => r.rule_id),
      exercises_excluded_count: safetyContext.excluded_exercise_ids.length,
      total_exercises: prescriptions.length,
      generation_timestamp: new Date()
    }
  };
}

/**
 * Estimate total duration of exercise prescriptions
 * Calculates work time + rest time for all exercises
 * 
 * @param prescriptions - Exercise prescriptions with sets, reps, rest
 * @returns Estimated duration in minutes
 */
function estimatePrescriptionsDuration(prescriptions: ExerciseInstance[]): number {
  let totalMinutes = 0;

  for (const p of prescriptions) {
    // Get reps (ExerciseInstance.reps is typed as number)
    const reps = p.reps || 10;

    // Estimate: 3 seconds per rep (conservative estimate)
    const workSeconds = p.sets * reps * 3;
    
    // Rest time: rest_seconds between sets (one less rest than sets)
    const restSeconds = Math.max(0, (p.sets - 1) * p.restSeconds);

    totalMinutes += (workSeconds + restSeconds) / 60;
  }

  return Math.round(totalMinutes);
}

/**
 * Generate descriptive workout name based on template
 *
 * @param dayTemplate - Day template with name and focus
 * @param profile - User profile (unused, kept for API compatibility)
 * @returns Formatted workout name
 */
function generateWorkoutName(dayTemplate: DayTemplate, profile: Profile): string {
  return dayTemplate.name;
}

