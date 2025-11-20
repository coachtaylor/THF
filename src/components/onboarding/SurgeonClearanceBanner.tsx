import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, spacing, typography } from '../../theme';

interface SurgeonClearanceBannerProps {
  visible: boolean;
}

export default function SurgeonClearanceBanner({ visible }: SurgeonClearanceBannerProps) {
  if (!visible) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>⚠️</Text>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Surgeon Clearance Required</Text>
        <Text style={styles.message}>
          If you've had surgery, please confirm you've been cleared by your surgeon before starting workouts.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    backgroundColor: palette.warning + '20', // 20% opacity
    borderLeftWidth: 4,
    borderLeftColor: palette.warning,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.l,
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 24,
    marginRight: spacing.m,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.h4,
    color: palette.warning,
    marginBottom: spacing.xs,
  },
  message: {
    ...typography.bodySmall,
    color: palette.lightGray,
    lineHeight: typography.bodySmall.fontSize * 1.5,
  },
});

