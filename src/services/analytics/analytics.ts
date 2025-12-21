// Analytics Service for TransFitness
// PRD 3.0 requirement: Basic analytics to track key metrics
// MVP: Local storage with optional future remote sync

import * as SQLite from 'expo-sqlite';

/**
 * Event types tracked in TransFitness
 */
export type AnalyticsEventType =
  // Onboarding events
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'onboarding_abandoned'
  // Workout events
  | 'workout_generated'
  | 'workout_started'
  | 'workout_completed'
  | 'workout_abandoned'
  | 'workout_saved'
  // Education events
  | 'why_this_workout_opened'
  | 'education_snippet_viewed'
  | 'guide_opened'
  // Safety events
  | 'red_flag_triggered'
  | 'safety_checkpoint_shown'
  // User engagement
  | 'app_opened'
  | 'session_ended'
  // Survey/feedback events
  | 'survey_completed'
  | 'survey_skipped';

/**
 * Event properties that can be attached to analytics events
 */
export interface AnalyticsEventProperties {
  // Onboarding
  step_name?: string;
  step_number?: number;
  total_steps?: number;
  // Workout
  workout_id?: string;
  workout_name?: string;
  workout_duration?: number;
  exercises_count?: number;
  completion_percentage?: number;
  // Education
  guide_name?: string;
  snippet_category?: string;
  snippet_id?: string;
  // Safety
  red_flag_category?: string;
  checkpoint_type?: string;
  // General
  user_id?: string;
  timestamp?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Stored analytics event
 */
interface StoredEvent {
  id: number;
  event_type: string;
  properties: string; // JSON string
  timestamp: string;
  synced: number; // 0 or 1
}

const db = SQLite.openDatabaseSync('transfitness.db');

/**
 * Initialize analytics storage
 */
export async function initAnalytics(): Promise<void> {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        properties TEXT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0
      );
    `);

    // Create index for efficient querying
    db.execSync(`
      CREATE INDEX IF NOT EXISTS idx_analytics_timestamp
      ON analytics_events(timestamp);
    `);

    db.execSync(`
      CREATE INDEX IF NOT EXISTS idx_analytics_event_type
      ON analytics_events(event_type);
    `);

    console.log('✅ Analytics initialized');
  } catch (error) {
    console.error('❌ Failed to initialize analytics:', error);
  }
}

/**
 * Track an analytics event
 *
 * @param eventType - Type of event to track
 * @param properties - Optional properties to attach to the event
 */
export async function trackEvent(
  eventType: AnalyticsEventType,
  properties: AnalyticsEventProperties = {}
): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const propsWithTimestamp = {
      ...properties,
      timestamp,
    };

    const stmt = db.prepareSync(`
      INSERT INTO analytics_events (event_type, properties, timestamp)
      VALUES (?, ?, ?);
    `);

    stmt.executeSync([
      eventType,
      JSON.stringify(propsWithTimestamp),
      timestamp,
    ]);
    stmt.finalizeSync();

    // Log in development for debugging
    if (__DEV__) {
      console.log(`📊 [Analytics] ${eventType}`, propsWithTimestamp);
    }
  } catch (error) {
    // Don't throw - analytics should never break the app
    console.error('Analytics tracking error:', error);
  }
}

/**
 * Track onboarding progress
 */
export async function trackOnboardingStep(
  stepName: string,
  stepNumber: number,
  totalSteps: number
): Promise<void> {
  await trackEvent('onboarding_step_completed', {
    step_name: stepName,
    step_number: stepNumber,
    total_steps: totalSteps,
  });
}

/**
 * Track onboarding completion
 */
export async function trackOnboardingCompleted(): Promise<void> {
  await trackEvent('onboarding_completed');
}

/**
 * Track workout generation
 */
export async function trackWorkoutGenerated(
  workoutId: string,
  workoutName: string,
  duration: number,
  exercisesCount: number
): Promise<void> {
  await trackEvent('workout_generated', {
    workout_id: workoutId,
    workout_name: workoutName,
    workout_duration: duration,
    exercises_count: exercisesCount,
  });
}

/**
 * Track workout started
 */
export async function trackWorkoutStarted(
  workoutId: string,
  workoutName: string
): Promise<void> {
  await trackEvent('workout_started', {
    workout_id: workoutId,
    workout_name: workoutName,
  });
}

/**
 * Track workout completed
 */
export async function trackWorkoutCompleted(
  workoutId: string,
  workoutName: string,
  completionPercentage: number
): Promise<void> {
  await trackEvent('workout_completed', {
    workout_id: workoutId,
    workout_name: workoutName,
    completion_percentage: completionPercentage,
  });
}

/**
 * Track "Why this workout" opened
 */
export async function trackWhyThisWorkoutOpened(workoutId?: string): Promise<void> {
  await trackEvent('why_this_workout_opened', {
    workout_id: workoutId,
  });
}

/**
 * Track education guide opened
 */
export async function trackGuideOpened(guideName: string): Promise<void> {
  await trackEvent('guide_opened', {
    guide_name: guideName,
  });
}

/**
 * Track red flag deflection
 */
export async function trackRedFlagTriggered(
  category: string,
  query?: string
): Promise<void> {
  await trackEvent('red_flag_triggered', {
    red_flag_category: category,
    // Don't store the actual query for privacy, just category
  });
}

/**
 * Get event counts for a specific type
 *
 * @param eventType - Type of event to count
 * @param since - Optional date to count from
 * @returns Count of events
 */
export async function getEventCount(
  eventType: AnalyticsEventType,
  since?: Date
): Promise<number> {
  try {
    let query = 'SELECT COUNT(*) as count FROM analytics_events WHERE event_type = ?';
    const params: (string | number)[] = [eventType];

    if (since) {
      query += ' AND timestamp >= ?';
      params.push(since.toISOString());
    }

    const stmt = db.prepareSync(query);
    const result = stmt.executeSync(params).getAllSync() as Array<{ count: number }>;
    stmt.finalizeSync();

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Failed to get event count:', error);
    return 0;
  }
}

/**
 * Get analytics summary for dashboard/reporting
 */
export async function getAnalyticsSummary(): Promise<{
  totalWorkoutsGenerated: number;
  totalWorkoutsStarted: number;
  totalWorkoutsCompleted: number;
  whyThisWorkoutOpens: number;
  guidesOpened: number;
}> {
  try {
    const [generated, started, completed, whyOpened, guides] = await Promise.all([
      getEventCount('workout_generated'),
      getEventCount('workout_started'),
      getEventCount('workout_completed'),
      getEventCount('why_this_workout_opened'),
      getEventCount('guide_opened'),
    ]);

    return {
      totalWorkoutsGenerated: generated,
      totalWorkoutsStarted: started,
      totalWorkoutsCompleted: completed,
      whyThisWorkoutOpens: whyOpened,
      guidesOpened: guides,
    };
  } catch (error) {
    console.error('Failed to get analytics summary:', error);
    return {
      totalWorkoutsGenerated: 0,
      totalWorkoutsStarted: 0,
      totalWorkoutsCompleted: 0,
      whyThisWorkoutOpens: 0,
      guidesOpened: 0,
    };
  }
}

/**
 * Calculate key metrics for MVP success tracking
 * Based on PRD 7.0 Success Metrics
 */
export async function getMVPMetrics(): Promise<{
  workoutStartRate: number;      // % of generated workouts started
  workoutCompletionRate: number; // % of started workouts completed
  whyThisWorkoutUsage: number;   // % of sessions where Why opened
}> {
  try {
    const summary = await getAnalyticsSummary();

    const workoutStartRate =
      summary.totalWorkoutsGenerated > 0
        ? (summary.totalWorkoutsStarted / summary.totalWorkoutsGenerated) * 100
        : 0;

    const workoutCompletionRate =
      summary.totalWorkoutsStarted > 0
        ? (summary.totalWorkoutsCompleted / summary.totalWorkoutsStarted) * 100
        : 0;

    const whyThisWorkoutUsage =
      summary.totalWorkoutsStarted > 0
        ? (summary.whyThisWorkoutOpens / summary.totalWorkoutsStarted) * 100
        : 0;

    return {
      workoutStartRate: Math.round(workoutStartRate),
      workoutCompletionRate: Math.round(workoutCompletionRate),
      whyThisWorkoutUsage: Math.round(whyThisWorkoutUsage),
    };
  } catch (error) {
    console.error('Failed to calculate MVP metrics:', error);
    return {
      workoutStartRate: 0,
      workoutCompletionRate: 0,
      whyThisWorkoutUsage: 0,
    };
  }
}

/**
 * Clear all analytics data (for testing/privacy)
 */
export async function clearAnalytics(): Promise<void> {
  try {
    db.execSync('DELETE FROM analytics_events;');
    console.log('✅ Analytics cleared');
  } catch (error) {
    console.error('Failed to clear analytics:', error);
  }
}
