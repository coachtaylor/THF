/**
 * useEntitlement Hook
 *
 * Easy feature gating throughout the app.
 * Returns whether user can access a feature and provides upgrade prompts.
 */

import { useCallback } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { FeatureId, FEATURE_INFO, getUpgradeFeatures } from '../services/payments/entitlements';

interface EntitlementResult {
  // Can user access this feature?
  hasAccess: boolean;

  // Is user on premium tier?
  isPremium: boolean;

  // Feature info for UI
  featureInfo: typeof FEATURE_INFO[FeatureId] | null;

  // List of features they'd get by upgrading
  upgradeFeatures: FeatureId[];

  // Loading state
  isLoading: boolean;
}

/**
 * Check if user has access to a specific feature
 *
 * @example
 * const { hasAccess } = useEntitlement('unlimited_workouts');
 * if (!hasAccess) {
 *   navigation.navigate('Paywall');
 * }
 */
export function useEntitlement(feature: FeatureId): EntitlementResult {
  const { canAccess, isPremium, tier, isLoading } = useSubscription();

  const hasAccess = canAccess(feature);
  const featureInfo = FEATURE_INFO[feature] || null;
  const upgradeFeatures = getUpgradeFeatures(tier);

  return {
    hasAccess,
    isPremium,
    featureInfo,
    upgradeFeatures,
    isLoading,
  };
}

/**
 * Hook for gating actions with automatic upgrade prompt
 *
 * @example
 * const { gatedAction, showPaywall, setShowPaywall } = useGatedAction('copilot_unlimited');
 *
 * const handleAskQuestion = gatedAction(() => {
 *   // This only runs if user has access
 *   askCopilotQuestion(question);
 * });
 */
export function useGatedAction(feature: FeatureId) {
  const { hasAccess } = useEntitlement(feature);

  const gatedAction = useCallback(
    <T extends (...args: unknown[]) => unknown>(action: T) => {
      return (...args: Parameters<T>) => {
        if (hasAccess) {
          return action(...args);
        }
        // Return null to indicate action was blocked
        return null;
      };
    },
    [hasAccess]
  );

  return {
    hasAccess,
    gatedAction,
    shouldShowPaywall: !hasAccess,
  };
}

/**
 * Hook for checking multiple features at once
 *
 * @example
 * const { hasAll, hasSome, missing } = useMultipleEntitlements([
 *   'progress_charts',
 *   'advanced_stats'
 * ]);
 */
export function useMultipleEntitlements(features: FeatureId[]) {
  const { canAccess, isPremium, isLoading } = useSubscription();

  const accessMap = features.reduce(
    (acc, feature) => {
      acc[feature] = canAccess(feature);
      return acc;
    },
    {} as Record<FeatureId, boolean>
  );

  const hasAll = features.every((f) => accessMap[f]);
  const hasSome = features.some((f) => accessMap[f]);
  const missing = features.filter((f) => !accessMap[f]);

  return {
    accessMap,
    hasAll,
    hasSome,
    missing,
    isPremium,
    isLoading,
  };
}

/**
 * Hook specifically for workout limits
 * Tracks weekly workout count against free tier limit
 */
export function useWorkoutEntitlement() {
  const { isPremium, freeTierLimits, isLoading } = useSubscription();

  return {
    isPremium,
    weeklyLimit: isPremium ? Infinity : freeTierLimits.WORKOUTS_PER_WEEK,
    isLoading,
  };
}

/**
 * Hook specifically for Copilot limits
 */
export function useCopilotEntitlement() {
  const { isPremium, freeTierLimits, isLoading } = useSubscription();

  return {
    isPremium,
    dailyLimit: isPremium ? Infinity : freeTierLimits.COPILOT_QUESTIONS_PER_DAY,
    isLoading,
  };
}
