import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import { palette, spacing, typography } from '../../../theme';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';
import { getEquipmentOptions, EquipmentOption, mapRawEquipmentArrayToCanonical } from '../../../utils/equipment';

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

export default function ProgramSetup({ navigation }: OnboardingScreenProps<'ProgramSetup'>) {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < 375;

  // Equipment options loaded from Supabase
  const [equipmentOptions, setEquipmentOptions] = useState<EquipmentOption[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState<boolean>(true);
  
  // Selected equipment (stored as raw equipment strings)
  const [selectedRawEquipment, setSelectedRawEquipment] = useState<string[]>([]);

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
        if (profile?.equipment_raw && profile.equipment_raw.length > 0) {
          setSelectedRawEquipment(profile.equipment_raw);
        } else if (profile?.equipment && profile.equipment.length > 0) {
          // Fallback: map canonical equipment back to raw
          const mappedRaw: string[] = [];
          profile.equipment.forEach((canonical) => {
            const matchingOption = options.find(opt => opt.canonical === canonical);
            if (matchingOption) {
              mappedRaw.push(matchingOption.raw);
            }
          });
          if (mappedRaw.length === 0 && options.length > 0) {
            const bodyweightOption = options.find(opt => opt.canonical === 'bodyweight') || options[0];
            if (bodyweightOption) {
              mappedRaw.push(bodyweightOption.raw);
            }
          }
          setSelectedRawEquipment(mappedRaw.length > 0 ? mappedRaw : [options[0]?.raw || 'BODY WEIGHT']);
        } else {
          // Default to bodyweight
          const bodyweightOption = options.find(opt => opt.canonical === 'bodyweight') || options[0];
          if (bodyweightOption) {
            setSelectedRawEquipment([bodyweightOption.raw]);
          }
        }
      } catch (error) {
        console.error('Error loading equipment options:', error);
        // Fallback to default options (only bodyweight on error)
        setEquipmentOptions([
          { raw: 'BODY WEIGHT', canonical: 'bodyweight', label: 'Bodyweight', description: 'No equipment needed' },
        ]);
        setSelectedRawEquipment(['BODY WEIGHT']);
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
      
      if (profile.equipment_raw && profile.equipment_raw.length > 0) {
        setSelectedRawEquipment(profile.equipment_raw);
      }
    }
  }, [profile]);

  const toggleEquipment = (rawEquipment: string) => {
    setSelectedRawEquipment((prev) => {
      if (prev.includes(rawEquipment)) {
        if (prev.length === 1) {
          return prev;
        }
        return prev.filter((e) => e !== rawEquipment);
      }
      return [...prev, rawEquipment];
    });
  };

  const handleContinue = async () => {
    if (!fitnessLevel) return;

    // Ensure at least one equipment is selected
    if (selectedRawEquipment.length === 0) {
      const bodyweightOption = equipmentOptions.find(opt => opt.canonical === 'bodyweight') || equipmentOptions[0];
      if (bodyweightOption) {
        setSelectedRawEquipment([bodyweightOption.raw]);
      }
    }

    // Map raw equipment to canonical categories
    const canonicalEquipment = mapRawEquipmentArrayToCanonical(selectedRawEquipment);
    const finalCanonical = canonicalEquipment.length > 0 ? canonicalEquipment : ['bodyweight'];
    const finalRaw = selectedRawEquipment.length > 0 ? selectedRawEquipment : ['BODY WEIGHT'];

    try {
      await updateProfile({
        fitness_level: fitnessLevel,
        block_length: blockLength,
        equipment: finalCanonical,
        equipment_raw: finalRaw,
        low_sensory_mode: lowSensoryMode,
      });
      // Navigate to Constraints screen
      navigation.navigate('Constraints');
    } catch (error) {
      console.error('Error saving program setup:', error);
    }
  };

  const canContinue = fitnessLevel !== undefined && selectedRawEquipment.length > 0;

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
        <Text style={[styles.headline, isSmall && styles.headlineSmall]}>Program Setup</Text>
        <Text style={[styles.subheadline, isSmall && styles.subheadlineSmall]}>
          Set your fitness level and program duration
        </Text>
      </View>

      <ProgressIndicator
        currentStep={2}
        totalSteps={4}
        stepLabels={['Goals & Preferences', 'Program Setup', 'Constraints', 'Review']}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Fitness Level */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Fitness Level</Text>
            <Text style={styles.sectionDescription}>Select your current fitness level</Text>
          </View>
          <View style={styles.fitnessLevelContainer}>
            {FITNESS_LEVEL_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setFitnessLevel(option.value)}
                activeOpacity={0.7}
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

        {/* Program Length */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Program Length</Text>
            <Text style={styles.sectionDescription}>Choose your preferred program duration</Text>
          </View>
          <View style={styles.blockLengthContainer}>
            {BLOCK_LENGTH_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setBlockLength(option.value)}
                activeOpacity={0.7}
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Equipment</Text>
            <Text style={styles.sectionDescription}>
              Select all equipment you have access to. You can choose multiple options.
            </Text>
          </View>
          {loadingEquipment ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={palette.tealPrimary} />
              <Text style={styles.loadingText}>Loading equipment options...</Text>
            </View>
          ) : (
            <>
              <View style={styles.equipmentGrid}>
                {equipmentOptions.map((option) => {
                  const isSelected = selectedRawEquipment.includes(option.raw);
                  return (
                    <TouchableOpacity
                      key={option.raw}
                      onPress={() => toggleEquipment(option.raw)}
                      activeOpacity={0.8}
                      style={[
                        styles.equipmentCard,
                        isSelected && styles.equipmentCardSelected,
                      ]}
                    >
                      <View style={styles.equipmentCardContent}>
                        <View style={styles.equipmentHeader}>
                          <Text style={[styles.equipmentLabel, isSelected && styles.equipmentLabelSelected]}>
                            {option.label}
                          </Text>
                          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                            {isSelected && (
                              <Text style={styles.checkmark}>✓</Text>
                            )}
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {selectedRawEquipment.length > 0 && (
                <View style={styles.selectionCount}>
                  <Text style={styles.selectionCountText}>
                    {selectedRawEquipment.length} {selectedRawEquipment.length === 1 ? 'equipment' : 'equipment'} selected
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Low Sensory Mode */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Accessibility</Text>
            <Text style={styles.sectionDescription}>Optional settings for your comfort</Text>
          </View>
          <TouchableOpacity
            onPress={() => setLowSensoryMode((prev) => !prev)}
            activeOpacity={0.7}
            style={[
              styles.equipmentCard,
              lowSensoryMode && styles.equipmentCardSelected,
            ]}
          >
            <View style={[styles.checkbox, lowSensoryMode && styles.checkboxSelected]}>
              {lowSensoryMode && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <View style={styles.equipmentCardContent}>
              <Text style={[styles.equipmentLabel, lowSensoryMode && styles.equipmentLabelSelected]}>
                Low Sensory Mode
              </Text>
              <Text style={[styles.equipmentDescription, lowSensoryMode && styles.equipmentDescriptionSelected]}>
                Reduce visual and audio stimulation during workouts
              </Text>
            </View>
          </TouchableOpacity>
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
          <Text style={styles.hintText}>
            {!fitnessLevel ? 'Please select your fitness level' : 'Please select at least one equipment option'}
          </Text>
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
  sectionHeader: {
    marginBottom: spacing.s,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.xxs,
    color: palette.white,
    letterSpacing: -0.5,
  },
  sectionDescription: {
    ...typography.body,
    color: palette.midGray,
    lineHeight: 22,
  },
  fitnessLevelContainer: {
    gap: spacing.xs,
    marginBottom: spacing.m,
  },
  fitnessLevelCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  fitnessLevelCardSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealGlow,
    borderWidth: 2,
  },
  fitnessLevelLabel: {
    fontSize: 15,
    marginBottom: spacing.xxs,
    fontWeight: '600',
    color: palette.white,
  },
  fitnessLevelLabelSelected: {
    color: palette.tealPrimary,
  },
  fitnessLevelDescription: {
    ...typography.bodySmall,
    color: palette.midGray,
    lineHeight: 18,
  },
  fitnessLevelDescriptionSelected: {
    color: palette.lightGray,
  },
  blockLengthContainer: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  blockLengthCard: {
    flex: 1,
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    borderWidth: 1.5,
    borderColor: palette.border,
    alignItems: 'center',
    minHeight: 70,
    justifyContent: 'center',
  },
  blockLengthCardSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealGlow,
    borderWidth: 2,
  },
  blockLengthLabel: {
    fontSize: 15,
    marginBottom: spacing.xxs,
    textAlign: 'center',
    fontWeight: '600',
    color: palette.white,
  },
  blockLengthLabelSelected: {
    color: palette.tealPrimary,
  },
  blockLengthDescription: {
    ...typography.bodySmall,
    textAlign: 'center',
    color: palette.midGray,
    lineHeight: 18,
  },
  blockLengthDescriptionSelected: {
    color: palette.lightGray,
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
    paddingVertical: spacing.s,
    backgroundColor: palette.tealPrimary,
  },
  continueButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
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
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
  },
  equipmentCard: {
    flex: 1,
    minWidth: '47%',
    maxWidth: '47%',
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.s,
    borderWidth: 1.5,
    borderColor: palette.border,
    minHeight: 56,
  },
  equipmentCardSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealGlow,
    borderWidth: 2,
  },
  equipmentCardContent: {
    flex: 1,
    gap: spacing.xxs,
  },
  equipmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  equipmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.white,
    flex: 1,
  },
  equipmentLabelSelected: {
    color: palette.tealPrimary,
  },
  equipmentDescription: {
    ...typography.bodySmall,
    color: palette.midGray,
    lineHeight: 18,
    fontWeight: '400',
    paddingRight: spacing.s,
  },
  equipmentDescriptionSelected: {
    color: palette.lightGray,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: palette.darkCard,
  },
  checkboxSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealPrimary,
  },
  checkmark: {
    color: palette.deepBlack,
    fontSize: 12,
    fontWeight: '700',
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
});

