// Education snippets service
// Handles CRUD and smart selection of contextual tips

import * as SQLite from 'expo-sqlite';
import {
  EducationSnippet,
  EducationSnippetRow,
  SelectedSnippets,
  SnippetCategory,
  UserSnippetContext,
} from './types';
import { SEED_SNIPPETS } from '../../data/educationSnippets';

const db = SQLite.openDatabaseSync('transfitness.db');

// Initialize education snippets table and seed data
export async function initEducationSnippets(): Promise<void> {
  try {
    db.withTransactionSync(() => {
      // Create table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS education_snippets (
          id TEXT PRIMARY KEY,
          category TEXT NOT NULL,
          title TEXT,
          text TEXT NOT NULL,
          hrt_phase_min INTEGER,
          hrt_phase_max INTEGER,
          hrt_type TEXT,
          post_op_weeks_min INTEGER,
          post_op_weeks_max INTEGER,
          surgery_type TEXT,
          binder_status TEXT,
          environment TEXT,
          is_active INTEGER NOT NULL DEFAULT 1,
          priority INTEGER DEFAULT 100,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Check if we need to seed
      const countStmt = db.prepareSync('SELECT COUNT(*) as count FROM education_snippets;');
      const result = countStmt.executeSync().getAllSync() as Array<{ count: number }>;
      countStmt.finalizeSync();

      if (result[0].count === 0) {
        console.log('📚 Seeding education snippets...');
        seedSnippets();
      }
    });
    console.log('✅ Education snippets initialized');
  } catch (error) {
    console.error('❌ Education snippets initialization failed:', error);
    throw error;
  }
}

// Seed initial snippets from data file
function seedSnippets(): void {
  const insertStmt = db.prepareSync(`
    INSERT INTO education_snippets
    (id, category, title, text, hrt_phase_min, hrt_phase_max, hrt_type,
     post_op_weeks_min, post_op_weeks_max, surgery_type, binder_status,
     environment, is_active, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `);

  for (const snippet of SEED_SNIPPETS) {
    insertStmt.executeSync([
      snippet.id,
      snippet.category,
      snippet.title || null,
      snippet.text,
      snippet.hrt_phase_min ?? null,
      snippet.hrt_phase_max ?? null,
      snippet.hrt_type ?? null,
      snippet.post_op_weeks_min ?? null,
      snippet.post_op_weeks_max ?? null,
      snippet.surgery_type ?? null,
      snippet.binder_status ?? null,
      snippet.environment ?? null,
      snippet.is_active ? 1 : 0,
      snippet.priority ?? 100,
    ]);
  }

  insertStmt.finalizeSync();
  console.log(`📚 Seeded ${SEED_SNIPPETS.length} education snippets`);
}

// Convert database row to EducationSnippet
function rowToSnippet(row: EducationSnippetRow): EducationSnippet {
  return {
    id: row.id,
    category: row.category as SnippetCategory,
    title: row.title || undefined,
    text: row.text,
    hrt_phase_min: row.hrt_phase_min ?? undefined,
    hrt_phase_max: row.hrt_phase_max ?? undefined,
    hrt_type: row.hrt_type as 'estrogen_blockers' | 'testosterone' | undefined,
    post_op_weeks_min: row.post_op_weeks_min ?? undefined,
    post_op_weeks_max: row.post_op_weeks_max ?? undefined,
    surgery_type: row.surgery_type as any,
    binder_status: row.binder_status as any,
    environment: row.environment as any,
    is_active: row.is_active === 1,
    priority: row.priority ?? undefined,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  };
}

// Get all active snippets by category
export async function getSnippetsByCategory(category: SnippetCategory): Promise<EducationSnippet[]> {
  const snippets: EducationSnippet[] = [];

  db.withTransactionSync(() => {
    const stmt = db.prepareSync(
      'SELECT * FROM education_snippets WHERE category = ? AND is_active = 1 ORDER BY priority ASC;'
    );
    const rows = stmt.executeSync([category]).getAllSync() as EducationSnippetRow[];
    stmt.finalizeSync();

    for (const row of rows) {
      snippets.push(rowToSnippet(row));
    }
  });

  return snippets;
}

// Select relevant snippets based on user context
// Returns up to 1 snippet per category that matches the user's state
export async function selectSnippetsForUser(context: UserSnippetContext): Promise<SelectedSnippets> {
  const result: SelectedSnippets = {};

  // Determine binder status for matching
  let binderStatus: string | null = null;
  if (context.binds_chest) {
    if (context.binding_today) {
      binderStatus = 'binding_today';
    } else if (context.binding_frequency === 'daily' || context.binding_frequency === 'sometimes') {
      binderStatus = 'binding_regularly';
    }
  }

  // Find active, non-healed surgeries for post-op matching
  const activePostOpSurgery = context.surgeries.find(
    (s) => s.weeks_post_op !== undefined && !s.fully_healed
  );

  db.withTransactionSync(() => {
    // Get all active snippets
    const stmt = db.prepareSync(
      'SELECT * FROM education_snippets WHERE is_active = 1 ORDER BY priority ASC;'
    );
    const rows = stmt.executeSync().getAllSync() as EducationSnippetRow[];
    stmt.finalizeSync();

    const snippets = rows.map(rowToSnippet);

    // Select best snippet for each category
    result.binder = selectBestMatch(snippets, 'binder', context, binderStatus);
    result.hrt = selectBestMatch(snippets, 'hrt', context, binderStatus);
    result.post_op = selectBestMatch(snippets, 'post_op', context, binderStatus, activePostOpSurgery);
    // Skip recovery_general snippets on workout days - they're only relevant for rest days
    if (!context.isWorkoutDay) {
      result.recovery_general = selectBestMatch(snippets, 'recovery_general', context, binderStatus);
    }
  });

  return result;
}

// Select the best matching snippet for a category
function selectBestMatch(
  snippets: EducationSnippet[],
  category: SnippetCategory,
  context: UserSnippetContext,
  binderStatus: string | null,
  activePostOpSurgery?: { type: string; weeks_post_op?: number }
): EducationSnippet | undefined {
  const categorySnippets = snippets.filter((s) => s.category === category);

  // Score each snippet based on how well it matches the user's context
  const scored = categorySnippets
    .map((snippet) => ({
      snippet,
      score: scoreSnippetMatch(snippet, context, binderStatus, activePostOpSurgery),
    }))
    .filter((s) => s.score >= 0) // -1 means disqualified
    .sort((a, b) => {
      // Higher score first, then lower priority (priority is inverse - lower is better)
      if (b.score !== a.score) return b.score - a.score;
      return (a.snippet.priority ?? 100) - (b.snippet.priority ?? 100);
    });

  return scored[0]?.snippet;
}

// Score how well a snippet matches user context
// Returns -1 if snippet is disqualified (targeting doesn't match)
// Returns 0+ for matches (higher = better match)
function scoreSnippetMatch(
  snippet: EducationSnippet,
  context: UserSnippetContext,
  binderStatus: string | null,
  activePostOpSurgery?: { type: string; weeks_post_op?: number }
): number {
  let score = 0;

  // Check binder status targeting
  if (snippet.binder_status) {
    if (!binderStatus || snippet.binder_status !== binderStatus) {
      return -1; // Disqualified - doesn't match binder status
    }
    score += 10; // Bonus for specific binder targeting
  } else if (snippet.category === 'binder' && !binderStatus) {
    return -1; // Binder snippets shouldn't show to non-binders
  }

  // Check HRT targeting
  if (snippet.hrt_type) {
    if (!context.on_hrt || context.hrt_type !== snippet.hrt_type) {
      return -1; // Disqualified
    }
    score += 10;
  }

  if (snippet.hrt_phase_min !== undefined || snippet.hrt_phase_max !== undefined) {
    if (!context.on_hrt || context.hrt_months === undefined) {
      return -1;
    }
    const min = snippet.hrt_phase_min ?? 0;
    const max = snippet.hrt_phase_max ?? 999;
    if (context.hrt_months < min || context.hrt_months > max) {
      return -1;
    }
    score += 5; // Bonus for phase-specific targeting
  } else if (snippet.category === 'hrt' && !context.on_hrt) {
    return -1; // HRT snippets shouldn't show to non-HRT users
  }

  // Check post-op targeting
  if (snippet.surgery_type || snippet.post_op_weeks_min !== undefined || snippet.post_op_weeks_max !== undefined) {
    if (!activePostOpSurgery) {
      return -1;
    }

    if (snippet.surgery_type && snippet.surgery_type !== activePostOpSurgery.type) {
      return -1;
    }

    if (snippet.post_op_weeks_min !== undefined || snippet.post_op_weeks_max !== undefined) {
      const weeks = activePostOpSurgery.weeks_post_op ?? 0;
      const min = snippet.post_op_weeks_min ?? 0;
      const max = snippet.post_op_weeks_max ?? 999;
      if (weeks < min || weeks > max) {
        return -1;
      }
      score += 5;
    }

    score += 10;
  } else if (snippet.category === 'post_op' && !activePostOpSurgery) {
    return -1; // Post-op snippets shouldn't show if not in recovery
  }

  // Check environment targeting
  if (snippet.environment && snippet.environment !== 'any') {
    if (context.training_environment !== snippet.environment) {
      return -1;
    }
    score += 5;
  }

  return score;
}

// Get a random generic snippet for a category (fallback)
export async function getGenericSnippet(category: SnippetCategory): Promise<EducationSnippet | undefined> {
  let snippet: EducationSnippet | undefined;

  db.withTransactionSync(() => {
    const stmt = db.prepareSync(`
      SELECT * FROM education_snippets
      WHERE category = ?
        AND is_active = 1
        AND hrt_phase_min IS NULL
        AND hrt_phase_max IS NULL
        AND post_op_weeks_min IS NULL
        AND post_op_weeks_max IS NULL
        AND binder_status IS NULL
        AND surgery_type IS NULL
      ORDER BY RANDOM()
      LIMIT 1;
    `);
    const rows = stmt.executeSync([category]).getAllSync() as EducationSnippetRow[];
    stmt.finalizeSync();

    if (rows.length > 0) {
      snippet = rowToSnippet(rows[0]);
    }
  });

  return snippet;
}
