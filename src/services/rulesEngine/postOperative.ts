import { Rule, EvaluationContext } from './rules/types';
import { SurgeryType, Surgery } from '../../types';
import { loadSafetyConfig, getPostOpConfig } from './configLoader';

/**
 * Post-Operative Safety Rules
 *
 * Week thresholds, blocked patterns, volume reductions are loaded from database.
 * Rule logic remains in code.
 */

function calculateWeeksPostOp(surgeryDate: Date | undefined): number {
  if (!surgeryDate) {
    if (__DEV__) console.warn('Surgery date undefined - applying 0 weeks');
    return 0;
  }

  const now = new Date();
  const surgeryDateTime = new Date(surgeryDate).getTime();

  if (isNaN(surgeryDateTime)) {
    if (__DEV__) console.warn('Invalid surgery date - applying 0 weeks');
    return 0;
  }

  if (surgeryDateTime > now.getTime()) {
    if (__DEV__) console.warn('Future surgery date - applying 0 weeks');
    return 0;
  }

  const diffTime = now.getTime() - surgeryDateTime;
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  return diffWeeks;
}

function findMostRecentSurgery(ctx: EvaluationContext, types: SurgeryType | SurgeryType[]): Surgery | undefined {
  const typeArray = Array.isArray(types) ? types : [types];

  const matchingSurgeries = ctx.user_profile.surgeries.filter((s: Surgery) => {
    if (!typeArray.includes(s.type)) return false;
    if (s.fully_healed) return false;
    return true;
  });

  matchingSurgeries.sort((a: Surgery, b: Surgery) => {
    const dateA = a.date instanceof Date ? a.date : new Date(a.date);
    const dateB = b.date instanceof Date ? b.date : new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  return matchingSurgeries[0];
}

function findSurgery(ctx: EvaluationContext, types: SurgeryType | SurgeryType[]): Surgery | undefined {
  return findMostRecentSurgery(ctx, types);
}

function createPostOpRules(surgeryType: SurgeryType, rulePrefix: string): Rule[] {
  return [
    {
      rule_id: `${rulePrefix}-CRITICAL`,
      category: 'post_op',
      severity: 'critical',
      condition: (ctx: EvaluationContext) => {
        const surgery = findSurgery(ctx, surgeryType);
        if (!surgery) return false;
        const weeksPostOp = calculateWeeksPostOp(surgery.date);
        const phases = getPostOpConfig(surgeryType);
        const criticalPhase = phases.find(p => p.blocked_patterns && weeksPostOp >= p.weeks_start && weeksPostOp < p.weeks_end);
        return criticalPhase !== undefined;
      },
      action: {
        type: 'critical_block',
        getCriteria: async (ctx: EvaluationContext) => {
          const surgery = findSurgery(ctx, surgeryType);
          if (!surgery) return {};
          const weeksPostOp = calculateWeeksPostOp(surgery.date);
          const config = await loadSafetyConfig();
          const phases = config?.post_op?.[surgeryType] || [];
          const currentPhase = phases.find(p => p.blocked_patterns && weeksPostOp >= p.weeks_start && weeksPostOp < p.weeks_end);

          if (!currentPhase) return {};
          return {
            patterns: currentPhase.blocked_patterns,
            muscle_groups: currentPhase.blocked_muscle_groups
          };
        }
      },
      userMessageTemplate: `You're in early recovery from ${surgeryType.replace('_', ' ')}. Certain exercises are blocked.`
    },
    {
      rule_id: `${rulePrefix}-MODIFY`,
      category: 'post_op',
      severity: 'high',
      condition: (ctx: EvaluationContext) => {
        const surgery = findSurgery(ctx, surgeryType);
        if (!surgery) return false;
        const weeksPostOp = calculateWeeksPostOp(surgery.date);
        const phases = getPostOpConfig(surgeryType);
        const modifyPhase = phases.find(p =>
          !p.blocked_patterns &&
          p.volume_reduction_percent &&
          weeksPostOp >= p.weeks_start &&
          weeksPostOp < p.weeks_end
        );
        return modifyPhase !== undefined;
      },
      action: {
        type: 'modify_parameters',
        getModification: async (ctx: EvaluationContext) => {
          const surgery = findSurgery(ctx, surgeryType);
          if (!surgery) return {};
          const weeksPostOp = calculateWeeksPostOp(surgery.date);
          const config = await loadSafetyConfig();
          const phases = config?.post_op?.[surgeryType] || [];
          const currentPhase = phases.find(p =>
            !p.blocked_patterns &&
            p.volume_reduction_percent &&
            weeksPostOp >= p.weeks_start &&
            weeksPostOp < p.weeks_end
          );

          if (!currentPhase) return {};
          return {
            volume_reduction_percent: currentPhase.volume_reduction_percent,
            max_sets: currentPhase.max_sets,
            max_weight: currentPhase.max_weight,
            rep_range: currentPhase.rep_range,
            rest_seconds_increase: currentPhase.rest_seconds_increase
          };
        }
      },
      userMessageTemplate: `Your workout has been adjusted for ${surgeryType.replace('_', ' ')} recovery.`
    }
  ];
}

const topSurgeryRules = createPostOpRules('top_surgery', 'PO-TOP');
const vaginoplastyRules = createPostOpRules('vaginoplasty', 'PO-VAG');
const ffsRules = createPostOpRules('ffs', 'PO-FFS');
const phalloplastyRules = createPostOpRules('phalloplasty', 'PO-PHALLO');
const metoidioplastyRules = createPostOpRules('metoidioplasty', 'PO-META');
const orchiectomyRules = createPostOpRules('orchiectomy', 'PO-ORCH');
const hysterectomyRules = createPostOpRules('hysterectomy', 'PO-HYST');
const breastAugRules = createPostOpRules('breast_augmentation', 'PO-BA');

const specializedRules: Rule[] = [
  // Scar massage reminder
  {
    rule_id: 'PO-03',
    category: 'post_op',
    severity: 'low',
    condition: (ctx: EvaluationContext) => {
      const surgery = findSurgery(ctx, 'top_surgery');
      if (!surgery) return false;
      return calculateWeeksPostOp(surgery.date) >= 6;
    },
    action: {
      type: 'inject_checkpoint',
      checkpoint: {
        type: 'scar_care',
        trigger: 'cool_down',
        message: 'After workout: Perform scar massage for 5 minutes.',
        severity: 'low'
      }
    },
    userMessage: "We've included a scar massage reminder."
  },

  // Pelvic floor safe only
  {
    rule_id: 'PO-05',
    category: 'post_op',
    severity: 'critical',
    condition: (ctx: EvaluationContext) => {
      const surgery = findSurgery(ctx, 'bottom_surgery');
      if (!surgery) return false;
      return calculateWeeksPostOp(surgery.date) < 12;
    },
    action: {
      type: 'exclude_exercises',
      criteria: {
        custom_filter: (ex: { pelvic_floor_safe?: boolean }) => !ex.pelvic_floor_safe
      }
    },
    userMessage: "Only pelvic floor safe exercises during bottom surgery recovery."
  },

  // FFS no inversion
  {
    rule_id: 'PO-10',
    category: 'post_op',
    severity: 'high',
    condition: (ctx: EvaluationContext) => {
      const surgery = findSurgery(ctx, 'ffs');
      if (!surgery) return false;
      return calculateWeeksPostOp(surgery.date) < 6;
    },
    action: {
      type: 'exclude_exercises',
      criteria: {
        custom_filter: (ex: { pattern?: string; name?: string }) =>
          ex.pattern === 'hinge' ||
          ex.name?.toLowerCase().includes('deadlift') ||
          ex.name?.toLowerCase().includes('row') ||
          ex.name?.toLowerCase().includes('yoga')
      }
    },
    userMessage: "Excluded exercises requiring forward bending during FFS recovery."
  },

  // Phalloplasty donor site
  {
    rule_id: 'PO-13',
    category: 'post_op',
    severity: 'high',
    condition: (ctx: EvaluationContext) => {
      const surgery = findSurgery(ctx, 'phalloplasty');
      if (!surgery) return false;
      return calculateWeeksPostOp(surgery.date) < 12;
    },
    action: {
      type: 'exclude_exercises',
      criteria: {
        custom_filter: (ex: { name?: string; target_muscles?: string }) =>
          ex.name?.toLowerCase().includes('grip') ||
          ex.name?.toLowerCase().includes('wrist') ||
          ex.name?.toLowerCase().includes('curl') ||
          ex.target_muscles?.toLowerCase().includes('forearm')
      }
    },
    userMessage: "Excluded exercises that stress the donor site."
  },

  // Breast augmentation no stretch
  {
    rule_id: 'PO-24',
    category: 'post_op',
    severity: 'high',
    condition: (ctx: EvaluationContext) => {
      const surgery = findSurgery(ctx, 'breast_augmentation');
      if (!surgery) return false;
      return calculateWeeksPostOp(surgery.date) < 8;
    },
    action: {
      type: 'exclude_exercises',
      criteria: {
        custom_filter: (ex: { name?: string }) =>
          ex.name?.toLowerCase().includes('fly') ||
          ex.name?.toLowerCase().includes('stretch') ||
          ex.name?.toLowerCase().includes('press') ||
          ex.name?.toLowerCase().includes('pushup') ||
          ex.name?.toLowerCase().includes('push-up')
      }
    },
    userMessage: "Excluded chest stretch exercises for breast augmentation recovery."
  }
];

export const postOperativeRules: Rule[] = [
  ...topSurgeryRules,
  ...vaginoplastyRules,
  ...ffsRules,
  ...phalloplastyRules,
  ...metoidioplastyRules,
  ...orchiectomyRules,
  ...hysterectomyRules,
  ...breastAugRules,
  ...specializedRules
];

export const POST_OP_RULES = postOperativeRules;
