import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { palette, spacing, typography } from '../../theme';
import { Day } from '../../types/plan';

interface WeeklyCalendarProps {
  days: Day[];
  selectedDay: number;
  onSelectDay: (dayNumber: number) => void;
}

export default function WeeklyCalendar({ days, selectedDay, onSelectDay }: WeeklyCalendarProps) {
  const formatDate = (date: Date): string => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = daysOfWeek[date.getDay()];
    const dayNumber = date.getDate();
    return `${dayName}\n${dayNumber}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {days.map((day) => {
          const isSelected = day.dayNumber === selectedDay;
          const hasWorkout = day.variants[15] !== null || day.variants[30] !== null;

          return (
            <TouchableOpacity
              key={day.dayNumber}
              onPress={() => onSelectDay(day.dayNumber)}
              activeOpacity={0.8}
              style={[styles.dayCard, isSelected && styles.dayCardSelected]}
            >
              <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                {formatDate(day.date)}
              </Text>
              {hasWorkout && <View style={styles.workoutIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.m,
    backgroundColor: palette.deepBlack,
  },
  scrollContent: {
    paddingHorizontal: spacing.m,
    gap: spacing.s,
  },
  dayCard: {
    width: 60,
    height: 70,
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.s,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.border,
  },
  dayCardSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealGlow,
  },
  dayText: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 16,
  },
  dayTextSelected: {
    color: palette.tealPrimary,
    fontWeight: '700',
  },
  workoutIndicator: {
    position: 'absolute',
    bottom: spacing.xxs,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.tealPrimary,
  },
});

