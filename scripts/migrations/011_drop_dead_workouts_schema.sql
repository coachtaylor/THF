-- Migration 011: Drop dead workouts + workout_exercises tables
--
-- Context: H1 resolution from the Workout Session Epic audit
-- (see memory/audit_workout_session_epic.md).
--
-- These two tables were designed to hold structured per-set workout data
-- but never received any rows. The write path in
-- src/services/workoutGeneration/databaseStorage.ts had column-name
-- mismatches (passed `estimated_duration_minutes` instead of
-- `duration_minutes`; passed non-existent `format` column to
-- workout_exercises) which silently 22001-failed inside a try/catch that
-- logged a console.warn and returned a fake `test-${Date.now()}` ID.
--
-- No app code reads from `workouts.status` or
-- `workout_exercises.actual_*[]` on cloud. All workout history reads
-- the JSONB blob on `workout_sessions`. The two tables here are dead
-- schema.
--
-- This migration drops them along with the (also empty) `rules_audit`
-- references should they exist. The decision on whether to build a real
-- rules_audit table for legal-protection of safety-rule application is
-- being tracked separately (spawned task 2026-05-13).
--
-- Verification before applying:
--   SELECT COUNT(*) FROM public.workouts;             -- expect 0
--   SELECT COUNT(*) FROM public.workout_exercises;    -- expect 0
--
-- Rollback: re-create from the original schema in 001_create_missing_tables.sql
-- (the column-name mismatches in the write path were never fixed, so even
-- a re-created schema would not have received writes — there's nothing
-- to back-restore).

BEGIN;

DROP TABLE IF EXISTS public.workout_exercises CASCADE;
DROP TABLE IF EXISTS public.workouts CASCADE;

COMMIT;

-- Post-migration verification:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema='public' AND table_name IN ('workouts','workout_exercises');
--   -- expect: 0 rows
