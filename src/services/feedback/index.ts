// Feedback Service Exports
// PRD 3.0 Section 7.3: User validation metrics

export {
  saveSurveyResponse,
  trackSurveySkipped,
  getSurveyResponses,
  getSurveyState,
  getSurveyMetrics,
  incrementWorkoutCount,
  clearSurveyData,
  type SurveyResponse,
  type SurveyState,
} from './survey';

export {
  shouldShowOnboardingSurvey,
  shouldShowWorkoutSurvey,
  canShowManualSurvey,
  getTimeUntilNextSurvey,
  type SurveyTriggerPoint,
  type SurveyTriggerResult,
} from './surveyTrigger';
