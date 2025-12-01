import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
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
import { colors, spacing, borderRadius } from '../../theme/theme';
import { glassStyles } from '../../theme/components';
import type { Exercise } from '../../types';

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
};

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  StackNavigationProp<MainStackParamList>
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { plan } = usePlan();

  const [currentStreak, setCurrentStreak] = useState(0);
  const [workoutsCompleted, setWorkoutsCompleted] = useState(0);
  const [weekProgress, setWeekProgress] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [exerciseMap, setExerciseMap] = useState<Record<string, Exercise>>({});

  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[today.getDay()];
  const todayDayNumber = today.getDay() === 0 ? 7 : today.getDay(); // Monday = 1, Sunday = 7

  // Load exercise library
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const exercises = await getExerciseLibrary();
        const map: Record<string, Exercise> = {};
        exercises.forEach(ex => {
          map[ex.id] = ex;
          map[String(ex.id)] = ex; // Support both string and number IDs
        });
        setExerciseMap(map);
      } catch (error) {
        console.error('Error loading exercises:', error);
      }
    };
    loadExercises();
  }, []);

  // Generate workout name based on exercise patterns
  const getWorkoutName = useCallback((workout: any, dayIndex?: number): string => {
    if (!workout || !workout.exercises) return 'Workout';
    
    const exercises = workout.exercises
      .map((ei: any) => exerciseMap[ei.exerciseId] || exerciseMap[String(ei.exerciseId)])
      .filter(Boolean);
    
    const hasLowerBody = exercises.some((ex: Exercise) => {
      const tags = ex?.tags || [];
      const pattern = ex?.pattern?.toLowerCase() || '';
      return tags.some((t: string) => 
        t.includes('lower') || t.includes('leg') || t.includes('glute') || 
        t.includes('squat') || t.includes('deadlift')
      ) || pattern.includes('lower') || pattern.includes('leg') || 
         pattern.includes('squat') || pattern.includes('deadlift');
    });
    
    const hasUpperBody = exercises.some((ex: Exercise) => {
      const tags = ex?.tags || [];
      const pattern = ex?.pattern?.toLowerCase() || '';
      return tags.some((t: string) => 
        t.includes('upper') || t.includes('push') || t.includes('pull') || 
        t.includes('chest') || t.includes('shoulder')
      ) || pattern.includes('upper') || pattern.includes('push') || 
         pattern.includes('pull');
    });
    
    if (hasLowerBody && !hasUpperBody) return 'Lower Body & Core';
    if (hasUpperBody && !hasLowerBody) return 'Upper Body';
    if (dayIndex === 0) return 'Full Body A';
    if (dayIndex === 2) return 'Full Body B';
    return 'Full Body';
  }, [exerciseMap]);

  // Get today's workout from plan
  const todaysWorkout = useMemo(() => {
    if (!plan || !profile) return null;

    const todayDay = plan.days.find(d => {
      const dayDate = new Date(d.date);
      return (
        dayDate.getDate() === today.getDate() &&
        dayDate.getMonth() === today.getMonth() &&
        dayDate.getFullYear() === today.getFullYear()
      );
    });

    if (!todayDay) return null;

    const duration = (profile.session_duration as 30 | 45 | 60 | 90) || 45;
    const workout = todayDay.variants[duration];
    
    if (!workout) return null;

    // Generate workout name based on exercise patterns
    const workoutName = getWorkoutName(workout, todayDay.dayNumber);
    
    return {
      name: workoutName,
      duration: duration,
      exercises: workout.exercises.length,
      workout: workout,
      day: todayDay,
    };
  }, [plan, profile, today, exerciseMap, getWorkoutName]);

  // Get weekly schedule
  const weeklySchedule = useMemo(() => {
    if (!plan) return [];

    const schedule: Array<{
      day: string;
      name: string;
      hasWorkout: boolean;
      dayNumber: number;
      month: string;
      date: Date;
      workout?: any;
    }> = [];

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      const dayName = dayNames[date.getDay()].slice(0, 3);
      const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      
      const planDay = plan.days.find(d => {
        const dayDate = new Date(d.date);
        return (
          dayDate.getDate() === date.getDate() &&
          dayDate.getMonth() === date.getMonth() &&
          dayDate.getFullYear() === date.getFullYear()
        );
      });

      if (planDay) {
        const duration = (profile?.session_duration as 30 | 45 | 60 | 90) || 45;
        const workout = planDay.variants[duration];
        
        const workoutName = workout ? getWorkoutName(workout, planDay.dayNumber) : 'Rest Day';
        
        schedule.push({
          day: dayName,
          name: workoutName,
          hasWorkout: !!workout,
          dayNumber: date.getDate(),
          month: month,
          date: date,
          workout: workout,
        });
      } else {
        schedule.push({
          day: dayName,
          name: 'Rest Day',
          hasWorkout: false,
          dayNumber: date.getDate(),
          month: month,
          date: date,
        });
      }
    }

    return schedule;
  }, [plan, profile, exerciseMap, getWorkoutName]);

  useEffect(() => {
    loadStats();
  }, [profile]);

  const loadStats = async () => {
    if (!profile) return;

    try {
      const userId = profile.user_id || profile.id || 'default';
      const [streak, stats] = await Promise.all([
        getCurrentStreak(userId),
        getWeeklyStats(userId),
      ]);
      
      setCurrentStreak(streak);
      setWeeklyStats(stats);
      setWorkoutsCompleted(stats.totalWorkouts || 0);
      setWeekProgress(stats.completedWorkouts || 0);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleStartWorkout = () => {
    if (todaysWorkout?.workout) {
      navigation.navigate('SessionPlayer', {
        workout: todaysWorkout.workout,
        planId: plan?.id,
      });
    }
  };

  const handleViewSchedule = () => {
    navigation.navigate('Workouts');
  };

  const handleViewProfile = () => {
    navigation.navigate('Settings');
  };

  const handleViewProgress = () => {
    navigation.navigate('Progress');
  };

  const handleScheduleItemPress = (item: typeof weeklySchedule[0]) => {
    if (item.hasWorkout && item.workout) {
      navigation.navigate('SessionPlayer', {
        workout: item.workout,
        planId: plan?.id,
      });
    }
  };

  if (!profile) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bg.deep, colors.bg.mid]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>
              {getGreeting()}, {profile.pronouns?.split('/')[0] || 'there'}
            </Text>
            <Text style={styles.headerTitle}>Ready to Train?</Text>
          </View>
          <TouchableOpacity
            onPress={handleViewProfile}
            style={styles.profileButton}
            activeOpacity={0.7}
          >
            <Ionicons name="person-outline" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards Row */}
        <View style={styles.statsRow}>
          {/* Streak */}
          <View style={styles.statCard}>
            <Ionicons name="flame" size={24} color={colors.red[500]} style={styles.statIcon} />
            <Text style={[styles.statValue, { color: colors.red[500] }]}>{currentStreak}</Text>
            <Text style={styles.statLabel}>DAY STREAK</Text>
        </View>

          {/* Workouts */}
          <View style={styles.statCard}>
            <Ionicons name="barbell-outline" size={24} color={colors.cyan[500]} style={styles.statIcon} />
            <Text style={[styles.statValue, { color: colors.cyan[500] }]}>{workoutsCompleted}</Text>
            <Text style={styles.statLabel}>COMPLETED</Text>
              </View>

          {/* Week Progress */}
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={24} color={colors.cyan[500]} style={styles.statIcon} />
            <Text style={[styles.statValue, { color: colors.cyan[500] }]}>
              {weekProgress}/{profile.workout_frequency || 4}
            </Text>
            <Text style={styles.statLabel}>THIS WEEK</Text>
          </View>
        </View>

        {/* Today's Workout Card */}
        {todaysWorkout && (
            <View style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
              <View>
                <Text style={styles.workoutDayLabel}>{todayName.toUpperCase()}</Text>
                <Text style={styles.workoutName}>{todaysWorkout.name}</Text>
                <View style={styles.workoutMeta}>
                  <View style={styles.workoutMetaItem}>
                    <Ionicons name="time-outline" size={16} color={colors.cyan[500]} />
                    <Text style={styles.workoutMetaText}>{todaysWorkout.duration} min</Text>
                  </View>
                  <View style={styles.workoutMetaItem}>
                    <Ionicons name="barbell-outline" size={16} color={colors.cyan[500]} />
                    <Text style={styles.workoutMetaText}>{todaysWorkout.exercises} exercises</Text>
                  </View>
                </View>
              </View>
                </View>

            {/* Safety Badges */}
            <View style={styles.badgesContainer}>
              {profile.binds_chest && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>BINDING-SAFE</Text>
                    </View>
                  )}
              {profile.on_hrt && (
                <View style={[styles.badge, styles.badgeBlue]}>
                  <Text style={[styles.badgeText, styles.badgeTextBlue]}>HRT-OPTIMIZED</Text>
                </View>
              )}
              {profile.surgeries && profile.surgeries.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>POST-SURGERY SAFE</Text>
                </View>
              )}
            </View>

            {/* Start Button */}
            <TouchableOpacity
              onPress={handleStartWorkout}
              style={styles.startButton}
              activeOpacity={0.8}
            >
                <LinearGradient
                colors={[colors.cyan[500], colors.cyan[600]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                style={styles.startButtonGradient}
                >
                <Text style={styles.startButtonText}>Start Workout</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.text.primary} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
        )}

        {/* Weekly Schedule Preview */}
        <View style={styles.scheduleSection}>
          <View style={styles.scheduleHeader}>
            <Text style={styles.scheduleTitle}>This Week</Text>
            <TouchableOpacity onPress={handleViewSchedule}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
              </View>

          <View style={styles.scheduleList}>
            {weeklySchedule.slice(0, 5).map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleScheduleItemPress(item)}
                disabled={!item.hasWorkout}
                style={[
                  styles.scheduleItem,
                  item.hasWorkout && styles.scheduleItemActive,
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.scheduleItemContent}>
                  <View
                    style={[
                      styles.scheduleDateBox,
                      item.hasWorkout && styles.scheduleDateBoxActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.scheduleMonth,
                        item.hasWorkout && styles.scheduleMonthActive,
                      ]}
                    >
                      {item.month}
                    </Text>
                    <Text
                      style={[
                        styles.scheduleDayNumber,
                        item.hasWorkout && styles.scheduleDayNumberActive,
                      ]}
                    >
                      {item.dayNumber}
                    </Text>
                  </View>
                  <View style={styles.scheduleItemInfo}>
                    <View style={styles.scheduleItemHeader}>
                      <Text style={styles.scheduleDayName}>{item.day}</Text>
                      {!item.hasWorkout && (
                        <View style={styles.restBadge}>
                          <Text style={styles.restBadgeText}>Rest</Text>
            </View>
          )}
        </View>
                    <Text style={styles.scheduleItemName}>{item.name}</Text>
                    {item.hasWorkout && (
                      <View style={styles.scheduleItemMeta}>
                        <View style={styles.scheduleItemMetaItem}>
                          <Ionicons name="time-outline" size={12} color={colors.text.tertiary} />
                          <Text style={styles.scheduleItemMetaText}>
                            {profile?.session_duration || 45} min
              </Text>
            </View>
                        <View style={styles.scheduleItemMetaItem}>
                          <Ionicons name="barbell-outline" size={12} color={colors.text.tertiary} />
                          <Text style={styles.scheduleItemMetaText}>
                            {index % 2 === 0 ? '4' : '5'} exercises
              </Text>
            </View>
          </View>
                    )}
                  </View>
              </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={item.hasWorkout ? colors.cyan[500] : colors.text.disabled}
                />
            </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Tips Card */}
        {(profile.binds_chest || profile.on_hrt || (profile.surgeries && profile.surgeries.length > 0)) && (
          <View style={styles.tipsCard}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.semantic.info} />
            <View style={styles.tipsContent}>
              <Text style={styles.tipsTitle}>Today's Reminder</Text>
              <Text style={styles.tipsText}>
                {profile.binds_chest &&
                  "Remember to remove your binder if you feel any discomfort during your workout."}
                {!profile.binds_chest &&
                  profile.on_hrt &&
                  "Stay hydrated during your workout - HRT can affect your recovery needs."}
                {!profile.binds_chest &&
                  !profile.on_hrt &&
                  profile.surgeries &&
                  profile.surgeries.length > 0 &&
                  "Listen to your body and don't push through pain during recovery."}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    ...glassStyles.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['3xl'],
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: 'Anton',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: colors.text.primary,
  },
  profileButton: {
    width: 48,
    height: 48,
    ...glassStyles.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    ...glassStyles.card,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
  },
  statIcon: {
    marginBottom: spacing.xs,
  },
  statValue: {
    fontFamily: 'Anton',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
    ...Platform.select({
      ios: {
        textShadowColor: colors.cyan[500],
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
        textShadowOpacity: 0.4,
      },
    }),
  },
  statLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.text.tertiary,
  },
  workoutCard: {
    ...glassStyles.cardHero,
    borderRadius: borderRadius['3xl'],
    padding: spacing['2xl'],
    marginBottom: spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: colors.cyan[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 32,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  workoutHeader: {
    marginBottom: spacing.base,
  },
  workoutDayLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  workoutName: {
    fontFamily: 'Anton',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  workoutMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workoutMetaText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.cyan[500],
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.lg,
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  badgeBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  badgeText: {
    fontFamily: 'Poppins',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.semantic.success,
  },
  badgeTextBlue: {
    color: colors.semantic.info,
  },
  startButton: {
    height: 56,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.cyan[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  startButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  startButtonText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  scheduleSection: {
    marginBottom: spacing.xl,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  scheduleTitle: {
    fontFamily: 'Anton',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.1,
    color: colors.text.primary,
  },
  viewAllText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.cyan[500],
  },
  scheduleList: {
    gap: spacing.md,
  },
  scheduleItem: {
    ...glassStyles.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleItemActive: {
    backgroundColor: colors.glass.bgHero,
    borderColor: colors.glass.borderCyan,
    ...Platform.select({
      ios: {
        shadowColor: colors.cyan[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
    }),
  },
  scheduleItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    flex: 1,
  },
  scheduleDateBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.base,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleDateBoxActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: colors.cyan[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
    }),
  },
  scheduleMonth: {
    fontFamily: 'Poppins',
    fontSize: 8,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  scheduleMonthActive: {
    color: colors.cyan[500],
  },
  scheduleDayNumber: {
    fontFamily: 'Anton',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: colors.text.primary,
  },
  scheduleDayNumberActive: {
    color: colors.cyan[500],
    ...Platform.select({
      ios: {
        textShadowColor: colors.cyan[500],
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
        textShadowOpacity: 0.4,
      },
    }),
  },
  scheduleItemInfo: {
    flex: 1,
  },
  scheduleItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  scheduleDayName: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    color: colors.text.tertiary,
  },
  restBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  restBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: colors.semantic.success,
  },
  scheduleItemName: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  scheduleItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 4,
  },
  scheduleItemMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scheduleItemMetaText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.tertiary,
  },
  tipsCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: colors.semantic.info,
    marginBottom: 4,
  },
  tipsText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.text.secondary,
  },
});
