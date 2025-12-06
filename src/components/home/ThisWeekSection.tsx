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
      {/* Glass background */}
      <LinearGradient
        colors={['rgba(25, 25, 30, 0.6)', 'rgba(20, 20, 25, 0.7)']}
        style={StyleSheet.absoluteFill}
      />
      {/* Top highlight */}
      <View style={styles.glassHighlight} />

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
                  colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.08)']}
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
                  <Ionicons name="checkmark" size={14} color={colors.accent.success} />
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
                    size={8}
                    color={colors.text.primary}
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
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(25, 25, 30, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
    }),
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 1,
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
    fontSize: 10,
    fontWeight: '500',
    color: colors.text.disabled,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  dayLabelToday: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  dayCircleToday: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  dayCircleTodayGradient: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleWorkout: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dayCircleCompleted: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  dayNumber: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  dayNumberToday: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: colors.text.primary,
    fontWeight: '700',
  },
  dayNumberPast: {
    color: colors.text.disabled,
  },
  indicatorContainer: {
    height: 12,
    marginTop: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutIndicatorToday: {
    width: 14,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
