import { generateQuickStartPlan, generatePlan } from '../../services/planGenerator';
import { mockProfile } from '../mocks';

// Mock exercise library
jest.mock('../../data/exercises', () => ({
  exerciseLibrary: [
    {
      id: '1',
      name: 'Bodyweight Squat',
      category: 'lower_body',
      equipment: ['bodyweight'],
      binder_aware: true,
      heavy_binding_safe: true,
      tags: ['lower_body'],
    },
    {
      id: '2',
      name: 'Plank',
      category: 'core',
      equipment: ['bodyweight'],
      binder_aware: true,
      heavy_binding_safe: true,
      tags: ['core'],
    },
  ],
}));

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
  });
});

