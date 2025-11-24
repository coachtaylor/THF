import { Exercise } from '../types/plan';

// Heavy binding exclusions (from BRD v2.2)
// These match slug patterns in the transformed JSON
const HEAVY_BINDING_EXCLUSIONS = [
  'jumping-jack',
  'jumping_jack',
  'high-knees',
  'high_knees',
  'mountain-climber',
  'mountain_climber',
  'burpee',
  'squat-thrust',
  'squat_thrust'
];

export function filterHeavyBindingExercises(exercises: Exercise[]): Exercise[] {
  return exercises.filter(ex => {
    // Exclude chest-heavy cardio by checking slug/id
    const isExcluded = HEAVY_BINDING_EXCLUSIONS.some(exclusion => 
      ex.id.includes(exclusion) || ex.id === exclusion
    );
    if (isExcluded) {
      return false;
    }

    // Only include heavy_binding_safe exercises
    return ex.heavy_binding_safe === true;
  });
}

export function prioritizeLowerBodyAndCore(exercises: Exercise[]): Exercise[] {
  // Sort exercises to prioritize lower body and core
  return exercises.sort((a, b) => {
    const aScore = getHeavyBindingScore(a);
    const bScore = getHeavyBindingScore(b);
    return bScore - aScore;
  });
}

function getHeavyBindingScore(exercise: Exercise): number {
  let score = 0;

  // Prioritize lower body
  if (exercise.tags?.includes('lower_body')) score += 3;

  // Prioritize core
  if (exercise.tags?.includes('core')) score += 2;

  // De-prioritize upper body
  if (exercise.tags?.includes('upper_body')) score -= 1;

  // De-prioritize cardio
  if (exercise.tags?.includes('cardio')) score -= 2;

  return score;
}

