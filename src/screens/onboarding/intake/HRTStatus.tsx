import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import { palette, spacing, typography } from '../../../theme';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';
import PrimaryButton from '../../../components/ui/PrimaryButton';

type HRTAnswer = 'yes' | 'no';
type HRTType = 'estrogen_blockers' | 'testosterone';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const generateYears = (): number[] => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let i = 0; i <= 15; i++) {
    years.push(currentYear - i);
  }
  return years;
};

const calculateDuration = (startDate: Date | null): number => {
  if (!startDate) return 0;
  const now = new Date();
  const months = 
    (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth());
  return Math.max(0, months);
};

const formatDuration = (months: number): string => {
  if (months === 0) return '0 months';
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'}`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) {
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }
  return `${years} ${years === 1 ? 'year' : 'years'}, ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
};

interface HRTTypeOption {
  value: HRTType;
  title: string;
  description: string;
}

const HRT_TYPE_OPTIONS: HRTTypeOption[] = [
  {
    value: 'estrogen_blockers',
    title: 'Estrogen + Anti-androgens',
    description: '(e.g., Estradiol, Spironolactone, Cypro)',
  },
  {
    value: 'testosterone',
    title: 'Testosterone',
    description: '(e.g., Injectable, gel, patch)',
  },
];

export default function HRTStatus({ navigation }: OnboardingScreenProps<'HRTStatus'>) {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < 375;

  const [hrtAnswer, setHrtAnswer] = useState<HRTAnswer | null>(
    profile?.on_hrt === true ? 'yes' : profile?.on_hrt === false ? 'no' : null
  );

  const [hrtType, setHrtType] = useState<HRTType | null>(
    (profile?.hrt_type as HRTType) || null
  );

  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize from profile
  useEffect(() => {
    if (profile?.hrt_start_date) {
      const date = new Date(profile.hrt_start_date);
      setSelectedMonth(date.getMonth());
      setSelectedYear(date.getFullYear());
    }
  }, [profile]);

  const getStartDate = (): Date | null => {
    if (selectedMonth === null || selectedYear === null) return null;
    return new Date(selectedYear, selectedMonth, 1);
  };

  const validateDate = (date: Date | null): boolean => {
    if (!date) return false;
    const now = new Date();
    const fifteenYearsAgo = new Date();
    fifteenYearsAgo.setFullYear(now.getFullYear() - 15);

    if (date > now) {
      setValidationError('Start date cannot be in the future');
      return false;
    }
    if (date < fifteenYearsAgo) {
      setValidationError('Start date cannot be more than 15 years ago');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleContinue = async () => {
    if (hrtAnswer === null) return;

    if (hrtAnswer === 'yes') {
      // Validate required fields
      if (!hrtType) {
        setValidationError('Please select an HRT type');
        return;
      }

      const startDate = getStartDate();
      if (!startDate) {
        setValidationError('Please select a start date');
        return;
      }

      if (!validateDate(startDate)) {
        return;
      }

      const monthsDuration = calculateDuration(startDate);

      try {
        await updateProfile({
          on_hrt: true,
          hrt_type: hrtType,
          hrt_start_date: startDate,
          hrt_months_duration: monthsDuration,
        });
        navigation.navigate('BindingInfo');
      } catch (error) {
        console.error('Error saving HRT status:', error);
      }
    } else {
      try {
        await updateProfile({
          on_hrt: false,
          hrt_type: undefined,
          hrt_start_date: undefined,
          hrt_months_duration: undefined,
        });
        navigation.navigate('BindingInfo');
      } catch (error) {
        console.error('Error saving HRT status:', error);
      }
    }
  };

  const canContinue = hrtAnswer !== null && 
    (hrtAnswer === 'no' || (hrtAnswer === 'yes' && hrtType !== null && selectedMonth !== null && selectedYear !== null && !validationError));

  const startDate = getStartDate();
  const durationMonths = calculateDuration(startDate);
  const durationText = formatDuration(durationMonths);

  const years = generateYears();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, spacing.m),
          paddingBottom: Math.max(insets.bottom + spacing.m, spacing.l),
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.headline, isSmall && styles.headlineSmall]}>
          Are you currently on Hormone Replacement Therapy?
        </Text>
        <Text style={[styles.subheadline, isSmall && styles.subheadlineSmall]}>
          This helps us adjust workout volume and recovery time to match your hormonal profile.
        </Text>
      </View>

      <ProgressIndicator
        currentStep={2}
        totalSteps={8}
        stepLabels={['Gender Identity', 'HRT Status', 'Binding Info', 'Surgery History', 'Goals', 'Experience', 'Dysphoria', 'Review']}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Initial Question */}
        <View style={styles.section}>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              onPress={() => {
                setHrtAnswer('yes');
                setValidationError(null);
              }}
              activeOpacity={0.7}
              style={[
                styles.largeButton,
                hrtAnswer === 'yes' && styles.largeButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.largeButtonText,
                  hrtAnswer === 'yes' && styles.largeButtonTextSelected,
                ]}
              >
                Yes, I'm on HRT
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setHrtAnswer('no');
                setHrtType(null);
                setSelectedMonth(null);
                setSelectedYear(null);
                setValidationError(null);
              }}
              activeOpacity={0.7}
              style={[
                styles.largeButton,
                hrtAnswer === 'no' && styles.largeButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.largeButtonText,
                  hrtAnswer === 'no' && styles.largeButtonTextSelected,
                ]}
              >
                No, I'm not on HRT
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Conditional Sections - Only show if Yes */}
        {hrtAnswer === 'yes' && (
          <>
            {/* Section A: HRT Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What type of HRT are you taking?</Text>
              <View style={styles.hrtTypeContainer}>
                {HRT_TYPE_OPTIONS.map((option) => {
                  const isSelected = hrtType === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => {
                        setHrtType(option.value);
                        setValidationError(null);
                      }}
                      activeOpacity={0.7}
                      style={[
                        styles.hrtTypeCard,
                        isSelected && styles.hrtTypeCardSelected,
                      ]}
                    >
                      {isSelected && (
                        <View style={styles.checkmarkContainer}>
                          <Text style={styles.checkmark}>✓</Text>
                        </View>
                      )}
                      <View style={styles.hrtTypeTextContainer}>
                        <Text style={[styles.hrtTypeTitle, isSelected && styles.hrtTypeTitleSelected]}>
                          {option.title}
                        </Text>
                        <Text style={[styles.hrtTypeDescription, isSelected && styles.hrtTypeDescriptionSelected]}>
                          {option.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section B: HRT Start Date */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>When did you start HRT?</Text>
              <View style={styles.dateSelectorContainer}>
                <View style={styles.dateSelectorRow}>
                  <TouchableOpacity
                    onPress={() => setShowMonthPicker(true)}
                    style={styles.dateDropdown}
                  >
                    <Text style={[styles.dateDropdownText, selectedMonth === null && styles.dateDropdownPlaceholder]}>
                      {selectedMonth !== null ? MONTHS[selectedMonth] : 'Month'}
                    </Text>
                    <Text style={styles.dateDropdownArrow}>▼</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowYearPicker(true)}
                    style={styles.dateDropdown}
                  >
                    <Text style={[styles.dateDropdownText, selectedYear === null && styles.dateDropdownPlaceholder]}>
                      {selectedYear !== null ? selectedYear.toString() : 'Year'}
                    </Text>
                    <Text style={styles.dateDropdownArrow}>▼</Text>
                  </TouchableOpacity>
                </View>

                {startDate && durationMonths > 0 && (
                  <View style={styles.durationIndicator}>
                    <Text style={styles.durationIcon}>💡</Text>
                    <Text style={styles.durationText}>
                      You've been on HRT for approximately {durationText}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Validation Error Banner */}
            {validationError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠️ {validationError}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.ctaContainer}>
        <PrimaryButton
          onPress={handleContinue}
          label="Continue"
          disabled={!canContinue}
        />
        {!canContinue && hrtAnswer === 'yes' && (
          <Text style={styles.hintText}>
            Please select HRT type and start date to continue
          </Text>
        )}
      </View>

      {/* Month Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMonthPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Month</Text>
            <FlatList
              data={MONTHS}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedMonth === index && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedMonth(index);
                    setShowMonthPicker(false);
                    if (selectedYear !== null) {
                      const date = new Date(selectedYear, index, 1);
                      validateDate(date);
                    }
                  }}
                >
                  <Text style={[styles.modalItemText, selectedMonth === index && styles.modalItemTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Year Picker Modal */}
      <Modal
        visible={showYearPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowYearPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Year</Text>
            <FlatList
              data={years}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedYear === item && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedYear(item);
                    setShowYearPicker(false);
                    if (selectedMonth !== null) {
                      const date = new Date(item, selectedMonth, 1);
                      validateDate(date);
                    }
                  }}
                >
                  <Text style={[styles.modalItemText, selectedYear === item && styles.modalItemTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.deepBlack,
    paddingHorizontal: spacing.l,
  },
  header: {
    marginBottom: spacing.l,
    paddingTop: spacing.s,
  },
  headline: {
    ...typography.h1,
    textAlign: 'left',
    marginBottom: spacing.xs,
    letterSpacing: -0.8,
  },
  headlineSmall: {
    fontSize: 28,
  },
  subheadline: {
    ...typography.bodyLarge,
    textAlign: 'left',
    color: palette.midGray,
    lineHeight: 24,
  },
  subheadlineSmall: {
    fontSize: 15,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: palette.white,
    marginBottom: spacing.m,
  },
  buttonGroup: {
    gap: spacing.m,
  },
  largeButton: {
    backgroundColor: palette.darkCard,
    borderRadius: 16,
    padding: spacing.l,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    minHeight: 64,
    justifyContent: 'center',
  },
  largeButtonSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealGlow,
    borderWidth: 3,
  },
  largeButtonText: {
    ...typography.h3,
    color: palette.white,
  },
  largeButtonTextSelected: {
    color: palette.tealPrimary,
  },
  hrtTypeContainer: {
    gap: spacing.m,
  },
  hrtTypeCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 16,
    padding: spacing.l,
    borderWidth: 2,
    borderColor: palette.border,
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  hrtTypeCardSelected: {
    borderWidth: 3,
    borderColor: palette.tealPrimary,
    backgroundColor: palette.darkerCard,
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.tealPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkmark: {
    color: palette.deepBlack,
    fontSize: 16,
    fontWeight: '700',
  },
  hrtTypeTextContainer: {
    flex: 1,
  },
  hrtTypeTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
    color: palette.white,
  },
  hrtTypeTitleSelected: {
    color: palette.tealPrimary,
  },
  hrtTypeDescription: {
    ...typography.body,
    color: palette.midGray,
    lineHeight: 20,
  },
  hrtTypeDescriptionSelected: {
    color: palette.lightGray,
  },
  dateSelectorContainer: {
    gap: spacing.m,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  dateDropdown: {
    flex: 1,
    backgroundColor: palette.darkCard,
    borderWidth: 2,
    borderColor: palette.border,
    borderRadius: 12,
    padding: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  dateDropdownText: {
    ...typography.body,
    color: palette.white,
    flex: 1,
  },
  dateDropdownPlaceholder: {
    color: palette.midGray,
  },
  dateDropdownArrow: {
    ...typography.body,
    color: palette.midGray,
    fontSize: 12,
  },
  durationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.darkerCard,
    borderRadius: 12,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.s,
  },
  durationIcon: {
    fontSize: 20,
  },
  durationText: {
    ...typography.body,
    color: palette.tealPrimary,
    flex: 1,
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: palette.error,
    borderRadius: 12,
    padding: spacing.m,
    marginTop: spacing.m,
  },
  errorText: {
    ...typography.bodySmall,
    color: palette.error,
    lineHeight: 18,
  },
  ctaContainer: {
    marginTop: spacing.s,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  hintText: {
    ...typography.caption,
    textAlign: 'center',
    color: palette.midGray,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: palette.darkCard,
    borderRadius: 20,
    padding: spacing.m,
    width: '80%',
    maxHeight: '60%',
    borderWidth: 2,
    borderColor: palette.border,
  },
  modalTitle: {
    ...typography.h3,
    color: palette.white,
    marginBottom: spacing.m,
    textAlign: 'center',
  },
  modalItem: {
    padding: spacing.m,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  modalItemSelected: {
    backgroundColor: palette.tealGlow,
  },
  modalItemText: {
    ...typography.body,
    color: palette.lightGray,
  },
  modalItemTextSelected: {
    color: palette.tealPrimary,
    fontWeight: '600',
  },
});

