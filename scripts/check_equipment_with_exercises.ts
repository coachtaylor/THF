/**
 * Script to check which equipment types have exercises in the database
 * Run with: npx tsx scripts/check_equipment_with_exercises.ts
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

async function checkEquipment() {
  console.log('🔍 Checking equipment types with exercises...\n');
  
  try {
    // Get all exercises with their equipment
    const { data: exercises, error } = await supabase
      .from('exercises')
      .select('raw_equipment, equipment');

    if (error) {
      console.error('❌ Error fetching exercises:', error);
      return;
    }

    if (!exercises || exercises.length === 0) {
      console.warn('⚠️ No exercises found in database');
      return;
    }

    console.log(`📊 Total exercises: ${exercises.length}\n`);

    // Track equipment counts
    const rawEquipmentCounts = new Map<string, number>();
    const canonicalEquipmentCounts = new Map<string, number>();

    exercises.forEach((ex: any) => {
      // Count raw_equipment
      if (ex.raw_equipment) {
        if (Array.isArray(ex.raw_equipment)) {
          ex.raw_equipment.forEach((eq: string) => {
            if (eq && eq.trim()) {
              const normalized = eq.trim().toUpperCase();
              rawEquipmentCounts.set(normalized, (rawEquipmentCounts.get(normalized) || 0) + 1);
            }
          });
        } else if (typeof ex.raw_equipment === 'string') {
          const eqs = ex.raw_equipment.split(',').map((e: string) => e.trim()).filter(Boolean);
          eqs.forEach((eq: string) => {
            const normalized = eq.toUpperCase();
            rawEquipmentCounts.set(normalized, (rawEquipmentCounts.get(normalized) || 0) + 1);
          });
        }
      }

      // Count canonical equipment
      if (ex.equipment && Array.isArray(ex.equipment)) {
        ex.equipment.forEach((eq: string) => {
          if (eq && eq.trim() && eq !== 'none') {
            canonicalEquipmentCounts.set(eq, (canonicalEquipmentCounts.get(eq) || 0) + 1);
          }
        });
      }
    });

    // Display results
    console.log('📦 Raw Equipment (from raw_equipment field):');
    if (rawEquipmentCounts.size === 0) {
      console.log('   (none found)');
    } else {
      const sortedRaw = Array.from(rawEquipmentCounts.entries())
        .sort((a, b) => b[1] - a[1]);
      sortedRaw.forEach(([eq, count]) => {
        console.log(`   ${eq}: ${count} exercises`);
      });
    }

    console.log('\n📦 Canonical Equipment (from equipment field):');
    if (canonicalEquipmentCounts.size === 0) {
      console.log('   (none found)');
    } else {
      const sortedCanonical = Array.from(canonicalEquipmentCounts.entries())
        .sort((a, b) => b[1] - a[1]);
      sortedCanonical.forEach(([eq, count]) => {
        console.log(`   ${eq}: ${count} exercises`);
      });
    }

    console.log(`\n✅ Equipment types that will be shown to users: ${rawEquipmentCounts.size}`);
    console.log(`   Raw equipment: ${Array.from(rawEquipmentCounts.keys()).sort().join(', ')}`);

  } catch (error) {
    console.error('❌ Failed to check equipment:', error);
  }
}

checkEquipment();


