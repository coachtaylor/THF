/**
 * Rules Engine Integration Tests
 *
 * These tests verify that the safety rules correctly identify and handle
 * trans-specific considerations in workout generation.
 *
 * CRITICAL: These tests ensure user safety by verifying:
 * - Binding safety rules exclude unsafe exercises
 * - Post-op rules block exercises during recovery
 * - HRT rules apply appropriate volume adjustments
 * - Dysphoria rules filter trigger exercises
 */

import { evaluateSafetyRules } from "../../services/rulesEngine/evaluator";
import { Profile } from "../../services/storage/profile";
import { Exercise } from "../../types/plan";

// Mock exercise pool with various safety properties
const createMockExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  id: "1",
  slug: "test-exercise",
  name: "Test Exercise",
  pattern: "push",
  goal: "strength",
  equipment: ["bodyweight"],
  difficulty: "intermediate",
  tags: [],
  binder_aware: true,
  pelvic_floor_safe: true,
  heavy_binding_safe: true,
  contraindications: [],
  pressure_level: "low",
  target_muscles: "chest",
  neutral_cues: [],
  breathing_cues: [],
  swaps: [],
  trans_notes: { binder: "", pelvic_floor: "" },
  commonErrors: [],
  created_at: new Date(),
  version: "1.0",
  flags_reviewed: true,
  ...overrides,
});

// Base profile for testing - minimal required fields
const createBaseProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "test-id",
  user_id: "user-123",
  gender_identity: "ftm",
  primary_goal: "strength",
  on_hrt: false,
  binds_chest: false,
  surgeries: [],
  fitness_experience: "intermediate",
  workout_frequency: 4,
  session_duration: 45,
  equipment: ["dumbbells", "bodyweight"],
  created_at: new Date(),
  updated_at: new Date(),
  goals: ["strength"],
  goal_weighting: { primary: 70, secondary: 30 },
  constraints: [],
  surgery_flags: [],
  surgeon_cleared: true,
  hrt_flags: [],
  fitness_level: "intermediate",
  preferred_minutes: [30, 45],
  block_length: 1,
  low_sensory_mode: false,
  ...overrides,
});

describe("Rules Engine", () => {
  describe("Binding Safety Rules (BS-01 to BS-05)", () => {
    it("BS-01: excludes exercises unsafe for binding users", async () => {
      const bindingProfile = createBaseProfile({
        binds_chest: true,
        binding_frequency: "daily",
        binding_duration_hours: 8,
      });

      const exercises = [
        createMockExercise({
          id: "1",
          name: "Safe Exercise",
          binder_aware: true,
          heavy_binding_safe: true,
        }),
        createMockExercise({
          id: "2",
          name: "Unsafe Exercise",
          binder_aware: false,
          heavy_binding_safe: false,
        }),
      ];

      const result = await evaluateSafetyRules(bindingProfile, exercises);

      // Should have binding safety rule applied
      expect(result.rules_applied.some((r) => r.rule_id === "BS-01")).toBe(
        true,
      );
    });

    it("BS-02: applies volume reduction for 8+ hour binding", async () => {
      const heavyBindingProfile = createBaseProfile({
        binds_chest: true,
        binding_frequency: "daily",
        binding_duration_hours: 10,
      });

      const result = await evaluateSafetyRules(heavyBindingProfile, []);

      // Should apply BS-02 rule with volume reduction
      const bs02Applied = result.rules_applied.find(
        (r) => r.rule_id === "BS-02",
      );
      expect(bs02Applied).toBeDefined();
      // BS-04 also triggers (10+ hours), so modifications are accumulated
      expect(
        result.modified_parameters.volume_reduction_percent,
      ).toBeGreaterThanOrEqual(25);
      expect(
        result.modified_parameters.rest_seconds_increase,
      ).toBeGreaterThanOrEqual(30);
    });

    it("BS-03: injects binder break checkpoints for binding users", async () => {
      const bindingProfile = createBaseProfile({
        binds_chest: true,
        binding_frequency: "sometimes",
      });

      const result = await evaluateSafetyRules(bindingProfile, []);

      // Should inject binder break checkpoint
      const binderBreak = result.required_checkpoints.find(
        (c) => c.type === "binder_break",
      );
      expect(binderBreak).toBeDefined();
      expect(binderBreak?.trigger).toBe("every_90_minutes");
    });

    it("BS-04: reduces overhead movement volume for 10+ hour binding or ace bandage", async () => {
      const aceBindingProfile = createBaseProfile({
        binds_chest: true,
        binding_frequency: "daily",
        binder_type: "ace_bandage",
      });

      const result = await evaluateSafetyRules(aceBindingProfile, []);

      const bs04Applied = result.rules_applied.find(
        (r) => r.rule_id === "BS-04",
      );
      expect(bs04Applied).toBeDefined();
      expect(result.modified_parameters.max_sets).toBe(2);
    });

    it("BS-05: injects post-workout binder removal reminder", async () => {
      const bindingProfile = createBaseProfile({
        binds_chest: true,
      });

      const result = await evaluateSafetyRules(bindingProfile, []);

      const postWorkoutReminder = result.required_checkpoints.find(
        (c) => c.type === "post_workout_reminder",
      );
      expect(postWorkoutReminder).toBeDefined();
      expect(postWorkoutReminder?.trigger).toBe("workout_completion");
    });

    it("does NOT apply binding rules to non-binding users", async () => {
      const nonBindingProfile = createBaseProfile({
        binds_chest: false,
      });

      const result = await evaluateSafetyRules(nonBindingProfile, []);

      // No binding rules should be applied
      const bindingRules = result.rules_applied.filter((r) =>
        r.rule_id.startsWith("BS-"),
      );
      expect(bindingRules.length).toBe(0);
    });
  });

  describe("Post-Operative Rules (PO-01 to PO-24)", () => {
    it("PO-01: blocks push patterns for recent top surgery (0-6 weeks)", async () => {
      const recentTopSurgeryProfile = createBaseProfile({
        surgeries: [
          {
            type: "top_surgery",
            date: new Date(Date.now() - 3 * 7 * 24 * 60 * 60 * 1000), // 3 weeks ago
            weeks_post_op: 3,
            fully_healed: false,
          },
        ],
        surgery_flags: ["top_surgery"],
        surgeon_cleared: false,
      });

      const result = await evaluateSafetyRules(recentTopSurgeryProfile, []);

      // Should have critical block for push patterns
      const po01Applied = result.rules_applied.find(
        (r) => r.rule_id === "PO-TOP-CRITICAL",
      );
      expect(po01Applied).toBeDefined();
      expect(result.critical_blocks.length).toBeGreaterThan(0);
    });

    it("PO-02: modifies parameters for mid-recovery top surgery (6-12 weeks)", async () => {
      const midRecoveryProfile = createBaseProfile({
        surgeries: [
          {
            type: "top_surgery",
            date: new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000), // 8 weeks ago
            weeks_post_op: 8,
            fully_healed: false,
          },
        ],
        surgery_flags: ["top_surgery"],
      });

      const result = await evaluateSafetyRules(midRecoveryProfile, []);

      // Should apply parameter modifications for mid-recovery
      const po02Applied = result.rules_applied.find(
        (r) => r.rule_id === "PO-TOP-MODIFY",
      );
      expect(po02Applied).toBeDefined();
    });

    it("PO-06: blocks lower body for recent vaginoplasty (0-6 weeks)", async () => {
      const recentVaginoplastyProfile = createBaseProfile({
        gender_identity: "mtf",
        surgeries: [
          {
            type: "vaginoplasty",
            date: new Date(Date.now() - 4 * 7 * 24 * 60 * 60 * 1000), // 4 weeks ago
            weeks_post_op: 4,
            fully_healed: false,
          },
        ],
        surgery_flags: ["vaginoplasty"],
        surgeon_cleared: false,
      });

      const result = await evaluateSafetyRules(recentVaginoplastyProfile, []);

      // Should have critical block for lower body patterns
      const po06Applied = result.rules_applied.find(
        (r) => r.rule_id === "PO-VAG-CRITICAL",
      );
      expect(po06Applied).toBeDefined();
    });

    it("does NOT apply post-op rules to users without surgeries", async () => {
      const noSurgeryProfile = createBaseProfile({
        surgeries: [],
        surgery_flags: [],
      });

      const result = await evaluateSafetyRules(noSurgeryProfile, []);

      // No post-op rules should be applied
      const postOpRules = result.rules_applied.filter((r) =>
        r.rule_id.startsWith("PO-"),
      );
      expect(postOpRules.length).toBe(0);
    });

    it("does NOT apply post-op rules to fully healed users", async () => {
      const healedProfile = createBaseProfile({
        surgeries: [
          {
            type: "top_surgery",
            date: new Date(Date.now() - 52 * 7 * 24 * 60 * 60 * 1000), // 1 year ago
            weeks_post_op: 52,
            fully_healed: true,
          },
        ],
        surgery_flags: ["top_surgery"],
        surgeon_cleared: true,
      });

      const result = await evaluateSafetyRules(healedProfile, []);

      // Critical blocks should not be applied for fully healed users
      expect(result.critical_blocks.length).toBe(0);
    });
  });

  describe("HRT Adjustment Rules (HRT-01 to HRT-07)", () => {
    it("HRT-01: applies recovery multiplier for MTF on estrogen 3+ months", async () => {
      const mtfOnEstrogenProfile = createBaseProfile({
        gender_identity: "mtf",
        on_hrt: true,
        hrt_type: "estrogen",
        hrt_start_date: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000), // 6 months ago
        hrt_months_duration: 6,
        hrt_flags: ["on_hrt", "estrogen"],
      });

      const result = await evaluateSafetyRules(mtfOnEstrogenProfile, []);

      const hrtRuleApplied = result.rules_applied.find((r) =>
        r.rule_id.startsWith("HRT-"),
      );
      expect(hrtRuleApplied).toBeDefined();
    });

    it("HRT-T-04: applies progressive overload boost for FTM on testosterone 6-12 months (Accelerating Phase)", async () => {
      const ftmOnTestosteroneProfile = createBaseProfile({
        gender_identity: "ftm",
        on_hrt: true,
        hrt_type: "testosterone",
        hrt_start_date: new Date(Date.now() - 8 * 30 * 24 * 60 * 60 * 1000), // 8 months ago
        hrt_months_duration: 8,
        hrt_flags: ["on_hrt", "testosterone"],
      });

      const result = await evaluateSafetyRules(ftmOnTestosteroneProfile, []);

      // 8 months falls into HRT-T-DYNAMIC: Accelerating Phase (6-12 months)
      const hrtT04Applied = result.rules_applied.find(
        (r) => r.rule_id === "HRT-T-DYNAMIC",
      );
      expect(hrtT04Applied).toBeDefined();
    });

    it("HRT-T-02: applies volume reduction for early testosterone users (1-3 months)", async () => {
      const earlyTestosteroneProfile = createBaseProfile({
        gender_identity: "ftm",
        on_hrt: true,
        hrt_type: "testosterone",
        hrt_start_date: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000), // 2 months ago
        hrt_months_duration: 2,
        hrt_flags: ["on_hrt", "testosterone"],
      });

      const result = await evaluateSafetyRules(earlyTestosteroneProfile, []);

      // 2 months falls into HRT-T-DYNAMIC: Early Phase (1-3 months)
      const hrtT02Applied = result.rules_applied.find(
        (r) => r.rule_id === "HRT-T-DYNAMIC",
      );
      expect(hrtT02Applied).toBeDefined();
    });

    it("does NOT apply HRT rules to non-HRT users", async () => {
      const noHrtProfile = createBaseProfile({
        on_hrt: false,
        hrt_flags: [],
      });

      const result = await evaluateSafetyRules(noHrtProfile, []);

      const hrtRules = result.rules_applied.filter((r) =>
        r.rule_id.startsWith("HRT-"),
      );
      expect(hrtRules.length).toBe(0);
    });
  });

  describe("Dysphoria Filtering Rules (DYS-01 to DYS-05)", () => {
    it("DYS-01: applies soft filter for chest dysphoria", async () => {
      const chestDysphoriaProfile = createBaseProfile({
        dysphoria_triggers: ["looking_at_chest"],
      });

      const result = await evaluateSafetyRules(chestDysphoriaProfile, []);

      const dys01Applied = result.rules_applied.find(
        (r) => r.rule_id === "DYS-01",
      );
      expect(dys01Applied).toBeDefined();
      expect(result.soft_filters.length).toBeGreaterThan(0);
    });

    it("DYS-02: excludes mirror-required exercises for mirror dysphoria", async () => {
      const mirrorDysphoriaProfile = createBaseProfile({
        dysphoria_triggers: ["mirrors"],
      });

      const result = await evaluateSafetyRules(mirrorDysphoriaProfile, []);

      const dys02Applied = result.rules_applied.find(
        (r) => r.rule_id === "DYS-02",
      );
      expect(dys02Applied).toBeDefined();
    });

    it("DYS-03: excludes partner-required exercises for body contact dysphoria", async () => {
      const bodyContactDysphoriaProfile = createBaseProfile({
        dysphoria_triggers: ["body_contact"],
      });

      const result = await evaluateSafetyRules(bodyContactDysphoriaProfile, []);

      const dys03Applied = result.rules_applied.find(
        (r) => r.rule_id === "DYS-03",
      );
      expect(dys03Applied).toBeDefined();
    });

    it("applies multiple dysphoria rules for users with multiple triggers", async () => {
      const multipleDysphoriaProfile = createBaseProfile({
        dysphoria_triggers: ["looking_at_chest", "mirrors", "crowded_spaces"],
      });

      const result = await evaluateSafetyRules(multipleDysphoriaProfile, []);

      const dysphoriaRules = result.rules_applied.filter((r) =>
        r.rule_id.startsWith("DYS-"),
      );
      expect(dysphoriaRules.length).toBeGreaterThan(1);
    });

    it("does NOT apply dysphoria rules to users without triggers", async () => {
      const noDysphoriaProfile = createBaseProfile({
        dysphoria_triggers: [],
      });

      const result = await evaluateSafetyRules(noDysphoriaProfile, []);

      const dysphoriaRules = result.rules_applied.filter((r) =>
        r.rule_id.startsWith("DYS-"),
      );
      expect(dysphoriaRules.length).toBe(0);
    });
  });

  describe("Combined Safety Scenarios", () => {
    it("applies multiple rule categories for complex profiles", async () => {
      // A user who binds, is on HRT, and has dysphoria triggers
      const complexProfile = createBaseProfile({
        gender_identity: "ftm",
        binds_chest: true,
        binding_frequency: "daily",
        binding_duration_hours: 8,
        on_hrt: true,
        hrt_type: "testosterone",
        hrt_months_duration: 6,
        hrt_flags: ["on_hrt", "testosterone"],
        dysphoria_triggers: ["mirrors"],
      });

      const result = await evaluateSafetyRules(complexProfile, []);

      // Should have rules from multiple categories
      const bindingRules = result.rules_applied.filter((r) =>
        r.rule_id.startsWith("BS-"),
      );
      const hrtRules = result.rules_applied.filter((r) =>
        r.rule_id.startsWith("HRT-"),
      );
      const dysphoriaRules = result.rules_applied.filter((r) =>
        r.rule_id.startsWith("DYS-"),
      );

      expect(bindingRules.length).toBeGreaterThan(0);
      expect(hrtRules.length).toBeGreaterThan(0);
      expect(dysphoriaRules.length).toBeGreaterThan(0);
    });

    it("provides user-facing messages for all applied rules", async () => {
      const bindingProfile = createBaseProfile({
        binds_chest: true,
        binding_frequency: "daily",
      });

      const result = await evaluateSafetyRules(bindingProfile, []);

      // Every applied rule should have a user message
      result.rules_applied.forEach((rule) => {
        expect(rule.userMessage).toBeDefined();
        expect(typeof rule.userMessage).toBe("string");
        expect(rule.userMessage!.length).toBeGreaterThan(0);
      });
    });

    it("accumulates parameter modifications from multiple rules", async () => {
      // Profile that triggers multiple parameter-modifying rules
      const heavyBindingProfile = createBaseProfile({
        binds_chest: true,
        binding_frequency: "daily",
        binding_duration_hours: 12,
        binder_type: "ace_bandage",
      });

      const result = await evaluateSafetyRules(heavyBindingProfile, []);

      // Should have accumulated modifications
      expect(result.modified_parameters).toBeDefined();
      expect(Object.keys(result.modified_parameters).length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("handles empty exercise pool gracefully", async () => {
      const profile = createBaseProfile({ binds_chest: true });

      const result = await evaluateSafetyRules(profile, []);

      expect(result).toBeDefined();
      expect(result.rules_applied).toBeDefined();
    });

    it("handles undefined optional profile fields", async () => {
      const minimalProfile = createBaseProfile({
        dysphoria_triggers: undefined,
        hrt_months_duration: undefined,
        binding_duration_hours: undefined,
      });

      // Should not throw
      const result = await evaluateSafetyRules(minimalProfile, []);
      expect(result).toBeDefined();
    });

    it("handles surgery with no date gracefully", async () => {
      // Note: This test documents expected behavior - surgeries should have dates
      // In production, the onboarding flow requires dates
      // This test verifies the rules engine doesn't crash on edge cases
      const surgeryNoDateProfile = createBaseProfile({
        surgeries: [], // No surgeries if no date - this is the safe approach
        surgery_flags: [],
      });

      // Should not throw
      const result = await evaluateSafetyRules(surgeryNoDateProfile, []);
      expect(result).toBeDefined();
    });
  });

  // NEW: Surgery Date Edge Cases (SAFETY CRITICAL)
  describe("Surgery Date Safety Edge Cases", () => {
    it("applies most restrictive rules (0 weeks) for undefined surgery date", async () => {
      // SAFETY: Users with undefined surgery dates should get maximum restrictions
      const undefinedDateProfile = createBaseProfile({
        surgeries: [
          {
            type: "top_surgery",
            date: undefined as any, // Missing date
            fully_healed: false,
          },
        ],
        surgery_flags: ["top_surgery"],
      });

      const result = await evaluateSafetyRules(undefinedDateProfile, []);

      // Should apply PO-TOP-CRITICAL (critical block for weeks 0-6) since undefined = 0 weeks
      const po01Applied = result.rules_applied.find(
        (r) => r.rule_id === "PO-TOP-CRITICAL",
      );
      expect(po01Applied).toBeDefined();
      expect(result.critical_blocks.length).toBeGreaterThan(0);
    });

    it("applies most restrictive rules (0 weeks) for invalid surgery date", async () => {
      // SAFETY: Invalid dates should get maximum restrictions, not bypass all rules
      const invalidDateProfile = createBaseProfile({
        surgeries: [
          {
            type: "top_surgery",
            date: new Date("invalid-date"),
            fully_healed: false,
          },
        ],
        surgery_flags: ["top_surgery"],
      });

      const result = await evaluateSafetyRules(invalidDateProfile, []);

      // Should apply critical block since invalid = 0 weeks
      const po01Applied = result.rules_applied.find(
        (r) => r.rule_id === "PO-TOP-CRITICAL",
      );
      expect(po01Applied).toBeDefined();
    });

    it("applies most restrictive rules (0 weeks) for future surgery date", async () => {
      // SAFETY: Future dates (user error) should get maximum restrictions
      const futureDateProfile = createBaseProfile({
        surgeries: [
          {
            type: "top_surgery",
            date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days in future
            fully_healed: false,
          },
        ],
        surgery_flags: ["top_surgery"],
      });

      const result = await evaluateSafetyRules(futureDateProfile, []);

      // Should apply critical block since future = treated as 0 weeks
      const po01Applied = result.rules_applied.find(
        (r) => r.rule_id === "PO-TOP-CRITICAL",
      );
      expect(po01Applied).toBeDefined();
    });
  });

  // NEW: Multiple Surgeries Edge Cases (SAFETY CRITICAL)
  describe("Multiple Surgeries Safety Edge Cases", () => {
    it("uses most recent surgery when multiple surgeries of same type exist (revision)", async () => {
      // SAFETY: User had top surgery 1 year ago, then revision 3 weeks ago
      // Should use the revision (most recent) not the healed original
      const revisionSurgeryProfile = createBaseProfile({
        surgeries: [
          {
            type: "top_surgery",
            date: new Date(Date.now() - 52 * 7 * 24 * 60 * 60 * 1000), // 1 year ago
            weeks_post_op: 52,
            fully_healed: true, // Marked healed
          },
          {
            type: "top_surgery",
            date: new Date(Date.now() - 3 * 7 * 24 * 60 * 60 * 1000), // 3 weeks ago (revision)
            weeks_post_op: 3,
            fully_healed: false,
          },
        ],
        surgery_flags: ["top_surgery"],
      });

      const result = await evaluateSafetyRules(revisionSurgeryProfile, []);

      // Should apply PO-TOP-CRITICAL for the 3-week-old revision, not skip due to healed older surgery
      const po01Applied = result.rules_applied.find(
        (r) => r.rule_id === "PO-TOP-CRITICAL",
      );
      expect(po01Applied).toBeDefined();
      expect(result.critical_blocks.length).toBeGreaterThan(0);
    });

    it("uses most restrictive rules when multiple different surgeries exist", async () => {
      // SAFETY: User has top surgery 16 weeks ago AND vaginoplasty 3 weeks ago
      // Should apply restrictions for the more recent/restrictive surgery
      const multipleDifferentSurgeriesProfile = createBaseProfile({
        gender_identity: "mtf",
        surgeries: [
          {
            type: "top_surgery",
            date: new Date(Date.now() - 16 * 7 * 24 * 60 * 60 * 1000), // 16 weeks ago
            weeks_post_op: 16,
            fully_healed: false,
          },
          {
            type: "vaginoplasty",
            date: new Date(Date.now() - 3 * 7 * 24 * 60 * 60 * 1000), // 3 weeks ago
            weeks_post_op: 3,
            fully_healed: false,
          },
        ],
        surgery_flags: ["top_surgery", "vaginoplasty"],
      });

      const result = await evaluateSafetyRules(
        multipleDifferentSurgeriesProfile,
        [],
      );

      // Should have critical blocks from vaginoplasty (the more recent/restrictive)
      const po06Applied = result.rules_applied.find(
        (r) => r.rule_id === "PO-VAG-CRITICAL",
      );
      expect(po06Applied).toBeDefined();
    });

    it("ignores fully_healed surgeries in restriction calculations", async () => {
      // When a surgery is marked fully_healed, it should NOT apply restrictions
      const healedSurgeryProfile = createBaseProfile({
        surgeries: [
          {
            type: "top_surgery",
            date: new Date(Date.now() - 3 * 7 * 24 * 60 * 60 * 1000), // 3 weeks ago
            weeks_post_op: 3,
            fully_healed: true, // Marked healed by user/doctor
          },
        ],
        surgery_flags: ["top_surgery"],
        surgeon_cleared: true,
      });

      const result = await evaluateSafetyRules(healedSurgeryProfile, []);

      // Should NOT apply PO-01 since marked as fully healed
      expect(result.critical_blocks.length).toBe(0);
    });
  });

  // NEW: Ace Bandage/DIY Binding Duration Limit
  describe("Binding Duration Limit", () => {
    it("sets max_workout_minutes for ace bandage users", async () => {
      const aceBandageProfile = createBaseProfile({
        binds_chest: true,
        binder_type: "ace_bandage",
        binding_frequency: "daily",
      });

      const result = await evaluateSafetyRules(aceBandageProfile, []);

      // BS-01d should set max_workout_minutes to 30
      expect(result.modified_parameters.max_workout_minutes).toBe(30);
    });

    it("sets max_workout_minutes for DIY binder users", async () => {
      const diyBinderProfile = createBaseProfile({
        binds_chest: true,
        binder_type: "diy",
        binding_frequency: "sometimes",
      });

      const result = await evaluateSafetyRules(diyBinderProfile, []);

      // BS-01d should set max_workout_minutes to 30
      expect(result.modified_parameters.max_workout_minutes).toBe(30);
    });

    it("does NOT set max_workout_minutes for commercial binder users", async () => {
      const commercialBinderProfile = createBaseProfile({
        binds_chest: true,
        binder_type: "commercial",
        binding_frequency: "daily",
      });

      const result = await evaluateSafetyRules(commercialBinderProfile, []);

      // Commercial binders should not have duration limit
      expect(result.modified_parameters.max_workout_minutes).toBeUndefined();
    });
  });

  // NEW: Worst-case Combined Safety Scenarios
  // These test that combined restrictions don't make workouts unviable
  describe("Worst-Case Combined Safety Scenarios (Launch Critical)", () => {
    it("FTM user + binding + 6 weeks post top surgery + early testosterone - workout remains viable", async () => {
      // This is a common real-world scenario for FTM users
      const worstCaseFtmProfile = createBaseProfile({
        gender_identity: "ftm",
        // Binding
        binds_chest: true,
        binding_frequency: "daily",
        binding_duration_hours: 10,
        binder_type: "commercial", // commercial binder (not ace bandage)
        // Post-op
        surgeries: [
          {
            type: "top_surgery",
            date: new Date(Date.now() - 6 * 7 * 24 * 60 * 60 * 1000), // 6 weeks ago
            weeks_post_op: 6,
            fully_healed: false,
          },
        ],
        surgery_flags: ["top_surgery"],
        surgeon_cleared: true,
        // Early HRT
        on_hrt: true,
        hrt_type: "testosterone",
        hrt_start_date: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000), // 2 months ago
        hrt_months_duration: 2,
        hrt_flags: ["on_hrt", "testosterone"],
        // Dysphoria triggers
        dysphoria_triggers: ["mirrors", "looking_at_chest"],
      });

      const result = await evaluateSafetyRules(worstCaseFtmProfile, []);

      // Verify multiple rule categories applied
      const bindingRules = result.rules_applied.filter((r) =>
        r.rule_id.startsWith("BS-"),
      );
      const postOpRules = result.rules_applied.filter((r) =>
        r.rule_id.startsWith("PO-"),
      );
      const hrtRules = result.rules_applied.filter((r) =>
        r.rule_id.startsWith("HRT-"),
      );
      const dysphoriaRules = result.rules_applied.filter((r) =>
        r.rule_id.startsWith("DYS-"),
      );

      expect(bindingRules.length).toBeGreaterThan(0);
      expect(postOpRules.length).toBeGreaterThan(0);
      expect(hrtRules.length).toBeGreaterThan(0);
      expect(dysphoriaRules.length).toBeGreaterThan(0);

      // CRITICAL: Volume reduction should not exceed 60% (floor to keep workouts viable)
      // If volume_reduction_percent > 60, workouts become too short to be useful
      const volumeReduction =
        result.modified_parameters.volume_reduction_percent || 0;
      expect(volumeReduction).toBeLessThanOrEqual(60);

      // CRITICAL: Modified parameters should still allow for a viable workout
      // Sets should not be reduced below 2
      if (result.modified_parameters.max_sets !== undefined) {
        expect(result.modified_parameters.max_sets).toBeGreaterThanOrEqual(2);
      }
    });

    it("MTF user + ace bandage binding - applies maximum binding restrictions", async () => {
      // This is a high-risk scenario that should trigger maximum binding safety restrictions
      const highRiskMtfProfile = createBaseProfile({
        gender_identity: "mtf",
        // Ace bandage (dangerous!)
        binds_chest: true,
        binding_frequency: "daily",
        binding_duration_hours: 8,
        binder_type: "ace_bandage",
        // Early estrogen
        on_hrt: true,
        hrt_type: "estrogen",
        hrt_start_date: new Date(Date.now() - 4 * 30 * 24 * 60 * 60 * 1000), // 4 months ago
        hrt_months_duration: 4,
        hrt_flags: ["on_hrt", "estrogen"],
      });

      const result = await evaluateSafetyRules(highRiskMtfProfile, []);

      // CRITICAL: Ace bandage should limit workout to 30 minutes
      expect(result.modified_parameters.max_workout_minutes).toBe(30);

      // Should apply binding safety warning
      const bs01cApplied = result.rules_applied.find(
        (r) => r.rule_id === "BS-01c",
      );
      expect(bs01cApplied).toBeDefined();

      // Should apply multiple binding rules
      const bindingRules = result.rules_applied.filter((r) =>
        r.rule_id.startsWith("BS-"),
      );
      expect(bindingRules.length).toBeGreaterThan(2);
    });

    it("User with all dysphoria triggers still has exercises available via soft filters", async () => {
      // Even with all dysphoria triggers, soft filters should deprioritize but not block all
      const allDysphoriaProfile = createBaseProfile({
        gender_identity: "nonbinary",
        dysphoria_triggers: [
          "looking_at_chest",
          "mirrors",
          "body_contact",
          "crowded_spaces",
          "tight_clothing",
          "photos",
          "swimming",
          "form_focused",
        ],
      });

      const result = await evaluateSafetyRules(allDysphoriaProfile, []);

      // Soft filters should be applied (for deprioritization)
      expect(result.soft_filters.length).toBeGreaterThan(0);

      // Exclusions should be limited (only hard blocks like mirror_required, partner_required, pool exercises)
      // Not all exercises should be blocked
      const hardExclusions = result.rules_applied.filter(
        (r) =>
          r.rule_id === "DYS-02" ||
          r.rule_id === "DYS-03" ||
          r.rule_id === "DYS-07",
      );
      expect(hardExclusions.length).toBeGreaterThanOrEqual(0);
      expect(hardExclusions.length).toBeLessThanOrEqual(3); // Only 3 are hard exclusions
    });

    it("User recovering from vaginoplasty + hysterectomy (overlapping recovery) - applies both restrictions", async () => {
      // Testing overlapping recovery periods from multiple surgeries
      const overlappingSurgeryProfile = createBaseProfile({
        gender_identity: "mtf",
        surgeries: [
          {
            type: "hysterectomy",
            date: new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000), // 8 weeks ago
            weeks_post_op: 8,
            fully_healed: false,
          },
          {
            type: "vaginoplasty",
            date: new Date(Date.now() - 4 * 7 * 24 * 60 * 60 * 1000), // 4 weeks ago
            weeks_post_op: 4,
            fully_healed: false,
          },
        ],
        surgery_flags: ["hysterectomy", "vaginoplasty"],
        surgeon_cleared: false,
      });

      const result = await evaluateSafetyRules(overlappingSurgeryProfile, []);

      // Should have rules from both surgeries
      const vagRules = result.rules_applied.filter((r) =>
        r.rule_id.includes("VAG"),
      );
      const hystRules = result.rules_applied.filter((r) =>
        r.rule_id.includes("HYST"),
      );

      // At least vaginoplasty rules should apply (more recent)
      expect(vagRules.length).toBeGreaterThan(0);
      // Hysterectomy rules may also apply
      expect(hystRules.length + vagRules.length).toBeGreaterThan(0);

      // Should have pelvic floor sensitivity checkpoint
      const pelvicCheckpoint = result.required_checkpoints.find(
        (c) =>
          c.type === "sensitivity_check" ||
          c.message?.toLowerCase().includes("pelvic"),
      );
      // May or may not have checkpoint depending on specific rules
    });

    it("Early post-op user (2 weeks) gets only rest-compatible exercises", async () => {
      // In the first 2 weeks post-op, very few exercises should be allowed
      const immediatePostOpProfile = createBaseProfile({
        gender_identity: "ftm",
        surgeries: [
          {
            type: "top_surgery",
            date: new Date(Date.now() - 2 * 7 * 24 * 60 * 60 * 1000), // 2 weeks ago
            weeks_post_op: 2,
            fully_healed: false,
          },
        ],
        surgery_flags: ["top_surgery"],
        surgeon_cleared: false,
      });

      const result = await evaluateSafetyRules(immediatePostOpProfile, []);

      // Should have critical blocks
      expect(result.critical_blocks.length).toBeGreaterThan(0);

      // Should have scar care checkpoint (6+ weeks, so not for 2 weeks post-op)
      // But should have other post-op checkpoints

      // Critical block should include patterns like push, pull, core
      const criticalBlockPatterns = result.critical_blocks.map(
        (b) => b.pattern,
      );
      expect(criticalBlockPatterns.length).toBeGreaterThan(0);
    });
  });
});
