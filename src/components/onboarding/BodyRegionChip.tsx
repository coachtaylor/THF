import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { palette, spacing, typography } from '../../theme';

interface BodyRegionChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export default function BodyRegionChip({ label, selected, onPress }: BodyRegionChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      {selected && (
        <View style={styles.checkmarkContainer}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
      )}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: 24,
    backgroundColor: palette.darkCard,
    borderWidth: 2,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 40,
  },
  chipSelected: {
    backgroundColor: palette.tealGlow,
    borderColor: palette.tealPrimary,
    borderWidth: 2.5,
    shadowColor: palette.tealPrimary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  checkmarkContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: palette.tealPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: palette.deepBlack,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
  },
  label: {
    ...typography.body,
    color: palette.lightGray,
    fontWeight: '500',
  },
  labelSelected: {
    color: palette.tealPrimary,
    fontWeight: '700',
  },
});

