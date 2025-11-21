import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';
import { palette, spacing, typography } from '../../theme';
import { Day, Workout, Exercise } from '../../types/plan';
import { getCachedExercises } from '../../services/exerciseService';
import { formatEquipmentLabel } from '../../utils/equipment';
import SafetyTag from '../ui/SafetyTag';
import Card from '../ui/Card';

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
      // Get all exercises from the same service the plan generator uses
      const allExercises = await getCachedExercises();
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
          } else {
            console.warn(`⚠️ Exercise not found: ${exerciseInstance.exerciseId}. Available IDs: ${allExercises.slice(0, 5).map(e => e.id).join(', ')}...`);
          }
          exercises[exerciseInstance.exerciseId] = exercise;
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
          <Text style={styles.dateText}>{formatDate(day.date)}</Text>
          <Text style={styles.durationText}>{workout.duration} min</Text>
        </View>
        <View style={styles.workoutMeta}>
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

      <ScrollView style={styles.exercisesList} showsVerticalScrollIndicator={false}>
        {workout.exercises.map((exerciseInstance, index) => {
          const exercise = exerciseMap[exerciseInstance.exerciseId];
          const exerciseName = exercise?.name || `Exercise ${exerciseInstance.exerciseId}`;
          const equipment = exercise?.rawEquipment && exercise.rawEquipment.length > 0
            ? formatEquipmentLabel(exercise.rawEquipment[0])
            : exercise?.equipment.join(', ') || '';

          return (
            <TouchableOpacity
              key={index}
              onPress={() => onExercisePress?.(exerciseInstance.exerciseId)}
              activeOpacity={0.7}
            >
              <Card style={styles.exerciseCard} variant="outlined" padding="small">
                <View style={styles.exerciseRow}>
                  <View style={styles.exerciseNumber}>
                    <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.exerciseContent}>
                    <Text style={styles.exerciseName}>{exerciseName}</Text>
                    <Text style={styles.exerciseDetails}>
                      {exerciseInstance.sets}×{exerciseInstance.reps} • {exerciseInstance.restSeconds}s rest
                      {equipment && ` • ${equipment}`}
                    </Text>
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
    padding: spacing.l,
  },
  header: {
    marginBottom: spacing.m,
    paddingBottom: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  dateText: {
    ...typography.h3,
    color: palette.white,
    letterSpacing: -0.4,
    flex: 1,
  },
  durationText: {
    ...typography.body,
    color: palette.tealPrimary,
    fontWeight: '600',
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  exerciseCount: {
    ...typography.body,
    color: palette.lightGray,
  },
  safetyTags: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  exercisesList: {
    flex: 1,
    marginBottom: spacing.m,
  },
  exerciseCard: {
    marginBottom: spacing.s,
  },
  exerciseRow: {
    flexDirection: 'row',
    gap: spacing.m,
    alignItems: 'flex-start',
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.tealGlow,
    borderWidth: 2,
    borderColor: palette.tealPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: palette.tealPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseNumberText: {
    ...typography.bodyLarge,
    color: palette.tealPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    ...typography.bodyLarge,
    color: palette.white,
    marginBottom: 4,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  exerciseDetails: {
    ...typography.bodySmall,
    color: palette.midGray,
    fontSize: 12,
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

