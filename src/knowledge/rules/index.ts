/**
 * Rules Engine Re-exports
 *
 * The rules logic stays in src/services/rulesEngine/ (version-controlled TypeScript).
 * This module provides a clean import path as part of the knowledge engine.
 */

// Re-export from the existing rules engine
export {
  evaluateRules,
  evaluateRulesForExercise,
  evaluateBindingRules,
  evaluatePostOpRules,
  evaluateHrtRules,
  getActiveCheckpoints,
  filterExercisesByRules,
} from '../../services/rulesEngine/evaluator';

// Re-export rule types
export type {
  Rule,
  RuleAction,
  RuleCategory,
  RuleSeverity,
  RuleActionType,
  RuleEvaluationContext,
  RuleEvaluationResult,
  Checkpoint,
} from '../../services/rulesEngine/rules/types';

// Re-export specific rule sets
export { BINDING_SAFETY_RULES } from '../../services/rulesEngine/rules/bindingSafety';
export { HRT_ADJUSTMENT_RULES } from '../../services/rulesEngine/rules/hrtAdjustment';
export { POST_OP_RULES } from '../../services/rulesEngine/postOperative';
