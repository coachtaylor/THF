import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
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
      await updateProfile({
        preferred_workout_days: daysArray,
      });
      navigation.navigate("DysphoriaTriggers");
    } catch (error) {
      console.error("Error saving workout days:", error);
    }
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
            color={colors.cyan[500]}
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
                <TouchableOpacity
                  key={day.id}
                  onPress={() => toggleDay(day.id)}
                  activeOpacity={0.7}
                  style={[
                    styles.dayButton,
                    isSelected && styles.dayButtonSelected,
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
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark" size={14} color={colors.text.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Summary */}
        {selectedDays.size > 0 && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="fitness-outline" size={20} color={colors.cyan[500]} />
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
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
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
    color: colors.cyan[500],
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
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: colors.cyan[500],
  },
  dayLetter: {
    ...textStyles.statMedium,
    fontSize: 20,
    color: colors.text.tertiary,
  },
  dayLetterSelected: {
    color: colors.cyan[500],
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
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.cyan[500],
    alignItems: 'center',
    justifyContent: 'center',
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
    color: colors.cyan[500],
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
});
