// src/services/workoutGeneration/utils.ts
// Shared utility functions for workout generation
// Extracted from workoutGenerator.ts to reduce duplication

import { Exercise } from '../../types';
import { Profile } from '../storage/profile';
import { mapRawEquipmentToCanonical, CanonicalEquipment } from '../../utils/equipment';

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
    console.warn('⚠️ No equipment selected by user');
    return [];
  }

  console.log(
    `🔍 Filtering ${exercises.length} exercises for equipment:`,
    userEquipment
  );

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

  console.log(`✅ Found ${filtered.length} exercises matching user equipment`);
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
      console.log(`❌ Filtered out: ${exercise.name} (not binder aware)`);
      return false;
    }

    // Check heavy binding safety
    if (constraints.includes('heavy_binding') && !exercise.heavy_binding_safe) {
      console.log(`❌ Filtered out: ${exercise.name} (not safe for heavy binding)`);
      return false;
    }

    // Check pelvic floor awareness
    if (constraints.includes('post_op') && !exercise.pelvic_floor_aware) {
      console.log(`❌ Filtered out: ${exercise.name} (not pelvic floor aware)`);
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

  // 3. BODY FOCUS PREFER (2 points per match)
  const bodyFocusPrefer = profile.body_focus_prefer || [];
  const matchingPrefer = bodyFocusPrefer.filter(region =>
    exercise.tags?.some(tag => tag.toLowerCase() === region.toLowerCase())
  );
  score += matchingPrefer.length * 2;

  // 4. BODY FOCUS AVOID (-3 points per match)
  const bodyFocusAvoid = profile.body_focus_soft_avoid || [];
  const matchingAvoid = bodyFocusAvoid.filter(region =>
    exercise.tags?.some(tag => tag.toLowerCase() === region.toLowerCase())
  );
  if (matchingAvoid.length > 0) {
    score -= matchingAvoid.length * 3;
  }

  // 5. BASELINE RANDOMNESS (0-2 points)
  score += Math.random() * 2;

  return score;
}

