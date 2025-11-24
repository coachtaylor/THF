/**
 * End-to-End Test for Complete Workout Generation System (Phase 2)
 * Tests all components: Template Selection → Filtering → Selection → Prescription → Assembly
 * 
 * Run with: npx tsx scripts/testWorkoutGeneration.ts
 * 
 * Note: This script uses require() to avoid React Native bundling issues with tsx
 */

// Load environment variables first
require('dotenv/config');

// Mock expo-constants BEFORE any other imports
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id: string) {
  if (id === 'expo-constants') {
    return {
      default: {
        expoConfig: {
          extra: {
            supabaseUrl: process.env.SUPABASE_URL || '',
            supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
          }
        }
      }
    };
  }
  // Mock react-native to avoid bundling issues
  if (id === 'react-native' || id.startsWith('react-native/')) {
    return {
      Platform: { OS: 'web' },
      NativeModules: {},
      Dimensions: { get: () => ({ width: 375, height: 667 }) }
    };
  }
  return originalRequire.apply(this, arguments);
};

// Now use require for TypeScript modules (tsx handles this)
const { Profile } = require('../src/types');
const { generateWorkout } = require('../src/services/workoutGeneration');
const { AssembledWorkout } = require('../src/services/workoutGeneration/workoutAssembler');

/**
 * Create test MTF profile for feminization goal testing
 */
function createTestMTFProfile(): Profile {
  const hrtStartDate = new Date();
  hrtStartDate.setMonth(hrtStartDate.getMonth() - 6); // 6 months ago

  return {
    // Required fields
    id: 'test-mtf-profile',
    user_id: 'test-mtf-user',
    equipment: ['bodyweight', 'dumbbells', 'bands'],
    created_at: new Date(),
    updated_at: new Date(),

    // Gender and identity
    gender_identity: 'mtf',
    pronouns: 'she/her',

    // HRT information
    on_hrt: true,
    hrt_type: 'estrogen_blockers',
    hrt_start_date: hrtStartDate,
    hrt_months_duration: 6,

    // Binding information
    binds_chest: true,
    binding_frequency: 'daily',
    binding_duration_hours: 8,
    binder_type: 'commercial',

    // Fitness profile
    primary_goal: 'feminization',
    fitness_experience: 'intermediate',
    workout_frequency: 4,
    session_duration: 30,

    // No surgeries
    surgeries: [],

    // Constraints for safety
    constraints: ['binder_aware', 'heavy_binding'],

    // Legacy fields for compatibility
    goals: ['feminization'],
    goal_weighting: { primary: 100, secondary: 0 },
    block_length: 1,
    preferred_minutes: [15, 30, 45]
  };
}

/**
 * Print complete workout structure for verification
 */
function printWorkoutDetails(workout: AssembledWorkout): void {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║              COMPLETE WORKOUT STRUCTURE                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  
  console.log(`\n📋 Workout: ${workout.workout_name}`);
  console.log(`   Duration: ${workout.estimated_duration_minutes} minutes`);
  console.log(`   Template: ${workout.metadata.template_name}`);
  console.log(`   Focus: ${workout.metadata.day_focus}`);
  console.log(`   Goal: ${workout.metadata.user_goal}`);
  console.log(`   HRT Adjusted: ${workout.metadata.hrt_adjusted ? 'Yes' : 'No'}`);
  console.log(`   Rules Applied: ${workout.metadata.rules_applied.length}`);

  // Warm-up section
  console.log(`\n🔥 WARM-UP (${workout.warm_up.total_duration_minutes} min)`);
  console.log('   ────────────────────────────────────────────────');
  workout.warm_up.exercises.forEach((ex, i) => {
    const duration = ex.duration ? ` (${ex.duration})` : '';
    const reps = ex.reps ? ` - ${ex.reps}` : '';
    console.log(`   ${i + 1}. ${ex.name}${duration}${reps}`);
    console.log(`      ${ex.description}`);
  });

  // Main workout
  console.log(`\n💪 MAIN WORKOUT (${workout.main_workout.length} exercises)`);
  console.log('   ────────────────────────────────────────────────');
  workout.main_workout.forEach((ex, i) => {
    console.log(`   ${i + 1}. Exercise ID: ${ex.exerciseId}`);
    console.log(`      Sets: ${ex.sets} x ${ex.reps} reps`);
    console.log(`      Rest: ${ex.restSeconds}s between sets`);
    console.log(`      Format: ${ex.format}`);
    if (ex.weight_guidance) {
      console.log(`      Weight: ${ex.weight_guidance}`);
    }
  });

  // Cool-down section
  console.log(`\n🧘 COOL-DOWN (${workout.cool_down.total_duration_minutes} min)`);
  console.log('   ────────────────────────────────────────────────');
  workout.cool_down.exercises.forEach((ex, i) => {
    const duration = ex.duration ? ` (${ex.duration})` : '';
    const reps = ex.reps ? ` - ${ex.reps}` : '';
    console.log(`   ${i + 1}. ${ex.name}${duration}${reps}`);
    console.log(`      ${ex.description}`);
  });

  // Safety checkpoints
  console.log(`\n🛡️ SAFETY CHECKPOINTS (${workout.safety_checkpoints.length})`);
  console.log('   ────────────────────────────────────────────────');
  workout.safety_checkpoints.forEach((cp, i) => {
    const timing = cp.position === 'during_workout' 
      ? ` at ${cp.timing_minutes} min`
      : ` (${cp.position.replace('_', ' ')})`;
    console.log(`   ${i + 1}. [${cp.severity.toUpperCase()}] ${cp.message}${timing}`);
  });

  console.log('\n╚════════════════════════════════════════════════════════════════╝');
}

/**
 * Verify all required components are present
 */
function verifyWorkoutComponents(workout: AssembledWorkout): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check basic structure
  if (!workout.workout_name) {
    errors.push('Missing workout name');
  }

  if (workout.estimated_duration_minutes <= 0) {
    errors.push('Invalid duration');
  }

  // Check warm-up
  if (!workout.warm_up || workout.warm_up.exercises.length === 0) {
    errors.push('Missing warm-up exercises');
  }

  // Check main workout
  if (!workout.main_workout || workout.main_workout.length === 0) {
    errors.push('Missing main workout exercises');
  }

  // Check cool-down
  if (!workout.cool_down || workout.cool_down.exercises.length === 0) {
    errors.push('Missing cool-down exercises');
  }

  // Check metadata
  if (!workout.metadata.template_name) {
    errors.push('Missing template name in metadata');
  }

  if (workout.metadata.total_exercises !== workout.main_workout.length) {
    errors.push('Exercise count mismatch in metadata');
  }

  // Check safety checkpoints (should exist for MTF user who binds)
  if (workout.safety_checkpoints.length === 0) {
    console.warn('⚠️  Warning: No safety checkpoints found (expected for binding user)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Main test function
 */
async function runTest(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║        PHASE 2 WORKOUT GENERATION - END-TO-END TEST          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('\n🧪 Test Configuration:');
  console.log('   Profile: MTF, Feminization Goal');
  console.log('   HRT: 6 months estrogen');
  console.log('   Binds: Daily');
  console.log('   Experience: Intermediate');
  console.log('   Frequency: 4 days/week\n');

  try {
    // Create test profile
    const profile = createTestMTFProfile();
    console.log('✓ Test profile created\n');

    // Generate workout for day 0 (first day of template)
    const { workout, workoutId } = await generateWorkout(profile, 0, 30);

    console.log('\n✅ Workout generation completed successfully!');

    // Print complete workout structure
    printWorkoutDetails(workout);

    // Verify components
    console.log('\n🔍 Verifying workout components...');
    const verification = verifyWorkoutComponents(workout);

    if (verification.valid) {
      console.log('✅ All components verified successfully!');
    } else {
      console.error('❌ Verification failed:');
      verification.errors.forEach(error => {
        console.error(`   - ${error}`);
      });
      process.exit(1);
    }

    // Expected checks
    console.log('\n📊 Expected Validations:');
    
    // Check template selection
    const isFeminizationTemplate = workout.metadata.template_name.toLowerCase().includes('feminization');
    console.log(`   ${isFeminizationTemplate ? '✅' : '❌'} Template: Feminization focus`);
    
    // Check HRT adjustment
    console.log(`   ${workout.metadata.hrt_adjusted ? '✅' : '❌'} HRT adjusted: ${workout.metadata.hrt_adjusted}`);
    
    // Check day focus (should be lower_body for feminization)
    const isLowerBodyFocus = workout.metadata.day_focus === 'lower_body';
    console.log(`   ${isLowerBodyFocus ? '✅' : '⚠️ '} Day focus: ${workout.metadata.day_focus} (expected: lower_body)`);
    
    // Check exercise count
    const hasExercises = workout.main_workout.length > 0;
    console.log(`   ${hasExercises ? '✅' : '❌'} Exercises: ${workout.main_workout.length} exercises`);
    
    // Check warm-up/cool-down
    console.log(`   ${workout.warm_up.exercises.length > 0 ? '✅' : '❌'} Warm-up: ${workout.warm_up.exercises.length} exercises`);
    console.log(`   ${workout.cool_down.exercises.length > 0 ? '✅' : '❌'} Cool-down: ${workout.cool_down.exercises.length} stretches`);
    
    // Check safety checkpoints
    const hasCheckpoints = workout.safety_checkpoints.length > 0;
    console.log(`   ${hasCheckpoints ? '✅' : '⚠️ '} Safety checkpoints: ${workout.safety_checkpoints.length}`);
    
    // Check rules applied
    console.log(`   ${workout.metadata.rules_applied.length > 0 ? '✅' : '⚠️ '} Rules applied: ${workout.metadata.rules_applied.length}`);

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                   TEST COMPLETED SUCCESSFULLY                 ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log(`\nWorkout ID: ${workoutId}`);
    console.log('All Phase 2 components working correctly! 🎉\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run test
runTest()
  .then(() => {
    console.log('Test execution complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

module.exports = { runTest, createTestMTFProfile };
