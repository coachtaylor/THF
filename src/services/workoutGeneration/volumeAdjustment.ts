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

  console.log(`\n📊 Calculating volume adjustments for ${profile.fitness_experience} athlete`);

  // STEP 1: Apply HRT adjustments from safety context (Phase 1 Rules Engine)
  if (safetyContext.modified_parameters.volume_reduction_percent) {
    const reduction = safetyContext.modified_parameters.volume_reduction_percent / 100;
    setsMultiplier *= (1 - reduction);
    console.log(`  HRT volume reduction: ${safetyContext.modified_parameters.volume_reduction_percent}%`);
  }

  if (safetyContext.modified_parameters.rest_seconds_increase) {
    const increase = safetyContext.modified_parameters.rest_seconds_increase / 60;
    restMultiplier += increase;
    console.log(`  HRT rest increase: +${safetyContext.modified_parameters.rest_seconds_increase}s`);
  }

  // STEP 2: Apply experience-based adjustments
  switch (profile.fitness_experience) {
    case 'beginner':
      setsMultiplier *= 0.85;  // 15% fewer sets
      restMultiplier *= 1.2;   // 20% more rest
      repsAdjustment = 0;      // Standard rep ranges
      console.log(`  Beginner adjustments: -15% sets, +20% rest`);
      break;

    case 'intermediate':
      // No adjustments - this is the baseline
      break;

    case 'advanced':
      setsMultiplier *= 1.15;  // 15% more sets
      restMultiplier *= 0.9;   // 10% less rest
      repsAdjustment = 2;      // Can add extra reps
      console.log(`  Advanced adjustments: +15% sets, -10% rest, +2 reps`);
      break;
  }

  // STEP 3: Apply template-level HRT multiplier
  setsMultiplier *= template.volume_multiplier;
  if (template.adjusted_for_hrt && template.volume_multiplier !== 1.0) {
    console.log(`  Template HRT multiplier: ${template.volume_multiplier.toFixed(2)}x`);
  }

  console.log(`  Final multipliers:`);
  console.log(`    Sets: ${setsMultiplier.toFixed(2)}x`);
  console.log(`    Reps: ${repsAdjustment >= 0 ? '+' : ''}${repsAdjustment}`);
  console.log(`    Rest: ${restMultiplier.toFixed(2)}x`);
  console.log(`    Duration: ${durationMultiplier.toFixed(2)}x\n`);

  return {
    sets_multiplier: setsMultiplier,
    reps_adjustment: repsAdjustment,
    rest_multiplier: restMultiplier,
    session_duration_multiplier: durationMultiplier
  };
}

