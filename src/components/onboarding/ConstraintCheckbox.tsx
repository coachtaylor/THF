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
      activeOpacity={0.8}
      style={[styles.container, checked && styles.containerChecked]}
    >
      <View style={styles.checkboxContainer}>
        {checked && <Text style={styles.checkboxMark}>✓</Text>}
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
    borderRadius: 16,
    padding: spacing.m,
    borderWidth: 2,
    borderColor: palette.border,
    marginBottom: spacing.s,
  },
  containerChecked: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.darkerCard,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: palette.deepBlack,
    borderWidth: 2,
    borderColor: palette.tealPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  checkboxMark: {
    color: palette.tealPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    ...typography.bodyLarge,
    marginBottom: spacing.xxs,
  },
  labelChecked: {
    color: palette.tealPrimary,
  },
  description: {
    ...typography.bodySmall,
    color: palette.midGray,
    lineHeight: typography.bodySmall.fontSize * 1.4,
  },
  descriptionChecked: {
    color: palette.lightGray,
  },
});

