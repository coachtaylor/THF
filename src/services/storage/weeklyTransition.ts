// Weekly Transition Service
// Tracks when plans were generated to determine if a new week needs a new plan

import { db } from '../../utils/database';
import { getPlan } from './plan';

export interface WeekTransitionState {
  lastPlanGeneratedWeekStart: string | null; // ISO date of Sunday
  userId: string;
}

/**
 * Get the start of the week (Sunday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the date range for the previous week (Sunday to Saturday)
 */
export function getLastWeekDateRange(): { start: Date; end: Date } {
  const today = new Date();
  const currentWeekStart = getWeekStart(today);

  // Last week's Sunday
  const lastWeekStart = new Date(currentWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  // Last week's Saturday (end of that week)
  const lastWeekEnd = new Date(lastWeekStart);
  lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);
  lastWeekEnd.setHours(23, 59, 59, 999);

  return { start: lastWeekStart, end: lastWeekEnd };
}

/**
 * Get the week transition state for a user
 */
export async function getWeekTransitionState(userId: string): Promise<WeekTransitionState> {
  try {
    const result = db.getFirstSync<{ last_plan_week_start: string }>(
      'SELECT last_plan_week_start FROM week_transitions WHERE user_id = ?',
      [userId]
    );

    return {
      lastPlanGeneratedWeekStart: result?.last_plan_week_start || null,
      userId,
    };
  } catch (error) {
    console.error('Error getting week transition state:', error);
    return {
      lastPlanGeneratedWeekStart: null,
      userId,
    };
  }
}

/**
 * Set the week when a plan was last generated
 */
export async function setLastPlanGeneratedWeek(userId: string, weekStart: Date): Promise<void> {
  const weekStartISO = weekStart.toISOString();
  const id = `week_transition_${userId}`;

  try {
    // Use INSERT OR REPLACE to handle both insert and update
    db.runSync(
      `INSERT OR REPLACE INTO week_transitions (id, user_id, last_plan_week_start, created_at)
       VALUES (?, ?, ?, datetime('now'))`,
      [id, userId, weekStartISO]
    );
    console.log('✅ Week transition state updated:', weekStartISO);
  } catch (error) {
    console.error('Error setting week transition state:', error);
    throw error;
  }
}

/**
 * Check if a new week has started and the user needs to generate a new plan
 * Returns true if:
 * 1. No plan has ever been generated for this week, OR
 * 2. The last plan was generated for a previous week
 *
 * Note: This check runs on ANY day of the week - the prompt will appear
 * until the user generates a plan for the current week.
 */
export async function isNewWeekNeedingPlan(userId: string): Promise<boolean> {
  const today = new Date();
  const currentWeekStart = getWeekStart(today);
  const currentWeekStartISO = currentWeekStart.toISOString();

  // Check if we have a plan for this week already
  const state = await getWeekTransitionState(userId);

  if (!state.lastPlanGeneratedWeekStart) {
    // No plan ever generated - but check if user has any plan at all
    // (they might be a new user who just completed onboarding)
    const existingPlan = await getPlan(userId);
    if (existingPlan && existingPlan.days && existingPlan.days.length > 0) {
      // Check if the existing plan covers this week
      const planStartDate = new Date(existingPlan.startDate);
      const planWeekStart = getWeekStart(planStartDate);

      // If plan was generated this week, mark it and don't show modal
      if (planWeekStart.getTime() === currentWeekStart.getTime()) {
        await setLastPlanGeneratedWeek(userId, currentWeekStart);
        return false;
      }

      // Plan is from a previous week - need new plan
      return true;
    }

    // No plan at all - this is a new user, don't show weekly summary
    // (they'll go through onboarding flow instead)
    return false;
  }

  // Compare week starts
  const lastPlanWeekStart = new Date(state.lastPlanGeneratedWeekStart);
  const lastPlanWeekStartNormalized = getWeekStart(lastPlanWeekStart);

  // If the last plan was generated for a previous week, we need a new plan
  return lastPlanWeekStartNormalized.getTime() < currentWeekStart.getTime();
}

/**
 * Format a date range for display (e.g., "Dec 15 - Dec 21, 2025")
 */
export function formatDateRange(start: Date, end: Date): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const startMonth = monthNames[start.getMonth()];
  const startDay = start.getDate();
  const endMonth = monthNames[end.getMonth()];
  const endDay = end.getDate();
  const year = end.getFullYear();

  if (start.getMonth() === end.getMonth()) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  }

  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
}
