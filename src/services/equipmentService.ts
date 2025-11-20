// src/services/equipmentService.ts
// FIXED VERSION: Better equipment loading with proper error handling

import { fetchAllExercises } from './exerciseService';
import { Equipment } from '../types';

export interface EquipmentOption {
  value: Equipment;
  label: string;
  count: number;
}

/**
 * Equipment display labels
 */
const EQUIPMENT_LABELS: Record<string, string> = {
  // Base equipment
  bodyweight: 'Bodyweight',
  dumbbells: 'Dumbbells',
  dumbbell: 'Dumbbells',
  bands: 'Resistance Bands',
  band: 'Resistance Band',
  resistance_band: 'Resistance Band',
  kettlebell: 'Kettlebell',
  barbell: 'Barbell',
  
  // Machines
  cable: 'Cable Machine',
  machine: 'Weight Machine',
  leverage_machine: 'Leverage Machine',
  sled_machine: 'Sled Machine',
  skierg_machine: 'Ski Erg Machine',
  smith_machine: 'Smith Machine',
  
  // Other equipment
  trap_bar: 'Trap Bar',
  step: 'Step / Box',
  box: 'Plyo Box',
  wall: 'Wall',
  chair: 'Chair',
  mat: 'Exercise Mat',
  bench: 'Weight Bench',
  pullup_bar: 'Pull-up Bar',
  pull_up_bar: 'Pull-up Bar',
  trx: 'TRX Straps',
  medicine_ball: 'Medicine Ball',
  foam_roller: 'Foam Roller',
  yoga_block: 'Yoga Block',
};

/**
 * Format equipment value into display label
 */
function formatEquipmentLabel(equipment: string): string {
  const normalized = equipment.toLowerCase().trim();
  
  if (EQUIPMENT_LABELS[normalized]) {
    return EQUIPMENT_LABELS[normalized];
  }
  
  // Fallback: capitalize words
  return equipment
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get equipment priority for sorting
 */
function getEquipmentPriority(equipment: string): number {
  const priorityOrder = [
    'bodyweight',
    'dumbbells',
    'dumbbell',
    'bands',
    'band',
    'resistance_band',
    'kettlebell',
    'barbell',
    'mat',
  ];
  
  const normalized = equipment.toLowerCase();
  const index = priorityOrder.indexOf(normalized);
  return index === -1 ? 999 : index;
}

/**
 * Fetch all unique equipment types with exercise counts
 */
export async function getAvailableEquipment(): Promise<EquipmentOption[]> {
  try {
    console.log('🔍 getAvailableEquipment: Starting...');
    
    const exercises = await fetchAllExercises();
    console.log(`📊 getAvailableEquipment: Fetched ${exercises.length} exercises`);
    
    if (exercises.length === 0) {
      console.warn('⚠️ getAvailableEquipment: No exercises found');
      return getDefaultEquipmentOptions();
    }

    // Count exercises per equipment type
    const equipmentCounts = new Map<string, number>();
    
    exercises.forEach((exercise, index) => {
      if (index < 5) {
        console.log(`📝 Sample exercise ${index + 1}:`, {
          name: exercise.name,
          equipment: exercise.equipment,
          equipmentType: typeof exercise.equipment,
          isArray: Array.isArray(exercise.equipment),
        });
      }
      
      if (!Array.isArray(exercise.equipment)) {
        console.warn(`⚠️ Exercise "${exercise.name}" has invalid equipment:`, exercise.equipment);
        return;
      }
      
      exercise.equipment.forEach(eq => {
        const normalized = eq.toLowerCase().trim();
        const current = equipmentCounts.get(normalized) || 0;
        equipmentCounts.set(normalized, current + 1);
      });
    });

    console.log('📈 Equipment counts:', Object.fromEntries(equipmentCounts));

    // Convert to options array
    const options: EquipmentOption[] = Array.from(equipmentCounts.entries())
      .map(([value, count]) => ({
        value: value as Equipment,
        label: formatEquipmentLabel(value),
        count,
      }))
      .sort((a, b) => {
        const priorityA = getEquipmentPriority(a.value);
        const priorityB = getEquipmentPriority(b.value);
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        // If same priority, sort by count descending
        return b.count - a.count;
      });

    console.log('✅ getAvailableEquipment: Returning', options.length, 'options');
    options.forEach(opt => {
      console.log(`  - ${opt.label}: ${opt.count} exercises`);
    });
    
    return options;
    
  } catch (error) {
    console.error('❌ getAvailableEquipment: Error:', error);
    return getDefaultEquipmentOptions();
  }
}

/**
 * Default fallback equipment options
 */
function getDefaultEquipmentOptions(): EquipmentOption[] {
  console.log('⚠️ Using default equipment options');
  return [
    { value: 'bodyweight', label: 'Bodyweight', count: 0 },
    { value: 'dumbbells', label: 'Dumbbells', count: 0 },
    { value: 'bands', label: 'Resistance Bands', count: 0 },
    { value: 'kettlebell', label: 'Kettlebell', count: 0 },
  ];
}

/**
 * Get equipment options with minimum exercise count
 */
export async function getAvailableEquipmentWithMinimum(
  minExercises: number = 3
): Promise<EquipmentOption[]> {
  const allOptions = await getAvailableEquipment();
  return allOptions.filter(option => option.count >= minExercises);
}

/**
 * Check if specific equipment has exercises
 */
export async function hasExercisesForEquipment(equipment: Equipment): Promise<boolean> {
  const exercises = await fetchAllExercises();
  return exercises.some(ex => 
    Array.isArray(ex.equipment) && 
    ex.equipment.some(eq => eq.toLowerCase() === equipment.toLowerCase())
  );
}

/**
 * Get exercise count for specific equipment
 */
export async function getExerciseCountForEquipment(equipment: Equipment): Promise<number> {
  const exercises = await fetchAllExercises();
  return exercises.filter(ex =>
    Array.isArray(ex.equipment) &&
    ex.equipment.some(eq => eq.toLowerCase() === equipment.toLowerCase())
  ).length;
}

/**
 * Validate equipment selection
 */
export async function validateEquipmentSelection(
  selectedEquipment: Equipment[]
): Promise<{
  valid: boolean;
  warnings: string[];
}> {
  const warnings: string[] = [];
  
  for (const equipment of selectedEquipment) {
    const count = await getExerciseCountForEquipment(equipment);
    
    if (count === 0) {
      warnings.push(`No exercises found for ${formatEquipmentLabel(equipment)}`);
    } else if (count < 3) {
      warnings.push(`Only ${count} exercises for ${formatEquipmentLabel(equipment)}`);
    }
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}