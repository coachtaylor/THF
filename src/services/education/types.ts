// Education snippets type definitions
// Short, contextual tips about binding, HRT, and post-op recovery

import { TrainingEnvironment } from '../../types';

export type SnippetCategory = 'binder' | 'hrt' | 'post_op' | 'recovery_general';

export type BinderStatus = 'binding_today' | 'binding_regularly' | 'not_binding';

export interface EducationSnippet {
  id: string;
  category: SnippetCategory;
  text: string;
  // Optional title for the snippet
  title?: string;
  // Targeting fields (all optional - if not set, snippet is generic)
  hrt_phase_min?: number;  // months on HRT
  hrt_phase_max?: number;
  hrt_type?: 'estrogen_blockers' | 'testosterone';
  post_op_weeks_min?: number;
  post_op_weeks_max?: number;
  surgery_type?: 'top_surgery' | 'bottom_surgery' | 'ffs' | 'orchiectomy';
  binder_status?: BinderStatus;
  environment?: TrainingEnvironment | 'any';
  // Metadata
  is_active: boolean;
  priority?: number; // Lower = higher priority when multiple match
  created_at: Date;
  updated_at: Date;
}

// User context for snippet selection
export interface UserSnippetContext {
  // HRT
  on_hrt: boolean;
  hrt_type?: 'estrogen_blockers' | 'testosterone' | 'none';
  hrt_months?: number;
  // Binding
  binds_chest: boolean;
  binding_frequency?: 'daily' | 'sometimes' | 'rarely' | 'never';
  binding_today?: boolean;
  // Surgery
  surgeries: Array<{
    type: 'top_surgery' | 'bottom_surgery' | 'ffs' | 'orchiectomy' | 'other';
    weeks_post_op?: number;
    fully_healed?: boolean;
  }>;
  // Environment
  training_environment?: TrainingEnvironment;
}

// Snippet selection result
export interface SelectedSnippets {
  binder?: EducationSnippet;
  hrt?: EducationSnippet;
  post_op?: EducationSnippet;
  recovery_general?: EducationSnippet;
}

// Database row type (for SQLite)
export interface EducationSnippetRow {
  id: string;
  category: string;
  title: string | null;
  text: string;
  hrt_phase_min: number | null;
  hrt_phase_max: number | null;
  hrt_type: string | null;
  post_op_weeks_min: number | null;
  post_op_weeks_max: number | null;
  surgery_type: string | null;
  binder_status: string | null;
  environment: string | null;
  is_active: number;
  priority: number | null;
  created_at: string;
  updated_at: string;
}
