import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
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

// SVG Icon Components
const HamburgerIcon = () => (
  <View>
    <View style={{ width: 18, height: 2, backgroundColor: '#E0E4E8', marginVertical: 2, borderRadius: 1 }} />
    <View style={{ width: 18, height: 2, backgroundColor: '#E0E4E8', marginVertical: 2, borderRadius: 1 }} />
    <View style={{ width: 18, height: 2, backgroundColor: '#E0E4E8', marginVertical: 2, borderRadius: 1 }} />
  </View>
);

const FireIconSVG = () => (
  <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
    <Path
      d="M18 4 C14 8, 12 12, 14 16 C12 14, 10 16, 10 20 C10 26, 14 30, 18 32 C22 30, 26 26, 26 20 C26 16, 24 14, 22 16 C24 12, 22 8, 18 4 Z"
      fill="url(#fireGradient)"
    />
    <Defs>
      <SvgLinearGradient id="fireGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0" stopColor="#FF6B6B" />
        <Stop offset="1" stopColor="#FFB84D" />
      </SvgLinearGradient>
    </Defs>
  </Svg>
);

const CheckIconSVG = () => (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <Path
      d="M2 7 L5.5 10.5 L12 4"
      stroke="#00D9C0"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CalendarIconSVG = () => (
  <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
    <Rect x="6" y="10" width="28" height="24" rx="4" stroke="#00D9C0" strokeWidth="2" />
    <Path d="M6 16 L34 16" stroke="#00D9C0" strokeWidth="2" />
    <Path d="M12 6 L12 10 M28 6 L28 10" stroke="#00D9C0" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const RefreshIconSVG = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 12 C4 16.4 7.6 20 12 20 C16.4 20 20 16.4 20 12 C20 7.6 16.4 4 12 4 L12 8 L8 4 L12 0 L12 4"
      stroke="#00D9C0"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ProgramIconSVG = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" stroke="#00D9C0" strokeWidth="2" />
    <Path d="M3 10 L21 10" stroke="#00D9C0" strokeWidth="2" />
    <Path d="M8 4 L8 10 M16 4 L16 10" stroke="#00D9C0" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const SettingsIconSVG = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 15 C13.6569 15 15 13.6569 15 12 C15 10.3431 13.6569 9 12 9 C10.3431 9 9 10.3431 9 12 C9 13.6569 10.3431 15 12 15 Z"
      stroke="#00D9C0"
      strokeWidth="2"
    />
    <Path
      d="M19.4 15 L19.88 16.19 C20.1 16.7 20.1 17.3 19.88 17.81 L19.4 19 M4.6 15 L4.12 16.19 C3.9 16.7 3.9 17.3 4.12 17.81 L4.6 19 M19.4 9 L19.88 7.81 C20.1 7.3 20.1 6.7 19.88 6.19 L19.4 5 M4.6 9 L4.12 7.81 C3.9 7.3 3.9 6.7 4.12 6.19 L4.6 5 M12 5 L13.19 4.52 C13.7 4.3 14.3 4.3 14.81 4.52 L16 5 M12 19 L13.19 19.48 C13.7 19.7 14.3 19.7 14.81 19.48 L16 19 M5 12 L4.52 10.81 C4.3 10.3 4.3 9.7 4.52 9.19 L5 8 M19 12 L19.48 10.81 C19.7 10.3 19.7 9.7 19.48 9.19 L19 8"
      stroke="#00D9C0"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.menuButton}>
          <HamburgerIcon />
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
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcome}>Welcome back, {getUserName()}!</Text>
          <Text style={styles.welcomeSubtext}>Ready to crush today's workout?</Text>
        </View>

        {/* Streak Card */}
        <View style={styles.streakCardContainer}>
          <View style={styles.streakCard}>
            <LinearGradient
              colors={['rgba(0, 217, 192, 0.15)', 'rgba(167, 139, 250, 0.15)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            />
            <View style={styles.streakContent}>
              <View style={styles.streakLeft}>
                <Text style={styles.streakLabel}>Current Streak</Text>
                <Text style={styles.streakValue}>{streak}</Text>
                <Text style={styles.streakUnit}>days</Text>
              </View>
              <View style={styles.fireIconContainer}>
                <FireIconSVG />
              </View>
            </View>
            <Text style={styles.workoutsCompletedText}>
              {weeklyStats?.totalWorkouts || 0} workouts this week
            </Text>
          </View>
        </View>

        {/* Today's Workout */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Workout</Text>
          </View>

          {todaysWorkout ? (
            <View style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutName}>{todaysWorkout.workout_name}</Text>
                <View style={styles.workoutMetaRow}>
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaText}>{todaysWorkout.estimated_duration_minutes} min</Text>
                  </View>
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaText}>{todaysWorkout.total_sets || 0} sets</Text>
                  </View>
                </View>
              </View>

              <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryDot} />
                  <Text style={styles.summaryText}>
                    Warm-up ({todaysWorkout.warm_up?.total_duration_minutes || 5} min)
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryDot} />
                  <Text style={styles.summaryText}>
                    {todaysWorkout.main_workout?.length || 0} exercises
                  </Text>
                </View>
                <View style={[styles.summaryItem, styles.summaryItemLast]}>
                  <View style={styles.summaryDot} />
                  <Text style={styles.summaryText}>
                    Cool-down ({todaysWorkout.cool_down?.total_duration_minutes || 5} min)
                  </Text>
                </View>
              </View>

              {/* Safety Indicators */}
              {(profile?.binds_chest || (profile?.surgeries && profile.surgeries.length > 0)) && (
                <View style={styles.safetyRow}>
                  {profile?.binds_chest && (
                    <View style={styles.safetyBadge}>
                      <CheckIconSVG />
                      <Text style={styles.safetyText}>Binding-safe</Text>
                    </View>
                  )}
                  {profile?.surgeries && profile.surgeries.length > 0 && (
                    <View style={styles.safetyBadge}>
                      <CheckIconSVG />
                      <Text style={styles.safetyText}>Post-op cleared</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Warning Banner (Checkpoints) */}
              {todaysWorkout.safety_checkpoints && todaysWorkout.safety_checkpoints.length > 0 && (
                <View style={styles.warningBanner}>
                  <Ionicons name="warning" size={20} color={palette.warning} />
                  <Text style={styles.warningText}>
                    {todaysWorkout.safety_checkpoints[0].message}
                  </Text>
                </View>
              )}

              <TouchableOpacity style={styles.startButton} onPress={handleStartWorkout}>
                <LinearGradient
                  colors={['#00D9C0', '#00B39D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Start Workout</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noWorkoutCard}>
              <View style={styles.emptyStateIconContainer}>
                <CalendarIconSVG />
              </View>
              <Text style={styles.noWorkoutTitle}>No workout scheduled</Text>
              <Text style={styles.noWorkoutText}>
                Generate a new workout plan to get started
              </Text>
              <TouchableOpacity
                style={[styles.generateButton, generatingPlan && styles.generateButtonDisabled]}
                onPress={handleGeneratePlan}
                disabled={generatingPlan}
              >
                {generatingPlan ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#0F1419" />
                    <Text style={styles.generateButtonText}>Generating...</Text>
                  </View>
                ) : (
                  <Text style={styles.generateButtonText}>Generate Workout Plan</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* This Week's Progress */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>This Week's Progress</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {weeklyStats?.completedWorkouts || 0}/{weeklyStats?.scheduledWorkouts || 4}
              </Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {(weeklyStats?.totalVolume || 0).toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Total lbs</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {(weeklyStats?.averageRPE || 0).toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>Avg RPE</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.sectionContainer, styles.quickActionsContainer]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[styles.quickActionButton, generatingPlan && styles.quickActionButtonDisabled]}
              onPress={handleGeneratePlan}
              disabled={generatingPlan}
            >
              {generatingPlan ? (
                <ActivityIndicator size="small" color={palette.white} />
              ) : (
                <>
                  <View style={styles.actionIconContainer}>
                    <RefreshIconSVG />
                  </View>
                  <Text style={styles.quickActionText}>Generate Plan</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Workouts')}
            >
              <View style={styles.actionIconContainer}>
                <ProgramIconSVG />
              </View>
              <Text style={styles.quickActionText}>View Program</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <View style={styles.actionIconContainer}>
                <SettingsIconSVG />
              </View>
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
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
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1A1F26',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.white,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1A1F26',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  welcomeContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  welcome: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.white,
    lineHeight: 36,
  },
  welcomeSubtext: {
    fontSize: 15,
    fontWeight: '400',
    color: '#9CA3AF',
    marginTop: 4,
  },
  streakCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  streakCard: {
    borderRadius: 16,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: palette.darkCard,
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  streakContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakLeft: {
    flex: 1,
  },
  streakLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  streakValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#00D9C0',
    marginBottom: 2,
  },
  streakUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B8C5C5',
  },
  fireIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutsCompletedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 12,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.white,
  },
  workoutCard: {
    backgroundColor: '#1A1F26',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2F36',
  },
  workoutHeader: {
    marginBottom: 16,
  },
  workoutName: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.white,
    marginBottom: 6,
  },
  workoutMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaBadge: {
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A78BFA',
  },
  summaryContainer: {
    backgroundColor: '#151920',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryItemLast: {
    marginBottom: 0,
  },
  summaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00D9C0',
    marginRight: 12,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E0E4E8',
  },
  safetyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  safetyBadge: {
    backgroundColor: 'rgba(0, 217, 192, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  safetyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00D9C0',
  },
  warningBanner: {
    backgroundColor: 'rgba(255, 184, 77, 0.12)',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFB84D',
    flex: 1,
  },
  startButton: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F1419',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1F26',
    borderRadius: 14,
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
    textAlign: 'center',
  },
  quickActionsContainer: {
    marginBottom: 32,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 217, 192, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#1A1F26',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2F36',
    minHeight: 100,
  },
  quickActionButtonDisabled: {
    opacity: 0.5,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E0E4E8',
    textAlign: 'center',
  },
  noWorkoutCard: {
    backgroundColor: '#1A1F26',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2F36',
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 217, 192, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noWorkoutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.white,
    marginBottom: 6,
  },
  noWorkoutText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
  },
  generateButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00D9C0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  generateButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F1419',
  },
});
