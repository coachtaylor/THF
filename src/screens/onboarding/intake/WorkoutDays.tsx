import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Modal } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { OnboardingStackParamList } from "../../../types/onboarding";
import OnboardingLayout from "../../../components/onboarding/OnboardingLayout";
import { colors, spacing, borderRadius } from "../../../theme/theme";
import { textStyles } from "../../../theme/components";
import { useProfile } from "../../../hooks/useProfile";
import { updateProfile } from "../../../services/storage/profile";

type WorkoutDaysNavigationProp = StackNavigationProp<OnboardingStackParamList, "WorkoutDays">;

interface WorkoutDaysProps {
  navigation: WorkoutDaysNavigationProp;
}

// Day configuration
const DAYS_OF_WEEK = [
  { id: 0, short: "S", full: "Sunday" },
  { id: 1, short: "M", full: "Monday" },
  { id: 2, short: "T", full: "Tuesday" },
  { id: 3, short: "W", full: "Wednesday" },
  { id: 4, short: "T", full: "Thursday" },
  { id: 5, short: "F", full: "Friday" },
  { id: 6, short: "S", full: "Saturday" },
];

// Smart defaults based on frequency
const getDefaultDays = (frequency: number): number[] => {
  switch (frequency) {
    case 1:
      return [1]; // Monday
    case 2:
      return [1, 4]; // Monday, Thursday
    case 3:
      return [1, 3, 5]; // Monday, Wednesday, Friday
    case 4:
      return [1, 2, 4, 5]; // Monday, Tuesday, Thursday, Friday
    case 5:
      return [1, 2, 3, 5, 6]; // Monday-Wednesday, Friday, Saturday
    case 6:
      return [1, 2, 3, 4, 5, 6]; // Monday-Saturday
    case 7:
      return [0, 1, 2, 3, 4, 5, 6]; // Every day
    default:
      return [1, 3, 5]; // Default to Mon/Wed/Fri
  }
};

export default function WorkoutDays({ navigation }: WorkoutDaysProps) {
  const { profile } = useProfile();
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [initialized, setInitialized] = useState(false);

  // Modal state for handling passed workout days
  const [showPassedDaysModal, setShowPassedDaysModal] = useState(false);
  const [passedDays, setPassedDays] = useState<number[]>([]);
  const [availableSubstituteDays, setAvailableSubstituteDays] = useState<number[]>([]);
  const [selectedSubstitute, setSelectedSubstitute] = useState<number | null>(null);
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
  const [daysArrayForSave, setDaysArrayForSave] = useState<number[]>([]);

  const workoutFrequency = profile?.workout_frequency || 3;

  // Initialize with profile data or smart defaults
  useEffect(() => {
    if (profile && !initialized) {
      if (profile.preferred_workout_days && profile.preferred_workout_days.length > 0) {
        setSelectedDays(new Set(profile.preferred_workout_days));
      } else {
        // Set smart defaults based on frequency
        setSelectedDays(new Set(getDefaultDays(workoutFrequency)));
      }
      setInitialized(true);
    }
  }, [profile, workoutFrequency, initialized]);

  const toggleDay = (dayId: number) => {
    const newSelected = new Set(selectedDays);
    if (newSelected.has(dayId)) {
      // Only allow removal if we have more than required
      if (newSelected.size > workoutFrequency) {
        newSelected.delete(dayId);
      }
    } else {
      // Only allow addition if we have less than required
      if (newSelected.size < workoutFrequency) {
        newSelected.add(dayId);
      } else {
        // At max capacity - swap: remove earliest day not being clicked
        // Find the first selected day that isn't the one being clicked
        const daysArray = Array.from(newSelected).sort((a, b) => a - b);
        const dayToRemove = daysArray.find(d => d !== dayId);
        if (dayToRemove !== undefined) {
          newSelected.delete(dayToRemove);
          newSelected.add(dayId);
        }
      }
    }
    setSelectedDays(newSelected);
  };

  const handleContinue = async () => {
    try {
      const daysArray = Array.from(selectedDays).sort((a, b) => a - b);
      const today = new Date().getDay(); // 0=Sun, 1=Mon, etc.

      // Check if any selected days have already passed this week
      const passed = daysArray.filter(day => day < today);

      if (passed.length > 0) {
        // Calculate available substitute days: today through end of week, excluding already-selected future days
        const futureDays = daysArray.filter(day => day >= today);
        const available: number[] = [];
        for (let d = today; d <= 6; d++) {
          if (!futureDays.includes(d)) {
            available.push(d);
          }
        }

        setPassedDays(passed);
        setAvailableSubstituteDays(available);
        setSelectedSubstitute(available.length > 0 ? available[0] : null); // Default to first available (today if possible)
        setDaysArrayForSave(daysArray);
        setShowPassedDaysModal(true);
        return;
      }

      // No passed days - continue normally
      await updateProfile({
        preferred_workout_days: daysArray,
      });
      navigation.navigate("DysphoriaTriggers");
    } catch (error) {
      console.error("Error saving workout days:", error);
    }
  };

  // Handle when user picks a substitute day
  const handlePickSubstitute = async () => {
    try {
      await updateProfile({
        preferred_workout_days: daysArrayForSave,
        first_week_substitute_days: selectedSubstitute !== null ? [selectedSubstitute] : [],
      });
      setShowPassedDaysModal(false);
      navigation.navigate("DysphoriaTriggers");
    } catch (error) {
      console.error("Error saving workout days:", error);
    }
  };

  // Handle when user wants to skip this week
  const handleSkipThisWeek = () => {
    setShowPassedDaysModal(false);
    setShowSkipConfirmation(true);
  };

  // Handle skip confirmation
  const handleSkipConfirmed = async () => {
    try {
      await updateProfile({
        preferred_workout_days: daysArrayForSave,
        first_week_substitute_days: [], // No substitutes
      });
      setShowSkipConfirmation(false);
      navigation.navigate("DysphoriaTriggers");
    } catch (error) {
      console.error("Error saving workout days:", error);
    }
  };

  // Get the names of passed days for display
  const getPassedDaysText = () => {
    return passedDays.map(d => DAYS_OF_WEEK[d].full).join(" and ");
  };

  // Get future selected days text for skip confirmation
  const getFutureSelectedDaysText = () => {
    const futureDays = daysArrayForSave.filter(day => day >= new Date().getDay());
    return futureDays.map(d => DAYS_OF_WEEK[d].full).join(" & ");
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // Validation: must have exactly the right number of days selected
  const canContinue = selectedDays.size === workoutFrequency;

  // Get selected days as readable string
  const getSelectedDaysText = () => {
    const sortedDays = Array.from(selectedDays).sort((a, b) => a - b);
    return sortedDays.map(d => DAYS_OF_WEEK[d].full).join(", ");
  };

  return (
    <OnboardingLayout
      currentStep={8}
      totalSteps={10}
      title="Choose Your Workout Days"
      subtitle={`Select ${workoutFrequency} day${workoutFrequency !== 1 ? 's' : ''} for your weekly workouts. The other days will be rest days.`}
      onBack={handleBack}
      onContinue={handleContinue}
      canContinue={canContinue}
    >
      <View style={styles.container}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons
            name="calendar-outline"
            size={24}
            color={colors.accent.primary}
            style={styles.infoIcon}
          />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Build a Sustainable Routine
            </Text>
            <Text style={styles.infoText}>
              Choose days that fit your schedule. Rest days are just as important as workout days for recovery and progress.
            </Text>
          </View>
        </View>

        {/* Day Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
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
                    pressed && styles.buttonPressed
                  ]}
                >
                  <Text style={[
                    styles.dayLetter,
                    isSelected && styles.dayLetterSelected,
                  ]}>
                    {day.short}
                  </Text>
                  <Text style={[
                    styles.dayLabel,
                    isSelected && styles.dayLabelSelected,
                  ]}>
                    {day.full.slice(0, 3)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Selected Summary */}
        {selectedDays.size > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="fitness-outline" size={20} color={colors.accent.primary} />
              <Text style={styles.summaryTitle}>Your Workout Schedule</Text>
            </View>
            <Text style={styles.summaryText}>
              {getSelectedDaysText()}
            </Text>
            <Text style={styles.summarySubtext}>
              {7 - workoutFrequency} rest day{7 - workoutFrequency !== 1 ? 's' : ''} per week
            </Text>
          </View>
        )}

        {/* Validation Message */}
        {!canContinue && (
          <View style={styles.validationMessage}>
            <Ionicons name="information-circle-outline" size={18} color={colors.text.tertiary} />
            <Text style={styles.validationText}>
              {selectedDays.size < workoutFrequency
                ? `Select ${workoutFrequency - selectedDays.size} more day${workoutFrequency - selectedDays.size !== 1 ? 's' : ''}`
                : `Tap a day to swap it with another`
              }
            </Text>
          </View>
        )}
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
              <Ionicons name="calendar-outline" size={32} color={colors.accent.primary} />
              <Text style={styles.modalTitle}>
                Looks like {getPassedDaysText()} already passed!
              </Text>
              <Text style={styles.modalSubtitle}>
                Would you like to pick a different day for this week?
              </Text>
            </View>

            {/* Day Selector */}
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
                        pressed && styles.buttonPressed
                      ]}
                    >
                      <Text style={[
                        styles.modalDayText,
                        isSelected && styles.modalDayTextSelected,
                      ]}>
                        {isToday ? "Today" : day.full}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.accent.primary} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  pressed && styles.buttonPressed
                ]}
                onPress={handlePickSubstitute}
                disabled={selectedSubstitute === null}
              >
                <Text style={styles.modalButtonTextPrimary}>
                  {selectedSubstitute !== null
                    ? `Pick ${selectedSubstitute === new Date().getDay() ? "Today" : DAYS_OF_WEEK[selectedSubstitute].full}`
                    : "Pick a day"}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonSecondary,
                  pressed && styles.buttonPressed
                ]}
                onPress={handleSkipThisWeek}
              >
                <Text style={styles.modalButtonTextSecondary}>Skip this week</Text>
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
              <Ionicons name="checkmark-circle-outline" size={32} color={colors.accent.primary} />
              <Text style={styles.modalTitle}>No problem!</Text>
              <Text style={styles.modalSubtitle}>
                Your dashboard will show {daysArrayForSave.filter(d => d >= new Date().getDay()).length} workout{daysArrayForSave.filter(d => d >= new Date().getDay()).length !== 1 ? 's' : ''} this week
                {getFutureSelectedDaysText() && ` (${getFutureSelectedDaysText()})`}, but next week you'll have your full {getSelectedDaysText()} schedule.
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  pressed && styles.buttonPressed
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
    gap: spacing.xl,
  },
  section: {
    gap: spacing.base,
  },
  sectionTitle: {
    ...textStyles.h3,
    fontSize: 16,
    textAlign: 'center',
    color: colors.text.secondary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.accent.primaryMuted,
    borderWidth: 1,
    borderColor: colors.accent.primaryGlow,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...textStyles.label,
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent.primary,
    marginBottom: spacing.xs,
  },
  infoText: {
    ...textStyles.bodySmall,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  dayButton: {
    flex: 1,
    aspectRatio: 0.7,
    maxWidth: 52,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  dayLetterSelected: {
    color: colors.accent.primary,
  },
  dayLabel: {
    ...textStyles.caption,
    fontSize: 10,
    color: colors.text.disabled,
    textTransform: 'uppercase',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summaryTitle: {
    ...textStyles.label,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  summaryText: {
    ...textStyles.body,
    fontSize: 15,
    color: colors.accent.primary,
    fontWeight: '500',
  },
  summarySubtext: {
    ...textStyles.bodySmall,
    fontSize: 13,
    color: colors.text.tertiary,
  },
  validationMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  validationText: {
    ...textStyles.bodySmall,
    fontSize: 14,
    color: colors.text.tertiary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  modalHeader: {
    alignItems: 'center',
    gap: spacing.md,
  },
  modalTitle: {
    ...textStyles.h3,
    fontSize: 18,
    color: colors.text.primary,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...textStyles.body,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalDaysContainer: {
    gap: spacing.sm,
  },
  modalDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontWeight: '600',
  },
  modalButtons: {
    gap: spacing.sm,
  },
  modalButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: colors.accent.primary,
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  modalButtonTextPrimary: {
    ...textStyles.label,
    fontSize: 15,
    fontWeight: '600',
    color: colors.bg.primary,
  },
  modalButtonTextSecondary: {
    ...textStyles.label,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
