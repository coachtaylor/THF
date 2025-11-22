import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import { palette, spacing, typography } from '../../../theme';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';
import BodyRegionChip from '../../../components/onboarding/BodyRegionChip';

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

export default function BodyFocus({ navigation }: OnboardingScreenProps<'BodyFocus'>) {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < 375;

  // Initialize from profile if available
  const [bodyFocusPrefer, setBodyFocusPrefer] = useState<string[]>(profile?.body_focus_prefer || []);
  const [bodyFocusSoftAvoid, setBodyFocusSoftAvoid] = useState<string[]>(profile?.body_focus_soft_avoid || []);

  useEffect(() => {
    if (profile) {
      setBodyFocusPrefer(profile.body_focus_prefer || []);
      setBodyFocusSoftAvoid(profile.body_focus_soft_avoid || []);
    }
  }, [profile]);

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
    try {
      await updateProfile({
        body_focus_prefer: bodyFocusPrefer.length > 0 ? bodyFocusPrefer : undefined,
        body_focus_soft_avoid: bodyFocusSoftAvoid.length > 0 ? bodyFocusSoftAvoid : undefined,
      });
      // Navigate to Constraints screen
      navigation.navigate('Constraints');
    } catch (error) {
      console.error('Error saving body focus preferences:', error);
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
        <Text style={[styles.headline, isSmall && styles.headlineSmall]}>Body Focus</Text>
        <Text style={[styles.subheadline, isSmall && styles.subheadlineSmall]}>
          Optional: Help us customize your workouts to target specific areas
        </Text>
      </View>

      <ProgressIndicator
        currentStep={2}
        totalSteps={3}
        stepLabels={['Goals & Preferences', 'Body Focus', 'Constraints']}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Focus More On Section */}
        <View style={styles.section}>
          <View style={styles.bodyFocusCard}>
            <View style={styles.bodyFocusCardHeader}>
              <View style={styles.bodyFocusIconContainer}>
                <Text style={styles.bodyFocusIcon}>↑</Text>
              </View>
              <View style={styles.bodyFocusHeaderText}>
                <Text style={styles.bodyFocusGroupTitle}>Focus more on</Text>
                <Text style={styles.bodyFocusGroupDescription}>
                  Select areas you want to prioritize in your workouts
                </Text>
              </View>
            </View>
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
            {bodyFocusPrefer.length > 0 && (
              <View style={styles.selectionCount}>
                <Text style={styles.selectionCountText}>
                  {bodyFocusPrefer.length} {bodyFocusPrefer.length === 1 ? 'area' : 'areas'} selected
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Go Gently With Section */}
        <View style={styles.section}>
          <View style={styles.bodyFocusCard}>
            <View style={styles.bodyFocusCardHeader}>
              <View style={[styles.bodyFocusIconContainer, styles.bodyFocusIconContainerGentle]}>
                <Text style={[styles.bodyFocusIcon, styles.bodyFocusIconGentle]}>↓</Text>
              </View>
              <View style={styles.bodyFocusHeaderText}>
                <Text style={styles.bodyFocusGroupTitle}>Go gently with</Text>
                <Text style={styles.bodyFocusGroupDescription}>
                  Select areas to approach with more care or avoid
                </Text>
              </View>
            </View>
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
                key="no-preference"
                label="No preference"
                selected={bodyFocusSoftAvoid.length === 0}
                onPress={handleNoPreference}
              />
            </View>
            {bodyFocusSoftAvoid.length > 0 && (
              <View style={styles.selectionCount}>
                <Text style={styles.selectionCountText}>
                  {bodyFocusSoftAvoid.length} {bodyFocusSoftAvoid.length === 1 ? 'area' : 'areas'} selected
                </Text>
              </View>
            )}
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
    letterSpacing: -0.8,
  },
  headlineSmall: {
    fontSize: 28,
  },
  subheadline: {
    ...typography.bodyLarge,
    textAlign: 'left',
    color: palette.midGray,
    lineHeight: 24,
  },
  subheadlineSmall: {
    fontSize: 15,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.l,
  },
  bodyFocusCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 14,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: palette.border,
  },
  bodyFocusCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.m,
    gap: spacing.m,
  },
  bodyFocusIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.tealGlow,
    borderWidth: 1.5,
    borderColor: palette.tealPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bodyFocusIconContainerGentle: {
    backgroundColor: 'rgba(255, 184, 77, 0.15)',
    borderColor: palette.warning,
  },
  bodyFocusIcon: {
    fontSize: 16,
    color: palette.tealPrimary,
    fontWeight: '700',
  },
  bodyFocusIconGentle: {
    color: palette.warning,
  },
  bodyFocusHeaderText: {
    flex: 1,
  },
  bodyFocusGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.white,
    marginBottom: spacing.xxs,
  },
  bodyFocusGroupDescription: {
    ...typography.bodySmall,
    color: palette.midGray,
    lineHeight: 18,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  selectionCount: {
    marginTop: spacing.m,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  selectionCountText: {
    ...typography.caption,
    color: palette.tealPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  ctaContainer: {
    marginTop: spacing.s,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  continueButton: {
    borderRadius: 12,
    marginBottom: spacing.xs,
    shadowColor: palette.tealPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonContent: {
    paddingVertical: spacing.m,
    backgroundColor: palette.tealPrimary,
  },
  continueButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.deepBlack,
  },
});

