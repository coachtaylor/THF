import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';

// Haptics are optional - only use if available
let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  // Haptics not available
}

interface RestTimerProps {
  restSeconds: number;
  previousSet?: {
    reps: number;
    weight: number;
    rpe: number;
  };
  nextSetNumber?: number;
  totalSets?: number;
  onComplete: () => void;
  onSkip?: () => void;
  onAddTime?: (seconds: number) => void;
  onSkipExercise?: () => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function RestTimer({
  restSeconds,
  previousSet,
  nextSetNumber,
  totalSets,
  onComplete,
  onSkip,
  onAddTime,
  onSkipExercise,
}: RestTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(restSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isPaused && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            // Play haptic feedback when timer completes
            if (Haptics) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            return 0;
          }
          // Play subtle haptic every 10 seconds
          if (Haptics && prev % 10 === 0) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPaused, remainingSeconds]);

  // Pulse animation when timer is complete
  useEffect(() => {
    if (remainingSeconds === 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [remainingSeconds, pulseAnim]);

  const handleAddTime = (seconds: number) => {
    setRemainingSeconds(prev => prev + seconds);
    if (onAddTime) {
      onAddTime(seconds);
    }
  };

  const handleSkip = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  const progress = (restSeconds - remainingSeconds) / restSeconds;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#141418', '#0A0A0C']}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(91, 206, 250, 0.1)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.restHeader}>
        <View style={styles.restIconContainer}>
          <Ionicons name="pause-circle" size={28} color={colors.accent.primary} />
        </View>
        <Text style={styles.restTitle}>Rest</Text>
      </View>

      <Animated.View style={[styles.timerContainer, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={[
          styles.timerText,
          remainingSeconds === 0 && styles.timerTextReady
        ]}>
          {formatTime(remainingSeconds)}
        </Text>
      </Animated.View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={[colors.accent.primary, '#4AA8D8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
          />
        </View>
      </View>

      <Text style={styles.recommendedText}>
        Recommended: {formatTime(restSeconds)}
      </Text>

      {/* Previous Set Summary */}
      {previousSet && (
        <View style={styles.previousSetContainer}>
          <View style={styles.previousSetBadge}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.previousSetMessage}>Great set!</Text>
          </View>
          <Text style={styles.previousSetDetails}>
            {previousSet.reps} reps @ {previousSet.weight} lbs • RPE {previousSet.rpe}
          </Text>
        </View>
      )}

      {/* Next Set Info */}
      {nextSetNumber && totalSets && (
        <View style={styles.nextSetContainer}>
          <Ionicons name="arrow-forward-circle" size={20} color={colors.accent.primary} />
          <Text style={styles.nextSetLabel}>Next: Set {nextSetNumber} of {totalSets}</Text>
        </View>
      )}

      {/* Start Next Set Button */}
      <TouchableOpacity
        style={[
          styles.startNextButton,
          remainingSeconds === 0 && styles.startNextButtonReady
        ]}
        onPress={onComplete}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={remainingSeconds === 0 ? [colors.success, '#2ECC71'] : [colors.accent.primary, '#4AA8D8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.startNextButtonGradient}
        >
          <Text style={styles.startNextButtonText}>
            {remainingSeconds === 0 ? 'Ready! Start Next Set' : 'Start Next Set'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={colors.text.inverse} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Time Controls */}
      <View style={styles.timeControls}>
        <TouchableOpacity
          style={styles.addTimeButton}
          onPress={() => handleAddTime(15)}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={18} color={colors.text.primary} />
          <Text style={styles.addTimeButtonText}>15s</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addTimeButton}
          onPress={() => handleAddTime(30)}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={18} color={colors.text.primary} />
          <Text style={styles.addTimeButtonText}>30s</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Ionicons name="play-skip-forward" size={18} color={colors.text.tertiary} />
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Hydration Tip */}
      <View style={styles.tipContainer}>
        <Ionicons name="water" size={18} color={colors.accent.primary} />
        <Text style={styles.tipText}>Take deep breaths and stay hydrated</Text>
      </View>

      {/* Skip Exercise Option */}
      {onSkipExercise && (
        <TouchableOpacity
          style={styles.skipExerciseButton}
          onPress={onSkipExercise}
          activeOpacity={0.7}
        >
          <Text style={styles.skipExerciseButtonText}>Skip Exercise</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius['2xl'],
    padding: spacing.l,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  restHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  restIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restTitle: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  timerText: {
    fontFamily: 'Poppins',
    fontSize: 72,
    fontWeight: '800',
    color: colors.accent.primary,
    letterSpacing: -2,
    textShadowColor: 'rgba(91, 206, 250, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  timerTextReady: {
    color: colors.success,
    textShadowColor: 'rgba(46, 204, 113, 0.3)',
  },
  progressBarContainer: {
    marginBottom: spacing.s,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.glass.bg,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  recommendedText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  previousSetContainer: {
    alignItems: 'center',
    marginBottom: spacing.m,
    paddingVertical: spacing.m,
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  previousSetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  previousSetMessage: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  previousSetDetails: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.secondary,
  },
  nextSetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.m,
  },
  nextSetLabel: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  startNextButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.m,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  startNextButtonReady: {
    ...Platform.select({
      ios: {
        shadowColor: colors.success,
      },
    }),
  },
  startNextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    padding: spacing.m,
    paddingVertical: 16,
  },
  startNextButtonText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.inverse,
    letterSpacing: 0.3,
  },
  timeControls: {
    flexDirection: 'row',
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  addTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.l,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  addTimeButtonText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  skipButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.l,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  skipButtonText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.m,
  },
  tipText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.tertiary,
  },
  skipExerciseButton: {
    padding: spacing.m,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  skipExerciseButtonText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
});
