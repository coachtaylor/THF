// Endurance Workout Templates
// Focused on cardiovascular health, stamina, and muscular endurance
// Key principle: Higher rep ranges, cardio integration, circuit-style training

import { WorkoutTemplate } from './types';

export const enduranceTemplates: WorkoutTemplate[] = [
  {
    name: 'Endurance Circuit 3x',
    description: 'A 3-day beginner endurance program combining strength and cardio for improved cardiovascular health and muscular endurance.',
    frequency: 3,
    experience_level: 'beginner',
    primary_goal: 'endurance',
    days: [
      {
        name: 'Full Body Circuit A',
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
            count: 2,
            priority: 'required',
          },
        ],
        total_exercises: 5,
        volume_percent: 33,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 8,
      },
      {
        name: 'Full Body Circuit B',
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
            pattern: 'hinge',
            count: 1,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'cardio',
            count: 2,
            priority: 'required',
          },
        ],
        total_exercises: 5,
        volume_percent: 34,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 8,
      },
      {
        name: 'Full Body Circuit C',
        focus: 'full_body',
        patterns: [
          {
            pattern: 'squat',
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
            pattern: 'core',
            count: 1,
            priority: 'preferred',
          },
          {
            pattern: 'cardio',
            count: 2,
            priority: 'required',
          },
        ],
        total_exercises: 5,
        volume_percent: 33,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 8,
      },
    ],
  },
  {
    name: 'Endurance Split 4x',
    description: 'A 4-day intermediate endurance program with dedicated cardio days and strength-endurance circuits for maximum cardiovascular conditioning.',
    frequency: 4,
    experience_level: 'intermediate',
    primary_goal: 'endurance',
    days: [
      {
        name: 'Lower Body Endurance',
        focus: 'lower_body',
        patterns: [
          {
            pattern: 'squat',
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
            pattern: 'hinge',
            count: 1,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'cardio',
            count: 2,
            priority: 'required',
          },
        ],
        total_exercises: 5,
        volume_percent: 25,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 8,
      },
      {
        name: 'Upper Body Endurance',
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
            pattern: 'cardio',
            count: 1,
            priority: 'preferred',
          },
        ],
        total_exercises: 5,
        volume_percent: 25,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 8,
      },
      {
        name: 'Full Body Conditioning',
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
            count: 2,
            priority: 'required',
          },
        ],
        total_exercises: 5,
        volume_percent: 25,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 8,
      },
      {
        name: 'Cardio & Core',
        focus: 'full_body',
        patterns: [
          {
            pattern: 'cardio',
            count: 3,
            priority: 'required',
          },
          {
            pattern: 'core',
            count: 2,
            priority: 'required',
          },
        ],
        total_exercises: 5,
        volume_percent: 25,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 10,
      },
    ],
  },
];
