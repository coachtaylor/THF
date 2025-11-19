/**
 * Equipment utilities for fetching and mapping equipment from Supabase
 */

import { supabase } from './supabase';

/**
 * Canonical equipment categories used by the plan generator
 */
export type CanonicalEquipment = 'bodyweight' | 'dumbbells' | 'bands' | 'kettlebell';

/**
 * Map raw equipment string to canonical equipment category
 * 
 * @param rawEquipment - Raw equipment label from database (e.g. "BODY WEIGHT", "DUMBBELL", "CABLE MACHINE")
 * @returns Canonical equipment category or null if no mapping exists
 */
export function mapRawEquipmentToCanonical(rawEquipment: string): CanonicalEquipment | null {
  const normalized = rawEquipment.toLowerCase().trim();
  
  // Bodyweight variations
  if (
    normalized === 'body weight' ||
    normalized === 'bodyweight' ||
    normalized === 'none' ||
    normalized === 'no equipment' ||
    normalized === ''
  ) {
    return 'bodyweight';
  }
  
  // Dumbbell variations
  if (
    normalized.includes('dumbbell') ||
    normalized === 'db' ||
    normalized.includes('free weight')
  ) {
    return 'dumbbells';
  }
  
  // Resistance band variations
  if (
    normalized.includes('band') ||
    normalized.includes('resistance band') ||
    normalized === 'resistance'
  ) {
    return 'bands';
  }
  
  // Kettlebell variations
  if (
    normalized.includes('kettlebell') ||
    normalized === 'kb'
  ) {
    return 'kettlebell';
  }
  
  // No mapping found - return null
  return null;
}

/**
 * Map multiple raw equipment strings to canonical categories
 * 
 * @param rawEquipmentArray - Array of raw equipment labels
 * @returns Array of unique canonical equipment categories
 */
export function mapRawEquipmentArrayToCanonical(rawEquipmentArray: string[]): CanonicalEquipment[] {
  const canonicalSet = new Set<CanonicalEquipment>();
  
  for (const raw of rawEquipmentArray) {
    const canonical = mapRawEquipmentToCanonical(raw);
    if (canonical) {
      canonicalSet.add(canonical);
    }
  }
  
  return Array.from(canonicalSet);
}

/**
 * Equipment option for UI display
 */
export interface EquipmentOption {
  raw: string; // Raw equipment label from database
  canonical: CanonicalEquipment | null; // Mapped canonical category (null if no mapping)
  label: string; // Display label (formatted from raw)
  description?: string; // Optional description
}

/**
 * Fetch all distinct raw equipment values from Supabase
 * 
 * Tries multiple sources:
 * 1. exercise_staging_tagged table (if exists) - raw_equipment field
 * 2. staging_exercisedb table - equipment field (array)
 * 3. staging_wger table - equipment field (array)
 * 4. exercises table - equipment field (array)
 * 
 * @returns Array of unique raw equipment strings
 */
export async function fetchRawEquipmentFromSupabase(): Promise<string[]> {
  if (!supabase) {
    console.warn('⚠️ Supabase not configured - returning default equipment');
    return ['BODY WEIGHT', 'DUMBBELL', 'RESISTANCE BAND', 'KETTLEBELL'];
  }

  const rawEquipmentSet = new Set<string>();

  try {
    // Try exercise_staging_tagged first (if it exists)
    try {
      const { data: taggedData, error: taggedError } = await supabase
        .from('exercise_staging_tagged')
        .select('raw_equipment')
        .not('raw_equipment', 'is', null);

      if (!taggedError && taggedData) {
        taggedData.forEach((row: any) => {
          if (row.raw_equipment) {
            rawEquipmentSet.add(String(row.raw_equipment).trim().toUpperCase());
          }
        });
      }
    } catch (e) {
      // Table might not exist, continue to other sources
      console.log('ℹ️ exercise_staging_tagged table not found, trying other sources');
    }

    // Try staging_exercisedb
    try {
      const { data: exercisedbData, error: exercisedbError } = await supabase
        .from('staging_exercisedb')
        .select('equipment');

      if (!exercisedbError && exercisedbData) {
        exercisedbData.forEach((row: any) => {
          if (row.equipment && Array.isArray(row.equipment)) {
            row.equipment.forEach((eq: string) => {
              if (eq) {
                rawEquipmentSet.add(String(eq).trim().toUpperCase());
              }
            });
          }
        });
      }
    } catch (e) {
      console.log('ℹ️ staging_exercisedb table not found, trying other sources');
    }

    // Try staging_wger
    try {
      const { data: wgerData, error: wgerError } = await supabase
        .from('staging_wger')
        .select('equipment');

      if (!wgerError && wgerData) {
        wgerData.forEach((row: any) => {
          if (row.equipment && Array.isArray(row.equipment)) {
            row.equipment.forEach((eq: string) => {
              if (eq) {
                rawEquipmentSet.add(String(eq).trim().toUpperCase());
              }
            });
          }
        });
      }
    } catch (e) {
      console.log('ℹ️ staging_wger table not found, trying other sources');
    }

    // Try exercises table as fallback
    try {
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('equipment');

      if (!exercisesError && exercisesData) {
        exercisesData.forEach((row: any) => {
          if (row.equipment && Array.isArray(row.equipment)) {
            row.equipment.forEach((eq: string) => {
              if (eq) {
                rawEquipmentSet.add(String(eq).trim().toUpperCase());
              }
            });
          }
        });
      }
    } catch (e) {
      console.log('ℹ️ Could not fetch from exercises table');
    }

    // If we got any equipment, return it sorted
    if (rawEquipmentSet.size > 0) {
      return Array.from(rawEquipmentSet).sort();
    }

    // Fallback to default equipment if nothing found
    console.warn('⚠️ No equipment found in database, using defaults');
    return ['BODY WEIGHT', 'DUMBBELL', 'RESISTANCE BAND', 'KETTLEBELL'];
  } catch (error) {
    console.error('❌ Error fetching raw equipment:', error);
    // Return default equipment on error
    return ['BODY WEIGHT', 'DUMBBELL', 'RESISTANCE BAND', 'KETTLEBELL'];
  }
}

/**
 * Get formatted equipment options for UI display
 * 
 * @returns Array of equipment options with raw, canonical, and display labels
 */
export async function getEquipmentOptions(): Promise<EquipmentOption[]> {
  const rawEquipment = await fetchRawEquipmentFromSupabase();
  
  return rawEquipment.map((raw) => {
    const canonical = mapRawEquipmentToCanonical(raw);
    const label = formatEquipmentLabel(raw);
    const description = getEquipmentDescription(canonical);
    
    return {
      raw,
      canonical,
      label,
      description,
    };
  });
}

/**
 * Format raw equipment label for display
 * 
 * Converts raw equipment strings like "BODY WEIGHT" or "LEVERAGE MACHINE" 
 * to formatted labels like "Body Weight" or "Leverage Machine".
 * 
 * @param raw - Raw equipment label (e.g. "BODY WEIGHT")
 * @returns Formatted label (e.g. "Body Weight")
 */
export function formatEquipmentLabel(raw: string): string {
  return raw
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get description for canonical equipment category
 * 
 * @param canonical - Canonical equipment category
 * @returns Description string
 */
function getEquipmentDescription(canonical: CanonicalEquipment | null): string | undefined {
  switch (canonical) {
    case 'bodyweight':
      return 'No equipment needed';
    case 'dumbbells':
      return 'Free weights';
    case 'bands':
      return 'Elastic bands';
    case 'kettlebell':
      return 'Kettlebell exercises';
    default:
      return undefined;
  }
}

