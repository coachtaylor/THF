import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  Modal,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { OnboardingStackParamList } from "../../../types/onboarding";
import { Surgery as SurgeryType } from "../../../types";
import OnboardingLayout from "../../../components/onboarding/OnboardingLayout";
import { useNavigation as useRootNavigation } from "@react-navigation/native";
import { colors, spacing, borderRadius } from "../../../theme/theme";
import {
  glassStyles,
  textStyles,
  cardStyles,
  inputStyles,
} from "../../../theme/components";
import { useProfile } from "../../../hooks/useProfile";
import { updateProfile } from "../../../services/storage/profile";

type SurgeryTypeOption =
  | "top_surgery"
  | "bottom_surgery"
  | "vaginoplasty"
  | "phalloplasty"
  | "metoidioplasty"
  | "ffs"
  | "orchiectomy"
  | "hysterectomy"
  | "breast_augmentation"
  | "other";

type SurgeryNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  "Surgery"
>;
type SurgeryRouteProp = RouteProp<OnboardingStackParamList, "Surgery">;

interface SurgeryProps {
  navigation: SurgeryNavigationProp;
  route: SurgeryRouteProp;
}

// All surgery options
const ALL_SURGERY_OPTIONS: Array<{ id: SurgeryTypeOption; label: string }> = [
  { id: "top_surgery", label: "Top Surgery / Chest Masculinization" },
  { id: "vaginoplasty", label: "Vaginoplasty" },
  { id: "phalloplasty", label: "Phalloplasty" },
  { id: "metoidioplasty", label: "Metoidioplasty" },
  { id: "orchiectomy", label: "Orchiectomy" },
  { id: "hysterectomy", label: "Hysterectomy" },
  { id: "breast_augmentation", label: "Breast Augmentation" },
  { id: "ffs", label: "Facial Feminization Surgery (FFS)" },
  { id: "bottom_surgery", label: "Other Bottom Surgery" },
  { id: "other", label: "Other Gender-Affirming Surgery" },
];

// Surgeries typically for trans women (MTF)
const MTF_SURGERY_IDS: SurgeryTypeOption[] = [
  "breast_augmentation",
  "vaginoplasty",
  "orchiectomy",
  "ffs",
  "bottom_surgery",
  "other",
];

// Surgeries typically for trans men (FTM)
const FTM_SURGERY_IDS: SurgeryTypeOption[] = [
  "top_surgery",
  "phalloplasty",
  "metoidioplasty",
  "hysterectomy",
  "bottom_surgery",
  "other",
];

export default function Surgery({ navigation, route }: SurgeryProps) {
  const genderIdentity = route.params?.genderIdentity;

  // Filter surgery options based on gender identity
  const SURGERY_OPTIONS = useMemo(() => {
    if (genderIdentity === "mtf") {
      return ALL_SURGERY_OPTIONS.filter((opt) =>
        MTF_SURGERY_IDS.includes(opt.id),
      );
    } else if (genderIdentity === "ftm") {
      return ALL_SURGERY_OPTIONS.filter((opt) =>
        FTM_SURGERY_IDS.includes(opt.id),
      );
    }
    // Non-binary, questioning, or undefined: show all options
    return ALL_SURGERY_OPTIONS;
  }, [genderIdentity]);
  const { profile } = useProfile();
  const rootNavigation = useRootNavigation<any>();

  const openRecoveryGuide = (surgeryType: SurgeryTypeOption) => {
    // Navigate to the PostOpMovementGuide screen with the surgery type
    rootNavigation.navigate("PostOpMovementGuide", { surgeryType });
  };
  const [hasSurgeries, setHasSurgeries] = useState<boolean | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Set<SurgeryTypeOption>>(
    new Set(),
  );
  const [surgeryDates, setSurgeryDates] = useState<
    Record<SurgeryTypeOption, Date | null>
  >({
    top_surgery: null,
    bottom_surgery: null,
    vaginoplasty: null,
    phalloplasty: null,
    metoidioplasty: null,
    ffs: null,
    orchiectomy: null,
    hysterectomy: null,
    breast_augmentation: null,
    other: null,
  });
  const [surgeryNotes, setSurgeryNotes] = useState<
    Record<SurgeryTypeOption, string>
  >({
    top_surgery: "",
    bottom_surgery: "",
    vaginoplasty: "",
    phalloplasty: "",
    metoidioplasty: "",
    ffs: "",
    orchiectomy: "",
    hysterectomy: "",
    breast_augmentation: "",
    other: "",
  });
  const [showDatePicker, setShowDatePicker] =
    useState<SurgeryTypeOption | null>(null);
  const [datePickerDate, setDatePickerDate] = useState(new Date());
  const [surgeonClearance, setSurgeonClearance] = useState<boolean>(false);

  // Load initial data from profile
  useEffect(() => {
    if (profile?.surgeries && profile.surgeries.length > 0) {
      setHasSurgeries(true);
      const types = new Set<SurgeryTypeOption>();
      const dates: Record<SurgeryTypeOption, Date | null> = {
        top_surgery: null,
        bottom_surgery: null,
        vaginoplasty: null,
        phalloplasty: null,
        metoidioplasty: null,
        ffs: null,
        orchiectomy: null,
        hysterectomy: null,
        breast_augmentation: null,
        other: null,
      };
      const notes: Record<SurgeryTypeOption, string> = {
        top_surgery: "",
        bottom_surgery: "",
        vaginoplasty: "",
        phalloplasty: "",
        metoidioplasty: "",
        ffs: "",
        orchiectomy: "",
        hysterectomy: "",
        breast_augmentation: "",
        other: "",
      };

      profile.surgeries.forEach((surgery) => {
        types.add(surgery.type as SurgeryTypeOption);
        if (surgery.date) {
          dates[surgery.type as SurgeryTypeOption] =
            surgery.date instanceof Date
              ? surgery.date
              : new Date(surgery.date);
        }
        if (surgery.notes) {
          notes[surgery.type as SurgeryTypeOption] = surgery.notes;
        }
      });

      setSelectedTypes(types);
      setSurgeryDates(dates);
      setSurgeryNotes(notes);
    } else if (profile?.surgeries && profile.surgeries.length === 0) {
      setHasSurgeries(false);
    }
  }, [profile]);

  const calculateWeeksPostOp = (date: Date | null): number => {
    if (!date) return 0;
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    return Math.max(0, diffWeeks);
  };

  const getRecoveryPhase = (
    weeks: number,
  ): { label: string; color: string } => {
    if (weeks < 6)
      return { label: "Early Recovery", color: colors.semantic.error };
    if (weeks < 12)
      return { label: "Active Recovery", color: colors.semantic.warning };
    return { label: "Late Recovery", color: colors.semantic.success };
  };

  const toggleSurgeryType = (type: SurgeryTypeOption) => {
    const newSelected = new Set(selectedTypes);
    if (newSelected.has(type)) {
      newSelected.delete(type);
      const newDates = { ...surgeryDates };
      newDates[type] = null;
      setSurgeryDates(newDates);
      const newNotes = { ...surgeryNotes };
      newNotes[type] = "";
      setSurgeryNotes(newNotes);
    } else {
      newSelected.add(type);
    }
    setSelectedTypes(newSelected);
  };

  const handleDateChange = (
    event: any,
    selectedDate?: Date,
    type?: SurgeryTypeOption,
  ) => {
    if (Platform.OS === "android") {
      setShowDatePicker(null);
    }
    if (selectedDate && type) {
      // VALIDATION: Check for future dates
      const now = new Date();
      if (selectedDate > now) {
        Alert.alert(
          "Invalid Date",
          "Surgery date cannot be in the future. Please verify the date.",
          [{ text: "OK" }],
        );
        return;
      }

      // VALIDATION: Check for unrealistic old dates (50+ years ago)
      const fiftyYearsAgo = new Date();
      fiftyYearsAgo.setFullYear(now.getFullYear() - 50);
      if (selectedDate < fiftyYearsAgo) {
        Alert.alert(
          "Invalid Date",
          "Surgery date seems incorrect. Please verify the date is within the last 50 years.",
          [{ text: "OK" }],
        );
        return;
      }

      setSurgeryDates({ ...surgeryDates, [type]: selectedDate });
      if (Platform.OS === "android") {
        setShowDatePicker(null);
      }
    }
  };

  const openDatePicker = (type: SurgeryTypeOption) => {
    const currentDate = surgeryDates[type] || new Date();
    setDatePickerDate(currentDate);
    setShowDatePicker(type);
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const handleContinue = async () => {
    try {
      const surgeries: SurgeryType[] = [];

      if (hasSurgeries === true) {
        Array.from(selectedTypes).forEach((type) => {
          const date = surgeryDates[type];
          if (date) {
            const weeks = calculateWeeksPostOp(date);
            surgeries.push({
              type,
              date,
              weeks_post_op: weeks,
              fully_healed: weeks >= 12,
              notes: surgeryNotes[type] || undefined,
            });
          }
        });
      }

      await updateProfile({
        surgeries,
        surgeon_cleared: surgeonClearance, // CRITICAL FIX: Save surgeon clearance data
      });
      navigation.navigate("Goals");
    } catch (error) {
      console.error("Error saving surgery info:", error);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const canContinue =
    hasSurgeries === false ||
    (hasSurgeries === true &&
      selectedTypes.size > 0 &&
      Array.from(selectedTypes).every((type) => surgeryDates[type] !== null));

  const hasActiveSurgeries =
    hasSurgeries &&
    Array.from(selectedTypes).some((type) => {
      const weeks = calculateWeeksPostOp(surgeryDates[type]);
      return weeks < 12;
    });

  return (
    <OnboardingLayout
      currentStep={4}
      totalSteps={8}
      title="Surgery History"
      subtitle="Post-surgical recovery requires modified programming. We'll adjust your workouts for safe healing."
      onBack={handleBack}
      onContinue={handleContinue}
      canContinue={canContinue}
    >
      <View style={styles.container}>
        {/* Yes/No Question */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Have you had gender-affirming surgery?
          </Text>
          <View style={styles.buttonRow}>
            <Pressable
              onPress={() => setHasSurgeries(true)}
              style={({ pressed }) => [
                styles.toggleButton,
                hasSurgeries === true && styles.toggleButtonSelected,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  hasSurgeries === true && styles.toggleButtonTextSelected,
                ]}
              >
                Yes
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setHasSurgeries(false);
                setSelectedTypes(new Set());
              }}
              style={({ pressed }) => [
                styles.toggleButton,
                hasSurgeries === false && styles.toggleButtonSelected,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  hasSurgeries === false && styles.toggleButtonTextSelected,
                ]}
              >
                No
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Surgery Details (shown if Yes) */}
        {hasSurgeries === true && (
          <>
            {/* Surgery Type Checkboxes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Which surgeries have you had?
              </Text>
              <View style={styles.checkboxContainer}>
                {SURGERY_OPTIONS.map((option) => {
                  const isSelected = selectedTypes.has(option.id);
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => toggleSurgeryType(option.id)}
                      style={({ pressed }) => [
                        styles.checkboxRow,
                        isSelected && styles.checkboxRowSelected,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxChecked,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={18}
                            color={colors.text.primary}
                          />
                        )}
                      </View>
                      <Text style={styles.checkboxLabel}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Date and Details for Each Selected Surgery */}
            {Array.from(selectedTypes).map((type) => {
              const weeks = calculateWeeksPostOp(surgeryDates[type]);
              const phase = getRecoveryPhase(weeks);
              const option = SURGERY_OPTIONS.find((o) => o.id === type);
              const date = surgeryDates[type];

              return (
                <View key={type} style={styles.surgeryCard}>
                  <Text style={styles.surgeryCardTitle}>{option?.label}</Text>

                  {/* Date Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Surgery Date</Text>
                    <Pressable
                      onPress={() => openDatePicker(type)}
                      style={({ pressed }) => [
                        styles.dateButton,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dateButtonText,
                          !date && styles.dateButtonTextPlaceholder,
                        ]}
                      >
                        {date ? formatDate(date) : "Select date"}
                      </Text>
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color={colors.text.secondary}
                      />
                    </Pressable>
                  </View>

                  {/* Recovery Phase (shown if date is set) */}
                  {date && (
                    <View
                      style={[
                        styles.recoveryPhase,
                        {
                          backgroundColor: `${phase.color}15`,
                          borderColor: `${phase.color}30`,
                        },
                      ]}
                    >
                      <View style={styles.recoveryPhaseLeft}>
                        <Text
                          style={[
                            styles.recoveryPhaseLabel,
                            { color: phase.color },
                          ]}
                        >
                          {phase.label}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.recoveryPhaseWeeks,
                          { color: phase.color },
                        ]}
                      >
                        {weeks} weeks post-op
                      </Text>
                    </View>
                  )}

                  {/* Optional Notes */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      Notes <Text style={styles.optionalText}>(Optional)</Text>
                    </Text>
                    <TextInput
                      value={surgeryNotes[type]}
                      onChangeText={(text) =>
                        setSurgeryNotes({ ...surgeryNotes, [type]: text })
                      }
                      placeholder="Any restrictions or considerations..."
                      placeholderTextColor={colors.text.tertiary}
                      multiline
                      numberOfLines={2}
                      style={styles.notesInput}
                    />
                  </View>

                  {/* View Recovery Guide Link */}
                  {date && (
                    <Pressable
                      onPress={() => openRecoveryGuide(type)}
                      style={({ pressed }) => [
                        styles.recoveryGuideLink,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Ionicons
                        name="book-outline"
                        size={18}
                        color={colors.accent.primaryLight}
                      />
                      <Text style={styles.recoveryGuideLinkText}>
                        View Recovery Guide
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={colors.accent.primaryLight}
                      />
                    </Pressable>
                  )}
                </View>
              );
            })}

            {/* Warning if Active Recovery */}
            {hasActiveSurgeries && (
              <View style={cardStyles.warning}>
                <Ionicons
                  name="warning"
                  size={24}
                  color={colors.semantic.warning}
                  style={styles.warningIcon}
                />
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>
                    Modified Programming Required
                  </Text>
                  <Text style={styles.warningText}>
                    Your workouts will be carefully modified to accommodate your
                    recovery timeline. We'll avoid exercises that could stress
                    surgical sites.
                  </Text>
                </View>
              </View>
            )}

            {/* Surgeon Clearance Section */}
            {selectedTypes.size > 0 && (
              <View style={styles.clearanceSection}>
                <Pressable
                  onPress={() => setSurgeonClearance(!surgeonClearance)}
                  style={({ pressed }) => [
                    styles.clearanceRow,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      surgeonClearance && styles.checkboxChecked,
                    ]}
                  >
                    {surgeonClearance && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.text.primary}
                      />
                    )}
                  </View>
                  <Text style={styles.clearanceLabel}>
                    My surgeon has cleared me for exercise
                  </Text>
                </Pressable>

                {/* Soft Warning if not cleared */}
                {!surgeonClearance && (
                  <View style={styles.clearanceWarning}>
                    <Ionicons
                      name="information-circle"
                      size={20}
                      color={colors.accent.primaryLight}
                    />
                    <Text style={styles.clearanceWarningText}>
                      If you haven't received clearance yet, we recommend
                      consulting your surgeon before starting any exercise
                      program. You can still continue, but please prioritize
                      your doctor's guidance.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <>
          {Platform.OS === "ios" && (
            <Modal
              visible={true}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowDatePicker(null)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Surgery Date</Text>
                    <Pressable
                      onPress={() => setShowDatePicker(null)}
                      style={({ pressed }) => pressed && styles.buttonPressed}
                    >
                      <Ionicons
                        name="close"
                        size={24}
                        color={colors.text.primary}
                      />
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={datePickerDate}
                    mode="date"
                    display="spinner"
                    maximumDate={new Date()}
                    textColor={colors.text.primary}
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setDatePickerDate(selectedDate);
                      }
                    }}
                    style={styles.datePicker}
                  />
                  <View style={styles.modalActions}>
                    <Pressable
                      onPress={() => setShowDatePicker(null)}
                      style={({ pressed }) => [
                        styles.modalCancelButton,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        handleDateChange(null, datePickerDate, showDatePicker);
                        setShowDatePicker(null);
                      }}
                      style={({ pressed }) => [
                        styles.modalConfirmButton,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Text style={styles.modalConfirmText}>Confirm</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>
          )}
          {Platform.OS === "android" && (
            <DateTimePicker
              value={datePickerDate}
              mode="date"
              display="default"
              maximumDate={new Date()}
              textColor={colors.text.primary}
              onChange={(event, selectedDate) =>
                handleDateChange(event, selectedDate, showDatePicker)
              }
            />
          )}
        </>
      )}
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
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  toggleButton: {
    flex: 1,
    height: 56,
    borderRadius: borderRadius.base,
    backgroundColor: colors.glass.bg,
    borderWidth: 2,
    borderColor: colors.glass.border,
    alignItems: "center",
    justifyContent: "center",
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
  checkboxContainer: {
    gap: spacing.md,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.base,
    borderRadius: borderRadius.base,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    gap: spacing.base,
  },
  checkboxRowSelected: {
    backgroundColor: colors.glass.bgHero,
    borderColor: colors.accent.primary,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.glass.border,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  checkboxLabel: {
    ...textStyles.body,
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
  },
  surgeryCard: {
    ...glassStyles.card,
    padding: spacing.lg,
    gap: spacing.base,
  },
  surgeryCardTitle: {
    ...textStyles.h3,
    fontSize: 16,
    marginBottom: spacing.base,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  inputLabel: {
    ...textStyles.label,
    fontSize: 14,
    color: colors.text.primary,
  },
  optionalText: {
    color: colors.text.tertiary,
  },
  dateButton: {
    height: 56,
    borderRadius: borderRadius.base,
    backgroundColor: colors.glass.bg,
    borderWidth: 2,
    borderColor: colors.glass.border,
    paddingHorizontal: spacing.base,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateButtonText: {
    ...textStyles.body,
    fontSize: 16,
    color: colors.text.primary,
  },
  dateButtonTextPlaceholder: {
    color: colors.text.primary,
  },
  recoveryPhase: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  recoveryPhaseLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  recoveryPhaseLabel: {
    ...textStyles.label,
    fontSize: 14,
    fontWeight: "600",
  },
  recoveryPhaseWeeks: {
    ...textStyles.body,
    fontSize: 14,
    fontWeight: "500",
  },
  notesInput: {
    ...inputStyles.textInput,
    height: 80,
    paddingTop: spacing.base,
    textAlignVertical: "top",
  },
  warningIcon: {
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    ...textStyles.label,
    fontSize: 15,
    fontWeight: "600",
    color: colors.semantic.warning,
    marginBottom: spacing.xs,
  },
  warningText: {
    ...textStyles.bodySmall,
    color: colors.semantic.warning,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.bg.raised,
    borderTopLeftRadius: borderRadius["2xl"],
    borderTopRightRadius: borderRadius["2xl"],
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  modalTitle: {
    ...textStyles.h3,
    fontSize: 20,
  },
  datePicker: {
    height: 200,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.base,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
  },
  modalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.base,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    ...textStyles.label,
    color: colors.text.primary,
  },
  modalConfirmButton: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.base,
    backgroundColor: colors.accent.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmText: {
    ...textStyles.label,
    color: colors.text.primary,
  },
  clearanceSection: {
    gap: spacing.base,
    marginTop: spacing.base,
  },
  clearanceRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.base,
    borderRadius: borderRadius.base,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    gap: spacing.base,
  },
  clearanceLabel: {
    ...textStyles.body,
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
  },
  clearanceWarning: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: borderRadius.base,
    backgroundColor: colors.accent.primaryMuted,
    borderWidth: 1,
    borderColor: colors.accent.primaryGlow,
  },
  clearanceWarningText: {
    ...textStyles.bodySmall,
    flex: 1,
    color: colors.accent.primaryLight,
    lineHeight: 20,
  },
  recoveryGuideLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  recoveryGuideLinkText: {
    ...textStyles.label,
    flex: 1,
    fontSize: 14,
    color: colors.accent.primaryLight,
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
