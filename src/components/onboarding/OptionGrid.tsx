import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { textStyles } from '../../theme/components';

interface Option {
  value: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface OptionGridProps {
  options: Option[];
  selected: string;
  onSelect: (value: string) => void;
  columns?: 2 | 3 | 4;
}

export default function OptionGrid({
  options,
  selected,
  onSelect,
  columns = 2,
}: OptionGridProps) {
  return (
    <View style={[styles.container, { gap: spacing.sm }]}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          onPress={() => onSelect(option.value)}
          activeOpacity={0.7}
          style={[
            styles.button,
            { width: `${100 / columns - 2}%` },
            selected === option.value && styles.buttonSelected,
          ]}
        >
          {option.icon && (
            <Ionicons
              name={option.icon}
              size={16}
              color={selected === option.value ? colors.cyan[500] : colors.text.secondary}
            />
          )}
          <Text
            style={[
              textStyles.bodySmall,
              styles.buttonText,
              selected === option.value && styles.buttonTextSelected,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  button: {
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonSelected: {
    backgroundColor: colors.glass.bgHero,
    borderWidth: 2,
    borderColor: colors.cyan[500],
  },
  buttonText: {
    color: colors.text.secondary,
    fontWeight: '500',
  },
  buttonTextSelected: {
    color: colors.cyan[500],
  },
});
