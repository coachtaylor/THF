import { supabase } from '../../utils/supabase';
import { SafetyContext } from './rules/types';

/**
 * Writes one row per applied safety rule into `public.rule_applications`.
 *
 * Fire-and-forget: this never throws and never blocks the caller. If the
 * write fails (offline, RLS, network), we log and move on — the user's
 * workout still generates. This is the trans-health app's safety-rule
 * audit trail (Minimal tier per 2026-05-13 decision); losing a row to a
 * transient failure is acceptable, but breaking generation over an audit
 * write is not.
 *
 * Plan/session linkage is intentionally nullable. At rules-engine
 * evaluation time, neither id is known yet — the engine runs as part of
 * exercise filtering, before plan assembly. Joining via (user_id,
 * applied_at) is sufficient for the Minimal tier.
 */
export async function logRuleApplications(
  userId: string,
  safetyContext: SafetyContext,
  options?: { planId?: string | null; sessionId?: string | null },
): Promise<void> {
  if (!supabase) return;
  if (safetyContext.rules_applied.length === 0) return;

  const rows = safetyContext.rules_applied.map((application) => ({
    user_id: userId,
    plan_id: options?.planId ?? null,
    session_id: options?.sessionId ?? null,
    rule_id: application.rule_id,
    rule_category: application.category,
    action_taken: application.action_taken,
    context: application.context ?? null,
    excluded_exercise_ids: safetyContext.excluded_exercise_ids,
    rules_applied_count: safetyContext.rules_applied.length,
  }));

  try {
    const { error } = await supabase.from('rule_applications').insert(rows);
    if (error) {
      console.warn('rule_applications insert failed:', error.message);
    }
  } catch (error) {
    console.warn('rule_applications insert threw:', error);
  }
}
