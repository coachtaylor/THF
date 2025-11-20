-- Migration: Add raw_equipment column to public.exercises table
-- Date: 2025-01-XX
-- Description: Adds raw_equipment column to store original equipment labels from staging tables

-- Add raw_equipment column if it doesn't exist
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS raw_equipment TEXT;

-- Add comment to document the column
COMMENT ON COLUMN public.exercises.raw_equipment IS 
  'Raw equipment label(s) from source data (e.g. "BODY WEIGHT", "DUMBBELL", "CABLE MACHINE"). '
  'Stored as comma-separated string or single value. Used for precise equipment matching.';

-- Optional: Create index for faster queries if needed
-- CREATE INDEX IF NOT EXISTS idx_exercises_raw_equipment ON public.exercises USING gin(to_tsvector('english', raw_equipment));

