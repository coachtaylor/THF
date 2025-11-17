import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import { palette, spacing, typography } from '../../../theme';
import ConstraintCheckbox from '../../../components/onboarding/ConstraintCheckbox';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';

// Duration options
const DURATION_OPTIONS = [
  { value: 5, label: '5 minutes', description: 'Quick workout' },
  { value: 15, label: '15 minutes', description: 'Short session' },
  { value: 30, label: '30 minutes', description: 'Standard workout' },
  { value: 45, label: '45 minutes', description: 'Extended session' },
];

// Equipment options
const EQUIPMENT_OPTIONS = [
  { id: 'bodyweight', label: 'Bodyweight', description: 'No equipment needed' },
  { id: 'dumbbells', label: 'Dumbbells', description: 'Free weights' },
  { id: 'bands', label: 'Resistance Bands', description: 'Elastic bands' },
  { id: 'kettlebell', label: 'Kettlebell', description: 'Kettlebell exercises' },
];

// Block length options
const BLOCK_LENGTH_OPTIONS = [
  { value: 1, label: '1 Week', description: 'Short-term plan' },
  { value: 4, label: '4 Weeks', description: 'Monthly program' },
];

export default function Preferences({ navigation }: OnboardingScreenProps<'Preferences'>) {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < 375;

  // Initialize from profile if available
  const [preferredMinutes, setPreferredMinutes] = useState<number[]>(profile?.preferred_minutes || [15, 30]);
  const [blockLength, setBlockLength] = useState<number>(profile?.block_length || 1);
  const [equipment, setEquipment] = useState<string[]>(profile?.equipment || ['bodyweight']);
  const [lowSensoryMode, setLowSensoryMode] = useState<boolean>(profile?.low_sensory_mode || false);

  useEffect(() => {
    if (profile) {
      setPreferredMinutes(profile.preferred_minutes || [15, 30]);
      setBlockLength(profile.block_length || 1);
      setEquipment(profile.equipment || ['bodyweight']);
      setLowSensoryMode(profile.low_sensory_mode || false);
    }
  }, [profile]);

  const toggleDuration = (value: number) => {
    setPreferredMinutes((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const toggleEquipment = (id: string) => {
    setEquipment((prev) => {
      if (prev.includes(id)) {
        // Don't allow removing bodyweight if it's the only option
        if (prev.length === 1 && id === 'bodyweight') {
          return prev;
        }
        return prev.filter((e) => e !== id);
      }
      return [...prev, id];
    });
  };

  const handleContinue = async () => {
    // Ensure at least one duration is selected
    if (preferredMinutes.length === 0) {
      // Default to 15 minutes if none selected
      setPreferredMinutes([15]);
    }

    // Ensure at least one equipment is selected
    if (equipment.length === 0) {
      setEquipment(['bodyweight']);
    }

    try {
      await updateProfile({
        preferred_minutes: preferredMinutes.length > 0 ? preferredMinutes : [15],
        block_length: blockLength,
        equipment: equipment.length > 0 ? equipment : ['bodyweight'],
        low_sensory_mode: lowSensoryMode,
      });
      // Navigate to Review screen
      navigation.navigate('Review');
    } catch (error) {
      console.error('Error saving preferences:', error);
      // TODO: Show error toast
    }
  };

  const canContinue = preferredMinutes.length > 0 && equipment.length > 0;

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
      <Text style={[styles.headline, isSmall && styles.headlineSmall]}>What are your preferences?</Text>
      <Text style={[styles.subheadline, isSmall && styles.subheadlineSmall]}>
        Customize your workout experience to fit your schedule and available equipment.
      </Text>

      <ProgressIndicator
        currentStep={3}
        totalSteps={4}
        stepLabels={['Goals', 'Constraints', 'Preferences', 'Review']}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Preferred Workout Durations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Duration</Text>
          <Text style={styles.sectionDescription}>Select all durations you're interested in</Text>
          {DURATION_OPTIONS.map((option) => (
            <ConstraintCheckbox
              key={option.value}
              label={option.label}
              description={option.description}
              checked={preferredMinutes.includes(option.value)}
              onPress={() => toggleDuration(option.value)}
            />
          ))}
        </View>

        {/* Block Length */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Program Length</Text>
          <Text style={styles.sectionDescription}>Choose your preferred program duration</Text>
          <View style={styles.blockLengthContainer}>
            {BLOCK_LENGTH_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setBlockLength(option.value)}
                activeOpacity={0.8}
                style={[
                  styles.blockLengthCard,
                  blockLength === option.value && styles.blockLengthCardSelected,
                ]}
              >
                <Text style={[styles.blockLengthLabel, blockLength === option.value && styles.blockLengthLabelSelected]}>
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.blockLengthDescription,
                    blockLength === option.value && styles.blockLengthDescriptionSelected,
                  ]}
                >
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Available Equipment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Equipment</Text>
          <Text style={styles.sectionDescription}>Select all equipment you have access to</Text>
          {EQUIPMENT_OPTIONS.map((option) => (
            <ConstraintCheckbox
              key={option.id}
              label={option.label}
              description={option.description}
              checked={equipment.includes(option.id)}
              onPress={() => toggleEquipment(option.id)}
            />
          ))}
        </View>

        {/* Low Sensory Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accessibility</Text>
          <ConstraintCheckbox
            label="Low Sensory Mode"
            description="Reduce visual and audio stimulation during workouts"
            checked={lowSensoryMode}
            onPress={() => setLowSensoryMode((prev) => !prev)}
          />
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
          <Text style={styles.hintText}>Please select at least one duration and equipment option</Text>
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
  section: {
    marginBottom: spacing.l,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
    color: palette.white,
  },
  sectionDescription: {
    ...typography.bodySmall,
    marginBottom: spacing.m,
    color: palette.midGray,
  },
  blockLengthContainer: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  blockLengthCard: {
    flex: 1,
    backgroundColor: palette.darkCard,
    borderRadius: 16,
    padding: spacing.l,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  blockLengthCardSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealGlow,
  },
  blockLengthLabel: {
    ...typography.h3,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  blockLengthLabelSelected: {
    color: palette.tealPrimary,
  },
  blockLengthDescription: {
    ...typography.bodySmall,
    textAlign: 'center',
    color: palette.midGray,
  },
  blockLengthDescriptionSelected: {
    color: palette.lightGray,
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
});

