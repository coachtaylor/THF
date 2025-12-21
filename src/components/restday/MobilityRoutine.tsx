// MobilityRoutine component
// A simple guided mobility/stretching routine for rest days

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';

interface MobilityExercise {
  name: string;
  duration: number; // seconds
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const MOBILITY_EXERCISES: MobilityExercise[] = [
  {
    name: 'Cat-Cow Stretch',
    duration: 45,
    description: 'Alternate between arching and rounding your back',
    icon: 'body-outline',
  },
  {
    name: 'Hip Circles',
    duration: 30,
    description: 'Circle your hips in both directions',
    icon: 'sync-outline',
  },
  {
    name: 'Shoulder Rolls',
    duration: 30,
    description: 'Roll shoulders forward, then backward',
    icon: 'resize-outline',
  },
  {
    name: 'World\'s Greatest Stretch',
    duration: 60,
    description: 'Lunge with rotation - each side',
    icon: 'expand-outline',
  },
  {
    name: 'Neck Rolls',
    duration: 30,
    description: 'Gently roll your head in slow circles',
    icon: 'ellipse-outline',
  },
  {
    name: 'Standing Side Bend',
    duration: 40,
    description: 'Reach overhead and lean to each side',
    icon: 'swap-horizontal-outline',
  },
  {
    name: 'Forward Fold',
    duration: 45,
    description: 'Fold forward, letting your head hang',
    icon: 'arrow-down-outline',
  },
  {
    name: 'Deep Breathing',
    duration: 60,
    description: 'Slow deep breaths - 4 counts in, 6 counts out',
    icon: 'leaf-outline',
  },
];

interface MobilityRoutineProps {
  onComplete?: () => void;
}

export function MobilityRoutine({ onComplete }: MobilityRoutineProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const totalDuration = MOBILITY_EXERCISES.reduce((sum, ex) => sum + ex.duration, 0);
  const currentExercise = MOBILITY_EXERCISES[currentIndex];

  // Timer effect
  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Move to next exercise
          if (currentIndex < MOBILITY_EXERCISES.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return MOBILITY_EXERCISES[currentIndex + 1].duration;
          } else {
            // Routine complete
            setIsActive(false);
            setIsCompleted(true);
            onComplete?.();
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft, currentIndex, onComplete]);

  // Pulse animation when active
  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isActive, pulseAnim]);

  const startRoutine = () => {
    setIsActive(true);
    setCurrentIndex(0);
    setTimeLeft(MOBILITY_EXERCISES[0].duration);
    setIsCompleted(false);
  };

  const skipExercise = () => {
    if (currentIndex < MOBILITY_EXERCISES.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setTimeLeft(MOBILITY_EXERCISES[currentIndex + 1].duration);
    } else {
      setIsActive(false);
      setIsCompleted(true);
      onComplete?.();
    }
  };

  const stopRoutine = () => {
    setIsActive(false);
    setCurrentIndex(0);
    setTimeLeft(0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  if (isCompleted) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(52, 211, 153, 0.1)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.completedContent}>
          <View style={styles.completedIcon}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          </View>
          <Text style={styles.completedTitle}>Routine Complete!</Text>
          <Text style={styles.completedSubtitle}>
            Great job taking care of your body today
          </Text>
          <Pressable style={styles.resetButton} onPress={() => setIsCompleted(false)}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!isActive) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(91, 206, 250, 0.08)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="body-outline" size={24} color={colors.accent.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>10-Minute Mobility</Text>
            <Text style={styles.subtitle}>{MOBILITY_EXERCISES.length} exercises</Text>
          </View>
          <Text style={styles.duration}>{Math.round(totalDuration / 60)} min</Text>
        </View>

        <View style={styles.exercisePreview}>
          {MOBILITY_EXERCISES.slice(0, 4).map((exercise, index) => (
            <View key={index} style={styles.previewItem}>
              <View style={styles.previewDot} />
              <Text style={styles.previewText} numberOfLines={1}>{exercise.name}</Text>
            </View>
          ))}
          {MOBILITY_EXERCISES.length > 4 && (
            <Text style={styles.moreText}>+{MOBILITY_EXERCISES.length - 4} more</Text>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.startButton,
            pressed && styles.startButtonPressed,
          ]}
          onPress={startRoutine}
        >
          <LinearGradient
            colors={[colors.accent.primary, colors.accent.primaryDark]}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="play" size={18} color={colors.text.inverse} />
          <Text style={styles.startButtonText}>Start Routine</Text>
        </Pressable>
      </View>
    );
  }

  // Active routine state
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(91, 206, 250, 0.15)', 'rgba(91, 206, 250, 0.05)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Progress indicator */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((currentIndex) / MOBILITY_EXERCISES.length) * 100}%` },
          ]}
        />
      </View>

      {/* Current exercise */}
      <View style={styles.activeContent}>
        <Text style={styles.exerciseCount}>
          {currentIndex + 1} of {MOBILITY_EXERCISES.length}
        </Text>

        <Animated.View
          style={[
            styles.timerCircle,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        </Animated.View>

        <Text style={styles.currentExerciseName}>{currentExercise.name}</Text>
        <Text style={styles.currentExerciseDesc}>{currentExercise.description}</Text>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable
            style={({ pressed }) => [styles.controlButton, pressed && styles.controlButtonPressed]}
            onPress={stopRoutine}
          >
            <Ionicons name="stop" size={20} color={colors.text.secondary} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.skipButton, pressed && styles.skipButtonPressed]}
            onPress={skipExercise}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.accent.primary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    gap: spacing.m,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: colors.text.tertiary,
  },
  duration: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.accent.primary,
  },
  exercisePreview: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.m,
    gap: spacing.xs,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  previewDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text.tertiary,
  },
  previewText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: colors.text.tertiary,
  },
  moreText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: colors.text.disabled,
    marginLeft: spacing.m,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    paddingVertical: spacing.m,
    marginHorizontal: spacing.m,
    marginBottom: spacing.m,
    borderRadius: borderRadius.m,
    overflow: 'hidden',
  },
  startButtonPressed: {
    opacity: 0.9,
  },
  startButtonText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  progressBar: {
    height: 3,
    backgroundColor: colors.glass.bg,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
  },
  activeContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  exerciseCount: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: spacing.m,
  },
  timerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accent.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.accent.primary,
    marginBottom: spacing.l,
  },
  timerText: {
    fontFamily: 'Poppins',
    fontSize: 28,
    fontWeight: '700',
    color: colors.accent.primary,
  },
  currentExerciseName: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  currentExerciseDesc: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.l,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.l,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.glass.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  controlButtonPressed: {
    opacity: 0.8,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.accent.primary,
  },
  skipButtonPressed: {
    opacity: 0.8,
  },
  skipButtonText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: colors.accent.primary,
  },
  completedContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  completedIcon: {
    marginBottom: spacing.m,
  },
  completedTitle: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '600',
    color: colors.success,
    marginBottom: spacing.xs,
  },
  completedSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.l,
  },
  resetButton: {
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.l,
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.m,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  resetButtonText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
  },
});

export default MobilityRoutine;
