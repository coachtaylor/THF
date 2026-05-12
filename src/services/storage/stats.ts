import { db } from '../../utils/database';
import { getSessions } from '../sessionLogger';
import { getPlan } from './plan';

/**
 * Data point for charts showing value over time
 */
export interface ChartDataPoint {
  date: Date;
  value: number;
  label?: string;
}

/**
 * Volume by week data
 */
export interface WeeklyVolumeData {
  weekStart: Date;
  weekEnd: Date;
  totalVolume: number;
  workoutCount: number;
}

/**
 * Workout frequency data
 */
export interface FrequencyData {
  weekStart: Date;
  weekEnd: Date;
  completedWorkouts: number;
  scheduledWorkouts: number;
}

/**
 * Exercise progress data
 */
export interface ExerciseProgressData {
  exerciseId: string;
  exerciseName: string;
  dataPoints: ChartDataPoint[];
  currentMax: number;
  percentImprovement: number;
}

export interface WeeklyStats {
  completedWorkouts: number;
  scheduledWorkouts: number;
  achievableWorkouts: number; // workouts from today onwards (including already completed)
  totalVolume: number; // in lbs
  averageRPE: number;
  totalWorkouts: number; // total completed workouts (all time)
}

/**
 * Get current workout streak
 * 
 * Counts consecutive days with completed workouts
 * Allows 1-day gap (if workout was yesterday, streak continues)
 */
export async function getCurrentStreak(userId: string = 'default'): Promise<number> {
  try {
    // First check if we have a streak record in the database
    type StreakRow = {
      current_streak: number;
      last_workout_date: string | null;
    };

    const resultRef: { value: StreakRow | null } = { value: null };

    db.withTransactionSync(() => {
      const stmt = db.prepareSync(
        'SELECT current_streak, last_workout_date FROM streaks WHERE user_id = ? LIMIT 1;'
      );
      const rows = stmt.executeSync([userId]).getAllSync() as any[];
      if (rows.length > 0) {
        resultRef.value = rows[0] as StreakRow;
      }
      stmt.finalizeSync();
    });

    const result = resultRef.value;
    if (result && result.current_streak > 0 && result.last_workout_date) {
      // Check if streak is still valid (not broken)
      const lastWorkoutDate = new Date(result.last_workout_date);
      lastWorkoutDate.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const daysSinceLastWorkout = Math.floor(
        (today.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // If last workout was today or yesterday, streak is still valid
      if (daysSinceLastWorkout <= 1) {
        return result.current_streak;
      }
    }

    // If no streak record or streak broken, calculate from sessions
    const sessions = await getSessions(userId);
    if (sessions.length === 0) {
      return 0;
    }

    // Get unique workout dates (local YYYY-MM-DD) in descending order.
    // Using toISOString() to derive the key would shift west-of-UTC evening
    // completions to the next UTC day, then reconstruction via
    // `new Date('YYYY-MM-DD')` (UTC midnight) compared to the local-midnight
    // `today` reference produces an off-by-one daysDiff — making a single
    // workout completed tonight read as a 2-day streak. Use local-date parts
    // consistently and the multi-arg Date constructor for reconstruction.
    const workoutDates = new Set<string>();
    sessions.forEach(session => {
      const date = new Date(session.completedAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      workoutDates.add(key);
    });

    const sortedDates = Array.from(workoutDates)
      .map(d => {
        const [year, month, day] = d.split('-').map(Number);
        return new Date(year, month - 1, day); // local midnight
      })
      .sort((a, b) => b.getTime() - a.getTime());

    if (sortedDates.length === 0) {
      return 0;
    }

    // Calculate streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedDates.length; i++) {
      const workoutDate = sortedDates[i];
      workoutDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // If this workout was today or yesterday (allowing 1-day gap)
      if (daysDiff === streak || daysDiff === streak + 1) {
        streak = daysDiff + 1;
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Failed to calculate streak:', error);
    return 0;
  }
}

// Weekly cap policy (added 2026-05-11 — see memory/sprint2_freeze_override_weekly_caps.md):
// - Soft nudge (rest-day reminder) fires when completed >= user's selected frequency
// - Hard block fires at WEEKLY_HARD_CAP completed days for safety
export const WEEKLY_HARD_CAP = 10;

/**
 * Count completed sessions in the current ISO week (Mon-Sun).
 * Each completion counts once — completing tomorrow's workout today still
 * increments this. Used for both stats display and the start-workout cap
 * gate so they agree.
 */
export async function getCompletedDaysThisWeek(userId: string = 'default'): Promise<number> {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const sessions = await getSessions(userId);
    let count = 0;
    sessions.forEach(s => {
      const d = new Date(s.completedAt);
      d.setHours(0, 0, 0, 0);
      if (d >= startOfWeek) count += 1;
    });
    return count;
  } catch (error) {
    console.error('Failed to count completed sessions this week:', error);
    return 0;
  }
}

/**
 * For a given plan, return a map of `dayNumber -> completedAt ISO string`
 * for every session this ISO week that recorded which plan day it
 * satisfied. Used by upcoming + today cards to render "Completed on ..."
 * for workouts the user did early.
 *
 * `nameToDayNumberFallback` is used to recover plan-day attribution for
 * sessions saved before scheduledDayNumber existed — match by workoutName
 * to the plan day with that name. Caller builds the map from the current
 * plan/week.
 */
export async function getCompletedDayNumbersForPlanThisWeek(
  userId: string = 'default',
  planId: string,
  nameToDayNumberFallback?: Map<string, number>,
): Promise<Map<number, string>> {
  const result = new Map<number, string>();
  try {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const sessions = await getSessions(userId);

    const insertIfNewer = (dayNumber: number, completedAt: string) => {
      const existing = result.get(dayNumber);
      if (!existing || new Date(existing) < new Date(completedAt)) {
        result.set(dayNumber, completedAt);
      }
    };

    const isInWeek = (iso: string) => {
      const d = new Date(iso);
      d.setHours(0, 0, 0, 0);
      return d >= startOfWeek;
    };

    // Direct match: session has scheduledDayNumber.
    sessions.forEach(s => {
      if (s.planId !== planId) return;
      if (s.scheduledDayNumber === undefined || s.scheduledDayNumber === null) return;
      if (!isInWeek(s.completedAt)) return;
      insertIfNewer(s.scheduledDayNumber, s.completedAt);
    });

    // Legacy fallback: session lacks scheduledDayNumber but has workoutName.
    if (nameToDayNumberFallback) {
      sessions.forEach(s => {
        if (s.planId !== planId) return;
        if (s.scheduledDayNumber !== undefined && s.scheduledDayNumber !== null) return;
        if (!s.workoutName) return;
        if (!isInWeek(s.completedAt)) return;
        const dayNumber = nameToDayNumberFallback.get(s.workoutName);
        if (dayNumber === undefined) return;
        insertIfNewer(dayNumber, s.completedAt);
      });
    }
  } catch (error) {
    console.error('Failed to load completed plan days:', error);
  }
  return result;
}

/**
 * Get stats for current week.
 *
 * The denominator reflects this week's actual scheduled workout count
 * from the plan, NOT the static `workout_frequency`. A user with a 2/week
 * schedule who adds today via the "Add for today" prompt should see 0/3
 * — their commitment for this specific week is 3. Skipped days drop out
 * of the denominator (they're consumed by the skip, not pending).
 *
 * `skippedDates` is the local YYYY-MM-DD list of days the user opted out
 * of via the Today card's Skip link. `selectedFrequency` is used only as
 * a fallback when no plan exists.
 */
export async function getWeeklyStats(
  userId: string = 'default',
  selectedFrequency?: number,
  skippedDates: string[] = [],
): Promise<WeeklyStats> {
  try {
    // Get start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    // Get all sessions
    const allSessions = await getSessions(userId);

    // Filter sessions for this week
    const thisWeekSessions = allSessions.filter(session => {
      const sessionDate = new Date(session.completedAt);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate >= startOfWeek;
    });

    // Count completed sessions this week. Completing tomorrow's workout
    // today still adds +1 — the user's mental model is "each workout = 1",
    // not "each calendar day = 1".
    const uniqueCompletedCount = thisWeekSessions.length;

    // Calculate stats from completed sessions
    let totalVolume = 0;
    let totalRPE = 0;
    let rpeCount = 0;

    thisWeekSessions.forEach(session => {
      session.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          // Calculate volume: reps * weight
          // Use actual weight if available, otherwise estimate 10 lbs for bodyweight exercises
          const weight = set.weight ?? 10;
          totalVolume += set.reps * weight;

          if (set.rpe) {
            totalRPE += set.rpe;
            rpeCount++;
          }
        });
      });
    });

    const averageRPE = rpeCount > 0 ? totalRPE / rpeCount : 0;

    // Denominator: count workout days in the plan that fall in this ISO
    // week, deduped by calendar date and excluding any the user actively
    // skipped via the Today card. Falls back to selectedFrequency only
    // when no plan exists (newly signed-up user pre-plan-generation).
    let scheduledWorkouts = 4; // Default
    let achievableWorkouts = 4; // Default
    try {
      const plan = await getPlan(userId);
      if (plan) {
        const weekEnd = new Date(startOfWeek);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const skippedSet = new Set(skippedDates);
        const scheduledDayKeys = new Set<string>();
        plan.days.forEach(day => {
          const dayDate = new Date(day.date);
          dayDate.setHours(0, 0, 0, 0);
          if (
            dayDate >= startOfWeek &&
            dayDate < weekEnd &&
            !day.isRestDay
          ) {
            const key = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
            if (!skippedSet.has(key)) {
              scheduledDayKeys.add(key);
            }
          }
        });
        scheduledWorkouts = Math.min(7, scheduledDayKeys.size);
      } else if (selectedFrequency && selectedFrequency > 0) {
        scheduledWorkouts = Math.min(7, Math.max(1, Math.floor(selectedFrequency)));
      }

      // Achievable = unique completed days + remaining days in week
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysIntoWeek = Math.floor((today.getTime() - startOfWeek.getTime()) / msPerDay);
      const daysRemaining = Math.max(0, 7 - daysIntoWeek - 1); // exclude today
      achievableWorkouts = Math.min(scheduledWorkouts, uniqueCompletedCount + daysRemaining + 1);
    } catch (error) {
      console.warn('Could not get scheduled workouts:', error);
    }

    return {
      completedWorkouts: uniqueCompletedCount,
      scheduledWorkouts,
      achievableWorkouts,
      totalVolume: Math.round(totalVolume),
      averageRPE: Math.round(averageRPE * 10) / 10, // Round to 1 decimal
      totalWorkouts: allSessions.length,
    };
  } catch (error) {
    console.error('Failed to get weekly stats:', error);
    return {
      completedWorkouts: 0,
      scheduledWorkouts: 4,
      achievableWorkouts: 4,
      totalVolume: 0,
      averageRPE: 0,
      totalWorkouts: 0,
    };
  }
}

export interface MonthWorkout {
  id: string;
  workout_date: string;
  workout_name: string;
  status: 'completed' | 'scheduled';
  duration_minutes: number;
  total_volume?: number;
  average_rpe?: number;
  has_pr?: boolean;
  pr_exercise?: string;
}

/**
 * Get workouts for a specific month.
 *
 * `skippedDates` is YYYY-MM-DD (local) strings the user actively skipped via
 * the Today card. Scheduled workouts for those dates are dropped from the
 * returned list so the "This Month" denominator on the history screen
 * matches the dashboard's "This Week" denominator (which also subtracts
 * skipped dates).
 */
export async function getMonthWorkouts(
  userId: string = 'default',
  month: Date = new Date(),
  skippedDates: string[] = [],
): Promise<MonthWorkout[]> {
  try {
    // Get start and end of month
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const startOfMonth = new Date(year, monthIndex, 1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date(year, monthIndex + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Get all sessions
    const allSessions = await getSessions(userId);

    // Filter sessions for this month
    const monthSessions = allSessions.filter(session => {
      const sessionDate = new Date(session.completedAt);
      return sessionDate >= startOfMonth && sessionDate <= endOfMonth;
    });

    // Convert sessions to workout format
    const workouts: MonthWorkout[] = monthSessions.map(session => {
      const sessionDate = new Date(session.completedAt);
      // Use local date parts — toISOString would shift the day across UTC
      // boundaries for users west of UTC (e.g. a 9am PDT completion would
      // render as the previous day).
      const workoutDate = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}-${String(sessionDate.getDate()).padStart(2, '0')}`;

      // Calculate volume and RPE from session
      let totalVolume = 0;
      let totalRPE = 0;
      let rpeCount = 0;

      session.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          // Use actual weight if available, otherwise estimate 10 lbs for bodyweight
          const weight = set.weight ?? 10;
          totalVolume += set.reps * weight;
          if (set.rpe) {
            totalRPE += set.rpe;
            rpeCount++;
          }
        });
      });

      const averageRPE = rpeCount > 0 ? totalRPE / rpeCount : undefined;

      // Use the stored workout name when available (newer sessions);
      // fall back to a date-based label for legacy sessions.
      const workoutName = session.workoutName?.trim()
        || `Workout - ${sessionDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })}`;

      return {
        id: session.id,
        workout_date: workoutDate,
        workout_name: workoutName,
        status: 'completed',
        duration_minutes: session.durationMinutes,
        total_volume: Math.round(totalVolume),
        average_rpe: averageRPE ? Math.round(averageRPE * 10) / 10 : undefined,
        has_pr: false, // Would be calculated from historical data
        pr_exercise: undefined,
      };
    });

    // Also get scheduled workouts from plan for this month (exclude rest days
    // and any days the user actively skipped via the Today card).
    try {
      const plan = await getPlan(userId);
      if (plan) {
        const skippedSet = new Set(skippedDates);
        const scheduledDays = plan.days.filter(day => {
          const dayDate = new Date(day.date);
          dayDate.setHours(0, 0, 0, 0);
          // Only include days that are in this month AND are not rest days
          return dayDate >= startOfMonth && dayDate <= endOfMonth && !day.isRestDay;
        });

        scheduledDays.forEach(day => {
          const dayDate = new Date(day.date);
          // Use local date parts to match how skipped_workout_dates is keyed
          // and how completed sessions are dated above. toISOString() would
          // shift across UTC boundaries for users west of UTC and produce
          // mismatched keys.
          const workoutDate = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;

          // Drop scheduled days the user explicitly skipped; the dashboard's
          // "This Week" denominator does the same so the two counts agree.
          if (skippedSet.has(workoutDate)) {
            return;
          }

          // Check if we already have a completed workout for this day
          const hasCompleted = workouts.some(w => w.workout_date === workoutDate);

          if (!hasCompleted) {
            // Add scheduled workout
            const workoutName = plan.goals.length > 0
              ? `${plan.goals[0].charAt(0).toUpperCase() + plan.goals[0].slice(1)} Focus`
              : 'Scheduled Workout';

            workouts.push({
              id: `scheduled_${day.dayNumber}`,
              workout_date: workoutDate,
              workout_name: workoutName,
              status: 'scheduled',
              duration_minutes: 30, // Default
            });
          }
        });
      }
    } catch (error) {
      console.warn('Could not get scheduled workouts from plan:', error);
    }

    // Sort by date (most recent first)
    return workouts.sort((a, b) =>
      new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime()
    );
  } catch (error) {
    console.error('Failed to get month workouts:', error);
    return [];
  }
}

/**
 * Get weekly volume data for chart
 * Returns total lbs lifted per week for the specified number of weeks
 */
export async function getVolumeByWeek(
  userId: string = 'default',
  weeks: number = 8
): Promise<WeeklyVolumeData[]> {
  try {
    const allSessions = await getSessions(userId);
    const result: WeeklyVolumeData[] = [];

    // Calculate week boundaries going back from today
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    for (let i = weeks - 1; i >= 0; i--) {
      // Calculate week start (Monday) and end (Sunday)
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - (i * 7));

      const dayOfWeek = weekEnd.getDay();
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      weekStart.setHours(0, 0, 0, 0);

      const adjustedWeekEnd = new Date(weekStart);
      adjustedWeekEnd.setDate(weekStart.getDate() + 6);
      adjustedWeekEnd.setHours(23, 59, 59, 999);

      // Filter sessions for this week
      const weekSessions = allSessions.filter(session => {
        const sessionDate = new Date(session.completedAt);
        return sessionDate >= weekStart && sessionDate <= adjustedWeekEnd;
      });

      // Calculate volume from sessions
      let totalVolume = 0;
      weekSessions.forEach(session => {
        session.exercises.forEach(exercise => {
          exercise.sets.forEach(set => {
            // Use actual weight if available, otherwise estimate 10 lbs for bodyweight
            const weight = set.weight ?? 10;
            totalVolume += set.reps * weight;
          });
        });
      });

      result.push({
        weekStart: new Date(weekStart),
        weekEnd: new Date(adjustedWeekEnd),
        totalVolume: Math.round(totalVolume),
        workoutCount: weekSessions.length,
      });
    }

    return result;
  } catch (error) {
    console.error('Failed to get volume by week:', error);
    return [];
  }
}

/**
 * Get workout frequency data for chart
 * Shows completed vs scheduled workouts per week
 */
export async function getWorkoutFrequency(
  userId: string = 'default',
  weeks: number = 8
): Promise<FrequencyData[]> {
  try {
    const allSessions = await getSessions(userId);
    const plan = await getPlan(userId).catch(() => null);
    const result: FrequencyData[] = [];

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    for (let i = weeks - 1; i >= 0; i--) {
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - (i * 7));

      const dayOfWeek = weekEnd.getDay();
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      weekStart.setHours(0, 0, 0, 0);

      const adjustedWeekEnd = new Date(weekStart);
      adjustedWeekEnd.setDate(weekStart.getDate() + 6);
      adjustedWeekEnd.setHours(23, 59, 59, 999);

      // Count completed workouts
      const completedWorkouts = allSessions.filter(session => {
        const sessionDate = new Date(session.completedAt);
        return sessionDate >= weekStart && sessionDate <= adjustedWeekEnd;
      }).length;

      // Count scheduled workouts from plan (or default to 4)
      let scheduledWorkouts = 4;
      if (plan) {
        scheduledWorkouts = plan.days.filter(day => {
          const dayDate = new Date(day.date);
          dayDate.setHours(0, 0, 0, 0);
          return dayDate >= weekStart && dayDate <= adjustedWeekEnd && !day.isRestDay;
        }).length || 4;
      }

      result.push({
        weekStart: new Date(weekStart),
        weekEnd: new Date(adjustedWeekEnd),
        completedWorkouts,
        scheduledWorkouts,
      });
    }

    return result;
  } catch (error) {
    console.error('Failed to get workout frequency:', error);
    return [];
  }
}

/**
 * Get progress data for a specific exercise
 * Shows max weight over time for the exercise
 */
export async function getExerciseProgress(
  userId: string = 'default',
  exerciseId: string,
  exerciseName: string = 'Exercise'
): Promise<ExerciseProgressData | null> {
  try {
    const allSessions = await getSessions(userId);
    const dataPoints: ChartDataPoint[] = [];

    // Find all sessions with this exercise
    allSessions.forEach(session => {
      const sessionDate = new Date(session.completedAt);

      session.exercises.forEach(exercise => {
        // Match by exercise ID or name (flexible matching)
        if (exercise.exerciseId === exerciseId || exercise.name === exerciseName) {
          // Find max weight for this exercise in this session
          let maxWeight = 0;
          exercise.sets.forEach(set => {
            // Use actual weight if available, otherwise estimate based on reps
            const weight = set.weight ?? (set.reps * 10);
            if (weight > maxWeight) {
              maxWeight = weight;
            }
          });

          if (maxWeight > 0) {
            dataPoints.push({
              date: sessionDate,
              value: maxWeight,
              label: sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            });
          }
        }
      });
    });

    if (dataPoints.length === 0) {
      return null;
    }

    // Sort by date (oldest first for chart)
    dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate improvement
    const firstValue = dataPoints[0].value;
    const currentMax = dataPoints[dataPoints.length - 1].value;
    const percentImprovement = firstValue > 0
      ? Math.round(((currentMax - firstValue) / firstValue) * 100)
      : 0;

    return {
      exerciseId,
      exerciseName,
      dataPoints,
      currentMax,
      percentImprovement,
    };
  } catch (error) {
    console.error('Failed to get exercise progress:', error);
    return null;
  }
}

/**
 * Get list of exercises with logged data
 * Used to populate exercise selector for progress charts
 */
export async function getExercisesWithData(
  userId: string = 'default'
): Promise<{ exerciseId: string; exerciseName: string; sessionCount: number }[]> {
  try {
    const allSessions = await getSessions(userId);
    const exerciseMap = new Map<string, { name: string; count: number }>();

    allSessions.forEach(session => {
      session.exercises.forEach(exercise => {
        const key = exercise.exerciseId || exercise.name;
        const existing = exerciseMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          exerciseMap.set(key, { name: exercise.name, count: 1 });
        }
      });
    });

    // Convert to array and sort by session count (most logged first)
    return Array.from(exerciseMap.entries())
      .map(([exerciseId, data]) => ({
        exerciseId,
        exerciseName: data.name,
        sessionCount: data.count,
      }))
      .sort((a, b) => b.sessionCount - a.sessionCount);
  } catch (error) {
    console.error('Failed to get exercises with data:', error);
    return [];
  }
}
