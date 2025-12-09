// Analytics Service for TransFitness
// PRD 3.0 requirement: Basic analytics for MVP metrics

export {
  initAnalytics,
  trackEvent,
  trackOnboardingStep,
  trackOnboardingCompleted,
  trackWorkoutGenerated,
  trackWorkoutStarted,
  trackWorkoutCompleted,
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
