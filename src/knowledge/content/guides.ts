/**
 * Safety Guides Content Service
 *
 * Fetches safety guide content from Supabase with caching.
 * Replaces the hardcoded guide data in screen components.
 */

import { supabase } from '../../utils/supabase';
import { SafetyGuide, GuideCategory, GuideSection, IntegrationInfo } from '../types';

// =============================================
// CACHING
// =============================================

interface Cache<T> {
  data: T | null;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let guidesCache: Cache<SafetyGuide[]> = {
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

const FALLBACK_BINDER_SECTIONS: GuideSection[] = [
  {
    icon: 'time-outline',
    title: 'Time Limits',
    content: [
      'Limit binding to 8-10 hours maximum per day',
      'Take breaks every few hours when possible',
      'Never sleep in a binder',
    ],
    iconColor: '#38bdf8',
    iconBg: 'rgba(56, 189, 248, 0.15)',
  },
  {
    icon: 'alert-circle-outline',
    title: 'Warning Signs',
    content: [
      'Sharp or stabbing chest pain',
      'Difficulty taking a full breath',
      'Lightheadedness or dizziness',
    ],
    iconColor: '#f59e0b',
    iconBg: 'rgba(245, 158, 11, 0.15)',
  },
];

const FALLBACK_GUIDES: SafetyGuide[] = [
  {
    id: 'fallback_binder',
    slug: 'binder_safety',
    title: 'Binder Safety',
    category: 'binding',
    summary: 'Exercise Safely While Binding',
    hero_icon: 'shield-checkmark',
    hero_subtitle: 'Practical guidance for training while binding',
    disclaimer: 'This is general information, not medical advice.',
    sections: FALLBACK_BINDER_SECTIONS,
    integration_info: {
      title: 'How TransFitness Helps',
      description: 'We adjust workouts based on your binding status.',
      items: ['Reduce high-impact exercises', 'Add breathing check-ins'],
    },
    external_resources: 'Consult your healthcare provider for medical advice.',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
];

// =============================================
// FETCH FUNCTIONS
// =============================================

/**
 * Fetch all active safety guides from database
 */
export async function getAllGuides(): Promise<SafetyGuide[]> {
  // Check cache first
  if (isCacheValid(guidesCache)) {
    return guidesCache.data!;
  }

  try {
    if (!supabase) {
      console.warn('Supabase not initialized, using fallback guides');
      return FALLBACK_GUIDES;
    }

    const { data, error } = await supabase
      .from('safety_guides')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching safety guides:', error.message);
      return guidesCache.data ?? FALLBACK_GUIDES;
    }

    // Parse JSONB fields
    const guides = (data as SafetyGuide[]).map(parseGuideData);

    // Update cache
    guidesCache = {
      data: guides,
      timestamp: Date.now(),
    };

    return guides;
  } catch (error) {
    console.error('Failed to fetch safety guides:', error);
    return guidesCache.data ?? FALLBACK_GUIDES;
  }
}

/**
 * Fetch a single guide by slug
 */
export async function getGuideBySlug(slug: string): Promise<SafetyGuide | null> {
  // Check cache first
  if (isCacheValid(guidesCache)) {
    return guidesCache.data!.find((g) => g.slug === slug) ?? null;
  }

  try {
    if (!supabase) {
      console.warn('Supabase not initialized, using fallback guide');
      return FALLBACK_GUIDES.find((g) => g.slug === slug) ?? null;
    }

    const { data, error } = await supabase
      .from('safety_guides')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error(`Error fetching guide ${slug}:`, error.message);
      // Try fallback
      return FALLBACK_GUIDES.find((g) => g.slug === slug) ?? null;
    }

    return parseGuideData(data as SafetyGuide);
  } catch (error) {
    console.error(`Failed to fetch guide ${slug}:`, error);
    return FALLBACK_GUIDES.find((g) => g.slug === slug) ?? null;
  }
}

/**
 * Fetch guides by category
 */
export async function getGuidesByCategory(
  category: GuideCategory
): Promise<SafetyGuide[]> {
  const allGuides = await getAllGuides();
  return allGuides.filter((g) => g.category === category);
}

/**
 * Fetch a guide by ID
 */
export async function getGuideById(id: string): Promise<SafetyGuide | null> {
  const allGuides = await getAllGuides();
  return allGuides.find((g) => g.id === id) ?? null;
}

// =============================================
// DATA PARSING
// =============================================

/**
 * Parse JSONB fields from database record
 */
function parseGuideData(guide: SafetyGuide): SafetyGuide {
  return {
    ...guide,
    // Ensure sections is an array
    sections: Array.isArray(guide.sections)
      ? guide.sections
      : typeof guide.sections === 'string'
        ? JSON.parse(guide.sections)
        : [],
    // Ensure integration_info is an object
    integration_info: guide.integration_info
      ? typeof guide.integration_info === 'string'
        ? JSON.parse(guide.integration_info)
        : guide.integration_info
      : undefined,
    // Ensure source_citations is an array
    source_citations: Array.isArray(guide.source_citations)
      ? guide.source_citations
      : undefined,
  };
}

// =============================================
// CACHE MANAGEMENT
// =============================================

/**
 * Clear the guides cache
 */
export function clearGuidesCache(): void {
  guidesCache = { data: null, timestamp: 0 };
}

/**
 * Refresh the cache proactively
 */
export async function refreshGuidesCache(): Promise<void> {
  clearGuidesCache();
  await getAllGuides();
}
