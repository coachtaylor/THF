// src/services/workoutGenerator.ts
// Core workout generation logic with filtering and selection

import { Profile, Exercise, Workout, ExerciseInstance, Goal } from '../types';

interface WorkoutGenerationOptions {
  duration: 5 | 15 | 30 | 45;
  profile: Profile;
  availableExercises: Exercise[];
}

/**
 * Main entry point: Generate a workout based on user profile
 */
export function generateWorkout(
  profile: Profile,
  duration: 5 | 15 | 30 | 45,
  availableExercises: Exercise[]
): Workout {
  console.log(`🏋️ Generating ${duration}min workout for profile:`, profile.id);
  
  // Step 1: Filter by equipment availability
  const withEquipment = filterByEquipment(availableExercises, profile.preferences.equipment);
  console.log(`✅ After equipment filter: ${withEquipment.length} exercises`);
  
  // Step 2: Filter by safety constraints
  const safeExercises = filterByConstraints(withEquipment, profile.constraints);
  console.log(`✅ After safety filter: ${safeExercises.length} exercises`);
  
  // Step 3: Select exercises based on goals
  const selectedExercises = selectByGoals(safeExercises, profile.goals, duration);
  console.log(`✅ Selected ${selectedExercises.length} exercises for workout`);
  
  // Step 4: Structure into workout format
  const workout = structureWorkout(selectedExercises, duration);
  console.log(`✅ Workout generated with ${workout.exercises.length} exercises`);
  
  return workout;
}

/**
 * Filter exercises by available equipment
 * Returns exercises that can be performed with user's equipment
 */
export function filterByEquipment(
  exercises: Exercise[],
  userEquipment: string[]
): Exercise[] {
  if (userEquipment.length === 0) {
    console.warn('⚠️ No equipment selected by user');
    return [];
  }
  
  return exercises.filter(exercise => {
    // Exercise is valid if it uses ANY of the user's equipment
    const hasMatchingEquipment = exercise.equipment.some(eq =>
      userEquipment.includes(eq)
    );
    
    if (!hasMatchingEquipment) {
      console.log(`❌ Filtered out: ${exercise.name} (needs ${exercise.equipment.join(', ')})`);
    }
    
    return hasMatchingEquipment;
  });
}

/**
 * Filter exercises by safety constraints
 */
export function filterByConstraints(
  exercises: Exercise[],
  constraints: string[]
): Exercise[] {
  return exercises.filter(exercise => {
    // Check binder awareness
    if (constraints.includes('binder_aware') && !exercise.binder_aware) {
      console.log(`❌ Filtered out: ${exercise.name} (not binder aware)`);
      return false;
    }
    
    // Check heavy binding safety
    if (constraints.includes('heavy_binding') && !exercise.heavy_binding_safe) {
      console.log(`❌ Filtered out: ${exercise.name} (not safe for heavy binding)`);
      return false;
    }
    
    // Check pelvic floor awareness
    if (constraints.includes('post_op') && !exercise.pelvic_floor_aware) {
      console.log(`❌ Filtered out: ${exercise.name} (not pelvic floor aware)`);
      return false;
    }
    
    return true;
  });
}

/**
 * Select exercises based on user goals
 * Prioritizes exercises that align with primary/secondary goals
 */
export function selectByGoals(
  exercises: Exercise[],
  goals: Goal[],
  duration: number
): Exercise[] {
  const exercisesNeeded = calculateExerciseCount(duration);
  
  if (exercises.length === 0) {
    console.error('❌ No exercises available after filtering!');
    return [];
  }
  
  // For MVP: Simple selection
  // TODO: Implement goal-based weighting and category distribution
  
  // Shuffle and take first N exercises
  const shuffled = [...exercises].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, exercisesNeeded);
  
  console.log(`📋 Selected exercises:`, selected.map(ex => ex.name));
  
  return selected;
}

/**
 * Calculate how many exercises to include based on duration
 */
function calculateExerciseCount(duration: number): number {
  const mapping: Record<number, number> = {
    5: 2,   // Quick workout: 2 exercises
    15: 4,  // Short workout: 4 exercises
    30: 6,  // Medium workout: 6 exercises
    45: 8,  // Long workout: 8 exercises
  };
  
  return mapping[duration] || 4;
}

/**
 * Structure selected exercises into workout format
 * Assigns sets, reps, format, rest periods
 */
export function structureWorkout(
  exercises: Exercise[],
  duration: number
): Workout {
  const exerciseInstances: ExerciseInstance[] = exercises.map(exercise => {
    const sets = calculateSets(duration, exercise.difficulty);
    const reps = calculateReps(exercise.difficulty);
    const format = selectFormat(duration);
    const restSeconds = calculateRest(duration, exercise.difficulty);
    
    return {
      exerciseId: exercise.id,
      sets,
      reps,
      format,
      restSeconds,
    };
  });
  
  return {
    duration: duration as 5 | 15 | 30 | 45,
    exercises: exerciseInstances,
    totalMinutes: duration,
  };
}

/**
 * Calculate number of sets based on duration and difficulty
 */
function calculateSets(duration: number, difficulty: string): number {
  if (duration === 5) {
    return 1; // Quick workout: 1 set per exercise
  }
  
  if (duration === 15) {
    return difficulty === 'beginner' ? 2 : 2;
  }
  
  if (duration === 30) {
    return difficulty === 'beginner' ? 3 : 3;
  }
  
  // 45 minutes
  return difficulty === 'beginner' ? 3 : 4;
}

/**
 * Calculate reps based on difficulty level
 */
function calculateReps(difficulty: string): number {
  const mapping: Record<string, number> = {
    'beginner': 12,
    'intermediate': 10,
    'advanced': 8,
  };
  
  return mapping[difficulty] || 10;
}

/**
 * Select workout format based on duration
 */
function selectFormat(duration: number): 'EMOM' | 'AMRAP' | 'straight_sets' {
  if (duration === 5) {
    return 'AMRAP'; // As many rounds as possible
  }
  
  if (duration === 15) {
    return 'EMOM'; // Every minute on the minute
  }
  
  return 'straight_sets'; // Standard sets x reps
}

/**
 * Calculate rest period based on duration and difficulty
 */
function calculateRest(duration: number, difficulty: string): number {
  if (duration === 5) {
    return 30; // Quick rest for short workouts
  }
  
  if (difficulty === 'beginner') {
    return 60; // Longer rest for beginners
  }
  
  if (difficulty === 'intermediate') {
    return 45;
  }
  
  return 30; // Shorter rest for advanced
}

/**
 * Validate that a workout meets minimum requirements
 */
export function validateWorkout(workout: Workout): boolean {
  if (workout.exercises.length === 0) {
    console.error('❌ Workout has no exercises');
    return false;
  }
  
  if (workout.totalMinutes !== workout.duration) {
    console.warn('⚠️ Workout duration mismatch');
  }
  
  return true;
}

/**
 * Debug helper: Print workout summary
 */
export function printWorkoutSummary(workout: Workout): void {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📋 WORKOUT SUMMARY (${workout.duration} min)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total exercises: ${workout.exercises.length}`);
  console.log(`Total duration: ${workout.totalMinutes} minutes`);
  console.log('\nExercises:');
  workout.exercises.forEach((ex, idx) => {
    console.log(`  ${idx + 1}. Exercise ID: ${ex.exerciseId}`);
    console.log(`     Format: ${ex.format}`);
    console.log(`     Sets: ${ex.sets} x ${ex.reps} reps`);
    console.log(`     Rest: ${ex.restSeconds}s`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}