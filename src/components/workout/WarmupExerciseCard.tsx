// WarmupExerciseCard component
// Displays a single warm-up exercise with checkbox completion

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
import { WarmupExercise } from '../../services/workoutGeneration/warmupCooldown';
import { colors, spacing, borderRadius } from '../../theme/theme';

interface WarmupExerciseCardProps {
  exercise: WarmupExercise;
  index: number;
  total: number;
  isCompleted: boolean;
  isActive: boolean;
  onComplete: () => void;
}

export function WarmupExerciseCard({
  exercise,
  index,
  total,
  isCompleted,
  isActive,
  onComplete,
}: WarmupExerciseCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        isActive && styles.containerActive,
        isCompleted && styles.containerCompleted,
        pressed && styles.containerPressed,
      ]}
      onPress={onComplete}
      disabled={isCompleted}
    >
      {/* Background gradient */}
      <LinearGradient
        colors={
          isCompleted
            ? ['rgba(91, 206, 250, 0.15)', 'rgba(91, 206, 250, 0.05)']
            : isActive
            ? ['#1a1a1f', '#141418']
            : ['#141418', '#0f0f12']
        }
        style={StyleSheet.absoluteFill}
      />

      {/* Glass highlight */}
      {isActive && <View style={styles.glassHighlight} />}

      {/* Content */}
      <View style={styles.content}>
        {/* Checkbox */}
        <View style={[
          styles.checkbox,
          isCompleted && styles.checkboxCompleted,
          isActive && !isCompleted && styles.checkboxActive,
        ]}>
          {isCompleted ? (
            <Ionicons name="checkmark" size={16} color={colors.text.inverse} />
          ) : (
            <Text style={styles.checkboxNumber}>{index + 1}</Text>
          )}
        </View>

        {/* Exercise info */}
        <View style={styles.info}>
          <Text style={[
            styles.name,
            isCompleted && styles.nameCompleted,
          ]}>
            {exercise.name}
          </Text>
          <Text style={styles.description}>{exercise.description}</Text>

          {/* Duration or reps */}
          <View style={styles.prescriptionRow}>
            {exercise.duration && (
              <View style={styles.prescriptionChip}>
                <Ionicons name="time-outline" size={12} color={colors.accent.primary} />
                <Text style={styles.prescriptionText}>{exercise.duration}</Text>
              </View>
            )}
            {exercise.reps && (
              <View style={styles.prescriptionChip}>
                <Ionicons name="repeat-outline" size={12} color={colors.accent.primary} />
                <Text style={styles.prescriptionText}>{exercise.reps}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tap indicator for active exercise */}
        {isActive && !isCompleted && (
          <View style={styles.tapIndicator}>
            <Text style={styles.tapText}>Tap when done</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.accent.primary} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
    marginBottom: spacing.m,
  },
  containerActive: {
    borderColor: colors.accent.primary,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  containerCompleted: {
    borderColor: colors.glass.borderCyan,
    opacity: 0.7,
  },
  containerPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    gap: spacing.m,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.glass.bg,
    borderWidth: 2,
    borderColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primaryMuted,
  },
  checkboxCompleted: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  checkboxNumber: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  nameCompleted: {
    textDecorationLine: 'line-through',
    color: colors.text.secondary,
  },
  description: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: spacing.s,
  },
  prescriptionRow: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  prescriptionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.glass.bgHero,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.xs,
  },
  prescriptionText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: colors.accent.primary,
  },
  tapIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  tapText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: colors.accent.primary,
  },
});

export default WarmupExerciseCard;
