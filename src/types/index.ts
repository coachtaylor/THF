// TransFitness - TypeScript Type Definitions
// UPDATED: Equipment type now accepts any string from database

// Re-export navigation types for convenience
export * from './navigation';

// Re-export feedback types
export * from './feedback';

export interface Profile {
  // REQUIRED FIELDS
  user_id: string;
  gender_identity: 'mtf' | 'ftm' | 'nonbinary' | 'questioning';
  primary_goal: 'feminization' | 'masculinization' | 'general_fitness' | 'strength' | 'endurance';
  on_hrt: boolean;
  binds_chest: boolean;
  surgeries: Surgery[];
  fitness_experience: 'beginner' | 'intermediate' | 'advanced';
  workout_frequency: number; // days per week
  preferred_workout_days?: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday. e.g., [1, 3, 5] = Mon/Wed/Fri
  first_week_substitute_days?: number[]; // One-time substitute days for first week when user joins mid-week
  session_duration: number; // minutes per workout (replaces block_length) - typically 30, 45, 60, or 90
  equipment: string[];
  created_at: Date;
  updated_at: Date;
  
  // OPTIONAL FIELDS - Personal Information
  pronouns?: string; // User-specified pronouns (e.g., "she/her", "he/him", "they/them")
  chosen_name?: string; // User's chosen/preferred name for personalized greetings
  
  // OPTIONAL FIELDS - HRT Information
  hrt_type?: 'estrogen' | 'testosterone' | 'none';
  hrt_start_date?: Date; // When user started HRT
  hrt_months_duration?: number; // Computed field (calculated from hrt_start_date)
  hrt_method?: 'pills' | 'patches' | 'injections' | 'gel'; // Method of HRT administration
  hrt_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'twice_weekly'; // How often HRT is taken
  hrt_days?: string[]; // Days of week HRT is taken (e.g., ['mon', 'wed', 'fri'])
  
  // OPTIONAL FIELDS - Binding Information
  binding_frequency?: 'daily' | 'sometimes' | 'rarely' | 'never';
  binding_duration_hours?: number;
  binder_type?: 'commercial' | 'sports_bra' | 'ace_bandage' | 'diy' | 'other';
  
  // OPTIONAL FIELDS - Goals
  secondary_goals?: string[]; // Array of secondary goals (max 2)
  
  // OPTIONAL FIELDS - Dysphoria
  dysphoria_triggers?: DysphoriaTrigger[]; // Array of trigger identifiers
  dysphoria_notes?: string; // Optional free-text notes about dysphoria triggers
  
  // DEPRECATED FIELDS (kept for backwards compatibility)
  /** @deprecated Use primary_goal instead */
  goals?: string[];
  /** @deprecated Use surgeries array instead */
  constraints?: string[];
  /** @deprecated Use surgeries array instead */
  surgery_flags?: string[];
  /** @deprecated Use hrt_type, hrt_start_date, hrt_months_duration instead */
  hrt_flags?: string[];
  /** @deprecated Use fitness_experience instead */
  fitness_level?: string;
  /** @deprecated Use primary_goal instead */
  goal_weighting?: { primary: number; secondary: number; };
  
  // Training Environment (space-aware training)
  training_environment?: TrainingEnvironment;

  // OPTIONAL FIELDS - Equipment
  other_equipment_text?: string; // Free-text description of "other" equipment (for analytics)

  // Legacy fields for backward compatibility
  id?: string; // Alias for user_id
  goalWeighting?: { primary: number; secondary: number }; // Alias for goal_weighting
  preferences?: Preferences; // Legacy preferences structure
  email?: string;
  surgeon_cleared?: boolean;
  preferred_minutes?: number[];
  block_length?: number; // @deprecated Use session_duration instead
  low_sensory_mode?: boolean;
  disclaimer_acknowledged_at?: string;
  cloud_sync_enabled?: boolean;
  synced_at?: string;
  why_flags?: string[];
  body_focus_prefer?: string[];
  body_focus_soft_avoid?: string[];
}

// Training environment type for space-aware training
export type TrainingEnvironment = 'home' | 'gym' | 'studio' | 'outdoors';

// Surgery type - all gender-affirming surgeries supported by the rules engine
export type SurgeryType =
  | 'top_surgery'        // Chest masculinization / mastectomy
  | 'bottom_surgery'     // Generic bottom surgery (legacy)
  | 'vaginoplasty'       // MTF bottom surgery
  | 'phalloplasty'       // FTM bottom surgery (with donor site)
  | 'metoidioplasty'     // FTM bottom surgery (meta)
  | 'ffs'                // Facial feminization surgery
  | 'orchiectomy'        // Orchi
  | 'hysterectomy'       // Hysterectomy
  | 'breast_augmentation' // Breast augmentation
  | 'other';             // Other surgeries

// Recovery phase for post-surgical exercise appropriateness
export type RecoveryPhase = 'immediate' | 'early' | 'mid' | 'late' | 'maintenance';

// Impact level for exercise intensity classification
export type ImpactLevel = 'no_impact' | 'very_low_impact' | 'low_impact' | 'moderate_impact' | 'high_impact';

// Surgery interface
export interface Surgery {
  type: SurgeryType;
  date: Date;
  weeks_post_op?: number;
  fully_healed?: boolean; // Whether surgery is fully healed
  notes?: string;
}

// Dysphoria trigger types
export type DysphoriaTrigger =
  | 'looking_at_chest'
  | 'tight_clothing'
  | 'mirrors'
  | 'body_contact'
  | 'crowded_spaces'
  | 'locker_rooms'
  | 'voice'
  | 'swimming'        // Added: avoid aquatic exercises
  | 'photos'          // Added: avoid progress photo / camera-facing exercises
  | 'form_focused'    // Added: reduce form-intensive movements
  | 'other';

// Onboarding step types
export type OnboardingStep = 
  | 'gender_identity'
  | 'hrt_status'
  | 'binding_info'
  | 'surgery_history'
  | 'goals'
  | 'experience'
  | 'dysphoria'
  | 'review';

// Onboarding session interface
export interface OnboardingSession {
  session_id: string;
  current_step: OnboardingStep;
  total_steps: 8;
  data: Partial<Profile>;
  created_at: Date;
  updated_at: Date;
}

export type Goal = 'strength' | 'cardio' | 'flexibility' | 'mobility';
export type Constraint = 'binder_aware' | 'heavy_binding' | 'post_op' | 'hrt';

export interface Preferences {
  workoutDurations: (5 | 15 | 30 | 45)[];
  blockLength: 1 | 4;
  equipment: Equipment[];
  lowSensoryMode: boolean;
}

// UPDATED: Equipment type now flexible to accept any string from database
// Includes common types for autocomplete, but accepts any string
export type Equipment = 
  | 'bodyweight'
  | 'dumbbells' 
  | 'bands'
  | 'kettlebell'
  | 'barbell'
  | 'step'
  | 'wall'
  | 'chair'
  | 'mat'
  | string; // Allows any other equipment type from database

export interface Exercise {
  // EXISTING FIELDS - keep these
  id: string;
  name: string;
  equipment: string[]; // Changed from Equipment[] to string[] to match plan.ts
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  binder_aware: boolean;
  pelvic_floor_safe: boolean; // Renamed from pelvic_floor_aware for consistency
  tags?: string[];
  video_url?: string; // Optional video URL
  media_thumb?: string;
  media_video?: string;
  swaps?: Swap[]; // Made optional with better type
  created_at: Date;
  version: string;
  flags_reviewed: boolean;
  reviewer?: string;
  
  // ✨ ADD THESE NEW FIELDS ✨
  slug: string;
  pattern: string;
  goal: string;
  heavy_binding_safe: boolean;
  contraindications: string[];
  target_muscles?: string;
  secondary_muscles?: string;
  gender_goal_emphasis?: 'fem_very_high' | 'fem_high' | 'fem_medium' | 'fem_low' | 
                         'masc_very_high' | 'masc_high' | 'masc_medium' | 'masc_low' | 
                         'neutral';
  cue_primary?: string;
  breathing?: string;
  rep_range_beginner?: string;
  rep_range_intermediate?: string;
  rep_range_advanced?: string;
  effectiveness_rating?: number;
  source?: string;
  notes?: string;
  dysphoria_tags?: string;
  post_op_safe_weeks?: number;

  // Recovery phase fields (from research analyzer)
  recovery_phases?: RecoveryPhase[];  // Array of phases this exercise is appropriate for
  impact_level?: ImpactLevel;         // Impact classification for recovery safety
  earliest_safe_phase?: RecoveryPhase; // Earliest recovery phase when exercise can be introduced
  research_source_ids?: string[];      // UUIDs of research articles supporting this exercise

  // Keep old fields for backward compatibility
  neutral_cues?: string[];
  breathing_cues?: string[];
  
  // Additional fields from plan.ts
  pelvic_floor_aware?: boolean; // Alias for backward compatibility
  pressure_level?: 'low' | 'medium' | 'high';
  trans_notes?: {
    binder: string;
    pelvic_floor: string;
  };
  commonErrors?: string[];
  videoUrl?: string; // Alias for video_url for backward compatibility
  category?: ExerciseCategory; // Keep for backward compatibility
}

export type ExerciseCategory = 
  | 'lower_body' 
  | 'core' 
  | 'upper_push' 
  | 'upper_pull' 
  | 'cardio' 
  | 'full_body';

export interface Swap {
  exerciseId?: string; // For backward compatibility
  exercise_id?: string; // From plan.ts
  rationale: string;
}

export interface Plan {
  id: string;
  blockLength: 1 | 4;
  startDate: Date;
  goals: Goal[];
  goalWeighting: { primary: number; secondary: number };
  days: Day[];
  workoutDays?: number[]; // User's selected workout days (0=Sun, 1=Mon, ..., 6=Sat)
}

export interface Day {
  dayNumber: number;
  date: Date;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  isRestDay: boolean; // true if this is an intentional rest day
  wasRestDay?: boolean; // true if this was originally a rest day but user generated a workout
  variants: {
    30: Workout | null;
    45: Workout | null;
    60: Workout | null;
    90: Workout | null;
  };
}

export interface Workout {
  name?: string;
  duration: 30 | 45 | 60 | 90;
  exercises: ExerciseInstance[];
  totalMinutes: number;
  // Phase 2 additions - optional for backward compatibility
  warmUp?: WarmupCooldownSection;
  coolDown?: WarmupCooldownSection;
  safetyCheckpoints?: InjectedCheckpoint[];
  metadata?: WorkoutMetadata;
}

// Phase 2 warm-up/cool-down section
export interface WarmupCooldownSection {
  exercises: Array<{
    name: string;
    duration?: string;
    reps?: string;
    description?: string;
  }>;
  total_duration_minutes: number;
}

// Phase 2 safety checkpoint (injected during workout)
export interface InjectedCheckpoint {
  exercise_index: number;
  type: 'safety_reminder' | 'binder_break' | 'hydration' | 'pelvic_floor_check' | 'scar_care';
  message: string;
  severity: 'info' | 'low' | 'medium' | 'high';
  requires_acknowledgment: boolean;
}

// Phase 2 workout metadata
export interface WorkoutMetadata {
  template_name: string;
  day_focus: string;
  user_goal: string;
  hrt_adjusted: boolean;
  rules_applied: string[];
  exercises_excluded_count: number;
  total_exercises: number;
  generation_timestamp: Date;
}

export interface ExerciseInstance {
  exerciseId: string;
  sets: number;
  reps: number;
  format: 'EMOM' | 'AMRAP' | 'straight_sets';
  restSeconds: number;
  weight_guidance?: string; // Optional guidance for weight selection
}

export interface Session {
  id: string;
  planId: string;
  workoutDuration: 30 | 45 | 60 | 90;
  exercises: CompletedExercise[];
  startedAt: Date;
  completedAt: Date;
  durationMinutes: number;
}

export interface CompletedExercise {
  exerciseId: string;
  sets: CompletedSet[];
  swappedTo: string | null;
  painFlagged: boolean;
}

export interface CompletedSet {
  rpe: number;
  reps: number;
  completedAt: Date;
}

export interface Subscription {
  tier: 'free' | 'core' | 'plus';
  status: 'active' | 'trial' | 'canceled' | 'expired';
  trialEndsAt: Date | null;
  renewsAt: Date | null;
  purchaseType: 'monthly' | 'annual' | 'lifetime' | null;
}

export interface Streak {
  id: string;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: Date | null;
  graceDaysUsedThisWeek: number;
  weekStartDate: Date;
}

// NEW: Equipment option interface for UI
export interface EquipmentOption {
  value: Equipment;
  label: string;
  count: number;
}