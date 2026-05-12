-- Migration 009: Add binder_unsafe_cardio + is_aquatic safety flags to exercises
-- Created: 2026-05-11
-- Purpose: Close BS-01b (high-intensity cardio for ace-bandage users) and DYS-07
--   (aquatic exercises for swimming-dysphoria users) safety branches that were
--   silently dead because their underlying fields (intensity, environment) didn't
--   exist on the exercises table.
--
-- Posture: DEFAULT-DENY. Columns are nullable; rules treat NULL as "potentially
--   unsafe" and exclude the exercise for the at-risk profile. The backfill below
--   sets explicit true/false for EVERY existing row so no exercise is left in
--   the "unknown → hidden" state at rollout. Future new exercises added without
--   these flags set will be hidden from the at-risk groups until labeled — see
--   CLAUDE.md "Exercise authoring discipline" for the workflow.
--
-- Rollback: drop both columns. No data dependency on the columns from other tables.

BEGIN;

-- 1. Add columns (nullable for default-deny semantics)
ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS binder_unsafe_cardio BOOLEAN,
  ADD COLUMN IF NOT EXISTS is_aquatic BOOLEAN;

COMMENT ON COLUMN exercises.binder_unsafe_cardio IS
  'True if this cardio exercise is too high-impact for ace-bandage / DIY-binder users (BS-01b). NULL = unlabeled, treated as unsafe by default-deny rule logic. Set to FALSE explicitly for cardio exercises confirmed safe at any binder type.';

COMMENT ON COLUMN exercises.is_aquatic IS
  'True if this exercise requires water (pool, swim, water aerobics). Used by DYS-07 to filter for users with swimming dysphoria. NULL = unlabeled, treated as potentially aquatic by default-deny rule logic.';

-- 2. Backfill ALL existing rows with explicit values via heuristics.
--    The heuristics are intentionally conservative: when in doubt, mark unsafe.
--    Spot-check the results before treating the labels as authoritative.

-- 2a. is_aquatic backfill: name contains aquatic keyword OR equipment includes pool.
--     Conservative: any match → true. Everything else → false.
UPDATE exercises
SET is_aquatic = (
  LOWER(name) LIKE '%swim%'
  OR LOWER(name) LIKE '%aqua%'
  OR LOWER(name) LIKE '%water%'
  OR LOWER(name) LIKE '%pool%'
  OR (
    -- equipment is stored as JSON array; check if 'pool' is anywhere in the
    -- serialized representation. Imperfect but covers the common case.
    equipment::text ILIKE '%pool%'
  )
);

-- 2b. binder_unsafe_cardio backfill: applies only to cardio-pattern exercises.
--     For non-cardio, FALSE (the flag is irrelevant — other rules handle them).
--     For cardio: mark unsafe if difficulty is advanced OR name suggests
--     high-impact movement. Everything else → FALSE.
--
--     Rationale: BS-01b's intent was to catch high-intensity cardio that
--     happens to be marked binder_aware/heavy_binding_safe at the cell level
--     but is still too rib-loading for ace bandages in practice (e.g.
--     burpees, sprint intervals, jumping jacks at intensity).
UPDATE exercises
SET binder_unsafe_cardio = CASE
  WHEN pattern = 'cardio' AND (
    difficulty = 'advanced'
    OR LOWER(name) LIKE '%sprint%'
    OR LOWER(name) LIKE '%burpee%'
    OR LOWER(name) LIKE '%jump%'
    OR LOWER(name) LIKE '%hiit%'
    OR LOWER(name) LIKE '%interval%'
    OR LOWER(name) LIKE '%plyo%'
  ) THEN TRUE
  ELSE FALSE
END;

-- 3. Spot-check queries (run these, don't run the migration blind):
--    SELECT id, name, pattern, difficulty, binder_unsafe_cardio
--      FROM exercises WHERE pattern = 'cardio' ORDER BY binder_unsafe_cardio DESC, name;
--    SELECT id, name, pattern, is_aquatic
--      FROM exercises WHERE is_aquatic = TRUE ORDER BY name;
--    SELECT id, name FROM exercises WHERE binder_unsafe_cardio IS NULL OR is_aquatic IS NULL;
--      -- should return 0 rows after backfill

COMMIT;
