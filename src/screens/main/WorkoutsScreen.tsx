import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useProfile } from '../../hooks/useProfile';
import { getMonthWorkouts, getCurrentStreak, MonthWorkout } from '../../services/storage/stats';
import { palette, spacing, typography } from '../../theme';

type MainTabParamList = {
  Home: undefined;
  Workouts: undefined;
  Progress: undefined;
  Settings: undefined;
};

type WorkoutsScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Workouts'>;

export default function WorkoutsScreen() {
  const navigation = useNavigation<WorkoutsScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [workouts, setWorkouts] = useState<MonthWorkout[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonthData();
  }, [currentMonth]);

  const loadMonthData = async () => {
    try {
      const userId = profile?.user_id || profile?.id || 'default';
      const [monthWorkouts, currentStreak] = await Promise.all([
        getMonthWorkouts(userId, currentMonth),
        getCurrentStreak(userId),
      ]);

      setWorkouts(monthWorkouts);
      setStreak(currentStreak);
    } catch (error) {
      console.error('Failed to load month data:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const renderCalendar = () => {
    // Generate calendar grid for current month
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();

    // Get last day of month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Create calendar grid
    const calendar: Array<Array<{
      day: number;
      date: string;
      hasWorkout: boolean;
      isToday: boolean;
    } | null>> = [];
    let week: Array<{
      day: number;
      date: string;
      hasWorkout: boolean;
      isToday: boolean;
    } | null> = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      week.push(null);
    }

    // Add days of month
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasWorkout = workouts.some(
        w => w.workout_date === dateStr && w.status === 'completed'
      );

      week.push({
        day,
        date: dateStr,
        hasWorkout,
        isToday: dateStr === todayStr,
      });

      // Start new week after Saturday
      if (week.length === 7) {
        calendar.push(week);
        week = [];
      }
    }

    // Add remaining empty cells
    while (week.length > 0 && week.length < 7) {
      week.push(null);
    }
    if (week.length > 0) {
      calendar.push(week);
    }

    return (
      <View style={styles.calendar}>
        {/* Day headers */}
        <View style={styles.calendarRow}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <View key={day} style={styles.calendarHeaderCell}>
              <Text style={styles.calendarHeaderText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        {calendar.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.calendarRow}>
            {week.map((cell, cellIndex) => (
              <View key={cellIndex} style={styles.calendarCell}>
                {cell && (
                  <>
                    <Text
                      style={[
                        styles.calendarDayText,
                        cell.isToday && styles.calendarDayToday,
                        cell.hasWorkout && styles.calendarDayCompleted,
                      ]}
                    >
                      {cell.day}
                    </Text>
                    {cell.hasWorkout && (
                      <Text style={styles.calendarCheckmark}>✓</Text>
                    )}
                  </>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const completedThisMonth = workouts.filter(w => w.status === 'completed').length;
  const totalScheduled = workouts.length;

  const handleProfilePress = () => {
    navigation.navigate('Settings');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={palette.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout History</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => {
            // Could open month picker or cycle months
            changeMonth('next');
          }}>
            <Text style={styles.monthSelector}>
              🗓️ {currentMonth.toLocaleDateString('en-US', { month: 'long' })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
            <Ionicons name="person-circle-outline" size={28} color={palette.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar */}
        {renderCalendar()}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.statText}>
            🔥 Current Streak: {streak} days
          </Text>
          <Text style={styles.statText}>
            📈 This month: {completedThisMonth} / {totalScheduled} workouts completed
          </Text>
        </View>

        {/* Recent Workouts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>

          {workouts
            .filter(w => w.status === 'completed')
            .slice(0, 10)
            .map((workout) => (
              <TouchableOpacity
                key={workout.id}
                style={styles.workoutCard}
                onPress={() => {
                  // Navigate to workout summary - adjust route name as needed
                  // navigation.navigate('WorkoutSummary', { workoutId: workout.id });
                  console.log('View workout:', workout.id);
                }}
              >
                <View style={styles.workoutHeader}>
                  <Text style={styles.workoutDate}>
                    {new Date(workout.workout_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.workoutStatus}>✓ Completed</Text>
                </View>

                <Text style={styles.workoutName}>{workout.workout_name}</Text>

                <Text style={styles.workoutStats}>
                  {workout.duration_minutes} min •{' '}
                  {workout.total_volume?.toLocaleString() || 0} lbs volume • RPE{' '}
                  {workout.average_rpe?.toFixed(1) || 'N/A'}
                </Text>

                {workout.has_pr && (
                  <Text style={styles.prBadge}>
                    💪 PR: {workout.pr_exercise}
                  </Text>
                )}
              </TouchableOpacity>
            ))}

          {workouts.filter(w => w.status === 'completed').length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No completed workouts this month</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // Navigate to all workouts view
              console.log('View all workouts');
            }}
          >
            <Text style={styles.actionButtonText}>View All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // Export data functionality
              console.log('Export data');
            }}
          >
            <Text style={styles.actionButtonText}>Export Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.deepBlack,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerTitle: {
    ...typography.h2,
    color: palette.white,
    flex: 1,
    marginLeft: spacing.m,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  monthSelector: {
    ...typography.body,
    color: palette.tealPrimary,
  },
  profileButton: {
    padding: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xxl,
  },
  calendar: {
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    marginTop: spacing.l,
    marginBottom: spacing.l,
  },
  calendarRow: {
    flexDirection: 'row',
  },
  calendarHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.s,
  },
  calendarHeaderText: {
    ...typography.bodySmall,
    color: palette.midGray,
    fontWeight: '600',
  },
  calendarCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  calendarDayText: {
    ...typography.body,
    color: palette.lightGray,
  },
  calendarDayToday: {
    color: palette.tealPrimary,
    fontWeight: '700',
  },
  calendarDayCompleted: {
    color: palette.white,
  },
  calendarCheckmark: {
    ...typography.bodySmall,
    color: palette.tealPrimary,
    marginTop: spacing.xxs,
  },
  statsContainer: {
    gap: spacing.s,
    marginBottom: spacing.l,
  },
  statText: {
    ...typography.bodyLarge,
    color: palette.white,
  },
  section: {
    marginBottom: spacing.l,
  },
  sectionTitle: {
    ...typography.h3,
    color: palette.white,
    marginBottom: spacing.m,
  },
  workoutCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.m,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  workoutDate: {
    ...typography.bodySmall,
    color: palette.midGray,
  },
  workoutStatus: {
    ...typography.bodySmall,
    color: palette.tealPrimary,
  },
  workoutName: {
    ...typography.bodyLarge,
    color: palette.white,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  workoutStats: {
    ...typography.bodySmall,
    color: palette.lightGray,
  },
  prBadge: {
    ...typography.bodySmall,
    color: palette.tealPrimary,
    marginTop: spacing.xs,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.m,
    marginTop: spacing.m,
  },
  actionButton: {
    flex: 1,
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
  },
  actionButtonText: {
    ...typography.body,
    color: palette.white,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    ...typography.body,
    color: palette.midGray,
  },
});
