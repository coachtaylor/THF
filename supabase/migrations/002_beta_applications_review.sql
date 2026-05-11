-- Extend beta_applications with review/approval workflow columns.
--
-- The landing form (landing/src/components/ApplicationForm.tsx → supabase
-- beta_applications insert) captures applicant data. Until now there was
-- no way to mark someone reviewed/approved/invited from the database
-- itself.
--
-- This migration adds the minimum columns to run a Supabase Studio
-- workflow (no admin UI required) for the first ~20 founding athletes.
-- When we outgrow Studio (probably 50-100 applicants), the right next
-- step is an authenticated /admin route in the landing Next.js app.
--
-- Run in Supabase Studio → SQL Editor on the same project as the
-- landing site (NEXT_PUBLIC_SUPABASE_URL).

-- Application status moves through a tiny state machine:
--   'pending'  → freshly submitted, not yet reviewed (default)
--   'approved' → manually approved by a reviewer
--   'invited'  → TestFlight invite email sent
--   'rejected' → reviewed and declined (no email sent — silence is fine)
--   'duplicate' → email already exists in a prior application
ALTER TABLE public.beta_applications
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'invited', 'rejected', 'duplicate')),
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reviewed_by TEXT,        -- free-text reviewer name (you, for now)
    ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS notes TEXT,              -- reviewer-only notes; never shown to applicant
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT now();

-- Index status for fast filtering of the queue.
CREATE INDEX IF NOT EXISTS beta_applications_status_idx
    ON public.beta_applications (status);

CREATE INDEX IF NOT EXISTS beta_applications_submitted_at_idx
    ON public.beta_applications (submitted_at DESC);

-- Tighten RLS: form submits via anon (already works), reviewers read/update
-- via service role only. No anon SELECT/UPDATE/DELETE.
--
-- (If you previously had open RLS, this hardens it. Existing policies are
-- left in place — we add nothing for anon SELECT, which means anon can't
-- read.)
ALTER TABLE public.beta_applications ENABLE ROW LEVEL SECURITY;

-- Make sure anon can still INSERT (the form needs this).
DROP POLICY IF EXISTS "beta_applications_insert_anon" ON public.beta_applications;
CREATE POLICY "beta_applications_insert_anon"
    ON public.beta_applications
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- No SELECT/UPDATE/DELETE policies for anon. Service role (Supabase Studio
-- + server scripts) bypasses RLS, so the runbook below works.
