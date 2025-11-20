import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { palette, spacing, typography } from '../../theme';

interface ConstraintCheckboxProps {
  label: string;
  description?: string;
  checked: boolean;
  onPress: () => void;
}

export default function ConstraintCheckbox({ label, description, checked, onPress }: ConstraintCheckboxProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.container, checked && styles.containerChecked]}
    >
      <View style={[styles.checkbox, checked && styles.checkboxSelected]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.label, checked && styles.labelChecked]}>{label}</Text>
        {description && (
          <Text style={[styles.description, checked && styles.descriptionChecked]}>{description}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.darkCard,
    borderRadius: 20,
    padding: spacing.l,
    borderWidth: 2,
    borderColor: palette.border,
    gap: spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  containerChecked: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealGlow,
    borderWidth: 2.5,
    shadowColor: palette.tealPrimary,
    shadowOpacity: 0.2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: palette.border,
    backgroundColor: palette.deepBlack,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  checkboxSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealPrimary,
  },
  checkmark: {
    color: palette.deepBlack,
    fontSize: 14,
    fontWeight: '700',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    ...typography.h4,
    marginBottom: spacing.xxs,
    fontWeight: '600',
  },
  labelChecked: {
    color: palette.tealPrimary,
  },
  description: {
    ...typography.bodySmall,
    color: palette.midGray,
    lineHeight: 18,
  },
  descriptionChecked: {
    color: palette.lightGray,
  },
});

