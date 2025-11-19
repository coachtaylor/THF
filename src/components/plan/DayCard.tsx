import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';
import { palette, spacing, typography } from '../../theme';
import { Day, Workout, Exercise } from '../../types/plan';
import { getExerciseById } from '../../data/exercises';
import { formatEquipmentLabel } from '../../utils/equipment';

interface DayCardProps {
  day: Day;
  workout: Workout | null;
  onStartWorkout: () => void;
  onPreview: () => void;
  onExercisePress?: (exerciseId: string) => void;
}

export default function DayCard({ day, workout, onStartWorkout, onPreview, onExercisePress }: DayCardProps) {
  const [exerciseMap, setExerciseMap] = useState<Record<string, Exercise | undefined>>({});

  useEffect(() => {
    if (!workout) return;

    // Load all exercises for this workout
    const loadExercises = async () => {
      const exercises: Record<string, Exercise | undefined> = {};
      for (const exerciseInstance of workout.exercises) {
        if (!exercises[exerciseInstance.exerciseId]) {
          exercises[exerciseInstance.exerciseId] = await getExerciseById(exerciseInstance.exerciseId);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dateText}>{formatDate(day.date)}</Text>
        <Text style={styles.durationText}>{workout.duration} minutes</Text>
      </View>

      <View style={styles.workoutInfo}>
        <Text style={styles.exerciseCount}>
          {workout.exercises.length} {workout.exercises.length === 1 ? 'exercise' : 'exercises'}
        </Text>
      </View>

      <ScrollView style={styles.exercisesList} showsVerticalScrollIndicator={false}>
        {workout.exercises.map((exerciseInstance, index) => {
          const exercise = exerciseMap[exerciseInstance.exerciseId];
          const exerciseName = exercise?.name || `Exercise ${exerciseInstance.exerciseId}`;

          return (
            <TouchableOpacity
              key={index}
              style={styles.exerciseItem}
              onPress={() => onExercisePress?.(exerciseInstance.exerciseId)}
              activeOpacity={0.7}
            >
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseNumber}>{index + 1}</Text>
                <View style={styles.exerciseNameContainer}>
                  <Text style={styles.exerciseName}>{exerciseName}</Text>
                  {(exercise?.binder_aware || exercise?.pelvic_floor_aware) && (
                    <View style={styles.badgesContainer}>
                      {exercise.binder_aware && (
                        <View style={[styles.badge, { marginRight: spacing.xxs }]}>
                          <Text style={styles.badgeText}>Binder-aware</Text>
                        </View>
                      )}
                      {exercise.pelvic_floor_aware && (
                        <View style={[styles.badge, styles.badgePelvic]}>
                          <Text style={styles.badgeText}>Pelvic-floor friendly</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.exerciseDetails}>
                <Text style={styles.exerciseDetail}>
                  {exerciseInstance.sets} {exerciseInstance.sets === 1 ? 'set' : 'sets'} × {exerciseInstance.reps}{' '}
                  {exerciseInstance.reps === 1 ? 'rep' : 'reps'}
                </Text>
                {exerciseInstance.format !== 'straight_sets' && (
                  <Text style={styles.exerciseFormat}>{exerciseInstance.format}</Text>
                )}
                {exercise && (
                  <Text style={styles.equipmentLabel}>
                    {exercise.rawEquipment && exercise.rawEquipment.length > 0
                      ? formatEquipmentLabel(exercise.rawEquipment[0])
                      : exercise.equipment.join(', ')}
                  </Text>
                )}
                <Text style={styles.restText}>Rest: {exerciseInstance.restSeconds}s</Text>
              </View>
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
    padding: spacing.m,
  },
  header: {
    marginBottom: spacing.m,
  },
  dateText: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  durationText: {
    ...typography.bodyLarge,
    color: palette.tealPrimary,
  },
  workoutInfo: {
    marginBottom: spacing.m,
    paddingBottom: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  exerciseCount: {
    ...typography.body,
    color: palette.lightGray,
  },
  exercisesList: {
    flex: 1,
    marginBottom: spacing.m,
  },
  exerciseItem: {
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.s,
    borderWidth: 1,
    borderColor: palette.border,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  exerciseNumber: {
    ...typography.h4,
    color: palette.tealPrimary,
    marginRight: spacing.s,
    width: 24,
  },
  exerciseNameContainer: {
    flex: 1,
  },
  exerciseName: {
    ...typography.h4,
    marginBottom: spacing.xxs,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xxs,
  },
  badge: {
    backgroundColor: palette.tealPrimary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgePelvic: {
    backgroundColor: palette.tealDark,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: palette.deepBlack,
    letterSpacing: 0.2,
  },
  exerciseDetails: {
    marginLeft: 32,
  },
  exerciseDetail: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  exerciseFormat: {
    ...typography.bodySmall,
    color: palette.tealPrimary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  equipmentLabel: {
    ...typography.bodySmall,
    color: palette.lightGray,
    marginBottom: spacing.xs,
  },
  restText: {
    ...typography.bodySmall,
    color: palette.midGray,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.s,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  button: {
    flex: 1,
  },
  previewButton: {
    backgroundColor: palette.darkCard,
  },
  startButton: {
    backgroundColor: palette.tealPrimary,
  },
  buttonContent: {
    paddingVertical: spacing.xs,
  },
  buttonLabel: {
    ...typography.button,
    color: palette.white,
  },
  noWorkoutText: {
    ...typography.body,
    color: palette.midGray,
    textAlign: 'center',
    padding: spacing.xl,
  },
});

