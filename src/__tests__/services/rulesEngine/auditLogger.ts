import { supabase } from '../../utils/supabase';
import { SafetyContext } from './rules/types';

export async function logRulesAudit(
  userId: string,
  workoutId: string | null,
  safetyContext: SafetyContext
): Promise<void> {
  for (const application of safetyContext.rules_applied) {
    try {
      await supabase.from('rules_audit_log').insert({
        user_id: userId,
        workout_id: workoutId,
        rule_category: application.category,
        rule_id: application.rule_id,
        rule_triggered: true,
        evaluation_context: application.context,
        action_taken: application.action_taken,
        rules_engine_version: '1.0',
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log rule application:', error);
      // Don't fail workout generation if logging fails
    }
  }
}