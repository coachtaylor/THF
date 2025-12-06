import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme/theme';

interface ScheduleCardProps {
  day: string;
  dayNumber: number;
  name: string;
  duration: number;
  exercises: number;
  hasWorkout: boolean;
  isPast: boolean;
  isCompleted: boolean;
  onPress: () => void;
}

const MOTIVATIONAL_QUOTES = [
  "Never too late to start!",
  "You've got this!",
  "Make up this workout?",
  "Ready to catch up?",
  "Let's finish strong!",
];

const getRandomQuote = () => {
  return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
};

export default function ScheduleCard({
  day,
  dayNumber,
  name,
  duration,
  exercises,
  hasWorkout,
  isPast,
  isCompleted,
  onPress,
}: ScheduleCardProps) {
  const isDisabled = isPast && !hasWorkout;
  const isMissed = isPast && hasWorkout && !isCompleted;
  const isActive = !isPast;

  const getCardColors = (): [string, string] => {
    if (isCompleted) {
      return ['rgba(34, 197, 94, 0.08)', 'rgba(34, 197, 94, 0.03)'];
    }
    if (isMissed) {
      return ['rgba(245, 158, 11, 0.08)', 'rgba(245, 158, 11, 0.03)'];
    }
    return ['rgba(25, 25, 30, 0.7)', 'rgba(18, 18, 22, 0.8)'];
  };

  const getBorderColor = () => {
    if (isCompleted) return 'rgba(34, 197, 94, 0.25)';
    if (isMissed) return 'rgba(245, 158, 11, 0.25)';
    if (hasWorkout && isActive) return 'rgba(91, 206, 250, 0.15)';
    return 'rgba(255, 255, 255, 0.06)';
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.card,
        { borderColor: getBorderColor() },
        isDisabled && styles.cardDisabled,
        pressed && styles.cardPressed,
      ]}
    >
      {/* Glass background */}
      <LinearGradient
        colors={getCardColors()}
        style={StyleSheet.absoluteFill}
      />

      {/* Glass highlight */}
      <View style={styles.glassHighlight} />

      <View style={styles.cardContent}>
        {/* Day Circle */}
        <View style={[
          styles.dayCircle,
          hasWorkout && isActive && styles.dayCircleActive,
          isCompleted && styles.dayCircleCompleted,
          isMissed && styles.dayCircleMissed,
        ]}>
          {isCompleted && (
            <LinearGradient
              colors={[colors.semantic.success, '#16A34A']}
              style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
            />
          )}
          {hasWorkout && isActive && !isCompleted && (
            <LinearGradient
              colors={['rgba(91, 206, 250, 0.2)', 'rgba(91, 206, 250, 0.1)']}
              style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
            />
          )}
          {isCompleted ? (
            <Ionicons name="checkmark" size={20} color={colors.text.primary} />
          ) : (
            <Text style={[
              styles.dayNumberText,
              hasWorkout && isActive && styles.dayNumberTextActive,
              isCompleted && styles.dayNumberTextCompleted,
            ]}>
              {dayNumber}
            </Text>
          )}
        </View>

        {/* Workout Info */}
        <View style={styles.workoutInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.dayText}>{day}</Text>
            {!hasWorkout && (
              <View style={styles.restBadge}>
                <Text style={styles.restBadgeText}>REST</Text>
              </View>
            )}
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={12} color={colors.semantic.success} />
                <Text style={styles.completedBadgeText}>COMPLETED</Text>
              </View>
            )}
          </View>

          <Text style={[
            styles.workoutName,
            isDisabled && styles.textDisabled,
          ]}>
            {name}
          </Text>

          {hasWorkout && !isCompleted && (
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time" size={12} color={colors.text.tertiary} />
                <Text style={styles.metaText}>{duration} min</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="barbell" size={12} color={colors.text.tertiary} />
                <Text style={styles.metaText}>{exercises} exercises</Text>
              </View>
            </View>
          )}

          {/* Motivational Quote for Missed Workouts */}
          {isMissed && (
            <View style={styles.motivationalRow}>
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.15)', 'rgba(245, 158, 11, 0.08)']}
                style={[StyleSheet.absoluteFill, { borderRadius: borderRadius.sm }]}
              />
              <Ionicons name="flame" size={14} color={colors.semantic.warning} />
              <Text style={styles.motivationalText}>{getRandomQuote()}</Text>
            </View>
          )}
        </View>

        {/* Chevron / Status Icon */}
        <View style={styles.rightIcon}>
          {isCompleted ? (
            <Ionicons name="checkmark-circle" size={24} color={colors.semantic.success} />
          ) : isMissed ? (
            <Ionicons name="alert-circle" size={20} color={colors.semantic.warning} />
          ) : hasWorkout ? (
            <Ionicons name="chevron-forward" size={20} color={colors.accent.primary} />
          ) : (
            <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dayCircleActive: {
    borderWidth: 2,
    borderColor: colors.accent.primary,
  },
  dayCircleCompleted: {
    borderWidth: 0,
  },
  dayCircleMissed: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 2,
    borderColor: colors.semantic.warning,
  },
  dayNumberText: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  dayNumberTextActive: {
    color: colors.accent.primary,
  },
  dayNumberTextCompleted: {
    color: colors.text.primary,
  },
  workoutInfo: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dayText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  restBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  restBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 9,
    fontWeight: '600',
    color: colors.semantic.success,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  completedBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 9,
    fontWeight: '600',
    color: colors.semantic.success,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  workoutName: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  textDisabled: {
    opacity: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '400',
    color: colors.text.tertiary,
  },
  motivationalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  motivationalText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '600',
    color: colors.semantic.warning,
  },
  rightIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
