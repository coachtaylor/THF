import { Profile, Surgery } from '../types/index';

/**
 * Migrates an old Profile structure to the new Profile structure
 * for users who already have data stored in the old format.
 */
export function migrateOldProfileToNew(oldProfile: any): Profile {
  // Extract old fields
  const oldGoals = oldProfile.goals || [];
  const oldConstraints = oldProfile.constraints || [];
  const oldSurgeryFlags = oldProfile.surgery_flags || [];
  const oldHrtFlags = oldProfile.hrt_flags || [];
  const oldFitnessLevel = oldProfile.fitness_level;

  // Infer gender_identity from old goals
  // Note: This is difficult to infer accurately from old data, default to 'questioning'
  let genderIdentity: 'mtf' | 'ftm' | 'nonbinary' | 'questioning' = 'questioning';
  
  // You may not be able to infer this accurately, default to 'questioning'
  // Could potentially infer from body_focus_prefer or other fields, but not reliable

  // Infer primary_goal from old goals
  let primaryGoal: 'feminization' | 'masculinization' | 'general_fitness' | 'strength' | 'endurance' = 'general_fitness';
  if (oldGoals.includes('strength')) {
    primaryGoal = 'strength';
  } else if (oldGoals.includes('cardio')) {
    primaryGoal = 'endurance';
  } else if (oldGoals.includes('flexibility') || oldGoals.includes('mobility')) {
    primaryGoal = 'general_fitness';
  }
  // Default to general_fitness if can't determine

  // Infer HRT status from old hrt_flags
  const onHrt = oldHrtFlags.length > 0;
  let hrtType: 'estrogen_blockers' | 'testosterone' | 'none' | undefined = undefined;
  if (oldHrtFlags.includes('testosterone')) {
    hrtType = 'testosterone';
  } else if (oldHrtFlags.includes('estrogen')) {
    hrtType = 'estrogen_blockers';
  } else if (oldHrtFlags.includes('on_hrt') && !hrtType) {
    hrtType = 'none';
  }

  // Infer binding status from old constraints
  const bindsChest = oldConstraints.includes('binder_aware') || oldConstraints.includes('heavy_binding');
  let bindingFrequency: 'daily' | 'sometimes' | 'rarely' | 'never' | undefined = undefined;
  if (oldConstraints.includes('heavy_binding')) {
    bindingFrequency = 'daily';
  } else if (oldConstraints.includes('binder_aware')) {
    bindingFrequency = 'sometimes';
  }

  // Infer surgeries from old surgery_flags (no dates available, use placeholder)
  const surgeries: Surgery[] = oldSurgeryFlags.map((flag: string) => {
    let type: 'top_surgery' | 'bottom_surgery' | 'ffs' | 'orchiectomy' | 'other' = 'other';
    if (flag === 'top_surgery') {
      type = 'top_surgery';
    } else if (flag === 'bottom_surgery') {
      type = 'bottom_surgery';
    }

    return {
      type,
      date: new Date(), // Unknown date, use current date as placeholder
      weeks_post_op: undefined, // Can't calculate without real date
      notes: 'Migrated from old profile (date unknown)',
    };
  });

  // Map fitness_level to fitness_experience
  let fitnessExperience: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
  if (oldFitnessLevel === 'beginner') {
    fitnessExperience = 'beginner';
  } else if (oldFitnessLevel === 'advanced') {
    fitnessExperience = 'advanced';
  }

  // Get user_id - prefer existing user_id, fallback to id
  const userId = oldProfile.user_id || oldProfile.id || 'default-user';

  // Build new profile
  const newProfile: Profile = {
    // Required new fields
    id: oldProfile.id || 'default',
    user_id: userId,
    gender_identity: genderIdentity,
    primary_goal: primaryGoal,
    on_hrt: onHrt,
    hrt_type: hrtType,
    binds_chest: bindsChest,
    binding_frequency: bindingFrequency,
    surgeries: surgeries,
    fitness_experience: fitnessExperience,
    workout_frequency: oldProfile.workout_frequency || 4, // Default to 4 days/week
    session_duration: oldProfile.session_duration || 45, // Default to 45 min
    equipment: oldProfile.equipment || [],

    // Timestamps
    created_at: oldProfile.created_at || new Date(),
    updated_at: new Date(),

    // Keep old fields for backwards compatibility
    goals: oldGoals,
    constraints: oldConstraints,
    surgery_flags: oldSurgeryFlags,
    hrt_flags: oldHrtFlags,
    fitness_level: oldFitnessLevel,
    goal_weighting: oldProfile.goal_weighting,

    // Keep other existing fields that might be present
    email: oldProfile.email,
    pronouns: oldProfile.pronouns,
    secondary_goals: oldProfile.secondary_goals,
    dysphoria_triggers: oldProfile.dysphoria_triggers,
    body_focus_prefer: oldProfile.body_focus_prefer,
    body_focus_soft_avoid: oldProfile.body_focus_soft_avoid,
    surgeon_cleared: oldProfile.surgeon_cleared,
    preferred_minutes: oldProfile.preferred_minutes,
    block_length: oldProfile.block_length,
    low_sensory_mode: oldProfile.low_sensory_mode,
    disclaimer_acknowledged_at: oldProfile.disclaimer_acknowledged_at,
    cloud_sync_enabled: oldProfile.cloud_sync_enabled,
    synced_at: oldProfile.synced_at,
    why_flags: oldProfile.why_flags,
    preferences: oldProfile.preferences,
  };

  return newProfile;
}

/**
 * Checks if a profile needs migration from old structure to new structure
 */
export function needsMigration(profile: any): boolean {
  if (!profile) {
    return false;
  }

  // Check if profile has new required fields
  return (
    !profile.gender_identity ||
    !profile.primary_goal ||
    typeof profile.on_hrt !== 'boolean' ||
    typeof profile.binds_chest !== 'boolean' ||
    !profile.fitness_experience ||
    typeof profile.workout_frequency !== 'number' ||
    typeof profile.session_duration !== 'number'
  );
}

