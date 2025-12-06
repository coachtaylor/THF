import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { spacing, colors } from '../../theme';

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
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for warning icon
    if (visible && !breakTimerActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [visible, breakTimerActive]);

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
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onTakeBreakLater}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Glass background */}
          <LinearGradient
            colors={['rgba(35, 30, 25, 0.98)', 'rgba(25, 22, 18, 0.99)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Warning amber glow */}
          <LinearGradient
            colors={['rgba(251, 191, 36, 0.2)', 'rgba(251, 191, 36, 0.08)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.6 }}
            style={styles.warningGlow}
          />

          {/* Glass highlight */}
          <View style={styles.glassHighlight} />

          {/* Header */}
          <View style={styles.header}>
            <Animated.View
              style={[
                styles.iconContainer,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <LinearGradient
                colors={['rgba(251, 191, 36, 0.3)', 'rgba(251, 191, 36, 0.1)']}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="warning" size={32} color={colors.warning} />
            </Animated.View>
            <Text style={styles.title}>Safety Checkpoint</Text>
          </View>

          <Text style={styles.message}>{message}</Text>

          {!breakTimerActive ? (
            <View style={styles.buttonContainer}>
              {/* Start Break Button - Warning styled */}
              <Pressable
                style={({ pressed }) => [
                  styles.startBreakButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleStartBreak}
              >
                <LinearGradient
                  colors={[colors.warning, '#E5A400']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.buttonGlassOverlay} />
                <Text style={styles.startBreakButtonText}>
                  Start {breakDurationMinutes}-Minute Break
                </Text>
              </Pressable>

              {/* Later Button - Glass styled */}
              <Pressable
                style={({ pressed }) => [
                  styles.laterButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={onTakeBreakLater}
              >
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.laterButtonText}>Take Break Later</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.timerContainer}>
              <Text style={styles.timerLabel}>Break Timer</Text>

              {/* Timer display with glass effect */}
              <View style={styles.timerDisplay}>
                <LinearGradient
                  colors={['rgba(20, 20, 24, 0.9)', 'rgba(15, 15, 18, 0.95)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.timerGlassHighlight} />
                <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
              </View>

              {remainingSeconds === 0 && (
                <View style={styles.completeContainer}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.accent.primary} />
                  <Text style={styles.completeText}>Break complete! You can continue.</Text>
                </View>
              )}

              <View style={styles.timerButtons}>
                {remainingSeconds > 0 && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.pauseButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => {
                      setBreakTimerActive(false);
                      if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                      }
                    }}
                  >
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']}
                      style={StyleSheet.absoluteFill}
                    />
                    <Ionicons name="pause" size={18} color={colors.text.primary} />
                    <Text style={styles.pauseButtonText}>Pause</Text>
                  </Pressable>
                )}
                <Pressable
                  style={({ pressed }) => [
                    styles.continueButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => {
                    handleBreakComplete();
                    onTakeBreakLater();
                  }}
                >
                  <LinearGradient
                    colors={[colors.accent.primary, colors.accent.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.buttonGlassOverlay} />
                  <Ionicons name="play" size={18} color={colors.text.inverse} />
                  <Text style={styles.continueButtonText}>
                    {remainingSeconds === 0 ? 'Continue' : 'Skip'}
                  </Text>
                </Pressable>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  modal: {
    borderRadius: 24,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 40,
      },
      android: { elevation: 24 },
    }),
  },
  warningGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  buttonContainer: {
    gap: spacing.m,
  },
  startBreakButton: {
    borderRadius: 14,
    padding: spacing.l,
    alignItems: 'center',
    overflow: 'hidden',
  },
  buttonGlassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  startBreakButtonText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  laterButton: {
    borderRadius: 14,
    padding: spacing.l,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  laterButtonText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerLabel: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: spacing.m,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  timerDisplay: {
    borderRadius: 20,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing['2xl'],
    marginBottom: spacing.l,
    minWidth: 180,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  timerGlassHighlight: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  timerText: {
    fontFamily: 'Poppins',
    fontSize: 48,
    fontWeight: '300',
    color: colors.accent.primary,
    letterSpacing: 2,
  },
  completeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.m,
  },
  completeText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.accent.primary,
  },
  timerButtons: {
    flexDirection: 'row',
    gap: spacing.m,
    width: '100%',
  },
  pauseButton: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 14,
    padding: spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pauseButtonText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  continueButton: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 14,
    padding: spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  continueButtonText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});
