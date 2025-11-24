import { Rule, EvaluationContext } from './types';

function calculateWeeksPostOp(surgeryDate: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - surgeryDate.getTime());
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  return diffWeeks;
}

export const postOperativeRules: Rule[] = [
  // PO-01: Top Surgery - No Chest Loading (Weeks 0-6)
  {
    rule_id: 'PO-01',
    category: 'post_op',
    severity: 'critical',
    condition: (ctx: EvaluationContext) => {
      const topSurgery = ctx.user_profile.surgeries.find(s => s.type === 'top_surgery');
      if (!topSurgery) return false;
      
      const weeksPostOp = calculateWeeksPostOp(topSurgery.date);
      return weeksPostOp < 6;
    },
    action: {
      type: 'critical_block',
      criteria: {
        patterns: ['push'],
        muscle_groups: ['pectorals']
      }
    }
  },
  
  // PO-02: Top Surgery - Light Upper Body (Weeks 6-12)
  {
    rule_id: 'PO-02',
    category: 'post_op',
    severity: 'high',
    condition: (ctx: EvaluationContext) => {
      const topSurgery = ctx.user_profile.surgeries.find(s => s.type === 'top_surgery');
      if (!topSurgery) return false;
      
      const weeksPostOp = calculateWeeksPostOp(topSurgery.date);
      return weeksPostOp >= 6 && weeksPostOp < 12;
    },
    action: {
      type: 'modify_parameters',
      modification: {
        max_weight: 'light (5-15 lbs)',
        max_sets: 2,
        rep_range: '12-15',
        rest_seconds_increase: 30
      }
    }
  },
  
  // PO-03: Top Surgery - Scar Massage Reminder (Weeks 6+)
  {
    rule_id: 'PO-03',
    category: 'post_op',
    severity: 'low',
    condition: (ctx: EvaluationContext) => {
      const topSurgery = ctx.user_profile.surgeries.find(s => s.type === 'top_surgery');
      if (!topSurgery) return false;
      
      const weeksPostOp = calculateWeeksPostOp(topSurgery.date);
      return weeksPostOp >= 6;
    },
    action: {
      type: 'inject_checkpoint',
      checkpoint: {
        type: 'scar_care',
        trigger: 'cool_down',
        message: 'After workout: Perform scar massage for 5 minutes to improve tissue mobility.',
        severity: 'low'
      }
    }
  },
  
  // PO-04: Bottom Surgery - No High-Impact Lower Body (Weeks 0-8)
  {
    rule_id: 'PO-04',
    category: 'post_op',
    severity: 'critical',
    condition: (ctx: EvaluationContext) => {
      const bottomSurgery = ctx.user_profile.surgeries.find(s => s.type === 'bottom_surgery');
      if (!bottomSurgery) return false;
      
      const weeksPostOp = calculateWeeksPostOp(bottomSurgery.date);
      return weeksPostOp < 8;
    },
    action: {
      type: 'exclude_exercises',
      criteria: {
        contraindications: ['early_post_op_bottom'],
        custom_filter: (ex) => ex.pattern === 'plyometric'
      }
    }
  },
  
  // PO-05: Bottom Surgery - Pelvic Floor Safe Only (Weeks 0-12)
  {
    rule_id: 'PO-05',
    category: 'post_op',
    severity: 'critical',
    condition: (ctx: EvaluationContext) => {
      const bottomSurgery = ctx.user_profile.surgeries.find(s => s.type === 'bottom_surgery');
      if (!bottomSurgery) return false;
      
      const weeksPostOp = calculateWeeksPostOp(bottomSurgery.date);
      return weeksPostOp < 12;
    },
    action: {
      type: 'exclude_exercises',
      criteria: {
        custom_filter: (ex) => !ex.pelvic_floor_safe
      }
    }
  },
  
  // Add more post-op rules as needed...
];