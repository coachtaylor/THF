// src/services/planGenerator.ts
// Orchestrates generation of multi-day workout plans
// Uses workoutGenerator.ts for individual workout generation

import { Plan, Day, Workout, Goal } from '../types';
import { Profile } from './storage/profile';
import { generateWorkout, printWorkoutSummary } from './workoutGenerator';
import { fetchAllExercises } from './exerciseService';

/**
 * Generate a Quick Start plan - a single 5-minute bodyweight workout
 * This is used for users who want to start immediately without completing their profile
 */
export async function generateQuickStartPlan(): Promise<Plan> {
  // Create a minimal profile for quick start
  const quickStartProfile: Profile = {
    id: 'quick-start',
    equipment: ['bodyweight'],
    constraints: ['binder_aware'],
    preferred_minutes: [5],
    block_length: 1,
    goals: ['wellness'],
    goal_weighting: { primary: 100, secondary: 0 },
  };

  // Fetch exercises
  const exercises = await fetchAllExercises();
  
  if (exercises.length === 0) {
    throw new Error('No exercises available. Please check your database.');
  }

  // Generate only the 5-minute workout
  const workout = generateWorkout(quickStartProfile, 5, exercises);

  // Create a single day with only the 5-minute variant
  // Note: Type definition requires 15/30/45 to be Workout, but quick start only has 5-min
  // Using type assertion to match test expectations
  const day: Day = {
    dayNumber: 1,
    date: new Date(),
    variants: {
      5: workout,
      15: null as any,
      30: null as any,
      45: null as any,
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
 * Each day has 4 workout variants (5, 15, 30, 45 minutes)
 */
export async function generatePlan(profile: Profile): Promise<Plan> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏋️ GENERATING WORKOUT PLAN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`User ID: ${profile.id}`);
  console.log(`Block length: ${profile.block_length || 1} weeks`);
  console.log(`Goals: ${profile.goals?.join(', ') || 'none'}`);
  console.log(`Equipment: ${profile.equipment?.join(', ') || 'none'}`);
  console.log(`Constraints: ${profile.constraints?.join(', ') || 'none'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Fetch all exercises from Supabase
  const exercises = await fetchAllExercises();
  console.log(`📚 Loaded ${exercises.length} exercises from database\n`);

  if (exercises.length === 0) {
    throw new Error('No exercises available. Please check your database.');
  }

  // Calculate number of days
  const daysCount = (profile.block_length || 1) === 1 ? 7 : 28;
  const startDate = new Date();

  // Generate workouts for each day with variety tracking
  const days: Day[] = [];
  const usedExerciseIds = new Set<string>();
  const VARIETY_WINDOW = 3; // Don't reuse exercises for 3 days

  for (let i = 0; i < daysCount; i++) {
    const dayNumber = i + 1;
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + i);

    console.log(`\n📅 Generating Day ${dayNumber} (${dayDate.toLocaleDateString()})`);
    console.log('─────────────────────────────────────────');

    // Filter out recently used exercises (last 3 days)
    const availableExercises = exercises.filter(ex => !usedExerciseIds.has(ex.id));

    // If we've filtered out too many, reset the used set to avoid running out
    const exercisesToUse = availableExercises.length >= 10 ? availableExercises : exercises;

    if (availableExercises.length < exercises.length) {
      console.log(`🔄 Variety filter: ${exercises.length - availableExercises.length} exercises excluded from recent days`);
    }

    // Generate all 4 workout variants for this day
    const variants: Day['variants'] = {
      5: null,   // Will be set if user has 5-min in their preferences
      15: generateWorkout(profile, 15, exercisesToUse),
      30: generateWorkout(profile, 30, exercisesToUse),
      45: generateWorkout(profile, 45, exercisesToUse),
    };

    // Only generate 5-minute workout if user wants it
    if (profile.preferred_minutes?.includes(5)) {
      variants[5] = generateWorkout(profile, 5, exercisesToUse);
    }

    // Track exercises used today
    const exercisesUsedToday = new Set<string>();
    [variants[5], variants[15], variants[30], variants[45]].forEach(workout => {
      if (workout) {
        workout.exercises.forEach(ex => {
          usedExerciseIds.add(ex.exerciseId);
          exercisesUsedToday.add(ex.exerciseId);
        });
      }
    });

    console.log(`📊 Exercises used today: ${exercisesUsedToday.size}`);

    // Clear old exercises after VARIETY_WINDOW days to allow reuse
    if (i >= VARIETY_WINDOW && usedExerciseIds.size > 20) {
      // Keep only the most recent exercises (rough heuristic)
      const recentExercises = Array.from(usedExerciseIds).slice(-20);
      usedExerciseIds.clear();
      recentExercises.forEach(id => usedExerciseIds.add(id));
      console.log(`🔄 Cleared old exercises from variety tracker`);
    }

    // Validate all workouts generated
    const variantResults = [
      variants[5] ? '✅ 5min' : '⏭️  5min (skipped)',
      variants[15] ? '✅ 15min' : '❌ 15min (failed)',
      variants[30] ? '✅ 30min' : '❌ 30min (failed)',
      variants[45] ? '✅ 45min' : '❌ 45min (failed)',
    ];
    console.log(`Variants: ${variantResults.join(', ')}`);

    days.push({
      dayNumber,
      date: dayDate,
      variants,
    });
  }

  const plan: Plan = {
    id: generatePlanId(),
    blockLength: (profile.block_length || 1) as 1 | 4,
    startDate,
    goals: profile.goals || [],
    goalWeighting: profile.goal_weighting || { primary: 70, secondary: 30 },
    days,
  };

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ PLAN GENERATION COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Plan ID: ${plan.id}`);
  console.log(`Total days: ${days.length}`);
  console.log(`Total workouts: ${days.length * 4} (4 variants per day)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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

  // Track which exercises have been used to ensure variety
  const usedExerciseIds = new Set<string>();

  for (let i = 0; i < daysCount; i++) {
    const dayNumber = i + 1;
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + i);

    // Filter out exercises that were used in the last 2 days
    const availableExercises = exercises.filter(ex => !usedExerciseIds.has(ex.id));

    // If we've used too many exercises, reset the pool
    if (availableExercises.length < 10) {
      usedExerciseIds.clear();
    }

    const variants: Day['variants'] = {
      5: profile.preferred_minutes?.includes(5)
        ? generateWorkout(profile, 5, availableExercises.length > 0 ? availableExercises : exercises)
        : null,
      15: generateWorkout(profile, 15, availableExercises.length > 0 ? availableExercises : exercises),
      30: generateWorkout(profile, 30, availableExercises.length > 0 ? availableExercises : exercises),
      45: generateWorkout(profile, 45, availableExercises.length > 0 ? availableExercises : exercises),
    };

    // Mark exercises as used
    [variants[5], variants[15], variants[30], variants[45]].forEach(workout => {
      if (workout) {
        workout.exercises.forEach(ex => {
          usedExerciseIds.add(ex.exerciseId);
        });
      }
    });

    days.push({
      dayNumber,
      date: dayDate,
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
  };
}

/**
 * Regenerate a single day within an existing plan
 * Useful when user wants to refresh a specific day's workouts
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

  console.log(`\n🔄 Regenerating Day ${dayNumber}`);

  const variants: Day['variants'] = {
    5: profile.preferred_minutes?.includes(5)
      ? generateWorkout(profile, 5, exercises)
      : null,
    15: generateWorkout(profile, 15, exercises),
    30: generateWorkout(profile, 30, exercises),
    45: generateWorkout(profile, 45, exercises),
  };

  return {
    ...existingDay,
    variants,
  };
}

/**
 * Get a specific workout from a plan
 */
export function getWorkoutFromPlan(
  plan: Plan,
  dayNumber: number,
  duration: 5 | 15 | 30 | 45
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
    if (!day.variants[15]) {
      errors.push(`Day ${index + 1} missing 15-minute workout`);
    }
    if (!day.variants[30]) {
      errors.push(`Day ${index + 1} missing 30-minute workout`);
    }
    if (!day.variants[45]) {
      errors.push(`Day ${index + 1} missing 45-minute workout`);
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
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║           PLAN SUMMARY                    ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log(`Plan ID: ${plan.id}`);
  console.log(`Duration: ${plan.blockLength} week(s) (${plan.days.length} days)`);
  console.log(`Start Date: ${plan.startDate.toLocaleDateString()}`);
  console.log(`Goals: ${plan.goals.join(', ')}`);
  console.log('');
  console.log('Workouts per day:');
  
  plan.days.slice(0, 3).forEach(day => {
    console.log(`\n  Day ${day.dayNumber} (${day.date.toLocaleDateString()}):`);
    console.log(`    5min:  ${day.variants[5] ? `${day.variants[5].exercises.length} exercises` : 'N/A'}`);
    console.log(`    15min: ${day.variants[15] ? `${day.variants[15].exercises.length} exercises` : 'N/A'}`);
    console.log(`    30min: ${day.variants[30] ? `${day.variants[30].exercises.length} exercises` : 'N/A'}`);
    console.log(`    45min: ${day.variants[45] ? `${day.variants[45].exercises.length} exercises` : 'N/A'}`);
  });

  if (plan.days.length > 3) {
    console.log(`\n  ... and ${plan.days.length - 3} more days`);
  }
  
  console.log('\n╚═══════════════════════════════════════════╝\n');
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