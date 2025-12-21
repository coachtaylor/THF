/**
 * Knowledge Engine Types
 *
 * Shared types for the TransFitness knowledge system.
 * Part of the licensable knowledge engine module.
 */

// =============================================
// KNOWLEDGE ENTRY TYPES
// =============================================

export type KnowledgeCategory =
  | 'binding'
  | 'hrt'
  | 'post_op'
  | 'exercise'
  | 'recovery'
  | 'dysphoria'
  | 'general';

export type HrtType = 'estrogen_blockers' | 'testosterone';

export type SurgeryType =
  | 'top_surgery'
  | 'bottom_surgery'
  | 'ffs'
  | 'orchiectomy';

export interface KnowledgeEntry {
  id: string;
  category: KnowledgeCategory;
  subcategory?: string;
  keywords: string[];
  question: string;
  answer: string;

  // Context targeting
  requires_binding: boolean;
  requires_hrt: boolean;
  hrt_type?: HrtType;
  requires_surgery: boolean;
  surgery_type?: SurgeryType;

  // Related content
  related_guide?: string;
  source?: string;

  // Metadata
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  version: number;
}

// User context for filtering/boosting knowledge entries
export interface UserContext {
  binds_chest?: boolean;
  on_hrt?: boolean;
  has_surgery?: boolean;
  hrt_type?: HrtType;
  primary_goal?: string;
  fitness_experience?: string;
}

// =============================================
// SAFETY GUIDE TYPES
// =============================================

export type GuideCategory = 'binding' | 'post_op' | 'hrt' | 'general';

export interface GuideSection {
  icon: string;
  title: string;
  content: string[];
  iconColor: string;
  iconBg: string;
  type?: 'standard' | 'phase';
  // For phase-type sections (post-op)
  weeks?: string;
  focus?: string;
  activities?: string[];
  avoid?: string[];
}

export interface IntegrationInfo {
  title: string;
  description: string;
  items: string[];
}

export interface SafetyGuide {
  id: string;
  slug: string;
  title: string;
  category: GuideCategory;
  summary?: string;
  hero_icon?: string;
  hero_subtitle?: string;
  disclaimer?: string;
  sections: GuideSection[];
  integration_info?: IntegrationInfo;
  external_resources?: string;
  footer_note?: string;
  surgery_type?: SurgeryType;
  hrt_type?: HrtType;
  source_citations?: string[];
  medical_reviewer?: string;
  last_medical_review?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  version: number;
}

// =============================================
// RULE METADATA TYPES
// =============================================

export type RuleCategory =
  | 'binding_safety'
  | 'post_op'
  | 'hrt_adjustment'
  | 'dysphoria'
  | 'environment';

export type RuleSeverity = 'critical' | 'high' | 'medium' | 'low';

export type RuleActionType =
  | 'critical_block'
  | 'exclude_exercises'
  | 'modify_parameters'
  | 'inject_checkpoint'
  | 'soft_filter';

export interface RuleMetadata {
  rule_id: string;
  category: RuleCategory;
  name: string;
  description: string;
  rationale?: string;
  source_citations?: string[];
  severity: RuleSeverity;
  action_type: RuleActionType;
  applicable_populations?: string[];
  user_message_template?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================
// SEARCH RESULT TYPES
// =============================================

export interface ScoredKnowledgeEntry {
  entry: KnowledgeEntry;
  score: number;
}

export interface KnowledgeSearchResult {
  entries: KnowledgeEntry[];
  query: string;
  totalMatches: number;
}
