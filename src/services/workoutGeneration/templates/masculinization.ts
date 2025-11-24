// Masculinization Workout Templates
// Designed for trans men and transmasculine people focusing on upper body development
// Key principle: 50-60% upper body volume, emphasize shoulders/back/arms/chest, functional lower body only

import { WorkoutTemplate } from './types';

export const masculinizationTemplates: WorkoutTemplate[] = [
  {
    name: 'Upper/Lower/Upper - Masculinization Focus',
    description: 'A 3-day beginner-friendly split emphasizing upper body development for masculinization goals. Focuses on shoulder, back, chest, and arm hypertrophy while maintaining functional lower body strength.',
    frequency: 3,
    experience_level: 'beginner',
    primary_goal: 'masculinization',
    days: [
      {
        name: 'Upper Body - Shoulders & Back',
        focus: 'upper_body',
        patterns: [
          {
            pattern: 'push',
            count: 2,
            priority: 'required',
            gender_emphasis: 'masc_very_high',
            target_muscles: ['shoulders', 'chest'],
          },
          {
            pattern: 'pull',
            count: 2,
            priority: 'required',
            gender_emphasis: 'masc_very_high',
            target_muscles: ['lats', 'upper_back'],
          },
          {
            pattern: 'isolation',
            count: 2,
            priority: 'preferred',
            gender_emphasis: 'masc_high',
            target_muscles: ['shoulders', 'arms'],
          },
        ],
        total_exercises: 6,
        volume_percent: 40,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 5,
      },
      {
        name: 'Lower Body - Functional',
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
            priority: 'preferred',
          },
          {
            pattern: 'core',
            count: 2,
            priority: 'preferred',
          },
        ],
        total_exercises: 5,
        volume_percent: 25,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 5,
      },
      {
        name: 'Upper Body - Arms & Chest',
        focus: 'upper_body',
        patterns: [
          {
            pattern: 'push',
            count: 2,
            priority: 'required',
            gender_emphasis: 'masc_high',
            target_muscles: ['chest', 'shoulders'],
          },
          {
            pattern: 'pull',
            count: 1,
            priority: 'required',
            gender_emphasis: 'masc_high',
          },
          {
            pattern: 'isolation',
            count: 3,
            priority: 'preferred',
            gender_emphasis: 'masc_very_high',
            target_muscles: ['biceps', 'triceps', 'shoulders'],
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
    name: 'Push/Pull/Legs/Upper - Masculinization',
    description: 'A 4-day intermediate split designed for serious upper body development. Emphasizes shoulder, back, chest, and arm hypertrophy while maintaining functional lower body strength.',
    frequency: 4,
    experience_level: 'intermediate',
    primary_goal: 'masculinization',
    days: [
      {
        name: 'Push - Chest & Shoulders',
        focus: 'upper_body',
        patterns: [
          {
            pattern: 'push',
            count: 3,
            priority: 'required',
            gender_emphasis: 'masc_very_high',
            target_muscles: ['chest', 'shoulders', 'triceps'],
          },
          {
            pattern: 'isolation',
            count: 2,
            priority: 'required',
            gender_emphasis: 'masc_high',
            target_muscles: ['shoulders', 'triceps'],
          },
        ],
        total_exercises: 5,
        volume_percent: 30,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 5,
      },
      {
        name: 'Pull - Back & Arms',
        focus: 'upper_body',
        patterns: [
          {
            pattern: 'pull',
            count: 3,
            priority: 'required',
            gender_emphasis: 'masc_very_high',
            target_muscles: ['lats', 'upper_back', 'traps'],
          },
          {
            pattern: 'isolation',
            count: 2,
            priority: 'required',
            gender_emphasis: 'masc_high',
            target_muscles: ['biceps', 'rear_delts'],
          },
        ],
        total_exercises: 5,
        volume_percent: 30,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 5,
      },
      {
        name: 'Legs - Functional Strength',
        focus: 'lower_body',
        patterns: [
          {
            pattern: 'squat',
            count: 2,
            priority: 'required',
          },
          {
            pattern: 'hinge',
            count: 1,
            priority: 'required',
          },
          {
            pattern: 'lunge',
            count: 1,
            priority: 'required',
          },
          {
            pattern: 'core',
            count: 1,
            priority: 'required',
          },
        ],
        total_exercises: 5,
        volume_percent: 20,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 5,
      },
      {
        name: 'Upper Body - Hypertrophy',
        focus: 'upper_body',
        patterns: [
          {
            pattern: 'push',
            count: 1,
            priority: 'required',
            gender_emphasis: 'masc_very_high',
          },
          {
            pattern: 'pull',
            count: 1,
            priority: 'required',
            gender_emphasis: 'masc_very_high',
          },
          {
            pattern: 'isolation',
            count: 4,
            priority: 'required',
            gender_emphasis: 'masc_high',
            target_muscles: ['shoulders', 'arms', 'traps'],
          },
        ],
        total_exercises: 6,
        volume_percent: 20,
        warm_up_duration_minutes: 5,
        cool_down_duration_minutes: 5,
      },
    ],
  },
];

