import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { GlassCard, ProgressRing } from '../../components/common';
import { useProfile } from '../../hooks/useProfile';
import { getCurrentStreak, getWeeklyStats, type WeeklyStats } from '../../services/storage/stats';

type MainTabParamList = {
  Home: undefined;
  Workouts: undefined;
  Progress: undefined;
  Settings: undefined;
};

type ProgressScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Progress'>;

interface FeatureCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  accentColor: 'primary' | 'secondary';
}

function FeatureCard({ icon, title, description, accentColor }: FeatureCardProps) {
  const bgColor = accentColor === 'primary' ? colors.accent.primaryMuted : colors.accent.secondaryMuted;
  const iconColor = accentColor === 'primary' ? colors.accent.primary : colors.accent.secondary;

  return (
    <View style={styles.featureCard}>
      <View style={[styles.featureIconContainer, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ProgressScreenNavigationProp>();
  const { profile } = useProfile();

  // State for stats
  const [isLoading, setIsLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    completedWorkouts: 0,
    scheduledWorkouts: 4,
    totalVolume: 0,
    averageRPE: 0,
    totalWorkouts: 0,
  });

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const userId = profile?.user_id || 'default';
      const [currentStreak, stats] = await Promise.all([
        getCurrentStreak(userId),
        getWeeklyStats(userId),
      ]);
      setStreak(currentStreak);
      setWeeklyStats(stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate weekly completion percentage
  const weeklyProgress = weeklyStats.scheduledWorkouts > 0
    ? weeklyStats.completedWorkouts / weeklyStats.scheduledWorkouts
    : 0;

  // Format volume for display
  const formatVolume = (vol: number): string => {
    if (vol >= 1000) {
      return `${(vol / 1000).toFixed(1)}k`;
    }
    return vol.toString();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress</Text>
        <Pressable
          onPress={() => navigation.navigate('Settings')}
          style={styles.profileButton}
          hitSlop={8}
        >
          <Ionicons name="person-circle-outline" size={26} color={colors.text.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Weekly Progress Hero */}
        <GlassCard variant="hero" shimmer style={styles.heroCard}>
          {/* Progress rings */}
          <View style={styles.decorativeRings}>
            <ProgressRing
              progress={weeklyProgress}
              size={100}
              strokeWidth={4}
              color="primary"
            />
            <View style={styles.ringOverlay}>
              <ProgressRing
                progress={streak > 0 ? Math.min(streak / 7, 1) : 0}
                size={70}
                strokeWidth={3}
                color="secondary"
              />
              <View style={styles.ringCenter}>
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.accent.primary} />
                ) : (
                  <Text style={styles.streakNumber}>{streak}</Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              {streak > 0 ? `${streak} Day Streak` : 'Start Your Streak'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {weeklyStats.completedWorkouts}/{weeklyStats.scheduledWorkouts} This Week
            </Text>
            <Text style={styles.heroDescription}>
              {streak >= 7
                ? "A full week! You're building lasting habits."
                : streak > 0
                  ? "Keep it going! Consistency is your superpower."
                  : weeklyStats.completedWorkouts > 0
                    ? "You're making progress! Start a new streak today."
                    : "Your first workout starts your journey."}
            </Text>
          </View>
        </GlassCard>

        {/* Your Journey Stats */}
        <Text style={styles.sectionTitle}>Your Journey</Text>

        <View style={styles.statsGrid}>
          <GlassCard variant="default" style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.accent.primaryMuted }]}>
              <Ionicons name="barbell" size={20} color={colors.accent.primary} />
            </View>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.accent.primary} />
            ) : (
              <Text style={styles.statValue}>
                {weeklyStats.totalVolume > 0 ? formatVolume(weeklyStats.totalVolume) : '--'}
              </Text>
            )}
            <Text style={styles.statLabel}>Week Volume</Text>
          </GlassCard>

          <GlassCard variant="default" style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.accent.secondaryMuted }]}>
              <Ionicons name="flame" size={20} color={colors.accent.secondary} />
            </View>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.accent.secondary} />
            ) : (
              <Text style={styles.statValue}>{streak > 0 ? streak : '--'}</Text>
            )}
            <Text style={styles.statLabel}>Day Streak</Text>
          </GlassCard>

          <GlassCard variant="default" style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.accent.successMuted }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            </View>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.success} />
            ) : (
              <Text style={styles.statValue}>
                {weeklyStats.totalWorkouts > 0 ? weeklyStats.totalWorkouts : '--'}
              </Text>
            )}
            <Text style={styles.statLabel}>Total Workouts</Text>
          </GlassCard>

          <GlassCard variant="default" style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.glass.bgLight }]}>
              <Ionicons name="pulse" size={20} color={colors.text.secondary} />
            </View>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.text.secondary} />
            ) : (
              <Text style={styles.statValue}>
                {weeklyStats.averageRPE > 0 ? weeklyStats.averageRPE.toFixed(1) : '--'}
              </Text>
            )}
            <Text style={styles.statLabel}>Avg RPE</Text>
          </GlassCard>
        </View>

        {/* Coming Soon Features */}
        <Text style={styles.sectionTitle}>Coming Soon</Text>

        <GlassCard variant="default" style={styles.featuresCard}>
          <FeatureCard
            icon="trending-up"
            title="Progress Charts"
            description="Visualize your strength gains and workout trends over time"
            accentColor="primary"
          />

          <View style={styles.featureDivider} />

          <FeatureCard
            icon="trophy"
            title="Personal Records"
            description="Track and celebrate your PRs for every exercise"
            accentColor="secondary"
          />

          <View style={styles.featureDivider} />

          <FeatureCard
            icon="body"
            title="Body Composition"
            description="Optional body measurements and progress photos"
            accentColor="primary"
          />
        </GlassCard>

        {/* Motivation Card - Small Wins Celebration */}
        <GlassCard variant="heroPink" style={styles.stayTunedCard}>
          <View style={styles.stayTunedContent}>
            <Ionicons name="heart" size={24} color={colors.accent.secondary} />
            <View style={styles.stayTunedText}>
              <Text style={styles.stayTunedTitle}>
                {weeklyStats.totalWorkouts === 0
                  ? "Every Rep Counts"
                  : streak > 0
                    ? "You're on Fire!"
                    : "You're Doing Great!"}
              </Text>
              <Text style={styles.stayTunedDescription}>
                {weeklyStats.totalWorkouts === 0
                  ? "Start your journey today. Your first workout is the hardest—after that, momentum takes over. Even showing up counts as a win."
                  : weeklyStats.totalWorkouts === 1
                    ? "You completed your first workout! That's the hardest part. Partial workouts count too—any movement is progress."
                    : streak >= 3
                      ? `${streak} days in a row! You're building real momentum. Remember: consistency beats intensity.`
                      : `${weeklyStats.totalWorkouts} workouts logged. Every session—even shortened ones—builds your foundation.`}
              </Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
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
    paddingVertical: spacing.m,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  profileButton: {
    padding: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    marginBottom: spacing.xl,
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  decorativeRings: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  ringOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringCenter: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.glass.bgHero,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.l,
  },
  heroTitle: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.accent.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.m,
  },
  heroDescription: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.2,
    marginBottom: spacing.m,
  },
  featuresCard: {
    marginBottom: spacing.xl,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.m,
    paddingVertical: spacing.s,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  featureDescription: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.secondary,
    lineHeight: 18,
  },
  featureDivider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.m,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: spacing.l,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.glass.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  statValue: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statPlaceholder: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  streakNumber: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '700',
    color: colors.accent.primary,
  },
  statLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stayTunedCard: {
    marginBottom: spacing.l,
  },
  stayTunedContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.m,
  },
  stayTunedText: {
    flex: 1,
  },
  stayTunedTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  stayTunedDescription: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
