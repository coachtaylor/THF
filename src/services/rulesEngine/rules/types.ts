export interface Rule {
    rule_id: string;
    category: 'binding_safety' | 'post_op' | 'hrt_adjustment' | 'dysphoria';
    severity: 'critical' | 'high' | 'medium' | 'low';
    condition: (context: EvaluationContext) => boolean;
    action: RuleAction;
  }
  
  export interface EvaluationContext {
    user_profile: Profile;
    exercise_pool: Exercise[];
    workout_template?: WorkoutTemplate;
    current_date: Date;
  }
  
  export type RuleAction = 
    | { type: 'critical_block'; criteria: BlockCriteria }
    | { type: 'exclude_exercises'; criteria: ExclusionCriteria }
    | { type: 'modify_parameters'; modification: ParameterModification }
    | { type: 'inject_checkpoint'; checkpoint: SafetyCheckpoint }
    | { type: 'soft_filter'; filter: SoftFilterCriteria };
  
  export interface BlockCriteria {
    muscle_groups?: string[];
    patterns?: string[];
    exercise_ids?: number[];
  }
  
  export interface ExclusionCriteria {
    contraindications?: string[];
    exercise_ids?: number[];
    custom_filter?: (ex: Exercise) => boolean;
  }
  
  export interface ParameterModification {
    volume_reduction_percent?: number;
    recovery_multiplier?: number;
    max_sets?: number;
    max_weight?: string;
    rep_range?: string;
    rest_seconds_increase?: number;
  }
  
  export interface SafetyCheckpoint {
    type: 'binder_break' | 'scar_care' | 'sensitivity_check' | 'post_workout_reminder';
    trigger: 'every_90_minutes' | 'before_cardio' | 'cool_down' | 'workout_completion';
    message: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
  }
  
  export interface SafetyContext {
    critical_blocks: BlockCriteria[];
    excluded_exercise_ids: number[];
    modified_parameters: ParameterModification;
    required_checkpoints: SafetyCheckpoint[];
    rules_applied: RuleApplication[];
  }
  
  export interface RuleApplication {
    rule_id: string;
    category: string;
    action_taken: string;
    context: any;
  }