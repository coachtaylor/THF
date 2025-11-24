import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import { palette, spacing, typography } from '../../../theme';
import ConstraintCheckbox from '../../../components/onboarding/ConstraintCheckbox';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';
import { getEquipmentOptions, EquipmentOption, CanonicalEquipment } from '../../../utils/equipment';

// Block length options
const BLOCK_LENGTH_OPTIONS = [
  { value: 1, label: '1 Week', description: 'Short-term plan' },
  { value: 4, label: '4 Weeks', description: 'Monthly program' },
];

// Fitness level options
const FITNESS_LEVEL_OPTIONS = [
  { value: 'beginner' as const, label: 'Beginner', description: 'New to fitness or returning after a break' },
  { value: 'intermediate' as const, label: 'Intermediate', description: 'Regular exercise experience' },
  { value: 'advanced' as const, label: 'Advanced', description: 'Extensive fitness background' },
];

export default function Preferences({ navigation }: OnboardingScreenProps<'Preferences'>) {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < 375;

  // Equipment options loaded from Supabase
  const [equipmentOptions, setEquipmentOptions] = useState<EquipmentOption[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState<boolean>(true);
  
  // Selected equipment (stored as canonical equipment)
  const [selectedEquipment, setSelectedEquipment] = useState<CanonicalEquipment[]>([]);

  // Initialize from profile if available
  const [fitnessLevel, setFitnessLevel] = useState<'beginner' | 'intermediate' | 'advanced' | undefined>(
    profile?.fitness_level
  );
  const [blockLength, setBlockLength] = useState<number>(profile?.block_length || 1);
  const [lowSensoryMode, setLowSensoryMode] = useState<boolean>(profile?.low_sensory_mode || false);

  // Load equipment options from Supabase on mount
  useEffect(() => {
    const loadEquipment = async () => {
      try {
        setLoadingEquipment(true);
        const options = await getEquipmentOptions();
        setEquipmentOptions(options);
        
        // Initialize selected equipment from profile
        if (profile?.equipment && profile.equipment.length > 0) {
          setSelectedEquipment(profile.equipment as CanonicalEquipment[]);
        } else {
          // Default to bodyweight
          setSelectedEquipment(['bodyweight']);
        }
      } catch (error) {
        console.error('Error loading equipment options:', error);
        // Fallback to default options
        setEquipmentOptions([
          { raw: 'bodyweight', canonical: 'bodyweight', label: 'Bodyweight', description: 'No equipment needed', value: 'bodyweight' },
          { raw: 'dumbbells', canonical: 'dumbbells', label: 'Dumbbells', description: 'Free weights', value: 'dumbbells' },
          { raw: 'bands', canonical: 'bands', label: 'Resistance Bands', description: 'Elastic bands', value: 'bands' },
          { raw: 'kettlebells', canonical: 'kettlebells', label: 'Kettlebells', description: 'Kettlebell exercises', value: 'kettlebells' },
        ]);
        setSelectedEquipment(['bodyweight']);
      } finally {
        setLoadingEquipment(false);
      }
    };

    loadEquipment();
  }, []);

  useEffect(() => {
    if (profile) {
      setFitnessLevel(profile.fitness_level);
      setBlockLength(profile.block_length || 1);
      setLowSensoryMode(profile.low_sensory_mode || false);
      
      // Update selected equipment if profile changes
      if (profile.equipment && profile.equipment.length > 0) {
        setSelectedEquipment(profile.equipment as CanonicalEquipment[]);
      }
    }
  }, [profile]);

  const toggleEquipment = (canonical: CanonicalEquipment) => {
    setSelectedEquipment((prev) => {
      if (prev.includes(canonical)) {
        // Don't allow removing if it's the only option
        if (prev.length === 1) {
          return prev;
        }
        return prev.filter((e) => e !== canonical);
      }
      return [...prev, canonical];
    });
  };

  const handleContinue = async () => {
    // Ensure at least one equipment is selected
    if (selectedEquipment.length === 0) {
      setSelectedEquipment(['bodyweight']);
    }

    const finalEquipment = selectedEquipment.length > 0 ? selectedEquipment : ['bodyweight'];

    try {
      await updateProfile({
        fitness_level: fitnessLevel,
        block_length: blockLength,
        equipment: finalEquipment,
        low_sensory_mode: lowSensoryMode,
      });
      // Navigate to Review screen
      navigation.navigate('Review');
    } catch (error) {
      console.error('Error saving preferences:', error);
      // TODO: Show error toast
    }
  };

  const canContinue = selectedEquipment.length > 0;

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
        {/* Fitness Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fitness Level</Text>
          <Text style={styles.sectionDescription}>Select your current fitness level</Text>
          <View style={styles.fitnessLevelContainer}>
            {FITNESS_LEVEL_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setFitnessLevel(option.value)}
                activeOpacity={0.8}
                style={[
                  styles.fitnessLevelCard,
                  fitnessLevel === option.value && styles.fitnessLevelCardSelected,
                ]}
              >
                <Text style={[styles.fitnessLevelLabel, fitnessLevel === option.value && styles.fitnessLevelLabelSelected]}>
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.fitnessLevelDescription,
                    fitnessLevel === option.value && styles.fitnessLevelDescriptionSelected,
                  ]}
                >
                  {option.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
          {loadingEquipment ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={palette.tealPrimary} />
              <Text style={styles.loadingText}>Loading equipment options...</Text>
            </View>
          ) : (
            <View>
              {equipmentOptions.map((option) => (
                <ConstraintCheckbox
                  key={option.canonical}
                  label={option.label}
                  description={option.description}
                  checked={selectedEquipment.includes(option.canonical)}
                  onPress={() => toggleEquipment(option.canonical)}
                />
              ))}
            </View>
          )}
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
          <Text style={styles.hintText}>Please select at least one equipment option</Text>
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
  fitnessLevelContainer: {
    gap: spacing.s,
  },
  fitnessLevelCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 16,
    padding: spacing.m,
    borderWidth: 2,
    borderColor: palette.border,
  },
  fitnessLevelCardSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealGlow,
  },
  fitnessLevelLabel: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  fitnessLevelLabelSelected: {
    color: palette.tealPrimary,
  },
  fitnessLevelDescription: {
    ...typography.bodySmall,
    color: palette.midGray,
  },
  fitnessLevelDescriptionSelected: {
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.l,
    gap: spacing.s,
  },
  loadingText: {
    ...typography.bodySmall,
    color: palette.midGray,
  },
});

