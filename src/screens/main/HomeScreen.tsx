import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { useProfile } from '../../hooks/useProfile';
import { usePlan } from '../../hooks/usePlan';
import { getCurrentStreak, getWeeklyStats, type WeeklyStats } from '../../services/storage/stats';
import { getWorkoutFromPlan } from '../../services/planGenerator';
import { getExerciseLibrary } from '../../data/exercises';
import { colors } from '../../theme/theme';
import type { Exercise } from '../../types';
import { saveWorkout, isWorkoutSaved, deleteSavedWorkout, findSavedWorkout } from '../../services/storage/savedWorkouts';
import WelcomeSection from '../../components/home/WelcomeSection';
import ThisWeekSection from '../../components/home/ThisWeekSection';
import TodayWorkoutCard from '../../components/home/TodayWorkoutCard';
import { StatsRow } from '../../components/home/Statcard';
import TodaysReminderCard from '../../components/home/TodaysReminderCard';
import UpcomingWorkoutsSection from '../../components/home/UpcomingWorkoutsSection';

type MainTabParamList = {
  Home: undefined;
  Workouts: undefined;
  Progress: undefined;
  Settings: undefined;
};

type MainStackParamList = {
  MainTabs: undefined;
  WorkoutOverview: { workoutId: string };
  SessionPlayer: { workout: any; planId?: string };
  Profile: undefined;
};

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  StackNavigationProp<MainStackParamList>
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { profile, loading: profileLoading } = useProfile();
  const userId = profile?.user_id || profile?.id || 'default';
  const { plan, loading: planLoading, refreshPlan } = usePlan(userId);

  // Debug: Log plan loading status
  useEffect(() => {
    console.log('🏠 HomeScreen - userId:', userId);
    console.log('🏠 HomeScreen - plan:', plan ? 'EXISTS' : 'NULL');
    console.log('🏠 HomeScreen - planLoading:', planLoading);
    if (plan) {
      console.log('🏠 HomeScreen - plan.id:', plan.id);
      console.log('🏠 HomeScreen - plan.days count:', plan.days?.length || 0);
    }
  }, [userId, plan, planLoading]);

  const [currentStreak, setCurrentStreak] = useState(0);
  const [workoutsCompleted, setWorkoutsCompleted] = useState(0);
  const [weekProgress, setWeekProgress] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [exerciseMap, setExerciseMap] = useState<Record<string, Exercise>>({});
  const [isTodayWorkoutSaved, setIsTodayWorkoutSaved] = useState(false);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[new Date().getDay()];

  useEffect(() => {
    const loadExercises = async () => {
      try {
        const exercises = await getExerciseLibrary();
        const map: Record<string, Exercise> = {};
        exercises.forEach(ex => {
          map[ex.id] = ex;
          map[String(ex.id)] = ex;
        });
        setExerciseMap(map);
      } catch (error) {
        console.error('Error loading exercises:', error);
      }
    };
    loadExercises();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      if (!profile) return;
      try {
        const id = profile.user_id || profile.id || 'default';
        const streak = await getCurrentStreak(id);
        const stats = await getWeeklyStats(id);
        setCurrentStreak(streak);
        setWeeklyStats(stats);
        setWorkoutsCompleted(stats.totalWorkouts);
        setWeekProgress(stats.completedWorkouts);
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };
    loadStats();
  }, [profile]);

  const todayWorkout = useMemo(() => {
    if (!plan || !plan.days || plan.days.length === 0) return null;
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    return plan.days.find(day => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate.getTime() === todayDate.getTime();
    });
  }, [plan]);

  const getWorkoutName = useCallback((workout: any): string => {
    if (!workout?.exercises || workout.exercises.length === 0) return 'Workout';
    const exerciseIds = workout.exercises.map((e: any) => e.exerciseId);
    const exercises = exerciseIds
      .map((id: string) => exerciseMap[id])
      .filter((ex: Exercise | undefined): ex is Exercise => !!ex);
    if (exercises.length === 0) return 'Workout';

    const allMuscles: string[] = [];
    exercises.forEach((ex: Exercise) => {
      if (ex.target_muscles) {
        allMuscles.push(...ex.target_muscles.split(',').map(m => m.trim()));
      }
    });
    const uniqueMuscles = [...new Set(allMuscles)];

    if (uniqueMuscles.some(m => m.includes('Chest')) && uniqueMuscles.some(m => m.includes('Triceps'))) {
      return 'Chest & Arms';
    } else if (uniqueMuscles.some(m => m.includes('Back')) && uniqueMuscles.some(m => m.includes('Biceps'))) {
      return 'Back & Biceps';
    } else if (uniqueMuscles.some(m => m.includes('Quadriceps') || m.includes('Glutes'))) {
      return 'Lower Body';
    } else if (uniqueMuscles.some(m => m.includes('Chest'))) {
      return 'Push Day';
    } else if (uniqueMuscles.some(m => m.includes('Back'))) {
      return 'Pull Day';
    }
    return 'Full Body';
  }, [exerciseMap]);

  const todayWorkoutDetails = useMemo(() => {
    if (!todayWorkout || !plan || !profile) return null;
    try {
      const duration = (profile.session_duration && [30, 45, 60, 90].includes(profile.session_duration))
        ? profile.session_duration as 30 | 45 | 60 | 90
        : 45;
      const workout = getWorkoutFromPlan(plan as any, todayWorkout.dayNumber, duration);
      if (!workout || !workout.exercises || workout.exercises.length === 0) return null;

      const workoutName = getWorkoutName(workout);
      const totalSets = workout.exercises.reduce((sum: number, e: any) => sum + (e.sets || 0), 0);

      // Enrich exercises with name and media_thumb for thumbnails
      const enrichedExercises = workout.exercises.map((ex: any) => {
        const exercise = exerciseMap[ex.exerciseId];
        return {
          ...ex,
          name: exercise?.name || 'Exercise',
          mediaThumb: exercise?.media_thumb || null,
        };
      });

      return { ...workout, name: workoutName, totalSets, exercises: enrichedExercises };
    } catch {
      return null;
    }
  }, [todayWorkout, plan, exerciseMap, profile, getWorkoutName]);

  const handleStartWorkout = () => {
    if (todayWorkoutDetails) {
      navigation.navigate('SessionPlayer', {
        workout: todayWorkoutDetails,
        planId: plan?.id
      });
    }
  };

  // Check if today's workout is saved
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!plan?.id || !todayWorkout?.dayNumber || !profile) return;
      const duration = (profile.session_duration && [30, 45, 60, 90].includes(profile.session_duration))
        ? profile.session_duration as 30 | 45 | 60 | 90
        : 45;
      const saved = await isWorkoutSaved(userId, plan.id, todayWorkout.dayNumber, duration);
      setIsTodayWorkoutSaved(saved);
    };
    checkSavedStatus();
  }, [plan?.id, todayWorkout?.dayNumber, userId, profile]);

  const handleSaveWorkout = async () => {
    if (!todayWorkoutDetails || !plan?.id || !todayWorkout?.dayNumber) return;

    const duration = (profile?.session_duration && [30, 45, 60, 90].includes(profile.session_duration))
      ? profile.session_duration as 30 | 45 | 60 | 90
      : 45;

    try {
      if (isTodayWorkoutSaved) {
        // Unsave - find and delete
        const saved = await findSavedWorkout(userId, plan.id, todayWorkout.dayNumber, duration);
        if (saved) {
          await deleteSavedWorkout(saved.id);
          setIsTodayWorkoutSaved(false);
        }
      } else {
        // Save
        await saveWorkout(userId, {
          planId: plan.id,
          dayNumber: todayWorkout.dayNumber,
          duration,
          name: todayWorkoutDetails.name,
          data: todayWorkoutDetails,
        });
        setIsTodayWorkoutSaved(true);
      }
    } catch (error) {
      console.error('Error saving/unsaving workout:', error);
    }
  };

  const weekDays = useMemo(() => {
    if (!plan || !plan.days || plan.days.length === 0 || !profile) return [];
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const duration = (profile.session_duration && [30, 45, 60, 90].includes(profile.session_duration))
      ? profile.session_duration as 30 | 45 | 60 | 90
      : 45;

    const daysInWeek = plan.days.filter(day => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate >= startOfWeek && dayDate < endOfWeek;
    });

    return daysInWeek.map(day => {
      const workout = getWorkoutFromPlan(plan as any, day.dayNumber, duration);
      return {
        day,
        workout,
        workoutName: workout ? getWorkoutName(workout) : undefined,
        completed: false,
      };
    });
  }, [plan, profile, exerciseMap, getWorkoutName]);

  // Filter out today from upcoming workouts (today is shown in TodayWorkoutCard)
  const upcomingWeekDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return weekDays.filter(wd => {
      const wdDate = new Date(wd.day.date);
      wdDate.setHours(0, 0, 0, 0);
      return wdDate.getTime() !== today.getTime();
    });
  }, [weekDays]);

  // Loading
  if (profileLoading || planLoading || !profile) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingDot} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Safe area spacer */}
        <View style={{ height: insets.top + 8 }} />

        {/* 1. Welcome Section */}
        <WelcomeSection />

        {/* 2. Week Calendar */}
        {plan && plan.days && plan.days.length > 0 && (
          <View style={styles.weekSection}>
            <ThisWeekSection weekDays={weekDays} todayName={todayName} />
          </View>
        )}

        {/* 3. Stats Section (below welcome) */}
        <View style={styles.statsSection}>
          <StatsRow
            streak={currentStreak}
            weekProgress={`${weeklyStats?.completedWorkouts || weekProgress || 0}/5`}
            total={workoutsCompleted}
          />
        </View>

        {/* 4. Safety Reminder (above workout card) */}
        <TodaysReminderCard />

        {/* 5. Today's Workout - Hero Card */}
        <View style={styles.workoutSection}>
          {plan && todayWorkoutDetails ? (
            <TodayWorkoutCard
              workout={todayWorkoutDetails}
              onStartWorkout={handleStartWorkout}
              onSaveWorkout={handleSaveWorkout}
              isSaved={isTodayWorkoutSaved}
            />
          ) : (
            <View style={styles.restDayCard}>
              <LinearGradient
                colors={['#141418', '#0A0A0C']}
                style={StyleSheet.absoluteFill}
              />
              {/* Subtle pink glow for rest day */}
              <LinearGradient
                colors={['rgba(245, 169, 184, 0.1)', 'transparent']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.restDayGlow}
              />
              <Text style={styles.restDayTitle}>REST DAY</Text>
              <Text style={styles.restDaySubtitle}>Recovery is part of progress</Text>
            </View>
          )}
        </View>

        {/* 6. Upcoming Workouts (below stats) */}
        {plan && plan.days && plan.days.length > 0 && (
          <UpcomingWorkoutsSection
            weekDays={weekDays}
            exerciseMap={exerciseMap}
            userId={userId}
            planId={plan.id}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  weekSection: {
    marginBottom: 0,
  },
  workoutSection: {
    marginBottom: 12,
  },
  statsSection: {
    marginBottom: 4,
  },
  restDayCard: {
    height: 180,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glass.borderPink,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.secondary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: { elevation: 6 },
    }),
  },
  restDayGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  restDayTitle: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '300',
    color: colors.accent.secondary,
    letterSpacing: 2,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        textShadowColor: colors.accent.secondaryGlow,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 12,
      },
    }),
  },
  restDaySubtitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.disabled,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent.primary,
  },
});
