import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafetyCheckpoint } from '../services/rulesEngine/rules/types';
import { palette, spacing, typography } from '../theme';

/**
 * Extended SafetyCheckpoint interface for modal display
 */
export interface SafetyCheckpointModalData {
  type: 'binder_break' | 'scar_care' | 'sensitivity_check' | 'post_workout_reminder';
  trigger: 'every_90_minutes' | 'before_cardio' | 'cool_down' | 'workout_completion';
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  // Extended fields for modal
  title?: string;
  icon?: string;
  benefits?: string[];
  break_duration_seconds?: number;
  reminder?: string;
}

interface Props {
  visible: boolean;
  checkpoint: SafetyCheckpointModalData | null;
  onDismiss: () => void;
  onStartBreak?: () => void;
}

export default function SafetyCheckpointModal({ 
  visible, 
  checkpoint, 
  onDismiss,
  onStartBreak 
}: Props) {
  const [breakTimer, setBreakTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  useEffect(() => {
    if (!isTimerRunning || breakTimer <= 0) return;
    
    const interval = setInterval(() => {
      setBreakTimer(prev => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          // Auto-dismiss when break complete
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isTimerRunning, breakTimer, onDismiss]);
  
  // Reset timer when modal closes
  useEffect(() => {
    if (!visible) {
      setIsTimerRunning(false);
      setBreakTimer(0);
    }
  }, [visible]);
  
  if (!checkpoint) return null;
  
  const handleStartBreak = () => {
    // Default 10 minute break (600 seconds)
    const breakDuration = checkpoint.break_duration_seconds || 600;
    setBreakTimer(breakDuration);
    setIsTimerRunning(true);
    onStartBreak?.();
  };
  
  const handleDismiss = () => {
    setIsTimerRunning(false);
    setBreakTimer(0);
    onDismiss();
  };

  const handleStopTimer = () => {
    setIsTimerRunning(false);
    setBreakTimer(0);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get checkpoint title based on type if not provided
  const getCheckpointTitle = () => {
    if (checkpoint.title) return checkpoint.title;
    
    switch (checkpoint.type) {
      case 'binder_break':
        return 'Time for a Binder Break';
      case 'scar_care':
        return 'Scar Care Reminder';
      case 'sensitivity_check':
        return 'Sensitivity Check';
      case 'post_workout_reminder':
        return 'Post-Workout Reminder';
      default:
        return 'Safety Checkpoint';
    }
  };

  // Get checkpoint icon based on type if not provided
  const getCheckpointIcon = () => {
    if (checkpoint.icon) return checkpoint.icon;
    
    switch (checkpoint.type) {
      case 'binder_break':
        return '🫁';
      case 'scar_care':
        return '🩹';
      case 'sensitivity_check':
        return '⚠️';
      case 'post_workout_reminder':
        return '💪';
      default:
        return '⚠️';
    }
  };

  // Get default benefits if not provided
  const getDefaultBenefits = (): string[] => {
    if (checkpoint.benefits && checkpoint.benefits.length > 0) {
      return checkpoint.benefits;
    }
    
    switch (checkpoint.type) {
      case 'binder_break':
        return [
          'Prevent rib damage',
          'Improve breathing efficiency',
          'Enhance recovery'
        ];
      case 'scar_care':
        return [
          'Promote proper healing',
          'Reduce risk of complications',
          'Maintain flexibility'
        ];
      case 'sensitivity_check':
        return [
          'Identify potential issues early',
          'Prevent injury',
          'Ensure safe progression'
        ];
      default:
        return [];
    }
  };

  // Get default reminder if not provided
  const getDefaultReminder = () => {
    if (checkpoint.reminder) return checkpoint.reminder;
    
    switch (checkpoint.type) {
      case 'binder_break':
        return 'Remember: Take breaks every 45-60 minutes when binding during exercise.';
      case 'scar_care':
        return 'Follow your surgeon\'s post-op care instructions carefully.';
      case 'sensitivity_check':
        return 'Listen to your body and stop if you experience any pain or discomfort.';
      default:
        return 'Your safety is our priority. Take breaks as needed.';
    }
  };
  
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="warning" size={32} color={palette.warning} />
            <Text style={styles.title}>Safety Checkpoint</Text>
          </View>
          
          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Paused indicator */}
            <View style={styles.pausedBanner}>
              <Ionicons name="pause-circle" size={20} color={palette.tealPrimary} />
              <Text style={styles.pausedText}>Workout Paused</Text>
            </View>
            
            {/* Checkpoint message card */}
            <View style={styles.messageCard}>
              <Text style={styles.messageIcon}>{getCheckpointIcon()}</Text>
              <Text style={styles.messageTitle}>{getCheckpointTitle()}</Text>
              
              <Text style={styles.messageText}>{checkpoint.message}</Text>
              
              {/* Benefits */}
              {getDefaultBenefits().length > 0 && (
                <View style={styles.benefits}>
                  <Text style={styles.benefitsTitle}>This helps:</Text>
                  {getDefaultBenefits().map((benefit, index) => (
                    <Text key={index} style={styles.benefitText}>
                      • {benefit}
                    </Text>
                  ))}
                </View>
              )}
            </View>
            
            {/* Timer */}
            {isTimerRunning ? (
              <View style={styles.timerContainer}>
                <Text style={styles.timerLabel}>⏱️ Break Timer</Text>
                <Text style={styles.timerValue}>{formatTime(breakTimer)}</Text>
                
                <TouchableOpacity 
                  style={styles.stopTimerButton}
                  onPress={handleStopTimer}
                >
                  <Text style={styles.stopTimerButtonText}>Stop Timer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.timerInfo}>
                <Text style={styles.timerInfoText}>
                  ⏱️ Break Timer: {formatTime(checkpoint.break_duration_seconds || 600)}
                </Text>
              </View>
            )}
            
            {/* Action Buttons */}
            {!isTimerRunning && (
              <>
                <TouchableOpacity 
                  style={styles.startBreakButton}
                  onPress={handleStartBreak}
                >
                  <Text style={styles.startBreakButtonText}>Start Break Timer</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.dismissButton}
                  onPress={handleDismiss}
                >
                  <Text style={styles.dismissButtonText}>I'll take a break later</Text>
                </TouchableOpacity>
              </>
            )}
            
            {/* Reminder */}
            <View style={styles.reminder}>
              <Ionicons name="information-circle" size={16} color={palette.tealPrimary} />
              <Text style={styles.reminderText}>{getDefaultReminder()}</Text>
            </View>
          </ScrollView>
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
    backgroundColor: palette.deepBlack,
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: palette.border,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.l,
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  title: {
    ...typography.h2,
    color: palette.white,
    marginTop: spacing.s,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.l,
  },
  pausedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    backgroundColor: palette.tealPrimary + '20',
    padding: spacing.m,
    borderRadius: 8,
    marginBottom: spacing.l,
  },
  pausedText: {
    ...typography.bodyLarge,
    color: palette.tealPrimary,
    fontWeight: '600',
  },
  messageCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.l,
    marginBottom: spacing.l,
    alignItems: 'center',
  },
  messageIcon: {
    fontSize: 48,
    marginBottom: spacing.m,
  },
  messageTitle: {
    ...typography.h3,
    color: palette.white,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  messageText: {
    ...typography.body,
    color: palette.lightGray,
    textAlign: 'center',
    marginBottom: spacing.m,
    lineHeight: 22,
  },
  benefits: {
    width: '100%',
    marginTop: spacing.m,
    alignItems: 'flex-start',
  },
  benefitsTitle: {
    ...typography.bodyLarge,
    color: palette.white,
    fontWeight: '600',
    marginBottom: spacing.s,
  },
  benefitText: {
    ...typography.body,
    color: palette.lightGray,
    marginBottom: spacing.xs,
    lineHeight: 22,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  timerLabel: {
    ...typography.body,
    color: palette.white,
    marginBottom: spacing.s,
  },
  timerValue: {
    ...typography.h1,
    color: palette.tealPrimary,
    fontSize: 56,
    fontWeight: '700',
    marginBottom: spacing.m,
  },
  stopTimerButton: {
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.l,
  },
  stopTimerButtonText: {
    ...typography.body,
    color: palette.error,
    fontWeight: '600',
  },
  timerInfo: {
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  timerInfoText: {
    ...typography.bodyLarge,
    color: palette.white,
  },
  startBreakButton: {
    backgroundColor: palette.tealPrimary,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  startBreakButtonText: {
    ...typography.button,
    color: palette.deepBlack,
    fontWeight: '700',
  },
  dismissButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: palette.border,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  dismissButtonText: {
    ...typography.button,
    color: palette.white,
  },
  reminder: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s,
    backgroundColor: palette.tealPrimary + '15',
    padding: spacing.m,
    borderRadius: 8,
  },
  reminderText: {
    ...typography.bodySmall,
    color: palette.tealPrimary,
    flex: 1,
    lineHeight: 18,
  },
});

