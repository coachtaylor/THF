import exercisesData from './exercises.json';
import { Exercise } from '../types';

export const exerciseLibrary: Exercise[] = exercisesData as Exercise[];

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

export function filterByConstraints(constraints: string[]): Exercise[] {
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
