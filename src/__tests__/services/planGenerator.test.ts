// Mock exerciseService to avoid Supabase calls in tests
jest.mock('../../services/exerciseService', () => ({
  fetchAllExercises: jest.fn(() => Promise.resolve([
    {
      id: '1',
      name: 'Bodyweight Squat',
      category: 'lower_body',
      equipment: ['bodyweight', 'none'],
      difficulty: 'beginner' as const,
      tags: ['lower_body', 'strength'],
      binder_aware: true,
      heavy_binding_safe: true,
      pelvic_floor_aware: true,
      pressure_level: 'low' as const,
      neutral_cues: ['Feet hip-width apart'],
      breathing_cues: ['Inhale down', 'Exhale up'],
      swaps: [],
      trans_notes: {
        binder: 'Safe for binding',
        pelvic_floor: 'Engage core gently',
      },
      videoUrl: 'https://example.com/squat.mp4',
    },
    {
      id: '2',
      name: 'Plank',
      category: 'core',
      equipment: ['bodyweight', 'none'],
      difficulty: 'beginner' as const,
      tags: ['core', 'strength'],
      binder_aware: true,
      heavy_binding_safe: true,
      pelvic_floor_aware: true,
      pressure_level: 'low' as const,
      neutral_cues: ['Keep body straight'],
      breathing_cues: ['Breathe normally'],
      swaps: [],
      trans_notes: {
        binder: 'Safe for binding',
        pelvic_floor: 'Engage core gently',
      },
      videoUrl: 'https://example.com/plank.mp4',
    },
    {
      id: '3',
      name: 'Push-up',
      category: 'upper_push',
      equipment: ['bodyweight', 'none'],
      difficulty: 'intermediate' as const,
      tags: ['upper_body', 'strength'],
      binder_aware: true,
      heavy_binding_safe: false,
      pelvic_floor_aware: true,
      pressure_level: 'medium' as const,
      neutral_cues: ['Keep core engaged'],
      breathing_cues: ['Exhale up', 'Inhale down'],
      swaps: [],
      trans_notes: {
        binder: 'Modify if binding feels tight',
        pelvic_floor: 'Engage core',
      },
      videoUrl: 'https://example.com/pushup.mp4',
    },
    {
      id: '4',
      name: 'Jumping Jacks',
      category: 'cardio',
      equipment: ['bodyweight', 'none'],
      difficulty: 'beginner' as const,
      tags: ['cardio', 'full_body'],
      binder_aware: true,
      heavy_binding_safe: true,
      pelvic_floor_aware: true,
      pressure_level: 'low' as const,
      neutral_cues: ['Land softly'],
      breathing_cues: ['Breathe rhythmically'],
      swaps: [],
      trans_notes: {
        binder: 'Safe for binding',
        pelvic_floor: 'Engage core',
      },
      videoUrl: 'https://example.com/jumpingjacks.mp4',
    },
    {
      id: '5',
      name: 'Dumbbell Row',
      category: 'upper_pull',
      equipment: ['dumbbells'],
      difficulty: 'intermediate' as const,
      tags: ['upper_body', 'strength'],
      binder_aware: true,
      heavy_binding_safe: true,
      pelvic_floor_aware: true,
      pressure_level: 'low' as const,
      neutral_cues: ['Keep back straight'],
      breathing_cues: ['Exhale on pull'],
      swaps: [],
      trans_notes: {
        binder: 'Safe for binding',
        pelvic_floor: 'Engage core',
      },
      videoUrl: 'https://example.com/row.mp4',
    },
  ])),
}));

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
      const plan = await generatePlan(mockProfile);

      expect(plan).toHaveProperty('id');
      expect(plan).toHaveProperty('blockLength');
      expect(plan.blockLength).toBe(1);
      expect(plan.days).toHaveLength(7);
    });

    it('generates 28-day plan when blockLength is 4', async () => {
      const profileWithBlockLength4 = {
        ...mockProfile,
        block_length: 4,
      };
      const plan = await generatePlan(profileWithBlockLength4);

      expect(plan.blockLength).toBe(4);
      expect(plan.days).toHaveLength(28);
    });

    it('filters exercises by equipment', async () => {
      const profileWithEquipment = {
        ...mockProfile,
        equipment: ['bodyweight'],
      };

      const plan = await generatePlan(profileWithEquipment);

      // Plan should be generated (no errors)
      expect(plan).toBeTruthy();
    });

    it('respects goal weighting', async () => {
      const plan = await generatePlan(mockProfile);

      expect(plan.goalWeighting).toEqual(mockProfile.goal_weighting);
    });

    it('generates each day with 4 time variants (5, 15, 30, 45)', async () => {
      const plan = await generatePlan(mockProfile);

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

      const plan = await generatePlan(profileWithGoals);

      // Plan should be generated successfully
      expect(plan).toBeTruthy();
      expect(plan.goals).toEqual(['strength']);
    });
  });
});

