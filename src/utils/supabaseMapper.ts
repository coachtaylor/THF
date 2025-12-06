// src/utils/supabaseMapper.ts
// FIXED: Properly parses equipment from Supabase

import { Exercise } from '../types';
import { Swap } from '../types/plan';

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
 * Parse swaps field from Supabase
 * Handles: arrays of slugs/IDs, JSON strings, or Swap objects
 */
function parseSwaps(swapsField: any): Swap[] {
  if (!swapsField) return [];

  // Handle array of strings (exercise slugs) or Swap objects
  if (Array.isArray(swapsField)) {
    return swapsField
      .filter(s => s != null)
      .map(item => {
        // If it's already a Swap object
        if (typeof item === 'object' && item.exercise_id) {
          return item as Swap;
        }
        // If it's a string (slug or ID)
        if (typeof item === 'string' && item.trim()) {
          return {
            exercise_id: item.trim(),
            rationale: 'Alternative exercise with similar muscle activation',
          };
        }
        return null;
      })
      .filter((swap): swap is Swap => swap !== null);
  }

  // Handle JSON string
  if (typeof swapsField === 'string') {
    try {
      const parsed = JSON.parse(swapsField);
      if (Array.isArray(parsed)) {
        return parsed
          .filter(item => item != null)
          .map(item => {
            if (typeof item === 'string' && item.trim()) {
              return {
                exercise_id: item.trim(),
                rationale: 'Alternative exercise with similar muscle activation',
              };
            }
            if (typeof item === 'object' && item.exercise_id) {
              return item as Swap;
            }
            return null;
          })
          .filter((swap): swap is Swap => swap !== null);
      }
    } catch (e) {
      // Not valid JSON, return empty
      return [];
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
    id: String(row.id || row.slug), // Convert to string to match Exercise type
    slug: row.slug || String(row.id || ''),
    name: row.name || 'Unknown Exercise',
    pattern: row.pattern || '',
    goal: row.goal || '',
    category: row.pattern || 'full_body',
    equipment: equipment,
    difficulty: (row.difficulty || 'beginner') as Exercise['difficulty'],
    tags: parseTextArray(row.tags),
    binder_aware: row.binder_aware ?? true,
    pelvic_floor_safe: row.pelvic_floor_safe ?? true,
    heavy_binding_safe: row.heavy_binding_safe ?? false,
    pelvic_floor_aware: row.pelvic_floor_safe ?? true, // Alias for backward compatibility
    contraindications: parseTextArray(row.contraindications),
    pressure_level: (row.pressure_level || 'low') as 'low' | 'medium' | 'high',
    target_muscles: row.target_muscles || undefined,
    secondary_muscles: row.secondary_muscles || undefined,
    gender_goal_emphasis: row.gender_goal_emphasis as Exercise['gender_goal_emphasis'],
    cue_primary: row.cue_primary || undefined,
    breathing: row.breathing || undefined,
    neutral_cues: parseTextArray(row.cues || row.cue_primary),
    breathing_cues: parseTextArray(row.breathing),
    rep_range_beginner: row.rep_range_beginner || undefined,
    rep_range_intermediate: row.rep_range_intermediate || undefined,
    rep_range_advanced: row.rep_range_advanced || undefined,
    effectiveness_rating: row.effectiveness_rating || undefined,
    source: row.source || undefined,
    notes: row.notes || undefined,
    dysphoria_tags: Array.isArray(row.dysphoria_tags) 
      ? row.dysphoria_tags.join(', ')
      : (row.dysphoria_tags || undefined),
    post_op_safe_weeks: row.post_op_safe_weeks || undefined,
    created_at: row.created_at ? new Date(row.created_at) : new Date(),
    version: row.version || '1.0',
    flags_reviewed: row.flags_reviewed || false,
    reviewer: row.reviewer || undefined,
    swaps: parseSwaps(row.swaps),
    trans_notes: {
      binder: row.trans_notes?.binder || (row.binder_aware ? 'Safe for binding' : 'Use caution with binding'),
      pelvic_floor: row.trans_notes?.pelvic_floor || (row.pelvic_floor_safe ? 'Pelvic floor safe' : 'Use caution with pelvic floor'),
    },
    commonErrors: [],
    videoUrl: row.media_video || row.media_thumb || undefined,
    video_url: row.media_video || row.media_thumb || undefined,
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