import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, typography } from '../../theme';

interface SafetyCheckpointModalProps {
  visible: boolean;
  message: string;
  breakDurationMinutes?: number;
  onStartBreak: () => void;
  onTakeBreakLater: () => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

export default function SafetyCheckpointModal({
  visible,
  message,
  breakDurationMinutes = 10,
  onStartBreak,
  onTakeBreakLater,
}: SafetyCheckpointModalProps) {
  const [breakTimerActive, setBreakTimerActive] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(breakDurationMinutes * 60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (breakTimerActive && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
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
  }, [breakTimerActive, remainingSeconds]);

  useEffect(() => {
    if (!visible) {
      setBreakTimerActive(false);
      setRemainingSeconds(breakDurationMinutes * 60);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [visible, breakDurationMinutes]);

  const handleStartBreak = () => {
    setBreakTimerActive(true);
    onStartBreak();
  };

  const handleBreakComplete = () => {
    setBreakTimerActive(false);
    setRemainingSeconds(breakDurationMinutes * 60);
    // Break timer completed, user can continue
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onTakeBreakLater}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Ionicons name="warning" size={32} color={palette.warning} />
            <Text style={styles.title}>⚠️ Safety Checkpoint</Text>
          </View>

          <Text style={styles.message}>{message}</Text>

          {!breakTimerActive ? (
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.startBreakButton} onPress={handleStartBreak}>
                <Text style={styles.startBreakButtonText}>
                  Start {breakDurationMinutes}-Minute Break Timer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.laterButton} onPress={onTakeBreakLater}>
                <Text style={styles.laterButtonText}>Take Break Later</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.timerContainer}>
              <Text style={styles.timerLabel}>Break Timer</Text>
              <View style={styles.timerDisplay}>
                <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
              </View>
              {remainingSeconds === 0 && (
                <Text style={styles.completeText}>Break complete! You can continue your workout.</Text>
              )}
              <View style={styles.timerButtons}>
                {remainingSeconds > 0 && (
                  <TouchableOpacity
                    style={styles.pauseButton}
                    onPress={() => {
                      setBreakTimerActive(false);
                      if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                      }
                    }}
                  >
                    <Text style={styles.pauseButtonText}>Pause</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => {
                    handleBreakComplete();
                    onTakeBreakLater();
                  }}
                >
                  <Text style={styles.continueButtonText}>
                    {remainingSeconds === 0 ? 'Continue Workout' : 'Skip & Continue'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  modal: {
    backgroundColor: palette.darkCard,
    borderRadius: 16,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  title: {
    ...typography.h2,
    color: palette.white,
    marginTop: spacing.s,
    textAlign: 'center',
  },
  message: {
    ...typography.bodyLarge,
    color: palette.lightGray,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    gap: spacing.m,
  },
  startBreakButton: {
    backgroundColor: palette.warning,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
  },
  startBreakButtonText: {
    ...typography.button,
    color: palette.deepBlack,
    fontWeight: '700',
  },
  laterButton: {
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  laterButtonText: {
    ...typography.body,
    color: palette.white,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerLabel: {
    ...typography.bodyLarge,
    color: palette.white,
    marginBottom: spacing.m,
  },
  timerDisplay: {
    backgroundColor: palette.darkerCard,
    borderRadius: 16,
    padding: spacing.xl,
    marginBottom: spacing.m,
    minWidth: 150,
    alignItems: 'center',
  },
  timerText: {
    ...typography.h1,
    color: palette.tealPrimary,
    fontSize: 48,
    fontWeight: '700',
  },
  completeText: {
    ...typography.body,
    color: palette.tealPrimary,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  timerButtons: {
    flexDirection: 'row',
    gap: spacing.m,
    width: '100%',
  },
  pauseButton: {
    flex: 1,
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  pauseButtonText: {
    ...typography.button,
    color: palette.white,
    fontWeight: '600',
  },
  continueButton: {
    flex: 1,
    backgroundColor: palette.tealPrimary,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
  },
  continueButtonText: {
    ...typography.button,
    color: palette.deepBlack,
    fontWeight: '700',
  },
});

