import { Profile } from '../storage/profile';
import { Exercise } from '../../types/plan';
import { SurgeryType } from '../../types';
import { Rule, SafetyContext, EvaluationContext } from './rules/types';
import { bindingSafetyRules } from './rules/bindingSafety';
import { postOperativeRules } from './postOperative';
import { hrtAdjustmentRules } from './rules/hrtAdjustment';
import { dysphoriaFilteringRules } from './rules/dysphoriaFiltering';

// Re-export isInjectionDay for backwards compatibility
export { isInjectionDay } from './utils/hrtUtils';

// Maps rule IDs to their associated surgery types for message interpolation
const RULE_SURGERY_MAP: Record<string, SurgeryType[]> = {
  'PO-01': ['top_surgery'], 'PO-02': ['top_surgery'], 'PO-03': ['top_surgery'],
  'PO-04': ['bottom_surgery'], 'PO-05': ['bottom_surgery'],
  'PO-06': ['vaginoplasty'], 'PO-07': ['vaginoplasty'], 'PO-08': ['vaginoplasty'],
  'PO-09': ['ffs'], 'PO-10': ['ffs'], 'PO-11': ['ffs'],
  'PO-12': ['phalloplasty'], 'PO-13': ['phalloplasty'], 'PO-14': ['phalloplasty'],
  'PO-15': ['metoidioplasty'], 'PO-16': ['metoidioplasty'],
  'PO-17': ['orchiectomy'], 'PO-18': ['orchiectomy'],
  'PO-19': ['hysterectomy'], 'PO-20': ['hysterectomy'], 'PO-21': ['hysterectomy'],
  'PO-22': ['breast_augmentation'], 'PO-23': ['breast_augmentation'], 'PO-24': ['breast_augmentation'],
};

const ALL_RULES: Rule[] = [
  ...bindingSafetyRules,
  ...postOperativeRules,
  ...hrtAdjustmentRules,
  ...dysphoriaFilteringRules
];

export async function evaluateSafetyRules(
  userProfile: Profile,
  exercisePool: Exercise[]
): Promise<SafetyContext> {
  const context: EvaluationContext = {
    user_profile: userProfile,
    exercise_pool: exercisePool,
    current_date: new Date()
  };
  
  const safetyContext: SafetyContext = {
    critical_blocks: [],
    excluded_exercise_ids: [],
    modified_parameters: {},
    required_checkpoints: [],
    rules_applied: [],
    soft_filters: []
  };
  
  // Evaluate each rule in order
  for (const rule of ALL_RULES) {
    if (rule.condition(context)) {
      // Rule triggered!
      if (__DEV__) console.log(`✅ Rule triggered: ${rule.rule_id}`);

      applyRuleAction(rule, context, safetyContext);

      // Generate user-facing message
      const userMessage = generateUserMessage(rule, userProfile);

      // Log rule application
      safetyContext.rules_applied.push({
        rule_id: rule.rule_id,
        category: rule.category,
        action_taken: rule.action.type,
        context: {
          user_id: userProfile.user_id,
          timestamp: new Date().toISOString()
        },
        userMessage
      });
    }
  }
  
  return safetyContext;
}

function applyRuleAction(
  rule: Rule,
  context: EvaluationContext,
  safetyContext: SafetyContext
): void {
  const action = rule.action;

  switch (action.type) {
    case 'critical_block':
      safetyContext.critical_blocks.push(action.criteria);
      break;

    case 'exclude_exercises':
      const excludedIds = filterExcludedExercises(
        context.exercise_pool,
        action.criteria
      );
      safetyContext.excluded_exercise_ids.push(...excludedIds);
      break;

    case 'modify_parameters':
      // Merge parameters using the most RESTRICTIVE values
      // This handles overlapping surgeries by always choosing the safer option
      mergeModifiedParameters(safetyContext.modified_parameters, action.modification);
      break;

    case 'inject_checkpoint':
      safetyContext.required_checkpoints.push(action.checkpoint);
      break;

    case 'soft_filter':
      if (action.filter) {
        safetyContext.soft_filters.push(action.filter);
      }
      break;
  }
}

/**
 * Merge parameter modifications using the MOST RESTRICTIVE values.
 * This is critical for safety when multiple rules apply (e.g., multiple surgeries).
 *
 * For each parameter type:
 * - Higher is more restrictive: volume_reduction_percent, rest_seconds_increase, recovery_multiplier
 * - Lower is more restrictive: progressive_overload_rate, max_sets, max_weight (as number)
 * - Intensity uses a hierarchy: light < moderate < high (we want lowest)
 */
function mergeModifiedParameters(existing: Record<string, any>, incoming: Record<string, any>): void {
  for (const [key, value] of Object.entries(incoming)) {
    const existingValue = existing[key];

    // If no existing value, just set it
    if (existingValue === undefined) {
      existing[key] = value;
      continue;
    }

    // For numeric values, determine which direction is "more restrictive"
    if (typeof value === 'number' && typeof existingValue === 'number') {
      // Higher = more restrictive (use max)
      const higherIsMoreRestrictive = [
        'volume_reduction_percent',
        'rest_seconds_increase',
        'recovery_multiplier',
        'rest_seconds_reduction', // This is confusingly named but higher reduction = less rest
      ];

      // Lower = more restrictive (use min)
      const lowerIsMoreRestrictive = [
        'progressive_overload_rate',
        'max_sets',
        'max_workout_minutes',
        'lower_body_volume_percent',
        'upper_body_volume_percent',
      ];

      if (higherIsMoreRestrictive.includes(key)) {
        existing[key] = Math.max(existingValue, value);
      } else if (lowerIsMoreRestrictive.includes(key)) {
        existing[key] = Math.min(existingValue, value);
      } else {
        // Unknown numeric - default to more restrictive (higher)
        existing[key] = Math.max(existingValue, value);
      }
      continue;
    }

    // For intensity strings, use hierarchy
    if (key === 'suggested_intensity') {
      const intensityRank: Record<string, number> = {
        'very_light': 0,
        'light': 1,
        'moderate': 2,
        'high': 3,
        'very_high': 4
      };
      const existingRank = intensityRank[existingValue] ?? 2;
      const incomingRank = intensityRank[value as string] ?? 2;
      // Use lower intensity (more restrictive)
      existing[key] = existingRank <= incomingRank ? existingValue : value;
      continue;
    }

    // For rep_range, we'd need special parsing - for now, keep existing if conflict
    // For max_weight strings like "light (5-15 lbs)", keep the more restrictive (first one set)
    // Default: keep existing value (first rule wins for non-comparable types)
  }
}

function filterExcludedExercises(
  exercises: Exercise[],
  criteria: any
): number[] {
  return exercises
    .filter(ex => {
      // Check contraindications (only if both arrays exist)
      if (criteria.contraindications && ex.contraindications) {
        const hasContra = criteria.contraindications.some((c: string) =>
          ex.contraindications.includes(c)
        );
        if (hasContra) return true;
      }

      // Check custom filter
      if (criteria.custom_filter && criteria.custom_filter(ex)) {
        return true;
      }

      return false;
    })
    .map(ex => parseInt(ex.id));
}

// Generate user-facing message from rule, with template interpolation
function generateUserMessage(rule: Rule, profile: Profile): string | undefined {
  // If rule has a static message, use it
  if (rule.userMessage) {
    return rule.userMessage;
  }

  // If rule has a template, interpolate values
  if (rule.userMessageTemplate) {
    let message = rule.userMessageTemplate;

    // Calculate weeks post-op for surgery rules using the rule-surgery map
    if (rule.category === 'post_op') {
      const surgeryTypes = RULE_SURGERY_MAP[rule.rule_id];
      if (surgeryTypes && profile.surgeries) {
        const surgery = profile.surgeries.find(s =>
          surgeryTypes.includes(s.type as SurgeryType)
        );
        if (surgery) {
          const weeksPostOp = calculateWeeksPostOp(surgery.date);
          message = message.replace('{weeksPostOp}', String(weeksPostOp));
        }
      }
    }

    // HRT months interpolation
    if (profile.hrt_months_duration !== undefined) {
      message = message.replace('{hrtMonths}', String(profile.hrt_months_duration));
    }

    return message;
  }

  return undefined;
}

// Helper to calculate weeks post-op
function calculateWeeksPostOp(surgeryDate: Date): number {
  const now = new Date();
  const surgeryDateTime = new Date(surgeryDate).getTime();
  const diffTime = Math.abs(now.getTime() - surgeryDateTime);
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  return diffWeeks;
}

