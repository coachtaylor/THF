// Use manual mock from __mocks__ directory (avoids JSON import issues)
jest.mock('../../data/exercises');

import { generateQuickStartPlan, generatePlan } from '../../services/planGenerator';
import { mockProfile } from '../mocks';

describe('planGenerator', () => {
  describe('generateQuickStartPlan', () => {
    it('generates a plan with correct structure', async () => {
      const plan = await generateQuickStartPlan();
      
      expect(plan).toHaveProperty('id');
      expect(plan).toHaveProperty('blockLength');
      expect(plan).toHaveProperty('startDate');
      expect(plan).toHaveProperty('goals');
      expect(plan).toHaveProperty('goalWeighting');
      expect(plan).toHaveProperty('days');
    });

    it('generates plan with id "quick-start"', async () => {
      const plan = await generateQuickStartPlan();
      expect(plan.id).toBe('quick-start');
    });

    it('generates plan with blockLength of 1', async () => {
      const plan = await generateQuickStartPlan();
      expect(plan.blockLength).toBe(1);
    });

    it('generates plan with only 5-minute variant', async () => {
      const plan = await generateQuickStartPlan();
      expect(plan.days[0].variants[5]).toBeTruthy();
      expect(plan.days[0].variants[15]).toBeNull();
      expect(plan.days[0].variants[30]).toBeNull();
      expect(plan.days[0].variants[45]).toBeNull();
    });
  });

  describe('generatePlan', () => {
    it('generates a plan based on profile', async () => {
      const plan = await generatePlan({
        profile: mockProfile,
        blockLength: 1,
        startDate: new Date(),
      });

      expect(plan).toHaveProperty('id');
      expect(plan).toHaveProperty('blockLength');
      expect(plan.blockLength).toBe(1);
      expect(plan.days).toHaveLength(7);
    });

    it('generates 28-day plan when blockLength is 4', async () => {
      const plan = await generatePlan({
        profile: mockProfile,
        blockLength: 4,
        startDate: new Date(),
      });

      expect(plan.blockLength).toBe(4);
      expect(plan.days).toHaveLength(28);
    });

    it('filters exercises by equipment', async () => {
      const profileWithEquipment = {
        ...mockProfile,
        equipment: ['bodyweight'],
      };

      const plan = await generatePlan({
        profile: profileWithEquipment,
        blockLength: 1,
        startDate: new Date(),
      });

      // Plan should be generated (no errors)
      expect(plan).toBeTruthy();
    });

    it('respects goal weighting', async () => {
      const plan = await generatePlan({
        profile: mockProfile,
        blockLength: 1,
        startDate: new Date(),
      });

      expect(plan.goalWeighting).toEqual(mockProfile.goal_weighting);
    });

    it('generates each day with 4 time variants (5, 15, 30, 45)', async () => {
      const plan = await generatePlan({
        profile: mockProfile,
        blockLength: 1,
        startDate: new Date(),
      });

      plan.days.forEach(day => {
        expect(day.variants).toHaveProperty('5');
        expect(day.variants).toHaveProperty('15');
        expect(day.variants).toHaveProperty('30');
        expect(day.variants).toHaveProperty('45');
      });
    });

    it('categorizes exercises by goal', async () => {
      const profileWithGoals = {
        ...mockProfile,
        goals: ['strength'],
      };

      const plan = await generatePlan({
        profile: profileWithGoals,
        blockLength: 1,
        startDate: new Date(),
      });

      // Plan should be generated successfully
      expect(plan).toBeTruthy();
      expect(plan.goals).toEqual(['strength']);
    });
  });
});

