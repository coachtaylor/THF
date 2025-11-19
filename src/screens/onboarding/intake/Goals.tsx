import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import { palette, spacing, typography } from '../../../theme';
import GoalCard, { Goal } from '../../../components/onboarding/GoalCard';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';
import BodyRegionChip from '../../../components/onboarding/BodyRegionChip';

const GOAL_OPTIONS: Goal[] = ['strength', 'cardio', 'flexibility', 'custom'];

// Body region options for focus areas
const BODY_FOCUS_PREFER_OPTIONS = [
  { value: 'legs', label: 'Legs' },
  { value: 'glutes', label: 'Glutes' },
  { value: 'back', label: 'Back' },
  { value: 'core', label: 'Core' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'arms', label: 'Arms' },
  { value: 'chest', label: 'Chest' },
];

// Body region options for soft avoid areas
const BODY_FOCUS_SOFT_AVOID_OPTIONS = [
  { value: 'chest', label: 'Chest' },
  { value: 'hips', label: 'Hips' },
  { value: 'glutes', label: 'Glutes' },
  { value: 'abdomen', label: 'Abdomen' },
  { value: 'shoulders', label: 'Shoulders' },
];

export default function Goals({ navigation }: OnboardingScreenProps<'Goals'>) {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < 375;

  // Initialize from profile if available
  const [primaryGoal, setPrimaryGoal] = useState<Goal | null>(null);
  const [secondaryGoal, setSecondaryGoal] = useState<Goal | null>(null);
  const [bodyFocusPrefer, setBodyFocusPrefer] = useState<string[]>(profile?.body_focus_prefer || []);
  const [bodyFocusSoftAvoid, setBodyFocusSoftAvoid] = useState<string[]>(profile?.body_focus_soft_avoid || []);

  useEffect(() => {
    if (profile?.goals && profile.goals.length > 0) {
      const goals = profile.goals as Goal[];
      setPrimaryGoal(goals[0] || null);
      setSecondaryGoal(goals[1] || null);
    }
    if (profile?.body_focus_prefer) {
      setBodyFocusPrefer(profile.body_focus_prefer);
    }
    if (profile?.body_focus_soft_avoid) {
      setBodyFocusSoftAvoid(profile.body_focus_soft_avoid);
    }
  }, [profile]);

  const handleGoalPress = (goal: Goal) => {
    if (primaryGoal === goal) {
      // Deselect if already primary
      setPrimaryGoal(null);
      if (secondaryGoal === goal) {
        setSecondaryGoal(null);
      }
    } else if (secondaryGoal === goal) {
      // Deselect if already secondary
      setSecondaryGoal(null);
    } else if (!primaryGoal) {
      // Set as primary if no primary selected
      setPrimaryGoal(goal);
    } else if (!secondaryGoal) {
      // Set as secondary if primary exists
      setSecondaryGoal(goal);
    } else {
      // Replace primary, move old primary to secondary
      setPrimaryGoal(goal);
      setSecondaryGoal(primaryGoal);
    }
  };

  const getSelectionType = (goal: Goal): 'primary' | 'secondary' | null => {
    if (primaryGoal === goal) return 'primary';
    if (secondaryGoal === goal) return 'secondary';
    return null;
  };

  const toggleBodyFocusPrefer = (value: string) => {
    setBodyFocusPrefer((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleBodyFocusSoftAvoid = (value: string) => {
    setBodyFocusSoftAvoid((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleNoPreference = () => {
    setBodyFocusSoftAvoid([]);
  };

  const handleContinue = async () => {
    if (!primaryGoal) return; // Primary goal is required

    const goals: string[] = [primaryGoal];
    if (secondaryGoal) {
      goals.push(secondaryGoal);
    }

    // Calculate goal weighting (default: 70/30 if secondary exists, 100/0 if not)
    const goalWeighting = secondaryGoal
      ? { primary: 70, secondary: 30 }
      : { primary: 100, secondary: 0 };

    try {
      await updateProfile({
        goals,
        goal_weighting: goalWeighting,
        body_focus_prefer: bodyFocusPrefer.length > 0 ? bodyFocusPrefer : undefined,
        body_focus_soft_avoid: bodyFocusSoftAvoid.length > 0 ? bodyFocusSoftAvoid : undefined,
      });
      // Navigate to Constraints screen
      navigation.navigate('Constraints');
    } catch (error) {
      console.error('Error saving goals:', error);
      // TODO: Show error toast
    }
  };

  const canContinue = primaryGoal !== null;

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
      <Text style={[styles.headline, isSmall && styles.headlineSmall]}>What are your goals?</Text>
      <Text style={[styles.subheadline, isSmall && styles.subheadlineSmall]}>
        Select your primary goal. You can optionally add a secondary goal.
      </Text>

      <ProgressIndicator
        currentStep={1}
        totalSteps={4}
        stepLabels={['Goals', 'Constraints', 'Preferences', 'Review']}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.goalsGrid}>
          {GOAL_OPTIONS.map((goal) => (
            <View key={goal} style={styles.goalCardWrapper}>
              <GoalCard
                goal={goal}
                isSelected={primaryGoal === goal || secondaryGoal === goal}
                selectionType={getSelectionType(goal)}
                onPress={() => handleGoalPress(goal)}
              />
            </View>
          ))}
        </View>

        {/* Body Region Preferences Section */}
        <View style={styles.bodyFocusSection}>
          <Text style={styles.bodyFocusTitle}>Where do you want to focus?</Text>
          <Text style={styles.bodyFocusDescription}>
            Optional: Help us customize your workouts to your preferences.
          </Text>

          {/* Areas to focus on more */}
          <View style={styles.bodyFocusGroup}>
            <Text style={styles.bodyFocusGroupTitle}>
              Areas you would like to focus on more
            </Text>
            <View style={styles.chipContainer}>
              {BODY_FOCUS_PREFER_OPTIONS.map((option) => (
                <BodyRegionChip
                  key={option.value}
                  label={option.label}
                  selected={bodyFocusPrefer.includes(option.value)}
                  onPress={() => toggleBodyFocusPrefer(option.value)}
                />
              ))}
            </View>
          </View>

          {/* Areas to go gently with */}
          <View style={styles.bodyFocusGroup}>
            <Text style={styles.bodyFocusGroupTitle}>
              Areas you would like to go more gently with
            </Text>
            <View style={styles.chipContainer}>
              {BODY_FOCUS_SOFT_AVOID_OPTIONS.map((option) => (
                <BodyRegionChip
                  key={option.value}
                  label={option.label}
                  selected={bodyFocusSoftAvoid.includes(option.value)}
                  onPress={() => toggleBodyFocusSoftAvoid(option.value)}
                />
              ))}
              <BodyRegionChip
                label="No preference"
                selected={bodyFocusSoftAvoid.length === 0}
                onPress={handleNoPreference}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.ctaContainer}>
        <Button
          mode="contained"
          onPress={handleContinue}
          disabled={!canContinue}
          style={styles.continueButton}
          contentStyle={styles.continueButtonContent}
          labelStyle={styles.continueButtonLabel}
        >
          Continue
        </Button>
        {!canContinue && (
          <Text style={styles.hintText}>Please select at least one goal to continue</Text>
        )}
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
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  goalCardWrapper: {
    width: '48%',
    marginBottom: spacing.m,
  },
  ctaContainer: {
    marginTop: spacing.m,
  },
  continueButton: {
    borderRadius: 16,
    marginBottom: spacing.xs,
  },
  continueButtonContent: {
    paddingVertical: spacing.m,
    backgroundColor: palette.tealPrimary,
  },
  continueButtonLabel: {
    ...typography.button,
    color: palette.deepBlack,
  },
  hintText: {
    ...typography.caption,
    textAlign: 'center',
    color: palette.midGray,
    marginTop: spacing.xs,
  },
  bodyFocusSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.l,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  bodyFocusTitle: {
    ...typography.h3,
    color: palette.white,
    marginBottom: spacing.xs,
  },
  bodyFocusDescription: {
    ...typography.bodySmall,
    color: palette.midGray,
    marginBottom: spacing.l,
  },
  bodyFocusGroup: {
    marginBottom: spacing.l,
  },
  bodyFocusGroupTitle: {
    ...typography.bodyLarge,
    color: palette.lightGray,
    marginBottom: spacing.m,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
