import React, { useState, useEffect, useMemo } from "react";
import { View, Text, Pressable, StyleSheet, TextInput } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { OnboardingStackParamList } from "../../../types/onboarding";
import OnboardingLayout from "../../../components/onboarding/OnboardingLayout";
import SelectionCard from "../../../components/onboarding/SelectionCard";
import { colors, spacing, borderRadius } from "../../../theme/theme";
import { textStyles, inputStyles } from "../../../theme/components";
import { useProfile } from "../../../hooks/useProfile";
import { updateProfile, logEquipmentRequest } from "../../../services/storage/profile";
import { TrainingEnvironment } from "../../../types";
import { useSubscription } from "../../../contexts/SubscriptionContext";
import GlassModal from "../../../components/common/GlassModal";

type ExperienceLevel = "beginner" | "intermediate" | "advanced";

type ExperienceNavigationProp = StackNavigationProp<OnboardingStackParamList, "Experience">;

interface ExperienceProps {
  navigation: ExperienceNavigationProp;
}

const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
  { value: 90, label: "90 min" }
];

// Equipment options with environment availability
interface EquipmentOption {
  id: string;
  label: string;
  environments: TrainingEnvironment[]; // Which environments this equipment is available in
  defaultForEnv?: TrainingEnvironment[]; // Pre-select for these environments
}

const ALL_EQUIPMENT_OPTIONS: EquipmentOption[] = [
  { id: "bodyweight", label: "Bodyweight", environments: ["home", "gym", "studio", "outdoors"], defaultForEnv: ["home", "outdoors"] },
  { id: "dumbbells", label: "Dumbbells", environments: ["home", "gym", "studio"], defaultForEnv: ["home", "studio"] },
  { id: "bands", label: "Resistance Bands", environments: ["home", "gym", "studio", "outdoors"], defaultForEnv: ["home", "outdoors"] },
  { id: "kettlebells", label: "Kettlebell", environments: ["home", "gym", "studio"] },
  { id: "barbells", label: "Barbell", environments: ["gym", "studio"] },
  { id: "cables", label: "Cable Machine", environments: ["gym"] },
  { id: "machines", label: "Weight Machines", environments: ["gym"] },
  { id: "pull_up_bar", label: "Pull-up Bar", environments: ["home", "gym", "studio", "outdoors"] },
  { id: "bench", label: "Bench", environments: ["home", "gym", "studio"] },
  { id: "other", label: "Other Equipment", environments: ["home", "gym", "studio", "outdoors"] },
];

// Get filtered equipment options for a training environment
function getEquipmentForEnvironment(env?: TrainingEnvironment): EquipmentOption[] {
  if (!env) return ALL_EQUIPMENT_OPTIONS;
  return ALL_EQUIPMENT_OPTIONS.filter(opt => opt.environments.includes(env));
}

// Get default selected equipment for an environment
function getDefaultEquipmentForEnvironment(env?: TrainingEnvironment): Set<string> {
  if (!env) return new Set(["bodyweight"]);
  return new Set(
    ALL_EQUIPMENT_OPTIONS
      .filter(opt => opt.defaultForEnv?.includes(env))
      .map(opt => opt.id)
  );
}

export default function Experience({ navigation }: ExperienceProps) {
  const { profile } = useProfile();
  const { isPremium, freeTierLimits } = useSubscription();
  const maxFreeFrequency = freeTierLimits.WORKOUTS_PER_WEEK; // 2

  const [experience, setExperience] = useState<ExperienceLevel | null>(null);
  const [frequency, setFrequency] = useState<number>(2); // Default to free tier limit
  const [duration, setDuration] = useState<number>(45);
  const [equipment, setEquipment] = useState<Set<string>>(new Set());
  const [otherEquipmentText, setOtherEquipmentText] = useState<string>("");
  const [isOtherInputFocused, setIsOtherInputFocused] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Get training environment from profile
  const trainingEnvironment = profile?.training_environment;

  // Filter equipment options based on training environment
  const availableEquipment = useMemo(
    () => getEquipmentForEnvironment(trainingEnvironment),
    [trainingEnvironment]
  );

  // Load initial data from profile
  useEffect(() => {
    if (profile && !initialized) {
      if (profile.fitness_experience) {
        setExperience(profile.fitness_experience);
      }
      if (profile.workout_frequency) {
        // Clamp frequency to free tier limit if not premium
        const savedFrequency = profile.workout_frequency;
        setFrequency(isPremium ? savedFrequency : Math.min(savedFrequency, maxFreeFrequency));
      }
      if (profile.session_duration) {
        setDuration(profile.session_duration);
      }
      // If user has saved equipment, use it; otherwise use defaults for their environment
      if (profile.equipment && profile.equipment.length > 0) {
        setEquipment(new Set(profile.equipment));
      } else if (trainingEnvironment) {
        setEquipment(getDefaultEquipmentForEnvironment(trainingEnvironment));
      }
      // Load saved "other" equipment text
      if (profile.other_equipment_text) {
        setOtherEquipmentText(profile.other_equipment_text);
      }
      setInitialized(true);
    }
  }, [profile, trainingEnvironment, initialized, isPremium, maxFreeFrequency]);

  // Get environment display name
  const getEnvironmentLabel = (env?: TrainingEnvironment): string => {
    switch (env) {
      case "home": return "home";
      case "gym": return "gym";
      case "studio": return "studio";
      case "outdoors": return "outdoors";
      default: return "";
    }
  };

  const experienceOptions = [
    {
      id: "beginner" as ExperienceLevel,
      icon: "trophy-outline" as keyof typeof Ionicons.glyphMap,
      title: "Beginner",
      description: "New to fitness or returning after a long break"
    },
    {
      id: "intermediate" as ExperienceLevel,
      icon: "barbell-outline" as keyof typeof Ionicons.glyphMap,
      title: "Intermediate",
      description: "Comfortable with basic exercises, 6+ months experience"
    },
    {
      id: "advanced" as ExperienceLevel,
      icon: "trophy" as keyof typeof Ionicons.glyphMap,
      title: "Advanced",
      description: "Experienced lifter with 2+ years of consistent training"
    }
  ];

  const toggleEquipment = (id: string) => {
    const newEquipment = new Set(equipment);
    if (newEquipment.has(id)) {
      newEquipment.delete(id);
    } else {
      newEquipment.add(id);
    }
    setEquipment(newEquipment);
  };

  const handleContinue = async () => {
    try {
      if (experience && equipment.size > 0) {
        const hasOther = equipment.has("other");
        const trimmedOtherText = otherEquipmentText.trim();

        await updateProfile({
          fitness_experience: experience,
          workout_frequency: frequency,
          session_duration: duration,
          equipment: Array.from(equipment),
          // Only save other_equipment_text if "other" is selected and text is not empty
          other_equipment_text: hasOther && trimmedOtherText ? trimmedOtherText : undefined,
        });

        // Log to Supabase for analytics (fire and forget, don't block navigation)
        if (hasOther && trimmedOtherText) {
          logEquipmentRequest(trimmedOtherText).catch(err =>
            console.warn("Failed to log equipment request:", err)
          );
        }

        navigation.navigate("WorkoutDays");
      }
    } catch (error) {
      console.error("Error saving experience:", error);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const canContinue = experience !== null && equipment.size > 0;

  return (
    <OnboardingLayout
      currentStep={7}
      totalSteps={10}
      title="Experience & Preferences"
      subtitle="Tailor your program to your current fitness level and available resources."
      onBack={handleBack}
      onContinue={handleContinue}
      canContinue={canContinue}
    >
      <View style={styles.container}>
        {/* Experience Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience Level</Text>
          <View style={styles.experienceContainer}>
            {experienceOptions.map((option) => (
              <SelectionCard
                key={option.id}
                icon={option.icon}
                title={option.title}
                description={option.description}
                selected={experience === option.id}
                onClick={() => setExperience(option.id)}
              />
            ))}
          </View>
        </View>

        {/* Workout Frequency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout Frequency</Text>
          <Text style={styles.label}>DAYS PER WEEK</Text>
          
          {/* Number Input with +/- buttons */}
          <View style={styles.frequencyContainer}>
            <Pressable
              onPress={() => setFrequency(Math.max(1, frequency - 1))}
              disabled={frequency <= 1}
              style={({ pressed }) => [
                styles.frequencyButton,
                frequency <= 1 && styles.frequencyButtonDisabled,
                pressed && styles.buttonPressed
              ]}
            >
              <Ionicons name="remove" size={24} color={frequency <= 1 ? colors.text.tertiary : colors.accent.primary} />
            </Pressable>

            <View style={styles.frequencyDisplay}>
              <Text style={styles.frequencyText}>{frequency}</Text>
            </View>

            <Pressable
              onPress={() => {
                // Check if free user is trying to exceed the limit
                if (!isPremium && frequency >= maxFreeFrequency) {
                  setShowUpgradeModal(true);
                } else {
                  setFrequency(Math.min(7, frequency + 1));
                }
              }}
              disabled={isPremium ? frequency >= 7 : false}
              style={({ pressed }) => [
                styles.frequencyButton,
                isPremium && frequency >= 7 && styles.frequencyButtonDisabled,
                pressed && styles.buttonPressed
              ]}
            >
              <Ionicons
                name={!isPremium && frequency >= maxFreeFrequency ? "sparkles" : "add"}
                size={24}
                color={
                  isPremium && frequency >= 7
                    ? colors.text.tertiary
                    : colors.accent.primary
                }
              />
            </Pressable>
          </View>
        </View>

        {/* Session Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Duration</Text>
          <View style={styles.durationGrid}>
            {DURATION_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setDuration(option.value)}
                style={({ pressed }) => [
                  styles.durationButton,
                  duration === option.value && styles.durationButtonSelected,
                  pressed && styles.buttonPressed
                ]}
              >
                <Text style={[
                  styles.durationButtonText,
                  duration === option.value && styles.durationButtonTextSelected
                ]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Equipment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Equipment</Text>
          {trainingEnvironment && (
            <View style={styles.environmentNote}>
              <Ionicons name="location-outline" size={16} color={colors.accent.primary} />
              <Text style={styles.environmentNoteText}>
                Showing equipment for {getEnvironmentLabel(trainingEnvironment)} workouts
              </Text>
            </View>
          )}
          <Text style={styles.equipmentSubtitle}>
            Select all that apply (at least 1 required)
          </Text>
          <View style={styles.equipmentGrid}>
            {availableEquipment.map((option) => {
              const isSelected = equipment.has(option.id);
              return (
                <Pressable
                  key={option.id}
                  onPress={() => toggleEquipment(option.id)}
                  style={({ pressed }) => [
                    styles.equipmentButton,
                    isSelected && styles.equipmentButtonSelected,
                    pressed && styles.buttonPressed
                  ]}
                >
                  <View style={[
                    styles.equipmentCheckbox,
                    isSelected && styles.equipmentCheckboxSelected
                  ]}>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color={colors.text.primary} />
                    )}
                  </View>
                  <Text style={styles.equipmentLabel} numberOfLines={1}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Other Equipment Text Input */}
          {equipment.has("other") && (
            <View style={styles.otherEquipmentContainer}>
              <Text style={styles.inputLabel}>
                What equipment do you have? <Text style={styles.optionalText}>(Optional)</Text>
              </Text>
              <TextInput
                value={otherEquipmentText}
                onChangeText={setOtherEquipmentText}
                placeholder="e.g., suspension trainer, medicine ball, foam roller..."
                placeholderTextColor={colors.text.tertiary}
                multiline
                numberOfLines={2}
                maxLength={200}
                onFocus={() => setIsOtherInputFocused(true)}
                onBlur={() => setIsOtherInputFocused(false)}
                style={[
                  styles.otherEquipmentInput,
                  isOtherInputFocused && inputStyles.textInputFocused
                ]}
              />
            </View>
          )}

          {equipment.size === 0 && (
            <Text style={styles.equipmentError}>
              Please select at least one equipment option
            </Text>
          )}
        </View>
      </View>

      {/* Upgrade Modal for Free Tier Users */}
      <GlassModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        icon="sparkles"
        iconColor={colors.accent.primary}
        title="Unlock More Workouts"
        message={`Free plan includes ${maxFreeFrequency} workouts per week. Upgrade to Premium for unlimited weekly workouts and personalized programming.`}
        actions={[
          {
            label: "Upgrade to Premium",
            variant: "primary",
            onPress: () => {
              setShowUpgradeModal(false);
              navigation.navigate("Paywall");
            },
          },
          {
            label: `Keep ${maxFreeFrequency} Workouts`,
            variant: "ghost",
            onPress: () => {
              setShowUpgradeModal(false);
            },
          },
        ]}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing['3xl'],
  },
  section: {
    gap: spacing.base,
  },
  sectionTitle: {
    ...textStyles.h3,
    fontSize: 18,
    marginBottom: spacing.base,
  },
  label: {
    ...textStyles.label,
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  experienceContainer: {
    gap: spacing.md,
  },
  frequencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  frequencyButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequencyButtonDisabled: {
    opacity: 0.4,
  },
  frequencyDisplay: {
    flex: 1,
    height: 60,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequencyText: {
    ...textStyles.statMedium,
    fontSize: 36,
    color: colors.accent.primary,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  durationButton: {
    flex: 1,
    minWidth: '45%',
    height: 56,
    borderRadius: borderRadius.base,
    backgroundColor: colors.glass.bg,
    borderWidth: 2,
    borderColor: colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationButtonSelected: {
    backgroundColor: colors.glass.bgHero,
    borderColor: colors.accent.primary,
  },
  durationButtonText: {
    ...textStyles.label,
    fontSize: 16,
    color: colors.text.primary,
  },
  durationButtonTextSelected: {
    color: colors.accent.primary,
  },
  environmentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  environmentNoteText: {
    ...textStyles.bodySmall,
    fontSize: 13,
    color: colors.accent.primary,
  },
  equipmentSubtitle: {
    ...textStyles.bodySmall,
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.base,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  equipmentButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: borderRadius.base,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  equipmentButtonSelected: {
    backgroundColor: colors.glass.bgHero,
    borderWidth: 2,
    borderColor: colors.accent.primary,
  },
  equipmentCheckbox: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.glass.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipmentCheckboxSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  equipmentLabel: {
    ...textStyles.body,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    color: colors.text.primary,
  },
  equipmentError: {
    ...textStyles.bodySmall,
    fontSize: 13,
    color: colors.semantic.warning,
    marginTop: spacing.md,
  },
  otherEquipmentContainer: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  inputLabel: {
    ...textStyles.label,
    fontSize: 14,
    color: colors.text.primary,
  },
  optionalText: {
    color: colors.text.tertiary,
  },
  otherEquipmentInput: {
    ...inputStyles.textInput,
    height: 80,
    paddingTop: spacing.base,
    textAlignVertical: 'top',
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
