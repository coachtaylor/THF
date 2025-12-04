import { Rule, EvaluationContext } from './types';

export const hrtAdjustmentRules: Rule[] = [
  // HRT-01: MTF Recovery Extension
  {
    rule_id: 'HRT-01',
    category: 'hrt_adjustment',
    severity: 'medium',
    condition: (ctx: EvaluationContext) => {
      return ctx.user_profile.hrt_type === 'estrogen_blockers' &&
             (ctx.user_profile.hrt_months_duration || 0) >= 3;
    },
    action: {
      type: 'modify_parameters',
      modification: {
        recovery_multiplier: 1.25,
        volume_reduction_percent: 15,
        rest_seconds_increase: 15
      }
    },
    userMessage: "Recovery time is optimized for your body on estrogen, with slightly longer rest periods."
  },

  // HRT-02: FTM Strength Adaptation Boost
  {
    rule_id: 'HRT-02',
    category: 'hrt_adjustment',
    severity: 'low',
    condition: (ctx: EvaluationContext) => {
      return ctx.user_profile.hrt_type === 'testosterone' &&
             (ctx.user_profile.hrt_months_duration || 0) >= 6;
    },
    action: {
      type: 'modify_parameters',
      modification: {
        // Progressive overload rate increase
        // Handled in progression logic
      }
    },
    userMessageTemplate: "At {hrtMonths} months on T, your strength gains are ramping up. We're supporting progressive overload."
  },

  // HRT-03: MTF Lower Body Distribution
  {
    rule_id: 'HRT-03',
    category: 'hrt_adjustment',
    severity: 'medium',
    condition: (ctx: EvaluationContext) => {
      return ctx.user_profile.gender_identity === 'mtf' &&
             ctx.user_profile.primary_goal === 'feminization' &&
             (ctx.user_profile.hrt_months_duration || 0) >= 3;
    },
    action: {
      type: 'modify_parameters',
      modification: {
        // Lower body volume: 60-70%
        // Upper body volume: 30-40%
        // Handled in template selection
      }
    },
    userMessage: "Your workout emphasizes glutes and lower body to support your feminization goals on estrogen."
  },

  // HRT-04: FTM Upper Body Emphasis
  {
    rule_id: 'HRT-04',
    category: 'hrt_adjustment',
    severity: 'medium',
    condition: (ctx: EvaluationContext) => {
      return ctx.user_profile.gender_identity === 'ftm' &&
             ctx.user_profile.primary_goal === 'masculinization' &&
             (ctx.user_profile.hrt_months_duration || 0) >= 3;
    },
    action: {
      type: 'modify_parameters',
      modification: {
        // Upper body volume: 50-60%
        // Lower body volume: 40-50%
        // Handled in template selection
      }
    },
    userMessage: "Your workout emphasizes upper body development to support your masculinization goals on T."
  }
];
