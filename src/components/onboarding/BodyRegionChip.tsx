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
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: 20,
    backgroundColor: palette.darkCard,
    borderWidth: 2,
    borderColor: palette.border,
    marginRight: spacing.s,
    marginBottom: spacing.s,
  },
  chipSelected: {
    backgroundColor: palette.darkerCard,
    borderColor: palette.tealPrimary,
  },
  label: {
    ...typography.body,
    color: palette.lightGray,
  },
  labelSelected: {
    color: palette.tealPrimary,
    fontWeight: '600',
  },
});

