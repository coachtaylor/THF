// Feedback Report Service for TransFitness
// Handles user feedback and issue reports at multiple touchpoints
// Stores locally and syncs to Supabase

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import { trackEvent } from '../analytics';
import { supabase } from '../../utils/supabase';
import { db } from '../../utils/database';
import {
  FeedbackReport,
  FeedbackCategory,
  FeedbackContext,
  FeedbackSeverity,
  FlaggedExercise,
  SessionFeedbackState,
} from '../../types/feedback';

const FEEDBACK_STORAGE_KEY = '@transfitness:feedback_reports';
const SESSION_FLAGS_KEY = '@transfitness:session_flags';

/**
 * Generate a unique ID for feedback reports
 */
function generateId(): string {
  return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get device info for feedback context
 */
async function getDeviceInfo(): Promise<{ platform: 'ios' | 'android'; version: string }> {
  const version = Application.nativeApplicationVersion || '1.0.0';
  return {
    platform: Platform.OS as 'ios' | 'android',
    version,
  };
}

/**
 * Sync a single feedback report to Supabase
 */
async function syncFeedbackToSupabase(report: FeedbackReport, userId: string): Promise<boolean> {
  if (!supabase) {
    console.log('⚠️ Supabase not configured, skipping feedback sync');
    return false;
  }

  try {
    const { error } = await supabase.from('feedback_reports').insert({
      user_id: userId,
      category: report.category,
      severity: report.severity || null,
      context: report.context,
      exercise_id: report.exercise_id ? parseInt(report.exercise_id, 10) : null,
      exercise_name: report.exercise_name || null,
      workout_id: report.workout_id || null,
      set_number: report.set_number || null,
      quick_feedback: report.quick_feedback || [],
      description: report.description || null,
      device_info: report.device_info || null,
      created_at: report.created_at,
    });

    if (error) {
      console.error('❌ Supabase feedback sync error:', error.message);
      return false;
    }

    console.log('✅ Feedback synced to Supabase');
    return true;
  } catch (error) {
    console.error('❌ Error syncing feedback to Supabase:', error);
    return false;
  }
}

/**
 * Save a feedback report locally (SQLite) and sync to Supabase
 */
export async function saveFeedbackReport(
  report: Omit<FeedbackReport, 'id' | 'created_at' | 'device_info'>,
  userId: string
): Promise<void> {
  try {
    const deviceInfo = await getDeviceInfo();
    const fullReport: FeedbackReport = {
      ...report,
      id: generateId(),
      created_at: new Date().toISOString(),
      device_info: deviceInfo,
    };

    // Save to SQLite
    db.runSync(
      `INSERT INTO feedback_reports (
        id, user_id, category, severity, context, exercise_id, exercise_name,
        workout_id, set_number, quick_feedback, description, device_info, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fullReport.id,
        userId,
        fullReport.category,
        fullReport.severity || null,
        fullReport.context,
        fullReport.exercise_id || null,
        fullReport.exercise_name || null,
        fullReport.workout_id || null,
        fullReport.set_number || null,
        JSON.stringify(fullReport.quick_feedback || []),
        fullReport.description || null,
        JSON.stringify(fullReport.device_info),
        fullReport.created_at,
      ]
    );

    // Also save to AsyncStorage for redundancy
    const existingJson = await AsyncStorage.getItem(FEEDBACK_STORAGE_KEY);
    const existingReports: FeedbackReport[] = existingJson ? JSON.parse(existingJson) : [];
    existingReports.push(fullReport);
    await AsyncStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(existingReports));

    // Sync to Supabase (fire and forget)
    const synced = await syncFeedbackToSupabase(fullReport, userId);

    if (synced) {
      // Mark as synced in SQLite
      db.runSync(
        'UPDATE feedback_reports SET synced_at = ? WHERE id = ?',
        [new Date().toISOString(), fullReport.id]
      );
    }

    // Track analytics event
    await trackEvent('feedback_submitted', {
      category: fullReport.category,
      context: fullReport.context,
      has_exercise: !!fullReport.exercise_id,
      has_description: !!fullReport.description,
      quick_feedback_count: fullReport.quick_feedback?.length || 0,
    });

    console.log('✅ Feedback report saved:', fullReport.id);
  } catch (error) {
    console.error('Error saving feedback report:', error);
    throw error;
  }
}

/**
 * Get all unsynced feedback reports
 */
export function getUnsyncedFeedback(): FeedbackReport[] {
  try {
    const result = db.getAllSync<any>(
      'SELECT * FROM feedback_reports WHERE synced_at IS NULL'
    );

    return result.map(row => ({
      id: row.id,
      user_id: row.user_id,
      category: row.category as FeedbackCategory,
      severity: row.severity as FeedbackSeverity | undefined,
      context: row.context as FeedbackContext,
      exercise_id: row.exercise_id,
      exercise_name: row.exercise_name,
      workout_id: row.workout_id,
      set_number: row.set_number,
      quick_feedback: row.quick_feedback ? JSON.parse(row.quick_feedback) : [],
      description: row.description,
      device_info: row.device_info ? JSON.parse(row.device_info) : undefined,
      created_at: row.created_at,
      synced_at: row.synced_at,
    }));
  } catch (error) {
    console.error('Error getting unsynced feedback:', error);
    return [];
  }
}

/**
 * Sync all unsynced feedback to Supabase
 * Returns the count of successfully synced reports
 */
export async function syncAllUnsyncedFeedback(userId: string): Promise<number> {
  const unsyncedReports = getUnsyncedFeedback();

  if (unsyncedReports.length === 0) {
    return 0;
  }

  let syncedCount = 0;

  for (const report of unsyncedReports) {
    const synced = await syncFeedbackToSupabase(report, userId);
    if (synced) {
      db.runSync(
        'UPDATE feedback_reports SET synced_at = ? WHERE id = ?',
        [new Date().toISOString(), report.id]
      );
      syncedCount++;
    }
  }

  console.log(`✅ Synced ${syncedCount}/${unsyncedReports.length} feedback reports`);
  return syncedCount;
}

/**
 * Get all feedback reports from SQLite
 */
export function getAllFeedbackReports(): FeedbackReport[] {
  try {
    const result = db.getAllSync<any>(
      'SELECT * FROM feedback_reports ORDER BY created_at DESC'
    );

    return result.map(row => ({
      id: row.id,
      user_id: row.user_id,
      category: row.category as FeedbackCategory,
      severity: row.severity as FeedbackSeverity | undefined,
      context: row.context as FeedbackContext,
      exercise_id: row.exercise_id,
      exercise_name: row.exercise_name,
      workout_id: row.workout_id,
      set_number: row.set_number,
      quick_feedback: row.quick_feedback ? JSON.parse(row.quick_feedback) : [],
      description: row.description,
      device_info: row.device_info ? JSON.parse(row.device_info) : undefined,
      created_at: row.created_at,
      synced_at: row.synced_at,
    }));
  } catch (error) {
    console.error('Error getting all feedback reports:', error);
    return [];
  }
}

// ============ SESSION FEEDBACK (Flagged Exercises) ============

/**
 * Flag an exercise during an active session
 */
export async function flagExerciseInSession(
  sessionId: string,
  flag: FlaggedExercise
): Promise<void> {
  try {
    const stateJson = await AsyncStorage.getItem(SESSION_FLAGS_KEY);
    const state: SessionFeedbackState = stateJson
      ? JSON.parse(stateJson)
      : { session_id: sessionId, flagged_exercises: [] };

    // Update session ID if different
    if (state.session_id !== sessionId) {
      state.session_id = sessionId;
      state.flagged_exercises = [];
    }

    // Check if exercise is already flagged for this set
    const existingIndex = state.flagged_exercises.findIndex(
      f => f.exercise_id === flag.exercise_id && f.set_number === flag.set_number
    );

    if (existingIndex >= 0) {
      // Update existing flag
      state.flagged_exercises[existingIndex] = flag;
    } else {
      // Add new flag
      state.flagged_exercises.push(flag);
    }

    await AsyncStorage.setItem(SESSION_FLAGS_KEY, JSON.stringify(state));

    // Track analytics
    await trackEvent('exercise_flagged', {
      exercise_id: flag.exercise_id,
      flag_type: flag.flag_type,
      has_notes: !!flag.notes,
    });

    console.log('✅ Exercise flagged:', flag.exercise_name);
  } catch (error) {
    console.error('Error flagging exercise:', error);
    throw error;
  }
}

/**
 * Remove a flag from an exercise in the current session
 */
export async function unflagExerciseInSession(
  sessionId: string,
  exerciseId: string,
  setNumber?: number
): Promise<void> {
  try {
    const stateJson = await AsyncStorage.getItem(SESSION_FLAGS_KEY);
    if (!stateJson) return;

    const state: SessionFeedbackState = JSON.parse(stateJson);

    if (state.session_id !== sessionId) return;

    state.flagged_exercises = state.flagged_exercises.filter(
      f => !(f.exercise_id === exerciseId && (setNumber === undefined || f.set_number === setNumber))
    );

    await AsyncStorage.setItem(SESSION_FLAGS_KEY, JSON.stringify(state));
    console.log('✅ Exercise unflagged');
  } catch (error) {
    console.error('Error unflagging exercise:', error);
  }
}

/**
 * Get all flagged exercises for a session
 */
export async function getSessionFlags(sessionId: string): Promise<FlaggedExercise[]> {
  try {
    const stateJson = await AsyncStorage.getItem(SESSION_FLAGS_KEY);
    if (!stateJson) return [];

    const state: SessionFeedbackState = JSON.parse(stateJson);

    if (state.session_id !== sessionId) return [];

    return state.flagged_exercises;
  } catch (error) {
    console.error('Error getting session flags:', error);
    return [];
  }
}

/**
 * Clear all flags for a session (after workout completion or abandonment)
 */
export async function clearSessionFlags(sessionId: string): Promise<void> {
  try {
    const stateJson = await AsyncStorage.getItem(SESSION_FLAGS_KEY);
    if (!stateJson) return;

    const state: SessionFeedbackState = JSON.parse(stateJson);

    if (state.session_id === sessionId) {
      await AsyncStorage.removeItem(SESSION_FLAGS_KEY);
      console.log('✅ Session flags cleared');
    }
  } catch (error) {
    console.error('Error clearing session flags:', error);
  }
}

/**
 * Convert flagged exercises to feedback reports and submit them
 */
export async function submitFlaggedExercisesAsFeedback(
  sessionId: string,
  workoutId: string,
  userId: string
): Promise<void> {
  try {
    const flags = await getSessionFlags(sessionId);

    for (const flag of flags) {
      // Map flag type to category
      let category: FeedbackCategory = 'other';
      if (flag.flag_type === 'pain') {
        category = 'safety_concern';
      } else if (flag.flag_type === 'dysphoria') {
        category = 'dysphoria_trigger';
      } else if (flag.flag_type === 'too_hard' || flag.flag_type === 'too_easy') {
        category = 'difficulty_issue';
      } else if (flag.flag_type === 'unclear_instructions') {
        category = 'instruction_clarity';
      }

      await saveFeedbackReport(
        {
          user_id: userId,
          category,
          context: 'post_workout',
          exercise_id: flag.exercise_id,
          exercise_name: flag.exercise_name,
          workout_id: workoutId,
          set_number: flag.set_number,
          quick_feedback: [flag.flag_type],
          description: flag.notes,
        },
        userId
      );
    }

    // Clear the session flags after submitting
    await clearSessionFlags(sessionId);

    console.log(`✅ Submitted ${flags.length} flagged exercises as feedback`);
  } catch (error) {
    console.error('Error submitting flagged exercises:', error);
    throw error;
  }
}

/**
 * Clear all feedback data (for development/testing)
 */
export async function clearFeedbackData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([FEEDBACK_STORAGE_KEY, SESSION_FLAGS_KEY]);
    db.runSync('DELETE FROM feedback_reports');
    console.log('✅ Feedback data cleared');
  } catch (error) {
    console.error('Error clearing feedback data:', error);
  }
}
