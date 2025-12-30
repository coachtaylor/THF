// Types for workout explanation metadata
// Used by "Why this workout?" feature to surface safety logic to users

export type ExplanationCategory =
  | 'binder_safety'
  | 'post_op'
  | 'hrt'
  | 'environment'
  | 'general';

// Priority order for displaying explanations (lower = higher priority)
export const CATEGORY_PRIORITY: Record<ExplanationCategory, number> = {
  binder_safety: 1,
  post_op: 2,
  hrt: 3,
  environment: 4,
  general: 5,
};

export interface WorkoutExplanation {
  ruleId: string;
  category: ExplanationCategory;
  message: string;
  // Optional context for personalization
  context?: {
    weeksPostOp?: number;
    hrtMonths?: number;
    bindingHours?: number;
    environment?: string;
  };
}

export interface ExplanationMetadata {
  explanations: WorkoutExplanation[];
  // Generic fallback shown when no specific rules fired
  fallbackMessage: string;
}

// User-facing messages for each rule
// These are the plain-language explanations shown in the "Why this workout?" sheet
export interface RuleMessage {
  ruleId: string;
  category: ExplanationCategory;
  // Template message - can include placeholders like {weeksPostOp}
  messageTemplate: string;
}

// Default fallback messages by goal
export const FALLBACK_MESSAGES: Record<string, string> = {
  feminization: "We're building a balanced routine focused on your feminization goals, with emphasis on lower body and core work.",
  masculinization: "We're building a balanced routine focused on your masculinization goals, with emphasis on upper body development.",
  general_fitness: "We're building a balanced routine based on your goal, experience level, and recovery needs.",
  strength: "We're building a strength-focused routine with compound movements tailored to your experience level.",
  endurance: "We're building an endurance-focused routine with appropriate volume and rest periods for your level.",
  default: "We're building a balanced routine based on your goal, experience level, and recovery needs.",
};

// Helper to sort explanations by category priority
export function sortExplanationsByPriority(explanations: WorkoutExplanation[]): WorkoutExplanation[] {
  return [...explanations].sort((a, b) =>
    CATEGORY_PRIORITY[a.category] - CATEGORY_PRIORITY[b.category]
  );
}

// Helper to get fallback message based on user's goal
export function getFallbackMessage(primaryGoal?: string): string {
  if (primaryGoal && FALLBACK_MESSAGES[primaryGoal]) {
    return FALLBACK_MESSAGES[primaryGoal];
  }
  return FALLBACK_MESSAGES.default;
}

// ============================================================================
// PERSONALIZATION SUMMARY TYPES
// Used for user-facing "Why this workout?" feature on WorkoutOverviewScreen
// ============================================================================

/**
 * Extended category for personalization explanations
 */
export type PersonalizationCategory =
  | 'goal'           // Primary/secondary goal influence
  | 'body_focus'     // Body area preferences
  | 'hrt'            // HRT-related adjustments
  | 'safety'         // Post-op, binding, and other safety rules
  | 'dysphoria'      // Dysphoria-aware filtering
  | 'equipment'      // Equipment availability
  | 'experience';    // Fitness level adjustments

/**
 * Impact level of a personalization factor
 */
export type ImpactLevel = 'high' | 'medium' | 'low';

/**
 * Individual personalization explanation for the summary
 */
export interface PersonalizationExplanation {
  /** Category of the personalization factor */
  category: PersonalizationCategory;

  /** Short, user-friendly title (e.g., "Feminization Focus") */
  title: string;

  /** Longer description explaining what this means for the workout */
  description: string;

  /** How much this factor affects the workout */
  impact_level: ImpactLevel;

  /** Optional example exercises affected by this factor */
  examples?: string[];

  /** Icon name for UI rendering (optional) */
  icon?: string;
}

/**
 * Complete personalization summary for a workout
 * Used by WorkoutOverviewScreen to show "Personalized for you" section
 */
export interface WorkoutPersonalizationSummary {
  /** Primary influences (most important factors) */
  primary_influences: PersonalizationExplanation[];

  /** Secondary influences (supporting factors) */
  secondary_influences: PersonalizationExplanation[];

  /** Safety-related adjustments */
  safety_adjustments: PersonalizationExplanation[];

  /** Total number of factors applied */
  total_factors: number;
}
