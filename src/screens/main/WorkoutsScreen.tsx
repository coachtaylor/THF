import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile } from '../../hooks/useProfile';
import { getMonthWorkouts, getCurrentStreak, MonthWorkout } from '../../services/storage/stats';
import { colors, spacing, borderRadius, typography } from '../../theme/theme';
import { GlassCard, GlassButton, ProgressRing } from '../../components/common';
import { StatsRow } from '../../components/home/Statcard';

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
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

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

    for (let i = 0; i < startingDayOfWeek; i++) {
      week.push(null);
    }

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

      if (week.length === 7) {
        calendar.push(week);
        week = [];
      }
    }

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
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <View key={i} style={styles.calendarHeaderCell}>
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
                  <View style={[
                    styles.calendarDayContainer,
                    cell.isToday && styles.calendarDayTodayContainer,
                    cell.hasWorkout && !cell.isToday && styles.calendarDayCompletedContainer,
                  ]}>
                    {cell.isToday && (
                      <LinearGradient
                        colors={[colors.accent.primary, colors.accent.primaryDark]}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                    <Text
                      style={[
                        styles.calendarDayText,
                        cell.isToday && styles.calendarDayTodayText,
                        cell.hasWorkout && styles.calendarDayCompletedText,
                      ]}
                    >
                      {cell.day}
                    </Text>
                    {cell.hasWorkout && !cell.isToday && (
                      <View style={styles.checkmarkDot} />
                    )}
                  </View>
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Workout History</Text>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            style={styles.profileButton}
            hitSlop={8}
          >
            <Ionicons name="person-circle-outline" size={26} color={colors.text.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <Pressable
            onPress={() => changeMonth('prev')}
            style={styles.monthNavButton}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
          </Pressable>
          <Text style={styles.monthText}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <Pressable
            onPress={() => changeMonth('next')}
            style={styles.monthNavButton}
            hitSlop={8}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </Pressable>
        </View>

        {/* Calendar */}
        <GlassCard variant="default" style={styles.calendarCard}>
          {renderCalendar()}
        </GlassCard>

        {/* Stats Summary */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.statsGrid}>
            <GlassCard variant="default" style={styles.statCard}>
              <View style={styles.statContent}>
                <ProgressRing
                  progress={totalScheduled > 0 ? completedThisMonth / totalScheduled : 0}
                  size={48}
                  strokeWidth={3}
                  color="primary"
                >
                  <Ionicons name="checkmark" size={18} color={colors.accent.primary} />
                </ProgressRing>
                <View style={styles.statText}>
                  <Text style={styles.statValue}>{completedThisMonth}/{totalScheduled}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
              </View>
            </GlassCard>

            <GlassCard variant="default" style={styles.statCard}>
              <View style={styles.statContent}>
                <View style={styles.streakCircle}>
                  <Ionicons name="flame" size={20} color={colors.accent.primary} />
                </View>
                <View style={styles.statText}>
                  <Text style={styles.statValue}>{streak}</Text>
                  <Text style={styles.statLabel}>Day Streak</Text>
                </View>
              </View>
            </GlassCard>
          </View>
        </View>

        {/* Recent Workouts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>

          {workouts
            .filter(w => w.status === 'completed')
            .slice(0, 10)
            .map((workout) => (
              <GlassCard
                key={workout.id}
                variant="default"
                pressable
                onPress={() => console.log('View workout:', workout.id)}
                style={styles.workoutCard}
              >
                <View style={styles.workoutHeader}>
                  <View style={styles.workoutDateBadge}>
                    <Text style={styles.workoutDateText}>
                      {new Date(workout.workout_date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    <Text style={styles.completedText}>Completed</Text>
                  </View>
                </View>

                <Text style={styles.workoutName}>{workout.workout_name}</Text>

                <View style={styles.workoutStats}>
                  <View style={styles.workoutStatItem}>
                    <Ionicons name="time-outline" size={14} color={colors.text.tertiary} />
                    <Text style={styles.workoutStatText}>{workout.duration_minutes} min</Text>
                  </View>
                  <View style={styles.workoutStatItem}>
                    <Ionicons name="barbell-outline" size={14} color={colors.text.tertiary} />
                    <Text style={styles.workoutStatText}>
                      {workout.total_volume?.toLocaleString() || 0} lbs
                    </Text>
                  </View>
                  {workout.average_rpe && (
                    <View style={styles.workoutStatItem}>
                      <Ionicons name="fitness-outline" size={14} color={colors.text.tertiary} />
                      <Text style={styles.workoutStatText}>
                        RPE {workout.average_rpe.toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>

                {workout.has_pr && (
                  <View style={styles.prBadge}>
                    <Ionicons name="trophy" size={14} color={colors.accent.primary} />
                    <Text style={styles.prText}>PR: {workout.pr_exercise}</Text>
                  </View>
                )}
              </GlassCard>
            ))}

          {workouts.filter(w => w.status === 'completed').length === 0 && (
            <GlassCard variant="default" style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={40} color={colors.text.tertiary} />
              <Text style={styles.emptyStateText}>No completed workouts this month</Text>
              <Text style={styles.emptyStateSubtext}>
                Start a workout to see your progress here
              </Text>
            </GlassCard>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <GlassButton
            title="View All"
            variant="secondary"
            size="medium"
            icon="list-outline"
            onPress={() => console.log('View all workouts')}
            fullWidth={false}
            style={styles.actionButton}
          />
          <GlassButton
            title="Export Data"
            variant="secondary"
            size="medium"
            icon="download-outline"
            onPress={() => console.log('Export data')}
            fullWidth={false}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.m,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    padding: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.l,
    gap: spacing.l,
  },
  monthNavButton: {
    padding: spacing.s,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.glass.bg,
  },
  monthText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  calendarCard: {
    marginBottom: spacing.xl,
  },
  calendar: {
    gap: spacing.xs,
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
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  calendarCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxs,
  },
  calendarDayContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  calendarDayTodayContainer: {
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  calendarDayCompletedContainer: {
    backgroundColor: colors.accent.primaryMuted,
  },
  calendarDayText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
  },
  calendarDayTodayText: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
  calendarDayCompletedText: {
    color: colors.accent.primary,
    fontWeight: '500',
  },
  checkmarkDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent.primary,
  },
  statsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.2,
    marginBottom: spacing.m,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  streakCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.glass.bgHero,
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.tertiary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: spacing.xl,
  },
  workoutCard: {
    marginBottom: spacing.m,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  workoutDateBadge: {
    backgroundColor: colors.glass.bgLight,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
  },
  workoutDateText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  completedText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: colors.success,
  },
  workoutName: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.s,
  },
  workoutStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
  },
  workoutStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  workoutStatText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.tertiary,
  },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.s,
    backgroundColor: colors.glass.bgHero,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
  },
  prText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: colors.accent.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.s,
  },
  emptyStateText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.m,
    marginTop: spacing.m,
  },
  actionButton: {
    flex: 1,
  },
});
