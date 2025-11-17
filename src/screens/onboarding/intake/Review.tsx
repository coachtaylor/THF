import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import { generatePlan } from '../../../services/planGenerator';
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

      // TODO: Navigate to PlanView when it's implemented (Week 3)
      // For now, show success message
      // navigation.navigate('PlanView', { plan });
      
      // Temporary success state
      setTimeout(() => {
        setGenerating(false);
        // In Week 3, this will navigate to PlanView
      }, 2000);
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
  const preferredMinutes = profile.preferred_minutes || [];
  const blockLength = profile.block_length || 1;
  const equipment = profile.equipment || [];

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
            {goals.length > 0 ? (
              <>
                <Text style={styles.summaryLabel}>Primary Goal:</Text>
                <Text style={styles.summaryValue}>{GOAL_LABELS[goals[0]] || goals[0]}</Text>
                {goals.length > 1 && (
                  <>
                    <Text style={styles.summaryLabel}>Secondary Goal:</Text>
                    <Text style={styles.summaryValue}>{GOAL_LABELS[goals[1]] || goals[1]}</Text>
                  </>
                )}
                <Text style={styles.summaryLabel}>Weighting:</Text>
                <Text style={styles.summaryValue}>
                  {goalWeighting.primary}% primary, {goalWeighting.secondary}% secondary
                </Text>
              </>
            ) : (
              <Text style={styles.emptyText}>No goals selected</Text>
            )}
          </View>
        </View>

        {/* Constraints Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Constraints</Text>
            <TouchableOpacity onPress={() => handleEdit('Constraints')} style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.summaryCard}>
            {constraints.length > 0 && (
              <>
                <Text style={styles.summaryLabel}>General Constraints:</Text>
                <Text style={styles.summaryValue}>
                  {constraints.map((c) => CONSTRAINT_LABELS[c] || c).join(', ')}
                </Text>
              </>
            )}
            {surgeryFlags.length > 0 && (
              <>
                <Text style={styles.summaryLabel}>Surgery History:</Text>
                <Text style={styles.summaryValue}>
                  {surgeryFlags.map((s) => SURGERY_LABELS[s] || s).join(', ')}
                </Text>
                {profile.surgeon_cleared && (
                  <Text style={styles.summaryValue}>✓ Surgeon cleared</Text>
                )}
              </>
            )}
            {hrtFlags.length > 0 && (
              <>
                <Text style={styles.summaryLabel}>HRT:</Text>
                <Text style={styles.summaryValue}>
                  {hrtFlags.map((h) => HRT_LABELS[h] || h).join(', ')}
                </Text>
              </>
            )}
            {constraints.length === 0 && surgeryFlags.length === 0 && hrtFlags.length === 0 && (
              <Text style={styles.emptyText}>No constraints selected</Text>
            )}
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <TouchableOpacity onPress={() => handleEdit('Preferences')} style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Workout Durations:</Text>
            <Text style={styles.summaryValue}>
              {preferredMinutes.length > 0 ? preferredMinutes.join(', ') + ' minutes' : 'Not selected'}
            </Text>
            <Text style={styles.summaryLabel}>Program Length:</Text>
            <Text style={styles.summaryValue}>{blockLength === 1 ? '1 Week' : '4 Weeks'}</Text>
            <Text style={styles.summaryLabel}>Available Equipment:</Text>
            <Text style={styles.summaryValue}>
              {equipment.length > 0
                ? equipment.map((e) => EQUIPMENT_LABELS[e] || e).join(', ')
                : 'Not selected'}
            </Text>
            {profile.low_sensory_mode && (
              <>
                <Text style={styles.summaryLabel}>Accessibility:</Text>
                <Text style={styles.summaryValue}>Low Sensory Mode enabled</Text>
              </>
            )}
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

