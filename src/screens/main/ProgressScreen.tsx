import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { GlassCard, ProgressRing } from '../../components/common';

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
        {/* Hero Coming Soon Card */}
        <GlassCard variant="hero" shimmer style={styles.heroCard}>
          {/* Decorative rings */}
          <View style={styles.decorativeRings}>
            <ProgressRing progress={0.7} size={100} strokeWidth={4} color="primary" />
            <View style={styles.ringOverlay}>
              <ProgressRing progress={0.5} size={70} strokeWidth={3} color="secondary" />
              <View style={styles.ringCenter}>
                <Ionicons name="analytics" size={24} color={colors.accent.primary} />
              </View>
            </View>
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Progress Tracking</Text>
            <Text style={styles.heroSubtitle}>Coming in Phase 6</Text>
            <Text style={styles.heroDescription}>
              Track your fitness journey with detailed analytics, personal records, and body composition insights.
            </Text>
          </View>
        </GlassCard>

        {/* Feature Preview */}
        <Text style={styles.sectionTitle}>What's Coming</Text>

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

          <View style={styles.featureDivider} />

          <FeatureCard
            icon="calendar"
            title="Workout Streaks"
            description="Detailed streak analytics and consistency tracking"
            accentColor="secondary"
          />
        </GlassCard>

        {/* Teaser Stats */}
        <Text style={styles.sectionTitle}>Your Journey So Far</Text>

        <View style={styles.statsGrid}>
          <GlassCard variant="default" style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="barbell" size={20} color={colors.accent.primary} />
            </View>
            <Text style={styles.statPlaceholder}>--</Text>
            <Text style={styles.statLabel}>Total Volume</Text>
          </GlassCard>

          <GlassCard variant="default" style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="flame" size={20} color={colors.accent.secondary} />
            </View>
            <Text style={styles.statPlaceholder}>--</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </GlassCard>

          <GlassCard variant="default" style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="trophy" size={20} color={colors.success} />
            </View>
            <Text style={styles.statPlaceholder}>--</Text>
            <Text style={styles.statLabel}>Total PRs</Text>
          </GlassCard>

          <GlassCard variant="default" style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="time" size={20} color={colors.text.secondary} />
            </View>
            <Text style={styles.statPlaceholder}>--</Text>
            <Text style={styles.statLabel}>Hours Trained</Text>
          </GlassCard>
        </View>

        {/* Stay Tuned */}
        <GlassCard variant="heroPink" style={styles.stayTunedCard}>
          <View style={styles.stayTunedContent}>
            <Ionicons name="notifications" size={24} color={colors.accent.secondary} />
            <View style={styles.stayTunedText}>
              <Text style={styles.stayTunedTitle}>Stay Tuned!</Text>
              <Text style={styles.stayTunedDescription}>
                We're working hard to bring you these features. Keep training and your data will be ready when they launch!
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
  statPlaceholder: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
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
