import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, typography } from '../../theme';

interface CoolDownExercise {
  name: string;
  duration?: string;
  reps?: string;
  description: string;
}

interface CoolDownPhaseProps {
  coolDownExercises: CoolDownExercise[];
  totalDurationMinutes: number;
  onComplete: () => void;
}

export default function CoolDownPhase({ coolDownExercises, totalDurationMinutes, onComplete }: CoolDownPhaseProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🧘 Cool-Down</Text>
        <Text style={styles.durationText}>{totalDurationMinutes} minutes</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.instructionText}>
          Take your time with these stretches to help your body recover.
        </Text>

        {coolDownExercises.map((exercise, index) => (
          <View key={index} style={styles.exerciseItem}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseNumber}>{index + 1}.</Text>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDescription}>{exercise.description}</Text>
              </View>
            </View>
            <View style={styles.exerciseDetails}>
              {exercise.duration && (
                <Text style={styles.exerciseDetail}>
                  <Ionicons name="time-outline" size={16} color={palette.midGray} /> {exercise.duration}
                </Text>
              )}
              {exercise.reps && (
                <Text style={styles.exerciseDetail}>
                  <Ionicons name="repeat-outline" size={16} color={palette.midGray} /> {exercise.reps}
                </Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + spacing.m }]}>
        <TouchableOpacity style={styles.completeButton} onPress={onComplete}>
          <Text style={styles.completeButtonText}>Complete Workout →</Text>
        </TouchableOpacity>
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
  },
  durationText: {
    ...typography.body,
    color: palette.midGray,
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
  exerciseItem: {
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.m,
  },
  exerciseHeader: {
    flexDirection: 'row',
    marginBottom: spacing.s,
  },
  exerciseNumber: {
    ...typography.h3,
    color: palette.tealPrimary,
    marginRight: spacing.s,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    ...typography.bodyLarge,
    color: palette.white,
    fontWeight: '600',
    marginBottom: spacing.xxs,
  },
  exerciseDescription: {
    ...typography.bodySmall,
    color: palette.midGray,
  },
  exerciseDetails: {
    flexDirection: 'row',
    gap: spacing.m,
    marginTop: spacing.xs,
  },
  exerciseDetail: {
    ...typography.bodySmall,
    color: palette.midGray,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContainer: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.deepBlack,
  },
  completeButton: {
    backgroundColor: palette.tealPrimary,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
  },
  completeButtonText: {
    ...typography.button,
    color: palette.deepBlack,
    fontWeight: '700',
    fontSize: 18,
  },
});

