// src/services/workoutGenerator.ts
// Core workout generation logic with filtering and selection
// 
// ⚠️ DEPRECATION NOTICE: This file contains Phase 1 workout generation logic.
// New code should use Phase 2 system in workoutGeneration/index.ts for individual workouts.
// This file is kept for planGenerator.ts compatibility and will be migrated in the future.

import { Exercise, Workout, ExerciseInstance } from '../types';
import { Profile } from './storage/profile';
import { mapRawEquipmentToCanonical, CanonicalEquipment } from '../utils/equipment';
import { DayTemplate, SelectedTemplate } from './workoutGeneration/templates/types';
import { evaluateSafetyRules } from './rulesEngine/evaluator';
import { SafetyContext, BlockCriteria } from './rulesEngine/rules/types';
import { fetchAllExercises } from './exerciseService';
import { selectExercisesForDay } from './workoutGeneration/exerciseSelection';
import { calculateVolumeAdjustments, VolumeAdjustments } from './workoutGeneration/volumeAdjustment';
import { filterByEquipment, filterByConstraints, calculateExerciseScore } from './workoutGeneration/utils';

interface WorkoutGenerationOptions {
  duration: 30 | 45 | 60 | 90;
  profile: Profile;
  availableExercises: Exercise[];
}

/**
 * Main entry point: Generate a workout based on user profile
 */
export function generateWorkout(
  profile: Profile,
  duration: 30 | 45 | 60 | 90,
  availableExercises: Exercise[],
  dayTemplate?: DayTemplate,  // Optional day template
  selectedTemplate?: SelectedTemplate,  // Optional selected template (for volume adjustments)
  safetyContext?: SafetyContext  // Optional safety context (for volume adjustments)
): Workout {
  console.log(`🏋️ Generating ${duration}min workout`);

  // Apply existing filters
  const withEquipment = filterByEquipment(
    availableExercises,
    profile.equipment || []
  );
  const safeExercises = filterByConstraints(
    withEquipment,
    profile.constraints || []
  );

  // NEW: Use smart selection if template provided, otherwise fall back to old logic
  let selectedExercises: Exercise[];

  if (dayTemplate) {
    console.log(`  Using template: ${dayTemplate.name}`);
    selectedExercises = selectExercisesForDay(
      safeExercises,
      dayTemplate,
      profile
    );
  } else {
    // Fallback to old selection (for backwards compatibility)
    console.log(`  Using legacy selection (no template)`);
    selectedExercises = selectByGoals(safeExercises, profile, duration);
  }

  console.log(`✅ Selected ${selectedExercises.length} exercises`);

  // NEW: Calculate volume adjustments if template and safety context provided
  let volumeAdjustments: VolumeAdjustments | undefined;
  if (selectedTemplate && safetyContext) {
    volumeAdjustments = calculateVolumeAdjustments(
      profile,
      selectedTemplate,
      safetyContext
    );
  }

  // Generate workout name from template
  const workoutName = dayTemplate?.name;

  // Structure into a workout (sets, reps, rest, format)
  const workout = structureWorkout(
    selectedExercises,
    duration,
    profile,
    volumeAdjustments,
    workoutName
  );

  return workout;
}

/**
 * Filter exercises by available equipment
 * @deprecated Use filterByEquipment from workoutGeneration/utils.ts instead
 * Kept for backwards compatibility
 */
export { filterByEquipment };

/**
 * Filter exercises by safety constraints
 * @deprecated Use filterByConstraints from workoutGeneration/utils.ts instead
 * Kept for backwards compatibility
 */
export { filterByConstraints };

/**
 * Get filtered exercise pool with Rules Engine evaluation
 * Integrates Phase 1 Rules Engine before existing filters
 */
export async function getFilteredExercisePool(profile: Profile): Promise<{
  exercises: Exercise[];
  safetyContext: SafetyContext;
}> {
  // 1. Load all exercises
  const allExercises = await fetchAllExercises();

  // 2. Run Rules Engine (Phase 1)
  const safetyContext = await evaluateSafetyRules(profile, allExercises);

  // 3. Apply critical blocks (post-op early phase)
  let filtered = applyCriticalBlocks(allExercises, safetyContext.critical_blocks);

  // 4. Exclude unsafe exercises from Rules Engine
  filtered = filtered.filter(ex =>
    !safetyContext.excluded_exercise_ids.includes(parseInt(ex.id))
  );

  // 5. Apply existing equipment filter
  filtered = filterByEquipment(filtered, profile.equipment || []);

  // 6. Apply existing constraints filter
  filtered = filterByConstraints(filtered, profile.constraints || []);

  console.log(`✅ Exercise filtering complete:`);
  console.log(`   Started with: ${allExercises.length} exercises`);
  console.log(`   After rules engine: ${filtered.length} exercises`);
  console.log(`   Rules applied: ${safetyContext.rules_applied.length}`);
  console.log(`   Excluded: ${safetyContext.excluded_exercise_ids.length} unsafe exercises`);

  return { exercises: filtered, safetyContext };
}

/**
 * Apply critical blocks to filter exercises by pattern or muscle groups
 * Used for post-operative early phase restrictions
 */
function applyCriticalBlocks(
  exercises: Exercise[],
  blocks: BlockCriteria[]
): Exercise[] {
  if (blocks.length === 0) return exercises;

  return exercises.filter(ex => {
    for (const block of blocks) {
      // Check if exercise pattern is blocked
      if (block.patterns && block.patterns.includes(ex.pattern)) {
        return false;
      }

      // Check if exercise targets blocked muscle groups
      // target_muscles is a string (may contain comma-separated values)
      if (block.muscle_groups && ex.target_muscles) {
        const targetMusclesLower = ex.target_muscles.toLowerCase();
        const targetsBlocked = block.muscle_groups.some(mg =>
          targetMusclesLower.includes(mg.toLowerCase())
        );
        if (targetsBlocked) return false;
      }
    }
    return true;
  });
}

/**
 * Select exercises based on user goals and body focus preferences,
 * while also balancing equipment types the user selected.
 * 
 * @deprecated This function is kept for backwards compatibility.
 * Use selectExercisesForDay() with a DayTemplate for trans-specific smart selection.
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

// calculateExerciseScore is now imported from workoutGeneration/utils.ts

/**
 * Calculate how many exercises to include based on duration
 */
function calculateExerciseCount(duration: number): number {
  const mapping: Record<
    30 | 45 | 60 | 90,
    { min: number; max: number; default: number }
  > = {
    30: { min: 4, max: 8, default: 6 },
    45: { min: 5, max: 10, default: 8 },
    60: { min: 6, max: 12, default: 10 },
    90: { min: 8, max: 15, default: 12 },
  };

  const config = mapping[duration as 30 | 45 | 60 | 90];
  return config?.default || 6; // Fallback to 6 if duration not in mapping
}

/**
 * Structure selected exercises into workout format
 * Assigns sets, reps, format, rest periods
 * Applies volume adjustments if provided
 */
/**
 * Structure selected exercises into workout format
 * Assigns sets, reps, format, rest periods, and weight guidance
 * Applies volume adjustments if provided
 * 
 * @param exercises - Selected exercises for the workout
 * @param duration - Workout duration in minutes
 * @param profile - User profile for personalization
 * @param volumeAdjustments - Optional volume adjustments from HRT/experience
 * @returns Structured workout with exercise instances
 */
export function structureWorkout(
  exercises: Exercise[],
  duration: number,
  profile: Profile,
  volumeAdjustments?: VolumeAdjustments,
  workoutName?: string
): Workout {
  const exerciseInstances: ExerciseInstance[] = exercises.map((exercise, index) => {
    // Calculate sets with consideration for compound/accessory placement
    const sets = calculateSets(
      duration,
      exercise.difficulty,
      index,
      exercises.length,
      volumeAdjustments
    );

    // Calculate reps based on goal (strength/hypertrophy/endurance)
    const reps = calculateReps(
      exercise.difficulty,
      profile.primary_goal,
      volumeAdjustments
    );

    // Determine workout format (EMOM, AMRAP, or straight sets)
    const format = selectFormat(duration);
    
    // Calculate rest periods based on exercise pattern and goal
    const restSeconds = calculateRest(
      duration,
      exercise.difficulty,
      volumeAdjustments
    );

    // Determine weight guidance based on experience level
    const weight_guidance = determineWeightGuidance(exercise, profile);

    return {
      exerciseId: exercise.id,
      sets,
      reps,
      format,
      restSeconds,
      weight_guidance,
    };
  });

  return {
    name: workoutName,
    duration: duration as 30 | 45 | 60 | 90,
    exercises: exerciseInstances,
    totalMinutes: duration,
  };
}

/**
 * Determine weight selection guidance based on user experience level
 * Provides actionable advice for selecting appropriate resistance
 * 
 * @param exercise - The exercise being performed
 * @param profile - User profile containing experience level
 * @returns Weight selection guidance string
 */
function determineWeightGuidance(
  exercise: Exercise,
  profile: Profile
): string {
  switch (profile.fitness_experience) {
    case 'beginner':
      return 'Start light, focus on form';
    case 'intermediate':
      return 'Moderate weight, leave 2-3 reps in reserve';
    case 'advanced':
      return 'Challenging weight, leave 1-2 reps in reserve';
    default:
      return 'Choose appropriate weight';
  }
}

/**
 * Determine number of sets based on duration, difficulty, and exercise position
 * 
 * Set distribution strategy:
 * - First 2-3 exercises (compound lifts): Get more sets (4-5 sets)
 *   These are typically squat, deadlift, bench press, rows - the big movements
 *   that drive most muscle growth and strength gains
 * - Later exercises (accessories/isolation): Get fewer sets (2-3 sets)
 *   These support muscle growth but don't need as much volume
 * 
 * Duration-based adjustments:
 * - 5 min: Minimal sets (1 set per exercise for time efficiency)
 * - 15 min: Moderate sets (3-4 sets, compound lifts prioritized)
 * - 30 min: Standard sets (3-4 sets based on difficulty)
 * - 45 min: Maximum sets (4-5 sets, allows full volume)
 * 
 * @param duration - Workout duration in minutes (5, 15, 30, or 45)
 * @param difficulty - Exercise difficulty level
 * @param exerciseIndex - Position of exercise in workout (0-based)
 * @param totalExercises - Total number of exercises in workout
 * @param volumeAdjustments - Optional volume adjustments from HRT/experience level
 * @returns Number of sets (clamped between 2-5)
 */
function calculateSets(
  duration: number,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  exerciseIndex: number,
  totalExercises: number,
  volumeAdjustments?: VolumeAdjustments
): number {
  // Base sets calculation based on duration and difficulty
  let baseSets: number;
  
  // 5-minute workouts: Minimal volume for quick sessions
  if (duration === 5) {
    baseSets = 1;
  }
  // 15-minute workouts: Moderate volume, prioritize compound movements
  else if (duration === 15) {
    // First 2 exercises get more sets (compound lifts)
    if (exerciseIndex < 2) {
      baseSets = difficulty === 'advanced' ? 4 : 3;
    } else {
      // Accessories get fewer sets
      baseSets = 2;
    }
  }
  // 30-minute workouts: Standard volume distribution
  else if (duration === 30) {
    // First 3 exercises (compound lifts) get more sets
    if (exerciseIndex < 3) {
      baseSets = difficulty === 'beginner' ? 3 : 4;
    } else {
      // Accessories get fewer sets
      baseSets = difficulty === 'beginner' ? 2 : 3;
    }
  }
  // 45-minute workouts: Maximum volume
  else {
    // First 3 exercises (compound lifts) get maximum sets
    if (exerciseIndex < 3) {
      baseSets = difficulty === 'beginner' ? 4 : 5;
    } else {
      // Accessories get moderate sets
      baseSets = difficulty === 'beginner' ? 3 : 4;
    }
  }

  // Apply volume multiplier from HRT/experience adjustments
  // This is critical for MTF users on estrogen who need reduced volume
  if (volumeAdjustments) {
    baseSets = Math.round(baseSets * volumeAdjustments.sets_multiplier);
  }

  // Clamp to reasonable range (2-5 sets for most exercises, minimum 1 for 5-min workouts)
  // This prevents overtraining and ensures minimum effective volume
  const minSets = duration === 5 ? 1 : 2;
  const maxSets = 5;
  baseSets = Math.max(minSets, Math.min(maxSets, baseSets));

  return baseSets;
}

/**
 * Determine rep ranges based on primary goal and difficulty level
 * 
 * Goal-based rep ranges (evidence-based):
 * - Strength (4-6 reps): Heavy weights, neural adaptations, maximum strength
 * - Hypertrophy (8-12 reps): Moderate weights, optimal for muscle growth
 *   - Feminization goals use hypertrophy ranges (8-12) for glute/leg development
 *   - Masculinization goals use hypertrophy ranges (8-12) for upper body development
 * - Endurance (15-20 reps): Light weights, muscular endurance
 * - General fitness: Defaults to hypertrophy range (8-12)
 * 
 * Difficulty-based adjustments:
 * - Beginner: Lower end of range (e.g., 8-10 for hypertrophy)
 * - Intermediate: Middle of range (e.g., 10-12 for hypertrophy)
 * - Advanced: Higher end of range (e.g., 10-12 for hypertrophy, can go higher)
 * 
 * @param difficulty - Exercise difficulty level (affects rep selection)
 * @param primaryGoal - User's primary fitness goal (affects rep range)
 * @param volumeAdjustments - Optional reps adjustment from HRT/experience level
 * @returns Rep count (clamped between 5-20)
 */
function calculateReps(
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  primaryGoal?: string,
  volumeAdjustments?: VolumeAdjustments
): number {
  // Determine base rep range based on primary goal
  let baseReps: number;

  if (primaryGoal === 'strength') {
    // Strength training: 4-6 rep range (heavy weight, low reps)
    switch (difficulty) {
      case 'beginner':
        baseReps = 5;
        break;
      case 'intermediate':
        baseReps = 5;
        break;
      case 'advanced':
        baseReps = 6;
        break;
      default:
        baseReps = 5;
    }
  } else if (primaryGoal === 'endurance') {
    // Endurance training: 15-20 rep range (light weight, high reps)
    switch (difficulty) {
      case 'beginner':
        baseReps = 15;
        break;
      case 'intermediate':
        baseReps = 18;
        break;
      case 'advanced':
        baseReps = 20;
        break;
      default:
        baseReps = 15;
    }
  } else {
    // Hypertrophy training: 8-12 rep range (moderate weight, moderate reps)
    // This is the default for feminization, masculinization, and general_fitness
    // Optimal for muscle growth which is the primary goal for trans athletes
    switch (difficulty) {
      case 'beginner':
        baseReps = 10; // Lower end for form focus
        break;
      case 'intermediate':
        baseReps = 12; // Middle of range
        break;
      case 'advanced':
        baseReps = 12; // Can handle higher volume
        break;
      default:
        baseReps = 10;
    }
  }

  // Apply reps adjustment from volume adjustments
  // Advanced users can add +2 reps, beginners stay at base
  if (volumeAdjustments && volumeAdjustments.reps_adjustment !== 0) {
    baseReps += volumeAdjustments.reps_adjustment;
  }

  // Clamp to reasonable range (5-20 reps)
  // Prevents unrealistic rep counts that would compromise form or effectiveness
  baseReps = Math.max(5, Math.min(20, baseReps));

  return baseReps;
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
 * Determine rest time between sets based on exercise pattern and goal
 * 
 * Pattern-based rest periods:
 * - Compound movements (squat, deadlift, bench, rows): 60-90 seconds
 *   These movements require more recovery due to high neuromuscular demand
 * - Isolation movements (biceps, triceps, calves): 30-45 seconds
 *   These movements are less taxing and can recover faster
 * 
 * Goal-based rest periods:
 * - Strength training: Longer rest (90-120s) to allow full recovery
 *   Needed for maximum force production on next set
 * - Hypertrophy training: Moderate rest (60-90s for compounds, 30-45s for isolation)
 *   Allows sufficient recovery while maintaining metabolic stress
 * - Endurance training: Shorter rest (30-45s) to maintain elevated heart rate
 *   Focuses on cardiovascular adaptations
 * 
 * Difficulty adjustments:
 * - Beginners: More rest (better recovery, form focus)
 * - Advanced: Less rest (conditioned athletes, efficiency)
 * 
 * @param duration - Workout duration (affects time constraints)
 * @param difficulty - Exercise difficulty level (affects recovery needs)
 * @param volumeAdjustments - Optional rest multiplier from HRT/experience level
 * @returns Rest time in seconds (clamped between 10-120)
 */
function calculateRest(
  duration: number,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  volumeAdjustments?: VolumeAdjustments
): number {
  // Base rest calculation based on duration and difficulty
  // For now, we use a simplified model - in future, we'd consider exercise pattern
  let baseRest: number;
  
  // 5-minute workouts: Minimal rest for time efficiency
  if (duration === 5) {
    baseRest = 15;
  }
  // 15-minute workouts: Moderate rest, prioritize time efficiency
  else if (duration === 15) {
    // Advanced users need less rest (better conditioning)
    baseRest = difficulty === 'advanced' ? 45 : 30;
  }
  // 30-minute workouts: Standard rest periods
  else if (duration === 30) {
    // Beginners need more rest for recovery
    baseRest = difficulty === 'beginner' ? 60 : 45;
  }
  // 45-minute workouts: Full rest periods
  else {
    // Beginners get more rest to focus on form and recovery
    baseRest = difficulty === 'beginner' ? 60 : 45;
  }

  // Apply rest multiplier from volume adjustments
  // Beginners get +20% rest, advanced get -10% rest
  // MTF on estrogen may get additional rest for recovery
  if (volumeAdjustments) {
    baseRest = Math.round(baseRest * volumeAdjustments.rest_multiplier);
  }

  // Clamp to reasonable range (10-120 seconds)
  // Prevents too short (insufficient recovery) or too long (workout drags)
  baseRest = Math.max(10, Math.min(120, baseRest));

  return baseRest;
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

