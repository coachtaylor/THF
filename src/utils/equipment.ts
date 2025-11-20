/**
 * Equipment utilities for fetching and mapping equipment from Supabase
 */

import { supabase } from './supabase';

/**
 * Canonical equipment categories used by the plan generator
 */
export type CanonicalEquipment = 'bodyweight' | 'dumbbells' | 'bands' | 'kettlebell' | 'barbell' | 'machine' | 'cable' | 'other';

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
  
  // Barbell variations
  if (
    normalized.includes('barbell') ||
    normalized === 'bb' ||
    normalized.includes('smith') ||
    normalized.includes('trap bar') ||
    normalized.includes('ez bar')
  ) {
    return 'barbell';
  }
  
  // Cable machine variations
  if (normalized.includes('cable')) {
    return 'cable';
  }
  
  // Machine variations
  if (
    normalized.includes('machine') ||
    normalized.includes('lever') ||
    normalized.includes('leverage')
  ) {
    return 'machine';
  }
  
  // For truly unmapped equipment, return null (will be filtered out)
  // This prevents 'other' from matching exercises that don't have 'other' in their equipment array
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
  description: string; // Description for all equipment types
}

/**
 * Fetch all distinct raw equipment values from Supabase that have exercises in the database
 * 
 * Only returns equipment that exists in the public.exercises table with actual exercises.
 * This ensures users only see equipment options that have workouts available.
 * 
 * @returns Array of unique raw equipment strings that have exercises
 */
export async function fetchRawEquipmentFromSupabase(): Promise<string[]> {
  if (!supabase) {
    console.warn('⚠️ Supabase not configured - returning default equipment');
    return ['BODY WEIGHT'];
  }

  const rawEquipmentSet = new Set<string>();

  try {
    // Primary source: exercises table - only get equipment that has exercises
    // Check both raw_equipment (array) and equipment (canonical array) fields
    const { data: exercisesData, error: exercisesError } = await supabase
      .from('exercises')
      .select('raw_equipment, equipment');

    if (exercisesError) {
      console.error('❌ Error fetching exercises for equipment:', exercisesError);
      // Fallback to default equipment on error
      return ['BODY WEIGHT'];
    }

    if (exercisesData && exercisesData.length > 0) {
      exercisesData.forEach((row: any) => {
        // Add raw_equipment values (array or single value)
        if (row.raw_equipment) {
          if (Array.isArray(row.raw_equipment)) {
            row.raw_equipment.forEach((eq: string) => {
              if (eq && eq.trim()) {
                rawEquipmentSet.add(String(eq).trim().toUpperCase());
              }
            });
          } else if (typeof row.raw_equipment === 'string') {
            // Handle comma-separated string
            const eqs = row.raw_equipment.split(',').map((e: string) => e.trim()).filter(Boolean);
            eqs.forEach((eq: string) => {
              rawEquipmentSet.add(eq.toUpperCase());
            });
          }
        }
        
        // Also check canonical equipment field as fallback for exercises without raw_equipment
        // Map canonical back to common raw equipment labels
        if (row.equipment && Array.isArray(row.equipment)) {
          row.equipment.forEach((eq: string) => {
            if (eq && eq.trim() && eq !== 'none') {
              // Map canonical to raw if no raw_equipment exists
              const normalized = eq.toLowerCase().trim();
              if (normalized === 'bodyweight' || normalized === 'body weight') {
                rawEquipmentSet.add('BODY WEIGHT');
              } else if (normalized.includes('dumbbell')) {
                rawEquipmentSet.add('DUMBBELL');
              } else if (normalized.includes('band') || normalized.includes('resistance')) {
                rawEquipmentSet.add('RESISTANCE BAND');
              } else if (normalized.includes('kettlebell')) {
                rawEquipmentSet.add('KETTLEBELL');
              } else {
                // Use canonical as-is, capitalized
                rawEquipmentSet.add(eq.trim().toUpperCase());
              }
            }
          });
        }
      });
    }

    // If we got any equipment, return it sorted
    if (rawEquipmentSet.size > 0) {
      const sorted = Array.from(rawEquipmentSet).sort();
      console.log(`✅ Found ${sorted.length} equipment types with exercises: ${sorted.join(', ')}`);
      return sorted;
    }

    // Fallback to default equipment if nothing found
    console.warn('⚠️ No equipment found in exercises table, using defaults');
    return ['BODY WEIGHT'];
  } catch (error) {
    console.error('❌ Error fetching raw equipment:', error);
    // Return default equipment on error
    return ['BODY WEIGHT'];
  }
}

/**
 * Get formatted equipment options for UI display
 * 
 * Only returns equipment that:
 * 1. Exists in the database (already filtered by fetchRawEquipmentFromSupabase)
 * 2. Maps to a canonical category (has workouts available)
 * 
 * @returns Array of equipment options with raw, canonical, and display labels
 */
export async function getEquipmentOptions(): Promise<EquipmentOption[]> {
  const rawEquipment = await fetchRawEquipmentFromSupabase();
  
  // Filter to only include equipment that maps to a canonical category
  // This ensures we only show equipment that has workouts in the database
  return rawEquipment
    .map((raw) => {
      const canonical = mapRawEquipmentToCanonical(raw);
      const label = formatEquipmentLabel(raw);
      const description = getEquipmentDescription(canonical);
      
      return {
        raw,
        canonical,
        label,
        description, // Always included now
      };
    })
    .filter((option) => {
      // Exclude dumbbells and only include mapped equipment
      return option.canonical !== null && option.canonical !== 'dumbbells';
    });
}

/**
 * Format raw equipment label for display
 * 
 * Converts raw equipment strings like "BODY WEIGHT" or "LEVERAGE MACHINE" 
 * to formatted labels like "Bodyweight" or "Leverage Machine".
 * Special handling for "BODY WEIGHT" -> "Bodyweight" (one word).
 * 
 * @param raw - Raw equipment label (e.g. "BODY WEIGHT")
 * @returns Formatted label (e.g. "Bodyweight")
 */
export function formatEquipmentLabel(raw: string): string {
  const normalized = raw.trim().toUpperCase();
  
  // Special case: "BODY WEIGHT" -> "Bodyweight" (one word)
  if (normalized === 'BODY WEIGHT' || normalized === 'BODYWEIGHT') {
    return 'Bodyweight';
  }
  
  // For all other equipment, capitalize each word
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
 * @returns Description string (always returns a description)
 */
function getEquipmentDescription(canonical: CanonicalEquipment | null): string {
  switch (canonical) {
    case 'bodyweight':
      return 'No equipment needed';
    case 'dumbbells':
      return 'Free weights';
    case 'bands':
      return 'Elastic bands';
    case 'kettlebell':
      return 'Kettlebell exercises';
    case 'barbell':
      return 'Barbell and bar exercises';
    case 'machine':
      return 'Weight machines and leverage equipment';
    case 'cable':
      return 'Cable machine exercises';
    case 'other':
      return 'Other equipment types';
    default:
      // For unmapped equipment, provide a generic description
      return 'Available equipment option';
  }
}

