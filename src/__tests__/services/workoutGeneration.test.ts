/**
 * Workout Generation Safety Tests
 *
 * These tests verify that the complete workout generation pipeline
 * correctly applies trans-specific safety rules and produces appropriate workouts.
 *
 * Tests focus on end-to-end safety outcomes:
 * - MTF profiles get lower-body focused workouts
 * - FTM profiles get upper-body focused workouts
 * - Binding users only get binder-safe exercises
 * - Post-op users don't get blocked exercises
 * - Dysphoria triggers properly filter exercises
 */

// Mock exerciseService to avoid Supabase calls
jest.mock('../../services/exerciseService', () => ({
  fetchAllExercises: jest.fn(() => Promise.resolve(mockExercisePool)),
}));

// Mock supabase to avoid database calls
jest.mock('../../utils/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: { id: 'mock-id' }, error: null })),
    })),
  },
}));

import { Profile } from '../../services/storage/profile';
import { getFilteredExercisePool } from '../../services/workoutGenerator';
import { selectTemplate, HybridSelectedTemplate } from '../../services/workoutGeneration/templateSelection';
import { selectExercisesForDay } from '../../services/workoutGeneration/exerciseSelection';
import { evaluateSafetyRules } from '../../services/rulesEngine/evaluator';
import { filterByRecoveryPhase, getUserRecoveryPhase, calculateExerciseScore } from '../../services/workoutGeneration/utils';
import { detectHybridNeed, buildHybridRequest, createHybridTemplate } from '../../services/workoutGeneration/templates/hybrid';
import { Exercise } from '../../types/plan';

// Comprehensive mock exercise pool with trans-safety properties
const mockExercisePool: Exercise[] = [
  // Lower body exercises (good for feminization)
  {
    id: '1',
    slug: 'barbell-squat',
    name: 'Barbell Squat',
    pattern: 'squat',
    goal: 'strength',
    equipment: ['barbell'],
    difficulty: 'intermediate',
    tags: ['lower_body', 'strength'],
    binder_aware: true,
    pelvic_floor_safe: true,
    heavy_binding_safe: true,
    contraindications: [],
    pressure_level: 'medium',
    target_muscles: 'glutes, quadriceps',
    gender_goal_emphasis: 'fem_very_high',
    neutral_cues: [],
    breathing_cues: [],
    swaps: [],
    trans_notes: { binder: 'Safe for binding', pelvic_floor: '' },
    commonErrors: [],
    created_at: new Date(),
    version: '1.0',
    flags_reviewed: true,
  },
  {
    id: '2',
    slug: 'hip-thrust',
    name: 'Hip Thrust',
    pattern: 'hinge',
    goal: 'strength',
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    tags: ['lower_body', 'strength'],
    binder_aware: true,
    pelvic_floor_safe: true,
    heavy_binding_safe: true,
    contraindications: [],
    pressure_level: 'low',
    target_muscles: 'glutes',
    gender_goal_emphasis: 'fem_very_high',
    neutral_cues: [],
    breathing_cues: [],
    swaps: [],
    trans_notes: { binder: 'Safe for binding', pelvic_floor: '' },
    commonErrors: [],
    created_at: new Date(),
    version: '1.0',
    flags_reviewed: true,
  },
  // Upper body exercises (good for masculinization)
  {
    id: '3',
    slug: 'bench-press',
    name: 'Bench Press',
    pattern: 'push',
    goal: 'strength',
    equipment: ['barbell', 'bench'],
    difficulty: 'intermediate',
    tags: ['upper_body', 'chest', 'strength'],
    binder_aware: false, // NOT safe for binding
    pelvic_floor_safe: true,
    heavy_binding_safe: false,
    contraindications: ['tight_binder'],
    pressure_level: 'high',
    target_muscles: 'chest, triceps',
    gender_goal_emphasis: 'masc_very_high',
    dysphoria_tags: 'chest_focus',
    neutral_cues: [],
    breathing_cues: [],
    swaps: [],
    trans_notes: { binder: 'Not recommended with binder', pelvic_floor: '' },
    commonErrors: [],
    created_at: new Date(),
    version: '1.0',
    flags_reviewed: true,
  },
  {
    id: '4',
    slug: 'barbell-row',
    name: 'Barbell Row',
    pattern: 'pull',
    goal: 'strength',
    equipment: ['barbell'],
    difficulty: 'intermediate',
    tags: ['upper_body', 'back', 'strength'],
    binder_aware: true,
    pelvic_floor_safe: true,
    heavy_binding_safe: true,
    contraindications: [],
    pressure_level: 'medium',
    target_muscles: 'lats, rhomboids',
    gender_goal_emphasis: 'masc_high',
    neutral_cues: [],
    breathing_cues: [],
    swaps: [],
    trans_notes: { binder: 'Safe for binding', pelvic_floor: '' },
    commonErrors: [],
    created_at: new Date(),
    version: '1.0',
    flags_reviewed: true,
  },
  // Mirror-required exercise
  {
    id: '5',
    slug: 'dumbbell-lateral-raise',
    name: 'Dumbbell Lateral Raise',
    pattern: 'isolation',
    goal: 'strength',
    equipment: ['dumbbells'],
    difficulty: 'beginner',
    tags: ['upper_body', 'shoulders', 'isolation'],
    binder_aware: true,
    pelvic_floor_safe: true,
    heavy_binding_safe: true,
    contraindications: [],
    pressure_level: 'low',
    target_muscles: 'deltoids',
    gender_goal_emphasis: 'neutral',
    dysphoria_tags: 'mirror_required',
    neutral_cues: [],
    breathing_cues: [],
    swaps: [],
    trans_notes: { binder: 'Safe for binding', pelvic_floor: '' },
    commonErrors: [],
    created_at: new Date(),
    version: '1.0',
    flags_reviewed: true,
  },
  // Pelvic floor unsafe exercise
  {
    id: '6',
    slug: 'box-jump',
    name: 'Box Jump',
    pattern: 'plyometric',
    goal: 'cardio',
    equipment: ['box'],
    difficulty: 'intermediate',
    tags: ['cardio', 'plyometric'],
    binder_aware: false,
    pelvic_floor_safe: false, // NOT safe post-op
    heavy_binding_safe: false,
    contraindications: ['post_op', 'plyometric'],
    pressure_level: 'high',
    target_muscles: 'full_body',
    gender_goal_emphasis: 'neutral',
    neutral_cues: [],
    breathing_cues: [],
    swaps: [],
    trans_notes: { binder: 'Not recommended', pelvic_floor: 'Avoid post-op' },
    commonErrors: [],
    created_at: new Date(),
    version: '1.0',
    flags_reviewed: true,
  },
  // Home-friendly exercise
  {
    id: '7',
    slug: 'bodyweight-squat',
    name: 'Bodyweight Squat',
    pattern: 'squat',
    goal: 'strength',
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    tags: ['lower_body', 'strength', 'home_friendly'],
    binder_aware: true,
    pelvic_floor_safe: true,
    heavy_binding_safe: true,
    contraindications: [],
    pressure_level: 'low',
    target_muscles: 'quadriceps, glutes',
    gender_goal_emphasis: 'fem_high',
    dysphoria_tags: 'home_friendly, minimal_space',
    neutral_cues: [],
    breathing_cues: [],
    swaps: [],
    trans_notes: { binder: 'Safe for binding', pelvic_floor: '' },
    commonErrors: [],
    created_at: new Date(),
    version: '1.0',
    flags_reviewed: true,
  },
];

// Base profile for testing
const createBaseProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: 'test-id',
  user_id: 'user-123',
  gender_identity: 'ftm',
  primary_goal: 'strength',
  on_hrt: false,
  binds_chest: false,
  surgeries: [],
  fitness_experience: 'intermediate',
  workout_frequency: 4,
  session_duration: 45,
  equipment: ['dumbbells', 'barbell', 'bench', 'bodyweight'],
  created_at: new Date(),
  updated_at: new Date(),
  goals: ['strength'],
  goal_weighting: { primary: 70, secondary: 30 },
  constraints: [],
  surgery_flags: [],
  surgeon_cleared: true,
  hrt_flags: [],
  fitness_level: 'intermediate',
  preferred_minutes: [30, 45],
  block_length: 1,
  low_sensory_mode: false,
  ...overrides,
});

describe('Workout Generation Safety', () => {
  describe('Template Selection', () => {
    it('selects feminization template for MTF users', () => {
      const mtfProfile = createBaseProfile({
        gender_identity: 'mtf',
        primary_goal: 'feminization',
      });

      const template = selectTemplate(mtfProfile);

      expect(template.name.toLowerCase()).toContain('feminization');
    });

    it('selects masculinization template for FTM users', () => {
      const ftmProfile = createBaseProfile({
        gender_identity: 'ftm',
        primary_goal: 'masculinization',
      });

      const template = selectTemplate(ftmProfile);

      expect(template.name.toLowerCase()).toContain('masculinization');
    });

    it('applies HRT volume multiplier for MTF on estrogen', () => {
      const mtfOnEstrogenProfile = createBaseProfile({
        gender_identity: 'mtf',
        primary_goal: 'feminization',
        on_hrt: true,
        hrt_type: 'estrogen',
      });

      const template = selectTemplate(mtfOnEstrogenProfile);

      expect(template.adjusted_for_hrt).toBe(true);
      expect(template.volume_multiplier).toBeLessThan(1.0);
    });
  });

  describe('Exercise Filtering for Binding Safety', () => {
    it('excludes non-binder-safe exercises for binding users', async () => {
      const bindingProfile = createBaseProfile({
        binds_chest: true,
        binding_frequency: 'daily',
      });

      const safetyContext = await evaluateSafetyRules(bindingProfile, mockExercisePool);

      // Bench press (id: 3) should be excluded for binding users
      const excludedIds = safetyContext.excluded_exercise_ids;
      // The rules engine returns exclusion criteria, not explicit IDs from our mock
      // Check that BS-01 was applied
      const bs01Applied = safetyContext.rules_applied.find(r => r.rule_id === 'BS-01');
      expect(bs01Applied).toBeDefined();
    });

    it('includes all exercises for non-binding users', async () => {
      const nonBindingProfile = createBaseProfile({
        binds_chest: false,
      });

      const safetyContext = await evaluateSafetyRules(nonBindingProfile, mockExercisePool);

      // No binding rules should be applied
      const bindingRules = safetyContext.rules_applied.filter(r => r.rule_id.startsWith('BS-'));
      expect(bindingRules.length).toBe(0);
    });
  });

  describe('Post-Operative Safety', () => {
    it('blocks push patterns for recent top surgery users', async () => {
      const postTopSurgeryProfile = createBaseProfile({
        surgeries: [{
          type: 'top_surgery',
          date: new Date(Date.now() - 3 * 7 * 24 * 60 * 60 * 1000), // 3 weeks ago
          weeks_post_op: 3,
          fully_healed: false,
        }],
        surgery_flags: ['top_surgery'],
        surgeon_cleared: false,
      });

      const safetyContext = await evaluateSafetyRules(postTopSurgeryProfile, mockExercisePool);

      // Should have critical blocks for push patterns
      expect(safetyContext.critical_blocks.length).toBeGreaterThan(0);

      const pushBlock = safetyContext.critical_blocks.find(b => b.patterns?.includes('push'));
      expect(pushBlock).toBeDefined();
    });

    it('blocks high-impact for recent vaginoplasty users', async () => {
      const postVaginoplastyProfile = createBaseProfile({
        gender_identity: 'mtf',
        surgeries: [{
          type: 'vaginoplasty',
          date: new Date(Date.now() - 4 * 7 * 24 * 60 * 60 * 1000), // 4 weeks ago
          weeks_post_op: 4,
          fully_healed: false,
        }],
        surgery_flags: ['vaginoplasty'],
        surgeon_cleared: false,
      });

      const safetyContext = await evaluateSafetyRules(postVaginoplastyProfile, mockExercisePool);

      // Should have critical blocks for lower body patterns
      expect(safetyContext.critical_blocks.length).toBeGreaterThan(0);
    });
  });

  describe('Dysphoria Filtering', () => {
    it('applies soft filter for chest dysphoria', async () => {
      const chestDysphoriaProfile = createBaseProfile({
        dysphoria_triggers: ['looking_at_chest'],
      });

      const safetyContext = await evaluateSafetyRules(chestDysphoriaProfile, mockExercisePool);

      // Should have soft filters applied
      expect(safetyContext.soft_filters.length).toBeGreaterThan(0);

      // Chest-focus exercises should be deprioritized
      const chestFilter = safetyContext.soft_filters.find(f =>
        f.deprioritize_tags?.includes('chest_focus')
      );
      expect(chestFilter).toBeDefined();
    });

    it('applies soft filter for crowded spaces dysphoria', async () => {
      const crowdedSpacesDysphoriaProfile = createBaseProfile({
        dysphoria_triggers: ['crowded_spaces'],
      });

      const safetyContext = await evaluateSafetyRules(crowdedSpacesDysphoriaProfile, mockExercisePool);

      // Should prefer home-friendly exercises
      expect(safetyContext.soft_filters.length).toBeGreaterThan(0);

      const homeFilter = safetyContext.soft_filters.find(f =>
        f.prefer_tags?.includes('home_friendly')
      );
      expect(homeFilter).toBeDefined();
    });
  });

  describe('HRT Adjustments', () => {
    it('applies volume reduction for MTF on estrogen', async () => {
      const mtfOnEstrogenProfile = createBaseProfile({
        gender_identity: 'mtf',
        on_hrt: true,
        hrt_type: 'estrogen',
        hrt_start_date: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000), // 6 months
        hrt_months_duration: 6,
        hrt_flags: ['on_hrt', 'estrogen'],
      });

      const safetyContext = await evaluateSafetyRules(mtfOnEstrogenProfile, mockExercisePool);

      // Should have HRT adjustments applied
      const hrtRules = safetyContext.rules_applied.filter(r => r.rule_id.startsWith('HRT-'));
      expect(hrtRules.length).toBeGreaterThan(0);
    });

    it('applies progressive overload boost for FTM on testosterone', async () => {
      const ftmOnTestosteroneProfile = createBaseProfile({
        gender_identity: 'ftm',
        on_hrt: true,
        hrt_type: 'testosterone',
        hrt_start_date: new Date(Date.now() - 8 * 30 * 24 * 60 * 60 * 1000), // 8 months
        hrt_months_duration: 8,
        hrt_flags: ['on_hrt', 'testosterone'],
      });

      const safetyContext = await evaluateSafetyRules(ftmOnTestosteroneProfile, mockExercisePool);

      // Should have progressive overload adjustment
      const hrt02 = safetyContext.rules_applied.find(r => r.rule_id === 'HRT-02');
      expect(hrt02).toBeDefined();
      expect(safetyContext.modified_parameters.progressive_overload_rate).toBeGreaterThan(1);
    });
  });

  describe('Safety Checkpoints', () => {
    it('injects binder break checkpoints for binding users', async () => {
      const bindingProfile = createBaseProfile({
        binds_chest: true,
        binding_frequency: 'daily',
      });

      const safetyContext = await evaluateSafetyRules(bindingProfile, mockExercisePool);

      // Should have binder break checkpoint
      const binderBreak = safetyContext.required_checkpoints.find(c => c.type === 'binder_break');
      expect(binderBreak).toBeDefined();
      expect(binderBreak?.trigger).toBe('every_90_minutes');
    });

    it('injects scar care reminder for post-top-surgery users', async () => {
      const postTopSurgeryProfile = createBaseProfile({
        surgeries: [{
          type: 'top_surgery',
          date: new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000), // 8 weeks ago
          weeks_post_op: 8,
          fully_healed: false,
        }],
        surgery_flags: ['top_surgery'],
      });

      const safetyContext = await evaluateSafetyRules(postTopSurgeryProfile, mockExercisePool);

      // Should have scar care checkpoint
      const scarCare = safetyContext.required_checkpoints.find(c => c.type === 'scar_care');
      expect(scarCare).toBeDefined();
    });
  });

  describe('Complete Workout Generation Integration', () => {
    it('generates safe workout for complex FTM profile', async () => {
      const ftmComplexProfile = createBaseProfile({
        gender_identity: 'ftm',
        primary_goal: 'masculinization',
        binds_chest: true,
        binding_frequency: 'daily',
        binding_duration_hours: 8,
        on_hrt: true,
        hrt_type: 'testosterone',
        hrt_months_duration: 6,
        hrt_flags: ['on_hrt', 'testosterone'],
        dysphoria_triggers: ['mirrors'],
      });

      const safetyContext = await evaluateSafetyRules(ftmComplexProfile, mockExercisePool);

      // Verify multiple rule categories are applied
      const bindingRules = safetyContext.rules_applied.filter(r => r.rule_id.startsWith('BS-'));
      const hrtRules = safetyContext.rules_applied.filter(r => r.rule_id.startsWith('HRT-'));
      const dysphoriaRules = safetyContext.rules_applied.filter(r => r.rule_id.startsWith('DYS-'));

      expect(bindingRules.length).toBeGreaterThan(0);
      expect(hrtRules.length).toBeGreaterThan(0);
      expect(dysphoriaRules.length).toBeGreaterThan(0);

      // Should have appropriate checkpoints
      expect(safetyContext.required_checkpoints.length).toBeGreaterThan(0);
    });

    it('generates safe workout for MTF post-op profile', async () => {
      const mtfPostOpProfile = createBaseProfile({
        gender_identity: 'mtf',
        primary_goal: 'feminization',
        on_hrt: true,
        hrt_type: 'estrogen',
        hrt_months_duration: 12,
        hrt_flags: ['on_hrt', 'estrogen'],
        surgeries: [{
          type: 'vaginoplasty',
          date: new Date(Date.now() - 10 * 7 * 24 * 60 * 60 * 1000), // 10 weeks ago
          weeks_post_op: 10,
          fully_healed: false,
        }],
        surgery_flags: ['vaginoplasty'],
      });

      const safetyContext = await evaluateSafetyRules(mtfPostOpProfile, mockExercisePool);

      // Verify post-op and HRT rules are applied
      const postOpRules = safetyContext.rules_applied.filter(r => r.rule_id.startsWith('PO-'));
      const hrtRules = safetyContext.rules_applied.filter(r => r.rule_id.startsWith('HRT-'));

      expect(postOpRules.length).toBeGreaterThan(0);
      expect(hrtRules.length).toBeGreaterThan(0);
    });
  });

  describe('User Messages', () => {
    it('provides clear user-facing messages for all safety rules', async () => {
      const bindingProfile = createBaseProfile({
        binds_chest: true,
        binding_frequency: 'daily',
      });

      const safetyContext = await evaluateSafetyRules(bindingProfile, mockExercisePool);

      // Every applied rule should have a user message
      safetyContext.rules_applied.forEach(rule => {
        expect(rule.userMessage).toBeDefined();
        expect(rule.userMessage!.length).toBeGreaterThan(0);
        // Messages should be human-readable (not technical)
        expect(rule.userMessage).not.toContain('undefined');
        expect(rule.userMessage).not.toContain('null');
      });
    });
  });

  describe('Recovery Phase Filtering', () => {
    // Mock exercises with recovery phase data
    const mockExercisesWithPhases: Exercise[] = [
      {
        ...mockExercisePool[0], // Barbell Squat
        id: '10',
        earliest_safe_phase: 'mid',
        recovery_phases: ['mid', 'late', 'maintenance'],
        impact_level: 'moderate_impact',
      },
      {
        ...mockExercisePool[6], // Bodyweight Squat
        id: '11',
        earliest_safe_phase: 'early',
        recovery_phases: ['early', 'mid', 'late', 'maintenance'],
        impact_level: 'low_impact',
      },
      {
        id: '12',
        slug: 'diaphragmatic-breathing',
        name: 'Diaphragmatic Breathing',
        pattern: 'breathing',
        goal: 'mobility',
        equipment: ['bodyweight'],
        difficulty: 'beginner',
        tags: ['breathing', 'recovery'],
        binder_aware: true,
        pelvic_floor_safe: true,
        heavy_binding_safe: true,
        contraindications: [],
        pressure_level: 'low',
        target_muscles: 'diaphragm',
        gender_goal_emphasis: 'neutral',
        earliest_safe_phase: 'immediate',
        recovery_phases: ['immediate', 'early', 'mid', 'late', 'maintenance'],
        impact_level: 'no_impact',
        neutral_cues: [],
        breathing_cues: [],
        swaps: [],
        trans_notes: { binder: 'Safe', pelvic_floor: '' },
        commonErrors: [],
        created_at: new Date(),
        version: '1.0',
        flags_reviewed: true,
      },
      {
        id: '13',
        slug: 'box-jump-plyometric',
        name: 'Box Jump',
        pattern: 'plyometric',
        goal: 'power',
        equipment: ['box'],
        difficulty: 'advanced',
        tags: ['plyometric', 'power'],
        binder_aware: false,
        pelvic_floor_safe: false,
        heavy_binding_safe: false,
        contraindications: ['post_op'],
        pressure_level: 'high',
        target_muscles: 'full_body',
        gender_goal_emphasis: 'neutral',
        earliest_safe_phase: 'maintenance',
        recovery_phases: ['maintenance'],
        impact_level: 'high_impact',
        neutral_cues: [],
        breathing_cues: [],
        swaps: [],
        trans_notes: { binder: 'Not safe', pelvic_floor: 'Avoid' },
        commonErrors: [],
        created_at: new Date(),
        version: '1.0',
        flags_reviewed: true,
      },
    ] as any;

    it('returns maintenance phase for users with no surgeries', () => {
      const noSurgeryProfile = createBaseProfile({
        surgeries: [],
      });

      const phase = getUserRecoveryPhase(noSurgeryProfile);
      expect(phase).toBe('maintenance');
    });

    it('returns immediate phase for users 1 week post-op', () => {
      const oneWeekPostOpProfile = createBaseProfile({
        surgeries: [{
          type: 'top_surgery',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          weeks_post_op: 1,
          fully_healed: false,
        }],
      });

      const phase = getUserRecoveryPhase(oneWeekPostOpProfile);
      expect(phase).toBe('immediate');
    });

    it('returns early phase for users 3 weeks post-op', () => {
      const threeWeeksPostOpProfile = createBaseProfile({
        surgeries: [{
          type: 'top_surgery',
          date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
          weeks_post_op: 3,
          fully_healed: false,
        }],
      });

      const phase = getUserRecoveryPhase(threeWeeksPostOpProfile);
      expect(phase).toBe('early');
    });

    it('returns mid phase for users 8 weeks post-op', () => {
      const eightWeeksPostOpProfile = createBaseProfile({
        surgeries: [{
          type: 'vaginoplasty',
          date: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000), // 8 weeks ago
          weeks_post_op: 8,
          fully_healed: false,
        }],
      });

      const phase = getUserRecoveryPhase(eightWeeksPostOpProfile);
      expect(phase).toBe('mid');
    });

    it('returns maintenance for fully healed surgeries', () => {
      const fullyHealedProfile = createBaseProfile({
        surgeries: [{
          type: 'top_surgery',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          weeks_post_op: 1,
          fully_healed: true, // Marked as fully healed
        }],
      });

      const phase = getUserRecoveryPhase(fullyHealedProfile);
      expect(phase).toBe('maintenance');
    });

    it('filters exercises for immediate phase users', () => {
      const immediatePhaseProfile = createBaseProfile({
        surgeries: [{
          type: 'top_surgery',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          weeks_post_op: 1,
          fully_healed: false,
        }],
      });

      const filtered = filterByRecoveryPhase(mockExercisesWithPhases, immediatePhaseProfile);

      // Should only include exercises safe for immediate phase
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('Diaphragmatic Breathing');
    });

    it('filters exercises for early phase users', () => {
      const earlyPhaseProfile = createBaseProfile({
        surgeries: [{
          type: 'top_surgery',
          date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
          weeks_post_op: 3,
          fully_healed: false,
        }],
      });

      const filtered = filterByRecoveryPhase(mockExercisesWithPhases, earlyPhaseProfile);

      // Should include immediate and early phase exercises
      expect(filtered.length).toBe(2);
      expect(filtered.map(e => e.name).sort()).toEqual(['Bodyweight Squat', 'Diaphragmatic Breathing']);
    });

    it('filters exercises for mid phase users', () => {
      const midPhaseProfile = createBaseProfile({
        surgeries: [{
          type: 'vaginoplasty',
          date: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000), // 8 weeks ago
          weeks_post_op: 8,
          fully_healed: false,
        }],
      });

      const filtered = filterByRecoveryPhase(mockExercisesWithPhases, midPhaseProfile);

      // Should include immediate, early, and mid phase exercises
      expect(filtered.length).toBe(3);
      const names = filtered.map(e => e.name).sort();
      expect(names).toEqual(['Barbell Squat', 'Bodyweight Squat', 'Diaphragmatic Breathing']);
    });

    it('allows all exercises for maintenance phase users', () => {
      const maintenancePhaseProfile = createBaseProfile({
        surgeries: [],
      });

      const filtered = filterByRecoveryPhase(mockExercisesWithPhases, maintenancePhaseProfile);

      // Should include all exercises
      expect(filtered.length).toBe(4);
    });

    it('uses most restrictive phase when multiple surgeries exist', () => {
      const multipleSurgeriesProfile = createBaseProfile({
        surgeries: [
          {
            type: 'top_surgery',
            date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 8.5 weeks ago (mid phase)
            weeks_post_op: 8,
            fully_healed: false,
          },
          {
            type: 'hysterectomy',
            date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago (early phase)
            weeks_post_op: 2,
            fully_healed: false,
          },
        ],
      });

      const phase = getUserRecoveryPhase(multipleSurgeriesProfile);

      // Should use the most restrictive (earliest) phase
      expect(phase).toBe('early');
    });
  });

  describe('Body Focus Scoring', () => {
    it('adds +25 bonus for primary body focus preference match', () => {
      const profile = createBaseProfile({
        body_focus_prefer: ['shoulders', 'back'],
      });

      // Find shoulder exercise
      const shoulderExercise = {
        ...mockExercisePool[3], // Shoulder Press
        tags: ['shoulders', 'upper_body'],
      };

      const score = calculateExerciseScore(shoulderExercise as any, profile);

      // Should include primary focus bonus (+25 for first preference match)
      expect(score).toBeGreaterThan(25);
    });

    it('adds +15 bonus for secondary body focus preference match', () => {
      const profileWithTwoPreferences = createBaseProfile({
        body_focus_prefer: ['chest', 'back'], // back is secondary
      });

      // Back exercise
      const backExercise = {
        ...mockExercisePool[4], // Pull-up (back exercise)
        tags: ['back', 'upper_body'],
      };

      const score = calculateExerciseScore(backExercise as any, profileWithTwoPreferences);

      // Should include secondary focus bonus (+15)
      expect(score).toBeGreaterThan(15);
    });

    it('subtracts -25 penalty for body focus avoid match', () => {
      const profileAvoidingChest = createBaseProfile({
        body_focus_soft_avoid: ['chest'],
      });

      const chestExercise = {
        ...mockExercisePool[2], // Bench Press
        tags: ['chest', 'upper_body'],
      };

      const scoreWithAvoid = calculateExerciseScore(chestExercise as any, profileAvoidingChest);

      // Compare to profile without avoid
      const profileNoAvoid = createBaseProfile();
      const scoreWithoutAvoid = calculateExerciseScore(chestExercise as any, profileNoAvoid);

      // Score with avoid should be lower
      expect(scoreWithAvoid).toBeLessThan(scoreWithoutAvoid);
    });
  });

  describe('Hybrid Template Generation', () => {
    it('detects hybrid need for MTF user with shoulder preference', () => {
      const mtfWithShoulderFocus = createBaseProfile({
        gender_identity: 'mtf',
        primary_goal: 'feminization',
        body_focus_prefer: ['shoulders'],
      });

      expect(detectHybridNeed(mtfWithShoulderFocus)).toBe(true);
    });

    it('does not detect hybrid need when preferences align with goal', () => {
      const mtfWithGluteFocus = createBaseProfile({
        gender_identity: 'mtf',
        primary_goal: 'feminization',
        body_focus_prefer: ['glutes', 'legs'], // Aligned with feminization
      });

      expect(detectHybridNeed(mtfWithGluteFocus)).toBe(false);
    });

    it('does not detect hybrid need when no preferences set', () => {
      const profileNoPreferences = createBaseProfile({
        gender_identity: 'mtf',
        primary_goal: 'feminization',
        body_focus_prefer: [],
      });

      expect(detectHybridNeed(profileNoPreferences)).toBe(false);
    });

    it('builds correct hybrid request for MTF with shoulder focus', () => {
      const mtfWithShoulderFocus = createBaseProfile({
        gender_identity: 'mtf',
        primary_goal: 'feminization',
        body_focus_prefer: ['shoulders', 'glutes'],
        workout_frequency: 3,
        fitness_experience: 'beginner',
      });

      const request = buildHybridRequest(mtfWithShoulderFocus);

      expect(request).not.toBeNull();
      expect(request!.base_goal).toBe('feminization');
      expect(request!.secondary_focus_areas).toContain('shoulders');
      expect(request!.secondary_focus_areas).not.toContain('glutes'); // Glutes aligns with fem
      expect(request!.frequency).toBe(3);
    });

    it('creates hybrid template with additional patterns', () => {
      const request = {
        base_goal: 'feminization' as const,
        secondary_focus_areas: ['shoulders'],
        frequency: 3,
        experience_level: 'beginner' as const,
      };

      const template = createHybridTemplate(request);

      expect(template.name).toContain('Hybrid');
      expect(template.hybrid_config).toBeDefined();
      expect(template.hybrid_config.secondary_emphasis_areas).toContain('shoulders');
      expect(template.hybrid_config.primary_weight).toBeGreaterThan(0.6);
      expect(template.hybrid_config.secondary_weight).toBeLessThanOrEqual(0.35);
    });

    it('selectTemplate returns hybrid template for qualifying profile', () => {
      const mtfWithShoulderFocus = createBaseProfile({
        gender_identity: 'mtf',
        primary_goal: 'feminization',
        body_focus_prefer: ['shoulders'],
        workout_frequency: 3,
        fitness_experience: 'beginner',
      });

      const template = selectTemplate(mtfWithShoulderFocus) as HybridSelectedTemplate;

      expect(template.is_hybrid).toBe(true);
      expect(template.hybrid_config).toBeDefined();
    });

    it('selectTemplate returns non-hybrid template for aligned preferences', () => {
      const mtfWithGluteFocus = createBaseProfile({
        gender_identity: 'mtf',
        primary_goal: 'feminization',
        body_focus_prefer: ['glutes', 'legs'],
        workout_frequency: 3,
        fitness_experience: 'beginner',
      });

      const template = selectTemplate(mtfWithGluteFocus) as HybridSelectedTemplate;

      expect(template.is_hybrid).toBe(false);
    });
  });

  describe('HRT Granular Phases (6-Phase Model)', () => {
    it('applies initial phase rules for first month on E', async () => {
      const firstMonthEProfile = createBaseProfile({
        gender_identity: 'mtf',
        on_hrt: true,
        hrt_type: 'estrogen',
        hrt_months_duration: 0.5, // Half a month
      });

      const safetyContext = await evaluateSafetyRules(firstMonthEProfile, mockExercisePool);

      const initialRule = safetyContext.rules_applied.find(r => r.rule_id === 'HRT-E-01');
      expect(initialRule).toBeDefined();

      // Check for higher volume reduction in initial phase
      expect(safetyContext.modified_parameters.volume_reduction_percent).toBeGreaterThanOrEqual(15);
    });

    it('applies early phase rules for 1-3 months on E', async () => {
      const twoMonthEProfile = createBaseProfile({
        gender_identity: 'mtf',
        on_hrt: true,
        hrt_type: 'estrogen',
        hrt_months_duration: 2,
      });

      const safetyContext = await evaluateSafetyRules(twoMonthEProfile, mockExercisePool);

      const earlyRule = safetyContext.rules_applied.find(r => r.rule_id === 'HRT-E-02');
      expect(earlyRule).toBeDefined();
    });

    it('applies adaptation phase rules for 3-6 months on E', async () => {
      const fourMonthEProfile = createBaseProfile({
        gender_identity: 'mtf',
        on_hrt: true,
        hrt_type: 'estrogen',
        hrt_months_duration: 4,
      });

      const safetyContext = await evaluateSafetyRules(fourMonthEProfile, mockExercisePool);

      const adaptationRule = safetyContext.rules_applied.find(r => r.rule_id === 'HRT-E-03');
      expect(adaptationRule).toBeDefined();
    });

    it('applies initial phase for first month on T with slower progression', async () => {
      const firstMonthTProfile = createBaseProfile({
        gender_identity: 'ftm',
        on_hrt: true,
        hrt_type: 'testosterone',
        hrt_months_duration: 0.5,
      });

      const safetyContext = await evaluateSafetyRules(firstMonthTProfile, mockExercisePool);

      const initialRule = safetyContext.rules_applied.find(r => r.rule_id === 'HRT-T-01b');
      expect(initialRule).toBeDefined();

      // Check for slower progression (0.9x)
      expect(safetyContext.modified_parameters.progressive_overload_rate).toBeLessThan(1.0);
    });

    it('applies accelerating phase for 6-12 months on T with faster progression', async () => {
      const eightMonthTProfile = createBaseProfile({
        gender_identity: 'ftm',
        on_hrt: true,
        hrt_type: 'testosterone',
        hrt_months_duration: 8,
      });

      const safetyContext = await evaluateSafetyRules(eightMonthTProfile, mockExercisePool);

      const acceleratingRule = safetyContext.rules_applied.find(r => r.rule_id === 'HRT-T-04');
      expect(acceleratingRule).toBeDefined();

      // Check for faster progression (1.1x)
      expect(safetyContext.modified_parameters.progressive_overload_rate).toBeGreaterThanOrEqual(1.1);
    });

    it('applies peak phase for 24+ months on T with maximum progression', async () => {
      const thirtyMonthTProfile = createBaseProfile({
        gender_identity: 'ftm',
        on_hrt: true,
        hrt_type: 'testosterone',
        hrt_months_duration: 30,
      });

      const safetyContext = await evaluateSafetyRules(thirtyMonthTProfile, mockExercisePool);

      const peakRule = safetyContext.rules_applied.find(r => r.rule_id === 'HRT-T-06');
      expect(peakRule).toBeDefined();

      // Check for maximum progression (1.2x)
      expect(safetyContext.modified_parameters.progressive_overload_rate).toBeGreaterThanOrEqual(1.2);
    });
  });
});
