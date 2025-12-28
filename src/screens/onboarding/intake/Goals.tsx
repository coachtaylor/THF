import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { OnboardingStackParamList } from "../../../types/onboarding";
import OnboardingLayout from "../../../components/onboarding/OnboardingLayout";
import { colors, spacing, borderRadius } from "../../../theme/theme";
import { useProfile } from "../../../hooks/useProfile";
import { updateProfile } from "../../../services/storage/profile";

type Goal = "feminization" | "masculinization" | "general_fitness" | "strength" | "endurance";

type GoalsNavigationProp = StackNavigationProp<OnboardingStackParamList, "Goals">;

interface GoalsProps {
  navigation: GoalsNavigationProp;
}

interface GoalCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  selected: "primary" | "secondary" | null;
  onPress: () => void;
}

function GoalCard({ icon, title, description, selected, onPress }: GoalCardProps) {
  const borderColor = selected === "primary"
    ? colors.accent.primary
    : selected === "secondary"
    ? colors.accent.secondary
    : colors.glass.border;

  const backgroundColor = selected === "primary"
    ? colors.glass.bgHero
    : selected === "secondary"
    ? colors.accent.secondaryMuted
    : colors.glass.bg;

  const iconColor = selected === "primary"
    ? colors.accent.primary
    : selected === "secondary"
    ? colors.accent.secondary
    : colors.text.secondary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.goalCard,
        {
          backgroundColor,
          borderColor,
          borderWidth: selected ? 2 : 1,
        },
        selected && styles.goalCardSelected,
        pressed && styles.buttonPressed,
      ]}
    >
      {/* Icon */}
      <View style={[
        styles.iconContainer,
        selected === "primary" && styles.iconContainerSelected,
        selected === "secondary" && styles.iconContainerSecondary,
      ]}>
        <Ionicons
          name={icon}
          size={22}
          color={iconColor}
        />
      </View>

      {/* Content */}
      <View style={styles.goalContent}>
        <Text style={[
          styles.goalTitle,
          selected && styles.goalTitleSelected
        ]}>{title}</Text>
        <Text style={styles.goalDescription}>{description}</Text>
      </View>

      {/* Badge indicator */}
      {selected && (
        <View style={[
          styles.badge,
          {
            backgroundColor: selected === "primary" ? colors.accent.primary : colors.accent.secondary,
          }
        ]}>
          <Text style={styles.badgeText}>
            {selected === "primary" ? "PRIMARY" : "SECONDARY"}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default function Goals({ navigation }: GoalsProps) {
  const { profile } = useProfile();
  const [primaryGoal, setPrimaryGoal] = useState<Goal | null>(null);
  const [secondaryGoal, setSecondaryGoal] = useState<Goal | null>(null);

  // Note: We intentionally don't pre-populate from profile during onboarding
  // User should actively choose their goals

  const goalInfo: Record<Goal, { description: string; focus: string[] }> = {
    feminization: {
      description: "Curvier, feminine physique",
      focus: ["Lower body emphasis (glutes, legs)", "Core strength and definition", "Lighter upper body work", "Flexibility and mobility"]
    },
    masculinization: {
      description: "Broader, stronger upper body",
      focus: ["Upper body emphasis (chest, shoulders, back)", "Core and arm strength", "Compound movements", "Progressive strength gains"]
    },
    general_fitness: {
      description: "Balanced health & energy",
      focus: ["Full-body workouts", "Cardiovascular health", "Functional movement", "Sustainable habits"]
    },
    strength: {
      description: "Maximum power & strength",
      focus: ["Heavy compound lifts", "Progressive overload", "Lower rep ranges", "Adequate recovery"]
    },
    endurance: {
      description: "Cardio & stamina focus",
      focus: ["Higher rep ranges", "Circuit training", "Cardio conditioning", "Active recovery"]
    }
  };

  const getAvailableGoals = () => {
    const genderIdentity = profile?.gender_identity || "nonbinary";
    const baseGoals: Array<{ id: Goal; icon: keyof typeof Ionicons.glyphMap; title: string }> = [
      { id: "general_fitness", icon: "heart-outline", title: "General Fitness" },
      { id: "strength", icon: "flash", title: "Strength" },
      { id: "endurance", icon: "trending-up", title: "Endurance" }
    ];

    if (genderIdentity === "mtf" || genderIdentity === "nonbinary" || genderIdentity === "questioning") {
      baseGoals.unshift({ id: "feminization", icon: "sparkles", title: "Feminization" });
    }

    if (genderIdentity === "ftm" || genderIdentity === "nonbinary" || genderIdentity === "questioning") {
      baseGoals.unshift({ id: "masculinization", icon: "pulse-outline", title: "Masculinization" });
    }

    return baseGoals;
  };

  const handleGoalPress = (goalId: Goal) => {
    if (primaryGoal === goalId) {
      // Clicking primary goal - remove it and promote secondary if exists
      setPrimaryGoal(secondaryGoal);
      setSecondaryGoal(null);
    } else if (secondaryGoal === goalId) {
      // Clicking secondary goal - remove it
      setSecondaryGoal(null);
    } else if (!primaryGoal) {
      // No primary yet - set as primary
      setPrimaryGoal(goalId);
    } else if (!secondaryGoal) {
      // Primary exists but no secondary - set as secondary
      setSecondaryGoal(goalId);
    } else {
      // Both exist - replace secondary
      setSecondaryGoal(goalId);
    }
  };

  const getGoalSelection = (goalId: Goal): "primary" | "secondary" | null => {
    if (primaryGoal === goalId) return "primary";
    if (secondaryGoal === goalId) return "secondary";
    return null;
  };

  const handleContinue = async () => {
    try {
      const secondaryGoals = secondaryGoal ? [secondaryGoal] : undefined;
      await updateProfile({
        primary_goal: primaryGoal!,
        secondary_goals: secondaryGoals,
      });
      navigation.navigate("TrainingEnvironment");
    } catch (error) {
      console.error("Error saving goals:", error);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const availableGoals = getAvailableGoals();

  return (
    <OnboardingLayout
      currentStep={5}
      totalSteps={10}
      title="Your Fitness Goals"
      subtitle="Select your primary goal and optionally a secondary focus to blend training styles."
      onBack={handleBack}
      onContinue={handleContinue}
      canContinue={primaryGoal !== null}
    >
      <View style={styles.container}>
        {/* Goal Selection Cards */}
        <View style={styles.goalsContainer}>
          {availableGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              icon={goal.icon}
              title={goal.title}
              description={goalInfo[goal.id].description}
              selected={getGoalSelection(goal.id)}
              onPress={() => handleGoalPress(goal.id)}
            />
          ))}
        </View>

        {/* Impact Info Box - Primary */}
        {primaryGoal && (
          <View style={styles.focusCard}>
            <View style={styles.focusHeader}>
              <View style={[styles.focusIconContainer, { backgroundColor: "rgba(6, 182, 212, 0.15)", borderColor: "rgba(6, 182, 212, 0.3)" }]}>
                <Ionicons name="information-circle" size={20} color={colors.accent.primary} />
              </View>
              <Text style={[styles.focusTitle, { color: colors.accent.primary }]}>
                Primary Focus:
              </Text>
            </View>
            <View style={styles.focusList}>
              {goalInfo[primaryGoal].focus.map((item, index) => (
                <View key={index} style={styles.focusItem}>
                  <Ionicons name="checkmark" size={20} color={colors.accent.primary} style={styles.checkmark} />
                  <Text style={styles.focusItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Impact Info Box - Secondary */}
        {secondaryGoal && (
          <View style={[styles.focusCard, styles.focusCardSecondary]}>
            <View style={styles.focusHeader}>
              <View style={[styles.focusIconContainer, { backgroundColor: "rgba(244, 63, 94, 0.15)", borderColor: "rgba(244, 63, 94, 0.3)" }]}>
                <Ionicons name="information-circle" size={20} color={colors.accent.secondary} />
              </View>
              <Text style={[styles.focusTitle, { color: colors.accent.secondary }]}>
                Secondary Focus:
              </Text>
            </View>
            <View style={styles.focusList}>
              {goalInfo[secondaryGoal].focus.map((item, index) => (
                <View key={index} style={styles.focusItem}>
                  <Ionicons name="checkmark" size={20} color={colors.accent.secondary} style={styles.checkmark} />
                  <Text style={styles.focusItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
  },
  goalsContainer: {
    gap: spacing.sm,
  },
  goalCard: {
    backgroundColor: colors.glass.bg,
    borderColor: colors.glass.border,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingRight: spacing.xl,
    borderRadius: borderRadius.xl,
    gap: spacing.base,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  goalCardSelected: {
    ...Platform.select({
      ios: {
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.bg.deep,
    textTransform: 'uppercase',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerSelected: {
    backgroundColor: colors.accent.primaryMuted,
    borderColor: colors.accent.primaryGlow,
  },
  iconContainerSecondary: {
    backgroundColor: colors.accent.secondaryMuted,
    borderColor: colors.accent.secondaryGlow,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  goalTitleSelected: {
    color: colors.text.primary,
  },
  goalDescription: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  focusCard: {
    backgroundColor: colors.glass.bgHero,
    padding: spacing.xl,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.accent.primary,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  focusCardSecondary: {
    backgroundColor: colors.accent.secondaryMuted,
    borderColor: colors.accent.secondary,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.secondary,
        shadowOpacity: 0.3,
      },
    }),
  },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  focusIconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
  },
  focusList: {
    gap: spacing.sm,
  },
  focusItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  checkmark: {
    marginTop: 2,
  },
  focusItemText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    color: colors.text.secondary,
  },
});
