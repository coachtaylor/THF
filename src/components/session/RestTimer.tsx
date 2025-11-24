import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, typography } from '../../theme';
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
      <View style={styles.restHeader}>
        <Text style={styles.restTitle}>Rest</Text>
      </View>

      <View style={styles.timerDisplay}>
        <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <Text style={styles.recommendedText}>
        Recommended: {formatTime(restSeconds)} ({restSeconds} seconds)
      </Text>

      {/* Previous Set Summary */}
      {previousSet && (
        <View style={styles.previousSetContainer}>
          <Text style={styles.previousSetMessage}>Great set! 💪</Text>
          <Text style={styles.previousSetDetails}>
            {previousSet.reps} reps @ {previousSet.weight} lbs • RPE {previousSet.rpe}
          </Text>
        </View>
      )}

      {/* Next Set Info */}
      {nextSetNumber && totalSets && (
        <View style={styles.nextSetContainer}>
          <Text style={styles.nextSetLabel}>💡 Next: Set {nextSetNumber} of {totalSets}</Text>
          <Text style={styles.nextSetTip}>Take deep breaths and stay hydrated</Text>
        </View>
      )}

      {/* Start Next Set Button */}
      <TouchableOpacity 
        style={[
          styles.startNextButton,
          remainingSeconds === 0 && styles.startNextButtonReady
        ]} 
        onPress={onComplete}
      >
        <Text style={styles.startNextButtonText}>
          {remainingSeconds === 0 ? 'Ready? Start Next Set →' : 'Start Next Set →'}
        </Text>
      </TouchableOpacity>

      {/* Time Controls */}
      <View style={styles.timeControls}>
        <TouchableOpacity 
          style={styles.addTimeButton}
          onPress={() => handleAddTime(15)}
        >
          <Text style={styles.addTimeButtonText}>Add 15s</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.addTimeButton}
          onPress={() => handleAddTime(30)}
        >
          <Text style={styles.addTimeButtonText}>Add 30s</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipButtonText}>Skip Rest</Text>
        </TouchableOpacity>
      </View>

      {/* Previous Sets (if available) */}
      {previousSet && (
        <View style={styles.allSetsContainer}>
          <Text style={styles.allSetsLabel}>Previous Sets</Text>
          <Text style={styles.allSetsText}>
            Set {nextSetNumber ? nextSetNumber - 1 : 1}: ✓ {previousSet.reps} reps @ {previousSet.weight} lbs • RPE {previousSet.rpe}
          </Text>
        </View>
      )}

      {/* Skip Exercise Option */}
      {onSkipExercise && (
        <TouchableOpacity 
          style={styles.skipExerciseButton}
          onPress={onSkipExercise}
        >
          <Text style={styles.skipExerciseButtonText}>Skip Exercise</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.deepBlack,
    padding: spacing.l,
  },
  restHeader: {
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  restTitle: {
    ...typography.h2,
    color: palette.white,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  timerText: {
    ...typography.h1,
    color: palette.tealPrimary,
    fontSize: 64,
    fontWeight: '700',
  },
  progressBarContainer: {
    marginBottom: spacing.s,
  },
  progressBar: {
    height: 8,
    backgroundColor: palette.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: palette.tealPrimary,
    borderRadius: 4,
  },
  recommendedText: {
    ...typography.body,
    color: palette.midGray,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  previousSetContainer: {
    alignItems: 'center',
    marginBottom: spacing.m,
    paddingVertical: spacing.m,
  },
  previousSetMessage: {
    ...typography.bodyLarge,
    color: palette.white,
    marginBottom: spacing.xs,
  },
  previousSetDetails: {
    ...typography.body,
    color: palette.lightGray,
  },
  nextSetContainer: {
    marginBottom: spacing.m,
    paddingVertical: spacing.m,
  },
  nextSetLabel: {
    ...typography.body,
    color: palette.lightGray,
    marginBottom: spacing.xs,
  },
  nextSetTip: {
    ...typography.bodySmall,
    color: palette.midGray,
  },
  startNextButton: {
    backgroundColor: palette.tealPrimary,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  startNextButtonReady: {
    backgroundColor: palette.success,
  },
  startNextButtonText: {
    ...typography.button,
    color: palette.deepBlack,
    fontWeight: '700',
    fontSize: 18,
  },
  timeControls: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.m,
  },
  addTimeButton: {
    flex: 1,
    backgroundColor: palette.darkCard,
    borderRadius: 8,
    padding: spacing.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  addTimeButtonText: {
    ...typography.body,
    color: palette.white,
  },
  skipButton: {
    flex: 1,
    backgroundColor: palette.darkCard,
    borderRadius: 8,
    padding: spacing.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  skipButtonText: {
    ...typography.body,
    color: palette.midGray,
  },
  allSetsContainer: {
    marginTop: spacing.m,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  allSetsLabel: {
    ...typography.body,
    color: palette.lightGray,
    marginBottom: spacing.xs,
  },
  allSetsText: {
    ...typography.bodySmall,
    color: palette.midGray,
  },
  skipExerciseButton: {
    marginTop: spacing.m,
    padding: spacing.m,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  skipExerciseButtonText: {
    ...typography.body,
    color: palette.midGray,
  },
});
