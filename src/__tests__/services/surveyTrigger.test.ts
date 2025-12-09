// Survey Trigger Logic Tests
// PRD 3.0 Section 7.3: Survey trigger after onboarding + every 2 workouts (max once/day)

import {
  shouldShowOnboardingSurvey,
  shouldShowWorkoutSurvey,
  canShowManualSurvey,
  getTimeUntilNextSurvey,
} from '../../services/feedback/surveyTrigger';

// Mock the survey state module
jest.mock('../../services/feedback/survey', () => ({
  getSurveyState: jest.fn(),
}));

import { getSurveyState } from '../../services/feedback/survey';

const mockGetSurveyState = getSurveyState as jest.MockedFunction<typeof getSurveyState>;

describe('surveyTrigger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('shouldShowOnboardingSurvey', () => {
    it('returns true for first-time user after onboarding', async () => {
      mockGetSurveyState.mockResolvedValue({
        hasCompletedOnboardingSurvey: false,
        lastSurveyDate: null,
        workoutsSinceSurvey: 0,
        responses: [],
      });

      const result = await shouldShowOnboardingSurvey();
      expect(result.shouldShow).toBe(true);
      expect(result.triggerPoint).toBe('onboarding');
    });

    it('returns false if onboarding survey already completed', async () => {
      mockGetSurveyState.mockResolvedValue({
        hasCompletedOnboardingSurvey: true,
        lastSurveyDate: null,
        workoutsSinceSurvey: 0,
        responses: [],
      });

      const result = await shouldShowOnboardingSurvey();
      expect(result.shouldShow).toBe(false);
      expect(result.reason).toContain('already completed');
    });

    it('returns false if survey already shown today', async () => {
      const today = new Date().toISOString().split('T')[0];
      mockGetSurveyState.mockResolvedValue({
        hasCompletedOnboardingSurvey: false,
        lastSurveyDate: today,
        workoutsSinceSurvey: 0,
        responses: [],
      });

      const result = await shouldShowOnboardingSurvey();
      expect(result.shouldShow).toBe(false);
      expect(result.reason).toContain('already shown today');
    });

    it('handles errors gracefully', async () => {
      mockGetSurveyState.mockRejectedValue(new Error('Storage error'));

      const result = await shouldShowOnboardingSurvey();
      expect(result.shouldShow).toBe(false);
      expect(result.reason).toContain('Error');
    });
  });

  describe('shouldShowWorkoutSurvey', () => {
    it('returns true after 2 workouts', async () => {
      mockGetSurveyState.mockResolvedValue({
        hasCompletedOnboardingSurvey: true,
        lastSurveyDate: '2024-01-01', // Not today
        workoutsSinceSurvey: 1, // +1 for current = 2
        responses: [],
      });

      const result = await shouldShowWorkoutSurvey();
      expect(result.shouldShow).toBe(true);
      expect(result.triggerPoint).toBe('workout');
    });

    it('returns false after only 1 workout', async () => {
      mockGetSurveyState.mockResolvedValue({
        hasCompletedOnboardingSurvey: true,
        lastSurveyDate: '2024-01-01',
        workoutsSinceSurvey: 0, // +1 for current = 1
        responses: [],
      });

      const result = await shouldShowWorkoutSurvey();
      expect(result.shouldShow).toBe(false);
      expect(result.reason).toContain('1 workout');
    });

    it('returns false if survey already shown today (max once per day)', async () => {
      const today = new Date().toISOString().split('T')[0];
      mockGetSurveyState.mockResolvedValue({
        hasCompletedOnboardingSurvey: true,
        lastSurveyDate: today,
        workoutsSinceSurvey: 5, // Even with many workouts
        responses: [],
      });

      const result = await shouldShowWorkoutSurvey();
      expect(result.shouldShow).toBe(false);
      expect(result.reason).toContain('already shown today');
    });

    it('returns true after 3 workouts since last survey', async () => {
      mockGetSurveyState.mockResolvedValue({
        hasCompletedOnboardingSurvey: true,
        lastSurveyDate: '2024-01-01',
        workoutsSinceSurvey: 2, // +1 = 3
        responses: [],
      });

      const result = await shouldShowWorkoutSurvey();
      expect(result.shouldShow).toBe(true);
    });

    it('handles errors gracefully', async () => {
      mockGetSurveyState.mockRejectedValue(new Error('Storage error'));

      const result = await shouldShowWorkoutSurvey();
      expect(result.shouldShow).toBe(false);
      expect(result.reason).toContain('Error');
    });
  });

  describe('canShowManualSurvey', () => {
    it('always returns true for manual trigger', async () => {
      const result = await canShowManualSurvey();
      expect(result.shouldShow).toBe(true);
      expect(result.triggerPoint).toBe('manual');
    });
  });

  describe('getTimeUntilNextSurvey', () => {
    it('returns null if no survey taken yet', async () => {
      mockGetSurveyState.mockResolvedValue({
        hasCompletedOnboardingSurvey: false,
        lastSurveyDate: null,
        workoutsSinceSurvey: 0,
        responses: [],
      });

      const result = await getTimeUntilNextSurvey();
      expect(result).toBeNull();
    });

    it('returns "tomorrow" if survey taken today', async () => {
      const today = new Date().toISOString().split('T')[0];
      mockGetSurveyState.mockResolvedValue({
        hasCompletedOnboardingSurvey: true,
        lastSurveyDate: today,
        workoutsSinceSurvey: 0,
        responses: [],
      });

      const result = await getTimeUntilNextSurvey();
      expect(result).toBe('tomorrow');
    });

    it('returns workouts remaining message', async () => {
      mockGetSurveyState.mockResolvedValue({
        hasCompletedOnboardingSurvey: true,
        lastSurveyDate: '2024-01-01',
        workoutsSinceSurvey: 0,
        responses: [],
      });

      const result = await getTimeUntilNextSurvey();
      expect(result).toBe('after 2 more workouts');
    });

    it('returns singular workout message', async () => {
      mockGetSurveyState.mockResolvedValue({
        hasCompletedOnboardingSurvey: true,
        lastSurveyDate: '2024-01-01',
        workoutsSinceSurvey: 1,
        responses: [],
      });

      const result = await getTimeUntilNextSurvey();
      expect(result).toBe('after 1 more workout');
    });

    it('returns null when eligible', async () => {
      mockGetSurveyState.mockResolvedValue({
        hasCompletedOnboardingSurvey: true,
        lastSurveyDate: '2024-01-01',
        workoutsSinceSurvey: 2, // 2 workouts done
        responses: [],
      });

      const result = await getTimeUntilNextSurvey();
      expect(result).toBeNull();
    });

    it('handles errors gracefully', async () => {
      mockGetSurveyState.mockRejectedValue(new Error('Storage error'));

      const result = await getTimeUntilNextSurvey();
      expect(result).toBeNull();
    });
  });
});
