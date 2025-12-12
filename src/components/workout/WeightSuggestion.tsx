// WeightSuggestion component
// Displays last performance and suggested weight for current exercise

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LastPerformance } from '../../services/storage/workoutLog';
import { colors, spacing, borderRadius } from '../../theme/theme';

interface WeightSuggestionProps {
  lastPerformance: LastPerformance | null;
  suggestedWeight: number;
  currentWeight: number;
  onApplySuggestion: (weight: number) => void;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function WeightSuggestion({
  lastPerformance,
  suggestedWeight,
  currentWeight,
  onApplySuggestion,
}: WeightSuggestionProps) {
  if (!lastPerformance) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="information-circle-outline" size={16} color={colors.text.tertiary} />
          <Text style={styles.emptyStateText}>
            No previous data for this exercise
          </Text>
        </View>
      </View>
    );
  }

  const { sets, avgReps, avgWeight, avgRPE, date } = lastPerformance;
  const weightDiff = suggestedWeight - avgWeight;
  const isWeightApplied = currentWeight === suggestedWeight;

  return (
    <View style={styles.container}>
      {/* Last Performance Card */}
      <View style={styles.lastPerfCard}>
        <LinearGradient
          colors={['rgba(91, 206, 250, 0.1)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.glassHighlight} />

        <View style={styles.lastPerfHeader}>
          <Ionicons name="time-outline" size={14} color={colors.accent.primary} />
          <Text style={styles.lastPerfLabel}>Last Performance</Text>
          <Text style={styles.lastPerfDate}>{formatDate(date)}</Text>
        </View>

        <View style={styles.lastPerfStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{sets}</Text>
            <Text style={styles.statLabel}>sets</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{avgReps}</Text>
            <Text style={styles.statLabel}>avg reps</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{avgWeight}</Text>
            <Text style={styles.statLabel}>lbs avg</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{avgRPE}</Text>
            <Text style={styles.statLabel}>RPE</Text>
          </View>
        </View>
      </View>

      {/* Suggestion Card */}
      <Pressable
        style={({ pressed }) => [
          styles.suggestionCard,
          isWeightApplied && styles.suggestionCardApplied,
          pressed && !isWeightApplied && styles.suggestionCardPressed,
        ]}
        onPress={() => !isWeightApplied && onApplySuggestion(suggestedWeight)}
        disabled={isWeightApplied}
      >
        <LinearGradient
          colors={
            isWeightApplied
              ? ['rgba(52, 211, 153, 0.15)', 'rgba(52, 211, 153, 0.05)']
              : ['rgba(91, 206, 250, 0.15)', 'rgba(91, 206, 250, 0.05)']
          }
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.suggestionContent}>
          <View style={styles.suggestionIcon}>
            {isWeightApplied ? (
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            ) : (
              <Ionicons name="flash" size={20} color={colors.accent.primary} />
            )}
          </View>

          <View style={styles.suggestionText}>
            <Text style={[
              styles.suggestionLabel,
              isWeightApplied && styles.suggestionLabelApplied,
            ]}>
              {isWeightApplied ? 'Suggested weight applied' : 'Suggested weight'}
            </Text>
            <View style={styles.suggestionWeightRow}>
              <Text style={[
                styles.suggestionWeight,
                isWeightApplied && styles.suggestionWeightApplied,
              ]}>
                {suggestedWeight} lbs
              </Text>
              {weightDiff !== 0 && (
                <View style={[
                  styles.weightDiffBadge,
                  weightDiff > 0 ? styles.weightDiffIncrease : styles.weightDiffDecrease,
                ]}>
                  <Ionicons
                    name={weightDiff > 0 ? 'arrow-up' : 'arrow-down'}
                    size={10}
                    color={weightDiff > 0 ? colors.success : colors.accent.secondary}
                  />
                  <Text style={[
                    styles.weightDiffText,
                    weightDiff > 0 ? styles.weightDiffTextIncrease : styles.weightDiffTextDecrease,
                  ]}>
                    {Math.abs(weightDiff)} lbs
                  </Text>
                </View>
              )}
            </View>
          </View>

          {!isWeightApplied && (
            <View style={styles.tapHint}>
              <Text style={styles.tapHintText}>Tap to apply</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.accent.primary} />
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.l,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.m,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  emptyStateText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.tertiary,
  },
  lastPerfCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
    padding: spacing.m,
    marginBottom: spacing.s,
    overflow: 'hidden',
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  lastPerfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.m,
  },
  lastPerfLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: colors.accent.primary,
    flex: 1,
  },
  lastPerfDate: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: colors.text.tertiary,
  },
  lastPerfStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: spacing.xxs,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.default,
  },
  suggestionCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.accent.primary,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  suggestionCardApplied: {
    borderColor: colors.success,
    ...Platform.select({
      ios: { shadowColor: colors.success },
      android: {},
    }),
  },
  suggestionCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    gap: spacing.m,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glass.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionText: {
    flex: 1,
  },
  suggestionLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: colors.accent.primary,
    marginBottom: spacing.xxs,
  },
  suggestionLabelApplied: {
    color: colors.success,
  },
  suggestionWeightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  suggestionWeight: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  suggestionWeightApplied: {
    color: colors.success,
  },
  weightDiffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  weightDiffIncrease: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  weightDiffDecrease: {
    backgroundColor: 'rgba(245, 169, 184, 0.15)',
  },
  weightDiffText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '600',
  },
  weightDiffTextIncrease: {
    color: colors.success,
  },
  weightDiffTextDecrease: {
    color: colors.accent.secondary,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  tapHintText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: colors.accent.primary,
  },
});

export default WeightSuggestion;
