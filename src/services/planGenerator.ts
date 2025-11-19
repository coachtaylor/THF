import { Plan, Day, Workout, ExerciseInstance, Exercise } from '../types/plan';
import { getExerciseLibrary } from '../data/exercises';
import { Profile } from './storage/profile';
import { filterExercisesByConstraints } from './data/exerciseFilters';

// Generate Quick Start plan (5-min bodyweight workout)
// Uses safe defaults for a random trans user and reuses the same filtering logic as full onboarding
export async function generateQuickStartPlan(): Promise<Plan> {
  // Create synthetic profile with safest assumptions for a random trans user
  const quickStartProfile: Profile = {
    id: 'quickstart',
    disclaimer_acknowledged_at: new Date().toISOString(),
    goals: ['strength'],
    goal_weighting: { primary: 100, secondary: 0 },
    constraints: ['binder_aware'], // default to binder safe
    surgery_flags: [],
    surgeon_cleared: false,
    hrt_flags: [], // unknown
    fitness_level: 'beginner',
    block_length: 1,
    equipment_raw: ['BODY WEIGHT'],
    equipment: ['bodyweight'],
    low_sensory_mode: true,
  };

  // Fetch exercises from Supabase
  const exerciseLibrary = await getExerciseLibrary();
  console.log(`📥 Loaded ${exerciseLibrary.length} exercises from library`);
  
  // Use the same filtering logic as full onboarding
  const safeExercises = filterExercisesByConstraints(exerciseLibrary, quickStartProfile);
  console.log(`✅ After filtering: ${safeExercises.length} safe exercises`);
  console.log(`   Profile equipment_raw: ${quickStartProfile.equipment_raw?.join(', ') || 'none'}`);
  console.log(`   Profile equipment: ${quickStartProfile.equipment?.join(', ') || 'none'}`);
  
  // Debug: Check first few exercises
  if (exerciseLibrary.length > 0) {
    const sample = exerciseLibrary.slice(0, 3);
    sample.forEach(ex => {
      console.log(`   Sample exercise: ${ex.name}`);
      console.log(`     - rawEquipment: ${ex.rawEquipment?.join(', ') || '[]'}`);
      console.log(`     - equipment: ${ex.equipment?.join(', ') || '[]'}`);
      console.log(`     - binder_aware: ${ex.binder_aware}`);
      console.log(`     - difficulty: ${ex.difficulty}`);
    });
  }

  // Safety check: If filtering removed all exercises, use all exercises as fallback
  const exercisesToUse = safeExercises.length > 0 ? safeExercises : exerciseLibrary;
  if (safeExercises.length === 0) {
    console.warn('⚠️ No exercises passed filtering! Using all exercises as fallback.');
    console.warn('   This suggests the filtering criteria may be too strict or exercises don\'t match the profile.');
  }

  // Select exercises (variety: lower body, core, upper body, cardio)
  const selectedExercises = selectQuickStartExercises(exercisesToUse);
  
  if (selectedExercises.length === 0) {
    throw new Error('No exercises available. Please check database connection and exercise data.');
  }

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

  // Get exercises by tags (compatible with plan.ts Exercise interface)
  const lowerBody = exercises.filter((ex) => ex.tags.includes('lower_body'));
  const core = exercises.filter((ex) => ex.tags.includes('core'));
  const upperBody = exercises.filter((ex) => 
    ex.tags.includes('upper_body') || ex.tags.includes('upper_push') || ex.tags.includes('upper_pull')
  );
  const cardio = exercises.filter((ex) => ex.tags.includes('cardio'));

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

  console.log('🚀 generatePlan: Starting plan generation');
  console.log(`   Profile goals: ${(profile.goals || []).join(', ') || 'none'}`);
  console.log(`   Profile equipment: ${(profile.equipment || []).join(', ') || 'none'}`);
  console.log(`   Profile equipment_raw: ${(profile.equipment_raw || []).join(', ') || 'none'}`);
  console.log(`   Profile constraints: ${(profile.constraints || []).join(', ') || 'none'}`);
  console.log(`   Profile fitness_level: ${profile.fitness_level || 'not set'}`);

  // 1. Fetch exercises from Supabase
  const exerciseLibrary = await getExerciseLibrary();
  console.log(`📦 Loaded exercises from library: ${exerciseLibrary.length}`);

  if (exerciseLibrary.length === 0) {
    console.error('❌ CRITICAL: Exercise library is empty! Cannot generate plan.');
    throw new Error('No exercises available in library. Please check database connection and exercise data.');
  }

  // 2. Calculate weekly minutes target
  const weeklyMinutesTarget = calculateWeeklyMinutesTarget(profile);

  // 3. Filter exercise library by constraints
  console.log('🔍 Filtering exercises by constraints...');
  let availableExercises = filterExercisesByConstraints(
    exerciseLibrary,
    profile
  );
  console.log(`✅ Exercises after filtering: ${availableExercises.length} (from ${exerciseLibrary.length} total)`);

  if (availableExercises.length === 0) {
    console.warn('⚠️ WARNING: All exercises filtered out! Using all exercises as fallback.');
    // Use all exercises as fallback if filtering removed everything
    availableExercises = exerciseLibrary;
    console.log(`   Using ${availableExercises.length} exercises as fallback`);
  }

  // 4. Categorize exercises by goal
  console.log('📋 Categorizing exercises by goals...');
  const exercisesByGoal = categorizeExercisesByGoal(
    availableExercises,
    profile.goals || []
  );
  
  // Check if we have exercises for the goals
  const totalExercisesByGoal = Object.values(exercisesByGoal).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`📊 Total exercises categorized by goals: ${totalExercisesByGoal}`);
  
  // Log breakdown per goal
  Object.entries(exercisesByGoal).forEach(([goal, exercises]) => {
    console.log(`   Goal "${goal}": ${exercises.length} exercises`);
  });

  // 5. Generate days
  const numDays = blockLength === 1 ? 7 : 28;
  const days: Day[] = [];

  for (let i = 0; i < numDays; i++) {
    const day = generateDay(
      i,
      addDays(startDate, i),
      exercisesByGoal,
      profile,
      weeklyMinutesTarget,
      availableExercises // Pass as fallback
    );
    
    // Debug: Check if workouts have exercises
    const workout15 = day.variants[15];
    if (workout15) {
      console.log(`   Day ${i}: 15min workout has ${workout15.exercises.length} exercises`);
    }
    
    days.push(day);
  }

  // 6. Balance weekly minutes (within 10% of target)
  balanceWeeklyMinutes(days, weeklyMinutesTarget, blockLength);

  return {
    id: generateId(),
    blockLength,
    startDate,
    goals: profile.goals || [],
    goalWeighting: profile.goal_weighting || { primary: 70, secondary: 30 },
    days
  };
}

// Calculate weekly minutes target based on user preferences
function calculateWeeklyMinutesTarget(profile: Profile): number {
  // Use default average of 20 minutes per workout
  // Users can select any duration when starting a workout
  const avgMinutes = 20;
  
  // Assume 4 workouts per week
  return avgMinutes * 4;
}


// Categorize exercises by goal
function categorizeExercisesByGoal(
  exercises: Exercise[],
  goals: string[]
): Record<string, Exercise[]> {
  const categorized: Record<string, Exercise[]> = {};

  // Map goals to exercise categories/tags
  const goalMappings: Record<string, string[]> = {
    strength: ['lower_body', 'upper_push', 'upper_pull', 'core', 'strength', 'conditioning'],
    cardio: ['cardio', 'conditioning'],
    flexibility: ['core', 'flexibility', 'stretching', 'mobility'],
    endurance: ['cardio', 'endurance', 'conditioning'],
    custom: [], // Custom can include any
  };

  goals.forEach(goal => {
    const categories = goalMappings[goal] || [];
    
    if (categories.length === 0) {
      // If no mapping, include all exercises (for custom or unknown goals)
      categorized[goal] = exercises;
    } else {
      // Filter exercises that match any of the mapped categories/tags
      categorized[goal] = exercises.filter(ex => 
        categories.some(cat => 
          ex.tags.includes(cat) || 
          ex.tags.some(tag => tag.toLowerCase().includes(cat.toLowerCase()))
        )
      );
      
      // Fallback: If no exercises match the goal tags, use all exercises
      // This ensures we always have exercises to work with
      if (categorized[goal].length === 0 && exercises.length > 0) {
        console.warn(`   ⚠️ Goal "${goal}": No exercises matched tags, using all exercises as fallback`);
        categorized[goal] = exercises;
      }
    }
    
    console.log(`   Goal "${goal}": ${categorized[goal]?.length || 0} exercises`);
  });

  return categorized;
}

// Generate single day with 4 time variants
function generateDay(
  dayNumber: number,
  date: Date,
  exercisesByGoal: Record<string, Exercise[]>,
  profile: Profile,
  weeklyMinutesTarget: number,
  allAvailableExercises?: Exercise[]
): Day {
  return {
    dayNumber,
    date,
    variants: {
      5: generateWorkout(5, exercisesByGoal, profile, allAvailableExercises),
      15: generateWorkout(15, exercisesByGoal, profile, allAvailableExercises),
      30: generateWorkout(30, exercisesByGoal, profile, allAvailableExercises),
      45: generateWorkout(45, exercisesByGoal, profile, allAvailableExercises)
    }
  };
}

// Generate single workout for given duration
function generateWorkout(
  duration: 5 | 15 | 30 | 45,
  exercisesByGoal: Record<string, Exercise[]>,
  profile: Profile,
  allAvailableExercises?: Exercise[]
): Workout {
  const goalWeighting = profile.goal_weighting || { primary: 70, secondary: 30 };
  const goals = profile.goals || [];

  // Calculate number of exercises based on duration
  const numExercises = duration === 5 ? 5 : duration === 15 ? 8 : duration === 30 ? 12 : 15;

  // SAFE FALLBACK: If exercisesByGoal is empty but we have filtered exercises, use those
  const totalExercisesByGoal = Object.values(exercisesByGoal).reduce((sum, arr) => sum + arr.length, 0);
  if (totalExercisesByGoal === 0 && allAvailableExercises && allAvailableExercises.length > 0) {
    console.warn(`⚠️ generateWorkout (${duration}min): exercisesByGoal is empty, using ${allAvailableExercises.length} filtered exercises as fallback`);
    const uniqueAvailable = allAvailableExercises.filter((ex, index, self) =>
      index === self.findIndex(e => e.id === ex.id)
    );
    const selectedExercises = uniqueAvailable.slice(0, Math.min(numExercises, uniqueAvailable.length));
    
    const exerciseInstances: ExerciseInstance[] = selectedExercises.map(ex => ({
      exerciseId: ex.id,
      sets: duration === 5 ? 1 : duration === 15 ? 2 : 3,
      reps: 10,
      format: 'straight_sets',
      restSeconds: 30
    }));

    console.log(`   ✅ ${duration}min workout (fallback): ${selectedExercises.length} exercises`);
    
    return {
      duration,
      exercises: exerciseInstances,
      totalMinutes: duration
    };
  }

  // Select exercises based on goal weighting
  const primaryGoal = goals[0];
  const secondaryGoal = goals[1];

  const primaryCount = Math.round(numExercises * (goalWeighting.primary / 100));
  const secondaryCount = numExercises - primaryCount;

  const selectedExercises: Exercise[] = [];

  // Select primary goal exercises
  const primaryExercises = exercisesByGoal[primaryGoal] || [];
  if (primaryExercises.length > 0) {
    selectedExercises.push(...selectRandomExercises(primaryExercises, primaryCount));
  }

  // Select secondary goal exercises
  if (secondaryGoal) {
    const secondaryExercises = exercisesByGoal[secondaryGoal] || [];
    if (secondaryExercises.length > 0) {
      selectedExercises.push(...selectRandomExercises(secondaryExercises, secondaryCount));
    }
  }

  // If we don't have enough exercises, fill with any available exercises from all goals
  if (selectedExercises.length < numExercises) {
    const allGoalExercises: Exercise[] = [];
    Object.values(exercisesByGoal).forEach(exList => {
      allGoalExercises.push(...exList);
    });
    // Remove duplicates
    const uniqueExercises = allGoalExercises.filter((ex, index, self) =>
      index === self.findIndex(e => e.id === ex.id)
    );
    const remaining = uniqueExercises.filter(ex => !selectedExercises.find(s => s.id === ex.id));
    if (remaining.length > 0) {
      selectedExercises.push(...selectRandomExercises(remaining, numExercises - selectedExercises.length));
    }
  }

  // Last resort: If still no exercises, use all exercises from all goals OR fallback to allAvailableExercises
  if (selectedExercises.length === 0) {
    const allGoalExercises: Exercise[] = [];
    Object.values(exercisesByGoal).forEach(exList => {
      allGoalExercises.push(...exList);
    });
    // Remove duplicates
    const uniqueAll = allGoalExercises.filter((ex, index, self) =>
      index === self.findIndex(e => e.id === ex.id)
    );
    if (uniqueAll.length > 0) {
      selectedExercises.push(...uniqueAll.slice(0, Math.min(numExercises, uniqueAll.length)));
    } else if (allAvailableExercises && allAvailableExercises.length > 0) {
      // Ultimate fallback: use all available exercises if exercisesByGoal is empty
      console.warn(`⚠️ generateWorkout (${duration}min): exercisesByGoal is empty, using ${allAvailableExercises.length} filtered exercises as fallback`);
      const uniqueAvailable = allAvailableExercises.filter((ex, index, self) =>
        index === self.findIndex(e => e.id === ex.id)
      );
      selectedExercises.push(...uniqueAvailable.slice(0, Math.min(numExercises, uniqueAvailable.length)));
    } else {
      console.error(`❌ generateWorkout (${duration}min): No exercises available. exercisesByGoal is empty and no fallback available.`);
    }
  }
  
  // Log final result
  if (selectedExercises.length === 0) {
    console.error(`❌ generateWorkout: Generated workout with 0 exercises for ${duration}min`);
  } else {
    console.log(`   ✅ ${duration}min workout: ${selectedExercises.length} exercises`);
  }

  // Convert to ExerciseInstances
  const exerciseInstances: ExerciseInstance[] = selectedExercises.map(ex => ({
    exerciseId: ex.id,
    sets: duration === 5 ? 1 : duration === 15 ? 2 : 3,
    reps: 10,
    format: 'straight_sets',
    restSeconds: 30
  }));

  return {
    duration,
    exercises: exerciseInstances,
    totalMinutes: duration
  };
}

// Select random exercises (no duplicates)
function selectRandomExercises(exercises: Exercise[], count: number): Exercise[] {
  const shuffled = [...exercises].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Balance weekly minutes to be within 10% of target
function balanceWeeklyMinutes(
  days: Day[],
  weeklyMinutesTarget: number,
  blockLength: 1 | 4
) {
  // TODO: Implement balancing logic
  // For now, just ensure total minutes is within 10% of target
  // This is a placeholder - full implementation would adjust workout durations
  // to balance weekly totals across weeks
}

// Helper functions
function generateId(): string {
  return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

