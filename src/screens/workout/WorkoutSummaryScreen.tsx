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
import { colors, spacing, borderRadius } from '../../theme/theme';
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
import { usePlan } from '../../hooks/usePlan';
import { useProfile } from '../../hooks/useProfile';

type RootStackParamList = {
  WorkoutSummary: {
    workoutData?: {
      completedSets: any[];
      workoutDuration: number;
      totalExercises: number;
      exercisesCompleted: number;
      workoutName?: string;
    };
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

// Celebration confetti animation component
function CelebrationHeader({ duration }: { duration: string }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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
        colors={['#141418', '#0A0A0C']}
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

  const routeData = route.params?.workoutData;
  const workoutContext = useWorkoutSafe();
  const { profile } = useProfile();
  const userId = profile?.user_id || profile?.id || 'default';
  const { plan } = usePlan(userId);

  const workout = routeData ? null : (workoutContext?.workout || null);
  const completedSets = routeData?.completedSets || workoutContext?.completedSets || [];
  const workoutDuration = routeData?.workoutDuration || workoutContext?.workoutDuration || 0;
  const totalExercises = routeData?.totalExercises || workoutContext?.totalExercises || 0;
  const exercisesCompleted = routeData?.exercisesCompleted || workoutContext?.exercisesCompleted || 0;
  const completeWorkout = workoutContext?.completeWorkout || (() => {});
  const clearWorkout = workoutContext?.clearWorkout || (() => {});

  const [rating, setRating] = useState<WorkoutRating | null>(null);
  const [notes, setNotes] = useState('');
  const [notesFocused, setNotesFocused] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyChecked, setSurveyChecked] = useState(false);
  const [showBodyCheckin, setShowBodyCheckin] = useState(false);
  const [bodyCheckinData, setBodyCheckinData] = useState<BodyCheckinData | null>(null);
  const [bodyCheckinShown, setBodyCheckinShown] = useState(false);
  const [currentStreak, setCurrentStreak] = useState<number>(0);

  // Load current streak on mount
  useEffect(() => {
    getCurrentStreak(userId).then(setCurrentStreak).catch(() => setCurrentStreak(0));
  }, [userId]);

  // Show body check-in after celebration animation
  useEffect(() => {
    if (!bodyCheckinShown) {
      setBodyCheckinShown(true);
      // Show body check-in after a short delay for the celebration
      setTimeout(() => {
        setShowBodyCheckin(true);
      }, 1500);
    }
  }, [bodyCheckinShown]);

  // Check if we should show the survey after workout
  useEffect(() => {
    const checkSurvey = async () => {
      if (surveyChecked) return;
      setSurveyChecked(true);

      try {
        // Increment workout count
        await incrementWorkoutCount();

        // Check if we should show survey
        const result = await shouldShowWorkoutSurvey();
        if (result.shouldShow) {
          // Small delay to let the celebration animation play first
          setTimeout(() => {
            setShowSurvey(true);
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking survey trigger:', error);
      }
    };

    checkSurvey();
  }, [surveyChecked]);

  const handleBodyCheckinSubmit = (data: BodyCheckinData) => {
    setBodyCheckinData(data);
    setShowBodyCheckin(false);
    console.log('Body check-in response:', data.response);
  };

  const handleBodyCheckinSkip = () => {
    setShowBodyCheckin(false);
  };

  const handleSurveySubmit = async (response: SurveyResponse) => {
    await saveSurveyResponse(response);
    setShowSurvey(false);
  };

  const handleSurveyClose = async () => {
    await trackSurveySkipped('workout');
    setShowSurvey(false);
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
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
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
        color: colors.warning,
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

  const nextWorkout = useMemo(() => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find next workout from plan
    if (plan?.days) {
      // Find the next non-rest day that's after today
      const upcomingWorkoutDay = plan.days.find(day => {
        const dayDate = new Date(day.date);
        dayDate.setHours(0, 0, 0, 0);
        return dayDate > today && !day.isRestDay;
      });

      if (upcomingWorkoutDay) {
        const workoutDate = new Date(upcomingWorkoutDay.date);
        // Get workout name from variants (try 45 min variant first, then others)
        const workoutVariant = upcomingWorkoutDay.variants[45] ||
          upcomingWorkoutDay.variants[30] ||
          upcomingWorkoutDay.variants[60] ||
          upcomingWorkoutDay.variants[90];
        const workoutName = workoutVariant?.name || 'Workout';

        return {
          name: workoutName,
          day: dayNames[workoutDate.getDay()],
          date: `${monthNames[workoutDate.getMonth()]} ${workoutDate.getDate()}`,
        };
      }
    }

    // Fallback: next day
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1);
    return {
      name: 'Next Workout',
      day: dayNames[nextDate.getDay()],
      date: `${monthNames[nextDate.getMonth()]} ${nextDate.getDate()}`,
    };
  }, [plan]);

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

      await completeWorkout();
      clearWorkout();

      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      console.error('Error completing workout:', error);
      Alert.alert('Error', 'Failed to save workout. Please try again.');
    }
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
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration Header */}
        <CelebrationHeader duration={formatDuration(workoutDuration)} />

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
                onPress={() => setRating(option.value)}
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

        {/* Notes Input */}
        <View style={[
          styles.notesContainer,
          notesFocused && styles.notesContainerFocused,
        ]}>
          <LinearGradient
            colors={['#141418', '#0A0A0C']}
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

        {/* Next Workout Preview */}
        <View style={styles.nextWorkoutCard}>
          <LinearGradient
            colors={[colors.accent.primaryMuted, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="calendar" size={20} color={colors.accent.primary} />
          <View style={styles.nextWorkoutContent}>
            <Text style={styles.nextWorkoutLabel}>Next Workout</Text>
            <Text style={styles.nextWorkoutName}>
              {nextWorkout.name} • {nextWorkout.day}, {nextWorkout.date}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.accent.primary} />
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
  scrollContent: {
    paddingHorizontal: spacing.xl,
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
  // Next workout
  nextWorkoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
    padding: spacing.m,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  nextWorkoutContent: {
    flex: 1,
  },
  nextWorkoutLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextWorkoutName: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.primary,
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
