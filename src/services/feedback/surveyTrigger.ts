// Survey Trigger Logic for TransFitness
// PRD 3.0 Section 7.3: Determines when to show the beta feedback survey
// Trigger points:
// - After completing onboarding (first impression)
// - After every 2 completed workouts (ongoing feedback)
// - Manual trigger from Settings anytime
// - Max once per day

import { getSurveyState, SurveyState } from './survey';

export type SurveyTriggerPoint = 'onboarding' | 'workout' | 'manual';

export interface SurveyTriggerResult {
  shouldShow: boolean;
  triggerPoint: SurveyTriggerPoint;
  reason?: string;
}

/**
 * Check if survey should be shown after onboarding completion
 */
export async function shouldShowOnboardingSurvey(): Promise<SurveyTriggerResult> {
  try {
    const state = await getSurveyState();

    // Only show if they haven't completed onboarding survey
    if (state.hasCompletedOnboardingSurvey) {
      return {
        shouldShow: false,
        triggerPoint: 'onboarding',
        reason: 'Onboarding survey already completed',
      };
    }

    // Check if already shown survey today
    if (isAlreadyShownToday(state)) {
      return {
        shouldShow: false,
        triggerPoint: 'onboarding',
        reason: 'Survey already shown today',
      };
    }

    return {
      shouldShow: true,
      triggerPoint: 'onboarding',
    };
  } catch (error) {
    console.error('Error checking onboarding survey trigger:', error);
    return {
      shouldShow: false,
      triggerPoint: 'onboarding',
      reason: 'Error checking trigger',
    };
  }
}

/**
 * Check if survey should be shown after workout completion
 */
export async function shouldShowWorkoutSurvey(): Promise<SurveyTriggerResult> {
  try {
    const state = await getSurveyState();

    // Check if already shown survey today
    if (isAlreadyShownToday(state)) {
      return {
        shouldShow: false,
        triggerPoint: 'workout',
        reason: 'Survey already shown today',
      };
    }

    // Show after every 2 workouts
    const workoutsSinceSurvey = state.workoutsSinceSurvey + 1; // +1 for current workout
    if (workoutsSinceSurvey >= 2) {
      return {
        shouldShow: true,
        triggerPoint: 'workout',
      };
    }

    return {
      shouldShow: false,
      triggerPoint: 'workout',
      reason: `Only ${workoutsSinceSurvey} workout(s) since last survey (need 2)`,
    };
  } catch (error) {
    console.error('Error checking workout survey trigger:', error);
    return {
      shouldShow: false,
      triggerPoint: 'workout',
      reason: 'Error checking trigger',
    };
  }
}

/**
 * Check if survey can be shown manually (from Settings)
 * Manual trigger is always allowed
 */
export async function canShowManualSurvey(): Promise<SurveyTriggerResult> {
  return {
    shouldShow: true,
    triggerPoint: 'manual',
  };
}

/**
 * Helper: Check if survey was already shown today
 */
function isAlreadyShownToday(state: SurveyState): boolean {
  if (!state.lastSurveyDate) {
    return false;
  }

  const today = new Date().toISOString().split('T')[0];
  return state.lastSurveyDate === today;
}

/**
 * Get time until next survey is eligible
 * Returns null if eligible now, or a human-readable string
 */
export async function getTimeUntilNextSurvey(): Promise<string | null> {
  try {
    const state = await getSurveyState();

    if (!state.lastSurveyDate) {
      return null; // No survey taken yet, eligible
    }

    const today = new Date().toISOString().split('T')[0];

    if (state.lastSurveyDate === today) {
      return 'tomorrow';
    }

    // Check workouts remaining
    const workoutsRemaining = Math.max(0, 2 - state.workoutsSinceSurvey);
    if (workoutsRemaining > 0) {
      return `after ${workoutsRemaining} more workout${workoutsRemaining === 1 ? '' : 's'}`;
    }

    return null; // Eligible now
  } catch (error) {
    console.error('Error getting time until next survey:', error);
    return null;
  }
}
