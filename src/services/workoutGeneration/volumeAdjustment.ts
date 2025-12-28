// Volume Adjustment for Trans-Specific Programming
// Adjusts workout volume based on HRT status and experience level
// Critical for safe and effective training for trans athletes

import { Profile } from '../../types';
import { SafetyContext } from '../rulesEngine/rules/types';
import { SelectedTemplate } from './templates/types';

/**
 * Volume adjustments to apply to workout generation
 */
export interface VolumeAdjustments {
  sets_multiplier: number;        // Apply to sets calculation
  reps_adjustment: number;         // +/- reps from base
  rest_multiplier: number;         // Apply to rest periods
  session_duration_multiplier: number;
  // Additional modifiers from safety rules
  max_sets?: number;               // Cap on maximum sets per exercise
  rep_range?: string;              // Overrides default rep range (e.g., "12-15")
  max_weight?: string;             // Weight cap guidance (e.g., "50%")
  recovery_multiplier?: number;    // Extra recovery time between workouts
  progressive_overload_rate?: number; // Rate of progression
  max_workout_minutes?: number;    // SAFETY: Max workout duration (e.g., 30 for ace bandage users)
}

/**
 * Calculate volume adjustments based on HRT, experience level, and safety context
 * 
 * This function is the key to making workouts safe and effective for trans athletes on HRT!
 * 
 * Adjustments:
 * - MTF on estrogen: 15% volume reduction (harder to build/maintain muscle)
 * - FTM on testosterone: Standard or enhanced volume (T helps recovery)
 * - Beginners: Reduced volume, more rest
 * - Advanced: Increased volume, less rest
 */
export function calculateVolumeAdjustments(
  profile: Profile,
  template: SelectedTemplate,
  safetyContext: SafetyContext
): VolumeAdjustments {
  let setsMultiplier = 1.0;
  let repsAdjustment = 0;
  let restMultiplier = 1.0;
  let durationMultiplier = 1.0;

  if (__DEV__) console.log(`\n📊 Calculating volume adjustments for ${profile.fitness_experience} athlete`);

  // STEP 1: Apply HRT adjustments from safety context (Phase 1 Rules Engine)
  if (safetyContext.modified_parameters.volume_reduction_percent) {
    const reduction = safetyContext.modified_parameters.volume_reduction_percent / 100;
    setsMultiplier *= (1 - reduction);
    if (__DEV__) console.log(`  HRT volume reduction: ${safetyContext.modified_parameters.volume_reduction_percent}%`);
  }

  if (safetyContext.modified_parameters.rest_seconds_increase) {
    const increase = safetyContext.modified_parameters.rest_seconds_increase / 60;
    restMultiplier += increase;
    if (__DEV__) console.log(`  HRT rest increase: +${safetyContext.modified_parameters.rest_seconds_increase}s`);
  }

  // STEP 2: Apply experience-based adjustments
  switch (profile.fitness_experience) {
    case 'beginner':
      setsMultiplier *= 0.85;  // 15% fewer sets
      restMultiplier *= 1.2;   // 20% more rest
      repsAdjustment = 0;      // Standard rep ranges
      if (__DEV__) console.log(`  Beginner adjustments: -15% sets, +20% rest`);
      break;

    case 'intermediate':
      // No adjustments - this is the baseline
      break;

    case 'advanced':
      setsMultiplier *= 1.15;  // 15% more sets
      restMultiplier *= 0.9;   // 10% less rest
      repsAdjustment = 2;      // Can add extra reps
      if (__DEV__) console.log(`  Advanced adjustments: +15% sets, -10% rest, +2 reps`);
      break;
  }

  // STEP 3: Apply template-level HRT multiplier
  setsMultiplier *= template.volume_multiplier;
  if (template.adjusted_for_hrt && template.volume_multiplier !== 1.0) {
    if (__DEV__) console.log(`  Template HRT multiplier: ${template.volume_multiplier.toFixed(2)}x`);
  }

  // STEP 4: Apply additional modifiers from safety rules
  const maxSets = safetyContext.modified_parameters.max_sets;
  const repRange = safetyContext.modified_parameters.rep_range;
  const maxWeight = safetyContext.modified_parameters.max_weight;
  const recoveryMultiplier = safetyContext.modified_parameters.recovery_multiplier;
  const progressiveOverloadRate = safetyContext.modified_parameters.progressive_overload_rate;
  const maxWorkoutMinutes = safetyContext.modified_parameters.max_workout_minutes;

  if (__DEV__) {
    if (maxSets) console.log(`  Max sets cap: ${maxSets} sets/exercise`);
    if (repRange) console.log(`  Rep range override: ${repRange}`);
    if (maxWeight) console.log(`  Max weight guidance: ${maxWeight}`);
    if (maxWorkoutMinutes) console.log(`  ⚠️ Max workout duration: ${maxWorkoutMinutes} minutes (binding safety)`);
  }
  if (recoveryMultiplier) {
    restMultiplier *= recoveryMultiplier;
    if (__DEV__) console.log(`  Recovery multiplier: ${recoveryMultiplier}x`);
  }

  // STEP 5: Apply minimum volume floor to prevent over-reduction
  // This ensures workouts remain effective even with multiple stacking adjustments
  const MINIMUM_SETS_MULTIPLIER = 0.5; // Never reduce volume below 50%
  const MINIMUM_REST_MULTIPLIER = 0.7; // Never reduce rest below 70%
  const MAXIMUM_REST_MULTIPLIER = 2.0; // Cap rest at 2x to keep workouts reasonable

  if (setsMultiplier < MINIMUM_SETS_MULTIPLIER) {
    if (__DEV__) console.log(`  ⚠️ Sets multiplier ${setsMultiplier.toFixed(2)}x floored to ${MINIMUM_SETS_MULTIPLIER}x (minimum viable volume)`);
    setsMultiplier = MINIMUM_SETS_MULTIPLIER;
  }

  restMultiplier = Math.max(MINIMUM_REST_MULTIPLIER, Math.min(MAXIMUM_REST_MULTIPLIER, restMultiplier));

  if (__DEV__) {
    console.log(`  Final multipliers:`);
    console.log(`    Sets: ${setsMultiplier.toFixed(2)}x`);
    console.log(`    Reps: ${repsAdjustment >= 0 ? '+' : ''}${repsAdjustment}`);
    console.log(`    Rest: ${restMultiplier.toFixed(2)}x`);
    console.log(`    Duration: ${durationMultiplier.toFixed(2)}x`);
    if (maxWorkoutMinutes) console.log(`    Max duration: ${maxWorkoutMinutes}min\n`);
  }

  return {
    sets_multiplier: setsMultiplier,
    reps_adjustment: repsAdjustment,
    rest_multiplier: restMultiplier,
    session_duration_multiplier: durationMultiplier,
    max_sets: maxSets,
    rep_range: repRange,
    max_weight: maxWeight,
    recovery_multiplier: recoveryMultiplier,
    progressive_overload_rate: progressiveOverloadRate,
    max_workout_minutes: maxWorkoutMinutes
  };
}

