import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { palette, spacing, typography } from '../../theme';

interface PrimaryButtonProps {
  onPress: () => void;
  label: string;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export default function PrimaryButton({ onPress, label, disabled = false, loading = false, fullWidth = true }: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={palette.deepBlack} style={styles.spinner} />
          <Text style={styles.label}>{label}</Text>
        </View>
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: palette.tealPrimary,
    borderRadius: 20,
    paddingVertical: spacing.l,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.tealPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    minHeight: 56,
  },
  fullWidth: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  label: {
    ...typography.button,
    color: palette.deepBlack,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  spinner: {
    marginRight: spacing.xs,
  },
});

