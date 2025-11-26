import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, { Path } from 'react-native-svg';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';

type HRTAnswer = 'yes' | 'no' | null;
type HRTType = 'estrogen_blockers' | 'testosterone' | null;

const HRT_TYPE_OPTIONS = [
  {
    value: 'estrogen_blockers' as const,
    title: 'Estrogen + Anti-androgens',
    description: 'Estradiol, Spironolactone, Cypro, etc.',
  },
  {
    value: 'testosterone' as const,
    title: 'Testosterone',
    description: 'Injectable, gel, patch, pellet',
  },
];

// Helper: Format date as "January 2023"
const formatDate = (date: Date): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

// Helper: Calculate duration in months
const calculateDuration = (startDate: Date): number => {
  const today = new Date();
  const months = (today.getFullYear() - startDate.getFullYear()) * 12 + 
                 (today.getMonth() - startDate.getMonth());
  return Math.max(0, months);
};

// Helper: Format duration as "X months" or "X years, Y months"
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

// Helper: Get date 15 years ago
const getFifteenYearsAgo = (): Date => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 15);
  return date;
};

// Calendar Icon Component
const CalendarIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
      stroke="#9CA3AF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 2V6"
      stroke="#9CA3AF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 2V6"
      stroke="#9CA3AF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3 10H21"
      stroke="#9CA3AF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Info Icon Component
const InfoIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 16V12"
      stroke="#00D9C0"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 8H12.01"
      stroke="#00D9C0"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
      stroke="#00D9C0"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Close Icon Component
const CloseIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18"
      stroke="#9CA3AF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6 6L18 18"
      stroke="#9CA3AF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function HRTStatus({ navigation }: OnboardingScreenProps<'HRTStatus'>) {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();

  const [hrtAnswer, setHrtAnswer] = useState<HRTAnswer>(
    profile?.on_hrt === true ? 'yes' : profile?.on_hrt === false ? 'no' : null
  );
  const [hrtType, setHrtType] = useState<HRTType>(
    (profile?.hrt_type as HRTType) || null
  );
  const [startDate, setStartDate] = useState<Date | null>(
    profile?.hrt_start_date ? new Date(profile.hrt_start_date) : null
  );
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Initialize tempDate when opening picker
  useEffect(() => {
    if (showDatePicker) {
      setTempDate(startDate || new Date());
    }
  }, [showDatePicker, startDate]);

  const handleDateConfirm = () => {
    const today = new Date();
    const fifteenYearsAgo = getFifteenYearsAgo();

    if (tempDate > today) {
      // Date in future - don't set
      setShowDatePicker(false);
      return;
    }

    if (tempDate < fifteenYearsAgo) {
      // Date too old - don't set
      setShowDatePicker(false);
      return;
    }

    setStartDate(tempDate);
    setShowDatePicker(false);
  };

  const handleContinue = async () => {
    if (hrtAnswer === null) return;

    try {
      if (hrtAnswer === 'yes') {
        if (!hrtType || !startDate) return;

        const monthsDuration = calculateDuration(startDate);

        await updateProfile({
          on_hrt: true,
          hrt_type: hrtType,
          hrt_start_date: startDate,
          hrt_months_duration: monthsDuration,
        });
      } else {
        await updateProfile({
          on_hrt: false,
          hrt_type: undefined,
          hrt_start_date: undefined,
          hrt_months_duration: undefined,
        });
      }

      navigation.navigate('BindingInfo');
    } catch (error) {
      console.error('Error saving HRT status:', error);
    }
  };

  const canContinue = hrtAnswer !== null && 
    (hrtAnswer === 'no' || (hrtType !== null && startDate !== null));

  const durationMonths = startDate ? calculateDuration(startDate) : 0;
  const fifteenYearsAgo = getFifteenYearsAgo();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.progressWrapper}>
            <ProgressIndicator currentStep={2} totalSteps={8} />
          </View>
          <Text style={styles.headline}>
            Are you currently on Hormone Replacement Therapy?
          </Text>
          <Text style={styles.subheadline}>
            This helps us adjust workout volume and recovery
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Segmented Control */}
          <View style={styles.segmentedContainer}>
            <View style={styles.segmentControl}>
              <TouchableOpacity
                style={[
                  styles.segment,
                  hrtAnswer === 'yes' && styles.segmentActive,
                ]}
                onPress={() => {
                  setHrtAnswer('yes');
                  if (hrtAnswer === 'no') {
                    setHrtType(null);
                    setStartDate(null);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.segmentText,
                    hrtAnswer === 'yes' && styles.segmentTextActive,
                  ]}
                >
                  Yes, I'm on HRT
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segment,
                  hrtAnswer === 'no' && styles.segmentActive,
                ]}
                onPress={() => {
                  setHrtAnswer('no');
                  setHrtType(null);
                  setStartDate(null);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.segmentText,
                    hrtAnswer === 'no' && styles.segmentTextActive,
                  ]}
                >
                  No HRT
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Conditional: HRT Type Cards */}
          {hrtAnswer === 'yes' && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>What type of HRT?</Text>
              {HRT_TYPE_OPTIONS.map((option, index) => {
                const isSelected = hrtType === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.hrtTypeCard,
                      isSelected && styles.hrtTypeCardSelected,
                      index === HRT_TYPE_OPTIONS.length - 1 && styles.lastCard,
                    ]}
                    onPress={() => setHrtType(option.value)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                        {option.title}
                      </Text>
                      <Text style={[styles.cardDescription, isSelected && styles.cardDescriptionSelected]}>
                        {option.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Conditional: Date Selection */}
          {hrtAnswer === 'yes' && hrtType && (
            <View style={styles.dateSection}>
              <Text style={styles.sectionLabel}>When did you start?</Text>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  startDate && styles.dateButtonWithValue,
                ]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <View style={styles.dateButtonLeft}>
                  <Text style={styles.dateLabel}>Start Date</Text>
                  <Text style={[styles.dateValue, !startDate && styles.dateValuePlaceholder]}>
                    {startDate ? formatDate(startDate) : 'Select date'}
                  </Text>
                </View>
                <CalendarIcon />
              </TouchableOpacity>
            </View>
          )}

          {/* Conditional: Duration Badge */}
          {startDate && (
            <View style={styles.infoBadgeContainer}>
              <View style={styles.infoBadge}>
                <View style={styles.iconContainer}>
                  <InfoIcon />
                </View>
                <View style={styles.badgeTextContainer}>
                  <Text style={styles.badgeTitle}>HRT Duration</Text>
                  <Text style={styles.badgeDescription}>
                    Approximately {formatDuration(durationMonths)} on HRT
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              canContinue && styles.buttonShadow,
              !canContinue && styles.primaryButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!canContinue}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={canContinue ? ['#00D9C0', '#00B39D'] : ['#2A2F36', '#1A1F26']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={[styles.buttonText, !canContinue && styles.buttonTextDisabled]}>
                Continue
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.hintText}>
            This information helps personalize your training
          </Text>
        </View>
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          />
          <View
            style={[
              styles.modalContainer,
              { paddingBottom: insets.bottom + 24 },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Start Date</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                activeOpacity={0.7}
              >
                <CloseIcon />
              </TouchableOpacity>
            </View>

            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                minimumDate={fifteenYearsAgo}
                textColor="#FFFFFF"
                themeVariant="dark"
                onChange={(event, date) => {
                  if (Platform.OS === 'android') {
                    if (event.type === 'set' && date) {
                      setTempDate(date);
                      setShowDatePicker(false);
                    } else if (event.type === 'dismissed') {
                      setShowDatePicker(false);
                    }
                  } else {
                    // iOS - update date as user scrolls
                    if (date) {
                      setTempDate(date);
                    }
                  }
                }}
              />
            </View>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleDateConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
    paddingHorizontal: 0,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  progressWrapper: {
    marginBottom: 8,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 34,
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: 'left',
  },
  subheadline: {
    fontSize: 15,
    fontWeight: '400',
    color: '#9CA3AF',
    lineHeight: 22,
    textAlign: 'left',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  segmentedContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: '#1A1F26',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#2A2F36',
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  segmentActive: {
    backgroundColor: '#00D9C0',
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  segmentTextActive: {
    color: '#0F1419',
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'left',
  },
  hrtTypeCard: {
    backgroundColor: '#1A1F26',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2A2F36',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
  },
  hrtTypeCardSelected: {
    borderColor: '#00D9C0',
    backgroundColor: 'rgba(0, 217, 192, 0.08)',
  },
  lastCard: {
    marginBottom: 0,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2A2F36',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#00D9C0',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00D9C0',
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 4,
    textAlign: 'left',
  },
  cardTitleSelected: {
    color: '#00D9C0',
  },
  cardDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
    lineHeight: 18,
    textAlign: 'left',
  },
  cardDescriptionSelected: {
    color: '#B8C5C5',
  },
  dateSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  dateButton: {
    backgroundColor: '#1A1F26',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#2A2F36',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 56,
  },
  dateButtonWithValue: {
    borderColor: '#00D9C0',
  },
  dateButtonLeft: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 2,
    textAlign: 'left',
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'left',
  },
  dateValuePlaceholder: {
    color: '#6B7280',
    fontWeight: '400',
  },
  infoBadgeContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  infoBadge: {
    backgroundColor: 'rgba(0, 217, 192, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#00D9C0',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 24,
    height: 24,
    marginRight: 12,
    flexShrink: 0,
  },
  badgeTextContainer: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D9C0',
    marginBottom: 4,
    textAlign: 'left',
  },
  badgeDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#B8C5C5',
    lineHeight: 20,
    textAlign: 'left',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2F36',
    backgroundColor: '#0F1419',
  },
  primaryButton: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  buttonShadow: {
    shadowColor: '#00D9C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F1419',
  },
  buttonTextDisabled: {
    color: '#6B7280',
  },
  hintText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 20, 25, 0.9)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: '#1A1F26',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'left',
  },
  datePickerContainer: {
    marginVertical: 16,
    width: '100%',
    alignItems: 'center',
    ...(Platform.OS === 'ios' && {
      height: 216,
      justifyContent: 'center',
      backgroundColor: '#1A1F26',
      borderRadius: 12,
      overflow: 'hidden',
    }),
  },
  confirmButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00D9C0',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F1419',
  },
});
