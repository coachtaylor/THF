import { Exercise, Swap, ExerciseDetail } from '../types/plan';
import { Profile } from '../services/storage/profile';
import { supabase } from '../utils/supabase';

// Type for exercise data from Supabase public.exercises table
interface DatabaseExercise {
  id: number;
  slug: string;
  name: string;
  pattern: string | null;
  goal: string | null;
  difficulty: string | null;
  equipment: string[];
  binder_aware: boolean;
  pelvic_floor_safe: boolean;
  heavy_binding_safe?: boolean;
  contraindications?: string[];
  target_muscles?: string | null;
  secondary_muscles?: string | null;
  media_thumb?: string | null;
  cue_primary?: string | null;
  breathing?: string | null;
  rep_range_beginner?: string | null;
  rep_range_intermediate?: string | null;
  rep_range_advanced?: string | null;
  effectiveness_rating?: number | null;
  source?: string | null;
  notes?: string | null;
  dysphoria_tags?: string[] | null;
  post_op_safe_weeks?: number | null;
  created_at?: string;
  version?: string;
  flags_reviewed?: boolean;
  reviewer?: string | null;
}


// Exercises that are NOT safe for heavy binding (from BRD)
const HEAVY_BINDING_UNSAFE_PATTERNS = ['jumping_jack', 'high_knees', 'mountain_climber', 'burpee', 'squat_thrust'];

// Map database exercise to Exercise interface
function mapDatabaseExerciseToExercise(db: DatabaseExercise): Exercise {
  // Build tags array from pattern and goal
  const tags: string[] = [];
  
  // Add pattern (e.g., "mobility", "core")
  if (db.pattern) {
    tags.push(db.pattern);
    // Map pattern to common tag names
    if (db.pattern === 'mobility') {
      tags.push('lower_body'); // Mobility exercises often target lower body
    }
    if (db.pattern === 'core') {
      tags.push('core');
    }
  }
  
  // Add goal (e.g., "mobility", "conditioning", "strength", "endurance")
  // Always add the goal to tags so it can be matched directly
  if (db.goal) {
    const goalLower = db.goal.toLowerCase().trim();
    // Always add the goal value itself to tags for direct matching
    tags.push(goalLower);
    
    // Also add legacy mappings for backward compatibility
    if (goalLower === 'conditioning') {
      tags.push('strength'); // Conditioning also maps to strength
      tags.push('cardio'); // Also can be cardio
    }
    if (goalLower === 'mobility') {
      tags.push('flexibility'); // Mobility also maps to flexibility
    }
  }
  
  if (db.difficulty) tags.push(db.difficulty);
  
  // Add equipment to tags for filtering
  db.equipment.forEach(eq => {
    if (eq && eq !== 'none') tags.push(eq);
  });

  // Determine heavy_binding_safe based on slug/pattern
  const isHeavyBindingUnsafe = HEAVY_BINDING_UNSAFE_PATTERNS.some(
    unsafe => db.slug.includes(unsafe) || db.pattern?.includes(unsafe)
  );
  const heavy_binding_safe = !isHeavyBindingUnsafe && db.binder_aware;

  // Determine pressure_level based on pattern
  let pressure_level: 'low' | 'medium' | 'high' = 'low';
  if (db.pattern === 'mobility' || db.goal === 'mobility') {
    pressure_level = 'low';
  } else {
    pressure_level = 'medium';
  }

  // Create trans_notes from available data
  const trans_notes = {
    binder: db.binder_aware 
      ? 'Safe for binding - minimal chest compression during movement'
      : 'Use caution with binding - may cause chest compression',
    pelvic_floor: db.pelvic_floor_safe
      ? 'Engage core gently, avoid bearing down'
      : 'Use caution with pelvic floor engagement'
  };

  return {
    id: String(db.id) || db.slug, // Use numeric ID as string (matches plan generator), fallback to slug
    slug: db.slug || String(db.id),
    name: db.name,
    pattern: db.pattern || '',
    goal: db.goal || '',
    equipment: db.equipment,
    difficulty: (db.difficulty as Exercise['difficulty']) || 'beginner',
    tags,
    binder_aware: db.binder_aware,
    pelvic_floor_safe: db.pelvic_floor_safe,
    heavy_binding_safe: heavy_binding_safe,
    pelvic_floor_aware: db.pelvic_floor_safe, // Alias for backward compatibility
    contraindications: db.contraindications || [],
    pressure_level,
    target_muscles: db.target_muscles ?? undefined,
    secondary_muscles: db.secondary_muscles ?? undefined,
    media_thumb: db.media_thumb ?? undefined,
    cue_primary: db.cue_primary ?? undefined,
    breathing: db.breathing ?? undefined,
    neutral_cues: [], // TODO: Add cues column to database
    breathing_cues: [], // TODO: Add breathing column to database
    rep_range_beginner: db.rep_range_beginner ?? undefined,
    rep_range_intermediate: db.rep_range_intermediate ?? undefined,
    rep_range_advanced: db.rep_range_advanced ?? undefined,
    effectiveness_rating: db.effectiveness_rating ?? undefined,
    source: db.source ?? undefined,
    notes: db.notes ?? undefined,
    dysphoria_tags: Array.isArray(db.dysphoria_tags)
      ? db.dysphoria_tags.join(', ')
      : (db.dysphoria_tags ?? undefined),
    post_op_safe_weeks: db.post_op_safe_weeks ?? undefined,
    swaps: [], // TODO: Add swaps column to database
    trans_notes,
    commonErrors: [],
    created_at: db.created_at ? new Date(db.created_at) : new Date(),
    version: db.version || '1.0',
    flags_reviewed: db.flags_reviewed || false,
    reviewer: db.reviewer ?? undefined,
  };
}

// Fetch exercises from Supabase
export async function fetchExercises(): Promise<Exercise[]> {
  console.log('🔍 fetchExercises: Starting...');
  
  if (!supabase) {
    console.warn('⚠️ Supabase not configured - cannot fetch exercises');
    return [];
  }

  console.log('✅ Supabase client is available');

  try {
    console.log('📡 Querying Supabase exercises table...');
    const { data, error } = await supabase
      .from('exercises')
      .select(`
        id,
        slug,
        name,
        pattern,
        goal,
        difficulty,
        equipment,
        binder_aware,
        pelvic_floor_safe,
        heavy_binding_safe,
        contraindications,
        target_muscles,
        secondary_muscles,
        media_thumb,
        gender_goal_emphasis,
        cue_primary,
        breathing,
        rep_range_beginner,
        rep_range_intermediate,
        rep_range_advanced,
        effectiveness_rating,
        source,
        notes,
        dysphoria_tags,
        post_op_safe_weeks,
        created_at,
        version,
        flags_reviewed,
        reviewer
      `);

    if (error) {
      console.error('❌ Error fetching exercises:', error);
      console.error('   Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log(`📊 Supabase returned ${data?.length || 0} raw exercises`);
    
    if (!data) {
      console.warn('⚠️ Supabase returned null data');
      return [];
    }

    if (data.length === 0) {
      console.warn('⚠️ Supabase returned empty array - exercises table may be empty');
      return [];
    }

    console.log(`🔄 Mapping ${data.length} exercises...`);
    const mapped = data.map(mapDatabaseExerciseToExercise);
    console.log(`✅ Successfully mapped ${mapped.length} exercises`);
    
    // Log sample exercise
    if (mapped.length > 0) {
      const sample = mapped[0];
      console.log(`   Sample: ${sample.name} (id: ${sample.id}, equipment: ${sample.equipment.join(', ')})`);
    }
    
    return mapped;
  } catch (error) {
    console.error('❌ Failed to fetch exercises:', error);
    throw error;
  }
}

// Cache for exercises (will be populated on first fetch)
let exerciseLibraryCache: Exercise[] | null = null;

// Get exercise library (cached)
export async function getExerciseLibrary(): Promise<Exercise[]> {
  if (exerciseLibraryCache) {
    console.log(`📚 Using cached exercise library (${exerciseLibraryCache.length} exercises)`);
    return exerciseLibraryCache;
  }
  
  console.log('🔄 Cache miss - fetching exercises from Supabase...');
  exerciseLibraryCache = await fetchExercises();
  console.log(`📚 Cached ${exerciseLibraryCache.length} exercises`);
  return exerciseLibraryCache;
}

// Clear cache (useful for refreshing after updates)
export function clearExerciseCache(): void {
  exerciseLibraryCache = null;
}

// Legacy export for backward compatibility (deprecated - use getExerciseLibrary instead)
export const exerciseLibrary: Exercise[] = [];

export async function getExerciseById(id: string): Promise<Exercise | undefined> {
  const exercises = await getExerciseLibrary();
  // id can be numeric string (e.g., "848"), slug, or prefixed format (e.g., "exercise-848")
  // Try exact match first, then try numeric match if id is numeric
  const exactMatch = exercises.find(ex => ex.id === id);
  if (exactMatch) return exactMatch;
  
  // If id is numeric, try matching against numeric string IDs
  if (/^\d+$/.test(id)) {
    return exercises.find(ex => ex.id === id || String(ex.id) === id);
  }
  
  // Try prefixed format
  return exercises.find(ex => ex.id === `exercise-${id}`);
}

export async function getExercisesByCategory(category: string): Promise<Exercise[]> {
  const exercises = await getExerciseLibrary();
  return exercises.filter(ex => 
    ex.tags?.includes(category) || 
    ex.tags?.some(tag => tag.toLowerCase().includes(category.toLowerCase()))
  );
}

export async function getBinderAwareExercises(): Promise<Exercise[]> {
  const exercises = await getExerciseLibrary();
  return exercises.filter(ex => ex.binder_aware);
}

export async function getHeavyBindingSafeExercises(): Promise<Exercise[]> {
  const exercises = await getExerciseLibrary();
  return exercises.filter(ex => ex.heavy_binding_safe);
}

export async function filterByConstraints(constraints: string[]): Promise<Exercise[]> {
  const exercises = await getExerciseLibrary();
  return exercises.filter(ex => {
    if (constraints.includes('binder_aware') && !ex.binder_aware) {
      return false;
    }
    if (constraints.includes('heavy_binding') && !ex.heavy_binding_safe) {
      return false;
    }
    if (constraints.includes('pelvic_floor_aware') && !ex.pelvic_floor_aware) {
      return false;
    }
    return true;
  });
}

// ============================================================================
// EXERCISE DETAIL (with trans tips)
// ============================================================================

// Type for exercise data from Supabase public.exercises table (detailed version)
interface DatabaseExerciseDetail {
  id: number;
  slug: string;
  name: string;
  pattern: string | null;
  goal: string | null;
  difficulty: string | null;
  equipment: string[];
  binder_aware: boolean;
  pelvic_floor_safe: boolean;
  target_muscles: string | null;
  secondary_muscles: string | null;
  media_thumb?: string | null; // Optional - column may not exist in database
  cue_primary: string | null;
  cues: string[] | null;
  breathing: string | null;
  coaching_points: string[] | null;
  common_errors: string[] | null;
  progressions: string[] | null;
  regressions: string[] | null;
}

// Type for trans tips from Supabase exercise_trans_tips table
interface DatabaseTransTip {
  id: number;
  exercise_id: number;
  population: string | null;
  context: string | null;
  tips: any; // JSON object with structure: { form_focus: [...], hrt_considerations: [...], etc. }
}

/**
 * Helper: Check if a trans tip should be shown for the given user profile.
 * 
 * Rules:
 * - If population is 'binder' or 'binding' → only show when user has binder-related constraint
 * - If population is 'post_op' or 'surgery' → only show when user has post_op constraint AND surgery_flags is non-empty
 * - If population is 'hrt' or 'hormones' → only show when user has HRT-related flags in hrt_flags
 * - If population is null, empty, or 'general' → always show
 * 
 * @param tip - Trans tip from database
 * @param profile - User profile with constraints and HRT flags
 * @returns true if tip should be included for this user
 */
function shouldIncludeTransTip(tip: DatabaseTransTip, profile: Profile): boolean {
  const population = tip.population?.toLowerCase() || '';
  const constraints = profile.constraints || [];
  const hrtFlags = profile.hrt_flags || [];
  const surgeryFlags = profile.surgery_flags || [];

  // Always include general/null population tips
  if (!population || population === '' || population === 'general') {
    return true;
  }

  // Binder-related tips
  // Include if user has binder_aware or heavy_binding constraint
  if (population === 'binder' || population === 'binding') {
    return constraints.includes('binder_aware') || constraints.includes('heavy_binding');
  }

  // Post-op/surgery tips
  // Include only if user has post_op constraint AND surgery_flags is non-empty
  if (population === 'post_op' || population === 'surgery') {
    const hasPostOpConstraint = constraints.includes('post_op');
    const hasSurgeryFlags = surgeryFlags.length > 0;
    return hasPostOpConstraint && hasSurgeryFlags;
  }

  // HRT/hormone-related tips
  // Include only if user has HRT flags: 'on_hrt', 'testosterone', or 'estrogen'
  if (population === 'hrt' || population === 'hormones' || population === 'hormone') {
    return hrtFlags.length > 0 && (
      hrtFlags.includes('on_hrt') ||
      hrtFlags.includes('testosterone') ||
      hrtFlags.includes('estrogen')
    );
  }

  // Default: include tip if we don't recognize the population
  // This is safer than excluding unknown populations
  return true;
}

/**
 * Get detailed exercise information with trans-specific tips filtered by user profile.
 * 
 * Fetches:
 * - Core exercise data from `public.exercises` by ID
 * - Trans tips from `exercise_trans_tips` filtered by user profile
 * 
 * Returns null if exercise not found or on error (logs error but doesn't throw).
 * 
 * @param exerciseId - Numeric ID of the exercise in the database
 * @param profile - User profile for filtering trans tips
 * @returns ExerciseDetail object or null if not found/error
 */
export async function getExerciseDetail(
  exerciseId: number,
  profile: Profile
): Promise<ExerciseDetail | null> {
  if (!supabase) {
    console.warn('⚠️ Supabase not configured - cannot fetch exercise detail');
    return null;
  }

  try {
    // Fetch exercise from public.exercises by ID
    const { data: exerciseData, error: exerciseError } = await supabase
      .from('exercises')
      .select(`
        id,
        slug,
        name,
        pattern,
        goal,
        difficulty,
        equipment,
        binder_aware,
        pelvic_floor_safe,
        target_muscles,
        secondary_muscles,
        cue_primary,
        cues,
        breathing,
        coaching_points,
        common_errors,
        progressions,
        regressions
      `)
      .eq('id', exerciseId)
      .single();

    if (exerciseError) {
      console.error(`❌ Error fetching exercise ${exerciseId}:`, exerciseError);
      return null;
    }

    if (!exerciseData) {
      console.warn(`⚠️ Exercise ${exerciseId} not found`);
      return null;
    }

    // Fetch trans tips from exercise_trans_tips by exercise_id
    const { data: tipsData, error: tipsError } = await supabase
      .from('exercise_trans_tips')
      .select(`
        id,
        exercise_id,
        population,
        context,
        tips
      `)
      .eq('exercise_id', exerciseId);

    if (tipsError) {
      console.error(`❌ Error fetching trans tips for exercise ${exerciseId}:`, tipsError);
      // Continue without tips if tips fetch fails - we still have exercise data
    }

    // Filter tips based on user profile and flatten JSON object into array
    const filteredTips = (tipsData || [])
      .filter((tip: DatabaseTransTip) => shouldIncludeTransTip(tip, profile))
      .map((tip: DatabaseTransTip) => {
        // The tips field is a JSON object with structure like:
        // { form_focus: [...], hrt_considerations: [...], etc. }
        // We need to flatten it into an array of strings
        const tipsObj = tip.tips || {};
        const tipsArray: string[] = [];
        
        // Extract all tip arrays from the object and flatten
        Object.values(tipsObj).forEach((value) => {
          if (Array.isArray(value)) {
            tipsArray.push(...value);
          } else if (typeof value === 'string' && value !== '') {
            // Handle disclaimer field which is a single string
            tipsArray.push(value);
          }
        });
        
        return {
          population: tip.population,
          context: tip.context,
          tips: tipsArray,
        };
      });

    // Map database exercise to ExerciseDetail
    const dbExercise = exerciseData as unknown as DatabaseExerciseDetail;
    
    const exerciseDetail: ExerciseDetail = {
      id: dbExercise.id,
      slug: dbExercise.slug,
      name: dbExercise.name,
      pattern: dbExercise.pattern,
      goal: dbExercise.goal,
      difficulty: (dbExercise.difficulty as ExerciseDetail['difficulty']) || 'beginner',
      equipment: dbExercise.equipment || [],
      binderAware: dbExercise.binder_aware,
      pelvicFloorSafe: dbExercise.pelvic_floor_safe,
      targetMuscles: dbExercise.target_muscles,
      secondaryMuscles: dbExercise.secondary_muscles,
      mediaThumb: dbExercise.media_thumb,
      cuePrimary: dbExercise.cue_primary,
      cues: dbExercise.cues || [],
      breathing: dbExercise.breathing,
      coachingPoints: dbExercise.coaching_points || [],
      commonErrors: dbExercise.common_errors || [],
      progressions: dbExercise.progressions || [],
      regressions: dbExercise.regressions || [],
      transTips: filteredTips,
    };

    return exerciseDetail;
  } catch (error) {
    console.error(`❌ Failed to fetch exercise detail for ${exerciseId}:`, error);
    return null;
  }
}
