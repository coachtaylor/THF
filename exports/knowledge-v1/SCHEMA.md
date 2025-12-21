# TransFitness Knowledge Engine Schema

## Overview

The TransFitness Knowledge Engine is a licensable module containing safety rules,
Q&A content, safety guides, and educational material specifically designed for
trans and gender-diverse individuals' fitness needs.

## Tables

### knowledge_entries

Q&A pairs for the Copilot chat feature. Provides retrieval-based responses
about binding, HRT, post-op recovery, exercise modifications, and more.

| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | Primary key, unique identifier |
| category | TEXT | One of: binding, hrt, post_op, exercise, recovery, dysphoria, general |
| subcategory | TEXT | Optional subcategory |
| keywords | TEXT[] | Array of keywords for search matching |
| question | TEXT | User-facing question |
| answer | TEXT | Markdown-formatted answer |
| requires_binding | BOOLEAN | True if entry is for users who bind |
| requires_hrt | BOOLEAN | True if entry is for users on HRT |
| hrt_type | TEXT | 'estrogen_blockers' or 'testosterone' |
| requires_surgery | BOOLEAN | True if entry is for post-op users |
| surgery_type | TEXT | Type of surgery (top_surgery, bottom_surgery, etc.) |
| related_guide | TEXT | Slug reference to safety_guides |
| source | TEXT | Citation or source |
| is_active | BOOLEAN | Whether entry is currently active |
| priority | INTEGER | Lower = higher priority |
| version | INTEGER | Content version number |

### safety_guides

Detailed safety guides for specific topics (binding, post-op recovery, etc.).

| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | Primary key |
| slug | TEXT | URL-friendly identifier |
| title | TEXT | Display title |
| category | TEXT | One of: binding, post_op, hrt, general |
| summary | TEXT | Brief summary |
| hero_icon | TEXT | Ionicons icon name |
| hero_subtitle | TEXT | Subtitle text |
| disclaimer | TEXT | Medical disclaimer text |
| sections | JSONB | Array of content sections |
| integration_info | JSONB | "How TransFitness Helps" content |
| external_resources | TEXT | External resource references |
| footer_note | TEXT | Optional footer message |
| surgery_type | TEXT | For post-op guides |
| hrt_type | TEXT | For HRT guides |
| source_citations | TEXT[] | Array of citations |
| version | INTEGER | Content version number |

### rule_metadata

Documentation for the safety rules engine. Rules logic is in TypeScript;
this table provides human-readable documentation and rationale.

| Field | Type | Description |
|-------|------|-------------|
| rule_id | TEXT | Primary key, matches TypeScript rule ID |
| category | TEXT | binding_safety, post_op, hrt_adjustment, dysphoria, environment |
| name | TEXT | Human-readable rule name |
| description | TEXT | What the rule does |
| rationale | TEXT | Why the rule exists |
| source_citations | TEXT[] | Medical/research citations |
| severity | TEXT | critical, high, medium, low |
| action_type | TEXT | Type of action taken |
| applicable_populations | TEXT[] | Who this rule applies to |

### education_snippets

Short, context-aware tips shown during workouts.

| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | Primary key |
| category | TEXT | binder, hrt, post_op, recovery_general |
| title | TEXT | Optional display title |
| text | TEXT | The tip content |
| hrt_phase_min/max | INTEGER | HRT duration range (months) |
| hrt_type | TEXT | estrogen_blockers or testosterone |
| post_op_weeks_min/max | INTEGER | Post-op week range |
| surgery_type | TEXT | Type of surgery |
| binder_status | TEXT | binding_today, binding_regularly, not_binding |
| priority | INTEGER | Lower = higher priority |

## Usage

### Integration

The knowledge content can be:
1. Loaded directly from JSON files
2. Imported into any database system
3. Used with the TypeScript rules engine

### Rules Engine

The rules logic (TypeScript) must be licensed separately and includes:
- Binding safety rules
- Post-operative exercise restrictions
- HRT adjustment recommendations
- Checkpoint injection logic

Contact TransFitness for rules engine licensing.

## Versioning

- Schema version: 1.0.0
- Content is versioned per-entry in the 'version' field
- Major schema changes will increment the manifest schema version

## License

This content is proprietary and requires a license agreement.
Contact: licensing@transfitness.app
