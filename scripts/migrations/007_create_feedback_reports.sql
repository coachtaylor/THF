-- Migration: Create feedback_reports table for user issue reporting
-- Supports: safety concerns, dysphoria triggers, difficulty issues, instruction clarity, bugs

-- Create the feedback_reports table
CREATE TABLE IF NOT EXISTS feedback_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Feedback classification
  category TEXT NOT NULL CHECK (category IN (
    'safety_concern',
    'dysphoria_trigger',
    'difficulty_issue',
    'instruction_clarity',
    'technical_bug',
    'other'
  )),
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  context TEXT NOT NULL CHECK (context IN (
    'session_active',
    'session_exercise',
    'post_workout',
    'exercise_library',
    'settings',
    'general'
  )),

  -- Exercise-specific fields (optional)
  exercise_id INTEGER REFERENCES exercises(id) ON DELETE SET NULL,
  exercise_name TEXT,
  workout_id UUID,
  set_number INTEGER,

  -- Feedback content
  quick_feedback JSONB DEFAULT '[]'::jsonb,  -- Array of preset option IDs
  description TEXT,

  -- Device metadata
  device_info JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW(),

  -- Admin review fields
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved', 'wont_fix')),
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback_reports(status);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback_reports(category);
CREATE INDEX IF NOT EXISTS idx_feedback_exercise ON feedback_reports(exercise_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_severity ON feedback_reports(severity) WHERE severity IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE feedback_reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
  ON feedback_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
  ON feedback_reports FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own unreviewed feedback
CREATE POLICY "Users can update their own unreviewed feedback"
  ON feedback_reports FOR UPDATE
  USING (auth.uid() = user_id AND status = 'new')
  WITH CHECK (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE feedback_reports IS 'User feedback and issue reports from the TransFitness app';
COMMENT ON COLUMN feedback_reports.category IS 'Type of feedback: safety_concern, dysphoria_trigger, difficulty_issue, instruction_clarity, technical_bug, other';
COMMENT ON COLUMN feedback_reports.context IS 'Where in the app the feedback was submitted';
COMMENT ON COLUMN feedback_reports.quick_feedback IS 'Array of preset quick feedback option IDs selected by user';
COMMENT ON COLUMN feedback_reports.status IS 'Admin review status: new (unreviewed), reviewed, resolved, wont_fix';
