-- Migration 010: Add flagged_exercise_ids to profiles
-- Created: 2026-05-13
-- Purpose: Persist user-flagged "pain" exercises on the profile so future
--   workout generation can exclude them via rule USR-01 in the rules engine.
--   Closes the feedback-loop gap where flagging an exercise mid-session had
--   no effect on subsequent plans.
--
-- Posture: empty array default. Rule USR-01 short-circuits when the array
--   is empty/missing, so existing profiles are unaffected until the user
--   flags their first exercise.
--
-- RLS: public.profiles already restricts UPDATE to (auth.uid() = id). No
--   policy changes needed — owners can write their own flag list.
--
-- Rollback: drop column. No FK dependencies.

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS flagged_exercise_ids TEXT[] DEFAULT '{}'::text[];

COMMENT ON COLUMN public.profiles.flagged_exercise_ids IS
  'Exercise IDs the user has pain-flagged mid-session. Rule USR-01 excludes these from future workout generation. User clears entries via Settings → Pain-Flagged Exercises → "Try again". Type is TEXT[] (not UUID[]) because the in-app Exercise.id is a string for compatibility with the seeded exercise catalog.';

COMMIT;
