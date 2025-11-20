
-- Staging table for ExerciseDB exercises with trans-specific fields
-- Generated: 2025-11-18 08:44:18
-- Total exercises: 161
-- 
-- NOTE: Some fields are auto-inferred and should be reviewed:
--   - difficulty, binder_aware, heavy_binding_safe, pelvic_floor_safe (auto-inferred)
--   - cues, breathing, coaching_points, common_errors (need manual curation)
--   - progressions, regressions, swaps (need manual curation)

CREATE TABLE IF NOT EXISTS staging_exercisedb (
  slug TEXT,
  name TEXT,
  pattern TEXT,              -- e.g., "strength", "core", "mobility", "cardio"
  goal TEXT,                 -- e.g., "strength", "mobility", "endurance"
  equipment TEXT[],          -- normalized tokens (Postgres array)
  difficulty TEXT,           -- "beginner", "intermediate", "advanced"
  binder_aware BOOLEAN,      -- Safe for chest binding
  heavy_binding_safe BOOLEAN, -- Safe for heavy/tight binding
  pelvic_floor_safe BOOLEAN,  -- Safe for pelvic floor considerations
  contraindications TEXT[],  -- Array of contraindications
  cue_primary TEXT,          -- Primary cue for form
  cues TEXT[],               -- Array of form cues
  breathing TEXT,            -- Breathing pattern/cue
  coaching_points TEXT[],    -- Coaching tips
  common_errors TEXT[],      -- Common mistakes to avoid
  progressions TEXT[],       -- Progressions (exercise slugs/names)
  regressions TEXT[],        -- Regressions (exercise slugs/names)
  swaps TEXT[],              -- Alternative exercises (exercise slugs/names)
  -- API metadata (for reference)
  body_parts TEXT,          -- comma-separated body parts from API
  exercise_type TEXT,       -- STRENGTH, CARDIO, etc. from API
  target_muscles TEXT,      -- comma-separated target muscles from API
  media_thumb TEXT,
  media_video TEXT,
  source_url TEXT,
  external_id TEXT
);

-- To import from CSV (if using Supabase/Postgres):
-- COPY staging_exercisedb (slug, name, equipment, media_thumb, media_video, source_url, external_id)
-- FROM '/path/to/staging_exercisedb.csv'
-- WITH (FORMAT csv, HEADER true);

-- Or use INSERT statements (for SQLite or other databases):
-- Note: For SQLite, you may need to parse the JSON equipment array differently
