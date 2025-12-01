import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { palette, spacing, typography } from '../../theme';

interface TimeVariantSelectorProps {
  selected: 30 | 45 | 60 | 90;
  onSelect: (duration: 30 | 45 | 60 | 90) => void;
}

const VARIANTS: Array<{ duration: 30 | 45 | 60 | 90; label: string }> = [
  { duration: 30, label: '30 min' },
  { duration: 45, label: '45 min' },
  { duration: 60, label: '60 min' },
  { duration: 90, label: '90 min' },
];

export default function TimeVariantSelector({ selected, onSelect }: TimeVariantSelectorProps) {

  return (
    <View style={styles.container}>
      <View style={styles.variantsContainer}>
        {VARIANTS.map((variant) => {
          const isSelected = variant.duration === selected;
          return (
            <TouchableOpacity
              key={variant.duration}
              onPress={() => onSelect(variant.duration)}
              activeOpacity={0.7}
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
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    backgroundColor: palette.deepBlack,
    width: '100%',
  },
  variantsContainer: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  variantButton: {
    flex: 1,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.xs,
    backgroundColor: palette.darkCard,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  variantButtonSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealGlow,
  },
  variantText: {
    ...typography.body,
    fontWeight: '600',
    color: palette.lightGray,
  },
  variantTextSelected: {
    color: palette.tealPrimary,
    fontWeight: '700',
  },
});

