// src/utils/supabaseMapper.ts
// FIXED: Properly parses equipment from Supabase

import { Exercise } from '../types';

/**
 * Parse equipment field from Supabase
 * Handles: JSON strings, arrays, or plain strings
 */
function parseEquipment(equipment: any): string[] {
  // Already an array
  if (Array.isArray(equipment)) {
    return equipment.filter(e => e && typeof e === 'string');
  }

  // JSON string like '["bodyweight"]'
  if (typeof equipment === 'string') {
    try {
      const parsed = JSON.parse(equipment);
      if (Array.isArray(parsed)) {
        return parsed.filter(e => e && typeof e === 'string');
      }
      // Single string value
      return [parsed].filter(e => e && typeof e === 'string');
    } catch (e) {
      // Not JSON, treat as single value
      return [equipment].filter(e => e);
    }
  }

  // Null or undefined
  return [];
}

/**
 * Parse text array fields (cues, tags, etc.)
 */
function parseTextArray(field: any): string[] {
  if (Array.isArray(field)) {
    return field.filter(item => item && typeof item === 'string');
  }

  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => item && typeof item === 'string');
      }
      return [parsed].filter(item => item);
    } catch (e) {
      return [field];
    }
  }

  return [];
}

/**
 * Map a single exercise from Supabase to app format
 */
export function mapSupabaseExercise(row: any): Exercise {
  console.log('🔍 Mapping exercise:', row.name);
  console.log('   Raw equipment:', row.equipment, typeof row.equipment);
  
  const equipment = parseEquipment(row.equipment);
  console.log('   Parsed equipment:', equipment);

  return {
    id: row.id || row.slug,
    name: row.name || 'Unknown Exercise',
    category: row.pattern || 'full_body',
    equipment: equipment,
    difficulty: row.difficulty || 'beginner',
    binder_aware: row.binder_aware ?? true,
    heavy_binding_safe: row.heavy_binding_safe ?? false,
    pelvic_floor_aware: row.pelvic_floor_safe ?? true,
    pressure_level: row.pressure_level || 'low',
    neutral_cues: parseTextArray(row.cues || row.cue_primary),
    breathing_cues: parseTextArray(row.breathing),
    trans_notes: {
      binder: row.trans_notes?.binder || '',
      pelvic_floor: row.trans_notes?.pelvic_floor || '',
    },
    swaps: [],
    videoUrl: row.media_video || row.media_thumb || '',
    tags: parseTextArray(row.tags),
  };
}

/**
 * Map multiple exercises from Supabase
 */
export function mapSupabaseExercises(rows: any[]): Exercise[] {
  if (!rows || !Array.isArray(rows)) {
    console.warn('⚠️ mapSupabaseExercises received invalid data:', rows);
    return [];
  }

  console.log(`📊 Mapping ${rows.length} exercises from Supabase`);
  
  const exercises = rows.map(mapSupabaseExercise);
  
  // Count equipment distribution
  const equipmentCounts = new Map<string, number>();
  exercises.forEach(ex => {
    ex.equipment.forEach(eq => {
      equipmentCounts.set(eq, (equipmentCounts.get(eq) || 0) + 1);
    });
  });
  
  console.log('📈 Equipment distribution after mapping:');
  equipmentCounts.forEach((count, eq) => {
    console.log(`   ${eq}: ${count} exercises`);
  });
  
  return exercises;
}