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
  raw_equipment?: string | string[] | null;
  binder_aware: boolean;
  pelvic_floor_safe: boolean;
  target_muscles: string | null;
  secondary_muscles: string | null;
  media_thumb: string | null;
}

/**
 * Normalize raw equipment from database to a consistent array format.
 * 
 * Handles:
 * - null/undefined → empty array
 * - Array of strings → normalize each to UPPERCASE
 * - Single string → split by comma if needed, normalize to UPPERCASE
 * 
 * @param raw - Raw equipment from database (string, string[], or null/undefined)
 * @returns Normalized array of UPPERCASE equipment strings
 */
function normalizeRawEquipment(raw: string | string[] | null | undefined): string[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((r) => r?.toString().trim().toUpperCase())
      .filter(Boolean) as string[];
  }

  // If stored as a single string, split by comma if it contains commas
  const str = raw.toString().trim();
  if (str.includes(',')) {
    return str
      .split(',')
      .map((r) => r.trim().toUpperCase())
      .filter(Boolean);
  }

  // Single value
  return str ? [str.toUpperCase()] : [];
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
  
  // Add goal (e.g., "mobility", "conditioning")
  if (db.goal) {
    if (db.goal === 'conditioning') {
      tags.push('strength'); // Conditioning maps to strength
      tags.push('cardio'); // Also can be cardio
    }
    if (db.goal === 'mobility') {
      tags.push('flexibility'); // Mobility maps to flexibility
    }
    if (db.goal !== db.pattern) {
      tags.push(db.goal);
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
    id: db.slug, // Use slug as id for consistency
    name: db.name,
    equipment: db.equipment,
    rawEquipment: normalizeRawEquipment(db.raw_equipment),
    difficulty: (db.difficulty as Exercise['difficulty']) || 'beginner',
    tags,
    binder_aware: db.binder_aware,
    heavy_binding_safe: heavy_binding_safe,
    pelvic_floor_aware: db.pelvic_floor_safe,
    pressure_level,
    neutral_cues: [], // TODO: Add cues column to database
    breathing_cues: [], // TODO: Add breathing column to database
    swaps: [], // TODO: Add swaps column to database
    trans_notes
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
        raw_equipment,
        binder_aware,
        pelvic_floor_safe,
        target_muscles,
        secondary_muscles,
        media_thumb
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
      console.log(`   Sample: ${sample.name} (id: ${sample.id}, equipment: ${sample.equipment.join(', ')}, rawEquipment: ${sample.rawEquipment.join(', ')})`);
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
  // id can be either slug or numeric id
  return exercises.find(ex => ex.id === id || ex.id === `exercise-${id}`);
}

export async function getExercisesByCategory(category: string): Promise<Exercise[]> {
  const exercises = await getExerciseLibrary();
  return exercises.filter(ex => 
    ex.tags.includes(category) || 
    ex.tags.some(tag => tag.toLowerCase().includes(category.toLowerCase()))
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
  media_thumb: string | null;
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
  tips_json: string[] | null;
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
        media_thumb,
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
        tips_json
      `)
      .eq('exercise_id', exerciseId);

    if (tipsError) {
      console.error(`❌ Error fetching trans tips for exercise ${exerciseId}:`, tipsError);
      // Continue without tips if tips fetch fails - we still have exercise data
    }

    // Filter tips based on user profile
    const filteredTips = (tipsData || [])
      .filter((tip: DatabaseTransTip) => shouldIncludeTransTip(tip, profile))
      .map((tip: DatabaseTransTip) => ({
        population: tip.population,
        context: tip.context,
        tips: tip.tips_json || [],
      }));

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
