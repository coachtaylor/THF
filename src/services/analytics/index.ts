// Analytics Service for TransFitness
// PRD 3.0 requirement: Basic analytics for MVP metrics

export {
  initAnalytics,
  trackEvent,
  trackSignupCompleted,
  trackOnboardingStarted,
  trackOnboardingStep,
  trackOnboardingCompleted,
  trackWorkoutGenerated,
  trackPlanGenerationFailed,
  trackWorkoutStarted,
  trackWorkoutCompleted,
  trackWorkoutAbandoned,
  trackExerciseSwapUsed,
  trackWhyThisWorkoutOpened,
  trackGuideOpened,
  trackRedFlagTriggered,
  getEventCount,
  getAnalyticsSummary,
  getMVPMetrics,
  clearAnalytics,
  type AnalyticsEventType,
  type AnalyticsEventProperties,
} from './analytics';

export {
  syncAnalyticsEvents,
  syncAnalyticsEventsInBackground,
} from './sync';
