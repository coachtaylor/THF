import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme/theme';

interface AppliedRule {
  rule_id: string;
  category: string;
  action_taken: string;
  userMessage?: string;
}

interface SafetyRulesIndicatorProps {
  rulesApplied: AppliedRule[];
  compact?: boolean;
  onPress?: () => void;
}

/**
 * Displays active safety rules that are modifying the workout.
 * Shows users why their workout is being adjusted (post-op, HRT, binding, dysphoria).
 */
export function SafetyRulesIndicator({
  rulesApplied,
  compact = false,
  onPress,
}: SafetyRulesIndicatorProps) {
  if (!rulesApplied || rulesApplied.length === 0) {
    return null;
  }

  // Group rules by category
  const categories = new Set(rulesApplied.map(r => r.category));

  // Map categories to user-friendly labels and icons
  const categoryInfo: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
    post_op: {
      label: 'Post-Op Recovery',
      icon: 'medical',
      color: colors.semantic.warning,
    },
    hrt_adjustment: {
      label: 'HRT Optimized',
      icon: 'flask',
      color: colors.accent.primary,
    },
    binding: {
      label: 'Binding-Safe',
      icon: 'shield-checkmark',
      color: colors.semantic.success,
    },
    dysphoria: {
      label: 'Comfort-Adjusted',
      icon: 'heart',
      color: colors.cyan[400],
    },
  };

  // Get active category badges
  const activeBadges = Array.from(categories)
    .map(cat => categoryInfo[cat])
    .filter(Boolean);

  if (compact) {
    // Compact mode: just show icons
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress}
      >
        <View style={styles.compactBadge}>
          <Ionicons name="shield-checkmark" size={14} color={colors.cyan[400]} />
          <Text style={styles.compactText}>
            {rulesApplied.length} safety adjustment{rulesApplied.length > 1 ? 's' : ''} active
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={18} color={colors.cyan[400]} />
        <Text style={styles.headerText}>Safety Adjustments Active</Text>
        {onPress && (
          <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
        )}
      </View>

      <View style={styles.badgeRow}>
        {activeBadges.map((badge, index) => (
          <View key={index} style={[styles.badge, { backgroundColor: `${badge.color}15` }]}>
            <Ionicons name={badge.icon} size={14} color={badge.color} />
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.base,
    borderRadius: borderRadius.base,
    backgroundColor: `${colors.cyan[500]}10`,
    borderWidth: 1,
    borderColor: `${colors.cyan[500]}20`,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.cyan[400],
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.cyan[500]}10`,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.cyan[400],
  },
});

export default SafetyRulesIndicator;
