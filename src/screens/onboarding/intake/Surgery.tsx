import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity, TextInput, Modal, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import { palette, spacing, typography } from '../../../theme';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import type { Surgery as SurgeryType } from '../../../types';

type SurgerySelection = 'yes' | 'no';
type SurgeryTypeOption = 'top_surgery' | 'bottom_surgery' | 'ffs' | 'orchiectomy' | 'other';

interface SurgeryFormData {
  type: SurgeryTypeOption;
  date: Date | null;
  month: number | null;
  year: number | null;
  fully_healed: boolean;
  notes: string;
}

interface SurgeryTypeOptionConfig {
  value: SurgeryTypeOption;
  title: string;
  description?: string;
}

const SURGERY_TYPE_OPTIONS: SurgeryTypeOptionConfig[] = [
  { value: 'top_surgery', title: 'Top Surgery', description: '(Chest reconstruction, mastectomy)' },
  { value: 'bottom_surgery', title: 'Bottom Surgery', description: '(Vaginoplasty, phalloplasty, metoidioplasty)' },
  { value: 'ffs', title: 'Facial Feminization Surgery (FFS)' },
  { value: 'orchiectomy', title: 'Orchiectomy' },
  { value: 'other', title: 'Other surgery' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const generateYears = (): number[] => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let i = 0; i <= 10; i++) {
    years.push(currentYear - i);
  }
  return years;
};

const formatWeeksPostOp = (weeks: number | undefined): string => {
  if (weeks === undefined) return '';
  if (weeks === 0) return 'Less than 1 week post-op';
  if (weeks < 4) {
    return `You are approximately ${weeks} ${weeks === 1 ? 'week' : 'weeks'} post-op`;
  }
  const months = Math.floor(weeks / 4.33);
  const remainingWeeks = Math.floor(weeks % 4.33);
  if (months === 0) {
    return `You are approximately ${weeks} ${weeks === 1 ? 'week' : 'weeks'} post-op`;
  }
  if (remainingWeeks === 0) {
    return `You are approximately ${months} ${months === 1 ? 'month' : 'months'} post-op (about ${weeks} ${weeks === 1 ? 'week' : 'weeks'})`;
  }
  return `You are approximately ${months} ${months === 1 ? 'month' : 'months'} post-op (about ${weeks} ${weeks === 1 ? 'week' : 'weeks'})`;
};

export default function Surgery({ navigation }: OnboardingScreenProps<'Surgery'>) {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < 375;

  const [hasSurgeries, setHasSurgeries] = useState<SurgerySelection | null>(
    profile?.surgeries && profile.surgeries.length > 0 ? 'yes' : profile?.surgeries?.length === 0 ? 'no' : null
  );

  const [selectedTypes, setSelectedTypes] = useState<SurgeryTypeOption[]>([]);
  const [expandedSurgeries, setExpandedSurgeries] = useState<Set<SurgeryTypeOption>>(new Set());
  const [showMonthPicker, setShowMonthPicker] = useState<SurgeryTypeOption | null>(null);
  const [showYearPicker, setShowYearPicker] = useState<SurgeryTypeOption | null>(null);
  const [surgeryForms, setSurgeryForms] = useState<Record<SurgeryTypeOption, SurgeryFormData>>({
    top_surgery: { type: 'top_surgery', date: null, month: null, year: null, fully_healed: false, notes: '' },
    bottom_surgery: { type: 'bottom_surgery', date: null, month: null, year: null, fully_healed: false, notes: '' },
    ffs: { type: 'ffs', date: null, month: null, year: null, fully_healed: false, notes: '' },
    orchiectomy: { type: 'orchiectomy', date: null, month: null, year: null, fully_healed: false, notes: '' },
    other: { type: 'other', date: null, month: null, year: null, fully_healed: false, notes: '' },
  });

  const years = generateYears();

  // Initialize from profile if available
  useEffect(() => {
    if (profile?.surgeries && profile.surgeries.length > 0) {
      const types = profile.surgeries.map(s => s.type);
      setSelectedTypes(types);
      
      const forms: Record<SurgeryTypeOption, SurgeryFormData> = {
        top_surgery: { type: 'top_surgery', date: null, month: null, year: null, fully_healed: false, notes: '' },
        bottom_surgery: { type: 'bottom_surgery', date: null, month: null, year: null, fully_healed: false, notes: '' },
        ffs: { type: 'ffs', date: null, month: null, year: null, fully_healed: false, notes: '' },
        orchiectomy: { type: 'orchiectomy', date: null, month: null, year: null, fully_healed: false, notes: '' },
        other: { type: 'other', date: null, month: null, year: null, fully_healed: false, notes: '' },
      };

      profile.surgeries.forEach(surgery => {
        const surgeryDate = new Date(surgery.date);
        forms[surgery.type] = {
          type: surgery.type,
          date: surgery.date,
          month: surgeryDate.getMonth(),
          year: surgeryDate.getFullYear(),
          fully_healed: surgery.fully_healed || false,
          notes: surgery.notes || '',
        };
        // Auto-expand surgeries that have data
        setExpandedSurgeries(prev => new Set([...prev, surgery.type]));
      });

      setSurgeryForms(forms);
    }
  }, [profile]);

  const toggleSurgeryType = (type: SurgeryTypeOption) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
      setExpandedSurgeries(prev => {
        const next = new Set(prev);
        next.delete(type);
        return next;
      });
      // Clear form data for deselected type
      setSurgeryForms(prev => ({
        ...prev,
        [type]: { type, date: null, month: null, year: null, fully_healed: false, notes: '' },
      }));
    } else {
      setSelectedTypes([...selectedTypes, type]);
      // Auto-expand when selected
      setExpandedSurgeries(prev => new Set([...prev, type]));
    }
  };

  const toggleExpanded = (type: SurgeryTypeOption) => {
    setExpandedSurgeries(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const updateSurgeryMonth = (type: SurgeryTypeOption, month: number) => {
    setSurgeryForms(prev => {
      const form = prev[type];
      const newDate = form.year !== null ? new Date(form.year, month, 1) : null;
      return {
        ...prev,
        [type]: {
          ...form,
          month,
          date: newDate,
        },
      };
    });
    setShowMonthPicker(null);
  };

  const updateSurgeryYear = (type: SurgeryTypeOption, year: number) => {
    setSurgeryForms(prev => {
      const form = prev[type];
      const newDate = form.month !== null ? new Date(year, form.month, 1) : null;
      return {
        ...prev,
        [type]: {
          ...form,
          year,
          date: newDate,
        },
      };
    });
    setShowYearPicker(null);
  };

  const updateSurgeryNotes = (type: SurgeryTypeOption, notes: string) => {
    // Limit to 500 characters
    const trimmedNotes = notes.slice(0, 500);
    setSurgeryForms(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        notes: trimmedNotes,
      },
    }));
  };

  const setFullyHealed = (type: SurgeryTypeOption, value: boolean) => {
    setSurgeryForms(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        fully_healed: value,
      },
    }));
  };


  const calculateWeeksPostOp = (surgeryDate: Date | null): number | undefined => {
    if (!surgeryDate) return undefined;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - surgeryDate.getTime());
    const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
    return diffWeeks;
  };

  const getRecoveryGuidance = (weeks: number | undefined): string => {
    if (weeks === undefined) return '';
    if (weeks < 6) {
      return '🛑 Early Recovery Phase: We\'ll keep exercises very gentle and conservative';
    } else if (weeks >= 6 && weeks < 12) {
      return '⚠️ Active Recovery Phase: We\'ll avoid exercises that stress surgical sites';
    } else {
      return '✅ Late Recovery Phase: Most exercises will be available';
    }
  };

  const validateSurgeryDate = (month: number | null, year: number | null): string | null => {
    if (month === null || year === null) return null;
    
    const now = new Date();
    const surgeryDate = new Date(year, month, 1);
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(now.getFullYear() - 10);

    if (surgeryDate > now) {
      return 'Date cannot be in the future';
    }
    if (surgeryDate < tenYearsAgo) {
      return 'Date cannot be more than 10 years ago';
    }
    return null;
  };

  const isSurgeryComplete = (type: SurgeryTypeOption): boolean => {
    const form = surgeryForms[type];
    return form.month !== null && form.year !== null && 
           validateSurgeryDate(form.month, form.year) === null;
  };

  const handleContinue = async () => {
    try {
      if (hasSurgeries === 'no') {
        await updateProfile({
          surgeries: [],
        });
      } else if (hasSurgeries === 'yes') {
        const surgeries: SurgeryType[] = selectedTypes
          .filter(type => surgeryForms[type].date !== null)
          .map(type => {
            const form = surgeryForms[type];
            return {
              type,
              date: form.date!,
              weeks_post_op: calculateWeeksPostOp(form.date),
              fully_healed: form.fully_healed || undefined,
              notes: form.notes || undefined,
            };
          });

        await updateProfile({ surgeries });
      }

      navigation.navigate('Goals');
    } catch (error) {
      console.error('Error saving surgery information:', error);
    }
  };

  const canContinue = hasSurgeries !== null && 
    (hasSurgeries === 'no' || (hasSurgeries === 'yes' && selectedTypes.length > 0 && 
      selectedTypes.every(type => {
        const form = surgeryForms[type];
        return form.month !== null && form.year !== null && 
               validateSurgeryDate(form.month, form.year) === null;
      })));

  // Check if any surgery is less than 12 weeks post-op
  const hasRecentSurgery = hasSurgeries === 'yes' && selectedTypes.some(type => {
    const weeksPostOp = calculateWeeksPostOp(surgeryForms[type].date);
    return weeksPostOp !== undefined && weeksPostOp < 12;
  });

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
          Have you had any gender-affirming surgeries?
        </Text>
        <Text style={[styles.subheadline, isSmall && styles.subheadlineSmall]}>
          This helps us adjust your program for post-surgical recovery.
        </Text>
      </View>

      <ProgressIndicator
        currentStep={4}
        totalSteps={8}
        stepLabels={['Gender Identity', 'HRT Status', 'Binding Info', 'Surgery History', 'Goals', 'Experience', 'Dysphoria', 'Review']}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              onPress={() => setHasSurgeries('yes')}
              activeOpacity={0.7}
              style={[
                styles.largeButton,
                hasSurgeries === 'yes' && styles.largeButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.largeButtonText,
                  hasSurgeries === 'yes' && styles.largeButtonTextSelected,
                ]}
              >
                Yes, I've had surgery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setHasSurgeries('no');
                setSelectedTypes([]);
                setExpandedSurgeries(new Set());
              }}
              activeOpacity={0.7}
              style={[
                styles.largeButton,
                hasSurgeries === 'no' && styles.largeButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.largeButtonText,
                  hasSurgeries === 'no' && styles.largeButtonTextSelected,
                ]}
              >
                No / Not yet
              </Text>
            </TouchableOpacity>
          </View>

          {hasSurgeries === 'yes' && (
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Which surgeries have you had? (Select all that apply)</Text>
              <View style={styles.surgeryCardsContainer}>
                {SURGERY_TYPE_OPTIONS.map((option) => {
                  const isSelected = selectedTypes.includes(option.value);
                  const isExpanded = expandedSurgeries.has(option.value);
                  const form = surgeryForms[option.value];
                  const weeksPostOp = calculateWeeksPostOp(form.date);
                  const recoveryGuidance = getRecoveryGuidance(weeksPostOp);
                  const dateError = validateSurgeryDate(form.month, form.year);
                  const isComplete = isSurgeryComplete(option.value);
                  
                  return (
                    <View key={option.value} style={styles.surgeryCardWrapper}>
                      <TouchableOpacity
                        onPress={() => toggleSurgeryType(option.value)}
                        activeOpacity={0.7}
                        style={[
                          styles.surgeryCard,
                          isSelected && styles.surgeryCardSelected,
                        ]}
                      >
                        <View style={styles.surgeryCardCheckbox}>
                          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                            {isSelected && <Text style={styles.checkmark}>✓</Text>}
                          </View>
                        </View>
                        <View style={styles.surgeryCardContent}>
                          <View style={styles.surgeryCardTitleRow}>
                            <Text style={[styles.surgeryCardTitle, isSelected && styles.surgeryCardTitleSelected]}>
                              {option.title}
                            </Text>
                            {isSelected && isComplete && (
                              <View style={styles.completeCheckmark}>
                                <Text style={styles.completeCheckmarkText}>✓</Text>
                              </View>
                            )}
                          </View>
                          {option.description && (
                            <Text style={[styles.surgeryCardDescription, isSelected && styles.surgeryCardDescriptionSelected]}>
                              {option.description}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>

                      {/* Expandable Details Card */}
                      {isSelected && (
                        <View style={styles.expandableCard}>
                          <TouchableOpacity
                            onPress={() => toggleExpanded(option.value)}
                            activeOpacity={0.7}
                            style={styles.expandableHeader}
                          >
                            <Text style={styles.expandableHeaderTitle}>
                              {option.title}
                            </Text>
                            <Text style={styles.expandableHeaderIcon}>
                              {isExpanded ? '▲' : '▼'}
                            </Text>
                          </TouchableOpacity>

                          {isExpanded && (
                            <View style={styles.expandableContent}>
                              <View style={styles.formField}>
                                <Text style={styles.formLabel}>Surgery Date:</Text>
                                <View style={styles.datePickerRow}>
                                  <TouchableOpacity
                                    onPress={() => setShowMonthPicker(option.value)}
                                    style={styles.datePickerButton}
                                  >
                                    <Text style={styles.datePickerButtonText}>
                                      {form.month !== null ? MONTHS[form.month] : 'Month'}
                                    </Text>
                                    <Text style={styles.datePickerArrow}>▼</Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    onPress={() => setShowYearPicker(option.value)}
                                    style={styles.datePickerButton}
                                  >
                                    <Text style={styles.datePickerButtonText}>
                                      {form.year !== null ? form.year.toString() : 'Year'}
                                    </Text>
                                    <Text style={styles.datePickerArrow}>▼</Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    style={styles.calendarButton}
                                    onPress={() => {
                                      // Calendar icon - could open native date picker if needed
                                      // For now, just visual
                                    }}
                                  >
                                    <Text style={styles.calendarIcon}>📅</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>

                              <View style={styles.formField}>
                                <Text style={styles.formLabel}>Status:</Text>
                                <View style={styles.statusRow}>
                                  <TouchableOpacity
                                    onPress={() => setFullyHealed(option.value, true)}
                                    activeOpacity={0.7}
                                    style={styles.statusOption}
                                  >
                                    <View style={[styles.radioButton, form.fully_healed && styles.radioButtonSelected]}>
                                      {form.fully_healed && <View style={styles.radioButtonInner} />}
                                    </View>
                                    <Text style={styles.statusLabel}>Fully healed</Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    onPress={() => setFullyHealed(option.value, false)}
                                    activeOpacity={0.7}
                                    style={styles.statusOption}
                                  >
                                    <View style={[styles.radioButton, !form.fully_healed && styles.radioButtonSelected]}>
                                      {!form.fully_healed && <View style={styles.radioButtonInner} />}
                                    </View>
                                    <Text style={styles.statusLabel}>Still recovering</Text>
                                  </TouchableOpacity>
                                </View>
                                {dateError && (
                                  <Text style={styles.errorText}>{dateError}</Text>
                                )}
                              </View>

                              {form.date && weeksPostOp !== undefined && (
                                <>
                                  <View style={styles.infoMessage}>
                                    <Text style={styles.infoIcon}>💡</Text>
                                    <Text style={styles.infoText}>
                                      {formatWeeksPostOp(weeksPostOp)}
                                    </Text>
                                  </View>
                                  {recoveryGuidance && (
                                    <View style={styles.recoveryGuidance}>
                                      <Text style={styles.recoveryGuidanceText}>
                                        {recoveryGuidance}
                                      </Text>
                                    </View>
                                  )}
                                </>
                              )}

                              <View style={styles.formField}>
                                <View style={styles.notesLabelRow}>
                                  <Text style={styles.formLabel}>Optional Notes:</Text>
                                  <Text style={styles.characterCount}>
                                    {form.notes.length}/500
                                  </Text>
                                </View>
                                <TextInput
                                  style={styles.notesInput}
                                  value={form.notes}
                                  onChangeText={(text) => updateSurgeryNotes(option.value, text)}
                                  placeholder="Any additional information..."
                                  placeholderTextColor={palette.midGray}
                                  multiline
                                  numberOfLines={3}
                                  textAlignVertical="top"
                                  maxLength={500}
                                />
                              </View>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {selectedTypes.length > 0 && hasRecentSurgery && (
                <View style={styles.warningBanner}>
                  <Text style={styles.warningIcon}>⚠️</Text>
                  <Text style={styles.warningMessage}>
                    Important: Always follow your surgeon's specific guidance. We'll be conservative with exercise selection, but check with your surgeon before starting any new program.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.ctaContainer}>
        <PrimaryButton
          onPress={handleContinue}
          label="Continue"
          disabled={!canContinue}
        />
        {!canContinue && hasSurgeries === 'yes' && (
          <Text style={styles.hintText}>
            Please select at least one surgery type and provide a date for each
          </Text>
        )}
      </View>

      {/* Month Picker Modal */}
      <Modal
        visible={showMonthPicker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMonthPicker(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMonthPicker(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Month</Text>
            <FlatList
              data={MONTHS}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => showMonthPicker && updateSurgeryMonth(showMonthPicker, index)}
                  style={styles.modalItem}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Year Picker Modal */}
      <Modal
        visible={showYearPicker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShowYearPicker(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearPicker(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Year</Text>
            <FlatList
              data={years}
              keyExtractor={(item) => item.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => showYearPicker && updateSurgeryYear(showYearPicker, item)}
                  style={styles.modalItem}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
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
  sectionHeader: {
    marginBottom: spacing.m,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.m,
    color: palette.white,
    letterSpacing: -0.5,
  },
  buttonGroup: {
    gap: spacing.m,
    marginBottom: spacing.m,
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
  },
  largeButtonText: {
    ...typography.h3,
    color: palette.white,
  },
  largeButtonTextSelected: {
    color: palette.tealPrimary,
  },
  subsection: {
    marginTop: spacing.l,
    paddingTop: spacing.l,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  subsectionTitle: {
    ...typography.h3,
    marginBottom: spacing.m,
    color: palette.white,
  },
  surgeryCardsContainer: {
    gap: spacing.m,
    marginBottom: spacing.l,
  },
  surgeryCardWrapper: {
    marginBottom: spacing.m,
  },
  surgeryCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 16,
    padding: spacing.l,
    borderWidth: 2,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    minHeight: 80,
  },
  surgeryCardSelected: {
    borderWidth: 3,
    borderColor: palette.tealPrimary,
    backgroundColor: palette.darkerCard,
  },
  surgeryCardCheckbox: {
    flexShrink: 0,
  },
  surgeryCardContent: {
    flex: 1,
  },
  surgeryCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  surgeryCardTitle: {
    ...typography.h3,
    color: palette.white,
    flex: 1,
  },
  surgeryCardTitleSelected: {
    color: palette.tealPrimary,
  },
  completeCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.tealPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.s,
  },
  completeCheckmarkText: {
    color: palette.deepBlack,
    fontSize: 14,
    fontWeight: '700',
  },
  surgeryCardDescription: {
    ...typography.body,
    color: palette.midGray,
    lineHeight: 20,
  },
  surgeryCardDescriptionSelected: {
    color: palette.lightGray,
  },
  expandableCard: {
    marginTop: spacing.s,
    backgroundColor: palette.darkerCard,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: palette.border,
    overflow: 'hidden',
  },
  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.m,
    backgroundColor: palette.darkCard,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  expandableHeaderTitle: {
    ...typography.h3,
    color: palette.white,
    fontWeight: '600',
  },
  expandableHeaderIcon: {
    ...typography.body,
    color: palette.tealPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  expandableContent: {
    padding: spacing.m,
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.l,
    marginTop: spacing.s,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.border,
    backgroundColor: palette.darkerCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: palette.tealPrimary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.tealPrimary,
  },
  statusLabel: {
    ...typography.body,
    color: palette.white,
  },
  infoMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s,
    backgroundColor: 'rgba(0, 204, 204, 0.1)',
    borderRadius: 12,
    padding: spacing.m,
    marginTop: spacing.m,
    marginBottom: spacing.m,
  },
  infoIcon: {
    fontSize: 20,
    flexShrink: 0,
  },
  infoText: {
    ...typography.body,
    color: palette.tealPrimary,
    flex: 1,
    lineHeight: 20,
  },
  recoveryGuidance: {
    backgroundColor: 'rgba(0, 204, 204, 0.1)',
    borderRadius: 12,
    padding: spacing.m,
    marginTop: spacing.s,
    marginBottom: spacing.m,
    borderLeftWidth: 3,
    borderLeftColor: palette.tealPrimary,
  },
  recoveryGuidanceText: {
    ...typography.body,
    color: palette.tealPrimary,
    lineHeight: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: palette.border,
    backgroundColor: palette.darkerCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealPrimary,
  },
  checkmark: {
    color: palette.deepBlack,
    fontSize: 16,
    fontWeight: '700',
  },
  checkboxLabel: {
    ...typography.body,
    color: palette.lightGray,
    flex: 1,
  },
  checkboxLabelSelected: {
    color: palette.white,
    fontWeight: '600',
  },
  formsContainer: {
    gap: spacing.l,
    marginTop: spacing.m,
  },
  surgeryFormCard: {
    backgroundColor: palette.darkerCard,
    borderRadius: 12,
    padding: spacing.m,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  surgeryFormTitle: {
    ...typography.h3,
    color: palette.tealPrimary,
    marginBottom: spacing.m,
  },
  formField: {
    marginBottom: spacing.m,
  },
  formLabel: {
    ...typography.bodySmall,
    color: palette.midGray,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  notesLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  characterCount: {
    ...typography.caption,
    color: palette.midGray,
  },
  errorText: {
    ...typography.bodySmall,
    color: palette.error,
    marginTop: spacing.xs,
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: spacing.s,
    alignItems: 'center',
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.darkCard,
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: 12,
    padding: spacing.m,
    minHeight: 48,
  },
  datePickerButtonText: {
    ...typography.body,
    color: palette.white,
  },
  datePickerArrow: {
    ...typography.body,
    color: palette.midGray,
    fontSize: 12,
    marginLeft: spacing.xs,
  },
  calendarButton: {
    width: 48,
    height: 48,
    backgroundColor: palette.darkCard,
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarIcon: {
    fontSize: 20,
  },
  weeksPostOpText: {
    ...typography.caption,
    color: palette.tealPrimary,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  contextMessage: {
    ...typography.bodySmall,
    color: palette.lightGray,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 184, 77, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: palette.warning,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.l,
    alignItems: 'flex-start',
    gap: spacing.s,
  },
  warningIcon: {
    fontSize: 20,
    flexShrink: 0,
  },
  warningMessage: {
    ...typography.bodySmall,
    color: palette.warning,
    flex: 1,
    lineHeight: 18,
  },
  notesInput: {
    backgroundColor: palette.darkCard,
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: 12,
    padding: spacing.m,
    ...typography.body,
    color: palette.white,
    minHeight: 80,
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: palette.darkCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
    paddingTop: spacing.l,
  },
  modalTitle: {
    ...typography.h3,
    color: palette.white,
    textAlign: 'center',
    marginBottom: spacing.m,
    paddingHorizontal: spacing.l,
  },
  modalItem: {
    padding: spacing.m,
    paddingHorizontal: spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  modalItemText: {
    ...typography.body,
    color: palette.white,
  },
});

