// src/services/planGenerator.ts
// Orchestrates generation of multi-day workout plans
// Uses Phase 2 workoutGeneration system for trans-specific safety features

import { Plan, Day, Workout, Goal, WarmupCooldownSection, InjectedCheckpoint, WorkoutMetadata } from '../types';
import { Profile } from './storage/profile';
import { getFilteredExercisePool } from './workoutGenerator';
import { fetchAllExercises } from './exerciseService';
import { selectTemplate } from './workoutGeneration/templateSelection';
import { DayTemplate, SelectedTemplate } from './workoutGeneration/templates/types';
import { selectExercisesForDay } from './workoutGeneration/exerciseSelection';
import { calculateVolumeAdjustments, VolumeAdjustments } from './workoutGeneration/volumeAdjustment';
import { generateWarmup, generateCooldown } from './workoutGeneration/warmupCooldown';
import { injectSafetyCheckpoints, convertToPrescriptions } from './workoutGeneration/checkpointInjection';
import { SafetyContext } from './rulesEngine/rules/types';
import { logger } from '../utils/logger';
import { Exercise, ExerciseInstance } from '../types';

/**
 * Profile Validation
 * Checks for contradictory or impossible profile data before generating workouts
 */
export interface ProfileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateProfile(profile: Profile): ProfileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get surgery types for validation
  const surgeryTypes = (profile.surgeries || []).map(s => s.type);

  // Check for contradictory surgeries
  const hasVaginoplasty = surgeryTypes.includes('vaginoplasty');
  const hasPhalloplasty = surgeryTypes.includes('phalloplasty');
  const hasMetoidioplasty = surgeryTypes.includes('metoidioplasty');

  // Vaginoplasty and phalloplasty/metoidioplasty are mutually exclusive
  if (hasVaginoplasty && (hasPhalloplasty || hasMetoidioplasty)) {
    errors.push('Profile has both vaginoplasty and phalloplasty/metoidioplasty selected. Please correct your surgery history.');
  }

  // Phalloplasty and metoidioplasty are typically mutually exclusive (can have both but rare)
  if (hasPhalloplasty && hasMetoidioplasty) {
    warnings.push('Profile has both phalloplasty and metoidioplasty selected. If this is correct, please continue.');
  }

  // Check for surgery dates in the future
  const now = new Date();
  for (const surgery of profile.surgeries || []) {
    if (surgery.date && new Date(surgery.date) > now) {
      errors.push(`Surgery date for ${surgery.type} is in the future. Please correct the date.`);
    }
  }

  // Check for HRT date in the future
  if (profile.hrt_start_date && new Date(profile.hrt_start_date) > now) {
    errors.push('HRT start date is in the future. Please correct the date.');
  }

  // Validate binding for MTF users (unusual but not impossible)
  if (profile.gender_identity === 'mtf' && profile.binds_chest) {
    warnings.push('Binding marked for MTF user. If this is correct, please continue.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Phase 2 Workout Generation
 * Generates a complete workout with warm-up, cool-down, and safety checkpoints
 * This is the trans-specific workout generator with all safety features
 */
function generatePhase2Workout(
  profile: Profile,
  duration: 30 | 45 | 60 | 90,
  exercises: Exercise[],
  dayTemplate: DayTemplate,
  template: SelectedTemplate,
  safetyContext: SafetyContext
): Workout {
  // Phase 2C: Select Exercises (including dysphoria soft filters)
  const selectedExercises = selectExercisesForDay(
    exercises,
    dayTemplate,
    profile,
    [],
    safetyContext
  );

  // Phase 2D: Volume Adjustments
  const volumeAdjustments = calculateVolumeAdjustments(
    profile,
    template,
    safetyContext
  );

  // Phase 2E: Prescribe Sets/Reps/Rest
  const prescriptions = selectedExercises.map((ex, i) =>
    prescribeExercise(
      ex,
      i,
      selectedExercises.length,
      duration,
      profile,
      volumeAdjustments
    )
  );

  // Phase 2F: Warm-up & Cool-down
  const warmup = generateWarmup(dayTemplate, selectedExercises);
  const cooldown = generateCooldown(dayTemplate, selectedExercises);

  // Phase 2G: Safety Checkpoints
  const exerciseNameMap = new Map<string, string>();
  selectedExercises.forEach(ex => {
    exerciseNameMap.set(ex.id, ex.name);
  });

  const prescriptionsForCheckpoints = convertToPrescriptions(
    prescriptions,
    exerciseNameMap
  );

  const estimatedMainDuration = estimatePrescriptionsDuration(prescriptions);
  const totalDuration = warmup.total_duration_minutes +
                       cooldown.total_duration_minutes +
                       estimatedMainDuration;

  const checkpoints = injectSafetyCheckpoints(
    prescriptionsForCheckpoints,
    safetyContext,
    totalDuration
  );

  // Map checkpoint types and convert severity
  const mappedCheckpoints = checkpoints.map((cp, index) => {
    // Map checkpoint type to plan-compatible type
    let planType: 'safety_reminder' | 'binder_break' | 'hydration' | 'pelvic_floor_check' | 'scar_care';
    switch (cp.type) {
      case 'binder_break':
        planType = 'binder_break';
        break;
      case 'scar_care':
        planType = 'scar_care';
        break;
      case 'sensitivity_check':
        planType = 'pelvic_floor_check';
        break;
      case 'hrt_reminder':
      case 'safety_reminder':
      case 'post_workout_reminder':
      default:
        planType = 'safety_reminder';
    }

    // Map severity to plan-compatible values
    let planSeverity: 'info' | 'low' | 'medium' | 'high';
    switch (cp.severity) {
      case 'critical':
        planSeverity = 'high';
        break;
      case 'high':
        planSeverity = 'high';
        break;
      case 'medium':
        planSeverity = 'medium';
        break;
      case 'low':
      default:
        planSeverity = 'low';
    }

    return {
      exercise_index: index, // Use checkpoint index as proxy for exercise position
      type: planType,
      message: cp.message,
      severity: planSeverity,
      requires_acknowledgment: planSeverity === 'high' || planSeverity === 'medium'
    };
  });

  // Build workout with Phase 2 data
  const workout: Workout = {
    name: dayTemplate.name,
    duration,
    exercises: prescriptions,
    totalMinutes: duration,
    warmUp: warmup,
    coolDown: cooldown,
    safetyCheckpoints: mappedCheckpoints,
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

  return workout;
}

/**
 * Prescribe sets, reps, rest, and weight guidance for a single exercise
 * Applies volume adjustments from HRT and experience level
 */
function prescribeExercise(
  exercise: Exercise,
  index: number,
  total: number,
  duration: number,
  profile: Profile,
  volumeAdjustments: VolumeAdjustments
): ExerciseInstance {
  const sets = calculateSets(duration, exercise.difficulty, index, total, volumeAdjustments);
  const reps = calculateReps(exercise.difficulty, profile.primary_goal, volumeAdjustments);
  const restSeconds = calculateRest(duration, exercise.difficulty, volumeAdjustments);
  const weight_guidance = determineWeightGuidance(profile, volumeAdjustments);

  return {
    exerciseId: exercise.id,
    sets,
    reps,
    format: 'straight_sets' as const,
    restSeconds,
    weight_guidance
  };
}

/**
 * Calculate sets with volume adjustments
 * Respects max_sets cap from safety rules (e.g., post-op recovery)
 */
function calculateSets(
  duration: number,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  exerciseIndex: number,
  totalExercises: number,
  volumeAdjustments: VolumeAdjustments
): number {
  let baseSets: number;

  if (duration === 30) {
    baseSets = exerciseIndex < 3 ? (difficulty === 'beginner' ? 3 : 4) : (difficulty === 'beginner' ? 2 : 3);
  } else if (duration === 45) {
    baseSets = exerciseIndex < 3 ? (difficulty === 'beginner' ? 3 : 4) : (difficulty === 'beginner' ? 2 : 3);
  } else if (duration === 60) {
    baseSets = exerciseIndex < 3 ? (difficulty === 'beginner' ? 4 : 5) : (difficulty === 'beginner' ? 3 : 4);
  } else {
    baseSets = exerciseIndex < 3 ? (difficulty === 'beginner' ? 4 : 5) : (difficulty === 'beginner' ? 3 : 4);
  }

  if (volumeAdjustments) {
    baseSets = Math.round(baseSets * volumeAdjustments.sets_multiplier);

    // Apply max_sets cap from safety rules (e.g., post-op recovery limits)
    if (volumeAdjustments.max_sets && baseSets > volumeAdjustments.max_sets) {
      baseSets = volumeAdjustments.max_sets;
    }
  }

  return Math.max(2, Math.min(5, baseSets));
}

/**
 * Calculate reps with volume adjustments
 * Respects rep_range override from safety rules (e.g., post-op recovery)
 */
function calculateReps(
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  primaryGoal?: string,
  volumeAdjustments?: VolumeAdjustments
): number {
  // If safety rules specify a rep_range override, use that instead
  if (volumeAdjustments?.rep_range) {
    // Parse rep range like "12-15" and use the average
    const match = volumeAdjustments.rep_range.match(/(\d+)-(\d+)/);
    if (match) {
      const minReps = parseInt(match[1]);
      const maxReps = parseInt(match[2]);
      return Math.round((minReps + maxReps) / 2);
    }
    // Single number like "15"
    const singleRep = parseInt(volumeAdjustments.rep_range);
    if (!isNaN(singleRep)) {
      return singleRep;
    }
  }

  let baseReps: number;

  if (primaryGoal === 'strength') {
    baseReps = difficulty === 'advanced' ? 6 : 5;
  } else if (primaryGoal === 'endurance') {
    baseReps = difficulty === 'beginner' ? 15 : (difficulty === 'intermediate' ? 18 : 20);
  } else {
    // Hypertrophy (default for feminization/masculinization)
    baseReps = difficulty === 'beginner' ? 10 : 12;
  }

  if (volumeAdjustments && volumeAdjustments.reps_adjustment !== 0) {
    baseReps += volumeAdjustments.reps_adjustment;
  }

  return Math.max(5, Math.min(20, baseReps));
}

/**
 * Calculate rest with volume adjustments
 */
function calculateRest(
  duration: number,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  volumeAdjustments?: VolumeAdjustments
): number {
  let baseRest: number;

  if (duration === 30) {
    baseRest = difficulty === 'beginner' ? 60 : 45;
  } else {
    baseRest = difficulty === 'beginner' ? 60 : 45;
  }

  if (volumeAdjustments) {
    baseRest = Math.round(baseRest * volumeAdjustments.rest_multiplier);
  }

  return Math.max(10, Math.min(120, baseRest));
}

/**
 * Determine weight guidance based on experience level and safety rules
 */
function determineWeightGuidance(profile: Profile, volumeAdjustments?: VolumeAdjustments): string {
  // If safety rules specify a max_weight override, use that
  if (volumeAdjustments?.max_weight) {
    return `Weight limited to ${volumeAdjustments.max_weight} of normal (recovery phase)`;
  }

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
 * Estimate duration of exercise prescriptions for checkpoint timing
 */
function estimatePrescriptionsDuration(prescriptions: ExerciseInstance[]): number {
  let totalMinutes = 0;

  for (const p of prescriptions) {
    const reps = typeof p.reps === 'number' ? p.reps : 10;
    const workSeconds = p.sets * reps * 3;
    const restSeconds = Math.max(0, (p.sets - 1) * p.restSeconds);
    totalMinutes += (workSeconds + restSeconds) / 60;
  }

  return Math.round(totalMinutes);
}

/**
 * Generate a Quick Start plan - a single 5-minute bodyweight workout
 * This is used for users who want to start immediately without completing their profile
 */
export async function generateQuickStartPlan(): Promise<Plan> {
  // Create a minimal profile for quick start
  const quickStartProfile: Profile = {
    // NEW REQUIRED FIELDS
    id: 'quick-start',
    user_id: 'quick-start-user',
    gender_identity: 'nonbinary',
    on_hrt: false,
    binds_chest: false,
    surgeries: [],
    primary_goal: 'general_fitness',
    fitness_experience: 'beginner',
    workout_frequency: 3,
    session_duration: 15,
    equipment: ['bodyweight'],
    
    // KEEP OLD FIELDS (for compatibility)
    goals: ['wellness'],
    goal_weighting: { primary: 100, secondary: 0 },
    constraints: ['binder_aware'],
    preferred_minutes: [5],
    block_length: 1,
    
    // METADATA
    created_at: new Date(),
    updated_at: new Date(),
  };

  // Use safety-filtered exercises (Rules Engine)
  const { exercises, safetyContext } = await getFilteredExercisePool(quickStartProfile);

  if (exercises.length === 0) {
    // Graceful fallback for quick start - return empty plan with rest day
    const today = new Date();
    const restDay: Day = {
      dayNumber: 1,
      date: today,
      dayOfWeek: today.getDay(),
      isRestDay: true,
      variants: { 30: null, 45: null, 60: null, 90: null },
    };

    return {
      id: 'quick-start',
      blockLength: 1,
      startDate: today,
      goals: ['strength'] as Goal[],
      goalWeighting: { primary: 100, secondary: 0 },
      days: [restDay],
    };
  }

  // Select template and use first day template for quick start
  const template = selectTemplate(quickStartProfile);
  const dayTemplate = template.days[0];

  // Generate a 30-minute workout for quick start using Phase 2
  const workout = generatePhase2Workout(quickStartProfile, 30, exercises, dayTemplate, template, safetyContext);

  // Create a single day with the 30-minute variant
  const day: Day = {
    dayNumber: 1,
    date: new Date(),
    dayOfWeek: new Date().getDay(),
    isRestDay: false,
    variants: {
      30: workout,
      45: null,
      60: null,
      90: null,
    },
  };

  const plan: Plan = {
    id: 'quick-start',
    blockLength: 1,
    startDate: new Date(),
    goals: ['strength'] as Goal[], // Using 'strength' as default goal (wellness not in Goal type)
    goalWeighting: { primary: 100, secondary: 0 },
    days: [day],
  };

  return plan;
}

/**
 * Generate a complete workout plan for a user
 * Creates 7 days (1 week) or 28 days (4 weeks) based on profile.preferences.blockLength
 * Each day has 4 workout variants (30, 45, 60, 90 minutes)
 */
export async function generatePlan(profile: Profile): Promise<Plan> {
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log('🏋️ GENERATING WORKOUT PLAN');
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Validate profile before generating plan
  const validation = validateProfile(profile);
  if (!validation.isValid) {
    logger.log('❌ Profile validation failed:');
    validation.errors.forEach(err => logger.log(`   - ${err}`));
    throw new Error(`Profile validation failed: ${validation.errors.join('; ')}`);
  }
  if (validation.warnings.length > 0) {
    logger.log('⚠️ Profile validation warnings:');
    validation.warnings.forEach(warn => logger.log(`   - ${warn}`));
  }

  logger.log(`User ID: ${profile.id}`);
  logger.log(`Block length: ${profile.block_length || 1} weeks`);
  logger.log(`Goals: ${profile.goals?.join(', ') || 'none'}`);
  logger.log(`Equipment: ${profile.equipment?.join(', ') || 'none'}`);
  logger.log(`Constraints: ${profile.constraints?.join(', ') || 'none'}`);
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Fetch all exercises from Supabase with safety filtering (Rules Engine)
  const { exercises, safetyContext } = await getFilteredExercisePool(profile);
  logger.log(`📚 Loaded ${exercises.length} safe exercises (after Rules Engine filtering)\n`);
  logger.log(`🛡️ Safety rules applied: ${safetyContext.rules_applied.length}`);
  if (safetyContext.rules_applied.length > 0) {
    safetyContext.rules_applied.forEach(rule => {
      logger.log(`   - ${rule.rule_id}: ${rule.userMessage || rule.action_taken}`);
    });
  }

  if (exercises.length === 0) {
    // Graceful fallback: Return a rest-only plan with a helpful message
    // This can happen when safety rules filter out all exercises (e.g., early post-op recovery)
    logger.log('⚠️ No exercises available after safety filtering - suggesting rest-only plan');

    const restDays: Day[] = [];
    const daysCount = (profile.block_length || 1) === 1 ? 7 : 28;
    const startDate = new Date();

    for (let i = 0; i < daysCount; i++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + i);
      restDays.push({
        dayNumber: i + 1,
        date: dayDate,
        dayOfWeek: dayDate.getDay(),
        isRestDay: true,
        variants: { 30: null, 45: null, 60: null, 90: null },
      });
    }

    const recoveryPlan: Plan = {
      id: generatePlanId(),
      blockLength: (profile.block_length || 1) as 1 | 4,
      startDate,
      goals: (profile.goals || []).filter((g): g is Goal =>
        g === 'strength' || g === 'cardio' || g === 'flexibility' || g === 'mobility'
      ),
      goalWeighting: profile.goal_weighting || { primary: 70, secondary: 30 },
      days: restDays,
      workoutDays: [],
    };

    // Note: The UI should check if all days are rest days and show recovery message
    logger.log('✅ Generated recovery plan (all rest days)');
    return recoveryPlan;
  }

  // Select workout template based on profile
  const template = selectTemplate(profile);
  logger.log(`✓ Selected template: ${template.name}`);
  logger.log(`  HRT adjusted: ${template.adjusted_for_hrt}`);
  logger.log(`  Volume multiplier: ${template.volume_multiplier}\n`);

  // Calculate number of days
  const daysCount = (profile.block_length || 1) === 1 ? 7 : 28;
  const startDate = new Date();

  // Get user's preferred workout days (or generate smart defaults)
  const workoutDays = profile.preferred_workout_days && profile.preferred_workout_days.length > 0
    ? profile.preferred_workout_days
    : getDefaultWorkoutDays(profile.workout_frequency || 3);

  // Get first-week substitute days (one-time workout days for users who join mid-week)
  const firstWeekSubstituteDays = profile.first_week_substitute_days || [];

  logger.log(`📆 Workout days: ${workoutDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}`);
  if (firstWeekSubstituteDays.length > 0) {
    logger.log(`📆 First-week substitutes: ${firstWeekSubstituteDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}`);
  }
  logger.log(`😴 Rest days: ${[0,1,2,3,4,5,6].filter(d => !workoutDays.includes(d)).map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}\n`);

  // Generate workouts for each day with variety tracking
  const days: Day[] = [];
  const usedExerciseIds = new Set<string>();
  const VARIETY_WINDOW = 3; // Don't reuse exercises for 3 days
  let templateIndex = 0; // Track which template to use for workout days

  for (let i = 0; i < daysCount; i++) {
    const dayNumber = i + 1;
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + i);
    const dayOfWeek = dayDate.getDay(); // 0=Sunday, 1=Monday, etc.

    // Check if this is a workout day or rest day
    // For the first week (days 1-7), also check substitute days
    const isFirstWeek = dayNumber <= 7;
    const isSubstituteDay = isFirstWeek && firstWeekSubstituteDays.includes(dayOfWeek);
    const isWorkoutDay = workoutDays.includes(dayOfWeek) || isSubstituteDay;
    const isRestDay = !isWorkoutDay;

    logger.log(`\n📅 Day ${dayNumber} (${dayDate.toLocaleDateString()}) - ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]}${isSubstituteDay ? ' (substitute)' : ''}`);
    logger.log('─────────────────────────────────────────');

    if (isRestDay) {
      // REST DAY - no workout variants
      logger.log(`  😴 REST DAY - Recovery is progress!`);

      days.push({
        dayNumber,
        date: dayDate,
        dayOfWeek,
        isRestDay: true,
        variants: {
          30: null,
          45: null,
          60: null,
          90: null,
        },
      });
      continue;
    }

    // WORKOUT DAY - generate workouts
    // Get day template (cycle through template days only for workout days)
    const dayTemplate = template.days[templateIndex % template.days.length];
    templateIndex++; // Only increment for workout days
    logger.log(`  🏋️ WORKOUT: ${dayTemplate.name} (${dayTemplate.focus})`);

    // Filter out recently used exercises (last 3 days)
    const availableExercises = exercises.filter(ex => !usedExerciseIds.has(ex.id));

    // If we've filtered out too many, reset the used set to avoid running out
    const exercisesToUse = availableExercises.length >= 10 ? availableExercises : exercises;

    if (availableExercises.length < exercises.length) {
      logger.log(`🔄 Variety filter: ${exercises.length - availableExercises.length} exercises excluded from recent days`);
    }

    // Generate all 4 workout variants for this day using Phase 2 (with safety checkpoints, warm-up/cool-down)
    const variants: Day['variants'] = {
      30: generatePhase2Workout(profile, 30, exercisesToUse, dayTemplate, template, safetyContext),
      45: generatePhase2Workout(profile, 45, exercisesToUse, dayTemplate, template, safetyContext),
      60: generatePhase2Workout(profile, 60, exercisesToUse, dayTemplate, template, safetyContext),
      90: generatePhase2Workout(profile, 90, exercisesToUse, dayTemplate, template, safetyContext),
    };

    // Track exercises used today
    const exercisesUsedToday = new Set<string>();
    [variants[30], variants[45], variants[60], variants[90]].forEach(workout => {
      if (workout) {
        workout.exercises.forEach(ex => {
          usedExerciseIds.add(ex.exerciseId);
          exercisesUsedToday.add(ex.exerciseId);
        });
      }
    });

    logger.log(`📊 Exercises used today: ${exercisesUsedToday.size}`);

    // Clear old exercises after VARIETY_WINDOW days to allow reuse
    if (i >= VARIETY_WINDOW && usedExerciseIds.size > 20) {
      // Keep only the most recent exercises (rough heuristic)
      const recentExercises = Array.from(usedExerciseIds).slice(-20);
      usedExerciseIds.clear();
      recentExercises.forEach(id => usedExerciseIds.add(id));
      logger.log(`🔄 Cleared old exercises from variety tracker`);
    }

    // Validate all workouts generated
    const variantResults = [
      variants[30] ? '✅ 30min' : '❌ 30min (failed)',
      variants[45] ? '✅ 45min' : '❌ 45min (failed)',
      variants[60] ? '✅ 60min' : '❌ 60min (failed)',
      variants[90] ? '✅ 90min' : '❌ 90min (failed)',
    ];
    logger.log(`Variants: ${variantResults.join(', ')}`);

    days.push({
      dayNumber,
      date: dayDate,
      dayOfWeek,
      isRestDay: false,
      variants,
    });
  }

  const plan: Plan = {
    id: generatePlanId(),
    blockLength: (profile.block_length || 1) as 1 | 4,
    startDate,
    goals: (profile.goals || []).filter((g): g is Goal =>
      g === 'strength' || g === 'cardio' || g === 'flexibility' || g === 'mobility'
    ),
    goalWeighting: profile.goal_weighting || { primary: 70, secondary: 30 },
    days,
    workoutDays, // Store user's selected workout days
  };

  logger.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log('✅ PLAN GENERATION COMPLETE');
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log(`Plan ID: ${plan.id}`);
  logger.log(`Total days: ${days.length}`);
  logger.log(`Total workouts: ${days.length * 4} (4 variants per day)`);
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return plan;
}

/**
 * Generate a plan with variety across days
 * This is an enhanced version that ensures exercise variety across the week/month
 */
export async function generatePlanWithVariety(profile: Profile): Promise<Plan> {
  // Use safety-filtered exercises (Rules Engine)
  const { exercises, safetyContext } = await getFilteredExercisePool(profile);

  if (exercises.length === 0) {
    // Graceful fallback: Return a rest-only plan
    const restDays: Day[] = [];
    const daysCount = (profile.block_length || 1) === 1 ? 7 : 28;
    const startDate = new Date();

    for (let i = 0; i < daysCount; i++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + i);
      restDays.push({
        dayNumber: i + 1,
        date: dayDate,
        dayOfWeek: dayDate.getDay(),
        isRestDay: true,
        variants: { 30: null, 45: null, 60: null, 90: null },
      });
    }

    return {
      id: generatePlanId(),
      blockLength: (profile.block_length || 1) as 1 | 4,
      startDate,
      goals: (profile.goals || []) as Goal[],
      goalWeighting: profile.goal_weighting || { primary: 70, secondary: 30 },
      days: restDays,
      workoutDays: [],
    };
  }

  // Select template for volume adjustments
  const template = selectTemplate(profile);

  const daysCount = (profile.block_length || 1) === 1 ? 7 : 28;
  const startDate = new Date();
  const days: Day[] = [];

  // Get user's preferred workout days (or generate smart defaults)
  const workoutDays = profile.preferred_workout_days && profile.preferred_workout_days.length > 0
    ? profile.preferred_workout_days
    : getDefaultWorkoutDays(profile.workout_frequency || 3);

  // Track which exercises have been used to ensure variety
  const usedExerciseIds = new Set<string>();

  for (let i = 0; i < daysCount; i++) {
    const dayNumber = i + 1;
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + i);
    const dayOfWeek = dayDate.getDay();

    // Check if this is a workout day or rest day
    const isWorkoutDay = workoutDays.includes(dayOfWeek);

    if (!isWorkoutDay) {
      // REST DAY
      days.push({
        dayNumber,
        date: dayDate,
        dayOfWeek,
        isRestDay: true,
        variants: {
          30: null,
          45: null,
          60: null,
          90: null,
        },
      });
      continue;
    }

    // WORKOUT DAY
    // Filter out exercises that were used in the last 2 days
    const availableExercises = exercises.filter(ex => !usedExerciseIds.has(ex.id));

    // If we've used too many exercises, reset the pool
    if (availableExercises.length < 10) {
      usedExerciseIds.clear();
    }

    const exercisesToUse = availableExercises.length > 0 ? availableExercises : exercises;
    // Use first template day as default for generatePlanWithVariety
    const dayTemplate = template.days[0];
    const variants: Day['variants'] = {
      30: generatePhase2Workout(profile, 30, exercisesToUse, dayTemplate, template, safetyContext),
      45: generatePhase2Workout(profile, 45, exercisesToUse, dayTemplate, template, safetyContext),
      60: generatePhase2Workout(profile, 60, exercisesToUse, dayTemplate, template, safetyContext),
      90: generatePhase2Workout(profile, 90, exercisesToUse, dayTemplate, template, safetyContext),
    };

    // Mark exercises as used
    [variants[30], variants[45], variants[60], variants[90]].forEach(workout => {
      if (workout) {
        workout.exercises.forEach(ex => {
          usedExerciseIds.add(ex.exerciseId);
        });
      }
    });

    days.push({
      dayNumber,
      date: dayDate,
      dayOfWeek,
      isRestDay: false,
      variants,
    });
  }

  return {
    id: generatePlanId(),
    blockLength: (profile.block_length || 1) as 1 | 4,
    startDate,
    goals: (profile.goals || []) as Goal[],
    goalWeighting: profile.goal_weighting || { primary: 70, secondary: 30 },
    days,
    workoutDays,
  };
}

/**
 * Regenerate a single day within an existing plan
 * Useful when user wants to refresh a specific day's workouts
 * Can also be used to generate a workout for a rest day (override rest day)
 */
export async function regenerateDay(
  plan: Plan,
  dayNumber: number,
  profile: Profile
): Promise<Day> {
  // Use safety-filtered exercises (Rules Engine)
  const { exercises, safetyContext } = await getFilteredExercisePool(profile);
  const template = selectTemplate(profile);

  const existingDay = plan.days.find(d => d.dayNumber === dayNumber);
  if (!existingDay) {
    throw new Error(`Day ${dayNumber} not found in plan`);
  }

  logger.log(`\n🔄 Regenerating Day ${dayNumber}`);

  // Use first template day as default for regeneration
  const dayTemplate = template.days[0];
  const variants: Day['variants'] = {
    30: generatePhase2Workout(profile, 30, exercises, dayTemplate, template, safetyContext),
    45: generatePhase2Workout(profile, 45, exercises, dayTemplate, template, safetyContext),
    60: generatePhase2Workout(profile, 60, exercises, dayTemplate, template, safetyContext),
    90: generatePhase2Workout(profile, 90, exercises, dayTemplate, template, safetyContext),
  };

  return {
    ...existingDay,
    dayOfWeek: existingDay.dayOfWeek ?? new Date(existingDay.date).getDay(),
    isRestDay: false, // Mark as no longer a rest day since we're generating a workout
    wasRestDay: existingDay.isRestDay, // Remember if this was originally a rest day
    variants,
  };
}

/**
 * Get a specific workout from a plan
 */
export function getWorkoutFromPlan(
  plan: Plan,
  dayNumber: number,
  duration: 30 | 45 | 60 | 90
): Workout | null {
  const day = plan.days.find(d => d.dayNumber === dayNumber);
  if (!day) {
    console.error(`Day ${dayNumber} not found in plan`);
    return null;
  }

  const workout = day.variants[duration];
  if (!workout) {
    console.error(`${duration}-minute workout not available for day ${dayNumber}`);
    return null;
  }

  return workout;
}

/**
 * Validate that a plan has all required workouts
 */
export function validatePlan(plan: Plan): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check plan structure
  if (!plan.id || !plan.startDate || !plan.days) {
    errors.push('Plan is missing required fields');
    return { valid: false, errors };
  }

  // Check day count
  const expectedDays = plan.blockLength === 1 ? 7 : 28;
  if (plan.days.length !== expectedDays) {
    errors.push(`Expected ${expectedDays} days, found ${plan.days.length}`);
  }

  // Check each day has required workouts
  plan.days.forEach((day, index) => {
    if (!day.variants[30]) {
      errors.push(`Day ${index + 1} missing 30-minute workout`);
    }
    if (!day.variants[45]) {
      errors.push(`Day ${index + 1} missing 45-minute workout`);
    }
    if (!day.variants[60]) {
      errors.push(`Day ${index + 1} missing 60-minute workout`);
    }
    if (!day.variants[90]) {
      errors.push(`Day ${index + 1} missing 90-minute workout`);
    }

    // Validate each workout has exercises
    Object.entries(day.variants).forEach(([duration, workout]) => {
      if (workout && workout.exercises.length === 0) {
        errors.push(`Day ${index + 1}, ${duration}min workout has no exercises`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Print a summary of the entire plan
 */
export function printPlanSummary(plan: Plan): void {
  logger.log('\n╔═══════════════════════════════════════════╗');
  logger.log('║           PLAN SUMMARY                    ║');
  logger.log('╚═══════════════════════════════════════════╝');
  logger.log(`Plan ID: ${plan.id}`);
  logger.log(`Duration: ${plan.blockLength} week(s) (${plan.days.length} days)`);
  logger.log(`Start Date: ${plan.startDate.toLocaleDateString()}`);
  logger.log(`Goals: ${plan.goals.join(', ')}`);
  logger.log('');
  logger.log('Workouts per day:');
  
  plan.days.slice(0, 3).forEach(day => {
    logger.log(`\n  Day ${day.dayNumber} (${day.date.toLocaleDateString()}):`);
    logger.log(`    30min: ${day.variants[30] ? `${day.variants[30].exercises.length} exercises` : 'N/A'}`);
    logger.log(`    45min: ${day.variants[45] ? `${day.variants[45].exercises.length} exercises` : 'N/A'}`);
    logger.log(`    60min: ${day.variants[60] ? `${day.variants[60].exercises.length} exercises` : 'N/A'}`);
    logger.log(`    90min: ${day.variants[90] ? `${day.variants[90].exercises.length} exercises` : 'N/A'}`);
  });

  if (plan.days.length > 3) {
    logger.log(`\n  ... and ${plan.days.length - 3} more days`);
  }
  
  logger.log('\n╚═══════════════════════════════════════════╝\n');
}

/**
 * Generate a unique plan ID
 */
function generatePlanId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `plan-${timestamp}-${random}`;
}

/**
 * Calculate total workout minutes in a plan
 */
export function calculatePlanTotalMinutes(plan: Plan, duration: 30 | 45 | 60 | 90): number {
  let total = 0;
  plan.days.forEach(day => {
    const workout = day.variants[duration];
    if (workout) {
      total += workout.totalMinutes;
    }
  });
  return total;
}

/**
 * Get default workout days based on frequency
 * Spreads workouts evenly throughout the week for optimal recovery
 * @param frequency - Number of workout days per week (1-7)
 * @returns Array of day numbers (0=Sunday, 1=Monday, ..., 6=Saturday)
 */
export function getDefaultWorkoutDays(frequency: number): number[] {
  switch (frequency) {
    case 1:
      return [1]; // Monday
    case 2:
      return [1, 4]; // Monday, Thursday
    case 3:
      return [1, 3, 5]; // Monday, Wednesday, Friday
    case 4:
      return [1, 2, 4, 5]; // Monday, Tuesday, Thursday, Friday
    case 5:
      return [1, 2, 3, 5, 6]; // Monday-Wednesday, Friday, Saturday
    case 6:
      return [1, 2, 3, 4, 5, 6]; // Monday-Saturday
    case 7:
      return [0, 1, 2, 3, 4, 5, 6]; // Every day
    default:
      return [1, 3, 5]; // Default to Mon/Wed/Fri
  }
}