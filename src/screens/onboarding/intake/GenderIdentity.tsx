import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Keyboard,
  Pressable,
  Modal,
  Alert,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import DateTimePicker from "@react-native-community/datetimepicker";
import { OnboardingStackParamList } from "../../../types/onboarding";
import OnboardingLayout from "../../../components/onboarding/OnboardingLayout";
import SelectionCard from "../../../components/onboarding/SelectionCard";
import { colors, spacing, borderRadius } from "../../../theme";
import { inputStyles, textStyles } from "../../../theme/components";
import { updateProfile } from "../../../services/storage/profile";

type GenderIdentity = "mtf" | "ftm" | "nonbinary" | "questioning";
type GenderIdentityNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  "GenderIdentity"
>;

interface GenderIdentityData {
  genderIdentity: GenderIdentity | null;
  pronouns: string;
  chosenName: string;
}

interface GenderIdentityProps {
  navigation: GenderIdentityNavigationProp;
  initialData?: GenderIdentityData;
}

export default function GenderIdentity({
  navigation,
  initialData,
}: GenderIdentityProps) {
  const [selectedGender, setSelectedGender] = useState<GenderIdentity | null>(
    initialData?.genderIdentity || null,
  );
  const [chosenName, setChosenName] = useState(initialData?.chosenName || "");
  const [pronouns, setPronouns] = useState(initialData?.pronouns || "");
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isPronounsFocused, setIsPronounsFocused] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDOBPicker, setShowDOBPicker] = useState(false);

  const genderOptions = [
    {
      id: "mtf" as GenderIdentity,
      icon: "heart" as const,
      title: "Trans Woman",
      description: "Assigned male at birth, identify as woman/feminine",
    },
    {
      id: "ftm" as GenderIdentity,
      icon: "person" as const,
      title: "Trans Man",
      description: "Assigned female at birth, identify as man/masculine",
    },
    {
      id: "nonbinary" as GenderIdentity,
      icon: "sparkles" as const,
      title: "Non-Binary",
      description: "Gender identity outside the binary spectrum",
    },
    {
      id: "questioning" as GenderIdentity,
      icon: "help-circle" as const,
      title: "Questioning",
      description: "Still exploring my gender identity",
    },
  ];

  const handleContinue = async () => {
    if (selectedGender && dateOfBirth) {
      // Age validation for COPPA compliance
      const today = new Date();
      let age = today.getFullYear() - dateOfBirth.getFullYear();
      const monthDiff = today.getMonth() - dateOfBirth.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
      ) {
        age--;
      }

      if (age < 13) {
        Alert.alert(
          "Age Requirement",
          "TransFitness requires users to be at least 13 years old for safety and legal compliance (COPPA).",
          [{ text: "OK" }],
        );
        return;
      }

      try {
        // Save gender identity, chosen name, pronouns, and date of birth to profile
        await updateProfile({
          gender_identity: selectedGender,
          chosen_name: chosenName || undefined,
          pronouns: pronouns || undefined,
          date_of_birth: dateOfBirth,
        });

        navigation.navigate("HRTStatus", {
          genderIdentity: selectedGender,
        });
      } catch (error) {
        console.error("Error saving gender identity:", error);
        // Still navigate even if save fails
        navigation.navigate("HRTStatus", {
          genderIdentity: selectedGender,
        });
      }
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={8}
      title="Your Gender Identity"
      subtitle="Help us personalize your fitness journey. This information is private and stays on your device."
      onBack={handleBack}
      onContinue={handleContinue}
      canContinue={selectedGender !== null && dateOfBirth !== null}
    >
      <View style={styles.container}>
        {/* Gender Selection Cards */}
        {genderOptions.map((option) => (
          <SelectionCard
            key={option.id}
            icon={option.icon}
            title={option.title}
            description={option.description}
            selected={selectedGender === option.id}
            onClick={() => setSelectedGender(option.id)}
          />
        ))}

        {/* Personal Info Section */}
        <View style={styles.personalInfoSection}>
          {/* Chosen Name Input */}
          <View style={styles.inputGroup}>
            <Text style={[textStyles.label, styles.label]}>
              What should we call you?{" "}
              <Text style={styles.optional}>(Optional)</Text>
            </Text>
            <TextInput
              placeholder="Your chosen name"
              placeholderTextColor={colors.text.tertiary}
              value={chosenName}
              onChangeText={setChosenName}
              onFocus={() => setIsNameFocused(true)}
              onBlur={() => setIsNameFocused(false)}
              style={[
                inputStyles.textInput,
                isNameFocused && inputStyles.textInputFocused,
              ]}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
          </View>

          {/* Pronouns Input */}
          <View style={styles.inputGroup}>
            <Text style={[textStyles.label, styles.label]}>
              Pronouns <Text style={styles.optional}>(Optional)</Text>
            </Text>
            <TextInput
              placeholder="e.g., she/her, he/him, they/them"
              placeholderTextColor={colors.text.tertiary}
              value={pronouns}
              onChangeText={setPronouns}
              onFocus={() => setIsPronounsFocused(true)}
              onBlur={() => setIsPronounsFocused(false)}
              style={[
                inputStyles.textInput,
                isPronounsFocused && inputStyles.textInputFocused,
              ]}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
          </View>

          {/* Date of Birth Input */}
          <View style={styles.inputGroup}>
            <Text style={[textStyles.label, styles.label]}>
              Date of Birth <Text style={styles.required}>*</Text>
            </Text>
            <Pressable
              onPress={() => setShowDOBPicker(true)}
              style={[inputStyles.textInput, styles.dobButton]}
            >
              <Text
                style={dateOfBirth ? styles.dobValue : styles.dobPlaceholder}
              >
                {dateOfBirth
                  ? dateOfBirth.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Tap to select your date of birth"}
              </Text>
            </Pressable>
            <Text style={styles.dobHint}>
              Required for age-appropriate programming and safety (ages 13+)
            </Text>
          </View>
        </View>

        {/* Date of Birth Picker Modal */}
        {showDOBPicker && (
          <Modal visible={true} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.pickerModal}>
                <Text style={styles.pickerTitle}>Select Date of Birth</Text>
                <DateTimePicker
                  value={dateOfBirth || new Date(2000, 0, 1)}
                  mode="date"
                  display="spinner"
                  minimumDate={new Date(1920, 0, 1)}
                  maximumDate={new Date()}
                  onChange={(event, date) => {
                    if (date) setDateOfBirth(date);
                  }}
                />
                <Pressable
                  onPress={() => setShowDOBPicker(false)}
                  style={styles.doneButton}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.base,
  },
  personalInfoSection: {
    marginTop: spacing.base,
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.md,
  },
  label: {
    marginBottom: 0,
  },
  optional: {
    color: colors.text.tertiary,
    fontWeight: "400",
  },
  required: {
    color: colors.semantic.error,
    fontWeight: "600",
  },
  dobButton: {
    justifyContent: "center",
  },
  dobValue: {
    color: colors.text.primary,
    fontSize: 16,
  },
  dobPlaceholder: {
    color: colors.text.tertiary,
    fontSize: 16,
  },
  dobHint: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: -spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  pickerModal: {
    backgroundColor: colors.bg.primary,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  doneButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
