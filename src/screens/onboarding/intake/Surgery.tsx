import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import Svg, { Path } from 'react-native-svg';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';

type HasSurgeries = 'yes' | 'no' | null;

const SURGERY_OPTIONS = [
  {
    value: 'top_surgery',
    title: 'Top Surgery',
    description: 'Chest reconstruction, mastectomy',
  },
  {
    value: 'bottom_surgery',
    title: 'Bottom Surgery',
    description: 'Vaginoplasty, phalloplasty, metoidioplasty',
  },
  {
    value: 'ffs',
    title: 'Facial Feminization (FFS)',
    description: 'Forehead, jaw, nose, etc.',
  },
  {
    value: 'orchiectomy',
    title: 'Orchiectomy',
    description: 'Surgical removal of testes',
  },
  {
    value: 'other',
    title: 'Other surgery',
    description: 'Other gender-affirming procedure',
  },
] as const;

type SurgeryValue = (typeof SURGERY_OPTIONS)[number]['value'];

interface SurgeryData {
  date: Date | null;
  fullyHealed: boolean;
  notes: string;
}

// Checkmark SVG Component
const CheckmarkSVG = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path
      d="M3 8 L6.5 11.5 L13 5"
      stroke="#0F1419"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Calendar Icon Component
const CalendarIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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
      stroke="#5B9FFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 8H12.01"
      stroke="#5B9FFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
      stroke="#5B9FFF"
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

// Helper: Calculate weeks post-op
const calculateWeeksPostOp = (date: Date): number => {
  const weeks = Math.floor((Date.now() - date.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return Math.max(0, weeks);
};

// Helper: Get recovery phase
const getRecoveryPhase = (weeks: number) => {
  if (weeks < 6) {
    return {
      phase: 'Early Recovery',
      color: '#FF6B6B',
      description: 'Focus on gentle movement and healing',
    };
  }
  if (weeks < 12) {
    return {
      phase: 'Active Recovery',
      color: '#FFB84D',
      description: 'Gradually increasing activity with caution',
    };
  }
  return {
    phase: 'Late Recovery',
    color: '#00D9C0',
    description: 'Most exercises available with modifications',
  };
};

// Helper: Format date as "January 2024"
const formatDate = (date: Date): string => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

// Helper: Get date 10 years ago
const getTenYearsAgo = (): Date => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 10);
  return date;
};

export default function Surgery({ navigation }: OnboardingScreenProps<'Surgery'>) {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();

  const [hasSurgeries, setHasSurgeries] = useState<HasSurgeries>(
    profile?.surgeries && profile.surgeries.length > 0
      ? 'yes'
      : profile?.surgeries?.length === 0
        ? 'no'
        : null
  );
  const [selectedSurgeries, setSelectedSurgeries] = useState<SurgeryValue[]>([]);
  const [surgeryData, setSurgeryData] = useState<Map<SurgeryValue, SurgeryData>>(new Map());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [currentSurgery, setCurrentSurgery] = useState<SurgeryValue | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  // Initialize from profile
  useEffect(() => {
    if (profile?.surgeries && profile.surgeries.length > 0) {
      const types = profile.surgeries.map((s) => s.type) as SurgeryValue[];
      setSelectedSurgeries(types);

      const data = new Map<SurgeryValue, SurgeryData>();
      profile.surgeries.forEach((surgery) => {
        data.set(surgery.type as SurgeryValue, {
          date: surgery.date ? new Date(surgery.date) : null,
          fullyHealed: surgery.fully_healed || false,
          notes: surgery.notes || '',
        });
      });
      setSurgeryData(data);
    }
  }, [profile]);

  // Initialize tempDate when opening picker
  useEffect(() => {
    if (showDatePicker && currentSurgery) {
      const existing = surgeryData.get(currentSurgery);
      setTempDate(existing?.date || new Date());
    }
  }, [showDatePicker, currentSurgery, surgeryData]);

  const toggleSurgery = (surgery: SurgeryValue) => {
    if (selectedSurgeries.includes(surgery)) {
      setSelectedSurgeries(selectedSurgeries.filter((s) => s !== surgery));
      const newData = new Map(surgeryData);
      newData.delete(surgery);
      setSurgeryData(newData);
    } else {
      setSelectedSurgeries([...selectedSurgeries, surgery]);
      const newData = new Map(surgeryData);
      newData.set(surgery, { date: null, fullyHealed: false, notes: '' });
      setSurgeryData(newData);
    }
  };

  const openDatePicker = (surgery: SurgeryValue) => {
    setCurrentSurgery(surgery);
    setShowDatePicker(true);
  };

  const handleDateConfirm = () => {
    if (!currentSurgery) return;

    const today = new Date();
    const tenYearsAgo = getTenYearsAgo();

    if (tempDate > today) {
      setShowDatePicker(false);
      return;
    }

    if (tempDate < tenYearsAgo) {
      setShowDatePicker(false);
      return;
    }

    const newData = new Map(surgeryData);
    const existing = newData.get(currentSurgery) || { date: null, fullyHealed: false, notes: '' };
    newData.set(currentSurgery, { ...existing, date: tempDate });
    setSurgeryData(newData);
    setShowDatePicker(false);
  };

  const updateFullyHealed = (surgery: SurgeryValue, fullyHealed: boolean) => {
    const newData = new Map(surgeryData);
    const existing = newData.get(surgery) || { date: null, fullyHealed: false, notes: '' };
    newData.set(surgery, { ...existing, fullyHealed });
    setSurgeryData(newData);
  };

  const updateNotes = (surgery: SurgeryValue, notes: string) => {
    const newData = new Map(surgeryData);
    const existing = newData.get(surgery) || { date: null, fullyHealed: false, notes: '' };
    newData.set(surgery, { ...existing, notes });
    setSurgeryData(newData);
  };

  const handleContinue = async () => {
    if (hasSurgeries === null) return;

    try {
      if (hasSurgeries === 'yes') {
        const surgeries = selectedSurgeries
          .map((type) => {
            const data = surgeryData.get(type);
            if (!data || !data.date) return null;

            const weeksPostOp = calculateWeeksPostOp(data.date);

            return {
              type,
              date: data.date,
              weeks_post_op: weeksPostOp,
              fully_healed: data.fullyHealed,
              notes: data.notes || undefined,
            };
          })
          .filter((s) => s !== null);

        await updateProfile({ surgeries });
      } else {
        await updateProfile({ surgeries: [] });
      }

      navigation.navigate('Goals');
    } catch (error) {
      console.error('Error saving surgery information:', error);
    }
  };

  const canContinue =
    hasSurgeries !== null &&
    (hasSurgeries === 'no' ||
      (selectedSurgeries.length > 0 &&
        selectedSurgeries.every((s) => {
          const data = surgeryData.get(s);
          return data && data.date !== null;
        })));

  const tenYearsAgo = getTenYearsAgo();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.progressWrapper}>
            <ProgressIndicator currentStep={4} totalSteps={8} />
          </View>
          <Text style={styles.headline}>
            Have you had any gender-affirming surgeries?
          </Text>
          <Text style={styles.subheadline}>
            This helps us adjust for post-surgical recovery
          </Text>
        </View>

        {/* Segmented Control */}
        <View style={styles.segmentedContainer}>
          <View style={styles.segmentControl}>
            <TouchableOpacity
              style={[styles.segment, hasSurgeries === 'yes' && styles.segmentActive]}
              onPress={() => {
                setHasSurgeries('yes');
                if (hasSurgeries === 'no') {
                  setSelectedSurgeries([]);
                  setSurgeryData(new Map());
                }
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.segmentText,
                  hasSurgeries === 'yes' && styles.segmentTextActive,
                ]}
              >
                Yes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segment, hasSurgeries === 'no' && styles.segmentActive]}
              onPress={() => {
                setHasSurgeries('no');
                setSelectedSurgeries([]);
                setSurgeryData(new Map());
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.segmentText,
                  hasSurgeries === 'no' && styles.segmentTextActive,
                ]}
              >
                No / Not yet
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Conditional: Surgery Selection */}
        {hasSurgeries === 'yes' && (
          <>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>Which surgeries? (Select all)</Text>

              {SURGERY_OPTIONS.map((surgery, index) => {
                const isSelected = selectedSurgeries.includes(surgery.value);
                const data = surgeryData.get(surgery.value);
                const weeksPostOp = data?.date ? calculateWeeksPostOp(data.date) : 0;
                const recoveryPhase = data?.date ? getRecoveryPhase(weeksPostOp) : null;
                const timelinePosition = data?.date
                  ? Math.min((weeksPostOp / 24) * 100, 100)
                  : 0;

                return (
                  <View key={surgery.value}>
                    {/* Checkbox Card */}
                    <TouchableOpacity
                      style={[
                        styles.checkboxCard,
                        isSelected && styles.checkboxCardSelected,
                        index === SURGERY_OPTIONS.length - 1 && styles.lastCard,
                      ]}
                      onPress={() => toggleSurgery(surgery.value)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected,
                        ]}
                      >
                        {isSelected && <CheckmarkSVG />}
                      </View>
                      <View style={styles.textContainer}>
                        <Text
                          style={[
                            styles.cardTitle,
                            isSelected && styles.cardTitleSelected,
                          ]}
                        >
                          {surgery.title}
                        </Text>
                        <Text
                          style={[
                            styles.cardDescription,
                            isSelected && styles.cardDescriptionSelected,
                          ]}
                        >
                          {surgery.description}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Inline Expansion */}
                    {isSelected && (
                      <View style={styles.expansionContainer}>
                        <View style={styles.expansionCard}>
                          {/* Date Section */}
                          <View style={styles.dateSection}>
                            <Text style={styles.dateLabel}>Surgery Date</Text>
                            <TouchableOpacity
                              style={[
                                styles.dateButton,
                                data?.date && styles.dateButtonWithValue,
                              ]}
                              onPress={() => openDatePicker(surgery.value)}
                              activeOpacity={0.8}
                            >
                              <Text
                                style={[
                                  styles.dateText,
                                  !data?.date && styles.dateTextPlaceholder,
                                ]}
                              >
                                {data?.date ? formatDate(data.date) : 'Select date'}
                              </Text>
                              <CalendarIcon />
                            </TouchableOpacity>
                          </View>

                          {/* Recovery Timeline */}
                          {data?.date && (
                            <View style={styles.timelineContainer}>
                              <Text style={styles.timelineLabel}>Recovery Progress</Text>
                              <View style={styles.timelineBarContainer}>
                                <View style={[styles.timelineSegment, styles.segment1]} />
                                <View style={[styles.timelineSegment, styles.segment2]} />
                                <View style={[styles.timelineSegment, styles.segment3]} />
                                <View
                                  style={[
                                    styles.positionDot,
                                    { left: `${timelinePosition}%` },
                                  ]}
                                />
                              </View>
                              <Text style={styles.timelineDescription}>
                                {recoveryPhase?.description}
                              </Text>
                            </View>
                          )}

                          {/* Status Radio */}
                          <View style={styles.statusSection}>
                            <Text style={styles.statusLabel}>Current status</Text>
                            <View style={styles.statusOptions}>
                              <TouchableOpacity
                                style={[
                                  styles.statusRadio,
                                  data?.fullyHealed && styles.statusRadioSelected,
                                ]}
                                onPress={() => updateFullyHealed(surgery.value, true)}
                                activeOpacity={0.8}
                              >
                                <View
                                  style={[
                                    styles.radioCircle,
                                    data?.fullyHealed && styles.radioCircleSelected,
                                  ]}
                                >
                                  {data?.fullyHealed && <View style={styles.radioDot} />}
                                </View>
                                <Text
                                  style={[
                                    styles.radioText,
                                    data?.fullyHealed && styles.radioTextSelected,
                                  ]}
                                >
                                  Fully healed
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.statusRadio,
                                  !data?.fullyHealed && styles.statusRadioSelected,
                                ]}
                                onPress={() => updateFullyHealed(surgery.value, false)}
                                activeOpacity={0.8}
                              >
                                <View
                                  style={[
                                    styles.radioCircle,
                                    !data?.fullyHealed && styles.radioCircleSelected,
                                  ]}
                                >
                                  {!data?.fullyHealed && <View style={styles.radioDot} />}
                                </View>
                                <Text
                                  style={[
                                    styles.radioText,
                                    !data?.fullyHealed && styles.radioTextSelected,
                                  ]}
                                >
                                  Still recovering
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Notes Input */}
                          <View style={styles.notesSection}>
                            <View style={styles.notesLabelRow}>
                              <Text style={styles.notesLabel}>Notes</Text>
                              <View style={styles.optionalBadge}>
                                <Text style={styles.optionalBadgeText}>OPTIONAL</Text>
                              </View>
                            </View>
                            <TextInput
                              style={styles.notesInput}
                              value={data?.notes || ''}
                              onChangeText={(text) => updateNotes(surgery.value, text)}
                              placeholder="Any additional details..."
                              placeholderTextColor="#6B7280"
                              multiline
                              textAlignVertical="top"
                            />
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Info Badge */}
            <View style={styles.infoBadgeContainer}>
              <View style={styles.infoBadge}>
                <View style={styles.badgeIconContainer}>
                  <InfoIcon />
                </View>
                <View style={styles.badgeTextContainer}>
                  <Text style={styles.badgeTitle}>Recovery Timeline</Text>
                  <Text style={styles.badgeDescription}>
                    We'll adjust exercise selection based on your recovery phase
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Footer - Inside ScrollView (NOT sticky) */}
        <View style={[styles.footerContainer, { paddingBottom: insets.bottom + 16 }]}>
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
            Your information is private and secure
          </Text>
        </View>
      </ScrollView>

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
              <Text style={styles.modalTitle}>Select Surgery Date</Text>
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
                minimumDate={tenYearsAgo}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
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
  checkboxCard: {
    backgroundColor: '#1A1F26',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2A2F36',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
  },
  checkboxCardSelected: {
    borderColor: '#00D9C0',
    backgroundColor: 'rgba(0, 217, 192, 0.08)',
  },
  lastCard: {
    marginBottom: 0,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2A2F36',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    borderColor: '#00D9C0',
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
    textAlign: 'left',
  },
  cardTitleSelected: {
    color: '#00D9C0',
  },
  cardDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
    marginTop: 2,
    lineHeight: 18,
    textAlign: 'left',
  },
  cardDescriptionSelected: {
    color: '#B8C5C5',
  },
  expansionContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  expansionCard: {
    backgroundColor: '#151920',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2F36',
  },
  dateSection: {
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'left',
  },
  dateButton: {
    backgroundColor: '#1A1F26',
    borderRadius: 10,
    padding: 14,
    borderWidth: 2,
    borderColor: '#2A2F36',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 52,
  },
  dateButtonWithValue: {
    borderColor: '#00D9C0',
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'left',
  },
  dateTextPlaceholder: {
    color: '#6B7280',
    fontWeight: '400',
  },
  timelineContainer: {
    marginBottom: 20,
  },
  timelineLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12,
    textAlign: 'left',
  },
  timelineBarContainer: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2A2F36',
    overflow: 'visible',
    marginBottom: 12,
    position: 'relative',
  },
  timelineSegment: {
    flex: 1,
  },
  segment1: {
    backgroundColor: '#FF6B6B',
  },
  segment2: {
    backgroundColor: '#FFB84D',
  },
  segment3: {
    backgroundColor: '#00D9C0',
  },
  positionDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#0F1419',
    position: 'absolute',
    top: -4,
    marginLeft: -8,
  },
  timelineDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#B8C5C5',
    lineHeight: 20,
    textAlign: 'left',
  },
  statusSection: {
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    textAlign: 'left',
  },
  statusOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  statusRadio: {
    flex: 1,
    backgroundColor: '#1A1F26',
    borderRadius: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: '#2A2F36',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  statusRadioSelected: {
    borderColor: '#00D9C0',
    backgroundColor: 'rgba(0, 217, 192, 0.08)',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#2A2F36',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#00D9C0',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D9C0',
  },
  radioText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E0E4E8',
    textAlign: 'left',
  },
  radioTextSelected: {
    fontWeight: '600',
    color: '#00D9C0',
  },
  notesSection: {
    marginBottom: 0,
  },
  notesLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'left',
  },
  optionalBadge: {
    backgroundColor: 'rgba(91, 159, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  optionalBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5B9FFF',
    textTransform: 'uppercase',
  },
  notesInput: {
    backgroundColor: '#1A1F26',
    borderWidth: 2,
    borderColor: '#2A2F36',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#FFFFFF',
    minHeight: 80,
    textAlignVertical: 'top',
    textAlign: 'left',
  },
  infoBadgeContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  infoBadge: {
    backgroundColor: 'rgba(91, 159, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#5B9FFF',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  badgeIconContainer: {
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
    color: '#5B9FFF',
    marginBottom: 4,
    textAlign: 'left',
  },
  badgeDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#B8C5C5',
    lineHeight: 19,
    textAlign: 'left',
  },
  footerContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 0,
  },
  primaryButton: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 16,
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
    lineHeight: 18,
    marginBottom: 24,
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
