/**
 * Knowledge Engine Export Script
 *
 * Exports the knowledge engine content to JSON files for licensing.
 * Creates a complete, portable package of the trans-fitness knowledge IP.
 *
 * Usage:
 *   npx ts-node scripts/exportKnowledgeEngine.ts [output-dir]
 *
 * Example:
 *   npx ts-node scripts/exportKnowledgeEngine.ts ./exports/knowledge-v1
 *
 * Environment variables:
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_KEY - Service role key for admin access
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// =============================================
// TYPES
// =============================================

interface ExportManifest {
  version: string;
  exportedAt: string;
  tables: string[];
  entryCounts: {
    knowledge_entries: number;
    safety_guides: number;
    rule_metadata: number;
    education_snippets: number;
    exercise_trans_tips: number;
  };
  schema: {
    version: string;
    lastUpdated: string;
  };
}

// =============================================
// EXPORT FUNCTIONS
// =============================================

async function exportTable(
  supabase: SupabaseClient,
  tableName: string,
  outputDir: string
): Promise<number> {
  console.log(`  Exporting ${tableName}...`);

  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
      console.log(`    ⚠️ Table ${tableName} does not exist, skipping`);
      return 0;
    }
    console.error(`    ❌ Error exporting ${tableName}:`, error.message);
    return 0;
  }

  const outputPath = path.join(outputDir, `${tableName}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`    ✅ Exported ${data?.length ?? 0} records to ${tableName}.json`);

  return data?.length ?? 0;
}

function generateSchemaDoc(outputDir: string): void {
  console.log('  Generating schema documentation...');

  const schemaDoc = `# TransFitness Knowledge Engine Schema

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
`;

  const outputPath = path.join(outputDir, 'SCHEMA.md');
  fs.writeFileSync(outputPath, schemaDoc);
  console.log('    ✅ Generated SCHEMA.md');
}

function generateIntegrationGuide(outputDir: string): void {
  console.log('  Generating integration guide...');

  const guide = `# Knowledge Engine Integration Guide

## Quick Start

### 1. Load the Data

\`\`\`typescript
import knowledgeEntries from './knowledge_entries.json';
import safetyGuides from './safety_guides.json';
import ruleMetadata from './rule_metadata.json';

// Access entries by category
const bindingEntries = knowledgeEntries.filter(e => e.category === 'binding');
\`\`\`

### 2. Search Knowledge

\`\`\`typescript
function searchKnowledge(query: string, entries: KnowledgeEntry[]) {
  const queryLower = query.toLowerCase();
  const words = queryLower.split(/\\s+/);

  return entries
    .map(entry => {
      let score = 0;
      for (const keyword of entry.keywords) {
        if (queryLower.includes(keyword)) score += 2;
        else if (words.some(w => keyword.includes(w))) score += 1;
      }
      if (queryLower.includes(entry.category)) score += 1;
      return { entry, score };
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => s.entry);
}
\`\`\`

### 3. Context-Aware Filtering

\`\`\`typescript
interface UserContext {
  binds_chest?: boolean;
  on_hrt?: boolean;
  has_surgery?: boolean;
  hrt_type?: 'estrogen_blockers' | 'testosterone';
}

function filterByContext(entries: KnowledgeEntry[], context: UserContext) {
  return entries.filter(entry => {
    if (entry.requires_binding && !context.binds_chest) return false;
    if (entry.requires_hrt && !context.on_hrt) return false;
    if (entry.hrt_type && entry.hrt_type !== context.hrt_type) return false;
    if (entry.requires_surgery && !context.has_surgery) return false;
    return true;
  });
}
\`\`\`

### 4. Display Safety Guides

\`\`\`typescript
function getGuide(slug: string, guides: SafetyGuide[]) {
  return guides.find(g => g.slug === slug);
}

// Guide sections are in the 'sections' array
// Each section has: icon, title, content[], iconColor, iconBg
\`\`\`

## Data Categories

### Knowledge Entries

| Category | Description | Example Topics |
|----------|-------------|----------------|
| binding | Binding safety during exercise | Cardio, chest exercises, duration |
| hrt | Hormone-related fitness | Testosterone muscle gains, estrogen effects |
| post_op | Post-surgical recovery | Timeline, scar care, return to exercise |
| exercise | General exercise advice | Modifications, rest periods |
| recovery | Recovery and soreness | DOMS, rest days |
| dysphoria | Managing dysphoria | Gym strategies, rest days |
| general | Getting started | Onboarding, general tips |

### Safety Guides

| Slug | Title | Category |
|------|-------|----------|
| binder_safety | Binder Safety | binding |
| post_op_movement | Post-Op Movement | post_op |

## Support

For technical support or licensing inquiries:
- Email: support@transfitness.app
- Documentation: https://docs.transfitness.app
`;

  const outputPath = path.join(outputDir, 'INTEGRATION.md');
  fs.writeFileSync(outputPath, guide);
  console.log('    ✅ Generated INTEGRATION.md');
}

// =============================================
// MAIN
// =============================================

async function main(): Promise<void> {
  const outputDir = process.argv[2] || './exports/knowledge-engine';

  console.log('='.repeat(60));
  console.log('TransFitness Knowledge Engine Export');
  console.log('='.repeat(60));
  console.log(`Output directory: ${outputDir}`);

  // Get environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl) {
    console.error('❌ Missing SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL environment variable');
    process.exit(1);
  }

  if (!supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_SERVICE_KEY environment variable');
    process.exit(1);
  }

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('\n📦 Exporting tables...');

  const entryCounts = {
    knowledge_entries: await exportTable(supabase, 'knowledge_entries', outputDir),
    safety_guides: await exportTable(supabase, 'safety_guides', outputDir),
    rule_metadata: await exportTable(supabase, 'rule_metadata', outputDir),
    education_snippets: await exportTable(supabase, 'education_snippets', outputDir),
    exercise_trans_tips: await exportTable(supabase, 'exercise_trans_tips', outputDir),
  };

  console.log('\n📄 Generating documentation...');
  generateSchemaDoc(outputDir);
  generateIntegrationGuide(outputDir);

  // Generate manifest
  console.log('  Generating manifest...');
  const manifest: ExportManifest = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    tables: Object.keys(entryCounts).filter(
      (k) => entryCounts[k as keyof typeof entryCounts] > 0
    ),
    entryCounts,
    schema: {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
    },
  };

  const manifestPath = path.join(outputDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('    ✅ Generated manifest.json');

  console.log('\n' + '='.repeat(60));
  console.log('✅ Export complete!');
  console.log('='.repeat(60));
  console.log('\nExported files:');
  fs.readdirSync(outputDir).forEach((file) => {
    console.log(`  - ${file}`);
  });
  console.log(`\nTotal entries: ${Object.values(entryCounts).reduce((a, b) => a + b, 0)}`);
}

main().catch((error) => {
  console.error('❌ Export failed:', error);
  process.exit(1);
});
