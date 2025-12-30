import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Modal, ScrollView } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { OnboardingStackParamList } from "../../../types/onboarding";
import OnboardingLayout from "../../../components/onboarding/OnboardingLayout";
import SelectionCard from "../../../components/onboarding/SelectionCard";
import { colors, spacing, borderRadius } from "../../../theme/theme";
import { textStyles, cardStyles } from "../../../theme/components";
import { useProfile } from "../../../hooks/useProfile";
import { updateProfile } from "../../../services/storage/profile";

type BindingFrequency = "daily" | "sometimes" | "rarely" | "never";
type BinderType = "commercial" | "sports_bra" | "compression_top" | "other";

type BindingInfoNavigationProp = StackNavigationProp<OnboardingStackParamList, "BindingInfo">;
type BindingInfoRouteProp = RouteProp<OnboardingStackParamList, "BindingInfo">;

interface BindingInfoProps {
  navigation: BindingInfoNavigationProp;
  route: BindingInfoRouteProp;
}

const BINDER_TYPE_OPTIONS = [
  { value: "" as const, label: "Select type (optional)" },
  { value: "commercial" as const, label: "Commercial binder (gc2b, Underworks, etc.)" },
  { value: "sports_bra" as const, label: "Sports bra" },
  { value: "compression_top" as const, label: "Compression top" },
  { value: "other" as const, label: "Other" },
];

export default function BindingInfo({ navigation, route }: BindingInfoProps) {
  const genderIdentity = route.params?.genderIdentity;
  const { profile } = useProfile();
  const [bindsChest, setBindsChest] = useState<boolean | null>(null);
  const [frequency, setFrequency] = useState<BindingFrequency | null>(null);
  const [durationHours, setDurationHours] = useState<number>(6);
  const [binderType, setBinderType] = useState<string>("");
  const [showBinderTypePicker, setShowBinderTypePicker] = useState(false);

  // Load initial data from profile
  useEffect(() => {
    if (profile) {
      if (profile.binds_chest !== undefined) {
        setBindsChest(profile.binds_chest);
      }
      if (profile.binding_frequency) {
        setFrequency(profile.binding_frequency);
      }
      if (profile.binding_duration_hours) {
        setDurationHours(profile.binding_duration_hours);
      }
      if (profile.binder_type) {
        // Map profile binder_type to our options
        const mappedType = profile.binder_type === "ace_bandage" || profile.binder_type === "diy" 
          ? "other" 
          : profile.binder_type;
        setBinderType(mappedType);
      }
    }
  }, [profile]);

  const frequencyOptions = [
    {
      id: "daily" as BindingFrequency,
      icon: "time" as keyof typeof Ionicons.glyphMap,
      title: "Daily",
      description: "I bind most days of the week"
    },
    {
      id: "sometimes" as BindingFrequency,
      icon: "time" as keyof typeof Ionicons.glyphMap,
      title: "Sometimes",
      description: "A few times per week"
    },
    {
      id: "rarely" as BindingFrequency,
      icon: "time" as keyof typeof Ionicons.glyphMap,
      title: "Rarely",
      description: "Occasionally or for special occasions"
    },
    {
      id: "never" as BindingFrequency,
      icon: "shield-checkmark" as keyof typeof Ionicons.glyphMap,
      title: "Never",
      description: "I don't currently bind"
    }
  ];

  const handleContinue = async () => {
    try {
      const bindingData: {
        binds_chest: boolean;
        binding_frequency?: BindingFrequency;
        binding_duration_hours?: number;
        binder_type?: "commercial" | "sports_bra" | "ace_bandage" | "diy" | "other";
      } = {
        binds_chest: bindsChest === true,
      };

      if (bindsChest === true && frequency) {
        bindingData.binding_frequency = frequency;
        if (frequency !== "never") {
          bindingData.binding_duration_hours = durationHours;
        }
        if (binderType && binderType !== "") {
          // Map compression_top to other for profile (or keep as is if profile supports it)
          const profileBinderType = binderType === "compression_top" 
            ? "other" 
            : binderType as "commercial" | "sports_bra" | "other";
          bindingData.binder_type = profileBinderType;
        }
      }

      await updateProfile(bindingData);
      navigation.navigate("Surgery", { genderIdentity });
    } catch (error) {
      console.error("Error saving binding info:", error);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const canContinue = bindsChest === false || (bindsChest === true && frequency !== null);
  const showWarning = durationHours > 8;

  const selectedBinderTypeLabel = BINDER_TYPE_OPTIONS.find(opt => opt.value === binderType)?.label || "Select type (optional)";

  return (
    <OnboardingLayout
      currentStep={3}
      totalSteps={8}
      title="Chest Binding"
      subtitle="Binding affects breathing and exercise selection. This helps us recommend safe, comfortable workouts."
      onBack={handleBack}
      onContinue={handleContinue}
      canContinue={canContinue}
    >
      <View style={styles.container}>
        {/* Yes/No Question */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Do you bind your chest?</Text>
          <View style={styles.buttonRow}>
            <Pressable
              onPress={() => {
                setBindsChest(true);
                if (!frequency) {
                  setFrequency("sometimes");
                }
              }}
              style={({ pressed }) => [
                styles.toggleButton,
                bindsChest === true && styles.toggleButtonSelected,
                pressed && styles.buttonPressed
              ]}
            >
              <Text style={[
                styles.toggleButtonText,
                bindsChest === true && styles.toggleButtonTextSelected
              ]}>
                Yes
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setBindsChest(false);
                setFrequency(null);
              }}
              style={({ pressed }) => [
                styles.toggleButton,
                bindsChest === false && styles.toggleButtonSelected,
                pressed && styles.buttonPressed
              ]}
            >
              <Text style={[
                styles.toggleButtonText,
                bindsChest === false && styles.toggleButtonTextSelected
              ]}>
                No
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Binding Details (shown if Yes) */}
        {bindsChest === true && (
          <>
            {/* Frequency Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How often do you bind?</Text>
              <View style={styles.frequencyContainer}>
                {frequencyOptions.map((option) => (
                  <SelectionCard
                    key={option.id}
                    icon={option.icon}
                    title={option.title}
                    description={option.description}
                    selected={frequency === option.id}
                    onClick={() => setFrequency(option.id)}
                  />
                ))}
              </View>
            </View>

            {/* Duration Input */}
            {frequency && frequency !== "never" && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Typical binding duration</Text>
                <Text style={styles.label}>HOURS PER SESSION</Text>
                
                {/* Number Input with +/- buttons */}
                <View style={styles.durationContainer}>
                  <Pressable
                    onPress={() => setDurationHours(Math.max(1, durationHours - 1))}
                    style={({ pressed }) => [styles.durationButton, pressed && styles.buttonPressed]}
                  >
                    <Ionicons name="remove" size={24} color={colors.accent.primary} />
                  </Pressable>

                  <View style={styles.durationDisplay}>
                    <Text style={styles.durationText}>{durationHours}</Text>
                  </View>

                  <Pressable
                    onPress={() => setDurationHours(Math.min(12, durationHours + 1))}
                    style={({ pressed }) => [styles.durationButton, pressed && styles.buttonPressed]}
                  >
                    <Ionicons name="add" size={24} color={colors.accent.primary} />
                  </Pressable>
                </View>

                {/* Warning if > 8 hours */}
                {showWarning && (
                  <View style={cardStyles.warning}>
                    <Ionicons 
                      name="warning" 
                      size={20} 
                      color={colors.semantic.warning} 
                      style={styles.warningIcon}
                    />
                    <Text style={styles.warningText}>
                      Binding for more than 8 hours isn't recommended. We'll prioritize binding-safe exercises and shorter workout durations for your safety.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Binder Type (Optional) */}
            {frequency && frequency !== "never" && (
              <View style={styles.section}>
                <Text style={styles.label}>
                  Binder Type <Text style={styles.optionalText}>(Optional)</Text>
                </Text>
                <Pressable
                  onPress={() => setShowBinderTypePicker(true)}
                  style={({ pressed }) => [styles.pickerButton, pressed && styles.buttonPressed]}
                >
                  <Text style={[
                    styles.pickerText,
                    !binderType && styles.pickerTextPlaceholder
                  ]}>
                    {selectedBinderTypeLabel}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.text.primary} />
                </Pressable>
              </View>
            )}
          </>
        )}
      </View>

      {/* Binder Type Picker Modal */}
      <Modal
        visible={showBinderTypePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBinderTypePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Binder Type</Text>
              <Pressable
                onPress={() => setShowBinderTypePicker(false)}
                style={({ pressed }) => pressed && styles.buttonPressed}
              >
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {BINDER_TYPE_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setBinderType(option.value);
                    setShowBinderTypePicker(false);
                  }}
                  style={({ pressed }) => [
                    styles.modalOption,
                    binderType === option.value && styles.modalOptionSelected,
                    pressed && styles.buttonPressed
                  ]}
                >
                  <Text style={[
                    styles.modalOptionText,
                    binderType === option.value && styles.modalOptionTextSelected,
                    !option.value && styles.modalOptionTextPlaceholder
                  ]}>
                    {option.label}
                  </Text>
                  {binderType === option.value && (
                    <Ionicons name="checkmark" size={20} color={colors.accent.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
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
  optionalText: {
    color: colors.text.tertiary,
    textTransform: 'none',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  toggleButton: {
    flex: 1,
    height: 56,
    borderRadius: borderRadius.base,
    backgroundColor: colors.glass.bg,
    borderWidth: 2,
    borderColor: colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonSelected: {
    backgroundColor: colors.glass.bgHero,
    borderColor: colors.accent.primary,
    borderWidth: 2,
  },
  toggleButtonText: {
    ...textStyles.label,
    fontSize: 16,
    color: colors.text.primary,
  },
  toggleButtonTextSelected: {
    color: colors.accent.primary,
  },
  frequencyContainer: {
    gap: spacing.md,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  durationButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationDisplay: {
    flex: 1,
    height: 60,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationText: {
    ...textStyles.statMedium,
    fontSize: 36,
    color: colors.accent.primary,
  },
  warningIcon: {
    marginTop: 2,
  },
  warningText: {
    ...textStyles.bodySmall,
    flex: 1,
    color: colors.semantic.warning,
  },
  pickerButton: {
    height: 56,
    borderRadius: borderRadius.base,
    backgroundColor: colors.glass.bg,
    borderWidth: 2,
    borderColor: colors.glass.border,
    paddingHorizontal: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    ...textStyles.label,
    fontSize: 16,
    color: colors.text.primary,
    flex: 1,
  },
  pickerTextPlaceholder: {
    color: colors.text.tertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bg.raised,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  modalTitle: {
    ...textStyles.h3,
    fontSize: 20,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  modalOptionSelected: {
    backgroundColor: colors.glass.bgHero,
  },
  modalOptionText: {
    ...textStyles.body,
    flex: 1,
    color: colors.text.primary,
  },
  modalOptionTextSelected: {
    color: colors.accent.primary,
  },
  modalOptionTextPlaceholder: {
    color: colors.text.tertiary,
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
