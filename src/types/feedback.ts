// TransFitness - Feedback and Issue Reporting Types
// Supports user feedback at multiple touchpoints: during session, post-workout, and general

// Feedback category types
export type FeedbackCategory =
  | 'safety_concern'      // Felt unsafe, pain, injury risk
  | 'dysphoria_trigger'   // Exercise triggered dysphoria
  | 'difficulty_issue'    // Too hard or too easy
  | 'instruction_clarity' // Unclear instructions, bad form cues
  | 'technical_bug'       // Something not working
  | 'other';              // Free text

// Feedback severity levels
export type FeedbackSeverity = 'low' | 'medium' | 'high' | 'critical';

// Context where feedback was submitted
export type FeedbackContext =
  | 'session_active'      // During active workout
  | 'session_exercise'    // From exercise detail sheet during session
  | 'post_workout'        // After workout completion
  | 'exercise_library'    // From exercise library browsing
  | 'settings'            // From settings page
  | 'general';            // Floating feedback button

// Quick feedback preset option
export interface QuickFeedbackOption {
  id: string;
  category: FeedbackCategory;
  label: string;
  icon: string; // Ionicons name
}

// Main feedback report interface
export interface FeedbackReport {
  id: string;
  user_id: string;
  category: FeedbackCategory;
  severity?: FeedbackSeverity;
  context: FeedbackContext;

  // Exercise-specific fields (optional)
  exercise_id?: string;
  exercise_name?: string;
  workout_id?: string;
  set_number?: number;

  // Quick feedback (preset options selected)
  quick_feedback?: string[]; // Array of QuickFeedbackOption ids

  // Detailed feedback
  description?: string;

  // Metadata
  created_at: string;
  synced_at?: string;
  device_info?: {
    platform: 'ios' | 'android';
    version: string;
  };
}

// Flag types for exercise-specific issues during session
export type ExerciseFlagType =
  | 'felt_off'
  | 'pain'
  | 'too_hard'
  | 'too_easy'
  | 'dysphoria'
  | 'unclear_instructions';

// Flagged exercise for post-workout review
export interface FlaggedExercise {
  exercise_id: string;
  exercise_name: string;
  flag_type: ExerciseFlagType;
  set_number?: number;
  notes?: string;
  timestamp: string;
}

// Session feedback state (in-progress workout)
export interface SessionFeedbackState {
  session_id: string;
  flagged_exercises: FlaggedExercise[];
}

// Quick feedback presets by category
export const QUICK_FEEDBACK_OPTIONS: QuickFeedbackOption[] = [
  // Safety Concerns
  { id: 'felt_pain', category: 'safety_concern', label: 'Felt pain', icon: 'medical' },
  { id: 'felt_unsafe', category: 'safety_concern', label: 'Felt unsafe', icon: 'warning' },
  { id: 'injury_risk', category: 'safety_concern', label: 'Injury risk', icon: 'alert-circle' },

  // Dysphoria Triggers
  { id: 'triggered_dysphoria', category: 'dysphoria_trigger', label: 'Triggered dysphoria', icon: 'sad' },
  { id: 'uncomfortable_movement', category: 'dysphoria_trigger', label: 'Uncomfortable movement', icon: 'body' },

  // Difficulty Issues
  { id: 'too_hard', category: 'difficulty_issue', label: 'Too hard', icon: 'trending-up' },
  { id: 'too_easy', category: 'difficulty_issue', label: 'Too easy', icon: 'trending-down' },
  { id: 'wrong_level', category: 'difficulty_issue', label: 'Wrong difficulty level', icon: 'swap-horizontal' },

  // Instruction Clarity
  { id: 'unclear_instructions', category: 'instruction_clarity', label: 'Instructions unclear', icon: 'help-circle' },
  { id: 'bad_form_cues', category: 'instruction_clarity', label: 'Bad form cues', icon: 'clipboard' },
  { id: 'missing_info', category: 'instruction_clarity', label: 'Missing information', icon: 'document' },

  // Technical Bugs
  { id: 'app_crashed', category: 'technical_bug', label: 'App crashed', icon: 'bug' },
  { id: 'feature_broken', category: 'technical_bug', label: 'Feature not working', icon: 'construct' },
  { id: 'display_issue', category: 'technical_bug', label: 'Display issue', icon: 'phone-portrait' },
];

// Exercise flag options (subset for in-session use)
export const EXERCISE_FLAG_OPTIONS: { type: ExerciseFlagType; label: string; icon: string }[] = [
  { type: 'too_hard', label: 'Too hard', icon: 'trending-up' },
  { type: 'too_easy', label: 'Too easy', icon: 'trending-down' },
  { type: 'pain', label: 'Felt pain', icon: 'medical' },
  { type: 'dysphoria', label: 'Triggered dysphoria', icon: 'sad' },
  { type: 'unclear_instructions', label: 'Instructions unclear', icon: 'help-circle' },
  { type: 'felt_off', label: 'Something else felt off', icon: 'flag' },
];

// Category display information
export const FEEDBACK_CATEGORIES: { category: FeedbackCategory; label: string; icon: string; color: string }[] = [
  { category: 'safety_concern', label: 'Safety concern', icon: 'shield', color: '#EF4444' },
  { category: 'dysphoria_trigger', label: 'Dysphoria trigger', icon: 'heart-dislike', color: '#A855F7' },
  { category: 'difficulty_issue', label: 'Difficulty issue', icon: 'fitness', color: '#F59E0B' },
  { category: 'instruction_clarity', label: 'Unclear instructions', icon: 'help-circle', color: '#3B82F6' },
  { category: 'technical_bug', label: 'Technical bug', icon: 'bug', color: '#6B7280' },
  { category: 'other', label: 'Other', icon: 'chatbubble', color: '#10B981' },
];

// Helper function to get category info
export function getCategoryInfo(category: FeedbackCategory) {
  return FEEDBACK_CATEGORIES.find(c => c.category === category) || FEEDBACK_CATEGORIES[5]; // Default to 'other'
}

// Helper function to get quick options by category
export function getQuickOptionsByCategory(category: FeedbackCategory): QuickFeedbackOption[] {
  return QUICK_FEEDBACK_OPTIONS.filter(opt => opt.category === category);
}
