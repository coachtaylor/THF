import { Plan, Day, Workout, ExerciseInstance } from '../types';
import { Exercise } from '../types';
import { exerciseLibrary } from '../data/exercises';
import { Profile } from './storage/profile';

// Generate Quick Start plan (5-min bodyweight workout)
export async function generateQuickStartPlan(): Promise<Plan> {
  // Filter for bodyweight, binder-aware exercises only
  const safeExercises = exerciseLibrary.filter(
    (ex) => ex.equipment.includes('bodyweight') && ex.binder_aware === true
  );

  // Select exercises (variety: lower body, core, upper body, cardio)
  const selectedExercises = selectQuickStartExercises(safeExercises);

  // Convert to ExerciseInstances for 5-minute workout
  const exerciseInstances: ExerciseInstance[] = selectedExercises.map((ex) => ({
    exerciseId: ex.id,
    sets: 1,
    reps: 10,
    format: 'straight_sets',
    restSeconds: 30,
  }));

  // Create single day with 5-min variant only
  const day: Day = {
    dayNumber: 0,
    date: new Date(),
        variants: {
          5: {
            duration: 5,
            exercises: exerciseInstances,
            totalMinutes: 5,
          },
          15: null as any, // Not used in Quick Start
          30: null as any,
          45: null as any,
        },
  };

  return {
    id: 'quick-start',
    blockLength: 1,
    startDate: new Date(),
    goals: ['strength'], // Default goal for Quick Start
    goalWeighting: { primary: 100, secondary: 0 },
    days: [day],
  };
}

// Select exercises for Quick Start (aim for 10, but work with what's available)
function selectQuickStartExercises(exercises: Exercise[]): Exercise[] {
  const selected: Exercise[] = [];

  // Get exercises by category
  const lowerBody = exercises.filter((ex) => ex.category === 'lower_body' || ex.tags?.includes('lower_body'));
  const core = exercises.filter((ex) => ex.category === 'core' || ex.tags?.includes('core'));
  const upperBody = exercises.filter(
    (ex) => ex.category === 'upper_push' || ex.category === 'upper_pull' || ex.tags?.includes('upper_body')
  );
  const cardio = exercises.filter((ex) => ex.category === 'cardio' || ex.tags?.includes('cardio'));

  // Select up to 3 lower body exercises
  selected.push(...lowerBody.slice(0, 3));

  // Select up to 3 core exercises
  selected.push(...core.slice(0, 3));

  // Select up to 2 upper body exercises
  selected.push(...upperBody.slice(0, 2));

  // Select up to 2 cardio exercises
  selected.push(...cardio.slice(0, 2));

  // If we don't have enough exercises, fill with any available safe exercises
  if (selected.length < 5) {
    const remaining = exercises.filter((ex) => !selected.find((s) => s.id === ex.id));
    selected.push(...remaining.slice(0, 5 - selected.length));
  }

  // Ensure we have at least 3 exercises (minimum for a 5-min workout)
  if (selected.length === 0) {
    // Fallback: use any available exercises
    selected.push(...exercises.slice(0, Math.min(5, exercises.length)));
  }

  return selected;
}

// Generate personalized plan based on user profile
export interface PlanGeneratorInput {
  profile: Profile;
  blockLength: 1 | 4;
  startDate: Date;
}

export async function generatePlan(input: PlanGeneratorInput): Promise<Plan> {
  const { profile, blockLength, startDate } = input;

  // Filter exercises based on constraints and equipment
  let availableExercises = exerciseLibrary.filter((ex) => {
    // Filter by equipment
    const userEquipment = profile.equipment || ['bodyweight'];
    if (!ex.equipment.some((eq) => userEquipment.includes(eq))) {
      return false;
    }

    // Filter by binder awareness
    const constraints = profile.constraints || [];
    if (constraints.includes('binder_aware') && !ex.binder_aware) {
      return false;
    }

    // Filter by heavy binding
    if (constraints.includes('heavy_binding') && !ex.heavy_binding_safe) {
      return false;
    }

    // Filter by no jumping
    if (constraints.includes('no_jumping') && ex.tags?.includes('jumping')) {
      return false;
    }

    return true;
  });

  // Get user goals
  const goals = profile.goals || ['strength'];
  const goalWeighting = profile.goal_weighting || { primary: 100, secondary: 0 };
  const preferredMinutes = profile.preferred_minutes || [15, 30];

  // Generate days
  const numDays = blockLength === 1 ? 7 : 28;
  const days: Day[] = [];

  for (let i = 0; i < numDays; i++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + i);

    const day: Day = {
      dayNumber: i,
      date: dayDate,
      variants: {
        5: preferredMinutes.includes(5) ? generateWorkout(availableExercises, goals, goalWeighting, 5) : null,
        15: generateWorkout(availableExercises, goals, goalWeighting, 15),
        30: generateWorkout(availableExercises, goals, goalWeighting, 30),
        45: generateWorkout(availableExercises, goals, goalWeighting, 45),
      },
    };

    days.push(day);
  }

  return {
    id: `plan_${Date.now()}`,
    blockLength,
    startDate,
    goals: goals as any[],
    goalWeighting,
    days,
  };
}

// Generate a workout for a specific duration
function generateWorkout(
  availableExercises: Exercise[],
  goals: string[],
  goalWeighting: { primary: number; secondary: number },
  duration: 5 | 15 | 30 | 45
): Workout {
  // Calculate number of exercises based on duration
  const numExercises = duration === 5 ? 5 : duration === 15 ? 8 : duration === 30 ? 12 : 15;

  // Categorize exercises by goal
  const primaryGoal = goals[0] || 'strength';
  const secondaryGoal = goals[1];

  // Select exercises based on goal weighting
  const primaryCount = Math.round(numExercises * (goalWeighting.primary / 100));
  const secondaryCount = numExercises - primaryCount;

  const selectedExercises: Exercise[] = [];

  // Select primary goal exercises
  const primaryExercises = filterExercisesByGoal(availableExercises, primaryGoal);
  selectedExercises.push(...selectRandomExercises(primaryExercises, primaryCount));

  // Select secondary goal exercises if available
  if (secondaryGoal && secondaryCount > 0) {
    const secondaryExercises = filterExercisesByGoal(availableExercises, secondaryGoal);
    selectedExercises.push(...selectRandomExercises(secondaryExercises, secondaryCount));
  }

  // Fill remaining slots with any available exercises
  if (selectedExercises.length < numExercises) {
    const remaining = availableExercises.filter((ex) => !selectedExercises.find((s) => s.id === ex.id));
    selectedExercises.push(...selectRandomExercises(remaining, numExercises - selectedExercises.length));
  }

  // Convert to ExerciseInstances
  const exerciseInstances: ExerciseInstance[] = selectedExercises.map((ex) => ({
    exerciseId: ex.id,
    sets: duration === 5 ? 1 : duration === 15 ? 2 : 3,
    reps: 10,
    format: 'straight_sets',
    restSeconds: duration === 5 ? 30 : duration === 15 ? 45 : 60,
  }));

  return {
    duration,
    exercises: exerciseInstances,
    totalMinutes: duration,
  };
}

// Filter exercises by goal
function filterExercisesByGoal(exercises: Exercise[], goal: string): Exercise[] {
  // Map goals to exercise categories/tags
  const goalMappings: Record<string, string[]> = {
    strength: ['lower_body', 'upper_push', 'upper_pull', 'core'],
    cardio: ['cardio'],
    flexibility: ['core'], // Placeholder - would need flexibility-specific exercises
    custom: [], // Custom can include any
  };

  const categories = goalMappings[goal] || [];
  if (categories.length === 0) {
    return exercises; // Return all if no specific mapping
  }

  return exercises.filter((ex) => categories.includes(ex.category) || ex.tags?.some((tag) => categories.includes(tag)));
}

// Select random exercises (no duplicates)
function selectRandomExercises(exercises: Exercise[], count: number): Exercise[] {
  if (exercises.length === 0) return [];
  const shuffled = [...exercises].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

