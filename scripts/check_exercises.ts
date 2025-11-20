/**
 * Quick script to check if exercises exist in Supabase
 * Run with: npx tsx scripts/check_exercises.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ SUPABASE_URL or SUPABASE_ANON_KEY not set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkExercises() {
  console.log('🔍 Checking exercises in Supabase...');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...`);
  
  try {
    // Count total exercises
    const { count, error: countError } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting exercises:', countError);
      return;
    }
    
    console.log(`\n📊 Total exercises in database: ${count || 0}`);
    
    if (count === 0) {
      console.warn('\n⚠️  The exercises table is EMPTY!');
      console.warn('   You need to seed exercises into the database.');
      console.warn('   Check scripts/exercisedb_seed.py or scripts/wger_seed.py');
      return;
    }
    
    // Get a sample of exercises
    const { data, error } = await supabase
      .from('exercises')
      .select('id, slug, name, equipment, raw_equipment, binder_aware, difficulty')
      .limit(5);
    
    if (error) {
      console.error('❌ Error fetching sample exercises:', error);
      return;
    }
    
    console.log(`\n📋 Sample exercises (first 5):`);
    data?.forEach((ex, i) => {
      console.log(`\n   ${i + 1}. ${ex.name} (slug: ${ex.slug})`);
      console.log(`      - Equipment: ${JSON.stringify(ex.equipment)}`);
      console.log(`      - Raw Equipment: ${JSON.stringify(ex.raw_equipment)}`);
      console.log(`      - Binder Aware: ${ex.binder_aware}`);
      console.log(`      - Difficulty: ${ex.difficulty || 'not set'}`);
    });
    
    // Check for exercises with raw_equipment
    const { count: rawCount } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true })
      .not('raw_equipment', 'is', null);
    
    console.log(`\n📦 Exercises with raw_equipment: ${rawCount || 0}`);
    
    // Check for binder_aware exercises
    const { count: binderCount } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true })
      .eq('binder_aware', true);
    
    console.log(`📦 Binder-aware exercises: ${binderCount || 0}`);
    
  } catch (error) {
    console.error('❌ Failed to check exercises:', error);
  }
}

checkExercises();

