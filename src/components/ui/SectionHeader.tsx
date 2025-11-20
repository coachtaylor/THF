import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { palette, spacing, typography } from '../../theme';

interface SectionHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function SectionHeader({ title, description, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {actionLabel && onAction && (
          <TouchableOpacity onPress={onAction} style={styles.actionButton}>
            <Text style={styles.actionLabel}>{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.m,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  title: {
    ...typography.h3,
    color: palette.white,
    letterSpacing: -0.3,
    flex: 1,
  },
  actionButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.s,
  },
  actionLabel: {
    ...typography.bodySmall,
    color: palette.tealPrimary,
    fontWeight: '600',
  },
  description: {
    ...typography.bodySmall,
    color: palette.midGray,
    lineHeight: 18,
  },
});


