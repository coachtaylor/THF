/**
 * Knowledge Base Content Service
 *
 * Fetches knowledge entries from Supabase with caching.
 * Replaces the hardcoded KNOWLEDGE_BASE array.
 */

import { supabase } from '../../utils/supabase';
import {
  KnowledgeEntry,
  KnowledgeCategory,
  UserContext,
  ScoredKnowledgeEntry,
} from '../types';

// =============================================
// CACHING
// =============================================

interface Cache<T> {
  data: T | null;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let knowledgeCache: Cache<KnowledgeEntry[]> = {
  data: null,
  timestamp: 0,
};

function isCacheValid<T>(cache: Cache<T>): boolean {
  return cache.data !== null && Date.now() - cache.timestamp < CACHE_TTL;
}

// =============================================
// FALLBACK DATA
// Minimal set for offline/error scenarios
// =============================================

const FALLBACK_ENTRIES: KnowledgeEntry[] = [
  {
    id: 'fallback_general',
    category: 'general',
    keywords: ['help', 'start', 'begin'],
    question: 'Where can I get help?',
    answer: 'TransFitness helps you train safely. Check your profile settings, explore workouts, or use the guides in Settings for safety information.',
    requires_binding: false,
    requires_hrt: false,
    requires_surgery: false,
    is_active: true,
    priority: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
];

// =============================================
// FETCH FUNCTIONS
// =============================================

/**
 * Fetch all active knowledge entries from database
 */
export async function getAllKnowledgeEntries(): Promise<KnowledgeEntry[]> {
  // Check cache first
  if (isCacheValid(knowledgeCache)) {
    return knowledgeCache.data!;
  }

  try {
    if (!supabase) {
      console.warn('Supabase not initialized, using fallback knowledge entries');
      return FALLBACK_ENTRIES;
    }

    const { data, error } = await supabase
      .from('knowledge_entries')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error fetching knowledge entries:', error.message);
      return knowledgeCache.data ?? FALLBACK_ENTRIES;
    }

    // Update cache
    knowledgeCache = {
      data: data as KnowledgeEntry[],
      timestamp: Date.now(),
    };

    return data as KnowledgeEntry[];
  } catch (error) {
    console.error('Failed to fetch knowledge entries:', error);
    return knowledgeCache.data ?? FALLBACK_ENTRIES;
  }
}

/**
 * Fetch knowledge entries by category
 */
export async function getKnowledgeByCategory(
  category: KnowledgeCategory
): Promise<KnowledgeEntry[]> {
  const allEntries = await getAllKnowledgeEntries();
  return allEntries.filter((entry) => entry.category === category);
}

/**
 * Fetch a single knowledge entry by ID
 */
export async function getKnowledgeEntry(
  id: string
): Promise<KnowledgeEntry | null> {
  const allEntries = await getAllKnowledgeEntries();
  return allEntries.find((entry) => entry.id === id) ?? null;
}

// =============================================
// SEARCH FUNCTIONS
// =============================================

/**
 * Search knowledge entries based on user query and context.
 * Uses keyword matching with context boosting.
 */
export async function searchKnowledge(
  query: string,
  context?: UserContext
): Promise<KnowledgeEntry[]> {
  const allEntries = await getAllKnowledgeEntries();
  const queryLower = query.toLowerCase();
  const words = queryLower.split(/\s+/).filter((w) => w.length > 2);

  // Score each entry based on keyword matches
  const scored: ScoredKnowledgeEntry[] = allEntries.map((entry) => {
    let score = 0;

    // Check keyword matches
    for (const keyword of entry.keywords) {
      const keywordLower = keyword.toLowerCase();
      if (queryLower.includes(keywordLower)) {
        score += 2; // Exact match in query
      } else if (
        words.some(
          (word) => keywordLower.includes(word) || word.includes(keywordLower)
        )
      ) {
        score += 1; // Partial match
      }
    }

    // Boost if context matches entry requirements
    if (context) {
      const contextMatches = checkContextMatch(entry, context);
      if (contextMatches) {
        score += 3; // Strong boost for context match
      }
    }

    // Slight boost for category match in query
    if (queryLower.includes(entry.category)) {
      score += 1;
    }

    // Penalize if entry requires context that user doesn't have
    if (entry.requires_binding && context && !context.binds_chest) {
      score -= 1;
    }
    if (entry.requires_hrt && context && !context.on_hrt) {
      score -= 1;
    }
    if (entry.requires_surgery && context && !context.has_surgery) {
      score -= 1;
    }

    return { entry, score };
  });

  // Return top matches with score > 0
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.entry);
}

/**
 * Check if user context matches entry requirements
 */
function checkContextMatch(
  entry: KnowledgeEntry,
  context: UserContext
): boolean {
  // If entry has no requirements, it's a general match
  if (
    !entry.requires_binding &&
    !entry.requires_hrt &&
    !entry.requires_surgery
  ) {
    return false; // No boost for general entries
  }

  // Check each requirement
  if (entry.requires_binding && !context.binds_chest) {
    return false;
  }
  if (entry.requires_hrt) {
    if (!context.on_hrt) return false;
    if (entry.hrt_type && entry.hrt_type !== context.hrt_type) return false;
  }
  if (entry.requires_surgery && !context.has_surgery) {
    return false;
  }

  return true;
}

/**
 * Get random tips (for when no specific query matches)
 */
export async function getRandomTips(count: number = 3): Promise<KnowledgeEntry[]> {
  const allEntries = await getAllKnowledgeEntries();
  const shuffled = [...allEntries].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get tips relevant to user's context
 */
export async function getContextualTips(
  context: UserContext,
  count: number = 3
): Promise<KnowledgeEntry[]> {
  const allEntries = await getAllKnowledgeEntries();

  // Filter entries that match user's context
  const relevant = allEntries.filter((entry) => {
    // Include general entries
    if (
      !entry.requires_binding &&
      !entry.requires_hrt &&
      !entry.requires_surgery
    ) {
      return true;
    }

    // Include entries that match context
    return checkContextMatch(entry, context);
  });

  // Shuffle and return top N
  const shuffled = [...relevant].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// =============================================
// CACHE MANAGEMENT
// =============================================

/**
 * Clear the knowledge cache (useful after updates)
 */
export function clearKnowledgeCache(): void {
  knowledgeCache = { data: null, timestamp: 0 };
}

/**
 * Refresh the cache proactively
 */
export async function refreshKnowledgeCache(): Promise<void> {
  clearKnowledgeCache();
  await getAllKnowledgeEntries();
}
