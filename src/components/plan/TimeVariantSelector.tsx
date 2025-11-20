import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { palette, spacing, typography } from '../../theme';

interface TimeVariantSelectorProps {
  selected: 5 | 15 | 30 | 45;
  onSelect: (duration: 5 | 15 | 30 | 45) => void;
}

const VARIANTS: Array<{ duration: 5 | 15 | 30 | 45; label: string }> = [
  { duration: 5, label: '5 min' },
  { duration: 15, label: '15 min' },
  { duration: 30, label: '30 min' },
  { duration: 45, label: '45 min' },
];

export default function TimeVariantSelector({ selected, onSelect }: TimeVariantSelectorProps) {

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Workout Duration</Text>
      <View style={styles.variantsContainer}>
        {VARIANTS.map((variant) => {
          const isSelected = variant.duration === selected;
          return (
            <TouchableOpacity
              key={variant.duration}
              onPress={() => onSelect(variant.duration)}
              activeOpacity={0.8}
              style={[styles.variantButton, isSelected && styles.variantButtonSelected]}
            >
              <Text style={[styles.variantText, isSelected && styles.variantTextSelected]}>
                {variant.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    backgroundColor: palette.deepBlack,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  label: {
    ...typography.caption,
    marginBottom: spacing.xs,
    color: palette.midGray,
  },
  variantsContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  variantButton: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    backgroundColor: palette.darkCard,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  variantButtonSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealGlow,
  },
  variantText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  variantTextSelected: {
    color: palette.tealPrimary,
    fontWeight: '700',
  },
});

