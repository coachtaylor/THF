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
