// Strength Workout Templates
// Focused on building maximal strength with compound movements
// Key principle: Heavy compound lifts, progressive overload, balanced muscle development

import { WorkoutTemplate } from './types';

export const strengthTemplates: WorkoutTemplate[] = [
  {
    name: 'Full Body Strength 3x',
    description: 'A 3-day beginner strength program focused on building foundational strength through compound movements. Balanced approach to develop overall strength.',
    frequency: 3,
    experience_level: 'beginner',
    primary_goal: 'strength',
    days: [
      {
        name: 'Strength Day A - Squat Focus',
        focus: 'full_body',
        patterns: [
          {
            pattern: 'squat',
            count: 2,
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
            pattern: 'core',
            count: 1,
            priority: 'preferred',
          },
        ],
        total_exercises: 5,
        volume_percent: 35,
        warm_up_duration_minutes: 8,
        cool_down_duration_minutes: 5,
      },
      {
        name: 'Strength Day B - Press Focus',
        focus: 'full_body',
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
            pattern: 'squat',
            count: 1,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
        ],
        total_exercises: 5,
        volume_percent: 30,
        warm_up_duration_minutes: 8,
        cool_down_duration_minutes: 5,
      },
      {
        name: 'Strength Day C - Hinge Focus',
        focus: 'full_body',
        patterns: [
          {
            pattern: 'hinge',
            count: 2,
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
            pattern: 'core',
            count: 1,
            priority: 'preferred',
          },
        ],
        total_exercises: 5,
        volume_percent: 35,
        warm_up_duration_minutes: 8,
        cool_down_duration_minutes: 5,
      },
    ],
  },
  {
    name: 'Upper/Lower Strength 4x',
    description: 'A 4-day intermediate strength program with upper/lower split. Emphasizes progressive overload on major compound lifts for maximum strength gains.',
    frequency: 4,
    experience_level: 'intermediate',
    primary_goal: 'strength',
    days: [
      {
        name: 'Lower Strength - Squat Emphasis',
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
        warm_up_duration_minutes: 8,
        cool_down_duration_minutes: 5,
      },
      {
        name: 'Upper Strength - Press Emphasis',
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
            pattern: 'isolation',
            count: 1,
            priority: 'optional',
          },
        ],
        total_exercises: 5,
        volume_percent: 25,
        warm_up_duration_minutes: 8,
        cool_down_duration_minutes: 5,
      },
      {
        name: 'Lower Strength - Hinge Emphasis',
        focus: 'lower_body',
        patterns: [
          {
            pattern: 'hinge',
            count: 2,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'squat',
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
        warm_up_duration_minutes: 8,
        cool_down_duration_minutes: 5,
      },
      {
        name: 'Upper Strength - Pull Emphasis',
        focus: 'upper_body',
        patterns: [
          {
            pattern: 'pull',
            count: 2,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'push',
            count: 2,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'isolation',
            count: 1,
            priority: 'optional',
          },
        ],
        total_exercises: 5,
        volume_percent: 25,
        warm_up_duration_minutes: 8,
        cool_down_duration_minutes: 5,
      },
    ],
  },
];
