import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, spacing, colors } from '../../theme';
import { Day, Workout, Exercise } from '../../types/plan';
import { getExerciseLibrary } from '../../data/exercises';
import { formatEquipmentLabel } from '../../utils/equipment';
import SafetyTag from '../ui/SafetyTag';
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
            <Pressable
              key={index}
              onPress={() => onExercisePress?.(exerciseInstance.exerciseId)}
              style={({ pressed }) => [
                styles.exerciseCard,
                pressed && styles.exerciseCardPressed,
              ]}
            >
              {/* Glass background */}
              <LinearGradient
                colors={['rgba(25, 25, 30, 0.7)', 'rgba(18, 18, 22, 0.8)']}
                style={StyleSheet.absoluteFill}
              />

              {/* Glass highlight */}
              <View style={styles.cardGlassHighlight} />

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
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          onPress={onPreview}
          style={({ pressed }) => [
            styles.button,
            styles.previewButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.previewButtonLabel}>Preview</Text>
        </Pressable>
        <Pressable
          onPress={onStartWorkout}
          style={({ pressed }) => [
            styles.button,
            styles.startButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <LinearGradient
            colors={[colors.accent.primary, colors.accent.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.buttonGlassOverlay} />
          <Text style={styles.startButtonLabel}>Start Workout</Text>
        </Pressable>
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
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    flexWrap: 'wrap',
  },
  exerciseCount: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.tertiary,
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
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  exerciseCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cardGlassHighlight: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  exerciseContent: {
    flex: 1,
    padding: spacing.m,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
    gap: spacing.s,
  },
  exerciseName: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
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
    backgroundColor: 'rgba(91, 206, 250, 0.15)',
    borderColor: colors.accent.primary,
  },
  difficultyIntermediate: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: colors.warning,
  },
  difficultyAdvanced: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: colors.error,
  },
  difficultyText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  difficultyTextBeginner: {
    color: colors.accent.primary,
  },
  difficultyTextIntermediate: {
    color: colors.warning,
  },
  difficultyTextAdvanced: {
    color: colors.error,
  },
  targetMusclesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    marginTop: spacing.xxs,
  },
  targetMusclesLabel: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  targetMusclesText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.secondary,
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
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.tertiary,
  },
  equipmentText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.s,
    paddingTop: spacing.l,
    paddingBottom: spacing.s,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: spacing.xs,
  },
  button: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  previewButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  startButton: {
    // Background handled by gradient
  },
  buttonGlassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  previewButtonLabel: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  startButtonLabel: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  noWorkoutText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '400',
    color: colors.text.tertiary,
    textAlign: 'center',
    padding: spacing.xl,
  },
});

