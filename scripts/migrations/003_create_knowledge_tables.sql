-- TransFitness Knowledge Engine Tables
-- Part 2 of Platform Evolution Strategy
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
--
-- This script creates:
-- 1. knowledge_entries table (Q&A content for Copilot)
-- 2. safety_guides table (Guide content)
-- 3. rule_metadata table (Rule documentation)
-- 4. RLS policies for each table

-- =============================================
-- STEP 1: Create knowledge_entries table
-- =============================================
-- Stores Q&A pairs for the Copilot feature
-- Migrated from src/services/copilot/knowledgeBase.ts

CREATE TABLE IF NOT EXISTS public.knowledge_entries (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('binding', 'hrt', 'post_op', 'exercise', 'recovery', 'dysphoria', 'general')),
  subcategory TEXT,
  keywords TEXT[] NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,

  -- Context targeting (who sees this)
  requires_binding BOOLEAN DEFAULT FALSE,
  requires_hrt BOOLEAN DEFAULT FALSE,
  hrt_type TEXT CHECK (hrt_type IS NULL OR hrt_type IN ('estrogen_blockers', 'testosterone')),
  requires_surgery BOOLEAN DEFAULT FALSE,
  surgery_type TEXT CHECK (surgery_type IS NULL OR surgery_type IN ('top_surgery', 'bottom_surgery', 'ffs', 'orchiectomy')),

  -- Related content
  related_guide TEXT,  -- slug reference to safety_guides
  source TEXT,         -- citation/source

  -- Admin fields
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 100,  -- Lower = higher priority
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON public.knowledge_entries(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_active ON public.knowledge_entries(is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_keywords ON public.knowledge_entries USING GIN(keywords);

-- =============================================
-- STEP 2: Create safety_guides table
-- =============================================
-- Stores guide content (Binder Safety, Post-Op Movement, etc.)
-- Migrated from src/screens/guides/*.tsx

CREATE TABLE IF NOT EXISTS public.safety_guides (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,  -- URL-friendly identifier
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('binding', 'post_op', 'hrt', 'general')),

  -- Content
  summary TEXT,
  hero_icon TEXT,             -- Ionicons name
  hero_subtitle TEXT,
  disclaimer TEXT,
  sections JSONB NOT NULL,    -- Array of { icon, title, content[], iconColor, iconBg }
  integration_info JSONB,     -- "How TransFitness Helps" section
  external_resources TEXT,
  footer_note TEXT,

  -- Targeting
  surgery_type TEXT CHECK (surgery_type IS NULL OR surgery_type IN ('top_surgery', 'bottom_surgery', 'ffs', 'orchiectomy')),
  hrt_type TEXT CHECK (hrt_type IS NULL OR hrt_type IN ('estrogen_blockers', 'testosterone')),

  -- Metadata
  source_citations TEXT[],
  medical_reviewer TEXT,
  last_medical_review TIMESTAMPTZ,

  -- Admin fields
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_guides_slug ON public.safety_guides(slug);
CREATE INDEX IF NOT EXISTS idx_guides_category ON public.safety_guides(category);
CREATE INDEX IF NOT EXISTS idx_guides_active ON public.safety_guides(is_active);

-- =============================================
-- STEP 3: Create rule_metadata table
-- =============================================
-- Documents the safety rules (rules logic stays in TypeScript)
-- Used for licensing documentation and B2B transparency

CREATE TABLE IF NOT EXISTS public.rule_metadata (
  rule_id TEXT PRIMARY KEY,   -- Matches TypeScript rule ID (e.g., 'BS-01')
  category TEXT NOT NULL CHECK (category IN ('binding_safety', 'post_op', 'hrt_adjustment', 'dysphoria', 'environment')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  rationale TEXT,             -- Why this rule exists
  source_citations TEXT[],
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  action_type TEXT NOT NULL CHECK (action_type IN ('critical_block', 'exclude_exercises', 'modify_parameters', 'inject_checkpoint', 'soft_filter')),

  -- Documentation
  applicable_populations TEXT[],  -- ['binding', 'post_op_top', 'hrt_t']
  user_message_template TEXT,     -- Example user-facing message

  -- Admin fields
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rules_category ON public.rule_metadata(category);
CREATE INDEX IF NOT EXISTS idx_rules_severity ON public.rule_metadata(severity);

-- =============================================
-- STEP 4: Create updated_at trigger function (if not exists)
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_knowledge_entries_updated_at ON public.knowledge_entries;
CREATE TRIGGER update_knowledge_entries_updated_at
  BEFORE UPDATE ON public.knowledge_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_safety_guides_updated_at ON public.safety_guides;
CREATE TRIGGER update_safety_guides_updated_at
  BEFORE UPDATE ON public.safety_guides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_rule_metadata_updated_at ON public.rule_metadata;
CREATE TRIGGER update_rule_metadata_updated_at
  BEFORE UPDATE ON public.rule_metadata
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- STEP 5: Enable Row Level Security (RLS)
-- =============================================
-- Knowledge tables are public read, service_role write

ALTER TABLE public.knowledge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_metadata ENABLE ROW LEVEL SECURITY;

-- knowledge_entries policies
DROP POLICY IF EXISTS "Anyone can read active knowledge entries" ON public.knowledge_entries;
CREATE POLICY "Anyone can read active knowledge entries" ON public.knowledge_entries
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Service role can manage knowledge entries" ON public.knowledge_entries;
CREATE POLICY "Service role can manage knowledge entries" ON public.knowledge_entries
  FOR ALL USING (auth.role() = 'service_role');

-- safety_guides policies
DROP POLICY IF EXISTS "Anyone can read active guides" ON public.safety_guides;
CREATE POLICY "Anyone can read active guides" ON public.safety_guides
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Service role can manage guides" ON public.safety_guides;
CREATE POLICY "Service role can manage guides" ON public.safety_guides
  FOR ALL USING (auth.role() = 'service_role');

-- rule_metadata policies
DROP POLICY IF EXISTS "Anyone can read active rules" ON public.rule_metadata;
CREATE POLICY "Anyone can read active rules" ON public.rule_metadata
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Service role can manage rules" ON public.rule_metadata;
CREATE POLICY "Service role can manage rules" ON public.rule_metadata
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Run these to verify setup:

-- Check tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('knowledge_entries', 'safety_guides', 'rule_metadata');

-- Check indexes
-- SELECT indexname FROM pg_indexes WHERE tablename IN ('knowledge_entries', 'safety_guides', 'rule_metadata');

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename IN ('knowledge_entries', 'safety_guides', 'rule_metadata');
