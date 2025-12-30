import { Rule, EvaluationContext } from './types';
import { isInjectionDay } from '../utils/hrtUtils';
import { loadSafetyConfig, getHrtPhaseConfig, HrtPhaseConfig } from '../configLoader';

/**
 * HRT Timeline Phase Configuration
 *
 * Phase definitions and numerical values are loaded from database.
 * This keeps proprietary formulas (multipliers, percentages) protected
 * while maintaining the rule logic in code.
 */

// Default fallbacks if database is unavailable (minimal safety)
const DEFAULT_ESTROGEN_CONFIG: HrtPhaseConfig = {
  min_months: 0,
  max_months: 9999,
  recovery_multiplier: 1.10,
  volume_reduction_percent: 5,
  rest_seconds_increase: 5
};

const DEFAULT_TESTOSTERONE_CONFIG: HrtPhaseConfig = {
  min_months: 0,
  max_months: 9999,
  progressive_overload_rate: 1.0
};

/**
 * Get the current HRT phase based on hormone type and months on HRT
 * Fetches config from database (cached)
 */
async function getHrtPhase(hrtType: string, months: number): Promise<{ name: string; config: HrtPhaseConfig } | null> {
  const safetyConfig = await loadSafetyConfig();

  if (!safetyConfig) {
    if (hrtType === 'estrogen') {
      return { name: 'default', config: DEFAULT_ESTROGEN_CONFIG };
    } else if (hrtType === 'testosterone') {
      return { name: 'default', config: DEFAULT_TESTOSTERONE_CONFIG };
    }
    return null;
  }

  let phases: Record<string, HrtPhaseConfig>;
  switch (hrtType) {
    case 'estrogen':
      phases = safetyConfig.hrt_estrogen_phases;
      break;
    case 'testosterone':
      phases = safetyConfig.hrt_testosterone_phases;
      break;
    case 'both':
      phases = safetyConfig.hrt_dual_phases;
      break;
    default:
      return null;
  }

  for (const [name, config] of Object.entries(phases)) {
    if (months >= config.min_months && months < config.max_months) {
      return { name, config };
    }
  }

  return null;
}

/**
 * Determine phase name based on months
 */
function getPhaseName(hrtType: string, months: number): string {
  if (hrtType === 'estrogen') {
    if (months < 1) return 'initial';
    if (months < 3) return 'early';
    if (months < 6) return 'adaptation';
    if (months < 12) return 'stabilizing';
    if (months < 24) return 'established';
    return 'maintenance';
  } else if (hrtType === 'testosterone') {
    if (months < 1) return 'initial';
    if (months < 3) return 'early';
    if (months < 6) return 'adaptation';
    if (months < 12) return 'accelerating';
    if (months < 24) return 'established';
    return 'peak';
  } else if (hrtType === 'both') {
    if (months < 3) return 'initial';
    if (months < 12) return 'adaptation';
    return 'established';
  }
  return 'default';
}

export const hrtAdjustmentRules: Rule[] = [
  // Estrogen HRT - Dynamic config from database
  {
    rule_id: 'HRT-E-DYNAMIC',
    category: 'hrt_adjustment',
    severity: 'medium',
    condition: (ctx: EvaluationContext) => {
      return ctx.user_profile.hrt_type === 'estrogen';
    },
    action: {
      type: 'modify_parameters',
      getModification: async (ctx: EvaluationContext) => {
        const months = ctx.user_profile.hrt_months_duration || 0;
        const phase = await getHrtPhase('estrogen', months);
        if (!phase) return {};
        return {
          recovery_multiplier: phase.config.recovery_multiplier,
          volume_reduction_percent: phase.config.volume_reduction_percent,
          rest_seconds_increase: phase.config.rest_seconds_increase
        };
      }
    },
    userMessageTemplate: "Your workout has been adjusted for your time on estrogen HRT."
  },

  // MTF Lower Body Distribution
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
      getModification: async () => {
        const config = await loadSafetyConfig();
        const dist = config?.hrt_body_distribution?.mtf_feminization;
        return {
          lower_body_volume_percent: dist?.lower_body_percent || 65,
          upper_body_volume_percent: dist?.upper_body_percent || 35
        };
      }
    },
    userMessage: "Your workout emphasizes glutes and lower body to support your feminization goals on estrogen."
  },

  // Testosterone HRT - Dynamic config from database
  {
    rule_id: 'HRT-T-DYNAMIC',
    category: 'hrt_adjustment',
    severity: 'medium',
    condition: (ctx: EvaluationContext) => {
      return ctx.user_profile.hrt_type === 'testosterone';
    },
    action: {
      type: 'modify_parameters',
      getModification: async (ctx: EvaluationContext) => {
        const months = ctx.user_profile.hrt_months_duration || 0;
        const phase = await getHrtPhase('testosterone', months);
        if (!phase) return {};
        return {
          progressive_overload_rate: phase.config.progressive_overload_rate,
          rest_seconds_reduction: phase.config.rest_seconds_reduction
        };
      }
    },
    userMessageTemplate: "Your workout has been adjusted for your time on testosterone HRT."
  },

  // Early T tendon safety checkpoint
  {
    rule_id: 'HRT-T-TENDON-WARNING',
    category: 'hrt_adjustment',
    severity: 'high',
    condition: (ctx: EvaluationContext) => {
      const months = ctx.user_profile.hrt_months_duration || 0;
      return ctx.user_profile.hrt_type === 'testosterone' && months < 3;
    },
    action: {
      type: 'inject_checkpoint',
      checkpoint: {
        type: 'safety_reminder',
        trigger: 'before_strength',
        message: 'Early T tip: Your muscles are getting stronger faster than your tendons. Focus on form over heavy weights.',
        severity: 'high'
      }
    },
    userMessageTemplate: "At {hrtMonths} months on T, we're prioritizing tendon safety."
  },

  // FTM Upper Body Emphasis
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
      getModification: async () => {
        const config = await loadSafetyConfig();
        const dist = config?.hrt_body_distribution?.ftm_masculinization;
        return {
          upper_body_volume_percent: dist?.upper_body_percent || 55,
          lower_body_volume_percent: dist?.lower_body_percent || 45
        };
      }
    },
    userMessage: "Your workout emphasizes upper body development to support your masculinization goals on T."
  },

  // Dual HRT - Dynamic config from database
  {
    rule_id: 'HRT-BOTH-DYNAMIC',
    category: 'hrt_adjustment',
    severity: 'high',
    condition: (ctx: EvaluationContext) => {
      return ctx.user_profile.hrt_type === 'both';
    },
    action: {
      type: 'modify_parameters',
      getModification: async (ctx: EvaluationContext) => {
        const months = ctx.user_profile.hrt_months_duration || 0;
        const phase = await getHrtPhase('both', months);
        if (!phase) return {};
        return {
          recovery_multiplier: phase.config.recovery_multiplier,
          volume_reduction_percent: phase.config.volume_reduction_percent,
          rest_seconds_increase: phase.config.rest_seconds_increase,
          progressive_overload_rate: phase.config.progressive_overload_rate
        };
      }
    },
    userMessageTemplate: "Your workout has been adjusted for dual HRT."
  },

  // Dual HRT tendon safety checkpoint
  {
    rule_id: 'HRT-BOTH-TENDON',
    category: 'hrt_adjustment',
    severity: 'high',
    condition: (ctx: EvaluationContext) => {
      const months = ctx.user_profile.hrt_months_duration || 0;
      return ctx.user_profile.hrt_type === 'both' && months < 3;
    },
    action: {
      type: 'inject_checkpoint',
      checkpoint: {
        type: 'safety_reminder',
        trigger: 'before_strength',
        message: 'On dual HRT, your muscles and connective tissue are adapting in complex ways. Focus on form over weight and listen to your body.',
        severity: 'high'
      }
    }
  },

  // Injection Day Awareness
  {
    rule_id: 'HRT-07',
    category: 'hrt_adjustment',
    severity: 'low',
    condition: (ctx: EvaluationContext) => {
      return isInjectionDay(ctx.user_profile, ctx.current_date);
    },
    action: {
      type: 'modify_parameters',
      modification: {
        suggested_intensity: 'light',
        volume_reduction_percent: 20
      }
    },
    userMessage: "Today is one of your HRT days. We've suggested a lighter workout - adjust based on how you feel."
  }
];
