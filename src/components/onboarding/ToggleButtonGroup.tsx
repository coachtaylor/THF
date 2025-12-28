import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { textStyles } from '../../theme/components';

interface ToggleButtonGroupProps {
  options: string[];
  selected: string | null;
  onSelect: (value: string) => void;
  columns?: number;
}

export default function ToggleButtonGroup({
  options,
  selected,
  onSelect,
  columns,
}: ToggleButtonGroupProps) {
  // If columns specified, use grid layout
  if (columns) {
    const rows: string[][] = [];
    for (let i = 0; i < options.length; i += columns) {
      rows.push(options.slice(i, i + columns));
    }

    return (
      <View style={styles.gridContainer}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.container}>
            {row.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => onSelect(option)}
                activeOpacity={0.7}
                style={[
                  styles.button,
                  selected === option && styles.buttonSelected,
                ]}
              >
                <Text
                  style={[
                    textStyles.label,
                    styles.buttonText,
                    selected === option && styles.buttonTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          onPress={() => onSelect(option)}
          activeOpacity={0.7}
          style={[
            styles.button,
            selected === option && styles.buttonSelected,
          ]}
        >
          <Text
            style={[
              textStyles.label,
              styles.buttonText,
              selected === option && styles.buttonTextSelected,
            ]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    gap: spacing.md,
  },
  container: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
    height: 56,
    borderRadius: borderRadius.base,
    backgroundColor: colors.glass.bg,
    borderWidth: 2,
    borderColor: colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSelected: {
    backgroundColor: colors.glass.bgHero,
    borderColor: colors.cyan[500],
  },
  buttonText: {
    color: colors.text.secondary,
  },
  buttonTextSelected: {
    color: colors.cyan[500],
  },
});