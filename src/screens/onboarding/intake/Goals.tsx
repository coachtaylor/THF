import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { OnboardingStackParamList } from "../../../types/onboarding";
import OnboardingLayout from "../../../components/onboarding/OnboardingLayout";
import { colors, spacing, borderRadius } from "../../../theme/theme";
import { glassStyles, textStyles } from "../../../theme/components";
import { useProfile } from "../../../hooks/useProfile";
import { updateProfile } from "../../../services/storage/profile";
import { Platform } from "react-native";

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
    ? colors.cyan[500] 
    : selected === "secondary"
    ? colors.red[500]
    : colors.glass.border;
  
  const backgroundColor = selected === "primary"
    ? colors.glass.bgHero
    : selected === "secondary"
    ? "rgba(244, 63, 94, 0.08)"
    : colors.glass.bg;

  const iconColor = selected === "primary"
    ? colors.cyan[500]
    : selected === "secondary"
    ? colors.red[500]
    : colors.text.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.goalCard,
        {
          backgroundColor,
          borderColor,
          borderWidth: selected ? 2 : 1,
        },
        selected && styles.goalCardSelected
      ]}
    >
      {/* Badge indicator */}
      {selected && (
        <View style={[
          styles.badge,
          {
            backgroundColor: selected === "primary" ? colors.cyan[500] : colors.red[500],
          }
        ]}>
          <Text style={styles.badgeText}>
            {selected === "primary" ? "PRIMARY" : "SECONDARY"}
          </Text>
        </View>
      )}

      {/* Icon */}
      <View style={styles.iconContainer}>
        <Ionicons 
          name={icon} 
          size={32} 
          color={iconColor}
          style={{ opacity: selected ? 1 : 0.7 }}
        />
      </View>

      {/* Content */}
      <Text style={styles.goalTitle}>{title}</Text>
      <Text style={styles.goalDescription}>{description}</Text>
    </TouchableOpacity>
  );
}

export default function Goals({ navigation }: GoalsProps) {
  const { profile } = useProfile();
  const [primaryGoal, setPrimaryGoal] = useState<Goal | null>(null);
  const [secondaryGoal, setSecondaryGoal] = useState<Goal | null>(null);

  // Load initial data from profile
  useEffect(() => {
    if (profile) {
      if (profile.primary_goal) {
        setPrimaryGoal(profile.primary_goal);
      }
      if (profile.secondary_goals && profile.secondary_goals.length > 0) {
        setSecondaryGoal(profile.secondary_goals[0] as Goal);
      }
    }
  }, [profile]);

  const goalInfo: Record<Goal, { description: string; focus: string[] }> = {
    feminization: {
      description: "Build a curvier, more feminine physique through strategic muscle development",
      focus: ["Lower body emphasis (glutes, legs)", "Core strength and definition", "Lighter upper body work", "Flexibility and mobility"]
    },
    masculinization: {
      description: "Develop a broader, more masculine build through upper body development",
      focus: ["Upper body emphasis (chest, shoulders, back)", "Core and arm strength", "Compound movements", "Progressive strength gains"]
    },
    general_fitness: {
      description: "Overall health, energy, and well-being with balanced training",
      focus: ["Full-body workouts", "Cardiovascular health", "Functional movement", "Sustainable habits"]
    },
    strength: {
      description: "Build maximum strength and power across all major movements",
      focus: ["Heavy compound lifts", "Progressive overload", "Lower rep ranges", "Adequate recovery"]
    },
    endurance: {
      description: "Improve cardiovascular fitness and muscular endurance",
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
      navigation.navigate("Experience");
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
      totalSteps={8}
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
                <Ionicons name="information-circle" size={20} color={colors.cyan[500]} />
              </View>
              <Text style={[styles.focusTitle, { color: colors.cyan[500] }]}>
                Primary Focus:
              </Text>
            </View>
            <View style={styles.focusList}>
              {goalInfo[primaryGoal].focus.map((item, index) => (
                <View key={index} style={styles.focusItem}>
                  <Ionicons name="checkmark" size={20} color={colors.cyan[500]} style={styles.checkmark} />
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
                <Ionicons name="information-circle" size={20} color={colors.red[500]} />
              </View>
              <Text style={[styles.focusTitle, { color: colors.red[500] }]}>
                Secondary Focus:
              </Text>
            </View>
            <View style={styles.focusList}>
              {goalInfo[secondaryGoal].focus.map((item, index) => (
                <View key={index} style={styles.focusItem}>
                  <Ionicons name="checkmark" size={20} color={colors.red[500]} style={styles.checkmark} />
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
    gap: spacing.base,
  },
  goalCard: {
    ...glassStyles.card,
    padding: spacing['2xl'],
    borderRadius: borderRadius['2xl'],
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  goalCardSelected: {
    ...Platform.select({
      ios: {
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  badge: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    ...Platform.select({
      ios: {
        shadowColor: colors.cyan[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  badgeText: {
    ...textStyles.caption,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.text.primary,
    textTransform: 'uppercase',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.base,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  goalTitle: {
    ...textStyles.h2,
    fontSize: 22,
    marginBottom: spacing.sm,
    color: colors.text.primary,
  },
  goalDescription: {
    ...textStyles.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
  },
  focusCard: {
    ...glassStyles.cardHero,
    padding: spacing.xl,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.cyan[500],
    ...Platform.select({
      ios: {
        shadowColor: colors.cyan[500],
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
    backgroundColor: "rgba(244, 63, 94, 0.08)",
    borderColor: colors.red[500],
    ...Platform.select({
      ios: {
        shadowColor: colors.red[500],
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
    ...textStyles.h3,
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
    ...textStyles.bodySmall,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    color: colors.text.secondary,
  },
});
