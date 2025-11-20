import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { palette, spacing, typography } from '../../theme';

interface SecondaryButtonProps {
  onPress: () => void;
  label: string;
  disabled?: boolean;
  fullWidth?: boolean;
}

export default function SecondaryButton({ onPress, label, disabled = false, fullWidth = true }: SecondaryButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        fullWidth && styles.fullWidth,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fullWidth: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  label: {
    ...typography.button,
    color: palette.tealPrimary,
    fontWeight: '600',
  },
  labelDisabled: {
    color: palette.disabled,
  },
});


