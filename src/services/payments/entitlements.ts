/**
 * Entitlements Configuration
 *
 * Defines which features are available at each subscription tier.
 * This is the single source of truth for feature gating.
 */

export type SubscriptionTier = 'free' | 'premium';

export type FeatureId =
  | 'unlimited_workouts'
  | 'full_exercise_library'
  | 'exercise_filters'
  | 'copilot_unlimited'
  | 'progress_charts'
  | 'weight_suggestions'
  | 'personalized_warmup'
  | 'advanced_stats';

/**
 * Free tier limits
 */
export const FREE_TIER_LIMITS = {
  WORKOUTS_PER_WEEK: 2,
  COPILOT_QUESTIONS_PER_DAY: 3,
  EDUCATION_SNIPPETS: 5,
} as const;

/**
 * Features available at each tier
 */
export const TIER_FEATURES: Record<SubscriptionTier, FeatureId[]> = {
  free: [],
  premium: [
    'unlimited_workouts',
    'full_exercise_library',
    'exercise_filters',
    'copilot_unlimited',
    'progress_charts',
    'weight_suggestions',
    'personalized_warmup',
    'advanced_stats',
  ],
};

/**
 * Features that are ALWAYS free (for community trust)
 */
export const ALWAYS_FREE_FEATURES = [
  'safety_guides',        // Binder safety, post-op guides
  'basic_workouts',       // 2 per week
  'basic_exercise_library', // Core exercises
  'crisis_resources',     // Emergency hotlines always accessible
] as const;

/**
 * Feature metadata for UI display
 */
export const FEATURE_INFO: Record<FeatureId, { title: string; description: string }> = {
  unlimited_workouts: {
    title: 'Unlimited Workouts',
    description: 'No weekly limits on your training',
  },
  full_exercise_library: {
    title: 'Full Exercise Library',
    description: 'Access 200+ exercises with trans-specific guidance',
  },
  exercise_filters: {
    title: 'Advanced Filters',
    description: 'Filter by muscle, equipment, safety flags',
  },
  copilot_unlimited: {
    title: 'Unlimited Copilot',
    description: 'Ask unlimited questions to your fitness assistant',
  },
  progress_charts: {
    title: 'Progress Charts',
    description: 'Visualize your gains over time',
  },
  weight_suggestions: {
    title: 'Smart Weight Suggestions',
    description: 'AI-powered weight recommendations based on your history',
  },
  personalized_warmup: {
    title: 'Personalized Warmup',
    description: 'Warmups tailored to your body and goals',
  },
  advanced_stats: {
    title: 'Advanced Statistics',
    description: 'Deep insights into your training patterns',
  },
};

/**
 * Check if a feature is available at a given tier
 */
export function hasFeature(tier: SubscriptionTier, feature: FeatureId): boolean {
  // Premium has all features
  if (tier === 'premium') {
    return true;
  }

  // Free tier only has features explicitly listed
  return TIER_FEATURES.free.includes(feature);
}

/**
 * Get all features available at a tier
 */
export function getFeaturesForTier(tier: SubscriptionTier): FeatureId[] {
  return TIER_FEATURES[tier];
}

/**
 * Get features that would be unlocked by upgrading
 */
export function getUpgradeFeatures(currentTier: SubscriptionTier): FeatureId[] {
  if (currentTier === 'premium') {
    return []; // Already has everything
  }

  return TIER_FEATURES.premium.filter(
    (feature) => !TIER_FEATURES[currentTier].includes(feature)
  );
}
