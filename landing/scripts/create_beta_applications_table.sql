-- Trans Health & Fitness Beta Applications Table
-- Run this migration in your Supabase SQL Editor

-- Create the beta_applications table
CREATE TABLE IF NOT EXISTS public.beta_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- User info
  name TEXT NOT NULL,
  pronouns TEXT,
  email TEXT NOT NULL UNIQUE,

  -- Identity
  self_description TEXT,

  -- Current status (checkboxes)
  status_hrt BOOLEAN DEFAULT FALSE,
  status_binding BOOLEAN DEFAULT FALSE,
  status_pre_surgery BOOLEAN DEFAULT FALSE,
  status_post_surgery BOOLEAN DEFAULT FALSE,
  status_none BOOLEAN DEFAULT FALSE,

  -- Open-ended
  help_with TEXT,

  -- Agreements
  interested_in_beta BOOLEAN DEFAULT FALSE,
  agrees_to_guidelines BOOLEAN DEFAULT FALSE,

  -- Admin fields
  reviewed BOOLEAN DEFAULT FALSE,
  approved BOOLEAN,
  notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT
);

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_beta_applications_email ON public.beta_applications(email);

-- Add index for admin review queries
CREATE INDEX IF NOT EXISTS idx_beta_applications_reviewed ON public.beta_applications(reviewed, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.beta_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (submit applications)
CREATE POLICY "Anyone can submit beta applications" ON public.beta_applications
  FOR INSERT WITH CHECK (true);

-- Policy: Only service_role can read (for admin dashboard)
CREATE POLICY "Only service_role can read beta applications" ON public.beta_applications
  FOR SELECT USING (auth.role() = 'service_role');

-- Policy: Only service_role can update (for admin review)
CREATE POLICY "Only service_role can update beta applications" ON public.beta_applications
  FOR UPDATE USING (auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE public.beta_applications IS 'Beta tester applications for Trans Health & Fitness Founding Athlete program';
