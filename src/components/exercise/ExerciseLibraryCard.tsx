// src/components/exercise/ExerciseLibraryCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme';
import { Exercise } from '../../types';

export interface ExerciseLibraryCardProps {
  exercise: Exercise;
  onPress: () => void;
  isSwapMode?: boolean;
  isInWorkout?: boolean;
}

const ExerciseLibraryCard: React.FC<ExerciseLibraryCardProps> = ({
  exercise,
  onPress,
  isSwapMode = false,
  isInWorkout = false,
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return colors.success;
      case 'intermediate':
        return colors.warning;
      case 'advanced':
        return colors.accent.secondary;
      default:
        return colors.text.tertiary;
    }
  };

  const formatEquipment = (equipment: string[]): string => {
    if (!equipment || equipment.length === 0) return 'Bodyweight';
    return equipment
      .filter(e => e !== 'none')
      .map(e => e.charAt(0).toUpperCase() + e.slice(1))
      .join(', ') || 'Bodyweight';
  };

  const formatMuscles = (muscles?: string): string => {
    if (!muscles) return '';
    return muscles
      .split(',')
      .map(m => m.trim())
      .slice(0, 2)
      .map(m => m.charAt(0).toUpperCase() + m.slice(1))
      .join(', ');
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['rgba(25, 25, 30, 0.9)', 'rgba(18, 18, 22, 0.95)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Glass highlight */}
      <View style={styles.glassHighlight} />

      <View style={styles.content}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.exerciseName} numberOfLines={1}>
                {exercise.name}
              </Text>
              {isInWorkout && (
                <View style={styles.inWorkoutBadge}>
                  <Ionicons name="checkmark-circle" size={12} color={colors.accent.primary} />
                  <Text style={styles.inWorkoutText}>In Workout</Text>
                </View>
              )}
            </View>
            {exercise.target_muscles && (
              <Text style={styles.muscleText} numberOfLines={1}>
                {formatMuscles(exercise.target_muscles)}
              </Text>
            )}
          </View>

          {/* Safety Badges */}
          <View style={styles.safetyBadges}>
            {exercise.binder_aware && (
              <View style={[styles.safetyBadge, styles.binderBadge]}>
                <Ionicons name="shield-checkmark" size={12} color={colors.accent.primary} />
              </View>
            )}
            {exercise.heavy_binding_safe && (
              <View style={[styles.safetyBadge, styles.heavyBindingBadge]}>
                <Ionicons name="shield" size={12} color={colors.accent.secondary} />
              </View>
            )}
            {exercise.pelvic_floor_safe && (
              <View style={[styles.safetyBadge, styles.pelvicBadge]}>
                <Ionicons name="heart" size={12} color={colors.success} />
              </View>
            )}
          </View>
        </View>

        {/* Info Row */}
        <View style={styles.infoRow}>
          {/* Difficulty Badge */}
          <View style={styles.difficultyContainer}>
            <View
              style={[
                styles.difficultyDot,
                { backgroundColor: getDifficultyColor(exercise.difficulty) },
              ]}
            />
            <Text style={styles.difficultyText}>
              {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
            </Text>
          </View>

          {/* Equipment */}
          <View style={styles.equipmentContainer}>
            <Ionicons name="barbell-outline" size={14} color={colors.text.tertiary} />
            <Text style={styles.equipmentText} numberOfLines={1}>
              {formatEquipment(exercise.equipment)}
            </Text>
          </View>

          {/* Pattern/Goal */}
          {exercise.pattern && (
            <View style={styles.patternBadge}>
              <Text style={styles.patternText}>
                {exercise.pattern}
              </Text>
            </View>
          )}
        </View>

        {/* Swap Mode Select Button */}
        {isSwapMode && (
          <View style={styles.selectButtonContainer}>
            <LinearGradient
              colors={[colors.accent.primary, colors.accent.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.selectButton}
            >
              <Text style={styles.selectButtonText}>Select</Text>
              <Ionicons name="swap-horizontal" size={16} color={colors.text.inverse} />
            </LinearGradient>
          </View>
        )}
      </View>

      {/* Chevron for browse mode */}
      {!isSwapMode && (
        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.l,
    overflow: 'hidden',
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.default,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  content: {
    flex: 1,
    padding: spacing.m,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.s,
  },
  titleContainer: {
    flex: 1,
    marginRight: spacing.s,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  exerciseName: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  inWorkoutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.primaryMuted,
    paddingHorizontal: spacing.s,
    paddingVertical: 2,
    borderRadius: borderRadius.s,
    gap: 4,
  },
  inWorkoutText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  muscleText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  safetyBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  safetyBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  binderBadge: {
    backgroundColor: colors.accent.primaryMuted,
  },
  heavyBindingBadge: {
    backgroundColor: colors.accent.secondaryMuted,
  },
  pelvicBadge: {
    backgroundColor: colors.accent.successMuted,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    flexWrap: 'wrap',
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  difficultyText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: colors.text.tertiary,
  },
  equipmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  equipmentText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: colors.text.tertiary,
    flex: 1,
  },
  patternBadge: {
    backgroundColor: colors.bg.elevated,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.s,
  },
  patternText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '500',
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  selectButtonContainer: {
    marginTop: spacing.m,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: borderRadius.m,
    gap: spacing.xs,
  },
  selectButtonText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  chevronContainer: {
    paddingRight: spacing.m,
  },
});

export default ExerciseLibraryCard;
