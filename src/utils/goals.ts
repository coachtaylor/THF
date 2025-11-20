import { supabase } from './supabase';

/**
 * Fetch all distinct goal values from the exercises table
 * These are the actual goal values used in the database
 */
export async function fetchGoalsFromDatabase(): Promise<string[]> {
  if (!supabase) {
    console.warn('⚠️ Supabase not configured - returning default goals');
    return ['strength', 'conditioning', 'mobility', 'endurance'];
  }

  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('goal')
      .not('goal', 'is', null);

    if (error) {
      console.error('❌ Error fetching goals:', error);
      return ['strength', 'conditioning', 'mobility', 'endurance'];
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ No goals found in database');
      return ['strength', 'conditioning', 'mobility', 'endurance'];
    }

    // Extract unique goal values
    const goalSet = new Set<string>();
    data.forEach((row: { goal: string | null }) => {
      if (row.goal && row.goal.trim()) {
        goalSet.add(row.goal.trim().toLowerCase());
      }
    });

    const goals = Array.from(goalSet).sort();
    console.log(`✅ Found ${goals.length} distinct goals in database:`, goals);
    
    return goals.length > 0 ? goals : ['strength', 'conditioning', 'mobility', 'endurance'];
  } catch (error) {
    console.error('❌ Failed to fetch goals:', error);
    return ['strength', 'conditioning', 'mobility', 'endurance'];
  }
}

/**
 * Format goal value for display (capitalize first letter)
 */
export function formatGoalLabel(goal: string): string {
  return goal.charAt(0).toUpperCase() + goal.slice(1);
}


