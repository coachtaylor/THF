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
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const dayName = dayNames[date.getDay()];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? 'ST' : day === 2 || day === 22 ? 'ND' : day === 3 || day === 23 ? 'RD' : 'TH';
    return `${dayName}, ${month} ${day}${suffix}`.toUpperCase();
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
      <Text style={styles.title}>This Week</Text>

      <View style={styles.workoutsList}>
        {daysWithWorkouts.map((item, index) => {
          const { day, workout, workoutName, completed } = item;
          const isTodayWorkout = isToday(new Date(day.date));
          const exerciseCount = workout?.exercises?.length || 0;
          const duration = workout?.duration || 45;

          return (
            <TouchableOpacity
              key={`${day.dayNumber}-${index}`}
              style={styles.workoutCard}
              activeOpacity={0.7}
            >
              <View style={styles.workoutCardContent}>
                <Text style={styles.dateText}>{formatDate(new Date(day.date))}</Text>
                <Text style={styles.workoutName}>{workoutName || 'Workout'}</Text>
                
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={colors.text.primary} />
                    <Text style={styles.metaText}>{duration} min</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="barbell-outline" size={14} color={colors.text.primary} />
                    <Text style={styles.metaText}>{exerciseCount} exercises</Text>
                  </View>
                </View>
              </View>

              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={colors.text.primary} 
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
  title: {
    ...textStyles.h3,
    marginBottom: spacing.m,
  },
  workoutsList: {
    gap: spacing.m,
  },
  workoutCard: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.s,
    borderWidth: 1,
    borderColor: '#505962',
    height: 94,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  workoutCardContent: {
    flex: 1,
    gap: 2,
  },
  dateText: {
    fontFamily: 'Poppins',
    fontSize: 8,
    fontWeight: typography.weights.regular,
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    lineHeight: 15,
  },
  workoutName: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: typography.weights.regular,
    color: colors.text.primary,
    letterSpacing: -0.5697,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginTop: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    lineHeight: 21,
  },
});