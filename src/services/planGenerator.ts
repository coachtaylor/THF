// src/services/planGenerator.ts
// Orchestrates generation of multi-day workout plans
// Uses workoutGenerator.ts for individual workout generation

import { Plan, Day, Workout, Goal } from '../types';
import { Profile } from './storage/profile';
import { generateWorkout, printWorkoutSummary } from './workoutGenerator';
import { fetchAllExercises } from './exerciseService';
import { selectTemplate } from './workoutGeneration/templateSelection';
import { DayTemplate } from './workoutGeneration/templates/types';
import { logger } from '../utils/logger';


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

  // Fetch exercises
  const exercises = await fetchAllExercises();
  
  if (exercises.length === 0) {
    throw new Error('No exercises available. Please check your database.');
  }

  // Generate a 30-minute workout for quick start (minimum supported duration)
  const workout = generateWorkout(quickStartProfile, 30, exercises);

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
  logger.log(`User ID: ${profile.id}`);
  logger.log(`Block length: ${profile.block_length || 1} weeks`);
  logger.log(`Goals: ${profile.goals?.join(', ') || 'none'}`);
  logger.log(`Equipment: ${profile.equipment?.join(', ') || 'none'}`);
  logger.log(`Constraints: ${profile.constraints?.join(', ') || 'none'}`);
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Fetch all exercises from Supabase
  const exercises = await fetchAllExercises();
  logger.log(`📚 Loaded ${exercises.length} exercises from database\n`);

  if (exercises.length === 0) {
    throw new Error('No exercises available. Please check your database.');
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

    // Generate all 4 workout variants for this day
    const variants: Day['variants'] = {
      30: generateWorkout(profile, 30, exercisesToUse, dayTemplate),
      45: generateWorkout(profile, 45, exercisesToUse, dayTemplate),
      60: generateWorkout(profile, 60, exercisesToUse, dayTemplate),
      90: generateWorkout(profile, 90, exercisesToUse, dayTemplate),
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
  const exercises = await fetchAllExercises();

  if (exercises.length === 0) {
    throw new Error('No exercises available');
  }

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

    const variants: Day['variants'] = {
      30: generateWorkout(profile, 30, availableExercises.length > 0 ? availableExercises : exercises),
      45: generateWorkout(profile, 45, availableExercises.length > 0 ? availableExercises : exercises),
      60: generateWorkout(profile, 60, availableExercises.length > 0 ? availableExercises : exercises),
      90: generateWorkout(profile, 90, availableExercises.length > 0 ? availableExercises : exercises),
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
  const exercises = await fetchAllExercises();

  const existingDay = plan.days.find(d => d.dayNumber === dayNumber);
  if (!existingDay) {
    throw new Error(`Day ${dayNumber} not found in plan`);
  }

  logger.log(`\n🔄 Regenerating Day ${dayNumber}`);

  const variants: Day['variants'] = {
    30: generateWorkout(profile, 30, exercises),
    45: generateWorkout(profile, 45, exercises),
    60: generateWorkout(profile, 60, exercises),
    90: generateWorkout(profile, 90, exercises),
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
export function calculatePlanTotalMinutes(plan: Plan, duration: 5 | 15 | 30 | 45): number {
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