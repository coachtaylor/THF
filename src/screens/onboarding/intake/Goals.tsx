import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';

// Base goal options
const BASE_GOALS = [
  { value: 'strength', title: 'Build Strength', description: 'Increase muscle mass and power' },
  { value: 'endurance', title: 'Improve Endurance', description: 'Boost cardiovascular fitness' },
  { value: 'general_fitness', title: 'General Fitness', description: 'Balanced approach to health' },
];

// Gender-specific goals
const FEMINIZATION_GOAL = {
  value: 'feminization',
  title: 'Feminizing Focus',
  description: 'Emphasize lower body and curves',
};

const MASCULINIZATION_GOAL = {
  value: 'masculinization',
  title: 'Masculinizing Focus',
  description: 'Build upper body and shoulders',
};

// Body focus options
const BODY_FOCUS_PREFER = ['Legs', 'Glutes', 'Back', 'Core', 'Shoulders', 'Arms', 'Chest'];
const BODY_FOCUS_SOFT_AVOID = ['Chest', 'Hips', 'Glutes', 'Abdomen', 'Shoulders', 'No preference'];

// Get goal options based on gender identity
const getGoalOptions = (genderIdentity: string | undefined) => {
  if (genderIdentity === 'mtf') {
    return [FEMINIZATION_GOAL, ...BASE_GOALS];
  }
  if (genderIdentity === 'ftm') {
    return [MASCULINIZATION_GOAL, ...BASE_GOALS];
  }
  return BASE_GOALS; // nonbinary, questioning, or undefined
};

export default function Goals({ navigation }: OnboardingScreenProps<'Goals'>) {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();

  // State
  const [primaryGoal, setPrimaryGoal] = useState<string | null>(null);
  const [secondaryGoal, setSecondaryGoal] = useState<string | null>(null);
  const [bodyFocusPrefer, setBodyFocusPrefer] = useState<string[]>([]);
  const [bodyFocusSoftAvoid, setBodyFocusSoftAvoid] = useState<string[]>([]);

  // Load from profile
  useEffect(() => {
    if (profile?.primary_goal) {
      setPrimaryGoal(profile.primary_goal);
    }
    if (profile?.secondary_goals && profile.secondary_goals.length > 0) {
      setSecondaryGoal(profile.secondary_goals[0]);
    }
    if (profile?.body_focus_prefer) {
      setBodyFocusPrefer(profile.body_focus_prefer);
    }
    if (profile?.body_focus_soft_avoid) {
      setBodyFocusSoftAvoid(profile.body_focus_soft_avoid);
    }
  }, [profile]);

  // Get goal options based on gender identity
  const goalOptions = getGoalOptions(profile?.gender_identity);

  // Goal selection logic
  const handleGoalPress = (goalValue: string) => {
    if (primaryGoal === goalValue) {
      // Deselect primary
      setPrimaryGoal(null);
      if (secondaryGoal) {
        // Promote secondary to primary
        setPrimaryGoal(secondaryGoal);
        setSecondaryGoal(null);
      }
    } else if (secondaryGoal === goalValue) {
      // Deselect secondary
      setSecondaryGoal(null);
    } else if (!primaryGoal) {
      // Set as primary
      setPrimaryGoal(goalValue);
    } else if (!secondaryGoal) {
      // Set as secondary
      setSecondaryGoal(goalValue);
    } else {
      // Has both: replace primary, old primary becomes secondary
      setSecondaryGoal(primaryGoal);
      setPrimaryGoal(goalValue);
    }
  };

  // Body focus toggle functions
  const toggleBodyFocusPrefer = (region: string) => {
    setBodyFocusPrefer((prev) =>
      prev.includes(region) ? prev.filter((v) => v !== region) : [...prev, region]
    );
  };

  const toggleBodyFocusSoftAvoid = (region: string) => {
    if (region === 'No preference') {
      setBodyFocusSoftAvoid([]);
    } else {
      setBodyFocusSoftAvoid((prev) =>
        prev.includes(region) ? prev.filter((v) => v !== region) : [...prev, region]
      );
    }
  };

  // Continue handler
  const handleContinue = async () => {
    if (!primaryGoal) return;

    const secondaryGoals: string[] = secondaryGoal ? [secondaryGoal] : [];

    try {
      await updateProfile({
        primary_goal: primaryGoal as any,
        secondary_goals: secondaryGoals.length > 0 ? secondaryGoals : undefined,
        body_focus_prefer: bodyFocusPrefer.length > 0 ? bodyFocusPrefer : undefined,
        body_focus_soft_avoid: bodyFocusSoftAvoid.length > 0 ? bodyFocusSoftAvoid : undefined,
      });
      navigation.navigate('Experience');
    } catch (error) {
      console.error('Error saving goals:', error);
    }
  };

  const canContinue = primaryGoal !== null;

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <ProgressIndicator currentStep={5} totalSteps={8} />
          <Text style={styles.headline}>What are your fitness goals?</Text>
          <Text style={styles.subheadline}>
            Select your main focus. You can add a secondary goal too.
          </Text>
        </View>

        {/* GOAL CARDS */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>YOUR GOALS</Text>
          <Text style={styles.sectionDescription}>
            Tap to select primary, tap again for secondary
          </Text>

          {goalOptions.map((goal) => {
            const isPrimary = primaryGoal === goal.value;
            const isSecondary = secondaryGoal === goal.value;

            return (
              <TouchableOpacity
                key={goal.value}
                style={[
                  styles.goalCard,
                  isPrimary && styles.goalCardPrimary,
                  isSecondary && styles.goalCardSecondary,
                ]}
                onPress={() => handleGoalPress(goal.value)}
              >
                <View style={styles.cardLeft}>
                  {/* Color Indicator */}
                  <View
                    style={[
                      styles.colorIndicator,
                      isPrimary && styles.indicatorPrimary,
                      isSecondary && styles.indicatorSecondary,
                    ]}
                  />

                  <View style={styles.textContainer}>
                    <Text
                      style={[
                        styles.cardTitle,
                        isPrimary && styles.titlePrimary,
                        isSecondary && styles.titleSecondary,
                      ]}
                    >
                      {goal.title}
                    </Text>
                    <Text
                      style={[
                        styles.cardDescription,
                        isPrimary && styles.descriptionPrimary,
                        isSecondary && styles.descriptionSecondary,
                      ]}
                    >
                      {goal.description}
                    </Text>
                  </View>
                </View>

                {/* Badge */}
                {isPrimary && (
                  <View style={[styles.selectionBadge, styles.badgePrimary]}>
                    <Text style={styles.badgeText}>PRIMARY</Text>
                  </View>
                )}
                {isSecondary && (
                  <View style={[styles.selectionBadge, styles.badgeSecondary]}>
                    <Text style={styles.badgeText}>SECONDARY</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* BODY FOCUS (OPTIONAL) */}
        <View style={styles.bodyFocusContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.sectionTitle}>Body Focus</Text>
              <View style={styles.optionalBadge}>
                <Text style={styles.optionalBadgeText}>OPTIONAL</Text>
              </View>
            </View>
            <Text style={styles.sectionSubtitle}>
              Customize which areas get more attention
            </Text>
          </View>

          {/* Focus More On */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionLabel}>Focus more on</Text>
            <View style={styles.pillsContainer}>
              {BODY_FOCUS_PREFER.map((region) => {
                const isSelected = bodyFocusPrefer.includes(region);
                return (
                  <TouchableOpacity
                    key={region}
                    style={[styles.bodyPill, isSelected && styles.pillSelected]}
                    onPress={() => toggleBodyFocusPrefer(region)}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                      {region}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Go Gently With */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionLabel}>Go gently with</Text>
            <View style={styles.pillsContainer}>
              {BODY_FOCUS_SOFT_AVOID.map((region) => {
                const isSelected = region === 'No preference'
                  ? bodyFocusSoftAvoid.length === 0
                  : bodyFocusSoftAvoid.includes(region);
                return (
                  <TouchableOpacity
                    key={region}
                    style={[styles.bodyPill, isSelected && styles.pillSelected]}
                    onPress={() => toggleBodyFocusSoftAvoid(region)}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                      {region}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* FOOTER (SCROLLS WITH CONTENT) */}
        <View style={styles.footerContainer}>
          <TouchableOpacity
            disabled={!canContinue}
            onPress={handleContinue}
            style={styles.primaryButton}
          >
            <LinearGradient
              colors={canContinue ? ['#00D9C0', '#00B39D'] : ['#2A2F36', '#1A1F26']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={[styles.buttonText, !canContinue && styles.buttonTextDisabled]}>
                Continue
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.hintText}>
            Secondary goal and body focus are optional
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 34,
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: 'left',
  },
  subheadline: {
    fontSize: 15,
    fontWeight: '400',
    color: '#9CA3AF',
    lineHeight: 22,
    textAlign: 'left',
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'left',
  },
  sectionDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 19,
    textAlign: 'left',
  },
  goalCard: {
    backgroundColor: '#1A1F26',
    borderRadius: 14,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2A2F36',
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalCardPrimary: {
    borderColor: '#00D9C0',
    backgroundColor: 'rgba(0, 217, 192, 0.1)',
  },
  goalCardSecondary: {
    borderColor: '#A78BFA',
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 4,
    height: 48,
    borderRadius: 2,
    marginRight: 16,
    backgroundColor: '#2A2F36',
  },
  indicatorPrimary: {
    backgroundColor: '#00D9C0',
  },
  indicatorSecondary: {
    backgroundColor: '#A78BFA',
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 4,
    textAlign: 'left',
  },
  titlePrimary: {
    color: '#00D9C0',
  },
  titleSecondary: {
    color: '#A78BFA',
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    lineHeight: 20,
    textAlign: 'left',
  },
  descriptionPrimary: {
    color: '#B8C5C5',
  },
  descriptionSecondary: {
    color: '#D4C9FF',
  },
  selectionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 12,
  },
  badgePrimary: {
    backgroundColor: '#00D9C0',
  },
  badgeSecondary: {
    backgroundColor: '#A78BFA',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F1419',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bodyFocusContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'left',
  },
  optionalBadge: {
    backgroundColor: 'rgba(91, 159, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
  optionalBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5B9FFF',
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'left',
  },
  subsection: {
    marginBottom: 24,
  },
  subsectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E0E4E8',
    marginBottom: 12,
    textAlign: 'left',
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: -8,
  },
  bodyPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1A1F26',
    borderWidth: 2,
    borderColor: '#2A2F36',
    marginLeft: 8,
    marginBottom: 8,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillSelected: {
    backgroundColor: 'rgba(0, 217, 192, 0.12)',
    borderColor: '#00D9C0',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E0E4E8',
  },
  pillTextSelected: {
    fontWeight: '600',
    color: '#00D9C0',
  },
  footerContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 0,
  },
  primaryButton: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F1419',
  },
  buttonTextDisabled: {
    color: '#6B7280',
  },
  hintText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});
