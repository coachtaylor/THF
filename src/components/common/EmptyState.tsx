import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme/theme';
import GlassButton from './GlassButton';

export type EmptyStateVariant = 'default' | 'workout' | 'progress' | 'saved' | 'search';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

const variantConfig: Record<EmptyStateVariant, {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBgColor: string;
}> = {
  default: {
    icon: 'albums-outline',
    iconColor: colors.accent.primary,
    iconBgColor: colors.accent.primaryMuted,
  },
  workout: {
    icon: 'barbell-outline',
    iconColor: colors.accent.primary,
    iconBgColor: colors.accent.primaryMuted,
  },
  progress: {
    icon: 'trending-up-outline',
    iconColor: colors.accent.secondary,
    iconBgColor: colors.accent.secondaryMuted,
  },
  saved: {
    icon: 'bookmark-outline',
    iconColor: colors.accent.primary,
    iconBgColor: colors.accent.primaryMuted,
  },
  search: {
    icon: 'search-outline',
    iconColor: colors.text.tertiary,
    iconBgColor: colors.glass.bg,
  },
};

export default function EmptyState({
  variant = 'default',
  title,
  message,
  icon,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const iconName = icon || config.icon;

  return (
    <View style={[styles.container, style]} accessibilityRole="text">
      <View style={[styles.iconContainer, { backgroundColor: config.iconBgColor }]}>
        <Ionicons name={iconName} size={40} color={config.iconColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <GlassButton
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          size="medium"
          style={styles.actionButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.h3,
    fontFamily: 'Poppins-SemiBold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.s,
  },
  message: {
    fontSize: typography.body,
    fontFamily: 'Poppins',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  actionButton: {
    marginTop: spacing.lg,
  },
});
