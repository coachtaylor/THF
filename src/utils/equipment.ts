// src/utils/equipment.ts
// CORRECTED VERSION: Shows ALL equipment including dumbbells, with exercise counts

import { supabase } from './supabase';

export interface EquipmentOption {
  raw: string; // Raw equipment string from database (e.g., "BODY WEIGHT", "DUMBBELLS")
  value: string; // Canonical value (same as canonical for backwards compatibility)
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
  | 'medicine_ball'
  | 'stability_ball'
  | 'rope'
  | 'roller'
  | 'other';

/**
 * Maps raw equipment strings to canonical categories
 * This determines which equipment gets shown and how they're grouped
 * EXPORTED for use in workout generation
 */
export function mapRawEquipmentToCanonical(raw: string): CanonicalEquipment | null {
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

  // Medicine Ball
  if (normalized.includes('MEDICINE BALL')) {
    return 'medicine_ball';
  }

  // Stability Ball (includes BOSU BALL)
  if (
    normalized.includes('STABILITY BALL') ||
    normalized.includes('BOSU')
  ) {
    return 'stability_ball';
  }

  // Rope
  if (normalized.includes('ROPE')) {
    return 'rope';
  }

  // Roller (includes wheel roller)
  if (
    normalized.includes('ROLLER') ||
    normalized.includes('WHEEL')
  ) {
    return 'roller';
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
    medicine_ball: 'Medicine Ball',
    stability_ball: 'Stability Ball',
    rope: 'Rope',
    roller: 'Foam Roller',
    other: 'Other Equipment',
  };
  return labels[canonical];
}

/**
 * Format equipment value into display label (exported for UI components)
 */
export function formatEquipmentLabel(equipment: string): string {
  const normalized = equipment.toLowerCase().trim();

  // Map to canonical and get label
  const canonical = mapRawEquipmentToCanonical(normalized.toUpperCase());
  if (canonical) {
    return getEquipmentLabel(canonical);
  }

  // Fallback: capitalize first letter of each word
  return equipment
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
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
    medicine_ball: 'Weighted ball for throwing and core work',
    stability_ball: 'Large inflatable ball for balance training',
    rope: 'Jump rope or battle rope',
    roller: 'Foam roller or ab wheel',
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
 * Get a representative raw equipment string for a canonical category
 */
function getRepresentativeRawEquipment(canonical: CanonicalEquipment): string {
  const rawMap: Record<CanonicalEquipment, string> = {
    bodyweight: 'BODY WEIGHT',
    dumbbells: 'DUMBBELLS',
    bands: 'BANDS',
    kettlebell: 'KETTLEBELL',
    barbell: 'BARBELL',
    cable: 'CABLE',
    machine: 'LEVERAGE MACHINE',
    step: 'BENCH',
    medicine_ball: 'MEDICINE BALL',
    stability_ball: 'STABILITY BALL',
    rope: 'ROPE',
    roller: 'ROLLER',
    other: 'WALL',
  };
  return rawMap[canonical];
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
    // Also track the most common raw equipment string for each canonical category
    const canonicalCounts = new Map<CanonicalEquipment, number>();
    const canonicalToRaw = new Map<CanonicalEquipment, Map<string, number>>();

    rawEquipmentCounts.forEach((count, rawEquipment) => {
      const canonical = mapRawEquipmentToCanonical(rawEquipment);

      if (canonical) {
        // Update total count
        const current = canonicalCounts.get(canonical) || 0;
        canonicalCounts.set(canonical, current + count);

        // Track raw equipment variants for this canonical
        if (!canonicalToRaw.has(canonical)) {
          canonicalToRaw.set(canonical, new Map());
        }
        const rawMap = canonicalToRaw.get(canonical)!;
        rawMap.set(rawEquipment, count);
      }
    });

    console.log('📈 Canonical equipment counts:', Object.fromEntries(canonicalCounts));

    // Convert to options array
    const options: EquipmentOption[] = Array.from(canonicalCounts.entries())
      .map(([canonical, count]) => {
        // Find the most common raw equipment string for this canonical category
        const rawVariants = canonicalToRaw.get(canonical);
        let mostCommonRaw = getRepresentativeRawEquipment(canonical);

        if (rawVariants && rawVariants.size > 0) {
          // Get the raw equipment with the highest count
          const sorted = Array.from(rawVariants.entries()).sort((a, b) => b[1] - a[1]);
          mostCommonRaw = sorted[0][0];
        }

        return {
          raw: mostCommonRaw,
          value: canonical,
          label: getEquipmentLabel(canonical),
          description: getEquipmentDescription(canonical),
          canonical,
          count, // Include count for display
        };
      })
      .sort((a, b) => {
        // Sort by priority (common → specialized → other)
        const priority: CanonicalEquipment[] = [
          'bodyweight',
          'dumbbells',
          'bands',
          'kettlebell',
          'barbell',
          'cable',
          'machine',
          'step',
          'medicine_ball',
          'stability_ball',
          'rope',
          'roller',
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
      raw: 'BODY WEIGHT',
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

/**
 * Map an array of raw equipment strings to canonical categories
 */
export function mapRawEquipmentArrayToCanonical(rawEquipment: string[]): CanonicalEquipment[] {
  const canonical = rawEquipment
    .map(raw => mapRawEquipmentToCanonical(raw))
    .filter((c): c is CanonicalEquipment => c !== null);

  // Deduplicate
  return Array.from(new Set(canonical));
}