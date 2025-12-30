import { Rule, EvaluationContext } from './types';
import { loadSafetyConfig } from '../configLoader';

/**
 * Dysphoria-Aware Exercise Filtering Rules
 *
 * Trigger → Tag mappings are loaded from database.
 * This keeps the proprietary dysphoria classifications protected
 * while maintaining the rule logic in code.
 */

function hasTrigger(ctx: EvaluationContext, trigger: string): boolean {
  return ctx.user_profile.dysphoria_triggers?.includes(trigger) ?? false;
}

export const dysphoriaFilteringRules: Rule[] = [
  // DYS-01: Chest Dysphoria
  {
    rule_id: 'DYS-01',
    category: 'dysphoria',
    severity: 'medium',
    condition: (ctx: EvaluationContext) => hasTrigger(ctx, 'looking_at_chest'),
    action: {
      type: 'soft_filter',
      getFilter: async () => {
        const config = await loadSafetyConfig();
        const dysphoriaConfig = config?.dysphoria?.find(d => d.trigger === 'looking_at_chest');
        return {
          deprioritize_tags: dysphoriaConfig?.deprioritize_tags || ['chest_focus', 'chest_visibility', 'mirror_chest'],
          prefer_alternatives: true
        };
      }
    },
    userMessage: "We've adjusted exercise selection to be more comfortable for chest dysphoria."
  },

  // DYS-02: Mirror Dysphoria
  {
    rule_id: 'DYS-02',
    category: 'dysphoria',
    severity: 'low',
    condition: (ctx: EvaluationContext) => hasTrigger(ctx, 'mirrors'),
    action: {
      type: 'exclude_exercises',
      getCriteria: async () => {
        const config = await loadSafetyConfig();
        const dysphoriaConfig = config?.dysphoria?.find(d => d.trigger === 'mirrors');
        const excludeTags = dysphoriaConfig?.exclude_tags || ['mirror_required'];
        return {
          custom_filter: (ex: { dysphoria_tags?: string[] }) =>
            excludeTags.some(tag => ex.dysphoria_tags?.includes(tag))
        };
      }
    },
    userMessage: "We've excluded exercises that typically require mirror feedback."
  },

  // DYS-03: Body Contact Dysphoria
  {
    rule_id: 'DYS-03',
    category: 'dysphoria',
    severity: 'low',
    condition: (ctx: EvaluationContext) => hasTrigger(ctx, 'body_contact'),
    action: {
      type: 'exclude_exercises',
      getCriteria: async () => {
        const config = await loadSafetyConfig();
        const dysphoriaConfig = config?.dysphoria?.find(d => d.trigger === 'body_contact');
        const excludeTags = dysphoriaConfig?.exclude_tags || ['partner_required'];
        return {
          custom_filter: (ex: { dysphoria_tags?: string[] }) =>
            excludeTags.some(tag => ex.dysphoria_tags?.includes(tag))
        };
      }
    },
    userMessage: "We've selected solo exercises that don't require physical contact."
  },

  // DYS-04: Crowded Spaces
  {
    rule_id: 'DYS-04',
    category: 'dysphoria',
    severity: 'low',
    condition: (ctx: EvaluationContext) => hasTrigger(ctx, 'crowded_spaces'),
    action: {
      type: 'soft_filter',
      getFilter: async () => {
        const config = await loadSafetyConfig();
        const dysphoriaConfig = config?.dysphoria?.find(d => d.trigger === 'crowded_spaces');
        return {
          prefer_tags: dysphoriaConfig?.prefer_tags || ['home_friendly', 'minimal_space', 'quiet'],
          deprioritize_tags: dysphoriaConfig?.deprioritize_tags || ['gym_only', 'needs_space', 'loud']
        };
      }
    },
    userMessage: "We've prioritized exercises you can do at home or in private."
  },

  // DYS-05: Tight Clothing Dysphoria
  {
    rule_id: 'DYS-05',
    category: 'dysphoria',
    severity: 'low',
    condition: (ctx: EvaluationContext) => hasTrigger(ctx, 'tight_clothing'),
    action: {
      type: 'soft_filter',
      getFilter: async () => {
        const config = await loadSafetyConfig();
        const dysphoriaConfig = config?.dysphoria?.find(d => d.trigger === 'tight_clothing');
        return {
          prefer_tags: dysphoriaConfig?.prefer_tags || ['loose_clothing_ok', 'low_form_check', 'standing'],
          deprioritize_tags: dysphoriaConfig?.deprioritize_tags || ['tight_clothing_needed', 'form_critical', 'yoga_pants']
        };
      }
    },
    userMessage: "We've prioritized exercises that work well with loose, comfortable clothing."
  },

  // DYS-06: Photos/Camera Dysphoria
  {
    rule_id: 'DYS-06',
    category: 'dysphoria',
    severity: 'low',
    condition: (ctx: EvaluationContext) => hasTrigger(ctx, 'photos'),
    action: {
      type: 'soft_filter',
      getFilter: async () => {
        const config = await loadSafetyConfig();
        const dysphoriaConfig = config?.dysphoria?.find(d => d.trigger === 'photos');
        return {
          prefer_tags: dysphoriaConfig?.prefer_tags || ['no_visual_feedback', 'internal_focus'],
          deprioritize_tags: dysphoriaConfig?.deprioritize_tags || ['camera_feedback', 'video_form_check', 'progress_photo_recommended']
        };
      }
    },
    userMessage: "We've selected exercises that don't require visual/photo feedback for form checking."
  },

  // DYS-07: Swimming/Aquatic Dysphoria
  {
    rule_id: 'DYS-07',
    category: 'dysphoria',
    severity: 'medium',
    condition: (ctx: EvaluationContext) => hasTrigger(ctx, 'swimming'),
    action: {
      type: 'exclude_exercises',
      criteria: {
        custom_filter: (ex: { environment?: string; name?: string; dysphoria_tags?: string[]; equipment?: string[] }) => {
          const isAquatic = ex.environment === 'pool' ||
            ex.name?.toLowerCase().includes('swim') ||
            ex.name?.toLowerCase().includes('aqua') ||
            ex.name?.toLowerCase().includes('water') ||
            ex.dysphoria_tags?.includes('aquatic') ||
            ex.equipment?.some((e: string) => e.toLowerCase().includes('pool'));
          return isAquatic;
        }
      }
    },
    userMessage: "We've excluded all swimming and aquatic exercises from your workouts."
  },

  // DYS-08: Form-Focused Dysphoria
  {
    rule_id: 'DYS-08',
    category: 'dysphoria',
    severity: 'low',
    condition: (ctx: EvaluationContext) => hasTrigger(ctx, 'form_focused'),
    action: {
      type: 'soft_filter',
      getFilter: async () => {
        const config = await loadSafetyConfig();
        const dysphoriaConfig = config?.dysphoria?.find(d => d.trigger === 'form_focused');
        return {
          prefer_tags: dysphoriaConfig?.prefer_tags || ['simple_movement', 'functional', 'low_complexity'],
          deprioritize_tags: dysphoriaConfig?.deprioritize_tags || ['form_critical', 'body_awareness', 'mind_muscle_connection', 'mirror_form_check']
        };
      }
    },
    userMessage: "We've prioritized simpler movements that don't require intense body awareness or form focus."
  }
];
