import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { OnboardingStackParamList } from "../../../types/onboarding";
import OnboardingLayout from "../../../components/onboarding/OnboardingLayout";
import SelectionCard from "../../../components/onboarding/SelectionCard";
import { colors, spacing, borderRadius } from "../../../theme/theme";
import { textStyles } from "../../../theme/components";
import { useProfile } from "../../../hooks/useProfile";
import { updateProfile } from "../../../services/storage/profile";
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

export default function Experience({ navigation }: ExperienceProps) {
  const { profile } = useProfile();
  const { isPremium, freeTierLimits } = useSubscription();
  const maxFreeFrequency = freeTierLimits.WORKOUTS_PER_WEEK; // 2

  const [experience, setExperience] = useState<ExperienceLevel | null>(null);
  const [frequency, setFrequency] = useState<number>(2); // Default to free tier limit
  const [duration, setDuration] = useState<number>(45);
  const [initialized, setInitialized] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
      setInitialized(true);
    }
  }, [profile, initialized, isPremium, maxFreeFrequency]);

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

  const handleContinue = async () => {
    try {
      if (experience) {
        await updateProfile({
          fitness_experience: experience,
          workout_frequency: frequency,
          session_duration: duration,
        });

        navigation.navigate("EnvironmentAndDays");
      }
    } catch (error) {
      console.error("Error saving experience:", error);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const canContinue = experience !== null;

  return (
    <OnboardingLayout
      currentStep={6}
      totalSteps={8}
      title="Experience & Schedule"
      subtitle="Tell us your fitness level and how often you want to train. You'll pick equipment on the next screen."
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
  buttonPressed: {
    opacity: 0.8,
  },
});
