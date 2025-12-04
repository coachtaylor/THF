-- Education snippets table
-- Short, contextual tips about binding, HRT, and post-op recovery
-- Used by the "Helpful context for today" feature

CREATE TABLE IF NOT EXISTS education_snippets (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('binder', 'hrt', 'post_op', 'recovery_general')),
  title TEXT,
  text TEXT NOT NULL,

  -- Targeting fields (all optional)
  hrt_phase_min INTEGER,        -- minimum months on HRT
  hrt_phase_max INTEGER,        -- maximum months on HRT
  hrt_type TEXT CHECK (hrt_type IN ('estrogen_blockers', 'testosterone')),
  post_op_weeks_min INTEGER,    -- minimum weeks post-op
  post_op_weeks_max INTEGER,    -- maximum weeks post-op
  surgery_type TEXT CHECK (surgery_type IN ('top_surgery', 'bottom_surgery', 'ffs', 'orchiectomy')),
  binder_status TEXT CHECK (binder_status IN ('binding_today', 'binding_regularly', 'not_binding')),
  environment TEXT CHECK (environment IN ('home', 'gym', 'studio', 'outdoors', 'any')),

  -- Metadata
  is_active INTEGER NOT NULL DEFAULT 1,
  priority INTEGER DEFAULT 100,  -- Lower = higher priority
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookups by category
CREATE INDEX IF NOT EXISTS idx_snippets_category ON education_snippets(category);
CREATE INDEX IF NOT EXISTS idx_snippets_active ON education_snippets(is_active);
