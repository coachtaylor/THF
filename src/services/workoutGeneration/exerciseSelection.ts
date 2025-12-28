// Trans-Specific Exercise Selection Algorithm
// THE MOST IMPORTANT part of Phase 2 - prioritizes gender-affirming exercises

import { Exercise, Profile } from '../../types';
import { PatternRequirement, DayTemplate } from './templates/types';
import { SafetyContext, SoftFilterCriteria } from '../rulesEngine/rules/types';

/**
 * Scored exercise with reasoning
 */
interface ScoredExercise {
  exercise: Exercise;
  score: number;
  reasons: string[];
}

/**
 * Main selection function: Select exercises for a day based on template requirements
 * This is the core algorithm that makes TransFitness trans-specific
 */
export function selectExercisesForDay(
  exercisePool: Exercise[],
  dayTemplate: DayTemplate,
  profile: Profile,
  previouslySelectedIds: string[] = [],
  safetyContext?: SafetyContext
): Exercise[] {
  const selectedExercises: Exercise[] = [];
  const usedExerciseIds = new Set(previouslySelectedIds);

  if (__DEV__) {
    console.log(`\n🎯 Selecting exercises for: ${dayTemplate.name}`);
    console.log(`   Target: ${dayTemplate.total_exercises} exercises, Focus: ${dayTemplate.focus}`);
  }

  // Process each pattern requirement in the template
  for (const requirement of dayTemplate.patterns) {
    const exercises = selectExercisesForPattern(
      exercisePool,
      requirement,
      profile,
      usedExerciseIds,
      selectedExercises,
      safetyContext?.soft_filters
    );

    selectedExercises.push(...exercises);
    exercises.forEach(ex => usedExerciseIds.add(ex.id));
  }

  // If we don't have enough exercises, fill remaining slots
  if (selectedExercises.length < dayTemplate.total_exercises) {
    const additional = fillRemainingSlots(
      exercisePool,
      dayTemplate,
      profile,
      usedExerciseIds,
      selectedExercises,
      dayTemplate.total_exercises - selectedExercises.length
    );
    selectedExercises.push(...additional);
  }

  if (__DEV__) console.log(`✅ Selected ${selectedExercises.length} exercises for ${dayTemplate.name}\n`);

  return selectedExercises.slice(0, dayTemplate.total_exercises);
}

/**
 * Select exercises for a specific pattern requirement
 */
function selectExercisesForPattern(
  pool: Exercise[],
  requirement: PatternRequirement,
  profile: Profile,
  usedIds: Set<string>,
  alreadySelected: Exercise[],
  softFilters?: SoftFilterCriteria[]
): Exercise[] {
  // Filter to matching pattern
  const patternExercises = pool.filter(ex =>
    ex.pattern === requirement.pattern && !usedIds.has(ex.id)
  );

  if (patternExercises.length === 0) {
    if (__DEV__) console.warn(`⚠️ No exercises found for pattern: ${requirement.pattern}`);
    return [];
  }

  // Score all exercises
  const scored = patternExercises.map(ex =>
    scoreExercise(ex, requirement, profile, alreadySelected, softFilters)
  );

  // Sort by score (highest first)
  scored.sort((a, b) => b.score - a.score);

  // Select top N
  const selected = scored.slice(0, requirement.count).map(se => se.exercise);

  // Log selection with reasoning
  if (__DEV__) {
    console.log(`  ✓ Selected ${selected.length} ${requirement.pattern} exercises`);
    selected.forEach((ex, i) => {
      const s = scored[i];
      console.log(`    ${i + 1}. ${ex.name} (score: ${s.score.toFixed(1)}, ${s.reasons.join(', ')})`);
    });
  }

  return selected;
}

/**
 * CRITICAL SCORING FUNCTION - This is what makes TransFitness trans-specific!
 * Prioritizes gender-affirming exercises based on template requirements
 */
function scoreExercise(
  exercise: Exercise,
  requirement: PatternRequirement,
  profile: Profile,
  alreadySelected: Exercise[],
  softFilters?: SoftFilterCriteria[]
): ScoredExercise {
  let score = 0;
  const reasons: string[] = [];

  // Base score: effectiveness rating (0-10 scale)
  if (exercise.effectiveness_rating) {
    score += exercise.effectiveness_rating * 10;
    reasons.push(`effectiveness: ${exercise.effectiveness_rating}/10`);
  } else {
    score += 50; // Default mid-range
    reasons.push('effectiveness: default 50');
  }

  // GENDER EMPHASIS BONUS (MAJOR FACTOR - this is what makes us trans-specific!)
  if (requirement.gender_emphasis && exercise.gender_goal_emphasis) {
    const emphasisBonus = calculateGenderEmphasisBonus(
      exercise.gender_goal_emphasis,
      requirement.gender_emphasis,
      profile
    );
    score += emphasisBonus;
    if (emphasisBonus > 0) {
      reasons.push(`gender emphasis: +${emphasisBonus}`);
    } else if (emphasisBonus < 0) {
      reasons.push(`gender mismatch: ${emphasisBonus}`);
    }
  }

  // Target muscle matching
  if (requirement.target_muscles && exercise.target_muscles) {
    const targetMusclesLower = exercise.target_muscles.toLowerCase();
    const muscleMatch = requirement.target_muscles.some(tm =>
      targetMusclesLower.includes(tm.toLowerCase())
    );
    if (muscleMatch) {
      score += 30;
      reasons.push('muscle match +30');
    }
  }

  // Diversity penalty (avoid repeating same muscles)
  const diversityPenalty = calculateDiversityPenalty(exercise, alreadySelected);
  score -= diversityPenalty;
  if (diversityPenalty > 0) {
    reasons.push(`diversity -${diversityPenalty}`);
  }

  // Experience level match
  if (exercise.difficulty === profile.fitness_experience) {
    score += 10;
    reasons.push('experience match +10');
  }

  // Priority boost for required patterns
  if (requirement.priority === 'required') {
    score += 5;
    reasons.push('required pattern +5');
  }

  // DYSPHORIA-AWARE SOFT FILTER SCORING
  // Apply scoring adjustments based on user's dysphoria triggers
  if (softFilters && softFilters.length > 0) {
    const exerciseTags = exercise.dysphoria_tags || '';

    for (const filter of softFilters) {
      // Boost exercises with preferred tags (e.g., home_friendly, minimal_space)
      if (filter.prefer_tags?.some(tag => exerciseTags.includes(tag))) {
        score += 40;
        reasons.push('dysphoria-friendly +40');
      }

      // Penalize exercises with deprioritized tags (e.g., chest_focus, mirror_required)
      if (filter.deprioritize_tags?.some(tag => exerciseTags.includes(tag))) {
        score -= 40;
        reasons.push('dysphoria-trigger -40');
      }
    }
  }

  // BODY FOCUS PREFERENCES (+25 primary, +15 secondary, -25 avoid)
  // Allows users to emphasize specific body areas within their gender-affirming framework
  const bodyFocusBonus = calculateBodyFocusBonus(exercise, profile);
  score += bodyFocusBonus.score;
  if (bodyFocusBonus.score !== 0) {
    reasons.push(bodyFocusBonus.reason);
  }

  return { exercise, score, reasons };
}

/**
 * Calculate body focus bonus - allows users to emphasize specific body areas
 * within their gender-affirming framework
 *
 * Weights: +25 primary preference, +15 secondary, -25 avoid
 */
function calculateBodyFocusBonus(
  exercise: Exercise,
  profile: Profile
): { score: number; reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // Map body regions to muscle groups for matching
  const regionMuscleMap: Record<string, string[]> = {
    legs: ['quads', 'hamstrings', 'calves', 'legs'],
    glutes: ['glutes', 'hips', 'hip'],
    back: ['lats', 'upper_back', 'lower_back', 'back', 'traps'],
    core: ['core', 'abs', 'obliques', 'abdomen'],
    shoulders: ['shoulders', 'delts', 'deltoids'],
    arms: ['biceps', 'triceps', 'forearms', 'arms'],
    chest: ['chest', 'pecs', 'pectorals'],
    hips: ['hips', 'hip_flexors', 'inner_thighs', 'adductors'],
  };

  const exerciseMatchesRegion = (region: string): boolean => {
    const regionLower = region.toLowerCase();
    const muscles = regionMuscleMap[regionLower] || [regionLower];
    const targetMuscles = (exercise.target_muscles || '').toLowerCase();
    const tags = (exercise.tags || []).map(t => t.toLowerCase());

    return muscles.some(m => targetMuscles.includes(m) || tags.includes(m));
  };

  // Body focus preferences (+25 primary, +15 secondary)
  const bodyFocusPrefer = profile.body_focus_prefer || [];
  bodyFocusPrefer.forEach((region, index) => {
    if (exerciseMatchesRegion(region)) {
      const bonus = index === 0 ? 25 : 15;
      score += bonus;
      reasons.push(`body focus: ${region} +${bonus}`);
    }
  });

  // Body focus avoid (-25 per match)
  const bodyFocusAvoid = profile.body_focus_soft_avoid || [];
  bodyFocusAvoid.forEach(region => {
    if (exerciseMatchesRegion(region)) {
      score -= 25;
      reasons.push(`avoid: ${region} -25`);
    }
  });

  return {
    score,
    reason: reasons.length > 0 ? reasons.join(', ') : ''
  };
}

/**
 * Calculate gender emphasis bonus - THE CORE TRANS-SPECIFIC FEATURE
 * Rewards exercises that match the gender affirmation goals
 */
function calculateGenderEmphasisBonus(
  exerciseEmphasis: string,
  requiredEmphasis: string,
  profile: Profile
): number {
  // Perfect match = huge bonus
  if (exerciseEmphasis === requiredEmphasis) {
    return 100;
  }

  // Create numerical scale
  const emphasisLevels: Record<string, number> = {
    'fem_very_high': 4,
    'fem_high': 3,
    'fem_medium': 2,
    'fem_low': 1,
    'neutral': 0,
    'masc_low': -1,
    'masc_medium': -2,
    'masc_high': -3,
    'masc_very_high': -4
  };

  const exerciseLevel = emphasisLevels[exerciseEmphasis] || 0;
  const requiredLevel = emphasisLevels[requiredEmphasis] || 0;

  // Same direction (both fem or both masc) = partial bonus
  if (Math.sign(exerciseLevel) === Math.sign(requiredLevel) && exerciseLevel !== 0) {
    const difference = Math.abs(exerciseLevel - requiredLevel);
    return 50 - (difference * 10); // Closer = higher bonus (50, 40, 30, 20, 10)
  }

  // Neutral is acceptable for any goal (but lower bonus)
  if (exerciseEmphasis === 'neutral') {
    return 20;
  }

  // Wrong gender direction = penalty
  return -30;
}

/**
 * Calculate diversity penalty to avoid overworking same muscle groups
 */
function calculateDiversityPenalty(
  exercise: Exercise,
  alreadySelected: Exercise[]
): number {
  let penalty = 0;

  // Penalize if same target muscles already heavily used
  if (exercise.target_muscles) {
    const targetMuscleCount = alreadySelected.filter(ex =>
      ex.target_muscles === exercise.target_muscles
    ).length;
    penalty += targetMuscleCount * 15;
  }

  // Penalize if secondary muscles overlap
  if (exercise.secondary_muscles) {
    const secondaryOverlap = alreadySelected.filter(ex =>
      ex.secondary_muscles === exercise.secondary_muscles
    ).length;
    penalty += secondaryOverlap * 5;
  }

  // Additional penalty for same pattern repetition
  const samePatternCount = alreadySelected.filter(ex =>
    ex.pattern === exercise.pattern
  ).length;
  if (samePatternCount > 0) {
    penalty += samePatternCount * 3; // Light penalty for pattern diversity
  }

  return penalty;
}

/**
 * Fill remaining slots when pattern requirements don't cover all exercises needed
 */
function fillRemainingSlots(
  pool: Exercise[],
  dayTemplate: DayTemplate,
  profile: Profile,
  usedIds: Set<string>,
  alreadySelected: Exercise[],
  slotsNeeded: number
): Exercise[] {
  const unused = pool.filter(ex => !usedIds.has(ex.id));
  if (unused.length === 0) {
    if (__DEV__) console.warn(`⚠️ No unused exercises available to fill ${slotsNeeded} remaining slots`);
    return [];
  }

  // Score remaining exercises based on day focus and profile
  const scored = unused.map(ex => {
    let score = (ex.effectiveness_rating || 5) * 10;
    const reasons: string[] = ['filler'];

    // Prefer exercises that match day focus
    if (dayTemplate.focus === 'lower_body' && (
      ex.target_muscles?.toLowerCase().includes('glutes') ||
      ex.target_muscles?.toLowerCase().includes('quads') ||
      ex.target_muscles?.toLowerCase().includes('hamstrings')
    )) {
      score += 20;
      reasons.push('focus match +20');
    } else if (dayTemplate.focus === 'upper_body' && (
      ex.target_muscles?.toLowerCase().includes('shoulders') ||
      ex.target_muscles?.toLowerCase().includes('chest') ||
      ex.target_muscles?.toLowerCase().includes('back')
    )) {
      score += 20;
      reasons.push('focus match +20');
    }

    // Match experience level
    if (ex.difficulty === profile.fitness_experience) {
      score += 10;
      reasons.push('experience +10');
    }

    return {
      exercise: ex,
      score,
      reasons
    };
  });

  scored.sort((a, b) => b.score - a.score);

  const selected = scored.slice(0, slotsNeeded).map(s => s.exercise);

  if (__DEV__ && selected.length > 0) {
    console.log(`  ✓ Filled ${selected.length} remaining slots with filler exercises`);
    selected.forEach((ex, i) => {
      const s = scored[i];
      console.log(`    ${i + 1}. ${ex.name} (score: ${s.score.toFixed(1)}, ${s.reasons.join(', ')})`);
    });
  }

  return selected;
}

