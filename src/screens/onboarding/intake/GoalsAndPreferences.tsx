import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import { palette, spacing, typography } from '../../../theme';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';
import BodyRegionChip from '../../../components/onboarding/BodyRegionChip';
import { getEquipmentOptions, EquipmentOption, mapRawEquipmentArrayToCanonical } from '../../../utils/equipment';
import { fetchGoalsFromDatabase, formatGoalLabel } from '../../../utils/goals';

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


export default function GoalsAndPreferences({ navigation }: OnboardingScreenProps<'Goals'>) {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < 375;

  // Goals from database
  const [availableGoals, setAvailableGoals] = useState<string[]>([]);
  const [loadingGoals, setLoadingGoals] = useState<boolean>(true);
  
  // Equipment options loaded from Supabase
  const [equipmentOptions, setEquipmentOptions] = useState<EquipmentOption[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState<boolean>(true);
  
  // Selected equipment (stored as raw equipment strings)
  const [selectedRawEquipment, setSelectedRawEquipment] = useState<string[]>([]);

  // Initialize from profile if available
  const [primaryGoal, setPrimaryGoal] = useState<string | null>(null);
  const [secondaryGoal, setSecondaryGoal] = useState<string | null>(null);
  const [bodyFocusPrefer, setBodyFocusPrefer] = useState<string[]>(profile?.body_focus_prefer || []);
  const [bodyFocusSoftAvoid, setBodyFocusSoftAvoid] = useState<string[]>(profile?.body_focus_soft_avoid || []);
  const [fitnessLevel, setFitnessLevel] = useState<'beginner' | 'intermediate' | 'advanced' | undefined>(
    profile?.fitness_level
  );
  const [blockLength, setBlockLength] = useState<number>(profile?.block_length || 1);
  const [lowSensoryMode, setLowSensoryMode] = useState<boolean>(profile?.low_sensory_mode || false);

  // Load goals from database
  useEffect(() => {
    const loadGoals = async () => {
      try {
        setLoadingGoals(true);
        const goals = await fetchGoalsFromDatabase();
        setAvailableGoals(goals);
        
        // Initialize selected goals from profile
        if (profile?.goals && profile.goals.length > 0) {
          const goals = profile.goals;
          setPrimaryGoal(goals[0] || null);
          setSecondaryGoal(goals[1] || null);
        }
      } catch (error) {
        console.error('Error loading goals:', error);
        // Fallback to default goals
        setAvailableGoals(['strength', 'conditioning', 'mobility', 'endurance']);
      } finally {
        setLoadingGoals(false);
      }
    };

    loadGoals();
  }, []);

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
        // Fallback to default options (excluding dumbbells)
        setEquipmentOptions([
          { raw: 'BODY WEIGHT', canonical: 'bodyweight', label: 'Bodyweight', description: 'No equipment needed' },
          { raw: 'RESISTANCE BAND', canonical: 'bands', label: 'Resistance Bands', description: 'Elastic bands' },
          { raw: 'KETTLEBELL', canonical: 'kettlebell', label: 'Kettlebell', description: 'Kettlebell exercises' },
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

  const handleGoalPress = (goal: string) => {
    if (primaryGoal === goal) {
      setPrimaryGoal(null);
      if (secondaryGoal === goal) {
        setSecondaryGoal(null);
      }
    } else if (secondaryGoal === goal) {
      setSecondaryGoal(null);
    } else if (!primaryGoal) {
      setPrimaryGoal(goal);
    } else if (!secondaryGoal) {
      setSecondaryGoal(goal);
    } else {
      setPrimaryGoal(goal);
      setSecondaryGoal(primaryGoal);
    }
  };

  const getSelectionType = (goal: string): 'primary' | 'secondary' | null => {
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
    if (!primaryGoal) return;

    const goals: string[] = [primaryGoal];
    if (secondaryGoal) {
      goals.push(secondaryGoal);
    }

    // Calculate goal weighting
    const goalWeighting = secondaryGoal
      ? { primary: 70, secondary: 30 }
      : { primary: 100, secondary: 0 };

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
        goals,
        goal_weighting: goalWeighting,
        body_focus_prefer: bodyFocusPrefer.length > 0 ? bodyFocusPrefer : undefined,
        body_focus_soft_avoid: bodyFocusSoftAvoid.length > 0 ? bodyFocusSoftAvoid : undefined,
        fitness_level: fitnessLevel,
        block_length: blockLength,
        equipment: finalCanonical,
        equipment_raw: finalRaw,
        low_sensory_mode: lowSensoryMode,
      });
      // Navigate to Constraints screen
      navigation.navigate('Constraints');
    } catch (error) {
      console.error('Error saving goals and preferences:', error);
    }
  };

  const canContinue = primaryGoal !== null && selectedRawEquipment.length > 0;

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
        <Text style={[styles.headline, isSmall && styles.headlineSmall]}>Goals & Preferences</Text>
        <Text style={[styles.subheadline, isSmall && styles.subheadlineSmall]}>
          Customize your workout plan
        </Text>
      </View>

      <ProgressIndicator
        currentStep={1}
        totalSteps={3}
        stepLabels={['Goals & Preferences', 'Constraints', 'Review']}
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
            <Text style={styles.sectionDescription}>Select your primary goal. Optional secondary goal.</Text>
          </View>
          {loadingGoals ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={palette.tealPrimary} />
              <Text style={styles.loadingText}>Loading goals...</Text>
            </View>
          ) : (
            <View style={styles.goalsGrid}>
              {availableGoals.map((goal) => {
                const selectionType = getSelectionType(goal);
                const isSelected = primaryGoal === goal || secondaryGoal === goal;
                return (
                  <TouchableOpacity
                    key={goal}
                    onPress={() => handleGoalPress(goal)}
                    activeOpacity={0.7}
                    style={[
                      styles.goalCard,
                      isSelected && styles.goalCardSelected,
                      selectionType === 'primary' && styles.goalCardPrimary,
                      selectionType === 'secondary' && styles.goalCardSecondary,
                    ]}
                  >
                    {selectionType === 'primary' && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>Primary</Text>
                      </View>
                    )}
                    {selectionType === 'secondary' && (
                      <View style={[styles.badge, styles.badgeSecondary]}>
                        <Text style={styles.badgeText}>Secondary</Text>
                      </View>
                    )}
                    <Text style={[styles.goalLabel, isSelected && styles.goalLabelSelected]}>
                      {formatGoalLabel(goal)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Body Region Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Body Focus</Text>
            <Text style={styles.sectionDescription}>
              Optional: Help us customize your workouts to target specific areas
            </Text>
          </View>

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

        {/* Fitness Level & Program Length */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Program Setup</Text>
            <Text style={styles.sectionDescription}>Set your fitness level and program duration</Text>
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
            {!primaryGoal ? 'Please select at least one goal' : 'Please select at least one equipment option'}
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
    marginBottom: spacing.xl,
    paddingTop: spacing.m,
  },
  headline: {
    ...typography.h1,
    textAlign: 'left',
    marginBottom: spacing.s,
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
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    marginBottom: spacing.l,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
    color: palette.white,
    letterSpacing: -0.5,
  },
  sectionDescription: {
    ...typography.body,
    color: palette.midGray,
    lineHeight: 22,
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
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
  },
  goalCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: palette.darkCard,
    borderRadius: 18,
    padding: spacing.m,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  goalCardSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.darkerCard,
    borderWidth: 2,
    shadowColor: palette.tealPrimary,
    shadowOpacity: 0.2,
  },
  goalCardPrimary: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealGlow,
    borderWidth: 2.5,
    shadowColor: palette.tealPrimary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  goalCardSecondary: {
    borderColor: palette.tealDark,
    borderWidth: 2,
    backgroundColor: palette.tealLight,
  },
  goalLabel: {
    ...typography.h4,
    textAlign: 'center',
    fontWeight: '600',
  },
  goalLabelSelected: {
    color: palette.tealPrimary,
  },
  badge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: palette.tealPrimary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeSecondary: {
    backgroundColor: palette.tealDark,
  },
  badgeText: {
    ...typography.caption,
    color: palette.deepBlack,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.2,
  },
  bodyFocusCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 20,
    padding: spacing.l,
    marginBottom: spacing.m,
    borderWidth: 2,
    borderColor: palette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bodyFocusCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.m,
    gap: spacing.m,
  },
  bodyFocusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.tealGlow,
    borderWidth: 2,
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
    fontSize: 20,
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
    ...typography.h4,
    color: palette.white,
    marginBottom: spacing.xxs,
    fontWeight: '600',
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
  // Reuse selectionCount for equipment section
  fitnessLevelContainer: {
    gap: spacing.xs,
    marginBottom: spacing.m,
  },
  fitnessLevelCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 20,
    padding: spacing.l,
    borderWidth: 2,
    borderColor: palette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  fitnessLevelCardSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealGlow,
    borderWidth: 2.5,
    shadowColor: palette.tealPrimary,
    shadowOpacity: 0.2,
  },
  fitnessLevelLabel: {
    ...typography.h4,
    marginBottom: spacing.xxs,
    fontWeight: '600',
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
    borderRadius: 20,
    padding: spacing.l,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  blockLengthCardSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealGlow,
    borderWidth: 2.5,
    shadowColor: palette.tealPrimary,
    shadowOpacity: 0.2,
  },
  blockLengthLabel: {
    ...typography.h4,
    marginBottom: spacing.xxs,
    textAlign: 'center',
    fontWeight: '600',
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
    borderRadius: 18,
    padding: spacing.m,
    borderWidth: 2,
    borderColor: palette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 70,
  },
  equipmentCardSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealGlow,
    borderWidth: 3,
    shadowColor: palette.tealPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
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
    ...typography.bodyLarge,
    fontWeight: '600',
    color: palette.white,
    letterSpacing: -0.1,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: palette.darkCard,
  },
  checkboxSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealPrimary,
    shadowColor: palette.tealPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  checkmark: {
    color: palette.deepBlack,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 16,
  },
  ctaContainer: {
    marginTop: spacing.s,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  continueButton: {
    borderRadius: 20,
    marginBottom: spacing.xs,
    overflow: 'hidden',
    shadowColor: palette.tealPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  continueButtonContent: {
    paddingVertical: spacing.l,
    backgroundColor: palette.tealPrimary,
  },
  continueButtonLabel: {
    ...typography.button,
    color: palette.deepBlack,
    fontWeight: '800',
    fontSize: 18,
  },
  hintText: {
    ...typography.caption,
    textAlign: 'center',
    color: palette.midGray,
    marginTop: spacing.xs,
  },
});

