// Manual mock for exercises.ts - avoids JSON import issues
export const exerciseLibrary = [
  {
    id: '1',
    name: 'Bodyweight Squat',
    equipment: ['bodyweight', 'none'],
    difficulty: 'beginner' as const,
    tags: ['lower_body', 'strength'],
    binder_aware: true,
    heavy_binding_safe: true,
    pelvic_floor_aware: true,
    pressure_level: 'low' as const,
    neutral_cues: ['Feet hip-width apart'],
    breathing_cues: ['Inhale down', 'Exhale up'],
    swaps: [],
    trans_notes: {
      binder: 'Safe for binding',
      pelvic_floor: 'Engage core gently',
    },
  },
  {
    id: '2',
    name: 'Plank',
    equipment: ['bodyweight', 'none'],
    difficulty: 'beginner' as const,
    tags: ['core', 'strength'],
    binder_aware: true,
    heavy_binding_safe: true,
    pelvic_floor_aware: true,
    pressure_level: 'low' as const,
    neutral_cues: ['Keep body straight'],
    breathing_cues: ['Breathe normally'],
    swaps: [],
    trans_notes: {
      binder: 'Safe for binding',
      pelvic_floor: 'Engage core gently',
    },
  },
];

export function getExerciseById(id: string) {
  return exerciseLibrary.find(ex => ex.id === id);
}

export function getExercisesByCategory(category: string) {
  return exerciseLibrary.filter(ex => 
    ex.tags.includes(category) || 
    ex.tags.some(tag => tag.toLowerCase().includes(category.toLowerCase()))
  );
}

export function getBinderAwareExercises() {
  return exerciseLibrary.filter(ex => ex.binder_aware);
}

export function getHeavyBindingSafeExercises() {
  return exerciseLibrary.filter(ex => ex.heavy_binding_safe);
}

export function filterByConstraints(constraints: string[]) {
  return exerciseLibrary.filter(ex => {
    if (constraints.includes('binder_aware') && !ex.binder_aware) {
      return false;
    }
    if (constraints.includes('heavy_binding') && !ex.heavy_binding_safe) {
      return false;
    }
    return true;
  });
}
