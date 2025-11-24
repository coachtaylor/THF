import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity, TextInput } from 'react-native';
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
  notes: string;
}

const SURGERY_TYPE_OPTIONS: { value: SurgeryTypeOption; label: string }[] = [
  { value: 'top_surgery', label: 'Top Surgery (Chest reconstruction)' },
  { value: 'bottom_surgery', label: 'Bottom Surgery (Genital reconstruction)' },
  { value: 'ffs', label: 'Facial Feminization Surgery (FFS)' },
  { value: 'orchiectomy', label: 'Orchiectomy' },
  { value: 'other', label: 'Other surgery' },
];

export default function Surgery({ navigation }: OnboardingScreenProps<'Surgery'>) {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < 375;

  const [hasSurgeries, setHasSurgeries] = useState<SurgerySelection | null>(
    profile?.surgeries && profile.surgeries.length > 0 ? 'yes' : profile?.surgeries?.length === 0 ? 'no' : null
  );

  const [selectedTypes, setSelectedTypes] = useState<SurgeryTypeOption[]>([]);
  const [surgeryForms, setSurgeryForms] = useState<Record<SurgeryTypeOption, SurgeryFormData>>({
    top_surgery: { type: 'top_surgery', date: null, notes: '' },
    bottom_surgery: { type: 'bottom_surgery', date: null, notes: '' },
    ffs: { type: 'ffs', date: null, notes: '' },
    orchiectomy: { type: 'orchiectomy', date: null, notes: '' },
    other: { type: 'other', date: null, notes: '' },
  });

  // Initialize from profile if available
  useEffect(() => {
    if (profile?.surgeries && profile.surgeries.length > 0) {
      const types = profile.surgeries.map(s => s.type);
      setSelectedTypes(types);
      
      const forms: Record<SurgeryTypeOption, SurgeryFormData> = {
        top_surgery: { type: 'top_surgery', date: null, notes: '' },
        bottom_surgery: { type: 'bottom_surgery', date: null, notes: '' },
        ffs: { type: 'ffs', date: null, notes: '' },
        orchiectomy: { type: 'orchiectomy', date: null, notes: '' },
        other: { type: 'other', date: null, notes: '' },
      };

      profile.surgeries.forEach(surgery => {
        forms[surgery.type] = {
          type: surgery.type,
          date: surgery.date,
          notes: surgery.notes || '',
        };
      });

      setSurgeryForms(forms);
    }
  }, [profile]);

  const toggleSurgeryType = (type: SurgeryTypeOption) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
      // Clear form data for deselected type
      setSurgeryForms(prev => ({
        ...prev,
        [type]: { type, date: null, notes: '' },
      }));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const updateSurgeryDate = (type: SurgeryTypeOption, dateString: string) => {
    // Parse date string (format: YYYY-MM-DD)
    let date: Date | null = null;
    if (dateString && dateString.length >= 10) {
      // Try parsing as YYYY-MM-DD
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(parts[2], 10);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          const parsed = new Date(year, month, day);
          // Verify the date is valid
          if (parsed.getFullYear() === year && 
              parsed.getMonth() === month && 
              parsed.getDate() === day) {
            date = parsed;
          }
        }
      }
      // Fallback to standard Date parsing
      if (!date) {
        const parsed = new Date(dateString);
        if (!isNaN(parsed.getTime())) {
          date = parsed;
        }
      }
    }

    setSurgeryForms(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        date,
      },
    }));
  };

  const updateSurgeryNotes = (type: SurgeryTypeOption, notes: string) => {
    setSurgeryForms(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        notes,
      },
    }));
  };

  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const calculateWeeksPostOp = (date: Date | null): number | undefined => {
    if (!date) return undefined;
    const weeksPostOp = Math.floor(
      (new Date().getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    return Math.max(0, weeksPostOp);
  };

  const getWeeksPostOpContext = (weeks: number | undefined): string => {
    if (weeks === undefined) return '';
    if (weeks < 6) {
      return '🛑 We\'ll keep exercises very gentle and conservative';
    } else if (weeks < 12) {
      return '⚠️ We\'ll avoid exercises that stress surgical sites';
    } else {
      return '✅ Most exercises will be available';
    }
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
              notes: form.notes || undefined,
            };
          });

        await updateProfile({ surgeries });
      }

      navigation.navigate('Review');
    } catch (error) {
      console.error('Error saving surgery information:', error);
    }
  };

  const canContinue = hasSurgeries !== null && 
    (hasSurgeries === 'no' || (hasSurgeries === 'yes' && selectedTypes.length > 0 && 
      selectedTypes.every(type => surgeryForms[type].date !== null)));

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
        <Text style={[styles.headline, isSmall && styles.headlineSmall]}>Surgery History</Text>
        <Text style={[styles.subheadline, isSmall && styles.subheadlineSmall]}>
          Help us adjust your program for post-surgical recovery
        </Text>
      </View>

      <ProgressIndicator
        currentStep={4}
        totalSteps={5}
        stepLabels={['Gender Identity', 'Goals', 'HRT & Binding', 'Surgery', 'Review']}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Have you had any gender-affirming surgeries?</Text>
          </View>

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
                Yes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setHasSurgeries('no');
                setSelectedTypes([]);
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
              <Text style={styles.subsectionTitle}>Select surgery types:</Text>
              <View style={styles.checkboxContainer}>
                {SURGERY_TYPE_OPTIONS.map((option) => {
                  const isSelected = selectedTypes.includes(option.value);
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => toggleSurgeryType(option.value)}
                      activeOpacity={0.7}
                      style={styles.checkboxRow}
                    >
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={[styles.checkboxLabel, isSelected && styles.checkboxLabelSelected]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedTypes.length > 0 && (
                <>
                  {hasRecentSurgery && (
                    <View style={styles.warningBanner}>
                      <Text style={styles.warningIcon}>⚠️</Text>
                      <View style={styles.warningTextContainer}>
                        <Text style={styles.warningTitle}>Important</Text>
                        <Text style={styles.warningMessage}>
                          Always follow your surgeon's specific guidance. We'll be conservative with exercise selection, but check with your surgeon before starting any new program.
                        </Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.formsContainer}>
                    {selectedTypes.map((type) => {
                      const form = surgeryForms[type];
                      const option = SURGERY_TYPE_OPTIONS.find(o => o.value === type);
                      const weeksPostOp = calculateWeeksPostOp(form.date);
                      const contextMessage = getWeeksPostOpContext(weeksPostOp);

                      return (
                        <View key={type} style={styles.surgeryFormCard}>
                          <Text style={styles.surgeryFormTitle}>{option?.label}</Text>

                          <View style={styles.formField}>
                            <Text style={styles.formLabel}>Surgery Date *</Text>
                            <TextInput
                              style={styles.dateInput}
                              value={formatDateForInput(form.date)}
                              onChangeText={(text) => updateSurgeryDate(type, text)}
                              placeholder="YYYY-MM-DD"
                              placeholderTextColor={palette.midGray}
                              keyboardType="default"
                            />
                            {form.date && weeksPostOp !== undefined && (
                              <>
                                <Text style={styles.weeksPostOpText}>
                                  {weeksPostOp} {weeksPostOp === 1 ? 'week' : 'weeks'} post-op
                                </Text>
                                {contextMessage && (
                                  <Text style={styles.contextMessage}>
                                    {contextMessage}
                                  </Text>
                                )}
                              </>
                            )}
                          </View>

                          <View style={styles.formField}>
                            <Text style={styles.formLabel}>Notes (optional)</Text>
                            <TextInput
                              style={styles.notesInput}
                              value={form.notes}
                              onChangeText={(text) => updateSurgeryNotes(type, text)}
                              placeholder="Any additional information..."
                              placeholderTextColor={palette.midGray}
                              multiline
                              numberOfLines={3}
                              textAlignVertical="top"
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </>
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
  checkboxContainer: {
    gap: spacing.m,
    marginBottom: spacing.l,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
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
  dateInput: {
    backgroundColor: palette.darkCard,
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: 12,
    padding: spacing.m,
    ...typography.body,
    color: palette.white,
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
  },
  warningIcon: {
    fontSize: 24,
    marginRight: spacing.m,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    ...typography.h4,
    color: palette.warning,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  warningMessage: {
    ...typography.bodySmall,
    color: palette.lightGray,
    lineHeight: typography.bodySmall.fontSize * 1.5,
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
});

