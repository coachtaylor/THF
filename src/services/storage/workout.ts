import { getPlan } from './plan';
import { Plan, Day, Workout } from '../../types/plan';
import { fetchExercisesByIds } from '../exerciseService';
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
    } else if (todaysDay.variants[15]) {
      workout = todaysDay.variants[15];
    } else if (todaysDay.variants[45]) {
      workout = todaysDay.variants[45];
    } else if (todaysDay.variants[5]) {
      workout = todaysDay.variants[5];
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
    const plan = await getPlan(userId);
    if (!plan) {
      return null;
    }

    // Parse workout ID (format: planId_dayNumber)
    const parts = workoutId.split('_');
    if (parts.length < 2) {
      return null;
    }

    const dayNumber = parseInt(parts[parts.length - 1]);
    const day = plan.days.find((d: Day) => d.dayNumber === dayNumber);
    
    if (!day) {
      return null;
    }

    // Get workout (prefer 30 min, fallback to others)
    let workout: Workout | null = null;
    let duration = 30;
    
    if (day.variants[30]) {
      workout = day.variants[30];
      duration = 30;
    } else if (day.variants[15]) {
      workout = day.variants[15];
      duration = 15;
    } else if (day.variants[45]) {
      workout = day.variants[45];
      duration = 45;
    } else if (day.variants[5]) {
      workout = day.variants[5];
      duration = 5;
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

    // Build workout name
    const workoutName = plan.goals.length > 0 
      ? `${plan.goals[0].charAt(0).toUpperCase() + plan.goals[0].slice(1)} Focus`
      : 'Today\'s Workout';

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

