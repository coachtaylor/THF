// Survey Service for TransFitness Beta Feedback
// PRD 3.0 Section 7.3: User validation metrics
// Stores survey responses locally and syncs to Supabase
// SECURITY: Encrypts survey data in AsyncStorage as it may contain health-related feedback

import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackEvent } from '../analytics';
import { supabase } from '../../utils/supabase';
import { encryptValue, decryptValue } from '../../utils/encryption';

const SURVEY_STORAGE_KEY = '@transfitness:survey_responses';
const SURVEY_STATE_KEY = '@transfitness:survey_state';

export interface SurveyResponse {
  experienceScore: number;
  clarityScore: number;
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
 * SECURITY: Decrypts survey state from storage
 */
export async function initSurveyState(): Promise<SurveyState> {
  try {
    const encryptedState = await AsyncStorage.getItem(SURVEY_STATE_KEY);
    if (encryptedState) {
      const decrypted = await decryptValue(encryptedState);
      return JSON.parse(decrypted);
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
 * SECURITY: Encrypts survey state before storage
 */
async function updateSurveyState(updates: Partial<SurveyState>): Promise<void> {
  try {
    const currentState = await getSurveyState();
    const newState = { ...currentState, ...updates };
    const encrypted = await encryptValue(JSON.stringify(newState));
    await AsyncStorage.setItem(SURVEY_STATE_KEY, encrypted);
  } catch (error) {
    console.error('Error updating survey state:', error);
  }
}

/**
 * Sync survey response to Supabase
 */
async function syncSurveyToSupabase(response: SurveyResponse): Promise<void> {
  if (!supabase) {
    console.log('⚠️ Supabase not configured, skipping sync');
    return;
  }

  try {
    const { error } = await supabase.from('onboarding_feedback').insert({
      experience_score: response.experienceScore,
      clarity_score: response.clarityScore,
      feedback_text: response.feedback || null,
      trigger_point: response.triggerPoint,
      created_at: response.timestamp,
    });

    if (error) {
      console.error('❌ Supabase sync error:', error.message);
    } else {
      console.log('✅ Survey synced to Supabase');
    }
  } catch (error) {
    console.error('❌ Error syncing survey to Supabase:', error);
  }
}

/**
 * Save a survey response
 * SECURITY: Encrypts survey responses before storage
 */
export async function saveSurveyResponse(response: SurveyResponse): Promise<void> {
  try {
    // Get existing responses (encrypted)
    const encryptedResponses = await AsyncStorage.getItem(SURVEY_STORAGE_KEY);
    let responses: SurveyResponse[] = [];
    if (encryptedResponses) {
      const decrypted = await decryptValue(encryptedResponses);
      responses = JSON.parse(decrypted);
    }

    // Add new response
    responses.push(response);

    // Save updated responses locally (encrypted)
    const encrypted = await encryptValue(JSON.stringify(responses));
    await AsyncStorage.setItem(SURVEY_STORAGE_KEY, encrypted);

    // Sync to Supabase (fire and forget)
    syncSurveyToSupabase(response);

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
      experience_score: response.experienceScore,
      clarity_score: response.clarityScore,
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
 * SECURITY: Decrypts survey responses from storage
 */
export async function getSurveyResponses(): Promise<SurveyResponse[]> {
  try {
    const encryptedResponses = await AsyncStorage.getItem(SURVEY_STORAGE_KEY);
    if (encryptedResponses) {
      const decrypted = await decryptValue(encryptedResponses);
      return JSON.parse(decrypted);
    }
    return [];
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
  averageExperienceScore: number;
  averageClarityScore: number;
  totalResponses: number;
}> {
  try {
    const responses = await getSurveyResponses();

    if (responses.length === 0) {
      return {
        averageExperienceScore: 0,
        averageClarityScore: 0,
        totalResponses: 0,
      };
    }

    const totalExperience = responses.reduce((sum, r) => sum + r.experienceScore, 0);
    const totalClarity = responses.reduce((sum, r) => sum + r.clarityScore, 0);

    return {
      averageExperienceScore: totalExperience / responses.length,
      averageClarityScore: totalClarity / responses.length,
      totalResponses: responses.length,
    };
  } catch (error) {
    console.error('Error getting survey metrics:', error);
    return {
      averageExperienceScore: 0,
      averageClarityScore: 0,
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
