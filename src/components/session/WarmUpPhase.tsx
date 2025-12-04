import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';

interface WarmUpExercise {
  name: string;
  duration?: string;
  reps?: string;
  description: string;
}

interface WarmUpPhaseProps {
  warmUpExercises: WarmUpExercise[];
  totalDurationMinutes: number;
  onComplete: () => void;
  onSkip?: () => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

export default function WarmUpPhase({ warmUpExercises, totalDurationMinutes, onComplete, onSkip }: WarmUpPhaseProps) {
  const insets = useSafeAreaInsets();
  const [completedExercises, setCompletedExercises] = useState<boolean[]>(
    new Array(warmUpExercises.length).fill(false)
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Timer for warm-up duration
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Shimmer animation for complete button
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const toggleExercise = (index: number) => {
    setCompletedExercises(prev => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };

  const allCompleted = completedExercises.every(completed => completed);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Background gradient */}
      <LinearGradient
        colors={[colors.bg.primary, colors.bg.secondary]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Warm-Up</Text>
        <View style={styles.headerRight}>
          <View style={styles.timerBadge}>
            <Ionicons name="time-outline" size={18} color={colors.accent.primary} />
            <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
          </View>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.instructionCard}>
          <Ionicons name="fitness-outline" size={24} color={colors.accent.primary} />
          <Text style={styles.instructionText}>
            Get your body ready for the workout ahead!
          </Text>
        </View>

        {warmUpExercises.map((exercise, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.exerciseCard,
              completedExercises[index] && styles.exerciseCardCompleted
            ]}
            onPress={() => toggleExercise(index)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#141418', '#0A0A0C']}
              style={StyleSheet.absoluteFill}
            />
            {completedExercises[index] && (
              <LinearGradient
                colors={['rgba(91, 206, 250, 0.1)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            <View style={styles.glassHighlight} />

            <View style={styles.exerciseCheckboxContainer}>
              <View style={[
                styles.checkbox,
                completedExercises[index] && styles.checkboxChecked
              ]}>
                {completedExercises[index] && (
                  <Ionicons name="checkmark" size={18} color={colors.text.inverse} />
                )}
              </View>
            </View>
            <View style={styles.exerciseContent}>
              <View style={styles.exerciseHeader}>
                <Text style={[
                  styles.exerciseName,
                  completedExercises[index] && styles.exerciseNameCompleted
                ]}>
                  {exercise.name}
                </Text>
                <View style={styles.durationBadge}>
                  <Text style={styles.exerciseDuration}>
                    {exercise.duration || exercise.reps || ''}
                  </Text>
                </View>
              </View>
              <Text style={styles.exerciseDescription}>{exercise.description}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.hintContainer}>
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.accent.primary} />
          <Text style={styles.hintText}>
            Check off each exercise as you complete it
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + spacing.m }]}>
        <TouchableOpacity
          style={[styles.completeButton, !allCompleted && styles.completeButtonDisabled]}
          onPress={onComplete}
          activeOpacity={0.8}
          disabled={!allCompleted}
        >
          <LinearGradient
            colors={allCompleted ? [colors.accent.primary, '#4AA8D8'] : [colors.glass.bg, colors.glass.bg]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.completeButtonGradient}
          >
            {allCompleted && (
              <Animated.View
                style={[
                  styles.shimmerOverlay,
                  { transform: [{ translateX: shimmerTranslate }] },
                ]}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(255, 255, 255, 0.2)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            )}
            <Text style={[
              styles.completeButtonText,
              !allCompleted && styles.completeButtonTextDisabled
            ]}>
              Complete Warm-Up
            </Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color={allCompleted ? colors.text.inverse : colors.text.tertiary}
            />
          </LinearGradient>
        </TouchableOpacity>
        {onSkip && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
            activeOpacity={0.8}
          >
            <Text style={styles.skipButtonText}>Skip Warm-Up</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.glass.bg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
  },
  timerText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.glass.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.l,
    paddingBottom: spacing.xl,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.xl,
    padding: spacing.m,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
  },
  instructionText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    color: colors.text.secondary,
    flex: 1,
  },
  exerciseCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.m,
    marginBottom: spacing.m,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  exerciseCardCompleted: {
    borderColor: colors.glass.borderCyan,
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseCheckboxContainer: {
    marginRight: spacing.m,
    justifyContent: 'flex-start',
    paddingTop: spacing.xxs,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border.default,
    backgroundColor: colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  exerciseName: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  exerciseNameCompleted: {
    color: colors.accent.primary,
  },
  durationBadge: {
    backgroundColor: colors.glass.bg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  exerciseDuration: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  exerciseDescription: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  hintText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.tertiary,
  },
  buttonContainer: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    backgroundColor: colors.bg.primary,
    gap: spacing.m,
  },
  completeButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    padding: spacing.m,
    paddingVertical: 16,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
  },
  completeButtonText: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.inverse,
    letterSpacing: 0.3,
  },
  completeButtonTextDisabled: {
    color: colors.text.tertiary,
  },
  skipButton: {
    padding: spacing.m,
    alignItems: 'center',
  },
  skipButtonText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
});

