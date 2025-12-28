import { getPlan, savePlan } from './plan';
import { Plan, Day, Workout, ExerciseInstance } from '../../types/plan';
import { fetchExercisesByIds, fetchExerciseById } from '../exerciseService';
import { Exercise } from '../../types';

export interface TodaysWorkoutData {
  id: string;
  workout_name: string;
  estimated_duration_minutes: number;
  warm_up?: {
    total_duration_minutes: number;
    exercises?: Array<{
      name: string;
      duration?: string;
      reps?: string;
    }>;
  };
  main_workout?: any[];
  cool_down?: {
    total_duration_minutes: number;
    exercises?: Array<{
      name: string;
      duration?: string;
      reps?: string;
    }>;
  };
  total_sets: number;
  safety_checkpoints?: Array<{
    message: string;
  }>;
  metadata?: {
    day_focus?: string;
    volume_split?: string;
    hrt_adjusted?: boolean;
  };
}

export interface WorkoutDetailData extends TodaysWorkoutData {
  warm_up: {
    total_duration_minutes: number;
    exercises: Array<{
      name: string;
      duration?: string;
      reps?: string;
    }>;
  };
  main_workout: Array<{
    exercise_id: string;
    exercise_name: string;
    target_muscle?: string;
    sets: number;
    reps: number;
    rest_seconds: number;
    gender_emphasis?: string;
    binding_safe?: boolean;
  }>;
  cool_down: {
    total_duration_minutes: number;
    exercises: Array<{
      name: string;
      duration?: string;
      reps?: string;
    }>;
  };
  safety_checkpoints: Array<{
    message: string;
  }>;
  metadata: {
    day_focus: string;
    volume_split: string;
    hrt_adjusted: boolean;
  };
}

/**
 * Get today's workout from the current plan
 */
export async function getTodaysWorkout(userId: string = 'default'): Promise<TodaysWorkoutData | null> {
  try {
    const plan = await getPlan(userId);
    if (!plan) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's day in the plan
    const todaysDay = plan.days.find((day: Day) => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate.getTime() === today.getTime();
    });

    if (!todaysDay) {
      return null;
    }

    // Get the workout for the user's preferred duration (default to 30 min)
    // Check which variants are available
    const preferredDuration = 30; // Default, could be from profile
    let workout: Workout | null = null;
    
    if (todaysDay.variants[preferredDuration]) {
      workout = todaysDay.variants[preferredDuration];
    } else if (todaysDay.variants[45]) {
      workout = todaysDay.variants[45];
    } else if (todaysDay.variants[60]) {
      workout = todaysDay.variants[60];
    } else if (todaysDay.variants[90]) {
      workout = todaysDay.variants[90];
    }

    if (!workout) {
      return null;
    }

    // Calculate total sets
    const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0);

    // Build workout name from plan goals
    const workoutName = plan.goals.length > 0 
      ? `${plan.goals[0].charAt(0).toUpperCase() + plan.goals[0].slice(1)} Focus`
      : 'Today\'s Workout';

    // Build safety checkpoints (placeholder - would come from workout generation)
    const safetyCheckpoints: Array<{ message: string }> = [];
    // Add binder break reminder if workout is 45+ minutes
    if (workout.duration >= 45) {
      safetyCheckpoints.push({
        message: '⚠️ Binder break reminder at 45min'
      });
    }

    return {
      id: `${plan.id}_${todaysDay.dayNumber}`,
      workout_name: workoutName,
      estimated_duration_minutes: workout.duration,
      warm_up: {
        total_duration_minutes: 5, // Default warm-up
      },
      main_workout: workout.exercises,
      cool_down: {
        total_duration_minutes: 5, // Default cool-down
      },
      total_sets: totalSets,
      safety_checkpoints: safetyCheckpoints.length > 0 ? safetyCheckpoints : undefined,
    };
  } catch (error) {
    console.error('Error getting today\'s workout:', error);
    return null;
  }
}

/**
 * Get workout by ID with full details including exercise names
 */
export async function getWorkout(workoutId: string, userId: string = 'default'): Promise<WorkoutDetailData | null> {
  try {
    console.log('🔍 getWorkout called with:', { workoutId, userId });
    const plan = await getPlan(userId);
    if (!plan) {
      console.log('❌ No plan found for user:', userId);
      return null;
    }
    console.log('✅ Plan found:', plan.id, 'with', plan.days.length, 'days');

    // Parse workout ID (format: planId_dayNumber)
    const parts = workoutId.split('_');
    if (parts.length < 2) {
      console.log('❌ Invalid workoutId format:', workoutId);
      return null;
    }

    const dayNumber = parseInt(parts[parts.length - 1]);
    console.log('🔍 Looking for dayNumber:', dayNumber);
    console.log('📅 Available days:', plan.days.map((d: Day) => d.dayNumber));

    const day = plan.days.find((d: Day) => d.dayNumber === dayNumber);

    if (!day) {
      console.log('❌ Day not found for dayNumber:', dayNumber);
      return null;
    }
    console.log('✅ Day found, checking variants...');

    // Get workout (prefer 30 min, fallback to others)
    let workout: Workout | null = null;
    let duration = 30;
    
    if (day.variants[30]) {
      workout = day.variants[30];
      duration = 30;
    } else if (day.variants[45]) {
      workout = day.variants[45];
      duration = 45;
    } else if (day.variants[60]) {
      workout = day.variants[60];
      duration = 60;
    } else if (day.variants[90]) {
      workout = day.variants[90];
      duration = 90;
    }

    if (!workout) {
      return null;
    }

    // Fetch exercise details
    const exerciseIds = workout.exercises.map(ex => ex.exerciseId);
    const exercises = await fetchExercisesByIds(exerciseIds);
    const exerciseMap = new Map(exercises.map(ex => [ex.id, ex]));

    // Build main workout with exercise details
    const mainWorkout = workout.exercises.map(ex => {
      const exercise = exerciseMap.get(ex.exerciseId);
      return {
        exercise_id: ex.exerciseId,
        exercise_name: exercise?.name || 'Unknown Exercise',
        target_muscle: exercise?.target_muscles || 'Full body',
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.restSeconds,
        gender_emphasis: exercise?.gender_goal_emphasis,
        binding_safe: exercise?.binder_aware || false,
      };
    });

    // Build workout name - first check if workout has a name, otherwise derive from muscles
    const workoutName = workout.name || deriveWorkoutNameFromExercises(exercises);

    // Determine focus from plan goals
    const dayFocus = plan.goals.length > 0 
      ? `${plan.goals[0].charAt(0).toUpperCase() + plan.goals[0].slice(1)} Focus`
      : 'Full Body';

    // Calculate volume split (simplified - would be more complex in real implementation)
    const upperBodyCount = mainWorkout.filter(ex => 
      ex.target_muscle?.toLowerCase().includes('upper') || 
      ex.target_muscle?.toLowerCase().includes('chest') ||
      ex.target_muscle?.toLowerCase().includes('shoulder') ||
      ex.target_muscle?.toLowerCase().includes('arm')
    ).length;
    const lowerBodyCount = mainWorkout.filter(ex => 
      ex.target_muscle?.toLowerCase().includes('lower') || 
      ex.target_muscle?.toLowerCase().includes('leg') ||
      ex.target_muscle?.toLowerCase().includes('glute')
    ).length;
    const total = mainWorkout.length;
    const upperPercent = total > 0 ? Math.round((upperBodyCount / total) * 100) : 0;
    const lowerPercent = total > 0 ? Math.round((lowerBodyCount / total) * 100) : 0;
    const volumeSplit = total > 0 ? `${upperPercent}% upper, ${lowerPercent}% lower` : 'Balanced';

    // Generate warm-up exercises based on focus
    const warmupExercises = generateWarmupExercises(dayFocus);
    
    // Generate cool-down exercises
    const cooldownExercises = generateCooldownExercises(dayFocus);

    // Safety checkpoints
    const safetyCheckpoints: Array<{ message: string }> = [];
    if (duration >= 45) {
      safetyCheckpoints.push({
        message: '⚠️ Binder break reminder at 45min'
      });
    }

    return {
      id: workoutId,
      workout_name: workoutName,
      estimated_duration_minutes: duration,
      warm_up: {
        total_duration_minutes: 5,
        exercises: warmupExercises,
      },
      main_workout: mainWorkout,
      cool_down: {
        total_duration_minutes: 5,
        exercises: cooldownExercises,
      },
      total_sets: workout.exercises.reduce((sum, ex) => sum + ex.sets, 0),
      safety_checkpoints: safetyCheckpoints,
      metadata: {
        day_focus: dayFocus,
        volume_split: volumeSplit,
        hrt_adjusted: false, // Would come from plan metadata
      },
    };
  } catch (error) {
    console.error('Error getting workout:', error);
    return null;
  }
}

/**
 * Generate warm-up exercises based on focus
 */
function generateWarmupExercises(focus: string): Array<{ name: string; duration?: string; reps?: string }> {
  if (focus.toLowerCase().includes('upper')) {
    return [
      { name: 'Light Cardio', duration: '3-5 minutes' },
      { name: 'Arm Circles', duration: '30 seconds' },
      { name: 'Band Pull-Aparts', reps: '15' },
    ];
  } else if (focus.toLowerCase().includes('lower')) {
    return [
      { name: 'Light Cardio', duration: '3-5 minutes' },
      { name: 'Leg Swings', reps: '10 each direction' },
      { name: 'Walking Lunges', reps: '10 total' },
    ];
  } else {
    return [
      { name: 'Light Cardio', duration: '3-5 minutes' },
      { name: 'Jumping Jacks', reps: '20' },
      { name: 'Bodyweight Squats', reps: '15' },
    ];
  }
}

/**
 * Generate cool-down exercises based on focus
 */
function generateCooldownExercises(focus: string): Array<{ name: string; duration?: string; reps?: string }> {
  if (focus.toLowerCase().includes('upper')) {
    return [
      { name: 'Doorway Chest Stretch', duration: '45 seconds each side' },
      { name: 'Overhead Triceps Stretch', duration: '30 seconds each side' },
      { name: 'Cross-Body Shoulder Stretch', duration: '30 seconds each side' },
    ];
  } else if (focus.toLowerCase().includes('lower')) {
    return [
      { name: 'Quad Stretch', duration: '30 seconds each side' },
      { name: 'Hamstring Stretch', duration: '30 seconds each side' },
      { name: 'Pigeon Pose', duration: '60 seconds each side' },
    ];
  } else {
    return [
      { name: 'Standing Forward Fold', duration: '60 seconds' },
      { name: 'Chest Stretch', duration: '45 seconds' },
      { name: "Child's Pose", duration: '60 seconds' },
    ];
  }
}

/**
 * Derive a workout name from the exercises' target muscles
 * Uses the same logic as HomeScreen for consistency
 */
function deriveWorkoutNameFromExercises(exercises: Exercise[]): string {
  if (!exercises || exercises.length === 0) return 'Workout';

  const allMuscles: string[] = [];
  exercises.forEach((ex) => {
    if (ex.target_muscles) {
      allMuscles.push(...ex.target_muscles.split(',').map(m => m.trim().toLowerCase()));
    }
  });
  const uniqueMuscles = [...new Set(allMuscles)];

  // Check for muscle groups (case-insensitive)
  const hasChest = uniqueMuscles.some(m => m.includes('chest') || m.includes('pec'));
  const hasBack = uniqueMuscles.some(m => m.includes('back') || m.includes('lat'));
  const hasTriceps = uniqueMuscles.some(m => m.includes('tricep'));
  const hasBiceps = uniqueMuscles.some(m => m.includes('bicep'));
  const hasLegs = uniqueMuscles.some(m =>
    m.includes('quad') || m.includes('glute') || m.includes('hamstring') || m.includes('leg')
  );
  const hasShoulders = uniqueMuscles.some(m => m.includes('shoulder') || m.includes('delt'));
  const hasCore = uniqueMuscles.some(m => m.includes('core') || m.includes('ab'));

  // Determine workout type based on muscle combinations
  if (hasChest && hasTriceps && hasShoulders) {
    return 'Push - Chest & Shoulders';
  } else if (hasBack && hasBiceps) {
    return 'Pull - Back & Biceps';
  } else if (hasLegs && !hasChest && !hasBack) {
    return 'Lower Body';
  } else if (hasChest && hasTriceps) {
    return 'Chest & Arms';
  } else if ((hasChest || hasBack || hasShoulders) && !hasLegs) {
    return 'Upper Body';
  } else if (hasLegs && (hasChest || hasBack)) {
    return 'Full Body';
  } else if (hasCore && uniqueMuscles.length <= 3) {
    return 'Core Focus';
  }
  return 'Full Body';
}

/**
 * Add an exercise to a workout
 * @param workoutId - The workout ID (format: planId_dayNumber)
 * @param exerciseId - The exercise ID to add
 * @param userId - The user ID
 * @returns true if successful, false otherwise
 */
export async function addExerciseToWorkout(
  workoutId: string,
  exerciseId: string,
  userId: string = 'default'
): Promise<boolean> {
  try {
    console.log('📥 Adding exercise to workout:', { workoutId, exerciseId, userId });

    const plan = await getPlan(userId);
    if (!plan) {
      console.log('❌ No plan found for user:', userId);
      return false;
    }

    // Parse workout ID (format: planId_dayNumber)
    const parts = workoutId.split('_');
    if (parts.length < 2) {
      console.log('❌ Invalid workoutId format:', workoutId);
      return false;
    }

    const dayNumber = parseInt(parts[parts.length - 1]);
    const dayIndex = plan.days.findIndex((d: Day) => d.dayNumber === dayNumber);

    if (dayIndex === -1) {
      console.log('❌ Day not found for dayNumber:', dayNumber);
      return false;
    }

    // Fetch exercise to verify it exists
    const exercise = await fetchExerciseById(exerciseId);
    if (!exercise) {
      console.log('❌ Exercise not found:', exerciseId);
      return false;
    }

    // Create new exercise instance with sensible defaults
    const newExercise: ExerciseInstance = {
      exerciseId: exerciseId,
      sets: 3,
      reps: 10,
      format: 'straight_sets',
      restSeconds: 60,
    };

    // Add to all workout variants for this day
    const day = plan.days[dayIndex];
    const durations = [30, 45, 60, 90] as const;

    for (const duration of durations) {
      if (day.variants[duration]) {
        day.variants[duration]!.exercises.push(newExercise);
      }
    }

    // Save updated plan
    await savePlan(plan, userId);
    console.log('✅ Exercise added to workout:', exercise.name);
    return true;
  } catch (error) {
    console.error('❌ Error adding exercise to workout:', error);
    return false;
  }
}

/**
 * Remove an exercise from a workout
 * @param workoutId - The workout ID (format: planId_dayNumber)
 * @param exerciseId - The exercise ID to remove
 * @param userId - The user ID
 * @returns true if successful, false otherwise
 */
export async function removeExerciseFromWorkout(
  workoutId: string,
  exerciseId: string,
  userId: string = 'default'
): Promise<boolean> {
  try {
    console.log('🗑️ Removing exercise from workout:', { workoutId, exerciseId, userId });

    const plan = await getPlan(userId);
    if (!plan) {
      console.log('❌ No plan found for user:', userId);
      return false;
    }

    // Parse workout ID (format: planId_dayNumber)
    const parts = workoutId.split('_');
    if (parts.length < 2) {
      console.log('❌ Invalid workoutId format:', workoutId);
      return false;
    }

    const dayNumber = parseInt(parts[parts.length - 1]);
    const dayIndex = plan.days.findIndex((d: Day) => d.dayNumber === dayNumber);

    if (dayIndex === -1) {
      console.log('❌ Day not found for dayNumber:', dayNumber);
      return false;
    }

    // Remove from all workout variants for this day
    const day = plan.days[dayIndex];
    const durations = [30, 45, 60, 90] as const;
    let removed = false;

    for (const duration of durations) {
      if (day.variants[duration]) {
        const originalLength = day.variants[duration]!.exercises.length;
        day.variants[duration]!.exercises = day.variants[duration]!.exercises.filter(
          ex => ex.exerciseId !== exerciseId
        );
        if (day.variants[duration]!.exercises.length < originalLength) {
          removed = true;
        }
      }
    }

    if (!removed) {
      console.log('⚠️ Exercise not found in workout:', exerciseId);
      return false;
    }

    // Save updated plan
    await savePlan(plan, userId);
    console.log('✅ Exercise removed from workout');
    return true;
  } catch (error) {
    console.error('❌ Error removing exercise from workout:', error);
    return false;
  }
}

