import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/theme';
import { glassStyles, textStyles } from '../../theme/components';
import OptionGrid from './OptionGrid';
import DaySelector from './DaySelector';

type HRTMethod = 'pills' | 'patches' | 'injections' | 'gel';
type HRTFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'twice_weekly';
type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

interface MedicationSectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  method: HRTMethod;
  frequency: HRTFrequency;
  selectedDays: Set<DayOfWeek>;
  onMethodChange: (method: HRTMethod) => void;
  onFrequencyChange: (frequency: HRTFrequency) => void;
  onToggleDay: (day: DayOfWeek) => void;
  isEstrogen?: boolean;
}

const METHOD_OPTIONS = [
  { value: 'pills', label: 'Pills', icon: 'medical' as const },
  { value: 'patches', label: 'Patches', icon: 'bandage' as const },
  { value: 'injections', label: 'Injections', icon: 'water' as const },
  { value: 'gel', label: 'Gel/Cream', icon: 'flask' as const },
];

// Default frequency options (used for testosterone)
const DEFAULT_FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 Weeks' },
  { value: 'monthly', label: 'Monthly' },
];

// Get clinically accurate frequency options based on method and hormone type
const getFrequencyOptionsForMethod = (method: HRTMethod, isEstrogen: boolean) => {
  if (isEstrogen) {
    // Estrogen-specific frequency options
    switch (method) {
      case 'pills':
        return [{ value: 'daily', label: 'Daily' }];
      case 'patches':
        return [
          { value: 'twice_weekly', label: '2x per week' },
          { value: 'weekly', label: 'Weekly' },
        ];
      case 'gel':
        return [{ value: 'daily', label: 'Daily' }];
      case 'injections':
        return [
          { value: 'weekly', label: 'Weekly' },
          { value: 'biweekly', label: 'Every 2 Weeks' },
          { value: 'monthly', label: 'Monthly' },
        ];
      default:
        return DEFAULT_FREQUENCY_OPTIONS;
    }
  }

  // Testosterone-specific frequency options
  switch (method) {
    case 'pills':
      return [{ value: 'daily', label: 'Daily' }];
    case 'patches':
      return [{ value: 'daily', label: 'Daily' }];
    case 'gel':
      return [{ value: 'daily', label: 'Daily' }];
    case 'injections':
      return [
        { value: 'weekly', label: 'Weekly' },
        { value: 'biweekly', label: 'Every 2 Weeks' },
        { value: 'monthly', label: 'Monthly' },
      ];
    default:
      return DEFAULT_FREQUENCY_OPTIONS;
  }
};

export default function MedicationSection({
  title,
  icon,
  method,
  frequency,
  selectedDays,
  onMethodChange,
  onFrequencyChange,
  onToggleDay,
  isEstrogen = false,
}: MedicationSectionProps) {
  // Get the valid frequency options for the current method
  const frequencyOptions = getFrequencyOptionsForMethod(method, isEstrogen);

  // Auto-select a valid frequency when method changes and current frequency is invalid
  useEffect(() => {
    const isCurrentValid = frequencyOptions.some(opt => opt.value === frequency);
    if (!isCurrentValid && frequencyOptions.length > 0) {
      onFrequencyChange(frequencyOptions[0].value as HRTFrequency);
    }
  }, [method, isEstrogen, frequency, frequencyOptions, onFrequencyChange]);

  return (
    <View style={[glassStyles.card, styles.container]}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name={icon} size={20} color={colors.cyan[500]} />
        <Text style={[textStyles.h3, styles.title]}>{title}</Text>
      </View>

      {/* Method */}
      <View style={styles.section}>
        <Text style={[textStyles.caption, styles.label]}>METHOD</Text>
        <OptionGrid
          options={METHOD_OPTIONS}
          selected={method}
          onSelect={(value) => onMethodChange(value as HRTMethod)}
          columns={2}
        />
      </View>

      {/* Frequency */}
      <View style={styles.section}>
        <Text style={[textStyles.caption, styles.label]}>FREQUENCY</Text>
        <OptionGrid
          options={frequencyOptions}
          selected={frequency}
          onSelect={(value) => onFrequencyChange(value as HRTFrequency)}
          columns={2}
        />
      </View>

      {/* Days */}
      <View style={styles.section}>
        <Text style={[textStyles.caption, styles.label]}>DAYS YOU TAKE IT</Text>
        <DaySelector selectedDays={selectedDays} onToggleDay={onToggleDay} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    marginBottom: 0,
  },
  section: {
    gap: spacing.sm,
  },
  label: {
    color: colors.text.tertiary,
  },
});