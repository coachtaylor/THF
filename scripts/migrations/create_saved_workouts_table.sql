-- Migration: Create saved_workouts table for favorite/saved workouts
-- Date: 2024-12-04
-- Description: Allows users to save/favorite workouts and swap them into their schedule

-- Create saved_workouts table
CREATE TABLE IF NOT EXISTS public.saved_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Workout identification (where it came from)
  plan_id TEXT,                    -- Original plan ID (nullable for custom workouts)
  day_number INTEGER,              -- Day number in the plan (nullable for custom)
  duration INTEGER NOT NULL,       -- Workout duration: 30, 45, 60, or 90 minutes

  -- Workout snapshot (stored as JSON to preserve workout state at save time)
  workout_name TEXT NOT NULL,
  workout_data JSONB NOT NULL,     -- Full workout data including exercises

  -- User interaction
  notes TEXT,                      -- User notes about why they saved it
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  use_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.saved_workouts IS 'User-saved/favorited workouts that can be swapped into schedule';
COMMENT ON COLUMN public.saved_workouts.workout_data IS 'Full workout JSON including exercises array with exerciseId, sets, reps, etc.';
COMMENT ON COLUMN public.saved_workouts.use_count IS 'Number of times this saved workout has been used/swapped in';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_workouts_user_id ON public.saved_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_workouts_saved_at ON public.saved_workouts(saved_at DESC);

-- Enable Row Level Security
ALTER TABLE public.saved_workouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can only access their own saved workouts
CREATE POLICY "Users can view own saved workouts" ON public.saved_workouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved workouts" ON public.saved_workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved workouts" ON public.saved_workouts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved workouts" ON public.saved_workouts
  FOR DELETE USING (auth.uid() = user_id);

-- Verify table creation
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'saved_workouts'
ORDER BY ordinal_position;
