import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, typography } from '../../theme';

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

  // Timer for warm-up duration
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleExercise = (index: number) => {
    setCompletedExercises(prev => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };

  const allCompleted = completedExercises.every(completed => completed);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="close" size={24} color={palette.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Warm-Up</Text>
        <View style={styles.headerRight}>
          <Ionicons name="time-outline" size={20} color={palette.midGray} />
          <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={20} color={palette.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.instructionText}>
          Get your body ready for the workout ahead!
        </Text>

        {warmUpExercises.map((exercise, index) => (
          <TouchableOpacity
            key={index}
            style={styles.exerciseCard}
            onPress={() => toggleExercise(index)}
            activeOpacity={0.7}
          >
            <View style={styles.exerciseCheckboxContainer}>
              <View style={[
                styles.checkbox,
                completedExercises[index] && styles.checkboxChecked
              ]}>
                {completedExercises[index] && (
                  <Ionicons name="checkmark" size={20} color={palette.deepBlack} />
                )}
              </View>
            </View>
            <View style={styles.exerciseContent}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDuration}>
                  {exercise.duration || exercise.reps || ''}
                </Text>
              </View>
              <Text style={styles.exerciseDescription}>{exercise.description}</Text>
              {/* Placeholder for thumbnail/GIF animation */}
              <View style={styles.thumbnailPlaceholder}>
                <Text style={styles.thumbnailText}>[Thumbnail/GIF animation]</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <Text style={styles.hintText}>
          ✓ Check off each exercise as you complete it
        </Text>
      </ScrollView>

      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + spacing.m }]}>
        <TouchableOpacity 
          style={[styles.completeButton, !allCompleted && styles.completeButtonDisabled]} 
          onPress={onComplete}
          activeOpacity={0.8}
          disabled={!allCompleted}
        >
          <Text style={styles.completeButtonText}>Complete Warm-Up →</Text>
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
    backgroundColor: palette.deepBlack,
  },
  header: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: palette.white,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timerText: {
    ...typography.body,
    color: palette.midGray,
    minWidth: 50,
    textAlign: 'right',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.l,
    paddingBottom: spacing.xl,
  },
  instructionText: {
    ...typography.body,
    color: palette.lightGray,
    marginBottom: spacing.l,
    textAlign: 'center',
  },
  exerciseCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.m,
    flexDirection: 'row',
  },
  exerciseCheckboxContainer: {
    marginRight: spacing.m,
    justifyContent: 'flex-start',
    paddingTop: spacing.xxs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: palette.border,
    backgroundColor: palette.darkerCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: palette.tealPrimary,
    borderColor: palette.tealPrimary,
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
    ...typography.bodyLarge,
    color: palette.white,
    fontWeight: '600',
    flex: 1,
  },
  exerciseDuration: {
    ...typography.body,
    color: palette.midGray,
  },
  exerciseDescription: {
    ...typography.bodySmall,
    color: palette.lightGray,
    marginBottom: spacing.s,
    lineHeight: 20,
  },
  thumbnailPlaceholder: {
    height: 100,
    backgroundColor: palette.darkerCard,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  thumbnailText: {
    ...typography.bodySmall,
    color: palette.midGray,
    fontStyle: 'italic',
  },
  hintText: {
    ...typography.bodySmall,
    color: palette.midGray,
    textAlign: 'center',
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  buttonContainer: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.deepBlack,
    gap: spacing.m,
  },
  completeButton: {
    backgroundColor: palette.tealPrimary,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    backgroundColor: palette.darkCard,
    opacity: 0.5,
  },
  completeButtonText: {
    ...typography.button,
    color: palette.deepBlack,
    fontWeight: '700',
    fontSize: 18,
  },
  skipButton: {
    padding: spacing.m,
    alignItems: 'center',
  },
  skipButtonText: {
    ...typography.body,
    color: palette.midGray,
  },
});

