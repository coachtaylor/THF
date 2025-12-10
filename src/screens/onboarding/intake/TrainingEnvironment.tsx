import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { OnboardingStackParamList } from "../../../types/onboarding";
import OnboardingLayout from "../../../components/onboarding/OnboardingLayout";
import SelectionCard from "../../../components/onboarding/SelectionCard";
import { colors, spacing } from "../../../theme/theme";
import { textStyles } from "../../../theme/components";
import { useProfile } from "../../../hooks/useProfile";
import { updateProfile } from "../../../services/storage/profile";
import { TrainingEnvironment as TrainingEnvironmentType } from "../../../types";

type TrainingEnvironmentNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  "TrainingEnvironment"
>;

interface TrainingEnvironmentProps {
  navigation: TrainingEnvironmentNavigationProp;
}

interface EnvironmentOption {
  id: TrainingEnvironmentType;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const ENVIRONMENT_OPTIONS: EnvironmentOption[] = [
  {
    id: "home",
    icon: "home-outline",
    title: "Home",
    description: "Training at home with limited or no gym equipment",
  },
  {
    id: "gym",
    icon: "barbell-outline",
    title: "Commercial Gym",
    description: "Full access to machines, free weights, and equipment",
  },
  {
    id: "studio",
    icon: "fitness-outline",
    title: "Small Studio",
    description: "Community gym or studio with basic equipment",
  },
  {
    id: "outdoors",
    icon: "sunny-outline",
    title: "Outdoors / Mixed",
    description: "Parks, outdoor spaces, or varying locations",
  },
];

export default function TrainingEnvironment({
  navigation,
}: TrainingEnvironmentProps) {
  const { profile } = useProfile();
  const [environment, setEnvironment] = useState<TrainingEnvironmentType | null>(
    null
  );

  // Load initial data from profile
  useEffect(() => {
    if (profile?.training_environment) {
      setEnvironment(profile.training_environment);
    }
  }, [profile]);

  const handleContinue = async () => {
    try {
      if (environment) {
        await updateProfile({
          training_environment: environment,
        });
        navigation.navigate("Experience");
      }
    } catch (error) {
      console.error("Error saving training environment:", error);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const canContinue = environment !== null;

  return (
    <OnboardingLayout
      currentStep={6}
      totalSteps={10}
      title="Where do you train?"
      subtitle="We'll customize your workouts based on where you feel most comfortable moving."
      onBack={handleBack}
      onContinue={handleContinue}
      canContinue={canContinue}
    >
      <View style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Primary Training Environment</Text>
          <Text style={styles.sectionSubtitle}>
            Select where you'll do most of your workouts. You can change this
            later in settings.
          </Text>
          <View style={styles.optionsContainer}>
            {ENVIRONMENT_OPTIONS.map((option) => (
              <SelectionCard
                key={option.id}
                icon={option.icon}
                title={option.title}
                description={option.description}
                selected={environment === option.id}
                onClick={() => setEnvironment(option.id)}
              />
            ))}
          </View>
        </View>

        {environment && (
          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.cyan[500]}
            />
            <Text style={styles.infoText}>
              {environment === "home" &&
                "We'll focus on bodyweight and minimal equipment exercises. Perfect if gyms feel uncomfortable or inaccessible."}
              {environment === "gym" &&
                "We'll include a full range of equipment options. You can always skip exercises if specific machines aren't available."}
              {environment === "studio" &&
                "We'll focus on common studio equipment like dumbbells, kettlebells, and basic machines."}
              {environment === "outdoors" &&
                "We'll prioritize portable and bodyweight exercises that work anywhere."}
            </Text>
          </View>
        )}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing["3xl"],
  },
  section: {
    gap: spacing.base,
  },
  sectionTitle: {
    ...textStyles.h3,
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    ...textStyles.bodySmall,
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.base,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.base,
    backgroundColor: colors.glass.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glass.borderPink,
  },
  infoText: {
    ...textStyles.bodySmall,
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
});
