-- Migration: 008_create_safety_rules_config
-- Purpose: Store proprietary safety rule configurations externally
-- This table stores the numerical values/thresholds that make up the "secret sauce"
-- while the rule logic remains in the codebase

-- Create the safety rules configuration table
CREATE TABLE IF NOT EXISTS safety_rules_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_category TEXT NOT NULL,
  rule_id TEXT NOT NULL UNIQUE,
  config JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast lookups by category
CREATE INDEX IF NOT EXISTS idx_safety_rules_category ON safety_rules_config(rule_category);
CREATE INDEX IF NOT EXISTS idx_safety_rules_active ON safety_rules_config(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE safety_rules_config ENABLE ROW LEVEL SECURITY;

-- Read-only policy for authenticated users (configs are read at app start)
CREATE POLICY "Authenticated users can read active configs"
  ON safety_rules_config
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admin-only write access (you'll manage via Supabase dashboard)
-- No INSERT/UPDATE/DELETE policies for regular users

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_safety_rules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER safety_rules_config_updated
  BEFORE UPDATE ON safety_rules_config
  FOR EACH ROW
  EXECUTE FUNCTION update_safety_rules_timestamp();

-- Add comment for documentation
COMMENT ON TABLE safety_rules_config IS 'Stores proprietary safety rule configurations (HRT phases, binding thresholds, post-op timelines). Values are fetched at app init and cached.';
