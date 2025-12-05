-- Migration: Create equipment_requests table for product analytics
-- Date: 2024-12-04
-- Description: Captures user-submitted "other" equipment for product insights
--              This helps identify popular equipment types to add to the app

CREATE TABLE IF NOT EXISTS public.equipment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- nullable for anonymous users
  equipment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.equipment_requests IS 'User-submitted equipment requests for product analytics';
COMMENT ON COLUMN public.equipment_requests.equipment_text IS 'Free-text equipment description from onboarding';
COMMENT ON COLUMN public.equipment_requests.user_id IS 'Optional user reference - null if user not authenticated';

-- Create index for analytics queries (sorted by recency)
CREATE INDEX IF NOT EXISTS idx_equipment_requests_created_at
  ON public.equipment_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.equipment_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy - allow inserts from authenticated users
CREATE POLICY "Users can insert equipment requests" ON public.equipment_requests
  FOR INSERT WITH CHECK (true);

-- RLS Policy - only service_role can read (for product analytics dashboard)
CREATE POLICY "Only admins can read equipment requests" ON public.equipment_requests
  FOR SELECT USING (auth.role() = 'service_role');
