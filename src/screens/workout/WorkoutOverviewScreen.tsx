import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
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

// SVG Icon Components
const FireIconSVG = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path
      d="M9 2 C7 4, 6 6, 7 8 C6 7, 5 8, 5 10 C5 13, 7 15, 9 16 C11 15, 13 13, 13 10 C13 8, 12 7, 11 8 C12 6, 11 4, 9 2 Z"
      fill="#00D9C0"
    />
  </Svg>
);

const DumbbellIconSVG = () => (
  <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
    <Path d="M6 12 L6 20 M26 12 L26 20 M10 16 L22 16" stroke="#6B7280" strokeWidth="3" strokeLinecap="round" />
    <Circle cx="6" cy="16" r="3" fill="#6B7280" />
    <Circle cx="26" cy="16" r="3" fill="#6B7280" />
  </Svg>
);

const StretchIconSVG = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Circle cx="9" cy="5" r="2" stroke="#00D9C0" strokeWidth="2" />
    <Path
      d="M9 7 L9 13 M9 13 L6 16 M9 13 L12 16 M9 9 L6 9 M9 9 L12 9"
      stroke="#00D9C0"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

const PlayIconSVG = () => (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <Path d="M3 2 L11 7 L3 12 Z" fill="#0F1419" />
  </Svg>
);

const ChevronRightSVG = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path
      d="M6 4 L10 8 L6 12"
      stroke="#6B7280"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Helper Functions
const calculateTotalSets = (exercises: any[]) => {
  return exercises.reduce((sum, ex) => sum + ex.sets, 0);
};

const formatDate = () => {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

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
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={palette.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Today's Workout</Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.tealPrimary} />
          <Text style={styles.loadingText}>Loading workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalSets = calculateTotalSets(workout.main_workout);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={palette.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Today's Workout</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Text style={styles.workoutName}>{workout.workout_name}</Text>
          <Text style={styles.dateText}>{formatDate()}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{workout.estimated_duration_minutes}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{workout.main_workout.length}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalSets}</Text>
              <Text style={styles.statLabel}>Sets</Text>
            </View>
          </View>

          {workout.metadata?.day_focus && (
            <View style={styles.focusBadge}>
              <Text style={styles.focusBadgeText}>{workout.metadata.day_focus}</Text>
            </View>
          )}
        </View>

        {/* Warm-Up Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <FireIconSVG />
            </View>
            <Text style={styles.sectionTitle}>Warm-Up</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{workout.warm_up.total_duration_minutes} min</Text>
            </View>
          </View>

          {workout.warm_up.exercises.map((ex, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.listDot} />
              <Text style={styles.listItemName}>{ex.name}</Text>
              <Text style={styles.listItemDuration}>
                {ex.duration || `${ex.reps} reps`}
              </Text>
            </View>
          ))}
        </View>

        {/* Main Workout Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <DumbbellIconSVG />
            </View>
            <Text style={styles.sectionTitle}>Main Workout</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{workout.main_workout.length}</Text>
            </View>
          </View>

          {workout.main_workout.map((ex, index) => (
            <TouchableOpacity
              key={index}
              style={styles.exerciseCard}
              onPress={() => {
                console.log('View exercise:', ex.exercise_id);
              }}
            >
              <View style={styles.exerciseThumbnail}>
                <DumbbellIconSVG />
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>{index + 1}</Text>
                </View>
              </View>

              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{ex.exercise_name}</Text>
                <Text style={styles.exerciseTarget}>
                  {ex.target_muscle || 'Full body'}
                </Text>
                <Text style={styles.exercisePrescription}>
                  {ex.sets} sets × {ex.reps} reps • Rest {ex.rest_seconds}s
                </Text>
                <View style={styles.exerciseTags}>
                  {ex.gender_emphasis && (
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{ex.gender_emphasis}</Text>
                    </View>
                  )}
                  {ex.binding_safe && (
                    <View style={styles.safetyTag}>
                      <Text style={styles.safetyTagText}>binding-safe</Text>
                    </View>
                  )}
                </View>
              </View>

              <ChevronRightSVG />
            </TouchableOpacity>
          ))}
        </View>

        {/* Cool-Down Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <StretchIconSVG />
            </View>
            <Text style={styles.sectionTitle}>Cool-Down</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{workout.cool_down.total_duration_minutes} min</Text>
            </View>
          </View>

          {workout.cool_down.exercises.map((ex, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.listDot} />
              <Text style={styles.listItemName}>{ex.name}</Text>
              <Text style={styles.listItemDuration}>{ex.duration || ex.reps}</Text>
            </View>
          ))}
        </View>

        {/* Safety Checkpoints */}
        {workout.safety_checkpoints && workout.safety_checkpoints.length > 0 && (
          <View style={styles.checkpointContainer}>
            <View style={styles.checkpointCard}>
              <View style={styles.checkpointHeader}>
                <Ionicons name="warning" size={20} color="#FFB84D" />
                <Text style={styles.checkpointTitle}>Safety Checkpoints</Text>
              </View>
              {workout.safety_checkpoints.map((checkpoint, index) => (
                <View key={index} style={styles.checkpointItem}>
                  <View style={styles.listDot} />
                  <Text style={styles.checkpointText}>{checkpoint.message}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Start Button (Scrolls with content) */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.startButton} onPress={handleStartWorkout}>
            <LinearGradient
              colors={['#00D9C0', '#00B39D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <PlayIconSVG />
              <Text style={styles.startButtonText}>Start Workout</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.white,
  },
  spacer: {
    width: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  heroContainer: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  workoutName: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.white,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#9CA3AF',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1F26',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2F36',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00D9C0',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  focusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  focusBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A78BFA',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 217, 192, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.white,
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#1A1F26',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  listDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00D9C0',
  },
  listItemName: {
    fontSize: 15,
    fontWeight: '400',
    color: '#E0E4E8',
    flex: 1,
  },
  listItemDuration: {
    fontSize: 15,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1F26',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2F36',
    gap: 12,
  },
  exerciseThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#151920',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  numberBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00D9C0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F1419',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.white,
    marginBottom: 4,
  },
  exerciseTarget: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
    marginBottom: 6,
  },
  exercisePrescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#E0E4E8',
    marginBottom: 8,
  },
  exerciseTags: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: 'rgba(107, 114, 128, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  safetyTag: {
    backgroundColor: 'rgba(0, 217, 192, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  safetyTagText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#00D9C0',
  },
  checkpointContainer: {
    marginBottom: 24,
  },
  checkpointCard: {
    backgroundColor: 'rgba(255, 184, 77, 0.12)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 77, 0.2)',
  },
  checkpointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  checkpointTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFB84D',
  },
  checkpointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 12,
  },
  checkpointText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFB84D',
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingTop: 24,
    paddingBottom: 8,
  },
  startButton: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F1419',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

