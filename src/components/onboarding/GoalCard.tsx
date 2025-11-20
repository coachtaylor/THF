import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { palette, spacing, typography } from '../../theme';

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
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.card,
        isSelected && styles.cardSelected,
        isPrimary && styles.cardPrimary,
        isSecondary && styles.cardSecondary,
      ]}
    >
      <Text style={styles.icon}>{info.icon}</Text>
      <Text style={[styles.label, isSelected && styles.labelSelected]}>{info.label}</Text>
      <Text style={[styles.description, isSelected && styles.descriptionSelected]}>
        {info.description}
      </Text>
      {isPrimary && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Primary</Text>
        </View>
      )}
      {isSecondary && (
        <View style={[styles.badge, styles.badgeSecondary]}>
          <Text style={styles.badgeText}>Secondary</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.darkCard,
    borderRadius: 20,
    padding: spacing.l,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    height: 160,
    width: '100%',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.darkerCard,
  },
  cardPrimary: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealGlow,
    borderWidth: 3,
  },
  cardSecondary: {
    borderColor: palette.tealDark,
    borderWidth: 2,
  },
  icon: {
    fontSize: 40,
    marginBottom: spacing.s,
  },
  label: {
    ...typography.h3,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  labelSelected: {
    color: palette.tealPrimary,
  },
  description: {
    ...typography.bodySmall,
    textAlign: 'center',
    lineHeight: typography.bodySmall.fontSize * 1.4,
  },
  descriptionSelected: {
    color: palette.lightGray,
  },
  badge: {
    position: 'absolute',
    top: spacing.s,
    right: spacing.s,
    backgroundColor: palette.tealPrimary,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xxs,
    borderRadius: 12,
  },
  badgeSecondary: {
    backgroundColor: palette.tealDark,
  },
  badgeText: {
    ...typography.caption,
    color: palette.deepBlack,
    fontWeight: '700',
    fontSize: 11,
  },
});

