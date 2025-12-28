// General Fitness Workout Templates
// Balanced, body-neutral workouts focused on overall health and functional fitness
// Key principle: Equal emphasis on upper and lower body, cardio integration, functional movement

import { WorkoutTemplate } from './types';

export const generalFitnessTemplates: WorkoutTemplate[] = [
  {
    name: 'Full Body 3x - General Fitness',
    description: 'A 3-day beginner-friendly full body program focused on building overall fitness, strength, and cardiovascular health with balanced body emphasis.',
    frequency: 3,
    experience_level: 'beginner',
    primary_goal: 'general_fitness',
    days: [
      {
        name: 'Full Body - Day A',
        focus: 'full_body',
        patterns: [
          {
            pattern: 'squat',
            count: 1,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'push',
            count: 1,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'pull',
            count: 1,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'hinge',
            count: 1,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'core',
            count: 1,
            priority: 'preferred',
          },
        ],
        total_exercises: 5,
        volume_percent: 33,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 5,
      },
      {
        name: 'Full Body - Day B',
        focus: 'full_body',
        patterns: [
          {
            pattern: 'lunge',
            count: 1,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'push',
            count: 1,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'pull',
            count: 1,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'hinge',
            count: 1,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'core',
            count: 1,
            priority: 'preferred',
          },
        ],
        total_exercises: 5,
        volume_percent: 34,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 5,
      },
      {
        name: 'Full Body - Day C',
        focus: 'full_body',
        patterns: [
          {
            pattern: 'squat',
            count: 1,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'push',
            count: 1,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'pull',
            count: 1,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'cardio',
            count: 1,
            priority: 'preferred',
          },
          {
            pattern: 'core',
            count: 1,
            priority: 'preferred',
          },
        ],
        total_exercises: 5,
        volume_percent: 33,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 5,
      },
    ],
  },
  {
    name: 'Upper/Lower 4x - General Fitness',
    description: 'A 4-day intermediate program alternating between upper and lower body with balanced emphasis and cardio integration.',
    frequency: 4,
    experience_level: 'intermediate',
    primary_goal: 'general_fitness',
    days: [
      {
        name: 'Lower Body - Strength',
        focus: 'lower_body',
        patterns: [
          {
            pattern: 'squat',
            count: 2,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'hinge',
            count: 1,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'lunge',
            count: 1,
            priority: 'preferred',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'core',
            count: 1,
            priority: 'preferred',
          },
        ],
        total_exercises: 5,
        volume_percent: 25,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 5,
      },
      {
        name: 'Upper Body - Strength',
        focus: 'upper_body',
        patterns: [
          {
            pattern: 'push',
            count: 2,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'pull',
            count: 2,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'core',
            count: 1,
            priority: 'preferred',
          },
        ],
        total_exercises: 5,
        volume_percent: 25,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 5,
      },
      {
        name: 'Lower Body - Conditioning',
        focus: 'lower_body',
        patterns: [
          {
            pattern: 'squat',
            count: 1,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'hinge',
            count: 1,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'lunge',
            count: 1,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'cardio',
            count: 1,
            priority: 'preferred',
          },
        ],
        total_exercises: 5,
        volume_percent: 25,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 5,
      },
      {
        name: 'Upper Body - Conditioning',
        focus: 'upper_body',
        patterns: [
          {
            pattern: 'push',
            count: 1,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'pull',
            count: 2,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'isolation',
            count: 1,
            priority: 'preferred',
          },
          {
            pattern: 'cardio',
            count: 1,
            priority: 'preferred',
          },
        ],
        total_exercises: 5,
        volume_percent: 25,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 5,
      },
    ],
  },
];
