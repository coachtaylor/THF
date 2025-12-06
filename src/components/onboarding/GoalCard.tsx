import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, colors } from '../../theme';

export type Goal = 'strength' | 'cardio' | 'flexibility' | 'custom';

interface GoalCardProps {
  goal: Goal;
  isSelected: boolean;
  selectionType: 'primary' | 'secondary' | null;
  onPress: () => void;
}

const GOAL_INFO: Record<Goal, { label: string; description: string; icon: string }> = {
  strength: {
    label: 'Strength',
    description: 'Build muscle and power',
    icon: '💪',
  },
  cardio: {
    label: 'Cardio',
    description: 'Improve endurance and heart health',
    icon: '🏃',
  },
  flexibility: {
    label: 'Flexibility',
    description: 'Increase mobility and range of motion',
    icon: '🧘',
  },
  custom: {
    label: 'Custom',
    description: 'Mix of different goals',
    icon: '✨',
  },
};

export default function GoalCard({ goal, isSelected, selectionType, onPress }: GoalCardProps) {
  const info = GOAL_INFO[goal];
  const isPrimary = selectionType === 'primary';
  const isSecondary = selectionType === 'secondary';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isSelected && styles.cardSelected,
        isPrimary && styles.cardPrimary,
        isSecondary && styles.cardSecondary,
        pressed && styles.cardPressed,
      ]}
    >
      {/* Glass background */}
      <LinearGradient
        colors={
          isPrimary
            ? ['rgba(91, 206, 250, 0.15)', 'rgba(91, 206, 250, 0.05)']
            : isSecondary
            ? ['rgba(91, 206, 250, 0.08)', 'rgba(91, 206, 250, 0.02)']
            : ['rgba(25, 25, 30, 0.8)', 'rgba(18, 18, 22, 0.9)']
        }
        style={StyleSheet.absoluteFill}
      />

      {/* Cyan glow for primary selection */}
      {isPrimary && (
        <LinearGradient
          colors={['rgba(91, 206, 250, 0.25)', 'rgba(91, 206, 250, 0.1)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.7 }}
          style={styles.primaryGlow}
        />
      )}

      {/* Glass highlight */}
      <View style={[styles.glassHighlight, isPrimary && styles.glassHighlightPrimary]} />

      <View style={styles.content}>
        <Text style={styles.icon}>{info.icon}</Text>
        <Text style={[styles.label, isSelected && styles.labelSelected]}>{info.label}</Text>
        <Text style={[styles.description, isSelected && styles.descriptionSelected]}>
          {info.description}
        </Text>
      </View>

      {isPrimary && (
        <View style={styles.badge}>
          <LinearGradient
            colors={[colors.accent.primary, colors.accent.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.badgeText}>Primary</Text>
        </View>
      )}
      {isSecondary && (
        <View style={[styles.badge, styles.badgeSecondary]}>
          <LinearGradient
            colors={['rgba(91, 206, 250, 0.3)', 'rgba(91, 206, 250, 0.15)']}
            style={StyleSheet.absoluteFill}
          />
          <Text style={[styles.badgeText, styles.badgeTextSecondary]}>Secondary</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    height: 160,
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  cardSelected: {
    borderColor: colors.accent.primary,
  },
  cardPrimary: {
    borderColor: colors.accent.primary,
    borderWidth: 2,
  },
  cardSecondary: {
    borderColor: 'rgba(91, 206, 250, 0.4)',
    borderWidth: 1,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  primaryGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  glassHighlightPrimary: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.l,
  },
  icon: {
    fontSize: 40,
    marginBottom: spacing.s,
  },
  label: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  labelSelected: {
    color: colors.accent.primary,
  },
  description: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  descriptionSelected: {
    color: colors.text.secondary,
  },
  badge: {
    position: 'absolute',
    top: spacing.s,
    right: spacing.s,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xxs,
    borderRadius: 12,
    overflow: 'hidden',
  },
  badgeSecondary: {
    borderWidth: 1,
    borderColor: 'rgba(91, 206, 250, 0.3)',
  },
  badgeText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  badgeTextSecondary: {
    color: colors.accent.primary,
  },
});
