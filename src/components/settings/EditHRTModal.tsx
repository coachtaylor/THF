/**
 * Edit HRT Modal
 *
 * Full-screen modal for editing HRT status and details
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { textStyles } from '../../theme/components';
import { Profile } from '../../types';
import { updateProfile } from '../../services/storage/profile';
import ToggleButtonGroup from '../onboarding/ToggleButtonGroup';
import MedicationSection from '../onboarding/MedicationSection';

type HRTMethod = 'pills' | 'patches' | 'injections' | 'gel';
type HRTFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'twice_weekly';
type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

interface EditHRTModalProps {
  visible: boolean;
  onClose: () => void;
  profile: Profile | null;
  onSave: () => void;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function EditHRTModal({
  visible,
  onClose,
  profile,
  onSave,
}: EditHRTModalProps) {
  const insets = useSafeAreaInsets();
  const [onHRT, setOnHRT] = useState<string | null>(null);

  // HRT details
  const [method, setMethod] = useState<HRTMethod>('pills');
  const [frequency, setFrequency] = useState<HRTFrequency>('daily');
  const [days, setDays] = useState<Set<DayOfWeek>>(new Set());

  // Start date
  const [startMonth, setStartMonth] = useState(new Date().getMonth() + 1);
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);

  const isMTF = profile?.gender_identity === 'mtf';
  const isFTM = profile?.gender_identity === 'ftm';

  // Reset state when modal opens
  useEffect(() => {
    if (visible && profile) {
      setOnHRT(profile.on_hrt ? 'Yes' : 'No');

      if (profile.on_hrt) {
        if (profile.hrt_method) setMethod(profile.hrt_method);
        if (profile.hrt_frequency) setFrequency(profile.hrt_frequency as HRTFrequency);
        if (profile.hrt_days) setDays(new Set(profile.hrt_days as DayOfWeek[]));
        if (profile.hrt_start_date) {
          const date = new Date(profile.hrt_start_date);
          setStartMonth(date.getMonth() + 1);
          setStartYear(date.getFullYear());
        }
      }
    }
  }, [visible, profile]);

  const calculateDuration = () => {
    const now = new Date();
    const start = new Date(startYear, startMonth - 1);
    const diffTime = now.getTime() - start.getTime();
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
    return Math.max(0, diffMonths);
  };

  const toggleDay = (day: DayOfWeek) => {
    const newDays = new Set(days);
    if (newDays.has(day)) {
      newDays.delete(day);
    } else {
      newDays.add(day);
    }
    setDays(newDays);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const hrtStartDate = onHRT === 'Yes'
        ? new Date(startYear, startMonth - 1, 1)
        : undefined;

      let hrtData: {
        on_hrt: boolean;
        hrt_type?: 'estrogen_blockers' | 'testosterone' | 'none';
        hrt_method?: 'pills' | 'patches' | 'injections' | 'gel';
        hrt_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
        hrt_days?: string[];
        hrt_start_date?: Date;
        hrt_months_duration?: number;
      } = {
        on_hrt: onHRT === 'Yes',
      };

      if (onHRT === 'Yes') {
        hrtData = {
          ...hrtData,
          hrt_type: isMTF ? 'estrogen_blockers' : isFTM ? 'testosterone' : 'none',
          hrt_method: method,
          hrt_frequency: frequency as 'daily' | 'weekly' | 'biweekly' | 'monthly',
          hrt_days: Array.from(days),
          hrt_start_date: hrtStartDate,
          hrt_months_duration: calculateDuration(),
        };
      } else {
        hrtData.hrt_type = 'none';
      }

      await updateProfile(hrtData);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving HRT data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = onHRT === 'No' || (onHRT === 'Yes' && days.size > 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit HRT Status</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSave || isSaving}
            hitSlop={8}
          >
            <Text
              style={[
                styles.saveButton,
                (!canSave || isSaving) && styles.saveButtonDisabled,
              ]}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Are you on HRT? */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Are you currently on HRT?</Text>
            <ToggleButtonGroup
              options={['Yes', 'No']}
              selected={onHRT}
              onSelect={setOnHRT}
            />
          </View>

          {/* HRT Details */}
          {onHRT === 'Yes' && (
            <>
              <MedicationSection
                title={isMTF ? 'Estrogen' : 'Testosterone'}
                icon={isMTF ? 'water' : 'barbell'}
                method={method}
                frequency={frequency}
                selectedDays={days}
                onMethodChange={setMethod}
                onFrequencyChange={setFrequency}
                onToggleDay={toggleDay}
                isEstrogen={isMTF}
              />

              {/* Start Date */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>When did you start HRT?</Text>

                <View style={styles.dateRow}>
                  <View style={styles.dateColumn}>
                    <Text style={styles.dateLabel}>Month</Text>
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={() => setShowMonthPicker(true)}
                    >
                      <Text style={styles.pickerButtonText}>{months[startMonth - 1]}</Text>
                      <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dateColumn}>
                    <Text style={styles.dateLabel}>Year</Text>
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={() => setShowYearPicker(true)}
                    >
                      <Text style={styles.pickerButtonText}>{startYear}</Text>
                      <Ionicons name="chevron-down" size={20} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Duration Display */}
                <View style={styles.durationCard}>
                  <Ionicons name="calendar" size={20} color={colors.cyan[500]} />
                  <Text style={styles.durationText}>
                    Duration: <Text style={styles.durationBold}>{calculateDuration()} months</Text> on HRT
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {/* Month Picker Modal */}
        <Modal
          visible={showMonthPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowMonthPicker(false)}
        >
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContent}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Month</Text>
                <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                  <Text style={styles.pickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerScrollView}>
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.pickerOption,
                      startMonth === index + 1 && styles.pickerOptionSelected,
                    ]}
                    onPress={() => {
                      setStartMonth(index + 1);
                      setShowMonthPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        startMonth === index + 1 && styles.pickerOptionTextSelected,
                      ]}
                    >
                      {month}
                    </Text>
                    {startMonth === index + 1 && (
                      <Ionicons name="checkmark" size={20} color={colors.cyan[500]} />
                    )}
                  </TouchableOpacity>
                ))}
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
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContent}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Year</Text>
                <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                  <Text style={styles.pickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerScrollView}>
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.pickerOption,
                      startYear === year && styles.pickerOptionSelected,
                    ]}
                    onPress={() => {
                      setStartYear(year);
                      setShowYearPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        startYear === year && styles.pickerOptionTextSelected,
                      ]}
                    >
                      {year}
                    </Text>
                    {startYear === year && (
                      <Ionicons name="checkmark" size={20} color={colors.cyan[500]} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerTitle: {
    ...textStyles.h3,
    fontSize: 18,
    color: colors.text.primary,
  },
  saveButton: {
    ...textStyles.body,
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  saveButtonDisabled: {
    color: colors.text.tertiary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.xl,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.m,
  },
  sectionTitle: {
    ...textStyles.h3,
    fontSize: 18,
    color: colors.text.primary,
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
    ...textStyles.label,
    color: colors.text.secondary,
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
    ...textStyles.bodySmall,
    color: colors.cyan[500],
  },
  durationBold: {
    fontWeight: '600',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContent: {
    backgroundColor: colors.bg.raised,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    paddingTop: spacing.xl,
    paddingBottom: spacing['4xl'],
    maxHeight: '50%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  pickerTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
  },
  pickerDone: {
    ...textStyles.body,
    color: colors.cyan[500],
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
    ...textStyles.body,
    color: colors.text.secondary,
  },
  pickerOptionTextSelected: {
    color: colors.cyan[500],
    fontWeight: '600',
  },
});
