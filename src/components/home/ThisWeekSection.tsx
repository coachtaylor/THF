import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/theme';
import type { Day } from '../../types/plan';

interface WeekDayWithWorkout {
  day: Day;
  workout: any;
  workoutName?: string;
  completed?: boolean;
}

interface ThisWeekSectionProps {
  weekDays: WeekDayWithWorkout[];
  todayName: string;
}

export default function ThisWeekSection({ weekDays }: ThisWeekSectionProps) {
  // Get all days of current week
  const getWeekDays = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const days = [];
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      const isToday = date.getTime() === todayDate.getTime();
      const isPast = date.getTime() < todayDate.getTime();

      // Check if this day has a workout
      const workoutDay = weekDays.find(wd => {
        const wdDate = new Date(wd.day.date);
        wdDate.setHours(0, 0, 0, 0);
        return wdDate.getTime() === date.getTime();
      });

      days.push({
        label: dayLabels[i],
        date: date.getDate(),
        isToday,
        isPast,
        hasWorkout: !!workoutDay?.workout,
        workout: workoutDay,
        completed: workoutDay?.completed || false,
      });
    }
    return days;
  };

  const allDays = getWeekDays();

  return (
    <View style={styles.container}>
      {/* Week strip */}
      <View style={styles.weekStrip}>
        {allDays.map((day, index) => (
          <View key={index} style={styles.dayColumn}>
            <Text style={[
              styles.dayLabel,
              day.isToday && styles.dayLabelToday
            ]}>
              {day.label}
            </Text>

            {day.isToday ? (
              <View style={styles.dayCircleToday}>
                <LinearGradient
                  colors={[colors.accent.primary, colors.accent.primaryDark]}
                  style={styles.dayCircleTodayGradient}
                >
                  <Text style={styles.dayNumberToday}>
                    {day.date}
                  </Text>
                </LinearGradient>
              </View>
            ) : (
              <View style={[
                styles.dayCircle,
                day.hasWorkout && styles.dayCircleWorkout,
                day.completed && styles.dayCircleCompleted,
              ]}>
                {day.completed ? (
                  <Ionicons name="checkmark" size={18} color={colors.accent.success} />
                ) : (
                  <Text style={[
                    styles.dayNumber,
                    day.isPast && styles.dayNumberPast,
                  ]}>
                    {day.date}
                  </Text>
                )}
              </View>
            )}

            {/* Indicator - only show barbell for today */}
            <View style={styles.indicatorContainer}>
              {day.isToday && day.hasWorkout && !day.completed && (
                <View style={styles.workoutIndicatorToday}>
                  <Ionicons
                    name="barbell"
                    size={10}
                    color={colors.accent.primary}
                  />
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.disabled,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  dayLabelToday: {
    color: colors.accent.primary,
    fontWeight: '600',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleToday: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  dayCircleTodayGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleWorkout: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  dayCircleCompleted: {
    backgroundColor: colors.accent.successMuted,
  },
  dayNumber: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  dayNumberToday: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.inverse,
    fontWeight: '700',
  },
  dayNumberPast: {
    color: colors.text.disabled,
  },
  indicatorContainer: {
    height: 16,
    marginTop: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutIndicatorToday: {
    width: 18,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.accent.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
