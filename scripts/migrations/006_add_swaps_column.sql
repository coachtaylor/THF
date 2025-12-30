-- Migration: Add swaps column to exercises table
-- Purpose: Store exercise swap recommendations as JSONB array

-- Add swaps column to store swap recommendations
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS swaps JSONB DEFAULT '[]'::jsonb;

-- Add index for faster queries when filtering exercises with swaps
CREATE INDEX IF NOT EXISTS idx_exercises_swaps ON exercises USING gin(swaps);

-- Add comment explaining the column
COMMENT ON COLUMN exercises.swaps IS 'Array of swap recommendations: [{exercise_id: number, rationale: string}]';
