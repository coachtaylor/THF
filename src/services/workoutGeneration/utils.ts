// src/services/workoutGeneration/utils.ts
// Shared utility functions for workout generation
// Extracted from workoutGenerator.ts to reduce duplication

import { Exercise, RecoveryPhase } from '../../types';
import { Profile } from '../storage/profile';
import { mapRawEquipmentToCanonical, CanonicalEquipment } from '../../utils/equipment';

/**
 * Recovery phase definitions (weeks post-op)
 */
const RECOVERY_PHASE_WEEKS: Record<RecoveryPhase, { start: number; end: number }> = {
  immediate: { start: 0, end: 2 },
  early: { start: 2, end: 6 },
  mid: { start: 6, end: 12 },
  late: { start: 12, end: 24 },
  maintenance: { start: 24, end: Infinity },
};

/**
 * Ordered list of recovery phases from earliest to latest
 */
const RECOVERY_PHASE_ORDER: RecoveryPhase[] = ['immediate', 'early', 'mid', 'late', 'maintenance'];

/**
 * Calculate weeks since a given date
 */
function calculateWeeksPostOp(surgeryDate: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - surgeryDate.getTime();
  const diffWeeks = diffMs / (1000 * 60 * 60 * 24 * 7);
  return Math.floor(diffWeeks);
}

/**
 * Determine the current recovery phase based on weeks post-op
 */
function getPhaseFromWeeks(weeks: number): RecoveryPhase {
  if (weeks < 2) return 'immediate';
  if (weeks < 6) return 'early';
  if (weeks < 12) return 'mid';
  if (weeks < 24) return 'late';
  return 'maintenance';
}

/**
 * Check if a phase is at or after another phase in the recovery timeline
 * Returns true if currentPhase >= requiredPhase
 */
function isPhaseAtOrAfter(currentPhase: RecoveryPhase, requiredPhase: RecoveryPhase): boolean {
  const currentIndex = RECOVERY_PHASE_ORDER.indexOf(currentPhase);
  const requiredIndex = RECOVERY_PHASE_ORDER.indexOf(requiredPhase);
  return currentIndex >= requiredIndex;
}

/**
 * Get the user's current recovery phase based on their most recent surgery
 * Returns 'maintenance' if no active recovery (no recent surgeries)
 *
 * @param profile - User profile with surgery history
 * @returns Current recovery phase
 */
export function getUserRecoveryPhase(profile: Profile): RecoveryPhase {
  const surgeries = profile.surgeries;

  // No surgeries = full access
  if (!surgeries || surgeries.length === 0) {
    return 'maintenance';
  }

  // Filter surgeries that have a date and are not marked fully healed
  const activeSurgeries = surgeries.filter(s => {
    if (!s.date) return false;
    if (s.fully_healed) return false;
    return true;
  });

  if (activeSurgeries.length === 0) {
    return 'maintenance';
  }

  // Find the most restrictive phase (earliest in timeline)
  // This is the surgery that is most recent (fewest weeks post-op)
  let mostRestrictivePhase: RecoveryPhase = 'maintenance';

  for (const surgery of activeSurgeries) {
    const surgeryDate = surgery.date instanceof Date ? surgery.date : new Date(surgery.date);
    const weeksPostOp = surgery.weeks_post_op ?? calculateWeeksPostOp(surgeryDate);
    const phase = getPhaseFromWeeks(weeksPostOp);

    // If this surgery is in an earlier phase, use that
    if (!isPhaseAtOrAfter(phase, mostRestrictivePhase)) {
      mostRestrictivePhase = phase;
    }
  }

  if (__DEV__) console.log(`📅 User recovery phase: ${mostRestrictivePhase}`);
  return mostRestrictivePhase;
}

/**
 * Filter exercises by user's current recovery phase
 * Only returns exercises that are safe for the user's current recovery stage
 *
 * @param exercises - All available exercises
 * @param profile - User profile with surgery history
 * @returns Filtered exercises safe for current recovery phase
 */
export function filterByRecoveryPhase(
  exercises: Exercise[],
  profile: Profile
): Exercise[] {
  const currentPhase = getUserRecoveryPhase(profile);

  // If user is in maintenance phase, all exercises are available
  if (currentPhase === 'maintenance') {
    return exercises;
  }

  if (__DEV__) console.log(`🏥 Filtering exercises for recovery phase: ${currentPhase}`);

  const filtered = exercises.filter(exercise => {
    // SAFETY FIX: Exercises without phase metadata are NOT safe for post-op users
    // Previously this returned true, which allowed untagged exercises through
    if (!exercise.earliest_safe_phase) {
      if (__DEV__) {
        console.log(`⚠️ Excluded: ${exercise.name} (no earliest_safe_phase metadata - unsafe for post-op)`);
      }
      return false; // Exclude exercises without safety metadata
    }

    // Check if user's current phase is at or after the exercise's earliest safe phase
    const isSafe = isPhaseAtOrAfter(currentPhase, exercise.earliest_safe_phase);

    if (!isSafe && __DEV__) {
      console.log(
        `❌ Filtered out: ${exercise.name} (requires ${exercise.earliest_safe_phase}, user is in ${currentPhase})`
      );
    }

    return isSafe;
  });

  if (__DEV__) {
    console.log(
      `✅ Recovery phase filter: ${filtered.length}/${exercises.length} exercises available for ${currentPhase} phase`
    );
  }

  return filtered;
}

/**
 * Filter exercises by available equipment
 * Returns exercises that can be performed with user's equipment
 * 
 * @param exercises - All available exercises
 * @param userEquipment - User's available equipment list
 * @returns Filtered exercises that match user equipment
 */
export function filterByEquipment(
  exercises: Exercise[],
  userEquipment: string[]
): Exercise[] {
  if (userEquipment.length === 0) {
    if (__DEV__) console.warn('⚠️ No equipment selected by user');
    return [];
  }

  if (__DEV__) {
    console.log(
      `🔍 Filtering ${exercises.length} exercises for equipment:`,
      userEquipment
    );
  }

  const filtered = exercises.filter(exercise => {
    // Direct canonical match
    const hasCanonicalMatch = exercise.equipment.some(eq =>
      userEquipment.includes(eq)
    );
    if (hasCanonicalMatch) return true;

    // Map exercise.equipment strings to canonical
    const exerciseCanonicalFromEquipment = exercise.equipment
      .map(eq => mapRawEquipmentToCanonical(eq))
      .filter((c): c is CanonicalEquipment => c !== null);

    const hasMappedMatch = exerciseCanonicalFromEquipment.some((mapped: CanonicalEquipment) =>
      userEquipment.includes(mapped)
    );
    if (hasMappedMatch) return true;

    return false;
  });

  if (__DEV__) console.log(`✅ Found ${filtered.length} exercises matching user equipment`);
  return filtered;
}

/**
 * Filter exercises by safety constraints
 * 
 * @param exercises - Exercises to filter
 * @param constraints - User's safety constraints (binder_aware, heavy_binding, post_op)
 * @returns Filtered exercises that match constraints
 */
export function filterByConstraints(
  exercises: Exercise[],
  constraints: string[]
): Exercise[] {
  return exercises.filter(exercise => {
    // Check binder awareness
    if (constraints.includes('binder_aware') && !exercise.binder_aware) {
      if (__DEV__) console.log(`❌ Filtered out: ${exercise.name} (not binder aware)`);
      return false;
    }

    // Check heavy binding safety
    if (constraints.includes('heavy_binding') && !exercise.heavy_binding_safe) {
      if (__DEV__) console.log(`❌ Filtered out: ${exercise.name} (not safe for heavy binding)`);
      return false;
    }

    // Check pelvic floor awareness
    if (constraints.includes('post_op') && !exercise.pelvic_floor_aware) {
      if (__DEV__) console.log(`❌ Filtered out: ${exercise.name} (not pelvic floor aware)`);
      return false;
    }

    return true;
  });
}

/**
 * Calculate a score for an exercise based on how well it matches the user's profile
 * Higher score = better match
 * 
 * @param exercise - Exercise to score
 * @param profile - User profile with goals and preferences
 * @returns Score (0-10+ range)
 */
export function calculateExerciseScore(
  exercise: Exercise,
  profile: Profile
): number {
  let score = 0;

  // 1. PRIMARY GOAL MATCH (70% weight = 7 points)
  const primaryGoal = profile.goals?.[0];
  if (
    primaryGoal &&
    exercise.tags?.some(
      tag => tag.toLowerCase() === primaryGoal.toLowerCase()
    )
  ) {
    score += 7;
  }

  // 2. SECONDARY GOAL MATCH (30% weight = 3 points)
  const secondaryGoal = profile.goals?.[1];
  if (
    secondaryGoal &&
    exercise.tags?.some(
      tag => tag.toLowerCase() === secondaryGoal.toLowerCase()
    )
  ) {
    score += 3;
  }

  // 3. BODY FOCUS PREFER (+25 primary, +15 secondary)
  // Increased weights to make body focus preferences meaningful vs gender emphasis (+100)
  const bodyFocusPrefer = profile.body_focus_prefer || [];
  const exerciseMatchesBodyRegion = (region: string) => {
    const regionLower = region.toLowerCase();
    const tagMatches = exercise.tags?.some(tag => tag.toLowerCase() === regionLower);
    const muscleMatches = exercise.target_muscles?.toLowerCase().includes(regionLower);
    return tagMatches || muscleMatches;
  };

  bodyFocusPrefer.forEach((region, index) => {
    if (exerciseMatchesBodyRegion(region)) {
      // Primary preference (first selection) gets +25, secondary gets +15
      score += index === 0 ? 25 : 15;
    }
  });

  // 4. BODY FOCUS AVOID (-25 per match)
  // Increased penalty to make avoid preferences meaningful
  const bodyFocusAvoid = profile.body_focus_soft_avoid || [];
  const matchingAvoid = bodyFocusAvoid.filter(region => exerciseMatchesBodyRegion(region));
  if (matchingAvoid.length > 0) {
    score -= matchingAvoid.length * 25;
  }

  // 5. BASELINE RANDOMNESS (0-2 points)
  score += Math.random() * 2;

  return score;
}

/**
 * Equipment typically only available at gyms
 */
const GYM_ONLY_EQUIPMENT = [
  'cable', 'cable_machine', 'lat_pulldown', 'leg_press', 'leg_extension',
  'leg_curl', 'chest_press', 'shoulder_press', 'smith_machine', 'smith',
  'hack_squat', 'pec_deck', 'assisted_pullup', 'assisted_dip',
  'rowing_machine', 'elliptical', 'stairmaster', 'treadmill',
  'preacher_curl', 'seated_row', 'hip_adductor', 'hip_abductor',
  'calf_raise_machine', 'glute_machine', 'ab_machine'
];

/**
 * Equipment that works at home (minimal setup)
 */
const HOME_FRIENDLY_EQUIPMENT = [
  'bodyweight', 'none', 'mat', 'resistance_band', 'resistance_bands',
  'dumbbell', 'dumbbells', 'kettlebell', 'kettlebells',
  'pull_up_bar', 'pullup_bar', 'jump_rope', 'foam_roller',
  'yoga_block', 'mini_band', 'loop_band', 'stability_ball',
  'suspension_trainer', 'trx'
];

/**
 * Filter exercises by training environment
 * Ensures home users don't get gym-only exercises and vice versa
 *
 * @param exercises - Exercises to filter
 * @param trainingEnvironment - User's training environment (home, gym, studio, outdoors)
 * @returns Filtered exercises appropriate for the environment
 */
export function filterByTrainingEnvironment(
  exercises: Exercise[],
  trainingEnvironment?: string
): Exercise[] {
  // If no environment specified or gym/studio, return all (gyms have everything)
  if (!trainingEnvironment || trainingEnvironment === 'gym' || trainingEnvironment === 'studio') {
    return exercises;
  }

  if (trainingEnvironment === 'home') {
    // Filter out exercises that require gym-only equipment
    return exercises.filter(exercise => {
      const hasGymOnlyEquipment = exercise.equipment.some(eq =>
        GYM_ONLY_EQUIPMENT.some(gymEq =>
          eq.toLowerCase().includes(gymEq.toLowerCase())
        )
      );

      if (hasGymOnlyEquipment) {
        // Check if there's home-friendly equipment too (some exercises have options)
        const hasHomeFriendly = exercise.equipment.some(eq =>
          HOME_FRIENDLY_EQUIPMENT.some(homeEq =>
            eq.toLowerCase().includes(homeEq.toLowerCase())
          )
        );
        // Only filter out if ONLY gym equipment, not if there are home options
        return hasHomeFriendly;
      }

      return true;
    });
  }

  if (trainingEnvironment === 'outdoors') {
    // For outdoors, prefer bodyweight and portable equipment
    return exercises.filter(exercise => {
      // Must have at least one portable option
      return exercise.equipment.some(eq => {
        const eqLower = eq.toLowerCase();
        return eqLower === 'bodyweight' ||
               eqLower === 'none' ||
               eqLower.includes('resistance_band') ||
               eqLower.includes('kettlebell') ||
               eqLower.includes('jump_rope');
      });
    });
  }

  return exercises;
}

