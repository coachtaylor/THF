import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile } from '../../hooks/useProfile';
import { usePlan } from '../../hooks/usePlan';
import { getCurrentStreak, getWeeklyStats, type WeeklyStats } from '../../services/storage/stats';
import { getWorkoutFromPlan } from '../../services/planGenerator';
import { getExerciseLibrary } from '../../data/exercises';
import { colors, spacing, borderRadius, typography } from '../../theme/theme';
import { textStyles } from '../../theme/components';
import type { Exercise } from '../../types';
import StatCard from '../../components/home/Statcard';
import TodayWorkoutCard from '../../components/home/TodayWorkoutCard';
import ThisWeekSection from '../../components/home/ThisWeekSection';
import TodaysReminderCard from '../../components/home/TodaysReminderCard';

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
  const { plan, loading: planLoading } = usePlan(userId);

  const [currentStreak, setCurrentStreak] = useState(0);
  const [workoutsCompleted, setWorkoutsCompleted] = useState(0);
  const [weekProgress, setWeekProgress] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [exerciseMap, setExerciseMap] = useState<Record<string, Exercise>>({});

  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[today.getDay()];
  const todayDayNumber = today.getDay() === 0 ? 7 : today.getDay();

  // Load exercise library
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
        const userId = profile.user_id || profile.id || 'default';
        const streak = await getCurrentStreak(userId);
        const stats = await getWeeklyStats(userId);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

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

  const todayWorkoutDetails = useMemo(() => {
    if (!todayWorkout || !plan || !profile) return null;
    
    try {
      // Get workout duration from profile, default to 45
      const duration = (profile.session_duration && [30, 45, 60, 90].includes(profile.session_duration))
        ? profile.session_duration as 30 | 45 | 60 | 90
        : 45;
      
      const workout = getWorkoutFromPlan(plan as any, todayWorkout.dayNumber, duration);
      if (!workout || !workout.exercises || workout.exercises.length === 0) {
        return null;
      }

      // Generate workout name based on exercise patterns
      const getWorkoutName = (workout: any): string => {
        if (!workout.exercises || workout.exercises.length === 0) {
          return 'Workout';
        }

        const exerciseIds = workout.exercises.map((e: any) => e.exerciseId);
        const exercises = exerciseIds
          .map((id: string) => exerciseMap[id])
          .filter((ex: Exercise | undefined): ex is Exercise => !!ex);

        if (exercises.length === 0) return 'Workout';

        // Parse target_muscles and secondary_muscles (they're strings, not arrays)
        const allMuscles: string[] = [];
        exercises.forEach((ex: Exercise) => {
          if (ex.target_muscles) {
            const muscles = ex.target_muscles.split(',').map((m: string) => m.trim());
            allMuscles.push(...muscles);
          }
          if (ex.secondary_muscles) {
            const muscles = ex.secondary_muscles.split(',').map((m: string) => m.trim());
            allMuscles.push(...muscles);
          }
        });
        
        const uniqueMuscles = [...new Set(allMuscles)];

        // Check patterns (pattern is a string like "push", "pull", "squat", etc.)
        const hasPush = exercises.some((ex: Exercise) => ex.pattern?.toLowerCase().includes('push'));
        const hasPull = exercises.some((ex: Exercise) => ex.pattern?.toLowerCase().includes('pull'));
        const hasSquat = exercises.some((ex: Exercise) => ex.pattern?.toLowerCase().includes('squat') || ex.pattern?.toLowerCase().includes('lower'));

        if (uniqueMuscles.some(m => m.includes('Chest')) && uniqueMuscles.some(m => m.includes('Triceps'))) {
          return 'Chest & Triceps';
        } else if (uniqueMuscles.some(m => m.includes('Back')) && uniqueMuscles.some(m => m.includes('Biceps'))) {
          return 'Back & Biceps';
        } else if (uniqueMuscles.some(m => m.includes('Quadriceps') || m.includes('Glutes'))) {
          return 'Lower Body';
        } else if (hasPush || uniqueMuscles.some(m => m.includes('Chest'))) {
          return 'Upper Body Push';
        } else if (hasPull || uniqueMuscles.some(m => m.includes('Back'))) {
          return 'Upper Body Pull';
        } else if (exercises.length >= 5) {
          return 'Full Body';
        }

        return 'Workout';
      };

      const workoutName = getWorkoutName(workout);
      const totalSets = workout.exercises.reduce((sum: number, e: any) => sum + (e.sets || 0), 0);

      return {
        ...workout,
        name: workoutName,
        totalSets,
      };
    } catch (error) {
      console.error('Error getting workout details:', error);
      return null;
    }
  }, [todayWorkout, plan, exerciseMap, profile]);

  const handleStartWorkout = () => {
    if (todayWorkoutDetails) {
      navigation.navigate('SessionPlayer', { 
        workout: todayWorkoutDetails,
        planId: plan?.id 
      });
    }
  };

  const handleViewProfile = () => {
    navigation.navigate('Profile');
  };

  // Helper function to generate workout name (same logic as todayWorkoutDetails)
  const getWorkoutName = useCallback((workout: any): string => {
    if (!workout?.exercises || workout.exercises.length === 0) {
      return 'Workout';
    }

    const exerciseIds = workout.exercises.map((e: any) => e.exerciseId);
    const exercises = exerciseIds
      .map((id: string) => exerciseMap[id])
      .filter((ex: Exercise | undefined): ex is Exercise => !!ex);

    if (exercises.length === 0) return 'Workout';

    // Parse target_muscles and secondary_muscles (they're strings, not arrays)
    const allMuscles: string[] = [];
    exercises.forEach((ex: Exercise) => {
      if (ex.target_muscles) {
        const muscles = ex.target_muscles.split(',').map((m: string) => m.trim());
        allMuscles.push(...muscles);
      }
      if (ex.secondary_muscles) {
        const muscles = ex.secondary_muscles.split(',').map((m: string) => m.trim());
        allMuscles.push(...muscles);
      }
    });
    
    const uniqueMuscles = [...new Set(allMuscles)];

    // Check patterns (pattern is a string like "push", "pull", "squat", etc.)
    const hasPush = exercises.some((ex: Exercise) => ex.pattern?.toLowerCase().includes('push'));
    const hasPull = exercises.some((ex: Exercise) => ex.pattern?.toLowerCase().includes('pull'));

    if (uniqueMuscles.some(m => m.includes('Chest')) && uniqueMuscles.some(m => m.includes('Triceps'))) {
      return 'Chest & Triceps';
    } else if (uniqueMuscles.some(m => m.includes('Back')) && uniqueMuscles.some(m => m.includes('Biceps'))) {
      return 'Back & Biceps';
    } else if (uniqueMuscles.some(m => m.includes('Quadriceps') || m.includes('Glutes'))) {
      return 'Lower Body';
    } else if (hasPush || uniqueMuscles.some(m => m.includes('Chest'))) {
      return 'Upper Body Push';
    } else if (hasPull || uniqueMuscles.some(m => m.includes('Back'))) {
      return 'Upper Body Pull';
    } else if (exercises.length >= 5) {
      return 'Full Body';
    }

    return 'Workout';
  }, [exerciseMap]);

  const weekDays = useMemo(() => {
    if (!plan || !plan.days || plan.days.length === 0 || !profile) return [];
    
    // Get start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    endOfWeek.setHours(0, 0, 0, 0);

    // Get workout duration from profile, default to 45
    const duration = (profile.session_duration && [30, 45, 60, 90].includes(profile.session_duration))
      ? profile.session_duration as 30 | 45 | 60 | 90
      : 45;

    // Filter days in current week and transform to include workout info
    const daysInWeek = plan.days.filter(day => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate >= startOfWeek && dayDate < endOfWeek;
    });

    // Transform to include workout information
    return daysInWeek.map(day => {
      const workout = getWorkoutFromPlan(plan as any, day.dayNumber, duration);
      const workoutName = workout ? getWorkoutName(workout) : undefined;
      
      return {
        day,
        workout,
        workoutName,
        completed: false, // TODO: Check if workout is completed
      };
    });
  }, [plan, profile, exerciseMap, getWorkoutName]);

  const userName = profile?.pronouns?.split('/')[0] || 'there';

  // Debug logging
  useEffect(() => {
    console.log('🔍 HomeScreen Debug:', {
      profileLoading,
      planLoading,
      hasProfile: !!profile,
      hasPlan: !!plan,
      profileId: profile?.id || profile?.user_id,
      planId: plan?.id,
      planDays: plan?.days?.length,
      userId: userId,
    });
  }, [profileLoading, planLoading, profile, plan, userId]);

  // Show loading state if still loading
  if (profileLoading || planLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.bg.deep, colors.bg.mid]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView edges={['top']} style={styles.headerContainer}>
          <Text style={styles.subTitle}>Loading...</Text>
        </SafeAreaView>
      </View>
    );
  }

  // If no profile, show minimal loading state
  if (!profile) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.bg.deep, colors.bg.mid]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView edges={['top']} style={styles.headerContainer}>
          <Text style={styles.subTitle}>Loading...</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bg.deep, colors.bg.mid]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.mainTitle}>{getGreeting()}, {userName}</Text>
            <Text style={styles.subTitle}>Ready to Train?</Text>
          </View>
        </View>
        
        {/* Stats Cards Row */}
        <View style={styles.statsRow}>
          <StatCard
            value={currentStreak}
            label="DAY STREAK"
            colorVariant="red"
            iconType="flame"
          />
          <StatCard
            value={`${weeklyStats?.completedWorkouts || weekProgress || 0}/5`}
            label="THIS WEEK"
            colorVariant="cyan"
            iconType="time"
          />
          <StatCard
            value={workoutsCompleted}
            label="COMPLETED"
            colorVariant="cyan"
            iconType="dumbbell"
          />
        </View>
      </SafeAreaView>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's Reminder - should be first */}
        <TodaysReminderCard />

        {/* Today's Workout Section */}
        <Text style={styles.sectionTitle}>Todays Workout</Text>
        {plan && todayWorkoutDetails ? (
          <TodayWorkoutCard
            workout={todayWorkoutDetails}
            onStartWorkout={handleStartWorkout}
          />
        ) : (
          <View style={styles.emptyWorkoutCard}>
            <Ionicons name="calendar-outline" size={40} color={colors.text.tertiary} />
            <Text style={styles.emptyWorkoutText}>
              {!plan ? 'No workout plan found' : 'No workout scheduled today'}
            </Text>
            <Text style={styles.emptyWorkoutSubtext}>
              {!plan ? 'Generate a workout plan to see your dashboard' : 'Take a rest day or browse workouts'}
            </Text>
          </View>
        )}

        {/* This Week */}
        {plan && plan.days && plan.days.length > 0 ? (
          <ThisWeekSection weekDays={weekDays} todayName={todayName} />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.deep,
  },
  headerContainer: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.l, // Reduced padding to match Figma
    paddingBottom: spacing.l,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.m,
  },
  headerContent: {
    flex: 1,
    gap: 2,
  },
  mainTitle: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: typography.weights.regular,
    color: colors.text.primary,
    letterSpacing: -0.4172,
    lineHeight: 33.6,
  },
  subTitle: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: typography.weights.regular,
    color: colors.text.tertiary,
    lineHeight: 26,
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: typography.weights.regular,
    color: colors.text.primary,
    lineHeight: 24,
    marginBottom: spacing.m,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.m,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16, // Gap between cards (16px from Figma - calculated from card positions: 114.33 - 98.33 = 16px)
    marginTop: spacing.m,
    justifyContent: 'flex-start', // Align cards to start (fixed width cards)
    alignItems: 'flex-start', // Prevent stretching
    flexWrap: 'nowrap', // Prevent wrapping
  },
  emptyWorkoutCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.l,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.l,
  },
  emptyWorkoutText: {
    ...textStyles.body,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.m,
  },
  emptyWorkoutSubtext: {
    ...textStyles.bodySmall,
    marginTop: spacing.xs,
  },
});