import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { OnboardingStackParamList } from "../../../types/onboarding";
import { DysphoriaTrigger } from "../../../types";
import OnboardingLayout from "../../../components/onboarding/OnboardingLayout";
import { colors, spacing, borderRadius } from "../../../theme/theme";
import { glassStyles, textStyles, inputStyles } from "../../../theme/components";
import { useProfile } from "../../../hooks/useProfile";
import { updateProfile } from "../../../services/storage/profile";

type DysphoriaNavigationProp = StackNavigationProp<OnboardingStackParamList, "DysphoriaTriggers">;

interface DysphoriaTriggersProps {
  navigation: DysphoriaNavigationProp;
}

// Map UI-friendly trigger IDs to profile types
const TRIGGER_MAPPING: Record<string, DysphoriaTrigger> = {
  mirrors: "mirrors",
  public_spaces: "crowded_spaces",
  photos: "other", // Photos tracking maps to 'other'
  changing_rooms: "locker_rooms",
  swimming: "other", // Swimming maps to 'other'
  form_focused: "other", // Form-focused maps to 'other'
};

const TRIGGER_OPTIONS = [
  {
    id: "mirrors",
    icon: "eye-outline" as keyof typeof Ionicons.glyphMap,
    label: "Mirrors in Gym",
    description: "I prefer to avoid mirror-facing exercises"
  },
  {
    id: "public_spaces",
    icon: "people-outline" as keyof typeof Ionicons.glyphMap,
    label: "Crowded Spaces",
    description: "I'm more comfortable with home workouts or quiet times"
  },
  {
    id: "photos",
    icon: "camera-outline" as keyof typeof Ionicons.glyphMap,
    label: "Progress Photos",
    description: "I'd rather skip photo-based tracking"
  },
  {
    id: "changing_rooms",
    icon: "shirt-outline" as keyof typeof Ionicons.glyphMap,
    label: "Changing Rooms",
    description: "I prefer workouts I can do without changing"
  },
  {
    id: "swimming",
    icon: "water-outline" as keyof typeof Ionicons.glyphMap,
    label: "Swimming/Water Activities",
    description: "I want to avoid aquatic exercises"
  },
  {
    id: "form_focused",
    icon: "heart-outline" as keyof typeof Ionicons.glyphMap,
    label: "Body-Focused Movements",
    description: "I prefer functional exercises over aesthetic ones"
  }
];

export default function DysphoriaTriggers({ navigation }: DysphoriaTriggersProps) {
  const { profile } = useProfile();
  const [triggers, setTriggers] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<string>("");
  const [isFocused, setIsFocused] = useState(false);

  // Load initial data from profile
  useEffect(() => {
    if (profile) {
      if (profile.dysphoria_triggers && profile.dysphoria_triggers.length > 0) {
        // Map profile triggers back to UI IDs
        const uiTriggers = new Set<string>();
        profile.dysphoria_triggers.forEach((trigger) => {
          // Find the UI ID that maps to this profile trigger
          const uiId = Object.keys(TRIGGER_MAPPING).find(
            (key) => TRIGGER_MAPPING[key] === trigger
          );
          if (uiId) {
            uiTriggers.add(uiId);
          }
        });
        setTriggers(uiTriggers);
      }
      if (profile.dysphoria_notes) {
        setNotes(profile.dysphoria_notes);
      }
    }
  }, [profile]);

  const toggleTrigger = (id: string) => {
    const newTriggers = new Set(triggers);
    if (newTriggers.has(id)) {
      newTriggers.delete(id);
    } else {
      newTriggers.add(id);
    }
    setTriggers(newTriggers);
  };

  const handleContinue = async () => {
    try {
      // Map UI trigger IDs to profile trigger types
      const profileTriggers: DysphoriaTrigger[] = Array.from(triggers)
        .map((uiId) => TRIGGER_MAPPING[uiId])
        .filter((trigger): trigger is DysphoriaTrigger => trigger !== undefined);

      await updateProfile({
        dysphoria_triggers: profileTriggers,
        dysphoria_notes: notes.trim() || undefined,
      });
      navigation.navigate("Review");
    } catch (error) {
      console.error("Error saving dysphoria triggers:", error);
    }
  };

  const handleSkip = async () => {
    try {
      await updateProfile({
        dysphoria_triggers: [],
        dysphoria_notes: undefined,
      });
      navigation.navigate("Review");
    } catch (error) {
      console.error("Error skipping dysphoria triggers:", error);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <OnboardingLayout
      currentStep={8}
      totalSteps={9}
      title="Dysphoria Considerations"
      subtitle="Help us create a comfortable, affirming experience. This is completely optional and private."
      onBack={handleBack}
      onContinue={handleContinue}
      canContinue={true}
    >
      <View style={styles.container}>
        {/* Privacy Notice */}
        <View style={styles.privacyCard}>
          <Ionicons 
            name="lock-closed" 
            size={24} 
            color={colors.cyan[500]} 
            style={styles.privacyIcon}
          />
          <View style={styles.privacyContent}>
            <Text style={styles.privacyTitle}>
              Your Privacy Matters
            </Text>
            <Text style={styles.privacyText}>
              This information stays on your device and is only used to customize your workout recommendations. You can skip this entirely.
            </Text>
          </View>
        </View>

        {/* Trigger Checkboxes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select any that apply</Text>
          <Text style={styles.sectionSubtitle}>
            We'll adjust your program to respect these preferences
          </Text>
          <View style={styles.triggersContainer}>
            {TRIGGER_OPTIONS.map((option) => {
              const isSelected = triggers.has(option.id);
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => toggleTrigger(option.id)}
                  activeOpacity={0.7}
                  style={[
                    styles.triggerCard,
                    isSelected && styles.triggerCardSelected
                  ]}
                >
                  <View style={[
                    styles.triggerCheckbox,
                    isSelected && styles.triggerCheckboxSelected
                  ]}>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color={colors.text.primary} />
                    )}
                  </View>

                  <View style={styles.triggerContent}>
                    <View style={styles.triggerHeader}>
                      <Ionicons 
                        name={option.icon} 
                        size={20} 
                        color={colors.cyan[500]} 
                      />
                      <Text style={styles.triggerLabel}>{option.label}</Text>
                    </View>
                    <Text style={styles.triggerDescription}>
                      {option.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Additional Notes */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>
            Additional Notes <Text style={styles.optionalText}>(Optional)</Text>
          </Text>
          <Text style={styles.inputHint}>
            Any other preferences or considerations we should know about?
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g., I prefer gender-neutral language in instructions..."
            placeholderTextColor={colors.text.tertiary}
            multiline
            numberOfLines={3}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={[
              styles.notesInput,
              isFocused && inputStyles.textInputFocused
            ]}
          />
        </View>

        {/* Skip Button */}
        <TouchableOpacity
          onPress={handleSkip}
          activeOpacity={0.7}
          style={styles.skipButton}
        >
          <Text style={styles.skipButtonText}>Skip This Step</Text>
        </TouchableOpacity>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...textStyles.h3,
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...textStyles.bodySmall,
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.base,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
  },
  privacyIcon: {
    marginTop: 2,
  },
  privacyContent: {
    flex: 1,
  },
  privacyTitle: {
    ...textStyles.label,
    fontSize: 15,
    fontWeight: '600',
    color: colors.cyan[500],
    marginBottom: spacing.xs,
  },
  privacyText: {
    ...textStyles.bodySmall,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  triggersContainer: {
    gap: spacing.md,
  },
  triggerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.base,
    padding: spacing.lg,
    borderRadius: borderRadius.base,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  triggerCardSelected: {
    backgroundColor: colors.glass.bgHero,
    borderWidth: 2,
    borderColor: colors.cyan[500],
  },
  triggerCheckbox: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.glass.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  triggerCheckboxSelected: {
    backgroundColor: colors.cyan[500],
    borderColor: colors.cyan[500],
  },
  triggerContent: {
    flex: 1,
  },
  triggerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  triggerLabel: {
    ...textStyles.label,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  triggerDescription: {
    ...textStyles.bodySmall,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  inputLabel: {
    ...textStyles.label,
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  optionalText: {
    color: colors.text.tertiary,
  },
  inputHint: {
    ...textStyles.bodySmall,
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  notesInput: {
    ...inputStyles.textInput,
    height: 100,
    paddingTop: spacing.base,
    textAlignVertical: 'top',
  },
  skipButton: {
    height: 56,
    borderRadius: borderRadius.base,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    ...textStyles.label,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
});
