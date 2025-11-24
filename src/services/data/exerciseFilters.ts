/**
 * Centralized exercise filtering utilities
 * 
 * All exercise filtering logic lives here for maintainability and extensibility.
 * Filters are applied in-memory after exercises are loaded from Supabase.
 */

import { Exercise } from '../../types/plan';
import { Profile } from '../storage/profile';
import { filterHeavyBindingExercises, prioritizeLowerBodyAndCore } from '../heavyBindingFilter';

type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
const DIFFICULTY_ORDER: FitnessLevel[] = ['beginner', 'intermediate', 'advanced'];

// ============================================================================
// INDIVIDUAL FILTER HELPERS
// ============================================================================


/**
 * Check if exercise matches user's equipment using canonical categories.
 * 
 * Rules:
 * - Exercise requires no equipment ('none' or empty) → always allowed
 * - Match if any exercise canonical equipment is in the user's canonical selection
 * 
 * @param ex - Exercise to check
 * @param profile - User profile with equipment preferences
 * @returns true if exercise matches user's canonical equipment selection
 */
function exerciseMatchesEquipmentCanonical(ex: Exercise, profile: Profile): boolean {
  const userCanon = new Set(profile.equipment ?? []);
  if (!userCanon.size) return true; // No preference = allow all

  // If exercise has no equipment specified (empty array or 'none'), 
  // allow it if user selected bodyweight OR if user has very few exercises (graceful fallback)
  if (ex.equipment.length === 0 || ex.equipment.includes('none')) {
    return userCanon.has('bodyweight');
  }

  // Exercise has specific equipment requirements - check for match
  const exCanon = new Set(ex.equipment ?? []);
  for (const val of exCanon) {
    if (val !== 'none' && userCanon.has(val)) return true;
  }
  
  return false;
}

/**
 * Check if exercise matches user's equipment using canonical categories.
 * 
 * Rules:
 * 1. No user equipment preference → all exercises allowed
 * 2. Exercise requires no equipment → always allowed
 * 3. Match if any exercise canonical equipment is in the user's canonical selection
 * 
 * @param ex - Exercise to check
 * @param profile - User profile with equipment preferences
 * @returns true if exercise matches user's available equipment
 */
function exerciseMatchesEquipment(ex: Exercise, profile: Profile): boolean {
  return exerciseMatchesEquipmentCanonical(ex, profile);
}

// Alias for backward compatibility
const matchesEquipment = exerciseMatchesEquipment;

/**
 * Check if exercise difficulty is allowed for user's fitness level.
 * 
 * Rules:
 * - beginner → only beginner exercises
 * - intermediate → beginner + intermediate exercises
 * - advanced → all exercises (beginner + intermediate + advanced)
 */
function matchesDifficulty(exercise: Exercise, fitnessLevel: FitnessLevel | undefined): boolean {
  if (!fitnessLevel) {
    return true; // No level preference means all exercises allowed
  }

  const exerciseLevel = (exercise.difficulty || 'beginner') as FitnessLevel;
  const allowedLevels = DIFFICULTY_ORDER.slice(0, DIFFICULTY_ORDER.indexOf(fitnessLevel) + 1);
  
  return allowedLevels.includes(exerciseLevel);
}

/**
 * Check if exercise is safe for binder-aware profile (TypeScript-friendly helper).
 * 
 * Rules:
 * - If profile has binder_aware or heavy_binding constraint → prefer binder_aware = true
 * - Returns true if exercise is binder-aware, false otherwise
 * - Note: Use this for checking individual exercises; filtering applies graceful fallback
 */
export function isBinderSafeForProfile(exercise: Exercise, profile: Profile): boolean {
  const constraints = profile.constraints || [];
  const hasBinderConstraint = constraints.includes('binder_aware') || constraints.includes('heavy_binding');
  
  if (!hasBinderConstraint) {
    return true; // No binder constraint means all exercises allowed
  }

  return exercise.binder_aware === true;
}

/**
 * Check if exercise is safe for pelvic floor-sensitive profile (TypeScript-friendly helper).
 * 
 * Rules:
 * - If profile has 'post_op' in constraints AND 'bottom_surgery' in surgery_flags → filter out pelvic_floor_safe = false
 * - Returns true if exercise is pelvic floor safe, false otherwise
 * - Note: Database field is pelvic_floor_safe, mapped to pelvic_floor_aware in Exercise interface
 */
export function isPelvicFloorSafeForProfile(exercise: Exercise, profile: Profile): boolean {
  const constraints = profile.constraints || [];
  const surgeryFlags = profile.surgery_flags || [];
  
  // Only apply pelvic floor filtering if user has post_op constraint AND bottom_surgery flag
  const hasPostOpConstraint = constraints.includes('post_op');
  const hasBottomSurgery = surgeryFlags.includes('bottom_surgery');
  
  if (!hasPostOpConstraint || !hasBottomSurgery) {
    return true; // No pelvic floor constraint means all exercises allowed
  }

  return exercise.pelvic_floor_aware === true;
}

/**
 * Check if exercise is allowed by impact profile (TypeScript-friendly helper).
 * 
 * Rules:
 * - If profile has no_jumping constraint → exclude high-impact exercises
 * - If profile has no_floor constraint → exclude floor-based exercises
 * - Returns true if exercise matches impact/position constraints
 */
export function isAllowedByImpactProfile(exercise: Exercise, profile: Profile): boolean {
  return isImpactAllowedForProfile(exercise, profile) && isFloorAllowedForProfile(exercise, profile);
}

/**
 * Check if exercise is allowed based on impact constraints (no_jumping).
 * 
 * Rules:
 * - If profile has 'no_jumping' constraint → exclude high-impact exercises
 * - Returns true if exercise is allowed, false if it should be excluded
 */
export function isImpactAllowedForProfile(exercise: Exercise, profile: Profile): boolean {
  const constraints = profile.constraints || [];
  
  if (constraints.includes('no_jumping') && isHighImpact(exercise)) {
    return false;
  }
  
  return true;
}

/**
 * Check if exercise is allowed based on floor position constraints (no_floor).
 * 
 * Rules:
 * - If profile has 'no_floor' constraint → exclude floor-based exercises
 * - Returns true if exercise is allowed, false if it should be excluded
 */
export function isFloorAllowedForProfile(exercise: Exercise, profile: Profile): boolean {
  const constraints = profile.constraints || [];
  
  if (constraints.includes('no_floor') && isFloorBased(exercise)) {
    return false;
  }
  
  return true;
}

/**
 * Check if exercise is high-impact (jumping movements).
 * 
 * Patterns checked:
 * - Exercise id/name: jumping-jack, burpee, jump-squat, high-knees, mountain-climber, box-jump, plyometric
 * - Tags: jump, jumping, plyometric, plyo
 * - Name keywords: jump, jumping, hop, bound
 * 
 * @param exercise - Exercise to check
 * @returns true if exercise is high-impact
 */
export function isHighImpact(exercise: Exercise): boolean {
  const lowerId = exercise.id.toLowerCase();
  const lowerName = exercise.name.toLowerCase();
  
  // Check for jumping patterns in id/slug
  const highImpactPatterns = [
    'jumping-jack', 'jumping_jack', 'jump-jack', 'jump_jack',
    'jump-squat', 'jump_squat', 'jump-lunge', 'jump_lunge',
    'burpee', 'burpees',
    'high-knee', 'high_knee', 'high-knees', 'high_knees',
    'mountain-climber', 'mountain_climber',
    'squat-thrust', 'squat_thrust',
    'box-jump', 'box_jump',
    'plyometric', 'plyo'
  ];
  
  if (highImpactPatterns.some(pattern => lowerId.includes(pattern) || lowerName.includes(pattern))) {
    return true;
  }
  
  // Check tags for jumping-related terms
  if (exercise.tags?.some(tag => {
    const lowerTag = tag.toLowerCase();
    return lowerTag.includes('jump') || 
           lowerTag === 'jumping' || 
           lowerTag.includes('plyometric') ||
           lowerTag.includes('plyo');
  })) {
    return true;
  }
  
  // Check name for jumping keywords
  const jumpKeywords = ['jump', 'jumping', 'hop', 'bound'];
  if (jumpKeywords.some(keyword => lowerName.includes(keyword))) {
    return true;
  }
  
  return false;
}

/**
 * Check if exercise is floor-based (requires floor/prone/supine position).
 * 
 * Patterns checked:
 * - Exercise id/name: plank, bridge, glute-bridge, dead-bug, bird-dog, supine, prone, floor, lying, ground, mat
 * - Tags: floor, prone, supine, lying, ground, mat
 * - Name keywords: plank, bridge, supine, prone, lying, floor, ground
 * 
 * @param exercise - Exercise to check
 * @returns true if exercise is floor-based
 */
export function isFloorBased(exercise: Exercise): boolean {
  const lowerId = exercise.id.toLowerCase();
  const lowerName = exercise.name.toLowerCase();
  
  // Check for floor-based patterns in id/slug
  const floorPatterns = [
    'plank', 'planks',
    'bridge', 'bridges', 'glute-bridge', 'glute_bridge',
    'dead-bug', 'dead_bug', 'deadbug',
    'bird-dog', 'bird_dog', 'birddog',
    'supine', 'prone',
    'floor', 'lying', 'ground', 'mat'
  ];
  
  if (floorPatterns.some(pattern => lowerId.includes(pattern) || lowerName.includes(pattern))) {
    return true;
  }
  
  // Check tags for floor-related terms
  if (exercise.tags?.some(tag => {
    const lowerTag = tag.toLowerCase();
    return lowerTag.includes('floor') ||
           lowerTag.includes('prone') ||
           lowerTag.includes('supine') ||
           lowerTag.includes('lying') ||
           lowerTag.includes('ground') ||
           lowerTag === 'mat';
  })) {
    return true;
  }
  
  // Check name for floor keywords
  const floorKeywords = ['plank', 'bridge', 'supine', 'prone', 'lying', 'floor', 'ground'];
  if (floorKeywords.some(keyword => lowerName.includes(keyword))) {
    return true;
  }
  
  return false;
}

// ============================================================================
// MAIN FILTER FUNCTION
// ============================================================================

/**
 * Filter exercises by user profile constraints.
 * 
 * Filtering order:
 * 1. Equipment (intersection logic)
 * 2. Difficulty/fitness level
 * 3. Binder awareness (with graceful fallback)
 * 4. Heavy binding safety (with graceful fallback)
 * 5. Pelvic floor safety
 * 6. Impact profile (no_jumping, no_floor)
 * 
 * Graceful fallbacks:
 * - Binder-aware: If no binder-aware exercises found, falls back to all filtered exercises
 * - Heavy binding: If no heavy-binding-safe exercises found, falls back to binder-aware exercises
 * - Difficulty: If no exercises match level, falls back to all exercises
 * 
 * @param exercises - Full exercise library from Supabase
 * @param profile - User profile with constraints and preferences
 * @returns Filtered exercise list respecting all constraints
 */
export function filterExercisesByConstraints(
  exercises: Exercise[],
  profile: Profile
): Exercise[] {
  let filtered = exercises;
  const fitnessLevel = (profile.fitness_level as FitnessLevel | undefined) || undefined;
  const constraints = profile.constraints || [];

  console.log(`🔍 Filtering ${exercises.length} exercises with profile:`, {
    equipment: profile.equipment,
    fitness_level: profile.fitness_level,
    constraints: profile.constraints,
  });

  // 1. Filter by equipment availability - prefer raw equipment, fall back to canonical
  const beforeEquipment = filtered.length;
  filtered = filtered.filter(ex => {
    const matchesEquipment = exerciseMatchesEquipment(ex, profile);
    if (!matchesEquipment) return false;
    return true;
  });
  console.log(`   Equipment filter: ${beforeEquipment} → ${filtered.length} exercises`);
  console.log(`   User equipment (canonical): ${(profile.equipment || []).join(', ') || 'none'}`);
  if (filtered.length > 0) {
    const sample = filtered[0];
    console.log(`   Sample filtered exercise: ${sample.name} (equipment: ${sample.equipment.join(', ') || 'none'})`);
  }

  // 2. Filter by fitness level / difficulty
  // Only include exercises whose difficulty <= user's fitness level
  if (fitnessLevel) {
    const beforeDifficulty = filtered.length;
    filtered = filtered.filter(ex => matchesDifficulty(ex, fitnessLevel));
    console.log(`   Difficulty filter: ${beforeDifficulty} → ${filtered.length} exercises`);
    
    // Graceful fallback: If filtering removes everything, keep all exercises
    if (filtered.length === 0) {
      console.log(`   ⚠️ Difficulty filter removed all exercises, falling back to equipment-filtered only`);
      // Re-apply equipment filter if it was applied
      filtered = exercises.filter(ex => {
        const matchesEquipment = exerciseMatchesEquipment(ex, profile);
        if (!matchesEquipment) return false;
        return true;
      });
    }
  }

  // 3. Filter by binder awareness - prefer binder-aware with graceful fallback
  const hasBinderConstraint = constraints.includes('binder_aware') || constraints.includes('heavy_binding');
  if (hasBinderConstraint) {
    const beforeBinder = filtered.length;
    const binderAwareExercises = filtered.filter(ex => ex.binder_aware === true);
    console.log(`   Binder filter: ${beforeBinder} total, ${binderAwareExercises.length} binder-aware`);
    // If we have binder-aware exercises, use them; otherwise fall back to all exercises
    if (binderAwareExercises.length > 0) {
      filtered = binderAwareExercises;
    }
    // If no binder-aware exercises found, gracefully fall back (keep all filtered exercises)
  }

  // 4. Filter by heavy binding safety
  // Heavy binding requires both binder awareness AND heavy binding safety
  if (constraints.includes('heavy_binding')) {
    // First ensure binder_aware is true (heavy binding implies binder_aware)
    const binderAwareOnly = filtered.filter(ex => ex.binder_aware === true);
    if (binderAwareOnly.length > 0) {
      filtered = binderAwareOnly;
    }
    
    // Then filter for heavy binding safety using the helper
    const heavyBindingSafe = filterHeavyBindingExercises(filtered);
    // If we have heavy binding safe exercises, use them; otherwise fall back
    if (heavyBindingSafe.length > 0) {
      filtered = heavyBindingSafe;
    }
    
    // Prioritize lower body and core exercises for heavy binding
    filtered = prioritizeLowerBodyAndCore(filtered);
  }

  // 5. Filter by pelvic floor safety
  // Only filter if user has post_op constraint AND bottom_surgery flag
  // Store previous filtered list for graceful fallback
  const beforePelvicFloorFilter = [...filtered];
  filtered = filtered.filter(ex => isPelvicFloorSafeForProfile(ex, profile));
  
  // Graceful fallback: If no pelvic-floor-safe exercises, keep previous filtered list
  // (This allows post-op users to still get exercises, though ideally all should be safe)
  if (filtered.length === 0) {
    filtered = beforePelvicFloorFilter;
  }

  // 6. Filter by impact profile (no_jumping, no_floor)
  filtered = filtered.filter(ex => isImpactAllowedForProfile(ex, profile));
  filtered = filtered.filter(ex => isFloorAllowedForProfile(ex, profile));

  // Final graceful fallback: If all filtering removed everything, try progressive fallbacks
  if (filtered.length === 0) {
    console.log(`   ⚠️ All filters removed exercises, trying progressive fallbacks`);
    
    // Fallback 1: Equipment + difficulty only (skip constraints)
    filtered = exercises.filter(ex => {
      const matchesEquipment = exerciseMatchesEquipment(ex, profile);
      if (!matchesEquipment) return false;
      if (fitnessLevel && !matchesDifficulty(ex, fitnessLevel)) return false;
      return true;
    });
    console.log(`   Fallback 1 (equipment + difficulty): ${filtered.length} exercises`);
    
    // Fallback 2: Equipment only (skip all other filters)
    if (filtered.length === 0) {
      filtered = exercises.filter(ex => {
        const matchesEquipment = exerciseMatchesEquipment(ex, profile);
        return matchesEquipment;
      });
      console.log(`   Fallback 2 (equipment only): ${filtered.length} exercises`);
    }
    
    // Fallback 3: If equipment filter is too restrictive, allow bodyweight as fallback
    if (filtered.length === 0 && profile.equipment && profile.equipment.length > 0) {
      console.log(`   Fallback 3: Equipment filter too restrictive, allowing bodyweight exercises as fallback`);
      const equipmentWithBodyweight = [...(profile.equipment || []), 'bodyweight'];
      filtered = exercises.filter(ex => {
        if (ex.equipment.length === 0 || ex.equipment.includes('none') || ex.equipment.includes('bodyweight')) {
          return true;
        }
        const exCanon = new Set(ex.equipment ?? []);
        for (const val of exCanon) {
          if (val !== 'none' && equipmentWithBodyweight.includes(val)) return true;
        }
        return false;
      });
      console.log(`   Fallback 3 (equipment + bodyweight): ${filtered.length} exercises`);
    }
    
    // Last resort: return all exercises
    if (filtered.length === 0) {
      console.log(`   ⚠️ All fallbacks failed, returning ALL exercises as last resort`);
      filtered = exercises;
    }
  }

  console.log(`✅ Final filtered result: ${filtered.length} exercises`);
  return filtered;
}

