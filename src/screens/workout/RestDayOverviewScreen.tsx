import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, gradients, layout } from '../../theme/theme';
import { headerStyles, sectionStyles } from '../../theme/components';
import { useProfile } from '../../hooks/useProfile';
import { usePlan } from '../../hooks/usePlan';
import { regenerateDay } from '../../services/planGenerator';
import { savePlan } from '../../services/storage/plan';
import { MobilityRoutine } from '../../components/restday';
import type { Day } from '../../types/plan';

type RootStackParamList = {
  RestDayOverview: { day: Day; planId?: string };
  WorkoutOverview: { workoutId: string; isToday?: boolean };
};

type RestDayOverviewScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'RestDayOverview'
>;

type RestDayOverviewScreenRouteProp = RouteProp<RootStackParamList, 'RestDayOverview'>;

interface Props {
  navigation: RestDayOverviewScreenNavigationProp;
  route: RestDayOverviewScreenRouteProp;
}

const REST_DAY_BENEFITS = [
  {
    icon: 'fitness-outline' as const,
    title: 'Muscle Recovery',
    description: 'Your muscles repair and grow stronger during rest, not during workouts.',
  },
  {
    icon: 'battery-charging-outline' as const,
    title: 'Energy Restoration',
    description: 'Rest days help replenish glycogen stores and reduce fatigue.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Injury Prevention',
    description: 'Taking breaks prevents overuse injuries and joint strain.',
  },
  {
    icon: 'happy-outline' as const,
    title: 'Mental Refresh',
    description: 'Rest helps prevent burnout and keeps you motivated long-term.',
  },
];

const REST_DAY_ACTIVITIES = [
  'Light walking or stretching',
  'Foam rolling and mobility work',
  'Yoga or gentle movement',
  'Meditation and mindfulness',
  'Extra sleep and hydration',
];

export default function RestDayOverviewScreen({ navigation, route }: Props) {
  const { day, planId } = route.params;
  const { profile } = useProfile();
  const userId = profile?.user_id || profile?.id || 'default';
  const { plan, refreshPlan } = usePlan(userId);
  const [isGenerating, setIsGenerating] = useState(false);
  const insets = useSafeAreaInsets();

  const dayDate = new Date(day.date);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[dayDate.getDay()];
  const formattedDate = dayDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });

  const handleGenerateWorkout = async () => {
    if (!profile || !plan) return;

    setIsGenerating(true);
    try {
      // Regenerate this day with a workout
      const updatedDay = await regenerateDay(plan, day.dayNumber, profile);

      // Update the plan with the new day
      const updatedDays = plan.days.map(d =>
        d.dayNumber === day.dayNumber ? updatedDay : d
      );

      const updatedPlan = {
        ...plan,
        days: updatedDays,
      };

      // Save the updated plan
      await savePlan(updatedPlan, userId);

      // Refresh the plan in context
      await refreshPlan?.();

      // Navigate to the workout overview
      const workoutId = `${plan.id}_${day.dayNumber}`;
      navigation.replace('WorkoutOverview', { workoutId, isToday: false });
    } catch (error) {
      console.error('Error generating workout:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bg.primary, colors.bg.secondary]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[headerStyles.container, { paddingTop: insets.top + spacing.m }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            headerStyles.backButton,
            pressed && styles.buttonPressed,
          ]}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={headerStyles.title}>{dayName}</Text>
          <Text style={styles.headerSubtitle}>{formattedDate}</Text>
        </View>
        <View style={headerStyles.spacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: layout.screenPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={gradients.restDayGlow}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroIconContainer}>
            <Ionicons name="moon" size={48} color={colors.accent.secondary} />
          </View>
          <Text style={styles.heroTitle}>Rest Day</Text>
          <Text style={styles.heroSubtitle}>Recovery is part of progress</Text>
        </View>

        {/* Benefits Section */}
        <View style={sectionStyles.container}>
          <Text style={sectionStyles.title}>Why Rest Days Matter</Text>
          <View style={styles.benefitsGrid}>
            {REST_DAY_BENEFITS.map((benefit, index) => (
              <View key={index} style={styles.benefitCard}>
                <View style={styles.benefitIconContainer}>
                  <Ionicons
                    name={benefit.icon}
                    size={24}
                    color={colors.accent.primary}
                  />
                </View>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>
                  {benefit.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Activities Section */}
        <View style={sectionStyles.container}>
          <Text style={sectionStyles.title}>Rest Day Activities</Text>
          <View style={styles.activitiesCard}>
            {REST_DAY_ACTIVITIES.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color={colors.text.tertiary}
                />
                <Text style={styles.activityText}>{activity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Mobility Routine */}
        <View style={sectionStyles.container}>
          <Text style={sectionStyles.title}>Optional Mobility Routine</Text>
          <MobilityRoutine />
        </View>

        {/* Generate Workout Option */}
        <View style={sectionStyles.container}>
          <View style={styles.generateCard}>
            <View style={styles.generateContent}>
              <Ionicons
                name="barbell-outline"
                size={24}
                color={colors.text.secondary}
              />
              <View style={styles.generateTextContainer}>
                <Text style={styles.generateTitle}>Want to workout anyway?</Text>
                <Text style={styles.generateDescription}>
                  Generate a workout for today if you're feeling energized
                </Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.generateButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleGenerateWorkout}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color={colors.text.primary} />
              ) : (
                <>
                  <Text style={styles.generateButtonText}>Generate Workout</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={colors.text.primary}
                  />
                </>
              )}
            </Pressable>
          </View>
        </View>

        {/* Encouragement */}
        <View style={styles.encouragementSection}>
          <Text style={styles.encouragementText}>
            "Listen to your body. Rest when you need to, and come back stronger."
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Note: header styles now use headerStyles from components.ts
  // Section styles now use sectionStyles from components.ts
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: colors.text.tertiary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    marginBottom: spacing.xl,
    borderRadius: borderRadius['2xl'],
    backgroundColor: colors.accent.secondaryMuted,
    borderWidth: 1,
    borderColor: colors.glass.borderPink,
    overflow: 'hidden',
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent.secondaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontFamily: 'Poppins',
    fontSize: 32,
    fontWeight: '700',
    color: colors.accent.secondary,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    color: colors.text.secondary,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.m,
  },
  benefitCard: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.m,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  benefitIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  benefitTitle: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  benefitDescription: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: colors.text.tertiary,
    lineHeight: 16,
  },
  activitiesCard: {
    padding: spacing.l,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.md,
    marginTop: spacing.m,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  activityText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.secondary,
  },
  generateCard: {
    padding: spacing.l,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.l,
    marginTop: spacing.m,
  },
  generateContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  generateTextContainer: {
    flex: 1,
  },
  generateTitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  generateDescription: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.tertiary,
    lineHeight: 18,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glass.bgLight,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  generateButtonText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  encouragementSection: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  encouragementText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
