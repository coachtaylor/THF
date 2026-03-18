-- TransFitness: Create Missing Tables with RLS
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor
--
-- This migration creates tables that the app code references but don't exist yet:
-- 1. profiles - Cloud sync of user profile data
-- 2. rules_audit_log - Safety rule audit trail for transparency

-- ============================================================================
-- PROFILES TABLE
-- Purpose: Cloud sync of user profile (gender identity, HRT status, etc.)
-- Used by: src/services/storage/profile.ts:236 (syncProfileToCloud)
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  -- Use the auth.users id as primary key (1:1 relationship)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Email for quick lookup (denormalized from auth.users)
  email TEXT,

  -- Full profile data as JSONB (includes all onboarding data)
  -- Fields: gender_identity, hrt_status, binding_practices, surgeries, dysphoria_triggers, etc.
  profile JSONB NOT NULL,

  -- Sync tracking
  synced_at TIMESTAMPTZ DEFAULT NOW(),

  -- Audit timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only manage their own profile
-- This is critical for data privacy - users must never see other users' profiles
CREATE POLICY "Users can manage own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_synced_at ON profiles(synced_at);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();


-- ============================================================================
-- RULES_AUDIT_LOG TABLE
-- Purpose: Audit trail for safety rules (binding safety, post-op, HRT, dysphoria)
-- Used by: src/services/rulesEngine/auditLogger.ts:11
-- This powers the "why was this exercise filtered" transparency feature
-- ============================================================================

CREATE TABLE IF NOT EXISTS rules_audit_log (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User who generated this workout
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Which workout this rule was applied to (nullable for planning queries)
  workout_id TEXT,

  -- Rule identification
  rule_category TEXT NOT NULL,  -- 'binding_safety', 'post_operative', 'hrt_adjustment', 'dysphoria_filtering'
  rule_id TEXT NOT NULL,        -- 'BS-01', 'PO-12', 'HRT-E-03', 'DYS-02', etc.

  -- Whether the rule was triggered (always true when logged, but useful for queries)
  rule_triggered BOOLEAN DEFAULT TRUE,

  -- Context that caused the rule to trigger (JSONB for flexibility)
  -- Example: {"binding_type": "binder", "workout_duration_minutes": 45}
  evaluation_context JSONB,

  -- What action the rules engine took
  -- Example: "Excluded bench press due to binding safety", "Reduced intensity by 20%"
  action_taken TEXT,

  -- Version tracking for rules engine changes
  rules_engine_version TEXT DEFAULT '1.0',

  -- When this rule was evaluated
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE rules_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own audit logs (transparency)
CREATE POLICY "Users can view own audit logs" ON rules_audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: System can insert audit logs for any user
-- This allows the rules engine to log entries using the anon/service role
CREATE POLICY "System can insert audit logs" ON rules_audit_log
  FOR INSERT WITH CHECK (true);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_rules_audit_log_user_id ON rules_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_rules_audit_log_workout_id ON rules_audit_log(workout_id);
CREATE INDEX IF NOT EXISTS idx_rules_audit_log_rule_category ON rules_audit_log(rule_category);
CREATE INDEX IF NOT EXISTS idx_rules_audit_log_created_at ON rules_audit_log(created_at DESC);


-- ============================================================================
-- VERIFICATION QUERIES
-- Run these after the migration to verify everything is set up correctly
-- ============================================================================

-- Check that RLS is enabled on both tables
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('profiles', 'rules_audit_log');

-- Check that policies exist
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('profiles', 'rules_audit_log');

-- Test insert (replace with a real user ID from auth.users)
-- INSERT INTO profiles (id, email, profile) VALUES ('your-user-uuid', 'test@example.com', '{"test": true}'::jsonb);

-- Verify you can only see your own profile (should return 1 row if logged in as that user)
-- SELECT * FROM profiles;
