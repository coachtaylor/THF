import { Rule, EvaluationContext } from './types';

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
    }
  },
  
  // BS-02: Breathing-Intensive Cardio Duration
  {
    rule_id: 'BS-02',
    category: 'binding_safety',
    severity: 'high',
    condition: (ctx: EvaluationContext) => {
      return ctx.user_profile.binds_chest &&
             (ctx.user_profile.binding_duration_hours || 0) >= 8;
    },
    action: {
      type: 'modify_parameters',
      modification: {
        // Limit cardio duration to 15 minutes max
        // Add breaks every 5 minutes
        // This is applied during workout assembly
      }
    }
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
    }
  },
  
  // BS-04: Overhead Movement Restriction
  {
    rule_id: 'BS-04',
    category: 'binding_safety',
    severity: 'low',
    condition: (ctx: EvaluationContext) => {
      return ctx.user_profile.binds_chest &&
             ((ctx.user_profile.binding_duration_hours || 0) >= 10 ||
              ctx.user_profile.binder_type === 'ace_bandage');
    },
    action: {
      type: 'modify_parameters',
      modification: {
        // Reduce sets by 1 for overhead push exercises
        // Add stretch after
      }
    }
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
    }
  }
];