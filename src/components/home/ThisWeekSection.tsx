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

      // Check if this is a rest day:
      // 1. Explicitly marked as rest day (isRestDay: true)
      // 2. Has day entry but no workout (null workout means rest day)
      // 3. All variants are null (legacy plans without isRestDay field)
      const hasNullVariants = workoutDay?.day?.variants &&
        workoutDay.day.variants[30] === null &&
        workoutDay.day.variants[45] === null &&
        workoutDay.day.variants[60] === null &&
        workoutDay.day.variants[90] === null;
      const isRestDay = workoutDay?.day?.isRestDay === true ||
        (workoutDay && !workoutDay.workout) ||
        hasNullVariants;

      days.push({
        label: dayLabels[i],
        date: date.getDate(),
        isToday,
        isPast,
        hasWorkout: !!workoutDay?.workout,
        isRestDay: isRestDay || false,
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
                day.isRestDay && styles.dayCircleRest,
                day.completed && styles.dayCircleCompleted,
              ]}>
                {day.completed ? (
                  <Ionicons name="checkmark" size={14} color={colors.accent.success} />
                ) : day.isRestDay ? (
                  <Ionicons name="moon-outline" size={12} color="rgba(245, 169, 184, 0.6)" />
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
    marginBottom: 8,
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
  dayCircleRest: {
    backgroundColor: 'rgba(245, 169, 184, 0.05)',
    borderColor: 'rgba(245, 169, 184, 0.15)',
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
});
