#!/usr/bin/env node

/**
 * Debug script for exercise filtering logic
 * 
 * This script:
 * - Loads all exercises from Supabase public.exercises
 * - Applies the same filtering logic used in the app (filterExercisesByConstraints)
 * - Tests with different fake profiles to verify safety logic
 * 
 * Run: npx tsx scripts/debug_constraints_filter.ts
 * (or: node --loader tsx scripts/debug_constraints_filter.ts)
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { filterExercisesByConstraints } from '../src/services/data/exerciseFilters';
import { Exercise } from '../src/types/plan';
import { Profile } from '../src/services/storage/profile';

// Initialize Supabase client (for Node.js script, not Expo)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type for exercise data from Supabase public.exercises table
interface DatabaseExercise {
  id: number;
  slug: string;
  name: string;
  pattern: string | null;
  goal: string | null;
  difficulty: string | null;
  equipment: string[];
  binder_aware: boolean;
  pelvic_floor_safe: boolean;
  target_muscles: string | null;
  secondary_muscles: string | null;
  media_thumb?: string | null; // Optional - column may not exist in database
}

// Exercises that are NOT safe for heavy binding (from BRD)
const HEAVY_BINDING_UNSAFE_PATTERNS = ['jumping_jack', 'high_knees', 'mountain_climber', 'burpee', 'squat_thrust'];

// Map database exercise to Exercise interface (same logic as src/data/exercises.ts)
function mapDatabaseExerciseToExercise(db: DatabaseExercise): Exercise {
  // Build tags array from pattern and goal
  const tags: string[] = [];
  
  // Add pattern (e.g., "mobility", "core")
  if (db.pattern) {
    tags.push(db.pattern);
    // Map pattern to common tag names
    if (db.pattern === 'mobility') {
      tags.push('lower_body'); // Mobility exercises often target lower body
    }
    if (db.pattern === 'core') {
      tags.push('core');
    }
  }
  
  // Add goal (e.g., "mobility", "conditioning")
  if (db.goal) {
    if (db.goal === 'conditioning') {
      tags.push('strength'); // Conditioning maps to strength
      tags.push('cardio'); // Also can be cardio
    }
    if (db.goal === 'mobility') {
      tags.push('flexibility'); // Mobility maps to flexibility
    }
    if (db.goal !== db.pattern) {
      tags.push(db.goal);
    }
  }
  
  if (db.difficulty) tags.push(db.difficulty);
  
  // Add equipment to tags for filtering
  db.equipment.forEach(eq => {
    if (eq && eq !== 'none') tags.push(eq);
  });

  // Determine heavy_binding_safe based on slug/pattern
  const isHeavyBindingUnsafe = HEAVY_BINDING_UNSAFE_PATTERNS.some(
    unsafe => db.slug.includes(unsafe) || db.pattern?.includes(unsafe)
  );
  const heavy_binding_safe = !isHeavyBindingUnsafe && db.binder_aware;

  // Determine pressure_level based on pattern
  let pressure_level: 'low' | 'medium' | 'high' = 'low';
  if (db.pattern === 'mobility' || db.goal === 'mobility') {
    pressure_level = 'low';
  } else {
    pressure_level = 'medium';
  }

  // Create trans_notes from available data
  const trans_notes = {
    binder: db.binder_aware 
      ? 'Safe for binding - minimal chest compression during movement'
      : 'Use caution with binding - may cause chest compression',
    pelvic_floor: db.pelvic_floor_safe
      ? 'Engage core gently, avoid bearing down'
      : 'Use caution with pelvic floor engagement'
  };

  return {
    id: db.slug, // Use slug as id for consistency
    slug: db.slug,
    name: db.name,
    pattern: db.pattern || '',
    goal: db.goal || '',
    equipment: db.equipment,
    difficulty: (db.difficulty as Exercise['difficulty']) || 'beginner',
    tags,
    binder_aware: db.binder_aware,
    heavy_binding_safe: heavy_binding_safe,
    pelvic_floor_aware: db.pelvic_floor_safe,
    pelvic_floor_safe: db.pelvic_floor_safe,
    contraindications: [],
    pressure_level,
    neutral_cues: [], // TODO: Add cues column to database
    breathing_cues: [], // TODO: Add breathing column to database
    swaps: [], // TODO: Add swaps column to database
    trans_notes,
    created_at: new Date(),
    version: '1.0',
    flags_reviewed: false,
    commonErrors: [],
    target_muscles: db.target_muscles || undefined,
    secondary_muscles: db.secondary_muscles || undefined,
  };
}

/**
 * Load all exercises from Supabase public.exercises table
 */
async function loadAllExercises(): Promise<Exercise[]> {
  console.log('📥 Loading exercises from Supabase...');
  
  const { data, error } = await supabase
    .from('exercises')
    .select(`
      id,
      slug,
      name,
      pattern,
      goal,
      difficulty,
      equipment,
        binder_aware,
        pelvic_floor_safe,
        target_muscles,
        secondary_muscles
    `);

  if (error) {
    console.error('❌ Error loading exercises:', error);
    return [];
  }

  if (!data || data.length === 0) {
    console.warn('⚠️ No exercises found in database');
    return [];
  }

  console.log(`✅ Loaded ${data.length} exercises from database`);
  
  // Map database exercises to Exercise interface
  return data.map(mapDatabaseExerciseToExercise);
}

/**
 * Test profile: Baseline (no constraints)
 */
function createBaselineProfile(): Profile {
  return {
    // NEW REQUIRED FIELDS
    id: 'baseline-test',
    user_id: 'user-123',
    gender_identity: 'ftm',
    on_hrt: true,
    hrt_type: 'testosterone',
    binds_chest: false,
    surgeries: [],
    primary_goal: 'masculinization',
    fitness_experience: 'intermediate',
    workout_frequency: 4,
    session_duration: 60,
    equipment: ['dumbbells', 'barbell'],
    
    // KEEP OLD FIELDS (for compatibility)
    fitness_level: 'intermediate',
    goals: [],
    goal_weighting: { primary: 80, secondary: 20 },
    constraints: [],
    surgery_flags: [],
    
    // METADATA
    created_at: new Date(),
    updated_at: new Date(),
  };
}

/**
 * Test profile: Binder + heavy binding
 */
function createBinderHeavyBindingProfile(): Profile {
  return {
    // NEW REQUIRED FIELDS
    id: 'binder-heavy-binding-test',
    user_id: 'user-456',
    gender_identity: 'ftm',
    on_hrt: true,
    hrt_type: 'testosterone',
    binds_chest: true,
    surgeries: [],
    primary_goal: 'masculinization',
    fitness_experience: 'intermediate',
    workout_frequency: 4,
    session_duration: 60,
    equipment: ['dumbbells', 'barbell'],
    
    // KEEP OLD FIELDS (for compatibility)
    fitness_level: 'intermediate',
    goals: [],
    goal_weighting: { primary: 80, secondary: 20 },
    constraints: ['binder_aware', 'heavy_binding'],
    surgery_flags: [],
    
    // METADATA
    created_at: new Date(),
    updated_at: new Date(),
  };
}

/**
 * Test profile: Post-op bottom surgery + no jumping + no floor
 */
function createPostOpNoJumpingNoFloorProfile(): Profile {
  return {
    // NEW REQUIRED FIELDS
    id: 'post-op-no-jump-no-floor-test',
    user_id: 'user-789',
    gender_identity: 'ftm',
    on_hrt: true,
    hrt_type: 'testosterone',
    binds_chest: false,
    surgeries: [
      {
        type: 'bottom_surgery',
        date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        weeks_post_op: 12,
      },
    ],
    primary_goal: 'masculinization',
    fitness_experience: 'intermediate',
    workout_frequency: 4,
    session_duration: 60,
    equipment: ['dumbbells', 'barbell'],
    
    // KEEP OLD FIELDS (for compatibility)
    fitness_level: 'intermediate',
    goals: [],
    goal_weighting: { primary: 80, secondary: 20 },
    constraints: ['post_op', 'no_jumping', 'no_floor'],
    surgery_flags: ['bottom_surgery'],
    
    // METADATA
    created_at: new Date(),
    updated_at: new Date(),
  };
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Exercise Filtering Debug Script\n');
  console.log('='.repeat(60));
  
  // Load all exercises
  const allExercises = await loadAllExercises();
  
  if (allExercises.length === 0) {
    console.error('❌ No exercises loaded. Exiting.');
    process.exit(1);
  }
  
  console.log(`\n📊 Total exercises in database: ${allExercises.length}\n`);
  console.log('='.repeat(60));
  
  // Test 1: Baseline profile
  console.log('\n🧪 Test 1: Baseline Profile (no constraints)');
  console.log('-'.repeat(60));
  const baselineProfile = createBaselineProfile();
  const baselineFiltered = filterExercisesByConstraints(allExercises, baselineProfile);
  console.log(`✅ Exercises surviving filter: ${baselineFiltered.length} / ${allExercises.length}`);
  console.log(`   Percentage: ${((baselineFiltered.length / allExercises.length) * 100).toFixed(1)}%`);
  
  // Test 2: Binder + heavy binding
  console.log('\n🧪 Test 2: Binder + Heavy Binding Profile');
  console.log('-'.repeat(60));
  console.log('   Constraints: binder_aware, heavy_binding');
  const binderProfile = createBinderHeavyBindingProfile();
  const binderFiltered = filterExercisesByConstraints(allExercises, binderProfile);
  console.log(`✅ Exercises surviving filter: ${binderFiltered.length} / ${allExercises.length}`);
  console.log(`   Percentage: ${((binderFiltered.length / allExercises.length) * 100).toFixed(1)}%`);
  
  // Show some sample exercises
  if (binderFiltered.length > 0) {
    console.log(`\n   Sample exercises (first 5):`);
    binderFiltered.slice(0, 5).forEach((ex, idx) => {
      console.log(`   ${idx + 1}. ${ex.name} (${ex.id})`);
      console.log(`      - binder_aware: ${ex.binder_aware}, heavy_binding_safe: ${ex.heavy_binding_safe}`);
    });
  } else {
    console.log('   ⚠️  No exercises passed the filter!');
  }
  
  // Test 3: Post-op bottom surgery + no jumping + no floor
  console.log('\n🧪 Test 3: Post-op Bottom Surgery + No Jumping + No Floor');
  console.log('-'.repeat(60));
  console.log('   Constraints: post_op, no_jumping, no_floor');
  console.log('   Surgery flags: bottom_surgery');
  const postOpProfile = createPostOpNoJumpingNoFloorProfile();
  const postOpFiltered = filterExercisesByConstraints(allExercises, postOpProfile);
  console.log(`✅ Exercises surviving filter: ${postOpFiltered.length} / ${allExercises.length}`);
  console.log(`   Percentage: ${((postOpFiltered.length / allExercises.length) * 100).toFixed(1)}%`);
  
  // Show some sample exercises
  if (postOpFiltered.length > 0) {
    console.log(`\n   Sample exercises (first 5):`);
    postOpFiltered.slice(0, 5).forEach((ex, idx) => {
      console.log(`   ${idx + 1}. ${ex.name} (${ex.id})`);
      console.log(`      - pelvic_floor_aware: ${ex.pelvic_floor_aware}`);
      console.log(`      - tags: ${ex.tags?.join(', ') || 'none'}`);
    });
  } else {
    console.log('   ⚠️  No exercises passed the filter!');
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Summary:');
  console.log(`   Baseline:              ${baselineFiltered.length.toString().padStart(4)} exercises`);
  console.log(`   Binder + Heavy Binding: ${binderFiltered.length.toString().padStart(4)} exercises`);
  console.log(`   Post-op + No Jump/Floor: ${postOpFiltered.length.toString().padStart(4)} exercises`);
  console.log('\n✅ Debug script completed!\n');
}

// Run the script
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

