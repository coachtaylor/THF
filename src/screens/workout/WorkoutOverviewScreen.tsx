import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getWorkout, WorkoutDetailData } from '../../services/storage/workout';
import { useProfile } from '../../hooks/useProfile';
import { palette, spacing, typography } from '../../theme';

type RootStackParamList = {
  WorkoutOverview: { workoutId: string };
  SessionPlayer: {
    workout: any;
    planId?: string;
    warmUp?: any;
    coolDown?: any;
    safetyCheckpoints?: any[];
  };
  ExerciseDetail: { exerciseId: string };
  [key: string]: any;
};

type WorkoutOverviewScreenRouteProp = {
  key: string;
  name: 'WorkoutOverview';
  params: { workoutId: string };
};

type WorkoutOverviewScreenNavigationProp = StackNavigationProp<RootStackParamList, 'WorkoutOverview'>;

export default function WorkoutOverviewScreen() {
  const route = useRoute<WorkoutOverviewScreenRouteProp>();
  const navigation = useNavigation<WorkoutOverviewScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { workoutId } = route.params;

  const [workout, setWorkout] = useState<WorkoutDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkout();
  }, [workoutId]);

  const loadWorkout = async () => {
    try {
      const userId = profile?.user_id || profile?.id || 'default';
      const data = await getWorkout(workoutId, userId);
      setWorkout(data);
    } catch (error) {
      console.error('Failed to load workout:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkout = async () => {
    if (!workout) return;

    try {
      // Convert WorkoutDetailData to Workout format for SessionPlayer
      // SessionPlayer expects a Workout object with exercises array
      const workoutForSession = {
        duration: workout.estimated_duration_minutes as 5 | 15 | 30 | 45,
        exercises: workout.main_workout.map((ex, index) => ({
          exerciseId: ex.exercise_id,
          sets: ex.sets,
          reps: ex.reps,
          format: 'straight_sets' as const,
          restSeconds: ex.rest_seconds,
        })),
        totalMinutes: workout.estimated_duration_minutes,
      };

      // Navigate to SessionPlayer with workout data
      // We'll need to add SessionPlayer to the MainNavigator stack
      navigation.navigate('SessionPlayer', {
        workout: workoutForSession,
        planId: workout.id,
        warmUp: workout.warm_up,
        coolDown: workout.cool_down,
        safetyCheckpoints: workout.safety_checkpoints,
      });
    } catch (error) {
      console.error('Failed to start workout:', error);
    }
  };

  if (loading || !workout) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color={palette.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading workout...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={palette.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {workout.workout_name}
        </Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color={palette.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Workout Info */}
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • Estimated {workout.estimated_duration_minutes} min
        </Text>

        <View style={styles.focusCard}>
          <Text style={styles.focusText}>
            🎯 Focus: {workout.metadata.day_focus}
          </Text>
          <Text style={styles.volumeText}>
            💪 Volume: {workout.metadata.volume_split}
            {workout.metadata.hrt_adjusted && ' (HRT-adjusted)'}
          </Text>
        </View>

        {/* Warm-Up */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🔥 Warm-Up ({workout.warm_up.total_duration_minutes} min)
          </Text>

          {workout.warm_up.exercises.map((ex, index) => (
            <View key={index} style={styles.warmupItem}>
              <Text style={styles.warmupName}>• {ex.name}</Text>
              <Text style={styles.warmupDuration}>
                {ex.duration || `${ex.reps} reps`}
              </Text>
            </View>
          ))}
        </View>

        {/* Main Workout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            💪 Main Workout ({workout.main_workout.length} exercises)
          </Text>

          {workout.main_workout.map((ex, index) => (
            <TouchableOpacity
              key={index}
              style={styles.exerciseCard}
              onPress={() => {
                // Navigate to exercise detail - adjust route name as needed
                // navigation.navigate('ExerciseDetail', { exerciseId: ex.exercise_id });
                console.log('View exercise:', ex.exercise_id);
              }}
            >
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseNumber}>{index + 1}.</Text>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{ex.exercise_name}</Text>
                  <Text style={styles.targetMuscle}>
                    🎯 {ex.target_muscle || 'Full body'}
                  </Text>
                </View>
              </View>

              <Text style={styles.prescription}>
                {ex.sets} sets × {ex.reps} reps • Rest {ex.rest_seconds}s
              </Text>

              <View style={styles.exerciseTags}>
                {ex.gender_emphasis && (
                  <Text style={styles.tag}>
                    🏷️ {ex.gender_emphasis}
                  </Text>
                )}
                {ex.binding_safe && (
                  <Text style={styles.safetyTag}>✓ binding-safe</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cool-Down */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🧘 Cool-Down ({workout.cool_down.total_duration_minutes} min)
          </Text>

          {workout.cool_down.exercises.map((ex, index) => (
            <View key={index} style={styles.warmupItem}>
              <Text style={styles.warmupName}>• {ex.name}</Text>
              <Text style={styles.warmupDuration}>{ex.duration || ex.reps}</Text>
            </View>
          ))}
        </View>

        {/* Safety Checkpoints */}
        {workout.safety_checkpoints && workout.safety_checkpoints.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Safety Checkpoints</Text>

            {workout.safety_checkpoints.map((checkpoint, index) => (
              <View key={index} style={styles.checkpointItem}>
                <Text style={styles.checkpointText}>
                  • {checkpoint.message}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Spacer for button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Start Button (Fixed at bottom) */}
      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartWorkout}
        >
          <Text style={styles.startButtonText}>Start Workout →</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerTitle: {
    ...typography.h3,
    color: palette.white,
    flex: 1,
    marginHorizontal: spacing.m,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.m,
  },
  dateText: {
    ...typography.body,
    color: palette.midGray,
    marginBottom: spacing.m,
  },
  focusCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.l,
  },
  focusText: {
    ...typography.bodyLarge,
    color: palette.white,
    marginBottom: spacing.xs,
  },
  volumeText: {
    ...typography.body,
    color: palette.lightGray,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: palette.white,
    marginBottom: spacing.m,
  },
  warmupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.s,
  },
  warmupName: {
    ...typography.body,
    color: palette.lightGray,
    flex: 1,
  },
  warmupDuration: {
    ...typography.body,
    color: palette.midGray,
  },
  exerciseCard: {
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
    color: palette.white,
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
  targetMuscle: {
    ...typography.bodySmall,
    color: palette.midGray,
  },
  prescription: {
    ...typography.body,
    color: palette.lightGray,
    marginBottom: spacing.s,
  },
  exerciseTags: {
    flexDirection: 'row',
    gap: spacing.s,
    flexWrap: 'wrap',
  },
  tag: {
    ...typography.bodySmall,
    color: palette.midGray,
  },
  safetyTag: {
    ...typography.bodySmall,
    color: palette.tealPrimary,
  },
  checkpointItem: {
    paddingVertical: spacing.xs,
  },
  checkpointText: {
    ...typography.body,
    color: palette.lightGray,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.l,
    backgroundColor: palette.deepBlack,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  startButton: {
    backgroundColor: palette.tealPrimary,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
  },
  startButtonText: {
    ...typography.button,
    color: palette.deepBlack,
    fontWeight: '700',
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: palette.midGray,
    textAlign: 'center',
  },
});

