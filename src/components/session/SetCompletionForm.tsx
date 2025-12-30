import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, typography } from '../../theme';
import { Exercise } from '../../types';
import { FlaggedExercise } from '../../types/feedback';
import ExerciseFlagButton from '../feedback/ExerciseFlagButton';

interface SetCompletionFormProps {
  setNumber: number;
  totalSets: number;
  prescribedReps: number;
  exercise: Exercise;
  previousSet?: {
    reps: number;
    weight: number;
    rpe: number;
  };
  onComplete: (reps: number, weight: number, rpe: number) => void;
  onViewForm?: () => void;
  onViewDetails?: () => void;
  onStopIfPain?: () => void;
  onSkipExercise?: () => void;
  onFlagExercise?: (flag: FlaggedExercise) => void;
  isExerciseFlagged?: boolean;
}

export default function SetCompletionForm({
  setNumber,
  totalSets,
  prescribedReps,
  exercise,
  previousSet,
  onComplete,
  onViewForm,
  onViewDetails,
  onStopIfPain,
  onSkipExercise,
  onFlagExercise,
  isExerciseFlagged,
}: SetCompletionFormProps) {
  // Pre-fill with previous set values if available
  const [reps, setReps] = useState<number>(previousSet?.reps || prescribedReps);
  const [weight, setWeight] = useState<number>(previousSet?.weight || 0);
  const [rpe, setRPE] = useState<number>(previousSet?.rpe || 5);

  // Generate rep range (prescribedReps ± 4)
  const repRange = Array.from(
    { length: 9 },
    (_, i) => prescribedReps - 4 + i
  ).filter(r => r > 0);

  const handleComplete = () => {
    onComplete(reps, weight, rpe);
  };

  const adjustWeight = (delta: number) => {
    setWeight(prev => Math.max(0, prev + delta));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Exercise Header */}
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{exercise.name}</Text>
          <View style={styles.exerciseTags}>
            {exercise.target_muscles && (
              <Text style={styles.tag}>{exercise.target_muscles}</Text>
            )}
            {exercise.binder_aware && (
              <Text style={styles.safetyTag}>✓ binding-safe</Text>
            )}
          </View>
        </View>
        {onViewForm && (
          <TouchableOpacity style={styles.viewFormButton} onPress={onViewForm}>
            <Ionicons name="videocam-outline" size={20} color={palette.tealPrimary} />
            <Text style={styles.viewFormText}>View Form</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Set Counter */}
      <Text style={styles.setCounter}>Set {setNumber} of {totalSets}</Text>

      {/* Exercise Thumbnail/Video Placeholder */}
      <View style={styles.thumbnailContainer}>
        <View style={styles.thumbnailPlaceholder}>
          <Text style={styles.thumbnailText}>[Exercise thumbnail/animation]</Text>
        </View>
      </View>

      {/* Coaching Cues */}
      {exercise.cue_primary && (
        <View style={styles.cuesContainer}>
          <Text style={styles.cuesLabel}>💡</Text>
          <Text style={styles.cuesText}>{exercise.cue_primary}</Text>
        </View>
      )}

      {/* Reps Selector */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Reps Completed</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.repsContainer}
        >
          {repRange.map((repValue) => (
            <TouchableOpacity
              key={repValue}
              style={[
                styles.repButton,
                reps === repValue && styles.repButtonActive,
              ]}
              onPress={() => setReps(repValue)}
            >
              <Text
                style={[
                  styles.repButtonText,
                  reps === repValue && styles.repButtonTextActive,
                ]}
              >
                {repValue}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.repIndicator}>
          <View style={[styles.repIndicatorDot, { left: `${((reps - repRange[0]) / (repRange.length - 1)) * 100}%` }]} />
        </View>
      </View>

      {/* Weight Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Weight (lbs)</Text>
        <View style={styles.weightContainer}>
          <View style={styles.weightDisplay}>
            <Text style={styles.weightText}>{weight || 0}</Text>
          </View>
          <View style={styles.weightControls}>
            <TouchableOpacity
              style={styles.weightButton}
              onPress={() => adjustWeight(-5)}
            >
              <Text style={styles.weightButtonText}>-5</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.weightButton}
              onPress={() => adjustWeight(5)}
            >
              <Text style={styles.weightButtonText}>+5</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* RPE Slider */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>How hard was this set? (RPE 1-10)</Text>
        <View style={styles.rpeContainer}>
          <View style={styles.rpeSlider}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.rpeTick,
                  rpe >= value && styles.rpeTickActive,
                ]}
                onPress={() => setRPE(value)}
              >
                <View style={[
                  styles.rpeTickDot,
                  rpe === value && styles.rpeTickDotActive,
                ]} />
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.rpeLabels}>
            <Text style={styles.rpeLabel}>Easy</Text>
            <Text style={styles.rpeLabel}>Moderate</Text>
            <Text style={styles.rpeLabel}>Max Effort</Text>
          </View>
          <Text style={styles.rpeValue}>RPE: {rpe}</Text>
        </View>
      </View>

      {/* Complete Set Button */}
      <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
        <Text style={styles.completeButtonText}>Complete Set ✓</Text>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Skip Set</Text>
        </TouchableOpacity>
        {onViewDetails && (
          <TouchableOpacity style={styles.actionButton} onPress={onViewDetails}>
            <Text style={styles.actionButtonText}>View Exercise Details</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stop if Pain & Flag Exercise */}
      <View style={styles.safetyActions}>
        {onStopIfPain && (
          <TouchableOpacity style={styles.painButton} onPress={onStopIfPain}>
            <Ionicons name="warning-outline" size={20} color={palette.error} />
            <Text style={styles.painButtonText}>🚨 Stop if pain</Text>
          </TouchableOpacity>
        )}
        {onFlagExercise && (
          <ExerciseFlagButton
            exerciseId={exercise.id}
            exerciseName={exercise.name}
            setNumber={setNumber}
            onFlag={onFlagExercise}
            isFlagged={isExerciseFlagged}
          />
        )}
      </View>

      {/* Previous Sets Display (if not first set) */}
      {setNumber > 1 && previousSet && (
        <View style={styles.previousSetsContainer}>
          <Text style={styles.previousSetsLabel}>Previous Sets</Text>
          <Text style={styles.previousSetText}>
            Set {setNumber - 1}: ✓ {previousSet.reps} reps @ {previousSet.weight} lbs • RPE {previousSet.rpe}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.deepBlack,
  },
  content: {
    padding: spacing.l,
    paddingBottom: spacing.xxl,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.m,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    ...typography.h3,
    color: palette.white,
    marginBottom: spacing.xs,
  },
  exerciseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    ...typography.bodySmall,
    color: palette.midGray,
  },
  safetyTag: {
    ...typography.bodySmall,
    color: palette.tealPrimary,
  },
  viewFormButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  viewFormText: {
    ...typography.bodySmall,
    color: palette.tealPrimary,
  },
  setCounter: {
    ...typography.h3,
    color: palette.white,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  thumbnailContainer: {
    marginBottom: spacing.m,
  },
  thumbnailPlaceholder: {
    height: 200,
    backgroundColor: palette.darkerCard,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailText: {
    ...typography.bodySmall,
    color: palette.midGray,
    fontStyle: 'italic',
  },
  cuesContainer: {
    flexDirection: 'row',
    backgroundColor: palette.darkCard,
    borderRadius: 8,
    padding: spacing.m,
    marginBottom: spacing.m,
    gap: spacing.xs,
  },
  cuesLabel: {
    fontSize: 20,
  },
  cuesText: {
    ...typography.body,
    color: palette.lightGray,
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing.l,
  },
  label: {
    ...typography.body,
    color: palette.lightGray,
    marginBottom: spacing.s,
  },
  repsContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.s,
  },
  repButton: {
    minWidth: 50,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    backgroundColor: palette.darkerCard,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  repButtonActive: {
    backgroundColor: palette.tealPrimary,
    borderColor: palette.tealPrimary,
  },
  repButtonText: {
    ...typography.bodyLarge,
    color: palette.midGray,
    fontWeight: '600',
  },
  repButtonTextActive: {
    color: palette.deepBlack,
  },
  repIndicator: {
    height: 2,
    backgroundColor: palette.border,
    marginTop: spacing.xs,
    position: 'relative',
  },
  repIndicatorDot: {
    position: 'absolute',
    top: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.tealPrimary,
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  weightDisplay: {
    flex: 1,
    backgroundColor: palette.darkerCard,
    borderRadius: 8,
    padding: spacing.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  weightText: {
    ...typography.h2,
    color: palette.white,
  },
  weightControls: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  weightButton: {
    width: 50,
    height: 50,
    backgroundColor: palette.darkCard,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  weightButtonText: {
    ...typography.bodyLarge,
    color: palette.white,
    fontWeight: '600',
  },
  rpeContainer: {
    marginTop: spacing.s,
  },
  rpeSlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  rpeTick: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  rpeTickActive: {
    // Visual feedback for active ticks
  },
  rpeTickDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: palette.border,
  },
  rpeTickDotActive: {
    backgroundColor: palette.tealPrimary,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  rpeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.s,
  },
  rpeLabel: {
    ...typography.bodySmall,
    color: palette.midGray,
  },
  rpeValue: {
    ...typography.bodyLarge,
    color: palette.tealPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: palette.tealPrimary,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
    marginTop: spacing.m,
    marginBottom: spacing.m,
  },
  completeButtonText: {
    ...typography.button,
    color: palette.deepBlack,
    fontWeight: '700',
    fontSize: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.m,
  },
  actionButton: {
    flex: 1,
    padding: spacing.m,
    alignItems: 'center',
  },
  actionButtonText: {
    ...typography.body,
    color: palette.midGray,
  },
  safetyActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.l,
    marginTop: spacing.m,
    paddingVertical: spacing.s,
  },
  painButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.m,
  },
  painButtonText: {
    ...typography.body,
    color: palette.error,
  },
  previousSetsContainer: {
    marginTop: spacing.l,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  previousSetsLabel: {
    ...typography.body,
    color: palette.lightGray,
    marginBottom: spacing.xs,
  },
  previousSetText: {
    ...typography.bodySmall,
    color: palette.midGray,
  },
  skipExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.m,
    marginTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  skipExerciseButtonText: {
    ...typography.body,
    color: palette.midGray,
  },
});
