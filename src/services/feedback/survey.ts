// Survey Service for TransFitness Beta Feedback
// PRD 3.0 Section 7.3: User validation metrics
// Stores survey responses locally with optional Supabase sync

import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackEvent } from '../analytics';

const SURVEY_STORAGE_KEY = '@transfitness:survey_responses';
const SURVEY_STATE_KEY = '@transfitness:survey_state';

export interface SurveyResponse {
  safetyScore: number;
  relevanceScore: number;
  sadnessLevel: 'very' | 'somewhat' | 'not_really' | null;
  feedback?: string;
  timestamp: string;
  triggerPoint: 'onboarding' | 'workout' | 'manual';
}

export interface SurveyState {
  lastSurveyDate: string | null;
  workoutsSinceSurvey: number;
  totalSurveysCompleted: number;
  hasCompletedOnboardingSurvey: boolean;
}

const DEFAULT_SURVEY_STATE: SurveyState = {
  lastSurveyDate: null,
  workoutsSinceSurvey: 0,
  totalSurveysCompleted: 0,
  hasCompletedOnboardingSurvey: false,
};

/**
 * Initialize survey state
 */
export async function initSurveyState(): Promise<SurveyState> {
  try {
    const stateJson = await AsyncStorage.getItem(SURVEY_STATE_KEY);
    if (stateJson) {
      return JSON.parse(stateJson);
    }
    return DEFAULT_SURVEY_STATE;
  } catch (error) {
    console.error('Error initializing survey state:', error);
    return DEFAULT_SURVEY_STATE;
  }
}

/**
 * Get current survey state
 */
export async function getSurveyState(): Promise<SurveyState> {
  return initSurveyState();
}

/**
 * Update survey state
 */
async function updateSurveyState(updates: Partial<SurveyState>): Promise<void> {
  try {
    const currentState = await getSurveyState();
    const newState = { ...currentState, ...updates };
    await AsyncStorage.setItem(SURVEY_STATE_KEY, JSON.stringify(newState));
  } catch (error) {
    console.error('Error updating survey state:', error);
  }
}

/**
 * Save a survey response
 */
export async function saveSurveyResponse(response: SurveyResponse): Promise<void> {
  try {
    // Get existing responses
    const responsesJson = await AsyncStorage.getItem(SURVEY_STORAGE_KEY);
    const responses: SurveyResponse[] = responsesJson ? JSON.parse(responsesJson) : [];

    // Add new response
    responses.push(response);

    // Save updated responses
    await AsyncStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(responses));

    // Update survey state
    const stateUpdates: Partial<SurveyState> = {
      lastSurveyDate: new Date().toISOString().split('T')[0],
      workoutsSinceSurvey: 0,
      totalSurveysCompleted: (await getSurveyState()).totalSurveysCompleted + 1,
    };

    if (response.triggerPoint === 'onboarding') {
      stateUpdates.hasCompletedOnboardingSurvey = true;
    }

    await updateSurveyState(stateUpdates);

    // Track analytics event
    await trackEvent('survey_completed', {
      safety_score: response.safetyScore,
      relevance_score: response.relevanceScore,
      sadness_level: response.sadnessLevel,
      trigger_point: response.triggerPoint,
      has_feedback: !!response.feedback,
    });

    console.log('✅ Survey response saved');
  } catch (error) {
    console.error('Error saving survey response:', error);
  }
}

/**
 * Track survey skip
 */
export async function trackSurveySkipped(triggerPoint: 'onboarding' | 'workout' | 'manual'): Promise<void> {
  try {
    await trackEvent('survey_skipped', {
      trigger_point: triggerPoint,
    });
  } catch (error) {
    console.error('Error tracking survey skip:', error);
  }
}

/**
 * Get all survey responses
 */
export async function getSurveyResponses(): Promise<SurveyResponse[]> {
  try {
    const responsesJson = await AsyncStorage.getItem(SURVEY_STORAGE_KEY);
    return responsesJson ? JSON.parse(responsesJson) : [];
  } catch (error) {
    console.error('Error getting survey responses:', error);
    return [];
  }
}

/**
 * Increment workout count since last survey
 * Called after each completed workout
 */
export async function incrementWorkoutCount(): Promise<void> {
  try {
    const state = await getSurveyState();
    await updateSurveyState({
      workoutsSinceSurvey: state.workoutsSinceSurvey + 1,
    });
  } catch (error) {
    console.error('Error incrementing workout count:', error);
  }
}

/**
 * Get survey metrics summary
 */
export async function getSurveyMetrics(): Promise<{
  averageSafetyScore: number;
  averageRelevanceScore: number;
  sadnessDistribution: { very: number; somewhat: number; not_really: number };
  totalResponses: number;
}> {
  try {
    const responses = await getSurveyResponses();

    if (responses.length === 0) {
      return {
        averageSafetyScore: 0,
        averageRelevanceScore: 0,
        sadnessDistribution: { very: 0, somewhat: 0, not_really: 0 },
        totalResponses: 0,
      };
    }

    const totalSafety = responses.reduce((sum, r) => sum + r.safetyScore, 0);
    const totalRelevance = responses.reduce((sum, r) => sum + r.relevanceScore, 0);

    const sadnessDistribution = { very: 0, somewhat: 0, not_really: 0 };
    responses.forEach(r => {
      if (r.sadnessLevel) {
        sadnessDistribution[r.sadnessLevel]++;
      }
    });

    return {
      averageSafetyScore: totalSafety / responses.length,
      averageRelevanceScore: totalRelevance / responses.length,
      sadnessDistribution,
      totalResponses: responses.length,
    };
  } catch (error) {
    console.error('Error getting survey metrics:', error);
    return {
      averageSafetyScore: 0,
      averageRelevanceScore: 0,
      sadnessDistribution: { very: 0, somewhat: 0, not_really: 0 },
      totalResponses: 0,
    };
  }
}

/**
 * Clear all survey data (for development/testing)
 */
export async function clearSurveyData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([SURVEY_STORAGE_KEY, SURVEY_STATE_KEY]);
    console.log('✅ Survey data cleared');
  } catch (error) {
    console.error('Error clearing survey data:', error);
  }
}
