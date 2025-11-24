import { db } from '../../utils/database';
import { getSessions } from '../sessionLogger';
import { getPlan } from './plan';

export interface WeeklyStats {
  completedWorkouts: number;
  scheduledWorkouts: number;
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

    // Get unique workout dates in descending order
    const workoutDates = new Set<string>();
    sessions.forEach(session => {
      const date = new Date(session.completedAt);
      date.setHours(0, 0, 0, 0);
      workoutDates.add(date.toISOString().split('T')[0]);
    });

    const sortedDates = Array.from(workoutDates)
      .map(d => new Date(d))
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

/**
 * Get stats for current week
 */
export async function getWeeklyStats(userId: string = 'default'): Promise<WeeklyStats> {
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

    // Calculate stats from completed sessions
    let totalVolume = 0;
    let totalRPE = 0;
    let rpeCount = 0;

    thisWeekSessions.forEach(session => {
      session.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          // Estimate volume (reps * estimated weight - simplified)
          // In a real implementation, this would use actual weight data
          // Using a conservative estimate: 10 lbs per rep for bodyweight, 
          // could be adjusted based on exercise type
          totalVolume += set.reps * 10;
          
          if (set.rpe) {
            totalRPE += set.rpe;
            rpeCount++;
          }
        });
      });
    });

    const averageRPE = rpeCount > 0 ? totalRPE / rpeCount : 0;

    // Get scheduled workouts from plan (if available)
    let scheduledWorkouts = 4; // Default
    try {
      const plan = await getPlan(userId);
      if (plan) {
        // Count days in current week that have workouts scheduled
        const weekEnd = new Date(startOfWeek);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        const scheduledDays = plan.days.filter(day => {
          const dayDate = new Date(day.date);
          dayDate.setHours(0, 0, 0, 0);
          return dayDate >= startOfWeek && dayDate < weekEnd;
        });
        
        scheduledWorkouts = scheduledDays.length;
      }
    } catch (error) {
      console.warn('Could not get scheduled workouts from plan:', error);
    }

    return {
      completedWorkouts: thisWeekSessions.length,
      scheduledWorkouts,
      totalVolume: Math.round(totalVolume),
      averageRPE: Math.round(averageRPE * 10) / 10, // Round to 1 decimal
      totalWorkouts: allSessions.length,
    };
  } catch (error) {
    console.error('Failed to get weekly stats:', error);
    return {
      completedWorkouts: 0,
      scheduledWorkouts: 4,
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
 * Get workouts for a specific month
 */
export async function getMonthWorkouts(
  userId: string = 'default',
  month: Date = new Date()
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
      const workoutDate = sessionDate.toISOString().split('T')[0];

      // Calculate volume and RPE from session
      let totalVolume = 0;
      let totalRPE = 0;
      let rpeCount = 0;

      session.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          totalVolume += set.reps * 10; // Estimate: 10 lbs per rep
          if (set.rpe) {
            totalRPE += set.rpe;
            rpeCount++;
          }
        });
      });

      const averageRPE = rpeCount > 0 ? totalRPE / rpeCount : undefined;

      // Generate workout name from plan or default
      const workoutName = `Workout - ${sessionDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
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

    // Also get scheduled workouts from plan for this month
    try {
      const plan = await getPlan(userId);
      if (plan) {
        const scheduledDays = plan.days.filter(day => {
          const dayDate = new Date(day.date);
          dayDate.setHours(0, 0, 0, 0);
          return dayDate >= startOfMonth && dayDate <= endOfMonth;
        });

        scheduledDays.forEach(day => {
          const dayDate = new Date(day.date);
          const workoutDate = dayDate.toISOString().split('T')[0];

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
