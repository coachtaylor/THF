// CooldownExerciseCard component
// Displays a single cool-down/stretch exercise with timer and breathing cues

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WarmupExercise } from '../../services/workoutGeneration/warmupCooldown';
import { colors, spacing, borderRadius } from '../../theme/theme';

interface CooldownExerciseCardProps {
  exercise: WarmupExercise;
  index: number;
  total: number;
  isCompleted: boolean;
  isActive: boolean;
  onComplete: () => void;
}

// Parse duration string to seconds (e.g., "30 seconds" -> 30, "60 seconds each side" -> 60)
function parseDurationToSeconds(duration: string): number {
  const match = duration.match(/(\d+)\s*(seconds?|sec|s)/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  // Default to 30 seconds if no match
  return 30;
}

export function CooldownExerciseCard({
  exercise,
  index,
  total,
  isCompleted,
  isActive,
  onComplete,
}: CooldownExerciseCardProps) {
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [targetTime, setTargetTime] = useState(30);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Parse target time from duration
  useEffect(() => {
    if (exercise.duration) {
      setTargetTime(parseDurationToSeconds(exercise.duration));
    }
  }, [exercise.duration]);

  // Start timer when active
  useEffect(() => {
    if (isActive && !isCompleted && !isTimerRunning) {
      setIsTimerRunning(true);
      setTimer(0);
    }
  }, [isActive, isCompleted]);

  // Timer countdown/countup
  useEffect(() => {
    if (!isTimerRunning || isCompleted) return;

    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, isCompleted]);

  // Breathing animation
  useEffect(() => {
    if (isActive && !isCompleted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 4000, // 4 seconds inhale
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 4000, // 4 seconds exhale
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
    return () => {
      pulseAnim.setValue(0);
    };
  }, [isActive, isCompleted]);

  const breathScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const breathOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  const progress = Math.min(timer / targetTime, 1);
  const isTimeReached = timer >= targetTime;

  return (
    <Animated.View
      style={[
        styles.container,
        isActive && styles.containerActive,
        isCompleted && styles.containerCompleted,
        isActive && { transform: [{ scale: breathScale }] },
      ]}
    >
      {/* Background gradient */}
      <LinearGradient
        colors={
          isCompleted
            ? ['rgba(245, 169, 184, 0.15)', 'rgba(245, 169, 184, 0.05)']
            : isActive
            ? ['#1a1a1f', '#141418']
            : ['#141418', '#0f0f12']
        }
        style={StyleSheet.absoluteFill}
      />

      {/* Breathing glow for active stretch */}
      {isActive && !isCompleted && (
        <Animated.View style={[styles.breathingGlow, { opacity: breathOpacity }]}>
          <LinearGradient
            colors={['rgba(245, 169, 184, 0.2)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      {/* Glass highlight */}
      {isActive && <View style={styles.glassHighlight} />}

      {/* Content */}
      <View style={styles.content}>
        {/* Progress indicator / Checkbox */}
        <View style={[
          styles.progressContainer,
          isCompleted && styles.progressCompleted,
        ]}>
          {isCompleted ? (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark" size={18} color={colors.text.inverse} />
            </View>
          ) : isActive ? (
            <View style={styles.timerCircle}>
              {/* Progress ring */}
              <View style={[styles.progressRing, {
                borderColor: isTimeReached ? colors.success : colors.accent.secondary
              }]} />
              <Text style={[
                styles.timerText,
                isTimeReached && styles.timerTextComplete
              ]}>
                {formatTime(timer)}
              </Text>
            </View>
          ) : (
            <Text style={styles.indexNumber}>{index + 1}</Text>
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

          {/* Duration display */}
          {exercise.duration && (
            <View style={styles.durationRow}>
              <Ionicons name="time-outline" size={14} color={colors.accent.secondary} />
              <Text style={styles.durationText}>{exercise.duration}</Text>
            </View>
          )}

          {/* Breathing cue for active exercise */}
          {isActive && !isCompleted && (
            <View style={styles.breathingCue}>
              <Ionicons name="leaf-outline" size={14} color={colors.success} />
              <Text style={styles.breathingText}>
                Breathe deeply... inhale 4s, exhale 4s
              </Text>
            </View>
          )}
        </View>

        {/* Complete button for active exercise */}
        {isActive && !isCompleted && (
          <Pressable
            style={({ pressed }) => [
              styles.completeButton,
              isTimeReached && styles.completeButtonReady,
              pressed && styles.completeButtonPressed,
            ]}
            onPress={onComplete}
          >
            <LinearGradient
              colors={
                isTimeReached
                  ? [colors.success, '#2d8f5e']
                  : [colors.accent.secondary, colors.accent.secondaryDark]
              }
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.completeButtonText}>
              {isTimeReached ? 'Done' : 'Skip'}
            </Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
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
    borderColor: colors.accent.secondary,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  containerCompleted: {
    borderColor: colors.glass.borderPink,
    opacity: 0.7,
  },
  breathingGlow: {
    ...StyleSheet.absoluteFillObject,
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
  progressContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.glass.bg,
    borderWidth: 2,
    borderColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCompleted: {
    backgroundColor: colors.accent.secondary,
    borderColor: colors.accent.secondary,
  },
  checkmark: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.accent.secondary,
  },
  timerText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent.secondary,
  },
  timerTextComplete: {
    color: colors.success,
  },
  indexNumber: {
    fontFamily: 'Poppins',
    fontSize: 16,
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
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  durationText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: colors.accent.secondary,
  },
  breathingCue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.s,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.xs,
  },
  breathingText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: colors.success,
    fontStyle: 'italic',
  },
  completeButton: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.m,
    overflow: 'hidden',
  },
  completeButtonReady: {
    // Handled by gradient colors
  },
  completeButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  completeButtonText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});

export default CooldownExerciseCard;
