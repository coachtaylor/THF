import { Rule, EvaluationContext } from './types';

/**
 * User Preference Rules
 *
 * Rules that filter exercises based on explicit user-recorded preferences,
 * distinct from medical/safety rules. The list lives on the profile and is
 * user-editable from Settings → Pain-Flagged Exercises.
 */

export const userPreferenceRules: Rule[] = [
  // USR-01: Exclude exercises the user has pain-flagged mid-session.
  //
  // The list is populated by SessionPlayer.persistCompletedWorkout when a
  // workout completes with one or more pain flags. Removal is user-driven
  // ("Try again" in Settings). Empty/missing list short-circuits the
  // condition so existing profiles are unaffected until they flag something.
  {
    rule_id: 'USR-01',
    category: 'user_preference',
    severity: 'high',
    condition: (ctx: EvaluationContext) => {
      return (ctx.user_profile.flagged_exercise_ids?.length ?? 0) > 0;
    },
    action: {
      type: 'exclude_exercises',
      getCriteria: (ctx) => ({
        exercise_ids: ctx.user_profile.flagged_exercise_ids ?? [],
      }),
    },
    userMessageTemplate: "We left out {flaggedCount} exercises you flagged previously. Manage them in Settings → Pain-Flagged Exercises.",
  },
];
