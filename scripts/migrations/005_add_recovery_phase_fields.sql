-- Migration: Add recovery phase fields to exercises table
-- Purpose: Support low-impact exercise categorization for post-surgery recovery
-- Created: 2025-01-XX

-- Add recovery phase tagging to exercises table
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS recovery_phases TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS impact_level TEXT CHECK (impact_level IN ('no_impact', 'very_low_impact', 'low_impact', 'moderate_impact', 'high_impact')),
ADD COLUMN IF NOT EXISTS earliest_safe_phase TEXT CHECK (earliest_safe_phase IN ('immediate', 'early', 'mid', 'late', 'maintenance'));

-- Add research source tracking for exercises discovered via research analyzer
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS research_source_ids UUID[] DEFAULT '{}';

-- Create indexes for recovery phase queries
CREATE INDEX IF NOT EXISTS idx_exercises_recovery_phases ON exercises USING GIN (recovery_phases);
CREATE INDEX IF NOT EXISTS idx_exercises_earliest_phase ON exercises (earliest_safe_phase);
CREATE INDEX IF NOT EXISTS idx_exercises_impact_level ON exercises (impact_level);

-- Add comments for documentation
COMMENT ON COLUMN exercises.recovery_phases IS 'Array of recovery phases this exercise is appropriate for: immediate, early, mid, late, maintenance';
COMMENT ON COLUMN exercises.impact_level IS 'Impact classification for recovery safety: no_impact, very_low_impact, low_impact, moderate_impact, high_impact';
COMMENT ON COLUMN exercises.earliest_safe_phase IS 'Earliest recovery phase when this exercise can be introduced';
COMMENT ON COLUMN exercises.research_source_ids IS 'UUIDs of research articles from transfit_research that support this exercise';

-- Phase definitions for reference:
-- immediate: Week 0-2 post-surgery (very gentle only)
-- early: Week 2-6 post-surgery
-- mid: Week 6-12 post-surgery
-- late: Week 12-24 post-surgery
-- maintenance: Week 24+ (long-term)
