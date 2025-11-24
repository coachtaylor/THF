// Warm-up and Cool-down Generation
// Creates focus-specific warm-up and cool-down sections for workout days

import { Exercise } from '../../types';
import { DayTemplate } from './templates/types';

/**
 * Warm-up or cool-down section with exercises and total duration
 */
export interface WarmupCooldownSection {
  exercises: WarmupExercise[];
  total_duration_minutes: number;
}

/**
 * Individual warm-up or cool-down exercise
 */
export interface WarmupExercise {
  name: string;
  duration?: string;  // "3-5 minutes", "30 seconds"
  reps?: string;      // "10 each direction", "15"
  description: string;
}

/**
 * Generate focus-specific warm-up section for a workout day
 * Includes general cardio activation and focus-specific dynamic movements
 * 
 * @param dayTemplate - The day template defining focus and duration
 * @param mainExercises - Main workout exercises (for context, currently unused)
 * @returns Warm-up section with exercises and total duration
 */
export function generateWarmup(
  dayTemplate: DayTemplate,
  mainExercises: Exercise[]
): WarmupCooldownSection {
  const warmupExercises: WarmupExercise[] = [];

  // General cardio warm-up (always include)
  warmupExercises.push({
    name: 'Light Cardio',
    duration: '3-5 minutes',
    description: 'Walk, jog, bike, or jump rope to elevate heart rate'
  });

  // Focus-specific dynamic stretches
  if (dayTemplate.focus === 'lower_body') {
    warmupExercises.push(
      {
        name: 'Leg Swings',
        reps: '10 each direction',
        description: 'Forward/back and side-to-side'
      },
      {
        name: 'Walking Lunges',
        reps: '10 total',
        description: 'Bodyweight lunges to activate legs'
      },
      {
        name: 'Glute Bridges',
        reps: '15',
        description: 'Activate glutes before lifting'
      }
    );
  } else if (dayTemplate.focus === 'upper_body') {
    warmupExercises.push(
      {
        name: 'Arm Circles',
        duration: '30 seconds',
        description: '15 seconds forward, 15 seconds back'
      },
      {
        name: 'Band Pull-Aparts',
        reps: '15',
        description: 'Activate upper back and shoulders'
      },
      {
        name: 'Push-up to Downward Dog',
        reps: '8',
        description: 'Mobilize shoulders and chest'
      }
    );
  } else {
    // Full body
    warmupExercises.push(
      {
        name: 'Jumping Jacks',
        reps: '20',
        description: 'Full body activation'
      },
      {
        name: 'Bodyweight Squats',
        reps: '15',
        description: 'Lower body warm-up'
      },
      {
        name: 'Arm Circles',
        duration: '30 seconds',
        description: 'Upper body mobility'
      }
    );
  }

  return {
    exercises: warmupExercises,
    total_duration_minutes: dayTemplate.warm_up_duration_minutes
  };
}

/**
 * Generate focus-specific cool-down section for a workout day
 * Includes focus-specific static stretches for recovery and flexibility
 * 
 * @param dayTemplate - The day template defining focus and duration
 * @param mainExercises - Main workout exercises (for context, currently unused)
 * @returns Cool-down section with exercises and total duration
 */
export function generateCooldown(
  dayTemplate: DayTemplate,
  mainExercises: Exercise[]
): WarmupCooldownSection {
  const cooldownExercises: WarmupExercise[] = [];

  // Focus-specific static stretches
  if (dayTemplate.focus === 'lower_body') {
    cooldownExercises.push(
      {
        name: 'Quad Stretch',
        duration: '30 seconds each side',
        description: 'Standing quad stretch'
      },
      {
        name: 'Hamstring Stretch',
        duration: '30 seconds each side',
        description: 'Seated or standing hamstring stretch'
      },
      {
        name: 'Pigeon Pose',
        duration: '60 seconds each side',
        description: 'Deep hip and glute stretch'
      },
      {
        name: "Child's Pose",
        duration: '60 seconds',
        description: 'Lower back and hip relaxation'
      }
    );
  } else if (dayTemplate.focus === 'upper_body') {
    cooldownExercises.push(
      {
        name: 'Doorway Chest Stretch',
        duration: '45 seconds each side',
        description: 'Stretch chest and anterior shoulders'
      },
      {
        name: 'Overhead Triceps Stretch',
        duration: '30 seconds each side',
        description: 'Stretch triceps and lats'
      },
      {
        name: 'Cross-Body Shoulder Stretch',
        duration: '30 seconds each side',
        description: 'Stretch rear deltoids'
      },
      {
        name: 'Cat-Cow Stretch',
        duration: '60 seconds',
        description: 'Mobilize spine'
      }
    );
  } else {
    // Full body cool-down
    cooldownExercises.push(
      {
        name: 'Standing Forward Fold',
        duration: '60 seconds',
        description: 'Hamstring and lower back stretch'
      },
      {
        name: 'Chest Stretch',
        duration: '45 seconds',
        description: 'Open up chest'
      },
      {
        name: 'Seated Spinal Twist',
        duration: '30 seconds each side',
        description: 'Twist and decompress spine'
      },
      {
        name: "Child's Pose",
        duration: '60 seconds',
        description: 'Full body relaxation'
      }
    );
  }

  return {
    exercises: cooldownExercises,
    total_duration_minutes: dayTemplate.cool_down_duration_minutes
  };
}

