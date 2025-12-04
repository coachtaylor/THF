import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme/theme'
import { glassStyles, textStyles } from '../theme/components';

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
  // Determine card state
  const isDisabled = isPast && !hasWorkout; // Past rest days are just disabled
  const isMissed = isPast && hasWorkout && !isCompleted;
  const isActive = !isPast;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        glassStyles.card,
        styles.card,
        isCompleted && styles.cardCompleted,
        isMissed && styles.cardMissed,
        isDisabled && styles.cardDisabled,
      ]}
    >
      <View style={styles.cardContent}>
        {/* Day Circle */}
        <View style={[
          styles.dayCircle,
          hasWorkout && isActive && styles.dayCircleActive,
          isCompleted && styles.dayCircleCompleted,
          isMissed && styles.dayCircleMissed,
        ]}>
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
            <Text style={[textStyles.caption, styles.dayText]}>
              {day}
            </Text>
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
            textStyles.body,
            styles.workoutName,
            isDisabled && styles.textDisabled,
          ]}>
            {name}
          </Text>

          {hasWorkout && !isCompleted && (
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time" size={12} color={colors.text.tertiary} />
                <Text style={[textStyles.caption, styles.metaText]}>
                  {duration} min
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="barbell" size={12} color={colors.text.tertiary} />
                <Text style={[textStyles.caption, styles.metaText]}>
                  {exercises} exercises
                </Text>
              </View>
            </View>
          )}

          {/* Motivational Quote for Missed Workouts */}
          {isMissed && (
            <View style={styles.motivationalRow}>
              <Ionicons name="flame" size={14} color={colors.semantic.warning} />
              <Text style={[textStyles.caption, styles.motivationalText]}>
                {getRandomQuote()}
              </Text>
            </View>
          )}
        </View>

        {/* Chevron / Status Icon */}
        <View style={styles.rightIcon}>
          {isCompleted ? (
            <View style={styles.completedIcon}>
              <Ionicons name="checkmark-circle" size={24} color={colors.semantic.success} />
            </View>
          ) : isMissed ? (
            <View style={styles.missedIcon}>
              <Ionicons name="alert-circle" size={20} color={colors.semantic.warning} />
            </View>
          ) : hasWorkout ? (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.cyan[500]}
            />
          ) : (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.text.tertiary}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.base,
  },
  cardCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  cardMissed: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.mid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: {
    backgroundColor: colors.glass.bgHero,
    borderWidth: 2,
    borderColor: colors.cyan[500],
  },
  dayCircleCompleted: {
    backgroundColor: colors.semantic.success,
    borderWidth: 0,
  },
  dayCircleMissed: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 2,
    borderColor: colors.semantic.warning,
  },
  dayNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  dayNumberTextActive: {
    color: colors.cyan[500],
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
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
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
    fontSize: 9,
    fontWeight: '600',
    color: colors.semantic.success,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  workoutName: {
    fontSize: 15,
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
    color: colors.text.tertiary,
  },
  motivationalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  motivationalText: {
    color: colors.semantic.warning,
    fontWeight: '600',
    fontSize: 11,
  },
  rightIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedIcon: {
    // Completed icon styling
  },
  missedIcon: {
    // Missed icon styling
  },
});