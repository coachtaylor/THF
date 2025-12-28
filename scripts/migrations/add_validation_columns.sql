-- ============================================
-- Validation Columns Migration
-- ============================================
-- This migration adds columns for tracking article validation status
-- in the research analyzer pipeline.
--
-- Run this migration to enable DOI validation, source filtering,
-- and confidence threshold features.
-- ============================================

-- ============================================
-- 1. Add validation tracking columns to transfit_research
-- ============================================

-- Validation status: pending, validated, failed_doi, failed_source, failed_confidence, skipped
ALTER TABLE transfit_research ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending';

-- Whether CrossRef validated this DOI
ALTER TABLE transfit_research ADD COLUMN IF NOT EXISTS crossref_validated BOOLEAN DEFAULT NULL;

-- Whether the article is peer-reviewed (from CrossRef metadata)
ALTER TABLE transfit_research ADD COLUMN IF NOT EXISTS is_peer_reviewed BOOLEAN DEFAULT NULL;

-- When validation was performed
ALTER TABLE transfit_research ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ DEFAULT NULL;

-- Error message if validation failed
ALTER TABLE transfit_research ADD COLUMN IF NOT EXISTS validation_error TEXT DEFAULT NULL;


-- ============================================
-- 2. Create indexes for efficient querying
-- ============================================

-- Index for filtering by validation status
CREATE INDEX IF NOT EXISTS idx_transfit_research_validation_status
ON transfit_research(validation_status);

-- Index for finding CrossRef validated articles
CREATE INDEX IF NOT EXISTS idx_transfit_research_crossref_validated
ON transfit_research(crossref_validated)
WHERE crossref_validated = TRUE;

-- Index for finding peer-reviewed articles
CREATE INDEX IF NOT EXISTS idx_transfit_research_peer_reviewed
ON transfit_research(is_peer_reviewed)
WHERE is_peer_reviewed = TRUE;


-- ============================================
-- 3. Add comments for documentation
-- ============================================

COMMENT ON COLUMN transfit_research.validation_status IS
  'Article validation status: pending, validated, failed_doi, failed_source, failed_confidence, skipped';

COMMENT ON COLUMN transfit_research.crossref_validated IS
  'True if DOI was verified via CrossRef API';

COMMENT ON COLUMN transfit_research.is_peer_reviewed IS
  'True if CrossRef metadata indicates peer-reviewed type (journal-article, etc.)';

COMMENT ON COLUMN transfit_research.validated_at IS
  'Timestamp when validation was last performed';

COMMENT ON COLUMN transfit_research.validation_error IS
  'Error message if validation failed';


-- ============================================
-- 4. Update research_insights table for confidence tracking
-- ============================================
-- NOTE: Only run these if research_insights table exists
-- (requires running create_research_analysis_tables.sql first)

-- Wrap in DO block to check if table exists first
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'research_insights') THEN
        -- Add original confidence level (text) if not exists
        ALTER TABLE research_insights
        ADD COLUMN IF NOT EXISTS original_confidence TEXT DEFAULT NULL;

        -- Add passed_threshold flag
        ALTER TABLE research_insights
        ADD COLUMN IF NOT EXISTS passed_threshold BOOLEAN DEFAULT TRUE;

        RAISE NOTICE 'research_insights table updated with confidence columns';
    ELSE
        RAISE NOTICE 'research_insights table does not exist - skipping confidence columns. Run create_research_analysis_tables.sql first if needed.';
    END IF;
END
$$;


-- ============================================
-- Done!
-- ============================================
-- To run this migration:
-- 1. Connect to your Supabase database
-- 2. Execute this SQL script
--
-- Or use the Supabase CLI:
-- supabase db push
--
-- Or run via Supabase SQL Editor in the dashboard
-- ============================================
