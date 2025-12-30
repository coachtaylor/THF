import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingStackParamList } from '../../../types/onboarding';
import OnboardingLayout from '../../../components/onboarding/OnboardingLayout';
import ToggleButtonGroup from '../../../components/onboarding/ToggleButtonGroup';
import MedicationSection from '../../../components/onboarding/MedicationSection';
import { colors, spacing, borderRadius } from '../../../theme/theme';
import { textStyles } from '../../../theme/components';
import { updateProfile } from '../../../services/storage/profile';

type HRTMethod = 'pills' | 'patches' | 'injections' | 'gel';
type HRTFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'twice_weekly';
type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
type GenderIdentity = 'mtf' | 'ftm' | 'nonbinary' | 'questioning';

type HRTStatusNavigationProp = StackNavigationProp<OnboardingStackParamList, 'HRTStatus'>;
type HRTStatusRouteProp = RouteProp<OnboardingStackParamList, 'HRTStatus'>;

interface HRTStatusProps {
  navigation: HRTStatusNavigationProp;
  route: HRTStatusRouteProp;
}

export default function HRTStatus({ navigation, route }: HRTStatusProps) {
  const genderIdentity = (route.params as { genderIdentity?: string })?.genderIdentity;

  const [onHRT, setOnHRT] = useState<string | null>(null);

  // Hormone type selection for non-binary/questioning users
  const [selectedHormoneType, setSelectedHormoneType] = useState<string | null>(null);

  // Estrogen (Trans Feminine)
  const [estrogenMethod, setEstrogenMethod] = useState<HRTMethod>('pills');
  const [estrogenFrequency, setEstrogenFrequency] = useState<HRTFrequency>('daily');
  const [estrogenDays, setEstrogenDays] = useState<Set<DayOfWeek>>(new Set());

  // Testosterone (Trans Masculine)
  const [testosteroneMethod, setTestosteroneMethod] = useState<HRTMethod>('injections');
  const [testosteroneFrequency, setTestosteroneFrequency] = useState<HRTFrequency>('weekly');
  const [testosteroneDays, setTestosteroneDays] = useState<Set<DayOfWeek>>(new Set());

  // Start date
  const [startMonth, setStartMonth] = useState(new Date().getMonth() + 1);
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const isMTF = genderIdentity === 'mtf';
  const isFTM = genderIdentity === 'ftm';
  const isNonBinaryOrQuestioning = genderIdentity === 'nonbinary' || genderIdentity === 'questioning';

  // Determine which hormone sections to show based on identity and selection
  const showEstrogen = isMTF || (isNonBinaryOrQuestioning && (selectedHormoneType === 'Estrogen' || selectedHormoneType === 'Both'));
  const showTestosterone = isFTM || (isNonBinaryOrQuestioning && (selectedHormoneType === 'Testosterone' || selectedHormoneType === 'Both'));

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const calculateDuration = () => {
    const now = new Date();
    const start = new Date(startYear, startMonth - 1);
    const diffTime = now.getTime() - start.getTime();
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
    return Math.max(0, diffMonths);
  };

  const toggleDay = (
    days: Set<DayOfWeek>,
    setDays: (days: Set<DayOfWeek>) => void,
    day: DayOfWeek
  ) => {
    const newDays = new Set(days);
    if (newDays.has(day)) {
      newDays.delete(day);
    } else {
      newDays.add(day);
    }
    setDays(newDays);
  };

  // Helper to check if estrogen details are complete
  const estrogenComplete = estrogenFrequency === 'daily' || estrogenDays.size > 0;
  // Helper to check if testosterone details are complete
  const testosteroneComplete = testosteroneFrequency === 'daily' || testosteroneDays.size > 0;

  const canContinue =
    onHRT === 'No' ||
    (onHRT === 'Yes' && (
      // MTF users need estrogen details
      (isMTF && estrogenComplete) ||
      // FTM users need testosterone details
      (isFTM && testosteroneComplete) ||
      // Non-binary/questioning users need to select hormone type first
      (isNonBinaryOrQuestioning && selectedHormoneType !== null && (
        // If they selected "Other", they can proceed
        selectedHormoneType === 'Other' ||
        // If estrogen selected, need estrogen details
        (selectedHormoneType === 'Estrogen' && estrogenComplete) ||
        // If testosterone selected, need testosterone details
        (selectedHormoneType === 'Testosterone' && testosteroneComplete) ||
        // If both selected, need both details
        (selectedHormoneType === 'Both' && estrogenComplete && testosteroneComplete)
      ))
    ));

  const handleContinue = async () => {
    try {
      // Calculate HRT start date
      const hrtStartDate = onHRT === 'Yes'
        ? new Date(startYear, startMonth - 1, 1)
        : undefined;

      // Determine HRT data based on gender identity
      let hrtData: {
        on_hrt: boolean;
        hrt_type?: 'estrogen' | 'testosterone' | 'both' | 'none';
        hrt_method?: 'pills' | 'patches' | 'injections' | 'gel';
        hrt_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
        hrt_days?: string[];
        hrt_start_date?: Date;
        hrt_months_duration?: number;
      } = {
        on_hrt: onHRT === 'Yes',
      };

      if (onHRT === 'Yes') {
        if (isMTF || (isNonBinaryOrQuestioning && selectedHormoneType === 'Estrogen')) {
          // Estrogen only (MTF or NB who selected estrogen)
          hrtData = {
            ...hrtData,
            hrt_type: 'estrogen',
            hrt_method: estrogenMethod,
            hrt_frequency: estrogenFrequency,
            hrt_days: Array.from(estrogenDays),
            hrt_start_date: hrtStartDate,
            hrt_months_duration: calculateDuration(),
          };
        } else if (isFTM || (isNonBinaryOrQuestioning && selectedHormoneType === 'Testosterone')) {
          // Testosterone only (FTM or NB who selected testosterone)
          hrtData = {
            ...hrtData,
            hrt_type: 'testosterone',
            hrt_method: testosteroneMethod,
            hrt_frequency: testosteroneFrequency,
            hrt_days: Array.from(testosteroneDays),
            hrt_start_date: hrtStartDate,
            hrt_months_duration: calculateDuration(),
          };
        } else if (isNonBinaryOrQuestioning && selectedHormoneType === 'Both') {
          // Both hormones - save primary method as estrogen (can be extended later)
          hrtData = {
            ...hrtData,
            hrt_type: 'both' as any, // Extended type for users on both
            hrt_method: estrogenMethod, // Primary method
            hrt_frequency: estrogenFrequency,
            hrt_days: [...Array.from(estrogenDays), ...Array.from(testosteroneDays)],
            hrt_start_date: hrtStartDate,
            hrt_months_duration: calculateDuration(),
          };
        } else if (isNonBinaryOrQuestioning && selectedHormoneType === 'Other') {
          // Other - just mark as on HRT without specific type
          hrtData = {
            ...hrtData,
            hrt_start_date: hrtStartDate,
            hrt_months_duration: calculateDuration(),
          };
        }
      } else {
        hrtData.hrt_type = 'none';
      }

      // Save to profile
      await updateProfile(hrtData);

      // Route ALL gender identities through BindingInfo
      // Some trans women DO bind (pre-transition, specific contexts, etc.)
      // The BindingInfo screen has a "I don't bind" option for users who don't
      navigation.navigate('BindingInfo', { genderIdentity });
    } catch (error) {
      console.error('Error saving HRT data:', error);
      // Still navigate even if save fails
      navigation.navigate('BindingInfo', { genderIdentity });
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={8}
      title="Hormone Therapy"
      subtitle="HRT affects training capacity and recovery. This helps us provide workout advice based on your medication schedule."
      onBack={handleBack}
      onContinue={handleContinue}
      canContinue={canContinue}
    >
      <View style={styles.container}>
        {/* Are you on HRT? */}
        <View style={styles.section}>
          <Text style={textStyles.h3}>Are you currently on HRT?</Text>
          <ToggleButtonGroup
            options={['Yes', 'No']}
            selected={onHRT}
            onSelect={setOnHRT}
          />
        </View>

        {/* If Yes, show medication sections */}
        {onHRT === 'Yes' && (
          <>
            {/* Non-Binary/Questioning: Ask which hormone type */}
            {isNonBinaryOrQuestioning && (
              <View style={styles.section}>
                <Text style={textStyles.h3}>Which hormone(s) are you taking?</Text>
                <ToggleButtonGroup
                  options={['Estrogen', 'Testosterone', 'Both', 'Other']}
                  selected={selectedHormoneType}
                  onSelect={setSelectedHormoneType}
                  columns={2}
                />
              </View>
            )}

            {/* Estrogen Section */}
            {showEstrogen && (
              <MedicationSection
                title="Estrogen"
                icon="water"
                method={estrogenMethod}
                frequency={estrogenFrequency}
                selectedDays={estrogenDays}
                onMethodChange={setEstrogenMethod}
                onFrequencyChange={setEstrogenFrequency}
                onToggleDay={(day) => toggleDay(estrogenDays, setEstrogenDays, day)}
                isEstrogen={true}
              />
            )}

            {/* Testosterone Section */}
            {showTestosterone && (
              <MedicationSection
                title="Testosterone"
                icon="barbell"
                method={testosteroneMethod}
                frequency={testosteroneFrequency}
                selectedDays={testosteroneDays}
                onMethodChange={setTestosteroneMethod}
                onFrequencyChange={setTestosteroneFrequency}
                onToggleDay={(day) => toggleDay(testosteroneDays, setTestosteroneDays, day)}
                isEstrogen={false}
              />
            )}

            {/* Start Date - show when user has specified their HRT details */}
            {(isMTF || isFTM || (isNonBinaryOrQuestioning && selectedHormoneType !== null)) && (
            <View style={styles.section}>
              <Text style={textStyles.h3}>When did you start HRT?</Text>

              <View style={styles.dateRow}>
                <View style={styles.dateColumn}>
                  <Text style={[textStyles.label, styles.dateLabel]}>Month</Text>
                  <Pressable
                    style={({ pressed }) => [styles.pickerButton, pressed && styles.buttonPressed]}
                    onPress={() => setShowMonthPicker(true)}
                  >
                    <Text style={styles.pickerButtonText}>{months[startMonth - 1]}</Text>
                    <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                  </Pressable>
                </View>

                <View style={styles.dateColumn}>
                  <Text style={[textStyles.label, styles.dateLabel]}>Year</Text>
                  <Pressable
                    style={({ pressed }) => [styles.pickerButton, pressed && styles.buttonPressed]}
                    onPress={() => setShowYearPicker(true)}
                  >
                    <Text style={styles.pickerButtonText}>{startYear}</Text>
                    <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                  </Pressable>
                </View>
              </View>

              {/* Month Picker Modal */}
              <Modal
                visible={showMonthPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowMonthPicker(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={textStyles.h3}>Select Month</Text>
                      <Pressable style={({ pressed }) => pressed && styles.buttonPressed} onPress={() => setShowMonthPicker(false)}>
                        <Text style={[textStyles.body, { color: colors.accent.primary }]}>Done</Text>
                      </Pressable>
                    </View>
                    <ScrollView style={styles.pickerScrollView}>
                      {months.map((month, index) => {
                        const monthValue = index + 1;
                        const isSelected = startMonth === monthValue;
                        return (
                          <Pressable
                            key={index}
                            style={({ pressed }) => [
                              styles.pickerOption,
                              isSelected && styles.pickerOptionSelected,
                              pressed && styles.buttonPressed,
                            ]}
                            onPress={() => {
                              setStartMonth(monthValue);
                              setShowMonthPicker(false);
                            }}
                          >
                            <Text
                              style={[
                                textStyles.body,
                                styles.pickerOptionText,
                                isSelected && styles.pickerOptionTextSelected,
                              ]}
                            >
                              {month}
                            </Text>
                            {isSelected && (
                              <Ionicons name="checkmark" size={20} color={colors.accent.primary} />
                            )}
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
              </Modal>

              {/* Year Picker Modal */}
              <Modal
                visible={showYearPicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowYearPicker(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={textStyles.h3}>Select Year</Text>
                      <Pressable style={({ pressed }) => pressed && styles.buttonPressed} onPress={() => setShowYearPicker(false)}>
                        <Text style={[textStyles.body, { color: colors.accent.primary }]}>Done</Text>
                      </Pressable>
                    </View>
                    <ScrollView style={styles.pickerScrollView}>
                      {years.map((year) => {
                        const isSelected = startYear === year;
                        return (
                          <Pressable
                            key={year}
                            style={({ pressed }) => [
                              styles.pickerOption,
                              isSelected && styles.pickerOptionSelected,
                              pressed && styles.buttonPressed,
                            ]}
                            onPress={() => {
                              setStartYear(year);
                              setShowYearPicker(false);
                            }}
                          >
                            <Text
                              style={[
                                textStyles.body,
                                styles.pickerOptionText,
                                isSelected && styles.pickerOptionTextSelected,
                              ]}
                            >
                              {year}
                            </Text>
                            {isSelected && (
                              <Ionicons name="checkmark" size={20} color={colors.accent.primary} />
                            )}
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
              </Modal>

              {/* Duration Display */}
              <View style={styles.durationCard}>
                <Ionicons name="calendar" size={20} color={colors.accent.primary} />
                <Text style={[textStyles.bodySmall, styles.durationText]}>
                  Duration: <Text style={styles.durationBold}>{calculateDuration()} months</Text> on HRT
                </Text>
              </View>
            </View>
            )}
          </>
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
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateColumn: {
    flex: 1,
    gap: spacing.sm,
  },
  dateLabel: {
    marginBottom: 0,
  },
  pickerButton: {
    height: 56,
    borderRadius: borderRadius.base,
    backgroundColor: colors.glass.bg,
    borderWidth: 2,
    borderColor: colors.glass.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
  },
  pickerButtonText: {
    ...textStyles.body,
    color: colors.text.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bg.raised,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    paddingTop: spacing.xl,
    paddingBottom: spacing['4xl'],
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  pickerScrollView: {
    maxHeight: 300,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  pickerOptionSelected: {
    backgroundColor: colors.glass.bgHero,
  },
  pickerOptionText: {
    color: colors.text.secondary,
  },
  pickerOptionTextSelected: {
    color: colors.accent.primary,
    fontWeight: '600',
  },
  durationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: borderRadius.base,
    backgroundColor: colors.glass.bgHero,
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
  },
  durationText: {
    color: colors.accent.primary,
  },
  durationBold: {
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
  },
});