import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { useProfile } from '../../hooks/useProfile';
import { getTodaysWorkout } from '../../services/storage/workout';
import { getWeeklyStats, getCurrentStreak } from '../../services/storage/stats';
import { generatePlan } from '../../services/planGenerator';
import { savePlan } from '../../services/storage/plan';
import { palette, spacing, typography } from '../../theme';

type MainTabParamList = {
  Home: undefined;
  Workouts: undefined;
  Progress: undefined;
  Settings: undefined;
};

type MainStackParamList = {
  MainTabs: undefined;
  WorkoutOverview: { workoutId: string };
};

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  StackNavigationProp<MainStackParamList>
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();

  const [todaysWorkout, setTodaysWorkout] = useState<any>(null);
  const [weeklyStats, setWeeklyStats] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const userId = profile?.user_id || profile?.id || 'default';
      const [workout, stats, currentStreak] = await Promise.all([
        getTodaysWorkout(userId),
        getWeeklyStats(userId),
        getCurrentStreak(userId),
      ]);

      setTodaysWorkout(workout);
      setWeeklyStats(stats);
      setStreak(currentStreak);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkout = () => {
    if (todaysWorkout) {
      navigation.navigate('WorkoutOverview', { workoutId: todaysWorkout.id });
    }
  };

  const handleGeneratePlan = async () => {
    if (!profile) {
      Alert.alert('Profile Required', 'Please complete your profile in Settings first.');
      return;
    }

    setGeneratingPlan(true);
    try {
      // Ensure profile has required fields for plan generation
      const profileWithDefaults = {
        ...profile,
        block_length: profile.block_length || 1,
        goals: profile.goals || [profile.primary_goal || 'general_fitness'],
        goal_weighting: profile.goal_weighting || { primary: 100, secondary: 0 },
      };

      const plan = await generatePlan(profileWithDefaults);
      const userId = profile.user_id || profile.id || 'default';
      await savePlan(plan, userId);

      Alert.alert('Plan Generated!', 'Your workout plan has been created successfully.', [
        {
          text: 'OK',
          onPress: () => {
            // Reload dashboard to show today's workout
            loadDashboardData();
          },
        },
      ]);
    } catch (error) {
      console.error('Failed to generate plan:', error);
      Alert.alert(
        'Generation Failed',
        error instanceof Error ? error.message : 'Failed to generate workout plan. Please try again.'
      );
    } finally {
      setGeneratingPlan(false);
    }
  };

  const getUserName = () => {
    if (profile?.pronouns) {
      const firstPronoun = profile.pronouns.split('/')[0];
      return firstPronoun.charAt(0).toUpperCase() + firstPronoun.slice(1);
    }
    return 'friend';
  };

  const handleProfilePress = () => {
    navigation.navigate('Settings');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu" size={28} color={palette.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TransFitness</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color={palette.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={handleProfilePress}>
            <Ionicons name="person-circle-outline" size={28} color={palette.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Message */}
        <Text style={styles.welcome}>
          Welcome back, {getUserName()}! 👋
        </Text>

        {/* Streak Card */}
        <View style={styles.streakCard}>
          <Text style={styles.streakText}>
            🔥 {streak}-Day Streak  •  {weeklyStats?.totalWorkouts || 0} Workouts Completed
          </Text>
        </View>

        {/* Today's Workout */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📅 Today's Workout</Text>
        </View>

        {todaysWorkout ? (
          <View style={styles.workoutCard}>
            <Text style={styles.workoutName}>{todaysWorkout.workout_name}</Text>
            <Text style={styles.workoutDate}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • {todaysWorkout.estimated_duration_minutes} min
            </Text>

            <View style={styles.workoutSummary}>
              <Text style={styles.summaryItem}>▸ Warm-up ({todaysWorkout.warm_up?.total_duration_minutes || 5} min)</Text>
              <Text style={styles.summaryItem}>▸ {todaysWorkout.main_workout?.length || 0} exercises • {todaysWorkout.total_sets || 0} total sets</Text>
              <Text style={styles.summaryItem}>▸ Cool-down ({todaysWorkout.cool_down?.total_duration_minutes || 5} min)</Text>
            </View>

            {/* Safety Indicators */}
            <View style={styles.safetyIndicators}>
              {profile?.binds_chest && (
                <Text style={styles.safetyText}>✓ Binding-safe</Text>
              )}
              {profile?.surgeries && profile.surgeries.length > 0 && (
                <Text style={styles.safetyText}>✓ Post-op cleared</Text>
              )}
            </View>

            {/* Checkpoints */}
            {todaysWorkout.safety_checkpoints && todaysWorkout.safety_checkpoints.length > 0 && (
              <View style={styles.warningBanner}>
                <Ionicons name="warning" size={16} color={palette.warning} />
                <Text style={styles.warningText}>
                  {todaysWorkout.safety_checkpoints[0].message}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartWorkout}
            >
              <Text style={styles.startButtonText}>Start Workout →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noWorkoutCard}>
            <Text style={styles.noWorkoutText}>No workout scheduled for today</Text>
            <TouchableOpacity
              style={[styles.generateButton, generatingPlan && styles.generateButtonDisabled]}
              onPress={handleGeneratePlan}
              disabled={generatingPlan}
            >
              {generatingPlan ? (
                <View style={styles.generateButtonLoading}>
                  <ActivityIndicator size="small" color={palette.deepBlack} />
                  <Text style={styles.generateButtonText}>Generating...</Text>
                </View>
              ) : (
                <Text style={styles.generateButtonText}>Generate Workout Plan</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* This Week's Progress */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📊 This Week's Progress</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Workouts</Text>
            <Text style={styles.statValue}>
              {weeklyStats?.completedWorkouts || 0}/{weeklyStats?.scheduledWorkouts || 4}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Volume</Text>
            <Text style={styles.statValue}>
              {(weeklyStats?.totalVolume || 0).toLocaleString()} lbs
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg RPE</Text>
            <Text style={styles.statValue}>
              {(weeklyStats?.averageRPE || 0).toFixed(1)}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎯 Quick Actions</Text>
        </View>

        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={handleGeneratePlan}
            disabled={generatingPlan}
          >
            {generatingPlan ? (
              <ActivityIndicator size="small" color={palette.white} />
            ) : (
              <Text style={styles.quickActionText}>Generate Plan</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Workouts')}
          >
            <Text style={styles.quickActionText}>View Program</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.quickActionText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  },
  headerIcons: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  headerIcon: {
    padding: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xxl,
  },
  welcome: {
    ...typography.h2,
    color: palette.white,
    marginTop: spacing.l,
    marginBottom: spacing.m,
  },
  streakCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.xl,
  },
  streakText: {
    ...typography.bodyLarge,
    color: palette.white,
    textAlign: 'center',
  },
  sectionHeader: {
    marginTop: spacing.l,
    marginBottom: spacing.m,
  },
  sectionTitle: {
    ...typography.h3,
    color: palette.white,
  },
  workoutCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 16,
    padding: spacing.l,
    marginBottom: spacing.l,
  },
  workoutName: {
    ...typography.h2,
    color: palette.white,
    marginBottom: spacing.xs,
  },
  workoutDate: {
    ...typography.body,
    color: palette.midGray,
    marginBottom: spacing.m,
  },
  workoutSummary: {
    gap: spacing.xs,
    marginBottom: spacing.m,
  },
  summaryItem: {
    ...typography.body,
    color: palette.lightGray,
  },
  safetyIndicators: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.m,
  },
  safetyText: {
    ...typography.bodySmall,
    color: palette.tealPrimary,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    backgroundColor: palette.warning + '20',
    padding: spacing.m,
    borderRadius: 8,
    marginBottom: spacing.m,
  },
  warningText: {
    ...typography.bodySmall,
    color: palette.warning,
    flex: 1,
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
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.l,
  },
  statCard: {
    flex: 1,
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
  },
  statLabel: {
    ...typography.bodySmall,
    color: palette.midGray,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.h2,
    color: palette.white,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
  },
  quickActionText: {
    ...typography.body,
    color: palette.white,
  },
  noWorkoutCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  noWorkoutText: {
    ...typography.body,
    color: palette.midGray,
    marginBottom: spacing.m,
  },
  generateButton: {
    backgroundColor: palette.tealPrimary,
    borderRadius: 12,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  generateButtonText: {
    ...typography.button,
    color: palette.deepBlack,
  },
});
