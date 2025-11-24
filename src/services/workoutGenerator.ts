// src/services/workoutGenerator.ts
// Core workout generation logic with filtering and selection

import { Exercise, Workout, ExerciseInstance } from '../types';
import { Profile } from './storage/profile';
import { mapRawEquipmentToCanonical, CanonicalEquipment } from '../utils/equipment';

interface WorkoutGenerationOptions {
  duration: 5 | 15 | 30 | 45;
  profile: Profile;
  availableExercises: Exercise[];
}

/**
 * Main entry point: Generate a workout based on user profile
 */
export function generateWorkout(
  profile: Profile,
  duration: 5 | 15 | 30 | 45,
  availableExercises: Exercise[]
): Workout {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🎯 GENERATING WORKOUT (${duration} min)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const options: WorkoutGenerationOptions = {
    duration,
    profile,
    availableExercises,
  };

  // 1. Filter exercises by equipment
  const equipmentFiltered = filterByEquipment(
    options.availableExercises,
    profile.equipment || []
  );

  // 2. Filter by constraints (binder aware, post-op, etc.)
  const constraintsFiltered = filterByConstraints(
    equipmentFiltered,
    profile.constraints || []
  );

  // 3. Select exercises based on goals + *balanced equipment mix*
  const selectedExercises = selectByGoals(
    constraintsFiltered,
    profile,
    duration
  );

  // 4. Structure into a workout (sets, reps, rest, format)
  const workout = structureWorkout(selectedExercises, duration);

  console.log('✅ Workout generation complete');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return workout;
}

/**
 * Filter exercises by available equipment
 * Returns exercises that can be performed with user's equipment
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
 * Select exercises based on user goals and body focus preferences,
 * while also balancing equipment types the user selected.
 */
export function selectByGoals(
  exercises: Exercise[],
  profile: Profile,
  duration: number
): Exercise[] {
  const exercisesNeeded = calculateExerciseCount(duration);

  if (exercises.length === 0) {
    console.error('❌ No exercises available after filtering!');
    return [];
  }

  // 1) Score each exercise by how well it matches the profile
  type Scored = { exercise: Exercise; score: number };
  const scored: Scored[] = exercises.map(exercise => ({
    exercise,
    score: calculateExerciseScore(exercise, profile),
  }));

  // 2) Determine canonical equipment types the user actually selected
  const userEquipmentCanonical = Array.from(
    new Set((profile.equipment || []).map(e => e.toLowerCase()))
  );

  if (userEquipmentCanonical.length === 0) {
    console.warn('⚠️ No canonical equipment in profile, falling back to score-only');
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, exercisesNeeded)
      .map(s => s.exercise);
  }

  // 3) For each exercise, figure out which of the user's equipment types it satisfies
  type ScoredWithEquip = Scored & { equipHits: string[]; primaryEquip: string };

  const preferenceOrder = [
    // prioritise non-bodyweight equipment first so they don't get drowned out
    ...userEquipmentCanonical.filter(eq => eq !== 'bodyweight'),
    ...userEquipmentCanonical.filter(eq => eq === 'bodyweight'),
  ];

  const scoredWithEquip: ScoredWithEquip[] = scored.map(item => {
    const ex = item.exercise;
    const equipmentList: string[] = [
      ...(ex.equipment || []),
    ];

    const hitsSet = new Set<string>();

    for (const eq of equipmentList) {
      const mapped = mapRawEquipmentToCanonical(eq) || eq.toLowerCase();
      if (userEquipmentCanonical.includes(mapped)) {
        hitsSet.add(mapped);
      }
    }

    // If we somehow didn't detect any hit but the user ONLY selected bodyweight,
    // treat it as bodyweight. Otherwise, let it be "other".
    if (hitsSet.size === 0 && userEquipmentCanonical.length === 1 && userEquipmentCanonical[0] === 'bodyweight') {
      hitsSet.add('bodyweight');
    }

    const hits = Array.from(hitsSet);
    let primaryEquip = 'other';

    for (const pref of preferenceOrder) {
      if (hits.includes(pref)) {
        primaryEquip = pref;
        break;
      }
    }

    return { ...item, equipHits: hits, primaryEquip };
  });

  // 4) Group by primary equipment
  const groups = new Map<string, ScoredWithEquip[]>();
  for (const item of scoredWithEquip) {
    const key = item.primaryEquip;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  // Keep only equipment buckets the user actually selected
  const activeEquipment = preferenceOrder.filter(eq => groups.has(eq));
  if (activeEquipment.length === 0) {
    console.warn('⚠️ No active equipment groups, falling back to score-only');
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, exercisesNeeded)
      .map(s => s.exercise);
  }

  // Sort each group by score descending
  for (const eq of activeEquipment) {
    groups.get(eq)!.sort((a, b) => b.score - a.score);
  }

  // 5) Compute per-equipment quotas
  const k = activeEquipment.length;
  const base = Math.floor(exercisesNeeded / k);
  let remainder = exercisesNeeded % k;

  console.log(
    `⚖️ Equipment balancing: need ${exercisesNeeded} exercises across ${k} equipment types (base ${base} each, ${remainder} extra to distribute)`
  );

  const selected: Exercise[] = [];
  const usedIds = new Set<string | number>();

  const takeFromGroup = (eq: string, count: number): number => {
    const bucket = groups.get(eq);
    if (!bucket || bucket.length === 0) return 0;

    let taken = 0;
    while (bucket.length > 0 && taken < count && selected.length < exercisesNeeded) {
      const item = bucket.shift()!;
      const id = item.exercise.id;
      if (usedIds.has(id)) continue;
      selected.push(item.exercise);
      usedIds.add(id);
      taken++;
    }
    return taken;
  };

  let totalTaken = 0;

  // First pass: give each equipment its base quota
  for (const eq of activeEquipment) {
    const got = takeFromGroup(eq, base);
    totalTaken += got;
  }

  // Second pass: distribute remaining 1-by-1 in equipment order
  while (remainder > 0 && totalTaken < exercisesNeeded) {
    let madeProgress = false;

    for (const eq of activeEquipment) {
      if (remainder <= 0 || totalTaken >= exercisesNeeded) break;
      const got = takeFromGroup(eq, 1);
      if (got > 0) {
        remainder -= got;
        totalTaken += got;
        madeProgress = true;
      }
    }

    if (!madeProgress) break; // no more exercises to take
  }

  // 6) Final pass: if we still don't have enough, fill from any remaining exercises by score
  if (totalTaken < exercisesNeeded) {
    const leftover: ScoredWithEquip[] = [];
    for (const eq of activeEquipment) {
      leftover.push(...(groups.get(eq) || []));
    }
    leftover.sort((a, b) => b.score - a.score);

    for (const item of leftover) {
      if (totalTaken >= exercisesNeeded) break;
      const id = item.exercise.id;
      if (usedIds.has(id)) continue;
      selected.push(item.exercise);
      usedIds.add(id);
      totalTaken++;
    }
  }

  console.log(`📋 Selected exercises (with scores & equipment mix):`);
  selected.forEach(ex => {
    const scoreObj = scored.find(s => s.exercise.id === ex.id);
    console.log(
      `  - ${ex.name} [${(ex.equipment || []).join(', ')}] (score: ${
        scoreObj ? scoreObj.score.toFixed(1) : 'n/a'
      })`
    );
  });

  return selected;
}

/**
 * Calculate a score for an exercise based on how well it matches the user's profile
 * Higher score = better match
 */
function calculateExerciseScore(
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

/**
 * Calculate how many exercises to include based on duration
 */
function calculateExerciseCount(duration: number): number {
  const mapping: Record<
    5 | 15 | 30 | 45,
    { min: number; max: number; default: number }
  > = {
    5: { min: 1, max: 3, default: 2 },
    15: { min: 3, max: 6, default: 4 },
    30: { min: 4, max: 8, default: 6 },
    45: { min: 5, max: 10, default: 8 },
  };

  const config = mapping[duration as 5 | 15 | 30 | 45];
  return config.default;
}

/**
 * Structure selected exercises into workout format
 * Assigns sets, reps, format, rest periods
 */
export function structureWorkout(
  exercises: Exercise[],
  duration: number
): Workout {
  const exerciseInstances: ExerciseInstance[] = exercises.map(exercise => {
    const sets = calculateSets(duration, exercise.difficulty);
    const reps = calculateReps(exercise.difficulty);
    const format = selectFormat(duration);
    const restSeconds = calculateRest(duration, exercise.difficulty);

    return {
      exerciseId: exercise.id,
      sets,
      reps,
      format,
      restSeconds,
    };
  });

  return {
    duration: duration as 5 | 15 | 30 | 45,
    exercises: exerciseInstances,
    totalMinutes: duration,
  };
}

/**
 * Determine number of sets based on duration and difficulty
 */
function calculateSets(
  duration: number,
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): number {
  if (duration === 5) return 1;
  if (duration === 15) return difficulty === 'advanced' ? 4 : 3;
  if (duration === 30) return difficulty === 'beginner' ? 3 : 4;
  return difficulty === 'beginner' ? 4 : 5;
}

/**
 * Determine reps based on difficulty
 */
function calculateReps(
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): number {
  switch (difficulty) {
    case 'beginner':
      return 10;
    case 'intermediate':
      return 12;
    case 'advanced':
      return 15;
    default:
      return 10;
  }
}

/**
 * Select workout format based on duration
 */
function selectFormat(duration: number): 'EMOM' | 'AMRAP' | 'straight_sets' {
  switch (duration) {
    case 5:
      return 'straight_sets';
    case 15:
      return 'straight_sets';
    case 30:
      return 'straight_sets';
    case 45:
      return 'straight_sets';
    default:
      return 'straight_sets';
  }
}

/**
 * Determine rest time between sets based on duration and difficulty
 */
function calculateRest(
  duration: number,
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): number {
  if (duration === 5) return 15;
  if (duration === 15) return difficulty === 'advanced' ? 45 : 30;
  if (duration === 30) return difficulty === 'beginner' ? 60 : 45;
  return difficulty === 'beginner' ? 60 : 45;
}

/**
 * Utility: pretty-print a workout for debugging
 */
export function printWorkoutSummary(workout: Workout): void {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📋 WORKOUT SUMMARY (${workout.duration} min)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total exercises: ${workout.exercises.length}`);
  console.log(`Total duration: ${workout.totalMinutes} minutes`);
  console.log('\nExercises:');
  workout.exercises.forEach((ex, idx) => {
    console.log(`  ${idx + 1}. Exercise ID: ${ex.exerciseId}`);
    console.log(`     Format: ${ex.format}`);
    console.log(`     Sets: ${ex.sets} x ${ex.reps} reps`);
    console.log(`     Rest: ${ex.restSeconds}s`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}
