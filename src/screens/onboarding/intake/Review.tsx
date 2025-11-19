import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import { generatePlan } from '../../../services/planGenerator';
import { savePlan } from '../../../services/storage/plan';
import { Plan } from '../../../types';
import { palette, spacing, typography } from '../../../theme';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';

const GOAL_LABELS: Record<string, string> = {
  strength: 'Strength',
  cardio: 'Cardio',
  flexibility: 'Flexibility',
  custom: 'Custom',
};

const EQUIPMENT_LABELS: Record<string, string> = {
  bodyweight: 'Bodyweight',
  dumbbells: 'Dumbbells',
  bands: 'Resistance Bands',
  kettlebell: 'Kettlebell',
};

const CONSTRAINT_LABELS: Record<string, string> = {
  binder_aware: 'Binder Aware',
  heavy_binding: 'Heavy Binding',
  post_op: 'Post-Op Recovery',
  no_jumping: 'No Jumping',
  no_floor: 'No Floor Work',
};

const SURGERY_LABELS: Record<string, string> = {
  top_surgery: 'Top Surgery',
  bottom_surgery: 'Bottom Surgery',
  other_surgery: 'Other Surgery',
};

const HRT_LABELS: Record<string, string> = {
  on_hrt: 'On HRT',
  testosterone: 'Testosterone',
  estrogen: 'Estrogen',
};

const BODY_REGION_LABELS: Record<string, string> = {
  legs: 'Legs',
  glutes: 'Glutes',
  back: 'Back',
  core: 'Core',
  shoulders: 'Shoulders',
  arms: 'Arms',
  chest: 'Chest',
  hips: 'Hips',
  abdomen: 'Abdomen',
};

export default function Review({ navigation }: OnboardingScreenProps<'Review'>) {
  const { profile } = useProfile();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < 375;

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No profile data found. Please complete onboarding.</Text>
      </View>
    );
  }

  const handleEdit = (screen: 'Goals' | 'Constraints' | 'Preferences') => {
    navigation.navigate(screen);
  };

  const handleGeneratePlan = async () => {
    try {
      setGenerating(true);
      setError(null);

      // Generate plan using profile data
      const plan = await generatePlan({
        profile,
        blockLength: (profile.block_length || 1) as 1 | 4,
        startDate: new Date(),
      });

      console.log('✅ Plan generated:', plan);

      // Save plan to storage
      await savePlan(plan);

      // Navigate to PlanView
      setGenerating(false);
      navigation.navigate('PlanView');
    } catch (err) {
      console.error('❌ Failed to generate plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate workout plan');
      setGenerating(false);
    }
  };

  const goals = profile.goals || [];
  const goalWeighting = profile.goal_weighting || { primary: 100, secondary: 0 };
  const constraints = profile.constraints || [];
  const surgeryFlags = profile.surgery_flags || [];
  const hrtFlags = profile.hrt_flags || [];
  const fitnessLevel = profile.fitness_level;
  const blockLength = profile.block_length || 1;
  const equipment = profile.equipment || [];
  const bodyFocusPrefer = profile.body_focus_prefer || [];
  const bodyFocusSoftAvoid = profile.body_focus_soft_avoid || [];
  const surgeonCleared = profile.surgeon_cleared;
  const lowSensoryMode = profile.low_sensory_mode || false;

  const FITNESS_LEVEL_LABELS: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  };

  // Helper function to format body regions
  const formatBodyRegions = (regions: string[]): string => {
    return regions.map((region) => BODY_REGION_LABELS[region] || region).join(', ');
  };

  // Helper function to format equipment
  const formatEquipment = (equipment: string[]): string => {
    return equipment.map((e) => EQUIPMENT_LABELS[e] || e).join(', ');
  };

  // Build summary items for each section
  const goalsItems: string[] = [];
  if (goals.length > 0) {
    const primaryGoal = GOAL_LABELS[goals[0]] || goals[0];
    if (goals.length > 1 && goalWeighting.secondary > 0) {
      const secondaryGoal = GOAL_LABELS[goals[1]] || goals[1];
      goalsItems.push(`Primary goal: ${primaryGoal} (${goalWeighting.primary}%)`);
      goalsItems.push(`Secondary goal: ${secondaryGoal} (${goalWeighting.secondary}%)`);
    } else {
      goalsItems.push(`Primary goal: ${primaryGoal} (100%)`);
    }
  }

  const bodyFocusItems: string[] = [];
  if (bodyFocusPrefer.length > 0) {
    bodyFocusItems.push(`We'll put extra emphasis on: ${formatBodyRegions(bodyFocusPrefer)}`);
  }
  if (bodyFocusSoftAvoid.length > 0) {
    bodyFocusItems.push(`We'll go more gently with: ${formatBodyRegions(bodyFocusSoftAvoid)}`);
  }
  if (bodyFocusItems.length === 0) {
    bodyFocusItems.push('No specific body focus selected.');
  }

  const safetyItems: string[] = [];
  if (constraints.includes('binder_aware')) {
    safetyItems.push("We'll prioritize binder-aware exercise options.");
  }
  if (constraints.includes('heavy_binding')) {
    safetyItems.push("We'll be extra careful about breath and chest pressure when binding feels tight.");
  }
  if (constraints.includes('post_op')) {
    safetyItems.push("We'll treat you as post-op and avoid aggressive positions until you're cleared.");
  }
  if (constraints.includes('no_jumping')) {
    safetyItems.push("We'll avoid jumping and high-impact movements.");
  }
  if (constraints.includes('no_floor')) {
    safetyItems.push("We'll avoid exercises that require getting onto the floor.");
  }
  if (surgeryFlags.includes('top_surgery')) {
    safetyItems.push("We'll layer in tips specific to top surgery recovery where relevant.");
  }
  if (surgeryFlags.includes('bottom_surgery')) {
    safetyItems.push("We'll layer in tips specific to bottom surgery and pelvic floor where relevant.");
  }
  if (hrtFlags.length > 0) {
    safetyItems.push("We'll add context around training while on HRT.");
  }
  if (constraints.includes('post_op')) {
    if (surgeonCleared === false) {
      safetyItems.push("You marked that you're not cleared yet — we'll keep intensity and positions conservative.");
    } else if (surgeonCleared === true) {
      safetyItems.push("You marked that you've been cleared by your surgeon — we'll still avoid anything that feels sketchy, but open up more options.");
    }
  }

  const programItems: string[] = [];
  if (fitnessLevel) {
    programItems.push(`Starting level: ${FITNESS_LEVEL_LABELS[fitnessLevel]}`);
  }
  programItems.push(`Program length: ${blockLength} week${blockLength !== 1 ? 's' : ''}`);
  if (equipment.length > 0) {
    programItems.push(`We'll use: ${formatEquipment(equipment)}`);
  }
  if (lowSensoryMode) {
    programItems.push('Low sensory mode: ON (simpler flows and less chaos).');
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, spacing.l),
          paddingBottom: Math.max(insets.bottom + spacing.m, spacing.l),
        },
      ]}
    >
      <Text style={[styles.headline, isSmall && styles.headlineSmall]}>Review Your Profile</Text>
      <Text style={[styles.subheadline, isSmall && styles.subheadlineSmall]}>
        Review your selections and generate your personalized workout plan.
      </Text>

      <ProgressIndicator
        currentStep={4}
        totalSteps={4}
        stepLabels={['Goals', 'Constraints', 'Preferences', 'Review']}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Goals</Text>
            <TouchableOpacity onPress={() => handleEdit('Goals')} style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.summaryCard}>
            {goalsItems.length > 0 ? (
              goalsItems.map((item, index) => (
                <Text key={index} style={styles.summaryBullet}>
                  {item}
                </Text>
              ))
            ) : (
              <Text style={styles.emptyText}>No goals selected</Text>
            )}
          </View>
        </View>

        {/* Body Focus Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Body Focus</Text>
            <TouchableOpacity onPress={() => handleEdit('Goals')} style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.summaryCard}>
            {bodyFocusItems.map((item, index) => (
              <Text key={index} style={styles.summaryBullet}>
                {item}
              </Text>
            ))}
          </View>
        </View>

        {/* Safety & Constraints Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Safety & Constraints</Text>
            <TouchableOpacity onPress={() => handleEdit('Constraints')} style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.summaryCard}>
            {safetyItems.length > 0 ? (
              safetyItems.map((item, index) => (
                <Text key={index} style={styles.summaryBullet}>
                  {item}
                </Text>
              ))
            ) : (
              <Text style={styles.emptyText}>No constraints selected</Text>
            )}
          </View>
        </View>

        {/* Program Setup Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Program Setup</Text>
            <TouchableOpacity onPress={() => handleEdit('Preferences')} style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.summaryCard}>
            {programItems.map((item, index) => (
              <Text key={index} style={styles.summaryBullet}>
                {item}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.ctaContainer}>
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        <Button
          mode="contained"
          onPress={handleGeneratePlan}
          disabled={generating}
          style={styles.generateButton}
          contentStyle={styles.generateButtonContent}
          labelStyle={styles.generateButtonLabel}
        >
          {generating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={palette.deepBlack} style={styles.loadingSpinner} />
              <Text style={styles.generateButtonLabel}>Generating Plan...</Text>
            </View>
          ) : (
            'Generate My Plan'
          )}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.deepBlack,
    paddingHorizontal: spacing.l,
  },
  headline: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.s,
  },
  headlineSmall: {
    fontSize: 24,
  },
  subheadline: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.l,
    color: palette.midGray,
  },
  subheadlineSmall: {
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.m,
  },
  section: {
    marginBottom: spacing.l,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  sectionTitle: {
    ...typography.h3,
    color: palette.white,
  },
  editButton: {
    padding: spacing.xs,
  },
  editButtonText: {
    ...typography.button,
    color: palette.tealPrimary,
    fontSize: 14,
  },
  summaryCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 16,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: palette.border,
  },
  summaryLabel: {
    ...typography.bodySmall,
    color: palette.midGray,
    marginTop: spacing.s,
    marginBottom: spacing.xxs,
  },
  summaryValue: {
    ...typography.body,
    color: palette.lightGray,
    marginBottom: spacing.xs,
  },
  summaryBullet: {
    ...typography.body,
    color: palette.lightGray,
    marginBottom: spacing.s,
    lineHeight: 22,
  },
  emptyText: {
    ...typography.body,
    color: palette.midGray,
    fontStyle: 'italic',
  },
  ctaContainer: {
    marginTop: spacing.m,
  },
  generateButton: {
    borderRadius: 16,
    marginBottom: spacing.xs,
  },
  generateButtonContent: {
    paddingVertical: spacing.m,
    backgroundColor: palette.tealPrimary,
  },
  generateButtonLabel: {
    ...typography.button,
    color: palette.deepBlack,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    marginRight: spacing.s,
  },
  errorText: {
    ...typography.bodySmall,
    color: palette.error,
    textAlign: 'center',
    marginBottom: spacing.s,
  },
});

