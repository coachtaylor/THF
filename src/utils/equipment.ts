// src/utils/equipment.ts
// CORRECTED VERSION: Shows ALL equipment including dumbbells, with exercise counts

import { supabase } from './supabase';

export interface EquipmentOption {
  value: string;
  label: string;
  description: string;
  canonical: string;
  count?: number; // Added: exercise count
}

// Canonical equipment categories
export type CanonicalEquipment =
  | 'bodyweight'
  | 'dumbbells'
  | 'bands'
  | 'kettlebell'
  | 'barbell'
  | 'cable'
  | 'machine'
  | 'step'
  | 'other';

/**
 * Maps raw equipment strings to canonical categories
 * This determines which equipment gets shown and how they're grouped
 */
function mapRawEquipmentToCanonical(raw: string): CanonicalEquipment | null {
  const normalized = raw.toUpperCase().trim();

  // Bodyweight
  if (
    normalized.includes('BODY') ||
    normalized.includes('BODYWEIGHT') ||
    normalized === 'NONE'
  ) {
    return 'bodyweight';
  }

  // Dumbbells - FIXED: No longer filtered out!
  if (
    normalized.includes('DUMBBELL') ||
    normalized.includes('DUMBELL') ||
    normalized.includes('DB')
  ) {
    return 'dumbbells';
  }

  // Resistance Bands
  if (
    normalized.includes('BAND') ||
    normalized.includes('RESISTANCE BAND')
  ) {
    return 'bands';
  }

  // Kettlebell
  if (
    normalized.includes('KETTLEBELL') ||
    normalized.includes('KB')
  ) {
    return 'kettlebell';
  }

  // Barbell
  if (
    normalized.includes('BARBELL') ||
    normalized.includes('BB') ||
    normalized.includes('EZ BAR') ||
    normalized.includes('TRAP BAR')
  ) {
    return 'barbell';
  }

  // Cable Machine
  if (
    normalized.includes('CABLE') ||
    normalized.includes('PULLEY')
  ) {
    return 'cable';
  }

  // Machines
  if (
    normalized.includes('MACHINE') ||
    normalized.includes('LEVER') ||
    normalized.includes('SMITH') ||
    normalized.includes('SLED')
  ) {
    return 'machine';
  }

  // Step/Box
  if (
    normalized.includes('STEP') ||
    normalized.includes('BOX') ||
    normalized.includes('BENCH')
  ) {
    return 'step';
  }

  // Other equipment (wall, chair, etc.)
  if (
    normalized.includes('WALL') ||
    normalized.includes('CHAIR') ||
    normalized.includes('MAT') ||
    normalized.includes('FOAM') ||
    normalized.includes('YOGA')
  ) {
    return 'other';
  }

  return null; // Unknown equipment
}

/**
 * Get friendly labels for canonical equipment
 */
function getEquipmentLabel(canonical: CanonicalEquipment): string {
  const labels: Record<CanonicalEquipment, string> = {
    bodyweight: 'Bodyweight',
    dumbbells: 'Dumbbells',
    bands: 'Resistance Bands',
    kettlebell: 'Kettlebell',
    barbell: 'Barbell',
    cable: 'Cable Machine',
    machine: 'Weight Machines',
    step: 'Step / Box',
    other: 'Other Equipment',
  };
  return labels[canonical];
}

/**
 * Get descriptions for equipment
 */
function getEquipmentDescription(canonical: CanonicalEquipment): string {
  const descriptions: Record<CanonicalEquipment, string> = {
    bodyweight: 'No equipment needed',
    dumbbells: 'Free weights you hold in each hand',
    bands: 'Elastic resistance bands',
    kettlebell: 'Cast iron weight with handle',
    barbell: 'Long bar with weights',
    cable: 'Cable machine or pulley system',
    machine: 'Weight machines at gym',
    step: 'Step platform or box',
    other: 'Miscellaneous equipment',
  };
  return descriptions[canonical];
}

/**
 * Fetch raw equipment from Supabase and count exercises
 */
async function fetchRawEquipmentFromSupabase(): Promise<Map<string, number>> {
  try {
    console.log('🔍 Fetching equipment from Supabase...');

    const { data: exercises, error } = await supabase
      .from('exercises')
      .select('raw_equipment, equipment');

    if (error) {
      console.error('❌ Supabase error:', error);
      return new Map([['BODY WEIGHT', 1]]);
    }

    if (!exercises || exercises.length === 0) {
      console.warn('⚠️ No exercises found in database');
      return new Map([['BODY WEIGHT', 1]]);
    }

    console.log(`✅ Fetched ${exercises.length} exercises`);

    // Count equipment occurrences
    const equipmentCounts = new Map<string, number>();

    exercises.forEach((exercise) => {
      let equipmentList: string[] = [];

      // Try raw_equipment first (preferred)
      if (exercise.raw_equipment) {
        if (Array.isArray(exercise.raw_equipment)) {
          equipmentList = exercise.raw_equipment;
        } else if (typeof exercise.raw_equipment === 'string') {
          // Handle comma-separated or JSON string
          try {
            equipmentList = JSON.parse(exercise.raw_equipment);
          } catch {
            equipmentList = exercise.raw_equipment.split(',').map(s => s.trim());
          }
        }
      }

      // Fallback to equipment field
      if (equipmentList.length === 0 && exercise.equipment) {
        if (Array.isArray(exercise.equipment)) {
          equipmentList = exercise.equipment;
        } else if (typeof exercise.equipment === 'string') {
          try {
            equipmentList = JSON.parse(exercise.equipment);
          } catch {
            equipmentList = [exercise.equipment];
          }
        }
      }

      // Count each equipment type
      equipmentList.forEach(eq => {
        const normalized = eq.toUpperCase().trim();
        if (normalized) {
          const current = equipmentCounts.get(normalized) || 0;
          equipmentCounts.set(normalized, current + 1);
        }
      });
    });

    console.log('📊 Equipment counts:', Object.fromEntries(equipmentCounts));

    return equipmentCounts;
  } catch (error) {
    console.error('❌ Error fetching equipment:', error);
    return new Map([['BODY WEIGHT', 1]]);
  }
}

/**
 * Get equipment options for display in UI
 * FIXED: No longer filters out dumbbells!
 */
export async function getEquipmentOptions(): Promise<EquipmentOption[]> {
  try {
    // Fetch raw equipment with counts
    const rawEquipmentCounts = await fetchRawEquipmentFromSupabase();

    // Group by canonical equipment and sum counts
    const canonicalCounts = new Map<CanonicalEquipment, number>();

    rawEquipmentCounts.forEach((count, rawEquipment) => {
      const canonical = mapRawEquipmentToCanonical(rawEquipment);
      
      if (canonical) {
        const current = canonicalCounts.get(canonical) || 0;
        canonicalCounts.set(canonical, current + count);
      }
    });

    console.log('📈 Canonical equipment counts:', Object.fromEntries(canonicalCounts));

    // Convert to options array
    const options: EquipmentOption[] = Array.from(canonicalCounts.entries())
      .map(([canonical, count]) => ({
        value: canonical,
        label: getEquipmentLabel(canonical),
        description: getEquipmentDescription(canonical),
        canonical,
        count, // Include count for display
      }))
      .sort((a, b) => {
        // Sort by priority
        const priority: CanonicalEquipment[] = [
          'bodyweight',
          'dumbbells',
          'bands',
          'kettlebell',
          'barbell',
          'cable',
          'machine',
          'step',
          'other',
        ];
        return priority.indexOf(a.canonical as CanonicalEquipment) - 
               priority.indexOf(b.canonical as CanonicalEquipment);
      });

    console.log('✅ Final equipment options:', options);
    return options;

  } catch (error) {
    console.error('❌ Error in getEquipmentOptions:', error);
    
    // Fallback: return bodyweight only
    return [{
      value: 'bodyweight',
      label: 'Bodyweight',
      description: 'No equipment needed',
      canonical: 'bodyweight',
      count: 0,
    }];
  }
}

/**
 * Check if equipment has exercises available
 */
export async function hasExercisesForEquipment(equipment: string): Promise<boolean> {
  const options = await getEquipmentOptions();
  const option = options.find(opt => opt.value === equipment);
  return (option?.count ?? 0) > 0;
}

/**
 * Get exercise count for specific equipment
 */
export async function getExerciseCountForEquipment(equipment: string): Promise<number> {
  const options = await getEquipmentOptions();
  const option = options.find(opt => opt.value === equipment);
  return option?.count ?? 0;
}