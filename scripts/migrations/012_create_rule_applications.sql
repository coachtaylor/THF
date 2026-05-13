-- Migration 012: Create rule_applications audit table (Minimal tier)
--
-- Context: rules_audit decision resolved 2026-05-13. The codebase
-- previously claimed (in deleted `databaseStorage.ts`) that a safety-rules
-- audit trail existed "for legal protection." That was fiction — the
-- table didn't exist, the function never wrote a row. PR #71 deleted
-- that dead code as part of the H1 cleanup.
--
-- This migration creates a real audit trail for safety-rule applications.
-- Designed for the trans-health app population where the rules engine
-- filters exercises based on disclosed medical context (chest binding,
-- post-op recovery, body dysphoria triggers). When a user later asks
-- "did your system run the binder-cardio safety check on my plan?",
-- we want a queryable record proving it did.
--
-- Scope decisions (Minimal tier, see decision memo 2026-05-13):
--   - Write-only on the engine side; no user-facing UI in this migration.
--   - Plan/session linkage is nullable. At write time (during exercise
--     filtering), neither plan_id nor session_id exists yet. Joins via
--     timestamp + user are acceptable for the Minimal tier.
--   - RLS: users SELECT only their own rows; INSERT restricted to
--     service-role (the supabase client running with the user's auth
--     token has INSERT permission because the user_id matches auth.uid()).
--   - No retention policy in this migration. Forever-retention is the
--     default; revisit if a real legal opinion specifies otherwise.
--   - No monitoring in this migration. Operational verification is
--     manual (SELECT COUNT() periodically). Monitoring is a separate
--     deferred decision.
--
-- Rollback: DROP TABLE public.rule_applications CASCADE;

BEGIN;

CREATE TABLE public.rule_applications (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id                text,                          -- nullable; populated later if linkage available
    session_id             text,                          -- nullable; for session-time rule applications
    rule_id                text NOT NULL,                 -- e.g. 'BS-01b', 'DYS-07', 'USR-01'
    rule_category          text NOT NULL,                 -- e.g. 'binding_safety', 'dysphoria', 'user_preference'
    action_taken           text NOT NULL,                 -- the action the rule emitted
    context                jsonb,                         -- rule-emitted context payload
    excluded_exercise_ids  integer[],                     -- snapshot of excluded ids at this evaluation
    rules_applied_count    integer NOT NULL DEFAULT 1,    -- redundant convenience for analytics
    applied_at             timestamptz NOT NULL DEFAULT now(),
    created_at             timestamptz NOT NULL DEFAULT now()
);

-- Query patterns:
--   "All rules for a user, most recent first" — primary use case
CREATE INDEX idx_rule_applications_user_time
    ON public.rule_applications (user_id, applied_at DESC);

--   "Which users had rule X fire?" — rule-effectiveness analytics
CREATE INDEX idx_rule_applications_rule
    ON public.rule_applications (rule_id, applied_at DESC);

-- Row-level security
ALTER TABLE public.rule_applications ENABLE ROW LEVEL SECURITY;

-- Users can read only their own rule applications
CREATE POLICY "rule_applications_owner_read"
    ON public.rule_applications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert rows for themselves (the supabase client runs in the
-- user's auth context; user_id must match auth.uid()). This lets the
-- rules engine write directly via the user's session without service-role
-- credentials, matching the rest of the app's write model.
CREATE POLICY "rule_applications_owner_insert"
    ON public.rule_applications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE policies. Audit rows are immutable from the client.
-- (DELETE via ON DELETE CASCADE on auth.users still works for account deletion.)

COMMIT;

-- Post-migration verification:
--   SELECT COUNT(*) FROM public.rule_applications;            -- expect 0
--   SELECT policyname, cmd FROM pg_policies
--     WHERE schemaname='public' AND tablename='rule_applications';
--   -- expect: rule_applications_owner_read (SELECT),
--   --         rule_applications_owner_insert (INSERT)
