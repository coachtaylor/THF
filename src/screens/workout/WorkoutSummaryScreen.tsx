import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useWorkoutSafe } from '../../contexts/WorkoutContext';
import { colors, spacing, borderRadius, timing, gradients, layout } from '../../theme/theme';
import { GlassCard, ProgressRing } from '../../components/common';
import { trackWorkoutCompleted } from '../../services/analytics';
import { BetaSurveyModal, SurveyResponse } from '../../components/feedback';
import {
  shouldShowWorkoutSurvey,
  saveSurveyResponse,
  trackSurveySkipped,
  incrementWorkoutCount,
} from '../../services/feedback';
import { PostWorkoutCheckin, BodyCheckinData } from '../../components/session/PostWorkoutCheckin';
import { getCurrentStreak } from '../../services/storage/stats';
import { useProfile } from '../../hooks/useProfile';
import { useSensoryMode } from '../../contexts/SensoryModeContext';
import { FlaggedExercisesReview } from '../../components/feedback';
import { FlaggedExercise, FeedbackCategory } from '../../types/feedback';
import {
  submitFlaggedExercisesAsFeedback,
  clearSessionFlags,
  saveFeedbackReport,
} from '../../services/feedback';

type RootStackParamList = {
  WorkoutSummary: {
    workoutData?: {
      completedSets: any[];
      workoutDuration: number;
      totalExercises: number;
      exercisesCompleted: number;
      workoutName?: string;
    };
    flaggedExercises?: FlaggedExercise[];
    sessionId?: string;
  };
  Home: undefined;
  [key: string]: any;
};

type WorkoutSummaryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'WorkoutSummary'>;
type WorkoutSummaryScreenRouteProp = {
  key: string;
  name: 'WorkoutSummary';
  params?: RootStackParamList['WorkoutSummary'];
};

type WorkoutRating = 'great' | 'good' | 'okay' | 'hard' | 'tough';

const RATING_OPTIONS: Array<{ value: WorkoutRating; emoji: string; label: string; color: string }> = [
  { value: 'great', emoji: '😊', label: 'Great', color: colors.success },
  { value: 'good', emoji: '🙂', label: 'Good', color: colors.accent.primary },
  { value: 'okay', emoji: '😐', label: 'Okay', color: colors.text.secondary },
  { value: 'hard', emoji: '😕', label: 'Hard', color: colors.warning },
  { value: 'tough', emoji: '😣', label: 'Tough', color: colors.accent.secondary },
];

const RATING_TO_NUMBER: Record<WorkoutRating, number> = {
  great: 5,
  good: 4,
  okay: 3,
  hard: 2,
  tough: 1,
};

// Celebration confetti animation component
function CelebrationHeader({ duration, disableAnimations }: { duration: string; disableAnimations?: boolean }) {
  const scaleAnim = useRef(new Animated.Value(disableAnimations ? 1 : 0)).current;
  const fadeAnim = useRef(new Animated.Value(disableAnimations ? 1 : 0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Skip animations in low sensory mode
    if (disableAnimations) return;

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: timing.shimmer,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: timing.shimmer,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [disableAnimations]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 150],
  });

  return (
    <Animated.View
      style={[
        styles.celebrationContainer,
        {
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={styles.celebrationGlow}>
        <LinearGradient
          colors={['rgba(91, 206, 250, 0.3)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      </View>
      {/* Hide shimmer in low sensory mode */}
      {!disableAnimations && (
        <Animated.View
          style={[
            styles.celebrationShimmer,
            { transform: [{ translateX: shimmerTranslate }] },
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(255, 255, 255, 0.1)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      <View style={styles.trophyContainer}>
        <LinearGradient
          colors={[colors.accent.primaryMuted, colors.glass.bg]}
          style={styles.trophyBg}
        />
        <Ionicons name="trophy" size={48} color={colors.accent.primary} />
      </View>

      <Text style={styles.celebrationTitle}>Workout Complete!</Text>
      <View style={styles.durationBadge}>
        <Ionicons name="time-outline" size={16} color={colors.accent.primary} />
        <Text style={styles.durationText}>{duration}</Text>
      </View>
    </Animated.View>
  );
}

// Stat card with progress ring
function StatCard({
  icon,
  value,
  label,
  progress,
  color = 'primary',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  progress?: number;
  color?: 'primary' | 'secondary';
}) {
  const iconColor = color === 'primary' ? colors.accent.primary : colors.accent.secondary;

  return (
    <View style={styles.statCard}>
      <LinearGradient
        colors={gradients.cardBg}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glassHighlight} />

      {progress !== undefined ? (
        <View style={styles.statRingContainer}>
          <ProgressRing progress={progress} size={44} strokeWidth={3} color={color} />
          <View style={styles.statIconOverlay}>
            <Ionicons name={icon} size={16} color={iconColor} />
          </View>
        </View>
      ) : (
        <View style={[styles.statIconContainer, { backgroundColor: color === 'primary' ? colors.accent.primaryMuted : colors.accent.secondaryMuted }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
      )}

      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function WorkoutSummaryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<WorkoutSummaryScreenNavigationProp>();
  const route = useRoute<WorkoutSummaryScreenRouteProp>();
  const { disableAnimations } = useSensoryMode();

  const routeData = route.params?.workoutData;
  const routeFlaggedExercises = route.params?.flaggedExercises || [];
  const routeSessionId = route.params?.sessionId;
  const workoutContext = useWorkoutSafe();
  const { profile } = useProfile();
  const userId = profile?.user_id || profile?.id || 'default';

  const workout = routeData ? null : (workoutContext?.workout || null);
  const completedSets = routeData?.completedSets || workoutContext?.completedSets || [];
  const workoutDuration = routeData?.workoutDuration || workoutContext?.workoutDuration || 0;
  const totalExercises = routeData?.totalExercises || workoutContext?.totalExercises || 0;
  const exercisesCompleted = routeData?.exercisesCompleted || workoutContext?.exercisesCompleted || 0;
  const completeWorkout = workoutContext?.completeWorkout || (() => {});
  const clearWorkout = workoutContext?.clearWorkout || (() => {});
  const saveWorkoutFeedback = workoutContext?.saveWorkoutFeedback || (async () => {});

  const [rating, setRating] = useState<WorkoutRating | null>(null);
  const [notes, setNotes] = useState('');
  const [notesFocused, setNotesFocused] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [showBodyCheckin, setShowBodyCheckin] = useState(false);
  const [bodyCheckinData, setBodyCheckinData] = useState<BodyCheckinData | null>(null);
  const [shouldShowSurveyAfterDone, setShouldShowSurveyAfterDone] = useState(false);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [flaggedExercises, setFlaggedExercises] = useState<FlaggedExercise[]>(routeFlaggedExercises);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Load current streak on mount
  useEffect(() => {
    getCurrentStreak(userId).then(setCurrentStreak).catch(() => setCurrentStreak(0));
  }, [userId]);

  // Check whether a beta survey should be shown — but defer presenting it
  // until the user finishes the summary screen so modals never block interaction.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await incrementWorkoutCount();
        const result = await shouldShowWorkoutSurvey();
        if (!cancelled && result.shouldShow) {
          setShouldShowSurveyAfterDone(true);
        }
      } catch (error) {
        console.error('Error checking survey trigger:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const navigateHome = () => {
    const routeNames = navigation.getState().routeNames;
    const targetRoute = routeNames.includes('MainTabs') ? 'MainTabs' : 'Home';
    navigation.reset({
      index: 0,
      routes: [{ name: targetRoute }],
    });
  };

  const persistFeedback = async (
    body_checkin: BodyCheckinData['response'],
  ): Promise<void> => {
    await saveWorkoutFeedback({
      body_checkin,
      workout_rating: rating ? RATING_TO_NUMBER[rating] : undefined,
      performance_notes: notes.trim() || undefined,
    });
  };

  const handleBodyCheckinSubmit = async (data: BodyCheckinData) => {
    setBodyCheckinData(data);
    setShowBodyCheckin(false);
    await persistFeedback(data.response);
    if (shouldShowSurveyAfterDone) {
      setShowSurvey(true);
    } else {
      await clearWorkout();
      navigateHome();
    }
  };

  const handleBodyCheckinSkip = async () => {
    setShowBodyCheckin(false);
    await persistFeedback('skip');
    if (shouldShowSurveyAfterDone) {
      setShowSurvey(true);
    } else {
      await clearWorkout();
      navigateHome();
    }
  };

  const handleSurveySubmit = async (response: SurveyResponse) => {
    await saveSurveyResponse(response);
    setShowSurvey(false);
    await clearWorkout();
    navigateHome();
  };

  const handleSurveyClose = async () => {
    await trackSurveySkipped('workout');
    setShowSurvey(false);
    await clearWorkout();
    navigateHome();
  };

  // Flagged exercises handlers
  const handleSubmitAllFlags = async () => {
    if (!routeSessionId || flaggedExercises.length === 0) return;

    try {
      await submitFlaggedExercisesAsFeedback(
        routeSessionId,
        routeData?.workoutName || 'workout',
        userId
      );
      setFeedbackSubmitted(true);
      setFlaggedExercises([]);
    } catch (error) {
      console.error('Error submitting flagged exercises:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    }
  };

  const handleDismissFlags = async () => {
    if (routeSessionId) {
      await clearSessionFlags(routeSessionId);
    }
    setFlaggedExercises([]);
  };

  const handleSubmitFlagWithDetails = async (data: {
    category: FeedbackCategory;
    severity?: string;
    quickFeedback: string[];
    description?: string;
  }) => {
    try {
      await saveFeedbackReport({
        user_id: userId,
        category: data.category,
        severity: data.severity,
        context: 'post_workout',
        quick_feedback: data.quickFeedback,
        description: data.description,
        workout_id: routeData?.workoutName,
      });
      // Remove the specific exercise from the list after submitting with details
      // For now, just mark as submitted
      setFeedbackSubmitted(true);
    } catch (error) {
      console.error('Error submitting feedback with details:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    }
  };

  const stats = useMemo(() => {
    if (!completedSets || completedSets.length === 0) {
      return {
        totalVolume: 0,
        avgRPE: 0,
        totalSets: 0,
        totalReps: 0,
        avgRest: 0,
      };
    }

    const totalVolume = completedSets.reduce((sum, set) => sum + (set.reps * set.weight), 0);
    const totalRPE = completedSets.reduce((sum, set) => sum + set.rpe, 0);
    const avgRPE = totalRPE / completedSets.length;
    const totalReps = completedSets.reduce((sum, set) => sum + set.reps, 0);
    const avgRest = 60;

    return {
      totalVolume,
      avgRPE: Math.round(avgRPE * 10) / 10,
      totalSets: completedSets.length,
      totalReps,
      avgRest,
    };
  }, [completedSets]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  const achievements = useMemo(() => {
    const achievementsList = [];

    // Streak achievement - use real data
    if (currentStreak > 0) {
      achievementsList.push({
        icon: 'flame' as const,
        text: currentStreak === 1
          ? 'Workout streak started!'
          : `${currentStreak}-day streak maintained!`,
        color: colors.accent.secondary,
      });
    }

    // PR achievement based on volume
    if (stats.totalVolume > 2000) {
      achievementsList.push({
        icon: 'trophy' as const,
        text: `New PR: Total Volume (${stats.totalVolume.toLocaleString()} lbs)`,
        color: colors.accent.primary,
      });
    }

    // Workout completion achievement
    if (exercisesCompleted === totalExercises && totalExercises > 0) {
      achievementsList.push({
        icon: 'checkmark-circle' as const,
        text: 'All exercises completed!',
        color: colors.success,
      });
    }

    return achievementsList;
  }, [stats, currentStreak, exercisesCompleted, totalExercises]);

  const handleDone = async () => {
    try {
      if (rating) {
        console.log('Workout rating:', rating);
      }
      if (notes.trim()) {
        console.log('Workout notes:', notes);
      }

      // Track workout completion
      await trackWorkoutCompleted(
        workout?.id || routeData?.workoutName || 'unknown',
        workoutDuration,
        exercisesCompleted,
        totalExercises
      );

      // Save the workout as completed first so the row is durable even if
      // the user bails on the feedback chain. Don't clearWorkout yet —
      // saveWorkoutFeedback needs workoutLogId from context. The clear
      // happens at the end of the prompt chain (in body-check-in / survey
      // handlers) before navigateHome.
      await completeWorkout();

      // Chain optional post-workout prompts after the user explicitly taps Done.
      // Body check-in first (if not yet collected), then survey (if eligible),
      // then navigate home. Each step can be skipped.
      if (!bodyCheckinData) {
        setShowBodyCheckin(true);
        return;
      }
      if (shouldShowSurveyAfterDone) {
        setShowSurvey(true);
        return;
      }
      await clearWorkout();
      navigateHome();
    } catch (error) {
      console.error('Error completing workout:', error);
      Alert.alert('Error', 'Failed to save workout. Please try again.');
    }
  };

  const handleSkipToHome = () => {
    clearWorkout();
    navigateHome();
  };

  const workoutName = routeData?.workoutName || workout?.workout_name || 'Workout Complete';

  if (!workout && !routeData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <GlassCard variant="default" style={styles.errorCard}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>No workout data found</Text>
          <Pressable
            style={({ pressed }) => [
              styles.errorButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => {
              const routeNames = navigation.getState().routeNames;
              const targetRoute = routeNames.includes('MainTabs') ? 'MainTabs' : 'Home';
              navigation.reset({ index: 0, routes: [{ name: targetRoute }] });
            }}
          >
            <Text style={styles.errorButtonText}>Go Home</Text>
          </Pressable>
        </GlassCard>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bg.primary, colors.bg.secondary]}
        style={StyleSheet.absoluteFill}
      />

      {/* Persistent header — always offers an escape to Home */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.s }]}>
        <View style={styles.headerSpacer} />
        <Pressable
          onPress={handleSkipToHome}
          hitSlop={12}
          style={({ pressed }) => [styles.headerDone, pressed && styles.buttonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Done, go to home"
        >
          <Text style={styles.headerDoneText}>Done</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: spacing.l, paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        {/* Celebration Header */}
        <CelebrationHeader duration={formatDuration(workoutDuration)} disableAnimations={disableAnimations} />

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="fitness"
            value={`${exercisesCompleted}/${totalExercises}`}
            label="Exercises"
            progress={exercisesCompleted / totalExercises}
            color="primary"
          />
          <StatCard
            icon="barbell"
            value={stats.totalVolume.toLocaleString()}
            label="Volume (lbs)"
            color="primary"
          />
          <StatCard
            icon="speedometer"
            value={stats.avgRPE.toString()}
            label="Avg RPE"
            progress={stats.avgRPE / 10}
            color="secondary"
          />
          <StatCard
            icon="layers"
            value={stats.totalSets.toString()}
            label="Total Sets"
            color="primary"
          />
          <StatCard
            icon="repeat"
            value={stats.totalReps.toString()}
            label="Total Reps"
            color="secondary"
          />
          <StatCard
            icon="time"
            value={`${stats.avgRest}s`}
            label="Avg Rest"
            color="primary"
          />
        </View>

        {/* Achievements */}
        {achievements.length > 0 && (
          <GlassCard variant="hero" shimmer style={styles.achievementsCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="medal" size={20} color={colors.accent.primary} />
              <Text style={styles.sectionTitle}>Achievements</Text>
            </View>

            {achievements.map((achievement, index) => (
              <View key={index} style={styles.achievementItem}>
                <View style={[styles.achievementIcon, { backgroundColor: achievement.color + '20' }]}>
                  <Ionicons name={achievement.icon} size={16} color={achievement.color} />
                </View>
                <Text style={styles.achievementText}>{achievement.text}</Text>
              </View>
            ))}
          </GlassCard>
        )}

        {/* Workout Rating */}
        <GlassCard variant="default" style={styles.ratingCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubble-ellipses" size={20} color={colors.accent.secondary} />
            <Text style={styles.sectionTitle}>How was your workout?</Text>
          </View>

          <View style={styles.ratingOptions}>
            {RATING_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={({ pressed }) => [
                  styles.ratingOption,
                  rating === option.value && styles.ratingOptionSelected,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {
                  if (__DEV__) console.log('⭐ Rating selected:', option.value);
                  setRating(option.value);
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Rate workout as ${option.label}`}
              >
                {rating === option.value && (
                  <LinearGradient
                    colors={[option.color + '30', 'transparent']}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Text style={styles.ratingEmoji}>{option.emoji}</Text>
                <Text style={[
                  styles.ratingLabel,
                  rating === option.value && { color: option.color },
                ]}>
                  {option.label}
                </Text>
                {rating === option.value && (
                  <View style={[styles.ratingCheckmark, { backgroundColor: option.color }]}>
                    <Ionicons name="checkmark" size={10} color={colors.text.inverse} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </GlassCard>

        {/* Flagged Exercises Review */}
        {flaggedExercises.length > 0 && !feedbackSubmitted && (
          <FlaggedExercisesReview
            flaggedExercises={flaggedExercises}
            onSubmitAll={handleSubmitAllFlags}
            onDismiss={handleDismissFlags}
            onSubmitWithDetails={handleSubmitFlagWithDetails}
            workoutId={routeData?.workoutName}
          />
        )}

        {/* Notes Input */}
        <View style={[
          styles.notesContainer,
          notesFocused && styles.notesContainerFocused,
        ]}>
          <LinearGradient
            colors={gradients.cardBg}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.glassHighlight} />
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes about your workout (optional)"
            placeholderTextColor={colors.text.tertiary}
            value={notes}
            onChangeText={setNotes}
            onFocus={() => setNotesFocused(true)}
            onBlur={() => setNotesFocused(false)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Done Button */}
        <Pressable
          style={({ pressed }) => [
            styles.doneButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleDone}
        >
          <LinearGradient
            colors={[colors.accent.primary, colors.accent.primaryDark]}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.2)', 'transparent']}
            style={styles.buttonGlassOverlay}
          />
          <Ionicons name="checkmark-circle" size={22} color={colors.text.inverse} />
          <Text style={styles.doneButtonText}>Complete & Save</Text>
        </Pressable>

      </ScrollView>

      {/* Post-Workout Body Check-in */}
      <PostWorkoutCheckin
        visible={showBodyCheckin}
        onSubmit={handleBodyCheckinSubmit}
        onSkip={handleBodyCheckinSkip}
      />

      {/* Beta Survey Modal */}
      <BetaSurveyModal
        visible={showSurvey}
        onClose={handleSurveyClose}
        onSubmit={handleSurveySubmit}
        triggerPoint="workout"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.s,
  },
  headerSpacer: {
    flex: 1,
  },
  headerDone: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  headerDoneText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
  },
  // Celebration header
  celebrationContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
  },
  celebrationGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  celebrationShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 150,
  },
  trophyContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.l,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
      },
      android: { elevation: 8 },
    }),
  },
  trophyBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 50,
  },
  celebrationTitle: {
    fontFamily: 'Poppins',
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: spacing.s,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent.primaryMuted,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  durationText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '30%',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.m,
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statRingContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  statIconOverlay: {
    position: 'absolute',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  statValue: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  statLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '500',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  // Achievements
  achievementsCard: {
    marginBottom: spacing.l,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    paddingVertical: spacing.s,
  },
  achievementIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
  },
  // Rating
  ratingCard: {
    marginBottom: spacing.l,
  },
  ratingOptions: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  ratingOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.glass.bg,
    overflow: 'hidden',
    position: 'relative',
  },
  ratingOptionSelected: {
    borderColor: colors.accent.primary,
  },
  ratingEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  ratingLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  ratingCheckmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Notes
  notesContainer: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.l,
    overflow: 'hidden',
  },
  notesContainerFocused: {
    borderColor: colors.accent.primary,
  },
  notesInput: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.primary,
    padding: spacing.m,
    minHeight: 100,
  },
  // Done button
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.m,
    marginBottom: spacing.l,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  buttonGlassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  doneButtonText: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  // Error state
  errorCard: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  errorText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.m,
    marginBottom: spacing.l,
  },
  errorButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.m,
  },
  errorButtonText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});
