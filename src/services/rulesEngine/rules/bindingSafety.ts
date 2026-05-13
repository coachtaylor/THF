import { Rule, EvaluationContext } from './types';
import { loadSafetyConfig, getBindingConfig, BindingConfig } from '../configLoader';

/**
 * Binding Safety Rules
 *
 * Numerical thresholds (volume reduction %, max minutes, rest increases)
 * are loaded from database. Rule logic and conditions remain in code.
 */

// Default fallbacks if database is unavailable
const DEFAULT_BINDING_CONFIG: BindingConfig = {
  volume_reduction_percent: 25,
  rest_seconds_increase: 30,
  suggested_intensity: 'moderate'
};

const DEFAULT_ACE_CONFIG: BindingConfig = {
  volume_reduction_percent: 40,
  rest_seconds_increase: 45,
  max_workout_minutes: 30,
  suggested_intensity: 'light'
};

export const bindingSafetyRules: Rule[] = [
  // BS-01: Heavy Chest Compression Exercises
  {
    rule_id: 'BS-01',
    category: 'binding_safety',
    severity: 'critical',
    condition: (ctx: EvaluationContext) => {
      return ctx.user_profile.binds_chest &&
             (ctx.user_profile.binding_frequency === 'daily' ||
              ctx.user_profile.binding_frequency === 'sometimes');
    },
    action: {
      type: 'exclude_exercises',
      criteria: {
        contraindications: ['heavy_binding', 'tight_binder'],
        custom_filter: (ex) => !ex.binder_aware && !ex.heavy_binding_safe
      }
    },
    userMessage: "Your plan is built for binding — we chose exercises that limit chest compression and tuned overhead volume for your routine."
  },

  // BS-01b: Ace Bandage / DIY Binder - Critical Safety Rule
  {
    rule_id: 'BS-01b',
    category: 'binding_safety',
    severity: 'critical',
    condition: (ctx: EvaluationContext) => {
      return ctx.user_profile.binds_chest &&
             (ctx.user_profile.binder_type === 'ace_bandage' ||
              ctx.user_profile.binder_type === 'diy');
    },
    action: {
      type: 'exclude_exercises',
      criteria: {
        contraindications: ['heavy_binding', 'tight_binder', 'high_intensity_cardio'],
        patterns: ['plyometric'],
        custom_filter: (ex) => {
          const notBinderSafe = !ex.binder_aware && !ex.heavy_binding_safe;
          // DEFAULT-DENY (migration 009): for cardio exercises, exclude unless
          // explicitly labeled `binder_unsafe_cardio: false`. Cardio missing
          // the label is treated as potentially unsafe for ace-bandage / DIY
          // binder users.
          const isCardioUnsafeOrUnknown =
            ex.pattern === 'cardio' && ex.binder_unsafe_cardio !== false;
          return notBinderSafe || isCardioUnsafeOrUnknown;
        }
      }
    },
    userMessage: "Ace bandages and DIY binders restrict the ribcage more than commercial binders. We've kept the plan under 30 minutes, tuned intensity down, and removed high-impact cardio and plyometrics so your breathing isn't compressed."
  },

  // BS-01c: Ace Bandage - Maximum Session Duration Warning
  {
    rule_id: 'BS-01c',
    category: 'binding_safety',
    severity: 'critical',
    condition: (ctx: EvaluationContext) => {
      return ctx.user_profile.binds_chest &&
             (ctx.user_profile.binder_type === 'ace_bandage' ||
              ctx.user_profile.binder_type === 'diy');
    },
    action: {
      type: 'inject_checkpoint',
      checkpoint: {
        // Was 'safety_warning' which isn't a valid SafetyCheckpoint type.
        // planGenerator's checkpoint-type-mapping switch already routed it to
        // 'safety_reminder' at runtime via its default branch, so this just
        // aligns the declared type with what was actually being injected.
        type: 'safety_reminder',
        trigger: 'workout_start',
        message: 'Safety Notice: Keep workouts under 30 minutes. If you feel rib pain, chest tightness, or difficulty breathing, stop immediately.',
        severity: 'critical'
      }
    }
  },

  // BS-01d: Ace Bandage - Volume and Intensity Reduction
  {
    rule_id: 'BS-01d',
    category: 'binding_safety',
    severity: 'high',
    condition: (ctx: EvaluationContext) => {
      return ctx.user_profile.binds_chest &&
             (ctx.user_profile.binder_type === 'ace_bandage' ||
              ctx.user_profile.binder_type === 'diy');
    },
    action: {
      type: 'modify_parameters',
      getModification: async () => {
        const config = await loadSafetyConfig();
        const aceConfig = config?.binding?.ace_bandage || DEFAULT_ACE_CONFIG;
        return {
          volume_reduction_percent: aceConfig.volume_reduction_percent,
          rest_seconds_increase: aceConfig.rest_seconds_increase,
          suggested_intensity: aceConfig.suggested_intensity,
          max_workout_minutes: aceConfig.max_workout_minutes
        };
      }
    },
    userMessage: "Intensity and duration are tuned down for non-commercial binding — modifications first, exclusions only when needed."
  },

  // BS-02: Long Duration Binding
  {
    rule_id: 'BS-02',
    category: 'binding_safety',
    severity: 'high',
    condition: (ctx: EvaluationContext) => {
      const config = getBindingConfig('long_duration');
      const threshold = config?.duration_threshold_hours || 8;
      return ctx.user_profile.binds_chest &&
             (ctx.user_profile.binding_duration_hours || 0) >= threshold;
    },
    action: {
      type: 'modify_parameters',
      getModification: async () => {
        const config = await loadSafetyConfig();
        const longConfig = config?.binding?.long_duration || DEFAULT_BINDING_CONFIG;
        return {
          suggested_intensity: 'moderate',
          volume_reduction_percent: longConfig.volume_reduction_percent,
          rest_seconds_increase: longConfig.rest_seconds_increase
        };
      }
    },
    userMessage: "Cardio is kept moderate since binding can limit breathing capacity during intense exercise."
  },

  // BS-03: Binder Break Reminders
  {
    rule_id: 'BS-03',
    category: 'binding_safety',
    severity: 'medium',
    condition: (ctx: EvaluationContext) => {
      return ctx.user_profile.binds_chest;
    },
    action: {
      type: 'inject_checkpoint',
      checkpoint: {
        type: 'binder_break',
        trigger: 'every_90_minutes',
        message: 'Time for a binder break. Remove binder for 10-15 minutes to allow rib expansion and deep breathing.',
        severity: 'medium'
      }
    },
    userMessage: "We've included binder break reminders to support safe chest binding during longer sessions."
  },

  // BS-04: Overhead Movement Restriction
  {
    rule_id: 'BS-04',
    category: 'binding_safety',
    severity: 'low',
    condition: (ctx: EvaluationContext) => {
      const config = getBindingConfig('overhead');
      const threshold = config?.duration_threshold_hours || 10;
      return ctx.user_profile.binds_chest &&
             ((ctx.user_profile.binding_duration_hours || 0) >= threshold ||
              ctx.user_profile.binder_type === 'ace_bandage');
    },
    action: {
      type: 'modify_parameters',
      getModification: async () => {
        const config = await loadSafetyConfig();
        const overheadConfig = config?.binding?.overhead || {
          max_sets: 2,
          volume_reduction_percent: 30,
          rest_seconds_increase: 45,
          suggested_intensity: 'light'
        };
        return {
          max_sets: overheadConfig.max_sets,
          volume_reduction_percent: overheadConfig.volume_reduction_percent,
          rest_seconds_increase: overheadConfig.rest_seconds_increase,
          suggested_intensity: overheadConfig.suggested_intensity
        };
      }
    },
    userMessage: "Overhead pressing volume is tuned down to ease rib expansion while binding — the exercise stays in your plan, just at a kinder dose."
  },

  // BS-05: Post-Workout Binder Removal Prompt
  {
    rule_id: 'BS-05',
    category: 'binding_safety',
    severity: 'low',
    condition: (ctx: EvaluationContext) => {
      return ctx.user_profile.binds_chest;
    },
    action: {
      type: 'inject_checkpoint',
      checkpoint: {
        type: 'post_workout_reminder',
        trigger: 'workout_completion',
        message: 'Remove binder for at least 30 minutes post-workout. Your body needs recovery time.',
        severity: 'low'
      }
    },
    userMessage: "You'll get a reminder to remove your binder after the workout for recovery."
  }
];
