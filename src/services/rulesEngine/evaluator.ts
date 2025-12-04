import { Profile } from '../storage/profile';
import { Exercise } from '../../types/plan';
import { Rule, SafetyContext, EvaluationContext } from './rules/types';
import { bindingSafetyRules } from './rules/bindingSafety';
import { postOperativeRules } from './postOperative';
import { hrtAdjustmentRules } from './rules/hrtAdjustment';

const ALL_RULES: Rule[] = [
  ...bindingSafetyRules,
  ...postOperativeRules,
  ...hrtAdjustmentRules
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
    rules_applied: []
  };
  
  // Evaluate each rule in order
  for (const rule of ALL_RULES) {
    if (rule.condition(context)) {
      // Rule triggered!
      console.log(`✅ Rule triggered: ${rule.rule_id}`);

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
      Object.assign(safetyContext.modified_parameters, action.modification);
      break;
      
    case 'inject_checkpoint':
      safetyContext.required_checkpoints.push(action.checkpoint);
      break;
      
    case 'soft_filter':
      // Handled in exercise scoring, not here
      break;
  }
}

function filterExcludedExercises(
  exercises: Exercise[],
  criteria: any
): number[] {
  return exercises
    .filter(ex => {
      // Check contraindications
      if (criteria.contraindications) {
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

    // Calculate weeks post-op for surgery rules
    if (rule.category === 'post_op') {
      const topSurgery = profile.surgeries?.find(s => s.type === 'top_surgery');
      const bottomSurgery = profile.surgeries?.find(s => s.type === 'bottom_surgery');

      if (topSurgery) {
        const weeksPostOp = calculateWeeksPostOp(topSurgery.date);
        message = message.replace('{weeksPostOp}', String(weeksPostOp));
      }
      if (bottomSurgery) {
        const weeksPostOp = calculateWeeksPostOp(bottomSurgery.date);
        message = message.replace('{weeksPostOp}', String(weeksPostOp));
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