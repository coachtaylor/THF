import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Platform, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { getWorkout, WorkoutDetailData } from '../../services/storage/workout';
import { useProfile } from '../../hooks/useProfile';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { GlassCard, GlassButton, ProgressRing } from '../../components/common';
import WhyThisWorkout from '../../components/workout/WhyThisWorkout';
import EducationSnippets from '../../components/education/EducationSnippets';
import { selectSnippetsForUser, initEducationSnippets } from '../../services/education/snippets';
import { SelectedSnippets, UserSnippetContext } from '../../services/education/types';
import { WorkoutExplanation } from '../../types/explanations';

type RootStackParamList = {
  WorkoutOverview: { workoutId: string; isToday?: boolean };
  SessionPlayer: {
    workout: any;
    planId?: string;
    warmUp?: any;
    coolDown?: any;
    safetyCheckpoints?: any[];
  };
  ExerciseDetail: { exerciseId: string };
  Saved: { selectMode?: boolean; targetWorkoutId?: string };
  [key: string]: any;
};

type WorkoutOverviewScreenRouteProp = {
  key: string;
  name: 'WorkoutOverview';
  params: { workoutId: string; isToday?: boolean };
};

type WorkoutOverviewScreenNavigationProp = StackNavigationProp<RootStackParamList, 'WorkoutOverview'>;

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
  const { workoutId, isToday = false } = route.params;

  const [workout, setWorkout] = useState<WorkoutDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [whySheetVisible, setWhySheetVisible] = useState(false);
  const [snippets, setSnippets] = useState<SelectedSnippets>({});
  const [explanations, setExplanations] = useState<WorkoutExplanation[]>([]);

  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadWorkout();
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, [workoutId, profile?.user_id, profile?.id]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 400],
  });

  const loadWorkout = async () => {
    try {
      const userId = profile?.user_id || profile?.id || 'default';
      console.log('📋 Loading workout with ID:', workoutId, 'userId:', userId);
      const data = await getWorkout(workoutId, userId);
      console.log('📋 Workout data received:', data ? 'Found' : 'NULL');
      setWorkout(data);

      // Load education snippets based on user profile
      if (profile) {
        await initEducationSnippets();
        const snippetContext = buildSnippetContext(profile);
        const selectedSnippets = await selectSnippetsForUser(snippetContext);
        setSnippets(selectedSnippets);
      }

      // Build explanations from workout metadata (would come from rules engine in full implementation)
      const workoutExplanations = buildExplanationsFromWorkout(data, profile);
      setExplanations(workoutExplanations);
    } catch (error) {
      console.error('Failed to load workout:', error);
    } finally {
      setLoading(false);
    }
  };

  // Build snippet context from user profile
  const buildSnippetContext = (userProfile: any): UserSnippetContext => {
    // Calculate HRT months if applicable
    let hrtMonths: number | undefined;
    if (userProfile.on_hrt && userProfile.hrt_start_date) {
      const startDate = new Date(userProfile.hrt_start_date);
      const now = new Date();
      hrtMonths = Math.floor(
        (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
    }

    // Build surgeries array with weeks post-op
    const surgeries: UserSnippetContext['surgeries'] = [];
    if (userProfile.surgeries) {
      for (const surgery of userProfile.surgeries) {
        const surgeryDate = new Date(surgery.date);
        const now = new Date();
        const weeksPostOp = Math.floor(
          (now.getTime() - surgeryDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
        );
        surgeries.push({
          type: surgery.type,
          weeks_post_op: weeksPostOp,
          fully_healed: surgery.fully_healed || weeksPostOp > 24,
        });
      }
    }

    return {
      on_hrt: userProfile.on_hrt || false,
      hrt_type: userProfile.hrt_type,
      hrt_months: hrtMonths,
      binds_chest: userProfile.binds_chest || false,
      binding_frequency: userProfile.binding_frequency,
      binding_today: userProfile.binding_today,
      surgeries,
      training_environment: userProfile.training_environment,
    };
  };

  // Build explanations from workout data and profile
  const buildExplanationsFromWorkout = (
    workoutData: WorkoutDetailData | null,
    userProfile: any
  ): WorkoutExplanation[] => {
    if (!workoutData || !userProfile) return [];

    const explanations: WorkoutExplanation[] = [];

    // Check for binding-related adjustments
    if (userProfile.binds_chest && userProfile.binding_today) {
      explanations.push({
        ruleId: 'binding_today',
        category: 'binder_safety',
        message:
          "We've reduced chest compression exercises and added breathing check-ins because you're binding today.",
      });
    } else if (userProfile.binds_chest && userProfile.binding_frequency === 'daily') {
      explanations.push({
        ruleId: 'binding_regular',
        category: 'binder_safety',
        message:
          'Your workout includes binder-aware modifications to support chest and rib health.',
      });
    }

    // Check for post-op adjustments
    if (userProfile.surgeries?.length > 0) {
      const topSurgery = userProfile.surgeries.find(
        (s: any) => s.type === 'top_surgery' && !s.fully_healed
      );
      if (topSurgery) {
        const surgeryDate = new Date(topSurgery.date);
        const weeksPostOp = Math.floor(
          (new Date().getTime() - surgeryDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
        );
        explanations.push({
          ruleId: 'post_op_top',
          category: 'post_op',
          message: `You're ~${weeksPostOp} weeks post-op. We've modified upper body volume to support your recovery.`,
          context: { weeksPostOp },
        });
      }
    }

    // Check for HRT adjustments
    if (userProfile.on_hrt && workoutData.metadata?.hrt_adjusted) {
      const hrtType = userProfile.hrt_type;
      if (hrtType === 'testosterone') {
        explanations.push({
          ruleId: 'hrt_testosterone',
          category: 'hrt',
          message:
            'Your program is optimized for testosterone-driven strength development with appropriate progressive overload.',
        });
      } else if (hrtType === 'estrogen_blockers') {
        explanations.push({
          ruleId: 'hrt_estrogen',
          category: 'hrt',
          message:
            'Recovery periods are adjusted to support body changes during estrogen therapy.',
        });
      }
    }

    // Environment-based adjustments
    if (userProfile.training_environment) {
      const envMessages: Record<string, string> = {
        home: 'Exercises are selected for home training with minimal equipment.',
        gym: 'Full gym equipment is available for this workout.',
        studio: 'Exercises suit a studio/small gym environment.',
        outdoors: 'Workout is designed for outdoor/portable equipment.',
      };
      const envMessage = envMessages[userProfile.training_environment];
      if (envMessage) {
        explanations.push({
          ruleId: 'environment',
          category: 'environment',
          message: envMessage,
        });
      }
    }

    return explanations;
  };

  const handleStartWorkout = async () => {
    if (!workout) return;

    try {
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

  const headerTitle = isToday ? "Today's Workout" : "Upcoming Workout";

  const handleSwapWorkout = () => {
    navigation.navigate('Saved', {
      selectMode: true,
      targetWorkoutId: workoutId
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={styles.loadingText}>Loading workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!workout) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.text.tertiary} />
          <Text style={styles.loadingText}>Workout not found</Text>
          <Text style={[styles.loadingText, { fontSize: 12, marginTop: 8 }]}>
            ID: {workoutId}
          </Text>
          <Pressable
            style={{ marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: colors.accent.primary, borderRadius: 8 }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: colors.text.inverse, fontWeight: '600' }}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const totalSets = calculateTotalSets(workout.main_workout);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <Pressable onPress={handleSwapWorkout} hitSlop={8}>
          <Ionicons name="swap-horizontal" size={24} color={colors.accent.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <GlassCard variant="hero" shimmer style={styles.heroCard}>
          <Text style={styles.workoutName}>{workout.workout_name}</Text>
          <Text style={styles.dateText}>{formatDate()}</Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.statCircle}>
                <Ionicons name="time" size={18} color={colors.accent.primary} />
              </View>
              <Text style={styles.statValue}>{workout.estimated_duration_minutes}</Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statCircle}>
                <Ionicons name="barbell" size={18} color={colors.accent.secondary} />
              </View>
              <Text style={styles.statValue}>{workout.main_workout.length}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statCircle}>
                <Ionicons name="layers" size={18} color={colors.text.secondary} />
              </View>
              <Text style={styles.statValue}>{totalSets}</Text>
              <Text style={styles.statLabel}>Sets</Text>
            </View>
          </View>

          {workout.metadata?.day_focus && (
            <View style={styles.focusBadge}>
              <Ionicons name="flash" size={14} color={colors.accent.primary} />
              <Text style={styles.focusBadgeText}>{workout.metadata.day_focus}</Text>
            </View>
          )}

          {/* Why this workout? Button */}
          <Pressable
            style={styles.whyButton}
            onPress={() => setWhySheetVisible(true)}
          >
            <Ionicons name="bulb-outline" size={16} color={colors.accent.primary} />
            <Text style={styles.whyButtonText}>Why this workout?</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.text.tertiary} />
          </Pressable>
        </GlassCard>

        {/* Education Snippets Section */}
        {(snippets.binder || snippets.hrt || snippets.post_op || snippets.recovery_general) && (
          <EducationSnippets snippets={snippets} maxVisible={2} />
        )}

        {/* Warm-Up Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: colors.accent.primaryMuted }]}>
              <Ionicons name="flame" size={18} color={colors.accent.primary} />
            </View>
            <Text style={styles.sectionTitle}>Warm-Up</Text>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{workout.warm_up.total_duration_minutes} min</Text>
            </View>
          </View>

          <GlassCard variant="default">
            {workout.warm_up.exercises.map((ex, index) => (
              <View key={index} style={[styles.listItem, index > 0 && styles.listItemBorder]}>
                <View style={styles.listDot} />
                <Text style={styles.listItemName}>{ex.name}</Text>
                <Text style={styles.listItemDuration}>
                  {ex.duration || `${ex.reps} reps`}
                </Text>
              </View>
            ))}
          </GlassCard>
        </View>

        {/* Main Workout Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: colors.accent.secondaryMuted }]}>
              <Ionicons name="barbell" size={18} color={colors.accent.secondary} />
            </View>
            <Text style={styles.sectionTitle}>Main Workout</Text>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{workout.main_workout.length} exercises</Text>
            </View>
          </View>

          {workout.main_workout.map((ex, index) => (
            <GlassCard
              key={index}
              variant="default"
              pressable
              onPress={() => console.log('View exercise:', ex.exercise_id)}
              style={styles.exerciseCard}
            >
              <View style={styles.exerciseRow}>
                <View style={styles.exerciseThumbnail}>
                  <Ionicons name="barbell-outline" size={24} color={colors.text.tertiary} />
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
                        <Ionicons name="shield-checkmark" size={10} color={colors.accent.primary} />
                        <Text style={styles.safetyTagText}>binding-safe</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
              </View>
            </GlassCard>
          ))}
        </View>

        {/* Cool-Down Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: colors.glass.bgLight }]}>
              <Ionicons name="body" size={18} color={colors.text.secondary} />
            </View>
            <Text style={styles.sectionTitle}>Cool-Down</Text>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{workout.cool_down.total_duration_minutes} min</Text>
            </View>
          </View>

          <GlassCard variant="default">
            {workout.cool_down.exercises.map((ex, index) => (
              <View key={index} style={[styles.listItem, index > 0 && styles.listItemBorder]}>
                <View style={styles.listDot} />
                <Text style={styles.listItemName}>{ex.name}</Text>
                <Text style={styles.listItemDuration}>{ex.duration || ex.reps}</Text>
              </View>
            ))}
          </GlassCard>
        </View>

        {/* Safety Checkpoints */}
        {workout.safety_checkpoints && workout.safety_checkpoints.length > 0 && (
          <View style={styles.section}>
            <GlassCard variant="default" style={styles.checkpointCard}>
              <View style={styles.checkpointHeader}>
                <Ionicons name="warning" size={20} color={colors.warning} />
                <Text style={styles.checkpointTitle}>Safety Checkpoints</Text>
              </View>
              {workout.safety_checkpoints.map((checkpoint, index) => (
                <View key={index} style={styles.checkpointItem}>
                  <View style={[styles.listDot, { backgroundColor: colors.warning }]} />
                  <Text style={styles.checkpointText}>{checkpoint.message}</Text>
                </View>
              ))}
            </GlassCard>
          </View>
        )}

        {/* Start Button */}
        <View style={styles.buttonContainer}>
          <Pressable style={styles.startButton} onPress={handleStartWorkout}>
            <LinearGradient
              colors={[colors.accent.primary, colors.accent.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.25)', 'transparent']}
              style={styles.buttonGlassOverlay}
            />
            <Animated.View
              style={[
                styles.buttonShimmer,
                { transform: [{ translateX: shimmerTranslate }] },
              ]}
            >
              <LinearGradient
                colors={['transparent', 'rgba(255, 255, 255, 0.2)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            <View style={styles.buttonContent}>
              <Ionicons name="play" size={18} color={colors.text.inverse} />
              <Text style={styles.startButtonText}>Start Workout</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Why This Workout Bottom Sheet */}
      <WhyThisWorkout
        visible={whySheetVisible}
        onClose={() => setWhySheetVisible(false)}
        explanations={explanations}
        primaryGoal={profile?.primary_goal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.m,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  spacer: {
    width: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  heroCard: {
    marginBottom: spacing.xl,
    paddingVertical: spacing.xl,
  },
  workoutName: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  dateText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
    marginBottom: spacing.l,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.l,
  },
  statItem: {
    alignItems: 'center',
  },
  statCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.glass.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  focusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.accent.primaryMuted,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  focusBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  whyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: spacing.l,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing.xs,
  },
  whyButtonText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
    flex: 1,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
    gap: spacing.s,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  durationBadge: {
    backgroundColor: colors.glass.bg,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
  },
  durationText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.m,
    gap: spacing.m,
  },
  listItemBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  listDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.primary,
  },
  listItemName: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.primary,
  },
  listItemDuration: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.tertiary,
  },
  exerciseCard: {
    marginBottom: spacing.m,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  exerciseThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.glass.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  numberBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  numberBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  exerciseTarget: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  exercisePrescription: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  exerciseTags: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: colors.glass.bgLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xxs,
  },
  tagText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  safetyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.accent.primaryMuted,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xxs,
  },
  safetyTagText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '500',
    color: colors.accent.primary,
  },
  checkpointCard: {
    borderColor: `${colors.warning}40`,
    backgroundColor: `${colors.warning}10`,
  },
  checkpointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  checkpointTitle: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: colors.warning,
  },
  checkpointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.s,
    gap: spacing.m,
  },
  checkpointText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.secondary,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingTop: spacing.l,
    paddingBottom: spacing.m,
  },
  startButton: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  buttonGlassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  buttonShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 100,
  },
  buttonContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.s,
  },
  startButtonText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.l,
  },
  loadingText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
  },
});
