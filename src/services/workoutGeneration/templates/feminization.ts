// Feminization Workout Templates
// Designed for trans women and transfeminine people focusing on lower body development
// Key principle: 60-70% lower body volume, emphasize glutes/hips/legs, minimal upper body work

import { WorkoutTemplate } from './types';

export const feminizationTemplates: WorkoutTemplate[] = [
  {
    name: 'Lower/Upper/Lower - Feminization Focus',
    description: 'A 3-day beginner-friendly split emphasizing lower body development for feminization goals. Focuses on glute and leg hypertrophy while maintaining functional upper body strength.',
    frequency: 3,
    experience_level: 'beginner',
    primary_goal: 'feminization',
    days: [
      {
        name: 'Lower Body - Glutes & Legs',
        focus: 'lower_body',
        patterns: [
          {
            pattern: 'squat',
            count: 2,
            priority: 'required',
            gender_emphasis: 'fem_very_high',
            target_muscles: ['glutes', 'quads'],
          },
          {
            pattern: 'hinge',
            count: 1,
            priority: 'required',
            gender_emphasis: 'fem_very_high',
            target_muscles: ['glutes', 'hamstrings'],
          },
          {
            pattern: 'lunge',
            count: 1,
            priority: 'preferred',
            gender_emphasis: 'fem_high',
            target_muscles: ['glutes', 'quads'],
          },
          {
            pattern: 'isolation',
            count: 2,
            priority: 'preferred',
            gender_emphasis: 'fem_high',
            target_muscles: ['glutes', 'inner_thighs', 'calves'],
          },
        ],
        total_exercises: 6,
        volume_percent: 40,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 5,
      },
      {
        name: 'Upper Body - Balanced',
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
            count: 2,
            priority: 'preferred',
            target_muscles: ['shoulders', 'arms'],
          },
        ],
        total_exercises: 5,
        volume_percent: 25,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 5,
      },
      {
        name: 'Lower Body - Hip & Glute Focus',
        focus: 'lower_body',
        patterns: [
          {
            pattern: 'hinge',
            count: 2,
            priority: 'required',
            gender_emphasis: 'fem_very_high',
            target_muscles: ['glutes', 'hamstrings'],
          },
          {
            pattern: 'squat',
            count: 1,
            priority: 'required',
            gender_emphasis: 'fem_high',
          },
          {
            pattern: 'isolation',
            count: 2,
            priority: 'preferred',
            gender_emphasis: 'fem_very_high',
            target_muscles: ['glutes', 'inner_thighs'],
          },
          {
            pattern: 'core',
            count: 1,
            priority: 'optional',
          },
        ],
        total_exercises: 6,
        volume_percent: 35,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 5,
      },
    ],
  },
  {
    name: 'Lower/Upper/Lower/Upper - Feminization',
    description: 'A 4-day intermediate split designed for serious lower body development. Emphasizes glute hypertrophy, hip development, and leg strength while maintaining balanced upper body training.',
    frequency: 4,
    experience_level: 'intermediate',
    primary_goal: 'feminization',
    days: [
      {
        name: 'Lower Body - Strength Focus',
        focus: 'lower_body',
        patterns: [
          {
            pattern: 'squat',
            count: 2,
            priority: 'required',
            gender_emphasis: 'fem_very_high',
          },
          {
            pattern: 'hinge',
            count: 2,
            priority: 'required',
            gender_emphasis: 'fem_very_high',
          },
          {
            pattern: 'isolation',
            count: 2,
            priority: 'required',
            gender_emphasis: 'fem_high',
          },
        ],
        total_exercises: 6,
        volume_percent: 30,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 5,
      },
      {
        name: 'Upper Body - Push Focus',
        focus: 'upper_body',
        patterns: [
          {
            pattern: 'push',
            count: 2,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'isolation',
            count: 2,
            priority: 'required',
            target_muscles: ['shoulders', 'triceps'],
          },
          {
            pattern: 'core',
            count: 1,
            priority: 'optional',
          },
        ],
        total_exercises: 5,
        volume_percent: 20,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 5,
      },
      {
        name: 'Lower Body - Hypertrophy Focus',
        focus: 'lower_body',
        patterns: [
          {
            pattern: 'squat',
            count: 1,
            priority: 'required',
            gender_emphasis: 'fem_very_high',
          },
          {
            pattern: 'lunge',
            count: 2,
            priority: 'required',
            gender_emphasis: 'fem_high',
          },
          {
            pattern: 'hinge',
            count: 1,
            priority: 'required',
            gender_emphasis: 'fem_very_high',
          },
          {
            pattern: 'isolation',
            count: 3,
            priority: 'required',
            gender_emphasis: 'fem_very_high',
            target_muscles: ['glutes', 'inner_thighs', 'calves'],
          },
        ],
        total_exercises: 7,
        volume_percent: 30,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 5,
      },
      {
        name: 'Upper Body - Pull Focus',
        focus: 'upper_body',
        patterns: [
          {
            pattern: 'pull',
            count: 3,
            priority: 'required',
            gender_emphasis: 'neutral',
          },
          {
            pattern: 'isolation',
            count: 2,
            priority: 'required',
            target_muscles: ['biceps', 'rear_delts'],
          },
        ],
        total_exercises: 5,
        volume_percent: 20,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 5,
      },
    ],
  },
];

