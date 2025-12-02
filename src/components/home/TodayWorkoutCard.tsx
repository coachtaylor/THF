import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { textStyles, buttonStyles } from '../../theme/components';

interface TodayWorkoutCardProps {
  workout: {
    name: string;
    duration?: number;
    exercises: any[];
    totalSets: number;
  };
  onStartWorkout: () => void;
}

export default function TodayWorkoutCard({ workout, onStartWorkout }: TodayWorkoutCardProps) {
  const duration = workout.duration || 45;
  const exerciseCount = workout.exercises.length;

  return (
    <View style={styles.container}>
      <View style={styles.accentBar} />
      
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>TODAY</Text>
        <Text style={styles.workoutName}>{workout.name}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statText}>{exerciseCount} exercises</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statText}>{workout.totalSets} sets</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statText}>{duration} min</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[buttonStyles.dashboardPrimary, styles.button]}
        onPress={onStartWorkout}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.cyan[500], colors.cyan[600]]}
          style={buttonStyles.dashboardPrimaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={buttonStyles.dashboardPrimaryText}>Start Workout</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.bg.deep} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.l,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.l,
    overflow: 'hidden',
  },
  accentBar: {
    height: 4,
    backgroundColor: colors.cyan[500],
  },
  header: {
    padding: spacing.l,
    paddingBottom: spacing.m,
  },
  sectionLabel: {
    ...textStyles.caption,
    marginBottom: spacing.xs,
  },
  workoutName: {
    ...textStyles.h3,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.l,
    gap: spacing.l,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    ...textStyles.bodySmall,
  },
  button: {
    marginHorizontal: spacing.l,
    marginBottom: spacing.l,
    marginTop: 0,
    alignSelf: 'center', // Center the button with fixed width
  },
});