/**
 * useWorkoutLimit Hook
 *
 * Tracks workout usage against free tier limits.
 * Premium users have unlimited access.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import {
  getWeeklyCompletedWorkoutCount,
  canStartWorkout,
} from '../services/storage/workoutLog';

interface WorkoutLimitState {
  // Can user start a workout?
  canStart: boolean;

  // Current week's completed workout count
  completedThisWeek: number;

  // Weekly limit (Infinity for premium)
  weeklyLimit: number;

  // Remaining workouts this week
  remaining: number;

  // Is user on premium?
  isPremium: boolean;

  // Loading state
  isLoading: boolean;

  // Refresh the count (call after completing a workout)
  refresh: () => Promise<void>;
}

/**
 * Hook to check workout limits for free tier users
 *
 * @param userId - The user's ID for tracking
 *
 * @example
 * const { canStart, remaining, refresh } = useWorkoutLimit(userId);
 *
 * if (!canStart) {
 *   // Show paywall or upgrade prompt
 *   navigation.navigate('Paywall');
 * }
 *
 * // After completing a workout
 * await refresh();
 */
export function useWorkoutLimit(userId: string): WorkoutLimitState {
  const { isPremium, freeTierLimits, isLoading: subscriptionLoading } = useSubscription();

  const [completedThisWeek, setCompletedThisWeek] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const weeklyLimit = isPremium ? Infinity : freeTierLimits.WORKOUTS_PER_WEEK;

  const loadCount = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const count = await getWeeklyCompletedWorkoutCount(userId);
      setCompletedThisWeek(count);
    } catch (error) {
      console.error('[useWorkoutLimit] Failed to load count:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Load on mount and when userId changes
  useEffect(() => {
    loadCount();
  }, [loadCount]);

  const refresh = useCallback(async () => {
    await loadCount();
  }, [loadCount]);

  // Premium users always can start
  const canStart = isPremium || completedThisWeek < weeklyLimit;
  const remaining = isPremium ? Infinity : Math.max(0, weeklyLimit - completedThisWeek);

  return {
    canStart,
    completedThisWeek,
    weeklyLimit,
    remaining,
    isPremium,
    isLoading: isLoading || subscriptionLoading,
    refresh,
  };
}

/**
 * Check if workout can be started (one-time check)
 * Useful for guards before starting workout flow
 */
export async function checkWorkoutLimit(
  userId: string,
  isPremium: boolean,
  weeklyLimit: number
): Promise<{ canStart: boolean; currentCount: number; remaining: number }> {
  // Premium users always can start
  if (isPremium) {
    return {
      canStart: true,
      currentCount: 0,
      remaining: Infinity,
    };
  }

  const result = await canStartWorkout(userId, weeklyLimit);
  return {
    canStart: result.canStart,
    currentCount: result.currentCount,
    remaining: Math.max(0, weeklyLimit - result.currentCount),
  };
}
