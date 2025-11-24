// Main Entry Point: Generate Complete Workout Plan
// Orchestrates Phase 1 (Rules Engine), Phase 2 (Workout Generation), and Phase 3 (Onboarding)
// This is the ONE function called from the Review screen

import { Profile } from '../../types/index';
import { Plan, Day, Workout } from '../../types/plan';
import { Exercise, ExerciseInstance } from '../../types';
import { evaluateSafetyRules } from '../rulesEngine/evaluator';
import { selectTemplate, SelectedTemplate } from './templateSelection';
import { DayTemplate } from './templates/types';
import { getFilteredExercisePool } from '../workoutGenerator';
import { selectExercisesForDay } from './exerciseSelection';
import { calculateVolumeAdjustments, VolumeAdjustments } from './volumeAdjustment';
import { generateWarmup, generateCooldown } from './warmupCooldown';
import { injectSafetyCheckpoints, convertToPrescriptions } from './checkpointInjection';
import { assembleWorkout, AssembledWorkout } from './workoutAssembler';
import { saveWorkoutToDatabase } from './databaseStorage';
import { fetchAllExercises } from '../exerciseService';
import { SafetyContext } from '../rulesEngine/rules/types';

/**
 * MAIN ENTRY POINT: Generate complete workout plan
 * 
 * This function orchestrates all phases:
 * - Phase 1: Evaluate safety rules
 * - Phase 2: Generate workouts with templates
 * - Phase 3: Uses profile data from onboarding
 * 
 * @param profile - Complete user profile from Phase 3 onboarding
 * @param blockLength - 1-week or 4-week plan
 * @param startDate - When plan begins
 * @returns Complete Plan with all workouts
 */
export async function generateWorkoutPlan(
  profile: Profile,
  blockLength: 1 | 4 = 4,
  startDate: Date = new Date()
): Promise<Plan> {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   TRANSFITNESS WORKOUT PLAN GENERATION                 ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  console.log('📋 Plan Configuration:');
  console.log(`   User: ${profile.user_id}`);
  console.log(`   Block Length: ${blockLength} week(s)`);
  console.log(`   Start Date: ${startDate.toLocaleDateString()}`);
  console.log(`   Primary Goal: ${profile.primary_goal}`);
  console.log(`   Gender Identity: ${profile.gender_identity}`);
  
  // STEP 1: Fetch exercise library from Supabase
  console.log('\n📚 STEP 1: Loading Exercise Library');
  const allExercises = await fetchAllExercises();
  console.log(`   ✓ Loaded ${allExercises.length} exercises from database`);
  
  // STEP 2: Evaluate safety rules (Phase 1)
  console.log('\n🛡️ STEP 2: Evaluating Safety Rules (Phase 1)');
  const safetyContext = await evaluateSafetyRules(profile, allExercises);
  console.log(`   ✓ Applied ${safetyContext.rules_applied.length} safety rules`);
  console.log(`   ✓ Excluded ${safetyContext.excluded_exercise_ids.length} unsafe exercises`);
  console.log(`   ✓ Critical blocks: ${safetyContext.critical_blocks.length}`);
  console.log(`   ✓ Required checkpoints: ${safetyContext.required_checkpoints.length}`);
  
  // STEP 3: Select workout template (Phase 2A)
  console.log('\n📋 STEP 3: Selecting Workout Template (Phase 2A)');
  const template = selectTemplate(profile);
  console.log(`   ✓ Selected: ${template.name}`);
  console.log(`   ✓ Frequency: ${template.frequency} days/week`);
  console.log(`   ✓ HRT adjusted: ${template.adjusted_for_hrt}`);
  console.log(`   ✓ Volume multiplier: ${template.volume_multiplier}x`);
  
  // STEP 4: Filter exercise pool (Phase 2B)
  console.log('\n🔍 STEP 4: Filtering Exercise Pool (Phase 2B)');
  const { exercises: filteredExercises } = await getFilteredExercisePool(profile);
  console.log(`   ✓ Available exercises: ${filteredExercises.length}`);
  
  // STEP 5: Generate workouts for each day
  console.log('\n🏋️ STEP 5: Generating Workouts');
  
  const daysCount = blockLength === 1 ? 7 : 28;
  const days: Day[] = [];
  
  for (let dayNumber = 1; dayNumber <= daysCount; dayNumber++) {
    const templateDayIndex = (dayNumber - 1) % template.frequency;
    const dayTemplate = template.days[templateDayIndex];
    
    console.log(`\n   Day ${dayNumber}: ${dayTemplate.name}`);
    
    // Generate 4 time variants (5, 15, 30, 45 min)
    const variants: Day['variants'] = {
      5: null,
      15: null,
      30: null,
      45: null,
    };
    
    for (const duration of [5, 15, 30, 45] as const) {
      // Skip 5-minute if not in user preferences
      if (duration === 5 && !profile.preferred_minutes?.includes(5)) {
        continue;
      }
      
      console.log(`     ├─ ${duration}min variant...`);
      
      try {
        // Phase 2C: Select exercises with scoring
        const selectedExercises = selectExercisesForDay(
          filteredExercises,
          dayTemplate,
          profile
        );
        
        // Phase 2D: Calculate volume adjustments
        const volumeAdjustments = calculateVolumeAdjustments(
          profile,
          template,
          safetyContext
        );
        
        // Phase 2E: Prescribe sets/reps/rest
        const prescriptions = selectedExercises.map((ex, i) =>
          prescribeExercise(
            ex,
            i,
            selectedExercises.length,
            profile,
            volumeAdjustments,
            duration
          )
        );
        
        // Phase 2F: Generate warm-up and cool-down
        const warmup = generateWarmup(dayTemplate, selectedExercises);
        const cooldown = generateCooldown(dayTemplate, selectedExercises);
        
        // Phase 2G: Inject safety checkpoints
        const exerciseNameMap = new Map<string, string>();
        selectedExercises.forEach(ex => {
          exerciseNameMap.set(ex.id, ex.name);
        });
        
        const prescriptionsForCheckpoints = convertToPrescriptions(
          prescriptions,
          exerciseNameMap
        );
        
        const estimatedMainWorkoutDuration = estimatePrescriptionsDuration(prescriptions);
        const totalDuration = warmup.total_duration_minutes + 
                             cooldown.total_duration_minutes + 
                             estimatedMainWorkoutDuration;
        
        const checkpoints = injectSafetyCheckpoints(
          prescriptionsForCheckpoints,
          safetyContext,
          totalDuration
        );
        
        // Phase 2H: Assemble complete workout
        const assembledWorkout = assembleWorkout(
          dayTemplate,
          template,
          selectedExercises,
          prescriptions,
          warmup,
          cooldown,
          checkpoints,
          safetyContext,
          profile
        );
        
        // Convert AssembledWorkout to Workout format for Plan
        const workout: Workout = {
          duration,
          exercises: prescriptions,
          totalMinutes: assembledWorkout.estimated_duration_minutes,
        };
        
        variants[duration] = workout;
        console.log(`     ✓ ${duration}min: ${workout.exercises.length} exercises`);
        
        // Save individual workout to database (optional, can be done in batch later)
        try {
          await saveWorkoutToDatabase(
            assembledWorkout,
            profile,
            safetyContext
          );
        } catch (error) {
          console.warn(`     ⚠️  Database save skipped for ${duration}min variant`);
        }
      } catch (error) {
        console.error(`     ❌ Failed to generate ${duration}min variant:`, error);
        // Continue with other variants
      }
    }
    
    // Create Day with all variants
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + (dayNumber - 1));
    
    days.push({
      dayNumber,
      date: dayDate,
      variants,
    });
  }
  
  console.log(`\n   ✓ Generated ${days.length} days with 4 time variants each`);
  
  // STEP 6: Assemble complete plan
  console.log('\n📦 STEP 6: Assembling Complete Plan');
  
  const plan: Plan = {
    id: generatePlanId(),
    blockLength: blockLength,
    startDate: startDate,
    goals: profile.goals || [profile.primary_goal] || ['general_fitness'],
    goalWeighting: profile.goal_weighting || { primary: 100, secondary: 0 },
    days,
  };
  
  console.log(`   ✓ Plan ID: ${plan.id}`);
  console.log(`   ✓ Days: ${plan.days.length}`);
  console.log(`   ✓ Total workouts: ${plan.days.length * 4} (4 variants per day)`);
  
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   ✅ WORKOUT PLAN GENERATION COMPLETE!                 ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  console.log('📊 Summary:');
  console.log(`   • Plan ID: ${plan.id}`);
  console.log(`   • Block Length: ${blockLength} week(s)`);
  console.log(`   • Total Days: ${plan.days.length}`);
  console.log(`   • Workouts per Day: 4 time variants`);
  console.log(`   • Safety Rules Applied: ${safetyContext.rules_applied.length}`);
  console.log(`   • Exercises Excluded: ${safetyContext.excluded_exercise_ids.length}`);
  console.log(`   • Template: ${template.name}`);
  console.log(`   • HRT Adjusted: ${template.adjusted_for_hrt ? 'Yes' : 'No'}`);
  console.log('');
  
  return plan;
}

// Helper functions

/**
 * Prescribe sets, reps, rest, and weight guidance for a single exercise
 */
function prescribeExercise(
  exercise: Exercise,
  index: number,
  total: number,
  profile: Profile,
  volumeAdjustments: VolumeAdjustments,
  duration: number
): ExerciseInstance {
  // Calculate sets with volume adjustments
  const sets = calculateSets(duration, exercise.difficulty, index, total, volumeAdjustments);
  
  // Calculate reps with volume adjustments
  const reps = calculateReps(exercise.difficulty, profile.primary_goal, volumeAdjustments);
  
  // Calculate rest with volume adjustments
  const rest = calculateRest(duration, exercise.difficulty, volumeAdjustments);
  
  // Select workout format
  const format = selectFormat(duration);
  
  // Determine weight guidance
  const weight_guidance = determineWeightGuidance(exercise, profile);
  
  return {
    exerciseId: exercise.id,
    sets,
    reps,
    format,
    restSeconds: rest,
    weight_guidance,
  };
}

/**
 * Calculate sets for an exercise with volume adjustments
 */
function calculateSets(
  duration: number,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  exerciseIndex: number,
  totalExercises: number,
  volumeAdjustments: VolumeAdjustments
): number {
  let baseSets: number;
  
  if (duration === 5) {
    baseSets = 1;
  } else if (duration === 15) {
    if (exerciseIndex < 2) {
      baseSets = difficulty === 'advanced' ? 4 : 3;
    } else {
      baseSets = 2;
    }
  } else if (duration === 30) {
    if (exerciseIndex < 3) {
      baseSets = difficulty === 'beginner' ? 3 : 4;
    } else {
      baseSets = difficulty === 'beginner' ? 2 : 3;
    }
  } else {
    // 45 minutes
    if (exerciseIndex < 3) {
      baseSets = difficulty === 'beginner' ? 4 : 5;
    } else {
      baseSets = difficulty === 'beginner' ? 3 : 4;
    }
  }
  
  // Apply volume multiplier
  baseSets = Math.round(baseSets * volumeAdjustments.sets_multiplier);
  
  // Clamp to reasonable range
  const minSets = duration === 5 ? 1 : 2;
  const maxSets = 5;
  baseSets = Math.max(minSets, Math.min(maxSets, baseSets));
  
  return baseSets;
}

/**
 * Calculate reps for an exercise with volume adjustments
 */
function calculateReps(
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  primaryGoal?: string,
  volumeAdjustments?: VolumeAdjustments
): number {
  let baseReps: number;
  
  if (primaryGoal === 'strength') {
    switch (difficulty) {
      case 'beginner':
        baseReps = 5;
        break;
      case 'intermediate':
        baseReps = 5;
        break;
      case 'advanced':
        baseReps = 6;
        break;
      default:
        baseReps = 5;
    }
  } else if (primaryGoal === 'endurance') {
    switch (difficulty) {
      case 'beginner':
        baseReps = 15;
        break;
      case 'intermediate':
        baseReps = 18;
        break;
      case 'advanced':
        baseReps = 20;
        break;
      default:
        baseReps = 15;
    }
  } else {
    // Hypertrophy (default for feminization/masculinization)
    switch (difficulty) {
      case 'beginner':
        baseReps = 10;
        break;
      case 'intermediate':
        baseReps = 12;
        break;
      case 'advanced':
        baseReps = 12;
        break;
      default:
        baseReps = 10;
    }
  }
  
  // Apply reps adjustment
  if (volumeAdjustments && volumeAdjustments.reps_adjustment !== 0) {
    baseReps += volumeAdjustments.reps_adjustment;
  }
  
  // Clamp to reasonable range
  baseReps = Math.max(5, Math.min(20, baseReps));
  
  return baseReps;
}

/**
 * Calculate rest time with volume adjustments
 */
function calculateRest(
  duration: number,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  volumeAdjustments?: VolumeAdjustments
): number {
  let baseRest: number;
  
  if (duration === 5) {
    baseRest = 15;
  } else if (duration === 15) {
    baseRest = difficulty === 'advanced' ? 45 : 30;
  } else if (duration === 30) {
    baseRest = difficulty === 'beginner' ? 60 : 45;
  } else {
    // 45 minutes
    baseRest = difficulty === 'beginner' ? 60 : 45;
  }
  
  // Apply rest multiplier
  if (volumeAdjustments) {
    baseRest = Math.round(baseRest * volumeAdjustments.rest_multiplier);
  }
  
  // Clamp to reasonable range
  baseRest = Math.max(10, Math.min(120, baseRest));
  
  return baseRest;
}

/**
 * Select workout format based on duration
 */
function selectFormat(duration: number): 'EMOM' | 'AMRAP' | 'straight_sets' {
  // For now, all workouts use straight sets
  // Can be expanded in future for time-based formats
  return 'straight_sets';
}

/**
 * Determine weight guidance based on experience level
 */
function determineWeightGuidance(
  exercise: Exercise,
  profile: Profile
): string {
  switch (profile.fitness_experience) {
    case 'beginner':
      return 'Start light, focus on form';
    case 'intermediate':
      return 'Moderate weight, leave 2-3 reps in reserve';
    case 'advanced':
      return 'Challenging weight, leave 1-2 reps in reserve';
    default:
      return 'Choose appropriate weight';
  }
}

/**
 * Estimate duration of exercise prescriptions
 */
function estimatePrescriptionsDuration(prescriptions: ExerciseInstance[]): number {
  let totalMinutes = 0;
  
  for (const p of prescriptions) {
    const reps = typeof p.reps === 'number' ? p.reps : 10;
    
    // Estimate: 3 seconds per rep
    const workSeconds = p.sets * reps * 3;
    
    // Rest time: between sets (one less rest than sets)
    const restSeconds = Math.max(0, (p.sets - 1) * p.restSeconds);
    
    totalMinutes += (workSeconds + restSeconds) / 60;
  }
  
  return Math.round(totalMinutes);
}

/**
 * Generate unique plan ID
 */
function generatePlanId(): string {
  return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

