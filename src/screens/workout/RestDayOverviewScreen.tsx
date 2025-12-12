import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { textStyles, buttonStyles } from '../../theme/components';
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{dayName}</Text>
          <Text style={styles.headerSubtitle}>{formattedDate}</Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['rgba(245, 169, 184, 0.1)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroIconContainer}>
            <Ionicons name="moon" size={48} color="rgba(245, 169, 184, 0.9)" />
          </View>
          <Text style={styles.heroTitle}>Rest Day</Text>
          <Text style={styles.heroSubtitle}>Recovery is part of progress</Text>
        </View>

        {/* Benefits Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Rest Days Matter</Text>
          <View style={styles.benefitsGrid}>
            {REST_DAY_BENEFITS.map((benefit, index) => (
              <View key={index} style={styles.benefitCard}>
                <View style={styles.benefitIconContainer}>
                  <Ionicons
                    name={benefit.icon}
                    size={24}
                    color={colors.cyan[500]}
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rest Day Activities</Text>
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Optional Mobility Routine</Text>
          <MobilityRoutine />
        </View>

        {/* Generate Workout Option */}
        <View style={styles.section}>
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
            <TouchableOpacity
              style={styles.generateButton}
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
            </TouchableOpacity>
          </View>
        </View>

        {/* Encouragement */}
        <View style={styles.encouragementSection}>
          <Text style={styles.encouragementText}>
            "Listen to your body. Rest when you need to, and come back stronger."
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.deep,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    ...textStyles.h3,
    fontSize: 18,
    color: colors.text.primary,
  },
  headerSubtitle: {
    ...textStyles.bodySmall,
    fontSize: 12,
    color: colors.text.tertiary,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    marginBottom: spacing.xl,
    borderRadius: borderRadius['2xl'],
    backgroundColor: 'rgba(245, 169, 184, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(245, 169, 184, 0.1)',
    overflow: 'hidden',
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 169, 184, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    ...textStyles.h1,
    fontSize: 32,
    color: 'rgba(245, 169, 184, 0.9)',
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    ...textStyles.body,
    fontSize: 16,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...textStyles.h3,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  benefitCard: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  benefitIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  benefitTitle: {
    ...textStyles.label,
    fontSize: 13,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  benefitDescription: {
    ...textStyles.bodySmall,
    fontSize: 11,
    color: colors.text.tertiary,
    lineHeight: 16,
  },
  activitiesCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  activityText: {
    ...textStyles.body,
    fontSize: 14,
    color: colors.text.secondary,
  },
  generateCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: spacing.lg,
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
    ...textStyles.label,
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  generateDescription: {
    ...textStyles.bodySmall,
    fontSize: 13,
    color: colors.text.tertiary,
    lineHeight: 18,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.base,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  generateButtonText: {
    ...textStyles.label,
    fontSize: 14,
    color: colors.text.primary,
  },
  encouragementSection: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  encouragementText: {
    ...textStyles.body,
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
