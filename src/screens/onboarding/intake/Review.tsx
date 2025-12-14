import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Alert } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { OnboardingStackParamList } from "../../../types/onboarding";
import { Profile } from "../../../types";
import OnboardingLayout from "../../../components/onboarding/OnboardingLayout";
import { colors, spacing, borderRadius } from "../../../theme/theme";
import { glassStyles, textStyles, cardStyles } from "../../../theme/components";
import { useProfile } from "../../../hooks/useProfile";
import { generatePlan } from "../../../services/planGenerator";
import { savePlan } from "../../../services/storage/plan";
import { formatEquipmentLabel } from "../../../utils/equipment";
import { Platform } from "react-native";
import { trackOnboardingCompleted, trackWorkoutGenerated } from "../../../services/analytics";

type ReviewNavigationProp = StackNavigationProp<OnboardingStackParamList, "Review">;

interface ReviewProps {
  navigation: ReviewNavigationProp;
}

const GENDER_IDENTITY_LABELS: Record<string, string> = {
  mtf: "Trans Woman",
  ftm: "Trans Man",
  nonbinary: "Non-Binary",
  questioning: "Questioning"
};

const GOAL_LABELS: Record<string, string> = {
  feminization: "Feminization",
  masculinization: "Masculinization",
  general_fitness: "General Fitness",
  strength: "Strength",
  endurance: "Endurance"
};

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced"
};

const BINDING_FREQUENCY_LABELS: Record<string, string> = {
  daily: "Daily",
  sometimes: "Sometimes",
  rarely: "Rarely",
  never: "Never"
};

const HRT_TYPE_LABELS: Record<string, string> = {
  estrogen_blockers: "Estrogen + Anti-androgens",
  testosterone: "Testosterone",
  none: "None"
};

export default function Review({ navigation }: ReviewProps) {
  const { profile } = useProfile();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>("");

  if (!profile) {
    return null;
  }

  const getHRTStatus = (): string => {
    if (!profile.on_hrt) return "No";
    if (profile.hrt_type) {
      return `Yes - ${HRT_TYPE_LABELS[profile.hrt_type] || profile.hrt_type}`;
    }
    return "Yes";
  };

  const getBindingStatus = (): string => {
    if (!profile.binds_chest) return "No";
    if (profile.binding_frequency) {
      return `Yes - ${BINDING_FREQUENCY_LABELS[profile.binding_frequency] || profile.binding_frequency}`;
    }
    return "Yes";
  };

  const getSurgeriesStatus = (): string => {
    if (!profile.surgeries || profile.surgeries.length === 0) return "None";
    const count = profile.surgeries.length;
    return `${count} ${count === 1 ? "surgery" : "surgeries"}`;
  };

  const getSecondaryGoal = (): string => {
    if (!profile.secondary_goals || profile.secondary_goals.length === 0) return "None";
    const goal = profile.secondary_goals[0];
    return GOAL_LABELS[goal] || goal;
  };

  const getEquipmentCount = (): string => {
    if (!profile.equipment || profile.equipment.length === 0) return "0 types available";
    return `${profile.equipment.length} ${profile.equipment.length === 1 ? "type" : "types"} available`;
  };

  const getDysphoriaTriggersCount = (): string => {
    if (!profile.dysphoria_triggers || profile.dysphoria_triggers.length === 0) {
      return "0 preferences";
    }
    const count = profile.dysphoria_triggers.length;
    return `${count} ${count === 1 ? "preference" : "preferences"}`;
  };

  const sections = [
    {
      id: "identity",
      title: "Identity & Medical",
      icon: "person-outline" as keyof typeof Ionicons.glyphMap,
      items: [
        { label: "Gender Identity", value: GENDER_IDENTITY_LABELS[profile.gender_identity] || profile.gender_identity },
        { label: "Pronouns", value: profile.pronouns || "Not specified" },
        { label: "HRT Status", value: getHRTStatus() },
        { label: "Chest Binding", value: getBindingStatus() },
        { label: "Surgeries", value: getSurgeriesStatus() }
      ]
    },
    {
      id: "goals",
      title: "Goals & Experience",
      icon: "sparkles" as keyof typeof Ionicons.glyphMap,
      items: [
        { label: "Primary Goal", value: GOAL_LABELS[profile.primary_goal] || profile.primary_goal },
        { label: "Secondary Goal", value: getSecondaryGoal() },
        { label: "Experience Level", value: EXPERIENCE_LABELS[profile.fitness_experience] || profile.fitness_experience }
      ]
    },
    {
      id: "preferences",
      title: "Workout Preferences",
      icon: "barbell-outline" as keyof typeof Ionicons.glyphMap,
      items: [
        { label: "Frequency", value: `${profile.workout_frequency} days/week` },
        { label: "Duration", value: `${profile.session_duration} minutes` },
        { label: "Equipment", value: getEquipmentCount() }
      ]
    },
    {
      id: "dysphoria",
      title: "Dysphoria Considerations",
      icon: "heart-outline" as keyof typeof Ionicons.glyphMap,
      items: [
        { label: "Triggers Selected", value: getDysphoriaTriggersCount() },
        { label: "Additional Notes", value: profile.dysphoria_notes ? "Provided" : "None" }
      ]
    }
  ];

  const handleEdit = (sectionId: string) => {
    // Map section IDs to navigation routes
    switch (sectionId) {
      case "identity":
        navigation.navigate("GenderIdentity");
        break;
      case "goals":
        navigation.navigate("Goals");
        break;
      case "preferences":
        navigation.navigate("Experience");
        break;
      case "dysphoria":
        navigation.navigate("DysphoriaTriggers");
        break;
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setGenerationProgress(0);
      setCurrentStep("Analyzing your profile");

      // Simulate progress steps
      const steps = [
        "Analyzing your profile",
        "Selecting exercises",
        "Creating workout schedule",
        "Applying safety protocols",
        "Finalizing your program"
      ];

      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i]);
        setGenerationProgress(((i + 1) / steps.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Generate the plan
      const plan = await generatePlan(profile);

      // Save the plan using consistent userId (prefer user_id, fall back to id)
      const userId = profile.user_id || profile.id || 'default';
      console.log('💾 Saving plan for userId:', userId);
      await savePlan(plan as any, userId);

      // Track onboarding completion
      await trackOnboardingCompleted();

      // Track workout generation for each day in the plan
      if (plan.days && plan.days.length > 0) {
        const firstWorkout = plan.days[0];
        await trackWorkoutGenerated(
          plan.id,
          firstWorkout.workout?.name || 'Generated Workout',
          profile.session_duration || 45,
          firstWorkout.workout?.exercises?.length || 0
        );
      }

      setIsGenerating(false);

      // Navigate to ProgramSetup to show the generated program
      navigation.navigate("ProgramSetup");
    } catch (error) {
      console.error("Error generating plan:", error);
      setIsGenerating(false);
      Alert.alert(
        'Error',
        'Failed to generate your workout program. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <>
      <OnboardingLayout
        currentStep={10}
        totalSteps={10}
        title="Review & Generate"
        subtitle="Review your profile and generate your personalized program."
        onBack={handleBack}
        onContinue={handleGenerate}
        canContinue={true}
        continueButtonText="Generate Program"
      >
        <View style={styles.container}>
          {/* Summary Cards */}
          {sections.map((section) => (
            <View key={section.id} style={styles.sectionCard}>
              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <View style={styles.sectionIconContainer}>
                    <Ionicons name={section.icon} size={24} color={colors.cyan[500]} />
                  </View>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleEdit(section.id)}
                  activeOpacity={0.7}
                  style={styles.editButton}
                >
                  <Ionicons name="create-outline" size={18} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Section Items */}
              <View style={styles.sectionItems}>
                {section.items.map((item, index) => (
                  <View key={index} style={styles.sectionItem}>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <Text style={styles.itemValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* What's Next Card */}
          <View style={styles.whatsNextCard}>
            <View style={styles.whatsNextHeader}>
              <Ionicons name="sparkles" size={28} color={colors.cyan[500]} />
              <Text style={styles.whatsNextTitle}>What's Next?</Text>
            </View>
            <View style={styles.whatsNextList}>
              {[
                "Your personalized workout program will be generated",
                "Exercise selection tailored to your goals and safety needs",
                "Progress tracking with your privacy in mind",
                "Adaptive programming that evolves with you"
              ].map((item, index) => (
                <View key={index} style={styles.whatsNextItem}>
                  <Ionicons name="checkmark" size={20} color={colors.cyan[500]} style={styles.checkmark} />
                  <Text style={styles.whatsNextItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Privacy Reminder */}
          <View style={cardStyles.success}>
            <Ionicons 
              name="shield-checkmark" 
              size={20} 
              color={colors.semantic.success} 
              style={styles.privacyIcon}
            />
            <Text style={styles.privacyText}>
              All your data stays on your device. Nothing is sent to external servers.
            </Text>
          </View>
        </View>
      </OnboardingLayout>

      {/* Generation Modal */}
      <Modal
        visible={isGenerating}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Icon */}
            <View style={styles.modalIconContainer}>
              <Ionicons name="sparkles" size={40} color={colors.cyan[500]} />
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>Generating Your Program</Text>
            
            {/* Subtitle */}
            <Text style={styles.modalSubtitle}>
              Creating a personalized workout program tailored to your unique needs and goals
            </Text>
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${generationProgress}%` }]} />
            </View>
            
            {/* Percentage */}
            <Text style={styles.progressText}>{Math.round(generationProgress)}%</Text>

            {/* Checklist */}
            <View style={styles.checklist}>
              {[
                "Analyzing your profile",
                "Selecting exercises",
                "Creating workout schedule",
                "Applying safety protocols",
                "Finalizing your program"
              ].map((step, index) => {
                const isComplete = generationProgress > (index * 20);
                return (
                  <View key={index} style={styles.checklistItem}>
                    <Ionicons 
                      name={isComplete ? "checkmark-circle" : "ellipse-outline"} 
                      size={20} 
                      color={isComplete ? colors.cyan[500] : colors.text.tertiary} 
                    />
                    <Text style={[
                      styles.checklistText,
                      isComplete && styles.checklistTextComplete
                    ]}>
                      {step}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
  },
  sectionCard: {
    ...glassStyles.card,
    padding: spacing.xl,
    borderRadius: borderRadius['2xl'],
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...textStyles.h3,
    fontSize: 18,
    fontWeight: '600',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionItems: {
    gap: spacing.md,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.base,
  },
  itemLabel: {
    ...textStyles.body,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    flex: 1,
  },
  itemValue: {
    ...textStyles.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'right',
    flex: 1,
  },
  whatsNextCard: {
    ...glassStyles.cardHero,
    padding: spacing['2xl'],
    borderRadius: borderRadius['3xl'],
    borderWidth: 1,
    borderColor: colors.cyan[500],
    ...Platform.select({
      ios: {
        shadowColor: colors.cyan[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  whatsNextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  whatsNextTitle: {
    ...textStyles.h2,
    fontSize: 20,
    fontWeight: '700',
    color: colors.cyan[500],
  },
  whatsNextList: {
    gap: spacing.md,
  },
  whatsNextItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  checkmark: {
    marginTop: 2,
  },
  whatsNextItemText: {
    ...textStyles.body,
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
    color: colors.text.secondary,
  },
  privacyIcon: {
    marginTop: 2,
  },
  privacyText: {
    ...textStyles.bodySmall,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
    color: colors.semantic.success,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.bg.raised,
    borderRadius: borderRadius['3xl'],
    padding: spacing['3xl'],
    gap: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: colors.cyan[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 32,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: colors.cyan[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalTitle: {
    ...textStyles.h1,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  modalSubtitle: {
    ...textStyles.body,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.cyan[500],
    borderRadius: borderRadius.full,
    ...Platform.select({
      ios: {
        shadowColor: colors.cyan[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
      },
    }),
  },
  progressText: {
    ...textStyles.h2,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.cyan[500],
    marginBottom: spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: colors.cyan[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
    }),
  },
  checklist: {
    gap: spacing.md,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checklistText: {
    ...textStyles.body,
    fontSize: 14,
    color: colors.text.tertiary,
  },
  checklistTextComplete: {
    color: colors.text.secondary,
  },
});
