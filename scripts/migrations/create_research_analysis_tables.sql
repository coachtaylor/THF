-- ============================================
-- Research Analysis Tables Migration
-- ============================================
-- This migration adds tables and columns needed for the research analyzer
-- to store extracted insights and rule recommendations.
--
-- Run this migration before using the research_analyzer script.
-- ============================================

-- ============================================
-- 1. Add columns to transfit_research table
-- ============================================

-- Add structured_summary column for JSON storage of extracted insights
ALTER TABLE transfit_research
ADD COLUMN IF NOT EXISTS structured_summary JSONB;

-- Add extraction_status to track processing state
ALTER TABLE transfit_research
ADD COLUMN IF NOT EXISTS extraction_status TEXT DEFAULT 'pending';

-- Add last_analyzed_at for tracking when analysis was run
ALTER TABLE transfit_research
ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMP WITH TIME ZONE;

-- Create index on extraction_status for efficient queries
CREATE INDEX IF NOT EXISTS idx_transfit_research_extraction_status
ON transfit_research(extraction_status);

-- Create index on last_analyzed_at for finding articles needing reprocessing
CREATE INDEX IF NOT EXISTS idx_transfit_research_last_analyzed
ON transfit_research(last_analyzed_at);


-- ============================================
-- 2. Create research_insights table
-- ============================================
-- Stores individual extracted insights from research articles

CREATE TABLE IF NOT EXISTS research_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to source article
  research_id UUID REFERENCES transfit_research(id) ON DELETE CASCADE,

  -- Insight type: 'surgery_timeline', 'hrt_effect', 'contraindication'
  insight_type TEXT NOT NULL,

  -- Full insight data as JSON
  insight_data JSONB NOT NULL,

  -- Surgery-related fields (for surgery_timeline and some contraindications)
  surgery_type TEXT,
  phase_start_weeks INTEGER,
  phase_end_weeks INTEGER,

  -- HRT-related fields (for hrt_effect and some contraindications)
  hrt_type TEXT,

  -- Confidence score (0.00 to 1.00)
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Review tracking
  needs_review BOOLEAN DEFAULT TRUE,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_research_insights_type
ON research_insights(insight_type);

CREATE INDEX IF NOT EXISTS idx_research_insights_research_id
ON research_insights(research_id);

CREATE INDEX IF NOT EXISTS idx_research_insights_surgery_type
ON research_insights(surgery_type)
WHERE surgery_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_research_insights_hrt_type
ON research_insights(hrt_type)
WHERE hrt_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_research_insights_needs_review
ON research_insights(needs_review)
WHERE needs_review = TRUE;

-- Enable RLS
ALTER TABLE research_insights ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "service_role_all_research_insights"
ON research_insights
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read (for future admin UI)
CREATE POLICY "authenticated_read_research_insights"
ON research_insights
FOR SELECT
TO authenticated
USING (true);


-- ============================================
-- 3. Create rule_recommendations table
-- ============================================
-- Stores proposed rules generated from research analysis

CREATE TABLE IF NOT EXISTS rule_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Rule identification
  rule_category TEXT NOT NULL,  -- 'post_op', 'hrt_adjustment', 'binding_safety'
  proposed_rule_id TEXT,        -- e.g., 'PO-06', 'HRT-05'

  -- Full rule specification as JSON (matches rules engine format)
  rule_spec JSONB NOT NULL,

  -- Supporting evidence
  source_research_ids UUID[],
  evidence_summary TEXT,

  -- Status tracking
  status TEXT DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'under_review', 'approved', 'rejected', 'implemented')),

  -- Priority for review
  priority TEXT DEFAULT 'medium'
    CHECK (priority IN ('critical', 'high', 'medium', 'low')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  implemented_at TIMESTAMP WITH TIME ZONE,

  -- Notes from review
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rule_recommendations_category
ON rule_recommendations(rule_category);

CREATE INDEX IF NOT EXISTS idx_rule_recommendations_status
ON rule_recommendations(status);

CREATE INDEX IF NOT EXISTS idx_rule_recommendations_priority
ON rule_recommendations(priority);

-- Enable RLS
ALTER TABLE rule_recommendations ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "service_role_all_rule_recommendations"
ON rule_recommendations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can read
CREATE POLICY "authenticated_read_rule_recommendations"
ON rule_recommendations
FOR SELECT
TO authenticated
USING (true);


-- ============================================
-- 4. Create helper view for gap analysis
-- ============================================
-- Summarizes research insights by surgery type and phase

CREATE OR REPLACE VIEW research_surgery_coverage AS
SELECT
  surgery_type,
  phase_start_weeks,
  phase_end_weeks,
  COUNT(*) as insight_count,
  AVG(confidence_score) as avg_confidence,
  array_agg(DISTINCT research_id) as research_ids
FROM research_insights
WHERE insight_type = 'surgery_timeline'
  AND surgery_type IS NOT NULL
GROUP BY surgery_type, phase_start_weeks, phase_end_weeks
ORDER BY surgery_type, phase_start_weeks;


-- ============================================
-- 5. Create helper view for HRT coverage
-- ============================================

CREATE OR REPLACE VIEW research_hrt_coverage AS
SELECT
  hrt_type,
  (insight_data->>'timeline_months_start')::int as months_start,
  (insight_data->>'timeline_months_end')::int as months_end,
  insight_data->>'effect_category' as effect_category,
  COUNT(*) as insight_count,
  AVG(confidence_score) as avg_confidence,
  array_agg(DISTINCT research_id) as research_ids
FROM research_insights
WHERE insight_type = 'hrt_effect'
  AND hrt_type IS NOT NULL
GROUP BY
  hrt_type,
  (insight_data->>'timeline_months_start')::int,
  (insight_data->>'timeline_months_end')::int,
  insight_data->>'effect_category'
ORDER BY hrt_type, months_start;


-- ============================================
-- 6. Grant permissions
-- ============================================

-- Grant usage to authenticated users (for future admin UI)
GRANT SELECT ON research_insights TO authenticated;
GRANT SELECT ON rule_recommendations TO authenticated;
GRANT SELECT ON research_surgery_coverage TO authenticated;
GRANT SELECT ON research_hrt_coverage TO authenticated;


-- ============================================
-- Done!
-- ============================================
-- To run this migration:
-- 1. Connect to your Supabase database
-- 2. Execute this SQL script
--
-- Or use the Supabase CLI:
-- supabase db push
-- ============================================
