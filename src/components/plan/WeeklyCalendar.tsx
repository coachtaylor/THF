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
  const formatDayName = (date: Date): string => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return daysOfWeek[date.getDay()];
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {days.map((day) => {
          const today = new Date();
          const isToday = day.date.toDateString() === today.toDateString();
          const isSelected = day.dayNumber === selectedDay || isToday;
          const dayName = formatDayName(day.date);
          const dayNumber = day.date.getDate();

          return (
            <TouchableOpacity
              key={day.dayNumber}
              onPress={() => onSelectDay(day.dayNumber)}
              activeOpacity={0.7}
              style={styles.dayCard}
            >
              <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                {dayName}
              </Text>
              <View style={[styles.dayNumberCircle, isSelected && styles.dayNumberCircleSelected]}>
                <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
                  {dayNumber}
                </Text>
              </View>
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
    paddingHorizontal: spacing.l,
    gap: spacing.s,
  },
  dayCard: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  dayName: {
    fontSize: 12,
    textAlign: 'center',
    color: palette.midGray,
    marginBottom: spacing.s,
    fontWeight: '500',
  },
  dayNameSelected: {
    color: palette.tealPrimary,
    fontWeight: '600',
  },
  dayNumberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.darkCard,
    borderWidth: 1.5,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  dayNumberCircleSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealGlow,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.white,
    textAlign: 'center',
  },
  dayNumberSelected: {
    color: palette.tealPrimary,
    fontWeight: '700',
  },
});

