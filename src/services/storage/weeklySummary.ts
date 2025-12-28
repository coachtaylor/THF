// Weekly Summary Service
// Calculates statistics for the previous week to display in the weekly summary modal

import { getSessions } from '../sessionLogger';
import { getPlan } from './plan';
import { getCurrentStreak } from './stats';
import { getLastWeekDateRange } from './weeklyTransition';

export interface PersonalRecord {
  exerciseName: string;
  weight: number;
  reps: number;
  previousBest?: number;
}

export interface BodyCheckinSummary {
  connected: number;
  neutral: number;
  disconnected: number;
  skipped: number;
}

export interface WeeklySummaryData {
  weekStart: Date;
  weekEnd: Date;
  workoutsCompleted: number;
  workoutsScheduled: number;
  totalVolume: number; // in lbs
  averageRPE: number;
  exercisesCompleted: number;
  totalSets: number;
  totalReps: number;
  personalRecords: PersonalRecord[];
  streakAtEndOfWeek: number;
  bodyCheckinSummary: BodyCheckinSummary;
  totalWorkoutMinutes: number;
  isFirstWeek: boolean; // True if this is the user's first week (no previous data)
}

/**
 * Get summary data for the previous week
 */
export async function getLastWeekSummary(userId: string): Promise<WeeklySummaryData> {
  const { start: weekStart, end: weekEnd } = getLastWeekDateRange();

  try {
    // Get all sessions
    const allSessions = await getSessions(userId);

    // Filter sessions for last week
    const lastWeekSessions = allSessions.filter(session => {
      const sessionDate = new Date(session.completedAt);
      return sessionDate >= weekStart && sessionDate <= weekEnd;
    });

    // Get sessions from before last week (for PR comparison)
    const previousSessions = allSessions.filter(session => {
      const sessionDate = new Date(session.completedAt);
      return sessionDate < weekStart;
    });

    // Calculate exercise max weights from previous sessions for PR detection
    const previousMaxWeights = new Map<string, { weight: number; reps: number }>();
    previousSessions.forEach(session => {
      session.exercises.forEach(exercise => {
        const exerciseKey = exercise.exerciseId || exercise.name || 'unknown';
        exercise.sets.forEach(set => {
          const weight = set.weight ?? 0;
          if (weight > 0) {
            const current = previousMaxWeights.get(exerciseKey);
            if (!current || weight > current.weight) {
              previousMaxWeights.set(exerciseKey, { weight, reps: set.reps });
            }
          }
        });
      });
    });

    // Calculate stats from last week's sessions
    let totalVolume = 0;
    let totalRPE = 0;
    let rpeCount = 0;
    let exercisesCompleted = 0;
    let totalSets = 0;
    let totalReps = 0;
    let totalWorkoutMinutes = 0;
    const personalRecords: PersonalRecord[] = [];
    const bodyCheckinSummary: BodyCheckinSummary = {
      connected: 0,
      neutral: 0,
      disconnected: 0,
      skipped: 0,
    };

    // Track PRs for each exercise (only count once per exercise)
    const prTracked = new Set<string>();

    lastWeekSessions.forEach(session => {
      totalWorkoutMinutes += session.durationMinutes || 0;

      session.exercises.forEach(exercise => {
        exercisesCompleted++;
        const exerciseKey = exercise.exerciseId || exercise.name || 'unknown';
        const exerciseName = exercise.name || 'Unknown Exercise';

        exercise.sets.forEach(set => {
          totalSets++;
          totalReps += set.reps;

          // Calculate volume: reps * weight
          const weight = set.weight ?? 0;
          totalVolume += set.reps * weight;

          if (set.rpe) {
            totalRPE += set.rpe;
            rpeCount++;
          }

          // Check for PR (only if we have weight data and haven't already tracked this exercise)
          if (weight > 0 && !prTracked.has(exerciseKey)) {
            const previousBest = previousMaxWeights.get(exerciseKey);
            if (!previousBest || weight > previousBest.weight) {
              personalRecords.push({
                exerciseName,
                weight,
                reps: set.reps,
                previousBest: previousBest?.weight,
              });
              prTracked.add(exerciseKey);
            }
          }
        });
      });
    });

    const averageRPE = rpeCount > 0 ? totalRPE / rpeCount : 0;

    // Get scheduled workouts from plan
    let workoutsScheduled = 0;
    try {
      const plan = await getPlan(userId);
      if (plan && plan.days) {
        workoutsScheduled = plan.days.filter(day => {
          const dayDate = new Date(day.date);
          dayDate.setHours(0, 0, 0, 0);
          return dayDate >= weekStart && dayDate <= weekEnd && !day.isRestDay;
        }).length;
      }
    } catch (error) {
      console.warn('Could not get scheduled workouts from plan:', error);
      // Estimate based on typical frequency
      workoutsScheduled = Math.max(lastWeekSessions.length, 3);
    }

    // Get current streak (which reflects the end of last week)
    const streakAtEndOfWeek = await getCurrentStreak(userId);

    // Check if this is the user's first week
    const isFirstWeek = previousSessions.length === 0;

    return {
      weekStart,
      weekEnd,
      workoutsCompleted: lastWeekSessions.length,
      workoutsScheduled,
      totalVolume: Math.round(totalVolume),
      averageRPE: Math.round(averageRPE * 10) / 10,
      exercisesCompleted,
      totalSets,
      totalReps,
      personalRecords,
      streakAtEndOfWeek,
      bodyCheckinSummary,
      totalWorkoutMinutes,
      isFirstWeek,
    };
  } catch (error) {
    console.error('Failed to get last week summary:', error);

    // Return empty summary
    return {
      weekStart,
      weekEnd,
      workoutsCompleted: 0,
      workoutsScheduled: 0,
      totalVolume: 0,
      averageRPE: 0,
      exercisesCompleted: 0,
      totalSets: 0,
      totalReps: 0,
      personalRecords: [],
      streakAtEndOfWeek: 0,
      bodyCheckinSummary: {
        connected: 0,
        neutral: 0,
        disconnected: 0,
        skipped: 0,
      },
      totalWorkoutMinutes: 0,
      isFirstWeek: true,
    };
  }
}

/**
 * Format volume for display (e.g., "8,450 lbs" or "8.4k lbs")
 */
export function formatVolume(volume: number): string {
  if (volume >= 10000) {
    return `${(volume / 1000).toFixed(1)}k`;
  }
  return volume.toLocaleString();
}

/**
 * Get achievement messages based on the week's performance
 */
export function getAchievements(summary: WeeklySummaryData): string[] {
  const achievements: string[] = [];

  // Completed all workouts
  if (summary.workoutsCompleted >= summary.workoutsScheduled && summary.workoutsScheduled > 0) {
    achievements.push('Completed all scheduled workouts!');
  }

  // Personal records
  if (summary.personalRecords.length > 0) {
    const topPR = summary.personalRecords[0];
    achievements.push(`New PR: ${topPR.exerciseName} (${topPR.weight} lbs × ${topPR.reps})`);

    if (summary.personalRecords.length > 1) {
      achievements.push(`${summary.personalRecords.length - 1} more personal record${summary.personalRecords.length > 2 ? 's' : ''}!`);
    }
  }

  // High streak
  if (summary.streakAtEndOfWeek >= 7) {
    achievements.push(`${summary.streakAtEndOfWeek}-day streak maintained!`);
  } else if (summary.streakAtEndOfWeek >= 3) {
    achievements.push(`${summary.streakAtEndOfWeek}-day streak going strong!`);
  }

  // Volume milestone
  if (summary.totalVolume >= 10000) {
    achievements.push(`Lifted over ${formatVolume(summary.totalVolume)} lbs this week!`);
  }

  // Good RPE management
  if (summary.averageRPE >= 6 && summary.averageRPE <= 8 && summary.workoutsCompleted >= 3) {
    achievements.push('Great workout intensity management!');
  }

  // First week completion
  if (summary.isFirstWeek && summary.workoutsCompleted > 0) {
    achievements.push('Completed your first week of workouts!');
  }

  return achievements;
}
