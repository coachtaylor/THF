import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';
import { palette, spacing, typography } from '../../theme';
import { Day, Workout, Exercise } from '../../types/plan';
import { getExerciseLibrary } from '../../data/exercises';
import { formatEquipmentLabel } from '../../utils/equipment';
import SafetyTag from '../ui/SafetyTag';
import Card from '../ui/Card';
import TimeVariantSelector from './TimeVariantSelector';

interface DayCardProps {
  day: Day;
  workout: Workout | null;
  onStartWorkout: () => void;
  onPreview: () => void;
  onExercisePress?: (exerciseId: string) => void;
  selectedVariant?: 30 | 45 | 60 | 90;
  onSelectVariant?: (duration: 30 | 45 | 60 | 90) => void;
}

export default function DayCard({ day, workout, onStartWorkout, onPreview, onExercisePress, selectedVariant, onSelectVariant }: DayCardProps) {
  const [exerciseMap, setExerciseMap] = useState<Record<string, Exercise | undefined>>({});

  useEffect(() => {
    if (!workout) return;

    // Load all exercises for this workout
    const loadExercises = async () => {
      // Get all exercises from the same service the plan generator uses
      const allExercises = await getExerciseLibrary();
      const exercises: Record<string, Exercise | undefined> = {};
      
      for (const exerciseInstance of workout.exercises) {
        if (!exercises[exerciseInstance.exerciseId]) {
          // Find exercise by ID (handle both string and numeric string IDs)
          const exercise = allExercises.find(ex => 
            ex.id === exerciseInstance.exerciseId || 
            String(ex.id) === String(exerciseInstance.exerciseId)
          );
          
          if (exercise) {
            console.log(`✅ Loaded exercise: ${exercise.name} (id: ${exercise.id}, lookup: ${exerciseInstance.exerciseId})`);
            // Cast to plan.Exercise type (they're compatible, just different type definitions)
            exercises[exerciseInstance.exerciseId] = exercise as Exercise;
          } else {
            console.warn(`⚠️ Exercise not found: ${exerciseInstance.exerciseId}. Available IDs: ${allExercises.slice(0, 5).map(e => e.id).join(', ')}...`);
          }
        }
      }
      setExerciseMap(exercises);
    };

    loadExercises();
  }, [workout]);

  if (!workout) {
    return (
      <View style={styles.container}>
        <Text style={styles.noWorkoutText}>No workout available for this duration</Text>
      </View>
    );
  }

  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Check if workout has binder-aware or pelvic-floor-friendly exercises
  const hasBinderAware = workout.exercises.some(ei => {
    const ex = exerciseMap[ei.exerciseId];
    return ex?.binder_aware;
  });
  const hasPelvicFloorFriendly = workout.exercises.some(ei => {
    const ex = exerciseMap[ei.exerciseId];
    return ex?.pelvic_floor_aware;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.dateText}>{formatDate(day.date)}</Text>
            <View style={styles.headerMeta}>
              <Text style={styles.exerciseCount}>
                {workout.exercises.length} {workout.exercises.length === 1 ? 'exercise' : 'exercises'}
              </Text>
              {(hasBinderAware || hasPelvicFloorFriendly) && (
                <View style={styles.safetyTags}>
                  {hasBinderAware && <SafetyTag type="binder-aware" size="small" />}
                  {hasPelvicFloorFriendly && <SafetyTag type="pelvic-floor-friendly" size="small" />}
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {onSelectVariant && selectedVariant && (
        <View style={styles.durationSelector}>
          <TimeVariantSelector 
            selected={selectedVariant} 
            onSelect={onSelectVariant}
          />
        </View>
      )}

      <ScrollView style={styles.exercisesList} showsVerticalScrollIndicator={false}>
        {workout.exercises.map((exerciseInstance, index) => {
          const exercise = exerciseMap[exerciseInstance.exerciseId];
          const exerciseName = exercise?.name || `Exercise ${exerciseInstance.exerciseId}`;
          const equipment = exercise?.equipment && exercise.equipment.length > 0
            ? exercise.equipment.map(eq => formatEquipmentLabel(eq)).join(', ')
            : '';
          const difficulty = exercise?.difficulty || 'beginner';
          const targetMuscles = exercise?.target_muscles;

          return (
            <TouchableOpacity
              key={index}
              onPress={() => onExercisePress?.(exerciseInstance.exerciseId)}
              activeOpacity={0.7}
            >
              <Card style={styles.exerciseCard} variant="outlined" padding="medium">
                <View style={styles.exerciseContent}>
                  <View style={styles.exerciseHeader}>
                    <Text style={styles.exerciseName} numberOfLines={2}>{exerciseName}</Text>
                    <View style={[
                      styles.difficultyBadge,
                      difficulty === 'beginner' && styles.difficultyBeginner,
                      difficulty === 'intermediate' && styles.difficultyIntermediate,
                      difficulty === 'advanced' && styles.difficultyAdvanced,
                    ]}>
                      <Text style={[
                        styles.difficultyText,
                        difficulty === 'beginner' && styles.difficultyTextBeginner,
                        difficulty === 'intermediate' && styles.difficultyTextIntermediate,
                        difficulty === 'advanced' && styles.difficultyTextAdvanced,
                      ]}>
                        {difficulty}
                      </Text>
                    </View>
                  </View>
                  {targetMuscles && (
                    <View style={styles.targetMusclesRow}>
                      <Text style={styles.targetMusclesLabel}>Target: </Text>
                      <Text style={styles.targetMusclesText}>{targetMuscles}</Text>
                    </View>
                  )}
                  <View style={styles.exerciseDetailsRow}>
                    <View style={styles.detailItem}>
                      {equipment ? (
                        <Text style={styles.equipmentText}>{equipment}</Text>
                      ) : (
                        <Text style={styles.exerciseDetails}>—</Text>
                      )}
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.exerciseDetails}>
                        {exerciseInstance.sets}×{exerciseInstance.reps}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.exerciseDetails}>
                        {exerciseInstance.restSeconds}s rest
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={onPreview}
          style={[styles.button, styles.previewButton]}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          Preview
        </Button>
        <Button
          mode="contained"
          onPress={onStartWorkout}
          style={[styles.button, styles.startButton]}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          Start Workout
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.deepBlack,
    paddingHorizontal: spacing.l,
  },
  header: {
    marginBottom: spacing.l,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  dateText: {
    ...typography.h3,
    color: palette.white,
    marginBottom: spacing.xs,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    flexWrap: 'wrap',
  },
  exerciseCount: {
    ...typography.bodySmall,
    color: palette.midGray,
  },
  safetyTags: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  durationSelector: {
    marginLeft: -spacing.l,
    marginRight: -spacing.l,
    marginBottom: spacing.m,
  },
  exercisesList: {
    flex: 1,
    marginBottom: spacing.m,
  },
  exerciseCard: {
    marginBottom: spacing.s,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.darkCard,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
    gap: spacing.s,
  },
  exerciseName: {
    ...typography.bodyLarge,
    color: palette.white,
    fontWeight: '600',
    flex: 1,
    lineHeight: 22,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.s,
    paddingVertical: 3,
    borderRadius: 8,
    flexShrink: 0,
    borderWidth: 1,
  },
  difficultyBeginner: {
    backgroundColor: 'rgba(0, 217, 192, 0.15)',
    borderColor: palette.tealPrimary,
  },
  difficultyIntermediate: {
    backgroundColor: 'rgba(255, 184, 77, 0.15)',
    borderColor: palette.warning,
  },
  difficultyAdvanced: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderColor: palette.error,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  difficultyTextBeginner: {
    color: palette.tealPrimary,
  },
  difficultyTextIntermediate: {
    color: palette.warning,
  },
  difficultyTextAdvanced: {
    color: palette.error,
  },
  targetMusclesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    marginTop: spacing.xxs,
  },
  targetMusclesLabel: {
    ...typography.bodySmall,
    color: palette.midGray,
    fontWeight: '500',
  },
  targetMusclesText: {
    ...typography.bodySmall,
    color: palette.lightGray,
    flex: 1,
  },
  exerciseDetailsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
    alignItems: 'flex-start',
  },
  exerciseDetails: {
    ...typography.bodySmall,
    color: palette.midGray,
  },
  equipmentText: {
    ...typography.bodySmall,
    color: palette.tealPrimary,
    fontWeight: '600',
  },
  separator: {
    ...typography.bodySmall,
    color: palette.border,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.s,
    paddingTop: spacing.l,
    paddingBottom: spacing.s,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    marginTop: spacing.xs,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewButton: {
    backgroundColor: palette.darkCard,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  startButton: {
    backgroundColor: palette.tealPrimary,
  },
  buttonContent: {
    paddingVertical: spacing.s,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.white,
  },
  noWorkoutText: {
    ...typography.body,
    color: palette.midGray,
    textAlign: 'center',
    padding: spacing.xl,
  },
});

