import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, spacing, typography } from '../../theme';

interface SafetyTagProps {
  type: 'binder-aware' | 'pelvic-floor-friendly' | 'low-impact';
  size?: 'small' | 'medium';
}

const TAG_CONFIG = {
  'binder-aware': {
    label: 'Binder-aware',
    backgroundColor: palette.tealGlow,
    borderColor: palette.tealPrimary,
    icon: '🛡️',
  },
  'pelvic-floor-friendly': {
    label: 'Pelvic-floor friendly',
    backgroundColor: palette.tealGlow,
    borderColor: palette.tealDark,
    icon: '✨',
  },
  'low-impact': {
    label: 'Low-impact',
    backgroundColor: palette.tealGlow,
    borderColor: palette.tealPrimary,
    icon: '🌿',
  },
};

export default function SafetyTag({ type, size = 'small' }: SafetyTagProps) {
  const config = TAG_CONFIG[type];
  const isSmall = size === 'small';

  return (
    <View style={[
      styles.tag,
      isSmall && styles.tagSmall,
      {
        backgroundColor: config.backgroundColor,
        borderColor: config.borderColor,
      },
    ]}>
      {!isSmall && <Text style={styles.icon}>{config.icon}</Text>}
      <Text style={[styles.label, isSmall && styles.labelSmall]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.xxs,
  },
  tagSmall: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  icon: {
    fontSize: 12,
  },
  label: {
    ...typography.caption,
    color: palette.tealPrimary,
    fontWeight: '600',
    fontSize: 12,
  },
  labelSmall: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});


