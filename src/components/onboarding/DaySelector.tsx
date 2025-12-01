import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme/theme';

type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

interface DaySelectorProps {
  selectedDays: Set<DayOfWeek>;
  onToggleDay: (day: DayOfWeek) => void;
}

const DAYS: { id: DayOfWeek; label: string }[] = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
];

export default function DaySelector({ selectedDays, onToggleDay }: DaySelectorProps) {
  return (
    <View style={styles.container}>
      {DAYS.map((day) => {
        const isSelected = selectedDays.has(day.id);
        return (
          <TouchableOpacity
            key={day.id}
            onPress={() => onToggleDay(day.id)}
            activeOpacity={0.7}
            style={[
              styles.dayButton,
              isSelected && styles.dayButtonSelected,
            ]}
          >
            <Text
              style={[
                styles.dayText,
                isSelected && styles.dayTextSelected,
              ]}
            >
              {day.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 6,
  },
  dayButton: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: colors.glass.bgHero,
    borderWidth: 2,
    borderColor: colors.cyan[500],
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  dayTextSelected: {
    color: colors.cyan[500],
  },
});