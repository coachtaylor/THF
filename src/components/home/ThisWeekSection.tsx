import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../theme/theme';
import { textStyles } from '../../theme/components';
import type { Day } from '../../types/plan';

interface WeekDayWithWorkout {
  day: Day;
  workout: any; // Workout from plan with exercises
  workoutName?: string;
  completed?: boolean;
}

interface ThisWeekSectionProps {
  weekDays: WeekDayWithWorkout[];
  todayName: string;
}

export default function ThisWeekSection({ weekDays, todayName }: ThisWeekSectionProps) {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const getDayName = (date: Date) => {
    const dayIndex = date.getDay();
    return dayNames[dayIndex];
  };

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return `${month} ${day}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate.getTime() === today.getTime();
  };

  if (weekDays.length === 0) {
    return null;
  }

  // Filter to only show days with workouts
  const daysWithWorkouts = weekDays.filter(item => item.workout !== null);

  if (daysWithWorkouts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>This Week</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.workoutsList}>
        {daysWithWorkouts.map((item, index) => {
          const { day, workout, workoutName, completed } = item;
          const dayName = getDayName(new Date(day.date));
          const isTodayWorkout = isToday(new Date(day.date));
          const exerciseCount = workout?.exercises?.length || 0;
          const duration = workout?.duration || 45;

          return (
            <TouchableOpacity
              key={`${day.dayNumber}-${index}`}
              style={[
                styles.workoutCard,
                completed && styles.workoutCardCompleted,
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.workoutCardLeft}>
                <View style={styles.dateContainer}>
                  <Text style={[
                    styles.dayNumber,
                    isTodayWorkout && styles.dayNumberToday,
                  ]}>
                    {new Date(day.date).getDate()}
                  </Text>
                </View>
                
                <View style={styles.workoutInfo}>
                  <View style={styles.workoutHeader}>
                    <Text style={styles.dayName}>
                      {dayName.slice(0, 3).toUpperCase()}
                      {isTodayWorkout && ' • Today'}
                    </Text>
                    {completed && (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.cyan[500]} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.workoutDetails}>{workoutName || 'Workout'}</Text>
                  <Text style={styles.workoutMeta}>{duration} min • {exerciseCount} exercises</Text>
                </View>
              </View>

              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={colors.text.tertiary} 
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  title: {
    ...textStyles.h3,
  },
  viewAllText: {
    ...textStyles.bodySmall,
    color: colors.cyan[500],
  },
  workoutsList: {
    gap: spacing.l,
  },
  workoutCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.m,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.xl,
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.default,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workoutCardCompleted: {
    backgroundColor: colors.bg.elevated,
    borderColor: colors.cyan[500] + '20',
  },
  workoutCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.xl,
  },
  dateContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.s,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumber: {
    ...textStyles.statMediumBase,
    color: colors.text.primary,
  },
  dayNumberToday: {
    color: colors.cyan[500],
  },
  workoutInfo: {
    flex: 1,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  dayName: {
    ...textStyles.bodySmall,
    fontWeight: typography.weights.semibold,
  },
  completedBadge: {
    marginLeft: 'auto',
  },
  workoutDetails: {
    ...textStyles.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  workoutMeta: {
    ...textStyles.caption,
    textTransform: 'none',
    color: colors.text.tertiary,
  },
});