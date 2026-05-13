export interface Rule {
    rule_id: string;
    category: 'binding_safety' | 'post_op' | 'hrt_adjustment' | 'dysphoria' | 'environment' | 'user_preference';
    severity: 'critical' | 'high' | 'medium' | 'low';
    condition: (context: EvaluationContext) => boolean;
    action: RuleAction;
    // User-facing explanation for "Why this workout?" feature
    userMessage?: string;
    // Template message with placeholders like {weeksPostOp}, {hrtMonths}
    userMessageTemplate?: string;
  }
  
  export interface EvaluationContext {
    user_profile: Profile;
    exercise_pool: Exercise[];
    workout_template?: WorkoutTemplate;
    current_date: Date;
  }
  
  // Rule actions support both a static value and a dynamic async resolver.
  // The evaluator (src/services/rulesEngine/evaluator.ts) checks for the
  // getXxx variant first and awaits it; otherwise it falls back to the
  // static value. Most rules use the dynamic form because their values
  // depend on the user's profile (e.g. weeks post-op, HRT phase).
  export type RuleAction =
    | {
        type: 'critical_block';
        criteria?: BlockCriteria;
        getCriteria?: (ctx: EvaluationContext) => BlockCriteria | Promise<BlockCriteria>;
      }
    | {
        type: 'exclude_exercises';
        criteria?: ExclusionCriteria;
        getCriteria?: (ctx: EvaluationContext) => ExclusionCriteria | Promise<ExclusionCriteria>;
      }
    | {
        type: 'modify_parameters';
        modification?: ParameterModification;
        getModification?: (ctx: EvaluationContext) => ParameterModification | Promise<ParameterModification>;
      }
    | { type: 'inject_checkpoint'; checkpoint: SafetyCheckpoint }
    | {
        type: 'soft_filter';
        filter?: SoftFilterCriteria;
        getFilter?: (ctx: EvaluationContext) => SoftFilterCriteria | undefined | Promise<SoftFilterCriteria | undefined>;
      };
  
  export interface BlockCriteria {
    muscle_groups?: string[];
    patterns?: string[];
    exercise_ids?: number[];
  }
  
  export interface ExclusionCriteria {
    contraindications?: string[];
    // Accepts either numeric (DB) or string (app) ids. The evaluator compares
    // by String() coercion to bridge the two id shapes safely. Used by USR-01
    // (user-flagged exercises) where the source ids are strings.
    exercise_ids?: (number | string)[];
    patterns?: string[]; // Exercise.pattern values to exclude (e.g. 'plyometric', 'hinge')
    custom_filter?: (ex: Exercise) => boolean;
  }
  
  export interface ParameterModification {
    volume_reduction_percent?: number;
    recovery_multiplier?: number;
    max_sets?: number;
    max_weight?: string;
    rep_range?: string;
    rest_seconds_increase?: number;
    rest_seconds_reduction?: number;
    progressive_overload_rate?: number;
    upper_body_volume_percent?: number;
    lower_body_volume_percent?: number;
    suggested_intensity?: 'light' | 'moderate' | 'normal';
    max_workout_minutes?: number; // SAFETY: Max workout duration for ace bandage/DIY binder users
  }
  
  export interface SafetyCheckpoint {
    type: 'binder_break' | 'scar_care' | 'sensitivity_check' | 'post_workout_reminder' | 'safety_reminder' | 'hrt_reminder';
    trigger: 'every_90_minutes' | 'before_cardio' | 'cool_down' | 'workout_completion' | 'before_strength' | 'workout_start';
    message: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
  }
  
  export interface SafetyContext {
    critical_blocks: BlockCriteria[];
    excluded_exercise_ids: number[];
    modified_parameters: ParameterModification;
    required_checkpoints: SafetyCheckpoint[];
    rules_applied: RuleApplication[];
    soft_filters: SoftFilterCriteria[];
  }
  
  export interface RuleApplication {
    rule_id: string;
    category: string;
    action_taken: string;
    context: any;
    // User-facing message explaining why this rule was applied
    userMessage?: string;
  }

  export interface SoftFilterCriteria {
    prefer_tags?: string[];
    deprioritize_tags?: string[];
    prefer_alternatives?: boolean;
  }