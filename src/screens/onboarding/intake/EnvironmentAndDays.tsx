import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Modal } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { OnboardingStackParamList } from "../../../types/onboarding";
import OnboardingLayout from "../../../components/onboarding/OnboardingLayout";
import SelectionCard from "../../../components/onboarding/SelectionCard";
import { colors, spacing, borderRadius } from "../../../theme/theme";
import { textStyles } from "../../../theme/components";
import { useProfile } from "../../../hooks/useProfile";
import { updateProfile } from "../../../services/storage/profile";
import { TrainingEnvironment as TrainingEnvironmentType } from "../../../types";

type EnvironmentAndDaysNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  "EnvironmentAndDays"
>;

interface EnvironmentAndDaysProps {
  navigation: EnvironmentAndDaysNavigationProp;
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

const DAYS_OF_WEEK = [
  { id: 0, short: "S", full: "Sunday" },
  { id: 1, short: "M", full: "Monday" },
  { id: 2, short: "T", full: "Tuesday" },
  { id: 3, short: "W", full: "Wednesday" },
  { id: 4, short: "T", full: "Thursday" },
  { id: 5, short: "F", full: "Friday" },
  { id: 6, short: "S", full: "Saturday" },
];

const getDefaultDays = (frequency: number): number[] => {
  switch (frequency) {
    case 1:
      return [1];
    case 2:
      return [1, 4];
    case 3:
      return [1, 3, 5];
    case 4:
      return [1, 2, 4, 5];
    case 5:
      return [1, 2, 3, 5, 6];
    case 6:
      return [1, 2, 3, 4, 5, 6];
    case 7:
      return [0, 1, 2, 3, 4, 5, 6];
    default:
      return [1, 3, 5];
  }
};

export default function EnvironmentAndDays({
  navigation,
}: EnvironmentAndDaysProps) {
  const { profile } = useProfile();
  const [environment, setEnvironment] =
    useState<TrainingEnvironmentType | null>(null);
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [initialized, setInitialized] = useState(false);

  // Passed-days modal state
  const [showPassedDaysModal, setShowPassedDaysModal] = useState(false);
  const [passedDays, setPassedDays] = useState<number[]>([]);
  const [availableSubstituteDays, setAvailableSubstituteDays] = useState<
    number[]
  >([]);
  const [selectedSubstitute, setSelectedSubstitute] = useState<number | null>(
    null,
  );
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
  const [daysArrayForSave, setDaysArrayForSave] = useState<number[]>([]);

  const workoutFrequency = profile?.workout_frequency || 3;

  useEffect(() => {
    if (profile && !initialized) {
      if (profile.training_environment) {
        setEnvironment(profile.training_environment);
      }
      if (
        profile.preferred_workout_days &&
        profile.preferred_workout_days.length > 0
      ) {
        setSelectedDays(new Set(profile.preferred_workout_days));
      } else {
        setSelectedDays(new Set(getDefaultDays(workoutFrequency)));
      }
      setInitialized(true);
    }
  }, [profile, workoutFrequency, initialized]);

  const toggleDay = (dayId: number) => {
    const next = new Set(selectedDays);
    if (next.has(dayId)) {
      if (next.size > workoutFrequency) {
        next.delete(dayId);
      }
    } else {
      if (next.size < workoutFrequency) {
        next.add(dayId);
      } else {
        const daysArray = Array.from(next).sort((a, b) => a - b);
        const dayToRemove = daysArray.find((d) => d !== dayId);
        if (dayToRemove !== undefined) {
          next.delete(dayToRemove);
          next.add(dayId);
        }
      }
    }
    setSelectedDays(next);
  };

  const saveAndGoToReview = async (
    days: number[],
    substituteDays: number[],
  ) => {
    if (!environment) return;
    await updateProfile({
      training_environment: environment,
      preferred_workout_days: days,
      first_week_substitute_days: substituteDays,
    });
    navigation.navigate("Review");
  };

  const handleContinue = async () => {
    try {
      const daysArray = Array.from(selectedDays).sort((a, b) => a - b);
      const today = new Date().getDay();
      const passed = daysArray.filter((day) => day < today);

      if (passed.length > 0) {
        const futureDays = daysArray.filter((day) => day >= today);
        const available: number[] = [];
        for (let d = today; d <= 6; d++) {
          if (!futureDays.includes(d)) {
            available.push(d);
          }
        }

        setPassedDays(passed);
        setAvailableSubstituteDays(available);
        setSelectedSubstitute(available.length > 0 ? available[0] : null);
        setDaysArrayForSave(daysArray);
        setShowPassedDaysModal(true);
        return;
      }

      if (!environment) return;
      await updateProfile({
        training_environment: environment,
        preferred_workout_days: daysArray,
      });
      navigation.navigate("Review");
    } catch (error) {
      console.error("Error saving environment/workout days:", error);
    }
  };

  const handlePickSubstitute = async () => {
    try {
      setShowPassedDaysModal(false);
      await saveAndGoToReview(
        daysArrayForSave,
        selectedSubstitute !== null ? [selectedSubstitute] : [],
      );
    } catch (error) {
      console.error("Error saving workout days:", error);
    }
  };

  const handleSkipThisWeek = () => {
    setShowPassedDaysModal(false);
    setShowSkipConfirmation(true);
  };

  const handleSkipConfirmed = async () => {
    try {
      setShowSkipConfirmation(false);
      await saveAndGoToReview(daysArrayForSave, []);
    } catch (error) {
      console.error("Error saving workout days:", error);
    }
  };

  const getPassedDaysText = () =>
    passedDays.map((d) => DAYS_OF_WEEK[d].full).join(" and ");

  const getFutureSelectedDaysText = () => {
    const futureDays = daysArrayForSave.filter(
      (day) => day >= new Date().getDay(),
    );
    return futureDays.map((d) => DAYS_OF_WEEK[d].full).join(" & ");
  };

  const getSelectedDaysText = () => {
    const sortedDays = Array.from(selectedDays).sort((a, b) => a - b);
    return sortedDays.map((d) => DAYS_OF_WEEK[d].full).join(", ");
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const canContinue =
    environment !== null && selectedDays.size === workoutFrequency;

  return (
    <OnboardingLayout
      currentStep={8}
      totalSteps={10}
      title="Where & When You Train"
      subtitle="Tell us where you train and which days you want to work out."
      onBack={handleBack}
      onContinue={handleContinue}
      canContinue={canContinue}
    >
      <View style={styles.container}>
        {/* Environment Section */}
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

          {environment && (
            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={colors.accent.primary}
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

        {/* Days Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Workout Days</Text>
          <Text style={styles.sectionSubtitle}>
            Select {workoutFrequency} day{workoutFrequency !== 1 ? "s" : ""} for
            your weekly workouts. The other days will be rest days.
          </Text>

          <View style={styles.daysInfoCard}>
            <Ionicons
              name="calendar-outline"
              size={24}
              color={colors.accent.primary}
              style={styles.daysInfoIcon}
            />
            <View style={styles.daysInfoContent}>
              <Text style={styles.daysInfoTitle}>
                Build a Sustainable Routine
              </Text>
              <Text style={styles.daysInfoText}>
                Choose days that fit your schedule. Rest days are just as
                important as workout days for recovery and progress.
              </Text>
            </View>
          </View>

          <Text style={styles.daysCountLabel}>
            {selectedDays.size}/{workoutFrequency} days selected
          </Text>

          <View style={styles.daysContainer}>
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = selectedDays.has(day.id);
              return (
                <Pressable
                  key={day.id}
                  onPress={() => toggleDay(day.id)}
                  style={({ pressed }) => [
                    styles.dayButton,
                    isSelected && styles.dayButtonSelected,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayLetter,
                      isSelected && styles.dayLetterSelected,
                    ]}
                  >
                    {day.short}
                  </Text>
                  <Text
                    style={[
                      styles.dayLabel,
                      isSelected && styles.dayLabelSelected,
                    ]}
                  >
                    {day.full.slice(0, 3)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {selectedDays.size > 0 && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons
                  name="fitness-outline"
                  size={20}
                  color={colors.accent.primary}
                />
                <Text style={styles.summaryTitle}>Your Workout Schedule</Text>
              </View>
              <Text style={styles.summaryText}>{getSelectedDaysText()}</Text>
              <Text style={styles.summarySubtext}>
                {7 - workoutFrequency} rest day
                {7 - workoutFrequency !== 1 ? "s" : ""} per week
              </Text>
            </View>
          )}

          {selectedDays.size !== workoutFrequency && (
            <View style={styles.validationMessage}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={colors.text.tertiary}
              />
              <Text style={styles.validationText}>
                {selectedDays.size < workoutFrequency
                  ? `Select ${workoutFrequency - selectedDays.size} more day${
                      workoutFrequency - selectedDays.size !== 1 ? "s" : ""
                    }`
                  : `Tap a day to swap it with another`}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Modal: Passed Days - Pick Substitute */}
      <Modal
        visible={showPassedDaysModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPassedDaysModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons
                name="calendar-outline"
                size={32}
                color={colors.accent.primary}
              />
              <Text style={styles.modalTitle}>
                Looks like {getPassedDaysText()} already passed!
              </Text>
              <Text style={styles.modalSubtitle}>
                Would you like to pick a different day for this week?
              </Text>
            </View>

            {availableSubstituteDays.length > 0 && (
              <View style={styles.modalDaysContainer}>
                {availableSubstituteDays.map((dayId) => {
                  const day = DAYS_OF_WEEK[dayId];
                  const isToday = dayId === new Date().getDay();
                  const isSelected = selectedSubstitute === dayId;
                  return (
                    <Pressable
                      key={dayId}
                      onPress={() => setSelectedSubstitute(dayId)}
                      style={({ pressed }) => [
                        styles.modalDayButton,
                        isSelected && styles.modalDayButtonSelected,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalDayText,
                          isSelected && styles.modalDayTextSelected,
                        ]}
                      >
                        {isToday ? "Today" : day.full}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={colors.accent.primary}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}

            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handlePickSubstitute}
                disabled={selectedSubstitute === null}
              >
                <Text style={styles.modalButtonTextPrimary}>
                  {selectedSubstitute !== null
                    ? `Pick ${
                        selectedSubstitute === new Date().getDay()
                          ? "Today"
                          : DAYS_OF_WEEK[selectedSubstitute].full
                      }`
                    : "Pick a day"}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonSecondary,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleSkipThisWeek}
              >
                <Text style={styles.modalButtonTextSecondary}>
                  Skip this week
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Skip Confirmation */}
      <Modal
        visible={showSkipConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSkipConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons
                name="checkmark-circle-outline"
                size={32}
                color={colors.accent.primary}
              />
              <Text style={styles.modalTitle}>No problem!</Text>
              <Text style={styles.modalSubtitle}>
                Your dashboard will show{" "}
                {
                  daysArrayForSave.filter((d) => d >= new Date().getDay())
                    .length
                }{" "}
                workout
                {daysArrayForSave.filter((d) => d >= new Date().getDay())
                  .length !== 1
                  ? "s"
                  : ""}{" "}
                this week
                {getFutureSelectedDaysText() &&
                  ` (${getFutureSelectedDaysText()})`}
                , but next week you'll have your full {getSelectedDaysText()}{" "}
                schedule.
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleSkipConfirmed}
              >
                <Text style={styles.modalButtonTextPrimary}>Got it</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    marginTop: spacing.md,
  },
  infoText: {
    ...textStyles.bodySmall,
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
  daysInfoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.accent.primaryMuted,
    borderWidth: 1,
    borderColor: colors.accent.primaryGlow,
  },
  daysInfoIcon: {
    marginTop: 2,
  },
  daysInfoContent: {
    flex: 1,
  },
  daysInfoTitle: {
    ...textStyles.label,
    fontSize: 15,
    fontWeight: "600",
    color: colors.accent.primary,
    marginBottom: spacing.xs,
  },
  daysInfoText: {
    ...textStyles.bodySmall,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  daysCountLabel: {
    ...textStyles.h3,
    fontSize: 16,
    textAlign: "center",
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  dayButton: {
    flex: 1,
    aspectRatio: 0.7,
    maxWidth: 52,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glass.bg,
    borderWidth: 2,
    borderColor: colors.glass.border,
  },
  dayButtonSelected: {
    backgroundColor: colors.accent.primaryMuted,
    borderColor: colors.accent.primary,
  },
  dayLetter: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text.tertiary,
  },
  dayLetterSelected: {
    color: colors.accent.primary,
  },
  dayLabel: {
    ...textStyles.caption,
    fontSize: 10,
    color: colors.text.disabled,
    textTransform: "uppercase",
  },
  dayLabelSelected: {
    color: colors.text.secondary,
  },
  summaryCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    gap: spacing.sm,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  summaryTitle: {
    ...textStyles.label,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
  },
  summaryText: {
    ...textStyles.body,
    fontSize: 15,
    color: colors.accent.primary,
    fontWeight: "500",
  },
  summarySubtext: {
    ...textStyles.bodySmall,
    fontSize: 13,
    color: colors.text.tertiary,
  },
  validationMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  validationText: {
    ...textStyles.bodySmall,
    fontSize: 14,
    color: colors.text.tertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  modalHeader: {
    alignItems: "center",
    gap: spacing.md,
  },
  modalTitle: {
    ...textStyles.h3,
    fontSize: 18,
    color: colors.text.primary,
    textAlign: "center",
  },
  modalSubtitle: {
    ...textStyles.body,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  modalDaysContainer: {
    gap: spacing.sm,
  },
  modalDayButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glass.bg,
    borderWidth: 2,
    borderColor: colors.glass.border,
  },
  modalDayButtonSelected: {
    backgroundColor: colors.accent.primaryMuted,
    borderColor: colors.accent.primary,
  },
  modalDayText: {
    ...textStyles.body,
    fontSize: 15,
    color: colors.text.secondary,
  },
  modalDayTextSelected: {
    color: colors.accent.primary,
    fontWeight: "600",
  },
  modalButtons: {
    gap: spacing.sm,
  },
  modalButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonPrimary: {
    backgroundColor: colors.accent.primary,
  },
  modalButtonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  modalButtonTextPrimary: {
    ...textStyles.label,
    fontSize: 15,
    fontWeight: "600",
    color: colors.bg.primary,
  },
  modalButtonTextSecondary: {
    ...textStyles.label,
    fontSize: 15,
    fontWeight: "500",
    color: colors.text.secondary,
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
