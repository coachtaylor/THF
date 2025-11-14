import { Exercise } from '../types';

export const exerciseLibrary: Exercise[] = [
  {
    id: '1',
    name: 'Bodyweight Squat',
    category: 'lower_body',
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    binder_aware: true,
    heavy_binding_safe: true,
    pelvic_floor_aware: true,
    pressure_level: 'low',
    neutral_cues: [
      'Feet hip-width apart',
      'Lower hips back and down',
      'Keep chest lifted'
    ],
    breathing_cues: [
      'Inhale on the way down',
      'Exhale on the way up'
    ],
    trans_notes: {
      binder: 'Safe for binding - minimal chest compression',
      pelvic_floor: 'Engage core gently, avoid bearing down'
    },
    swaps: [
      { exerciseId: '2', rationale: 'Lower impact option' }
    ],
    videoUrl: 'https://example.com/squat.mp4',
    tags: ['beginner', 'lower_body', 'bodyweight']
  }
];

export function getExerciseById(id: string): Exercise | undefined {
  return exerciseLibrary.find(ex => ex.id === id);
}

export function getExercisesByCategory(category: string): Exercise[] {
  return exerciseLibrary.filter(ex => ex.category === category);
}

export function getBinderAwareExercises(): Exercise[] {
  return exerciseLibrary.filter(ex => ex.binder_aware);
}

export function getHeavyBindingSafeExercises(): Exercise[] {
  return exerciseLibrary.filter(ex => ex.heavy_binding_safe);
}
