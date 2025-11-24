// Database Storage for Assembled Workouts
// Saves complete workout structures to Supabase with full audit trail
// Critical for legal protection, debugging, and user history

import { supabase } from '../../utils/supabase';
import { Profile } from '../../types';
import { AssembledWorkout } from './workoutAssembler';
import { SafetyContext } from '../rulesEngine/rules/types';

/**
 * Save assembled workout to Supabase database with complete audit trail
 * 
 * Creates records in:
 * - workouts: Main workout record with metadata
 * - workout_exercises: Individual exercise prescriptions
 * - rules_audit: Safety rules audit trail (for legal protection)
 * 
 * @param workout - Complete assembled workout structure
 * @param profile - User profile at time of generation
 * @param safetyContext - Safety context from Rules Engine
 * @returns Workout ID from database
 */
export async function saveWorkoutToDatabase(
  workout: AssembledWorkout,
  profile: Profile,
  safetyContext: SafetyContext
): Promise<string> {
  if (!supabase) throw new Error('Supabase not initialized');

  console.log(`\n💾 Saving workout to database...`);

  try {
    // STEP 1: Create workout record
    const { data: workoutData, error: workoutError } = await supabase
      .from('workouts')
      .insert({
        user_id: profile.user_id,
        workout_name: workout.workout_name,
        workout_date: new Date().toISOString().split('T')[0],
        status: 'generated',
        generated_at: new Date().toISOString(),
        user_hrt_months_at_generation: profile.hrt_months_duration,
        user_experience_at_generation: profile.fitness_experience,
        primary_goal_at_generation: profile.primary_goal,
        workout_structure: buildWorkoutStructure(workout),
        total_exercises: workout.main_workout.length,
        estimated_duration_minutes: workout.estimated_duration_minutes,
        safety_rules_applied: {
          rules: safetyContext.rules_applied,
          excluded_count: safetyContext.excluded_exercise_ids.length
        },
        rules_engine_version: '1.0'
      })
      .select()
      .single();

    if (workoutError) {
      console.error('❌ Failed to create workout:', workoutError);
      throw workoutError;
    }

    const workoutId = workoutData.id;
    console.log(`   ✓ Workout record created: ${workoutId}`);

    // STEP 2: Create workout_exercises records
    const exerciseRecords = workout.main_workout.map((prescription, index) => ({
      workout_id: workoutId,
      exercise_id: parseInt(prescription.exerciseId),
      exercise_order: index + 1,
      section: 'main',
      prescribed_sets: prescription.sets,
      prescribed_reps: prescription.reps,
      prescribed_rest_seconds: prescription.restSeconds,
      prescribed_weight: prescription.weight_guidance || null,
      format: prescription.format,
      notes: null // Can be extended in future
    }));

    const { error: exercisesError } = await supabase
      .from('workout_exercises')
      .insert(exerciseRecords);

    if (exercisesError) {
      console.error('❌ Failed to create workout exercises:', exercisesError);
      throw exercisesError;
    }

    console.log(`   ✓ Created ${exerciseRecords.length} exercise records`);

    // STEP 3: Log rules audit trail (critical for safety)
    await logRulesAudit(profile.user_id, workoutId, safetyContext);
    console.log(`   ✓ Rules audit logged`);

    console.log(`\n✅ Workout saved successfully!`);
    console.log(`   Workout ID: ${workoutId}`);
    console.log(`   Name: ${workout.workout_name}`);
    console.log(`   Exercises: ${workout.main_workout.length}`);
    console.log(`   Duration: ${workout.estimated_duration_minutes} minutes`);

    return workoutId;
  } catch (error) {
    console.error('❌ Database save failed:', error);
    throw error;
  }
}

/**
 * Build workout structure JSON for database storage
 * Stores complete workout structure including warm-up, cool-down, checkpoints
 * 
 * @param workout - Assembled workout to structure
 * @returns Structured workout data as JSON object
 */
function buildWorkoutStructure(workout: AssembledWorkout): any {
  return {
    warm_up: workout.warm_up.exercises,
    main_workout: workout.main_workout.map(ex => ({
      exercise_id: ex.exerciseId,
      sets: ex.sets,
      reps: ex.reps,
      rest_seconds: ex.restSeconds,
      format: ex.format,
      weight_guidance: ex.weight_guidance
    })),
    cool_down: workout.cool_down.exercises,
    safety_checkpoints: workout.safety_checkpoints,
    metadata: workout.metadata
  };
}

/**
 * Log rules audit trail to database
 * Creates records for each safety rule applied during workout generation
 * This is CRITICAL for:
 * - Legal protection (proves we applied safety rules)
 * - Debugging (track which rules triggered)
 * - Research (understand rule effectiveness)
 * 
 * @param userId - User ID
 * @param workoutId - Workout ID from database
 * @param safetyContext - Safety context with applied rules
 */
async function logRulesAudit(
  userId: string,
  workoutId: string,
  safetyContext: SafetyContext
): Promise<void> {
  if (!supabase) {
    console.warn('⚠️ Supabase not available, skipping rules audit');
    return;
  }

  if (safetyContext.rules_applied.length === 0) {
    console.log('   No rules applied, skipping audit log');
    return;
  }

  const auditRecords = safetyContext.rules_applied.map(rule => ({
    user_id: userId,
    workout_id: workoutId,
    rule_id: rule.rule_id,
    category: rule.category,
    applied_at: new Date().toISOString(),
    parameters: safetyContext.modified_parameters,
    excluded_exercises_count: safetyContext.excluded_exercise_ids.length,
    context: rule.context || {}
  }));

  const { error } = await supabase
    .from('rules_audit')
    .insert(auditRecords);

  if (error) {
    console.error('❌ Failed to log rules audit:', error);
    // Don't throw - audit failure shouldn't prevent workout save
    console.warn('⚠️ Continuing despite audit log failure');
  } else {
    console.log(`   ✓ Logged ${auditRecords.length} rule applications`);
  }
}

