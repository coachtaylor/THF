import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import { palette, spacing, typography } from '../../../theme';
import ConstraintCheckbox from '../../../components/onboarding/ConstraintCheckbox';
import SurgeonClearanceBanner from '../../../components/onboarding/SurgeonClearanceBanner';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';

// Constraint options
const CONSTRAINT_OPTIONS = [
  { id: 'binder_aware', label: 'Binder Aware', description: 'I wear a binder during workouts' },
  { id: 'heavy_binding', label: 'Heavy Binding', description: 'I wear a tight binder that restricts movement' },
  { id: 'post_op', label: 'Post-Op Recovery', description: 'I am recovering from surgery' },
  { id: 'no_jumping', label: 'No Jumping', description: 'I prefer low-impact exercises' },
  { id: 'no_floor', label: 'No Floor Work', description: 'I prefer standing or seated exercises' },
];

const SURGERY_OPTIONS = [
  { id: 'top_surgery', label: 'Top Surgery', description: 'Chest reconstruction surgery' },
  { id: 'bottom_surgery', label: 'Bottom Surgery', description: 'Genital reconstruction surgery' },
  { id: 'other_surgery', label: 'Other Surgery', description: 'Other gender-affirming surgery' },
];

const HRT_OPTIONS = [
  { id: 'on_hrt', label: 'On HRT', description: 'Currently taking hormone replacement therapy' },
  { id: 'testosterone', label: 'Testosterone', description: 'Taking testosterone' },
  { id: 'estrogen', label: 'Estrogen', description: 'Taking estrogen' },
];

export default function Constraints({ navigation }: OnboardingScreenProps<'Constraints'>) {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < 375;

  // Initialize from profile if available
  const [constraints, setConstraints] = useState<string[]>(profile?.constraints || []);
  const [surgeryFlags, setSurgeryFlags] = useState<string[]>(profile?.surgery_flags || []);
  const [surgeonCleared, setSurgeonCleared] = useState<boolean>(profile?.surgeon_cleared || false);
  const [hrtFlags, setHrtFlags] = useState<string[]>(profile?.hrt_flags || []);

  useEffect(() => {
    if (profile) {
      setConstraints(profile.constraints || []);
      setSurgeryFlags(profile.surgery_flags || []);
      setSurgeonCleared(profile.surgeon_cleared || false);
      setHrtFlags(profile.hrt_flags || []);
    }
  }, [profile]);

  const toggleConstraint = (id: string) => {
    setConstraints((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const toggleSurgeryFlag = (id: string) => {
    setSurgeryFlags((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
    // Clear surgeon_cleared if surgery flags are removed
    if (surgeryFlags.includes(id) && surgeryFlags.length === 1) {
      setSurgeonCleared(false);
    }
  };

  const toggleHrtFlag = (id: string) => {
    setHrtFlags((prev) => (prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]));
  };

  const showSurgeonBanner = surgeryFlags.length > 0;

  const handleContinue = async () => {
    try {
      await updateProfile({
        constraints,
        surgery_flags: surgeryFlags,
        surgeon_cleared: surgeonCleared,
        hrt_flags: hrtFlags,
      });
      // Navigate to Review screen
      navigation.navigate('Review');
    } catch (error) {
      console.error('Error saving constraints:', error);
      // TODO: Show error toast
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, spacing.m),
          paddingBottom: Math.max(insets.bottom + spacing.m, spacing.l),
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.headline, isSmall && styles.headlineSmall]}>Safety & Constraints</Text>
        <Text style={[styles.subheadline, isSmall && styles.subheadlineSmall]}>
          Help us customize your workouts to your needs
        </Text>
      </View>

      <ProgressIndicator
        currentStep={2}
        totalSteps={3}
        stepLabels={['Goals & Preferences', 'Constraints', 'Review']}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* General Constraints */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>General Constraints</Text>
            <Text style={styles.sectionDescription}>Select any that apply to you</Text>
          </View>
          <View style={styles.optionsContainer}>
            {CONSTRAINT_OPTIONS.map((option) => (
              <ConstraintCheckbox
                key={option.id}
                label={option.label}
                description={option.description}
                checked={constraints.includes(option.id)}
                onPress={() => toggleConstraint(option.id)}
              />
            ))}
          </View>
        </View>

        {/* Surgery Flags */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Surgery History</Text>
            <Text style={styles.sectionDescription}>Optional: Help us tailor recovery guidance</Text>
          </View>
          <View style={styles.optionsContainer}>
            {SURGERY_OPTIONS.map((option) => (
              <ConstraintCheckbox
                key={option.id}
                label={option.label}
                description={option.description}
                checked={surgeryFlags.includes(option.id)}
                onPress={() => toggleSurgeryFlag(option.id)}
              />
            ))}
          </View>
        </View>

        {/* Surgeon Clearance Banner */}
        {showSurgeonBanner && (
          <View style={styles.bannerContainer}>
            <SurgeonClearanceBanner visible={showSurgeonBanner} />
          </View>
        )}

        {/* Surgeon Cleared Checkbox (only shown if surgery flags selected) */}
        {showSurgeonBanner && (
          <View style={styles.section}>
            <View style={styles.optionsContainer}>
              <ConstraintCheckbox
                label="I have been cleared by my surgeon"
                description="My surgeon has approved me for physical activity"
                checked={surgeonCleared}
                onPress={() => setSurgeonCleared((prev) => !prev)}
              />
            </View>
          </View>
        )}

        {/* HRT Flags */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hormone Replacement Therapy</Text>
            <Text style={styles.sectionDescription}>Optional: For personalized training guidance</Text>
          </View>
          <View style={styles.optionsContainer}>
            {HRT_OPTIONS.map((option) => (
              <ConstraintCheckbox
                key={option.id}
                label={option.label}
                description={option.description}
                checked={hrtFlags.includes(option.id)}
                onPress={() => toggleHrtFlag(option.id)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.ctaContainer}>
        <Button
          mode="contained"
          onPress={handleContinue}
          style={styles.continueButton}
          contentStyle={styles.continueButtonContent}
          labelStyle={styles.continueButtonLabel}
        >
          Continue
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
  header: {
    marginBottom: spacing.l,
    paddingTop: spacing.s,
  },
  headline: {
    ...typography.h1,
    textAlign: 'left',
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  headlineSmall: {
    fontSize: 24,
  },
  subheadline: {
    ...typography.body,
    textAlign: 'left',
    color: palette.midGray,
    lineHeight: 20,
  },
  subheadlineSmall: {
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    marginBottom: spacing.m,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.xxs,
    color: palette.white,
    letterSpacing: -0.3,
  },
  sectionDescription: {
    ...typography.bodySmall,
    color: palette.midGray,
    lineHeight: 18,
  },
  optionsContainer: {
    gap: spacing.xs,
  },
  bannerContainer: {
    marginBottom: spacing.m,
  },
  ctaContainer: {
    marginTop: spacing.s,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  continueButton: {
    borderRadius: 14,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  continueButtonContent: {
    paddingVertical: spacing.m,
    backgroundColor: palette.tealPrimary,
  },
  continueButtonLabel: {
    ...typography.button,
    color: palette.deepBlack,
    fontWeight: '700',
  },
});

