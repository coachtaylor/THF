import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import { palette, spacing, typography } from '../../../theme';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';
import PrimaryButton from '../../../components/ui/PrimaryButton';

type HRTSelection = 'yes' | 'no';
type HRTType = 'estrogen_blockers' | 'testosterone' | 'none';
type BindingSelection = 'yes' | 'no';
type BindingFrequency = 'daily' | 'sometimes' | 'rarely' | 'never';
type BinderType = 'commercial' | 'sports_bra' | 'ace_bandage' | 'diy' | 'none';

const HRT_TYPE_OPTIONS: { value: HRTType; label: string }[] = [
  { value: 'estrogen_blockers', label: 'Estrogen / Anti-Androgens' },
  { value: 'testosterone', label: 'Testosterone' },
  { value: 'none', label: 'Other / Prefer not to say' },
];

const BINDING_FREQUENCY_OPTIONS: { value: BindingFrequency; label: string }[] = [
  { value: 'daily', label: 'Every workout (Daily)' },
  { value: 'sometimes', label: 'Most workouts (Sometimes)' },
  { value: 'rarely', label: 'Rarely' },
  { value: 'never', label: 'Never / Just checking' },
];

const BINDER_TYPE_OPTIONS: { value: BinderType; label: string }[] = [
  { value: 'commercial', label: 'Commercial binder (GC2B, Underworks, etc.)' },
  { value: 'sports_bra', label: 'Sports bra' },
  { value: 'ace_bandage', label: 'Ace bandage' },
  { value: 'diy', label: 'DIY/Makeshift' },
  { value: 'none', label: 'Prefer not to say' },
];

export default function HRTAndBinding({ navigation }: OnboardingScreenProps<'HRTAndBinding'>) {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < 375;

  // HRT state
  const [hrtSelected, setHrtSelected] = useState<HRTSelection | null>(
    profile?.on_hrt ? 'yes' : profile?.on_hrt === false ? 'no' : null
  );
  const [hrtType, setHrtType] = useState<HRTType | null>(
    (profile?.hrt_type as HRTType) || null
  );
  const [hrtMonths, setHrtMonths] = useState<string>(
    profile?.hrt_months_duration?.toString() || '0'
  );

  // Binding state
  const [bindsSelected, setBindsSelected] = useState<BindingSelection | null>(
    profile?.binds_chest ? 'yes' : profile?.binds_chest === false ? 'no' : null
  );
  const [bindingFrequency, setBindingFrequency] = useState<BindingFrequency | null>(
    (profile?.binding_frequency as BindingFrequency) || null
  );
  const [bindingHours, setBindingHours] = useState<string>(
    profile?.binding_duration_hours?.toString() || '0'
  );
  const [binderType, setBinderType] = useState<BinderType | null>(
    (profile?.binder_type as BinderType) || null
  );

  // Adjust HRT type options based on gender identity
  const getHRTTypeOptions = () => {
    if (profile?.gender_identity === 'mtf') {
      return HRT_TYPE_OPTIONS.filter(opt => opt.value !== 'testosterone');
    } else if (profile?.gender_identity === 'ftm') {
      return HRT_TYPE_OPTIONS.filter(opt => opt.value !== 'estrogen_blockers');
    }
    return HRT_TYPE_OPTIONS;
  };

  const formatMonths = (months: number): string => {
    if (months === 0) return '0 months';
    if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'}`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) {
      return `${years} ${years === 1 ? 'year' : 'years'}`;
    }
    return `${years} ${years === 1 ? 'year' : 'years'}, ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
  };

  const handleContinue = async () => {
    try {
      const updates: any = {
        on_hrt: hrtSelected === 'yes',
        binds_chest: bindsSelected === 'yes',
      };

      if (hrtSelected === 'yes') {
        updates.hrt_type = hrtType || 'none';
        const months = parseInt(hrtMonths, 10) || 0;
        if (months > 0) {
          updates.hrt_months_duration = months;
        }
      } else {
        updates.hrt_type = 'none';
        updates.hrt_months_duration = undefined;
      }

      if (bindsSelected === 'yes') {
        updates.binding_frequency = bindingFrequency || 'sometimes';
        const hours = parseFloat(bindingHours) || 0;
        if (hours > 0) {
          updates.binding_duration_hours = hours;
        }
        if (binderType && binderType !== 'none') {
          updates.binder_type = binderType;
        }
      } else {
        updates.binding_frequency = undefined;
        updates.binding_duration_hours = undefined;
        updates.binder_type = undefined;
      }

      await updateProfile(updates);
      navigation.navigate('Surgery');
    } catch (error) {
      console.error('Error saving HRT and binding information:', error);
    }
  };

  const canContinue = hrtSelected !== null && bindsSelected !== null;

  const hrtMonthsNum = parseInt(hrtMonths, 10) || 0;
  const bindingHoursNum = parseFloat(bindingHours) || 0;
  const showBindingWarning = bindingHoursNum > 8;

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
        <Text style={[styles.headline, isSmall && styles.headlineSmall]}>HRT & Binding</Text>
        <Text style={[styles.subheadline, isSmall && styles.subheadlineSmall]}>
          Help us adjust your programming for safety and effectiveness
        </Text>
      </View>

      <ProgressIndicator
        currentStep={3}
        totalSteps={5}
        stepLabels={['Gender Identity', 'Goals', 'HRT & Binding', 'Surgery', 'Review']}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HRT Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>HRT Information</Text>
            <Text style={styles.sectionDescription}>
              Are you currently on hormone replacement therapy?
            </Text>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              onPress={() => setHrtSelected('yes')}
              activeOpacity={0.7}
              style={[
                styles.largeButton,
                hrtSelected === 'yes' && styles.largeButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.largeButtonText,
                  hrtSelected === 'yes' && styles.largeButtonTextSelected,
                ]}
              >
                Yes, I'm on HRT
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setHrtSelected('no');
                setHrtType(null);
                setHrtMonths('0');
              }}
              activeOpacity={0.7}
              style={[
                styles.largeButton,
                hrtSelected === 'no' && styles.largeButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.largeButtonText,
                  hrtSelected === 'no' && styles.largeButtonTextSelected,
                ]}
              >
                No / Not applicable
              </Text>
            </TouchableOpacity>
          </View>

          {hrtSelected === 'yes' && (
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>What type of HRT?</Text>
              <View style={styles.optionsContainer}>
                {getHRTTypeOptions().map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setHrtType(option.value)}
                    activeOpacity={0.7}
                    style={[
                      styles.optionCard,
                      hrtType === option.value && styles.optionCardSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        hrtType === option.value && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.subsectionTitle}>How long have you been on HRT?</Text>
              <View style={styles.sliderContainer}>
                <View style={styles.sliderInputContainer}>
                  <TextInput
                    style={styles.numberInput}
                    value={hrtMonths}
                    onChangeText={(text) => {
                      const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                      if (!isNaN(num) && num >= 0 && num <= 120) {
                        setHrtMonths(num.toString());
                      } else if (text === '') {
                        setHrtMonths('0');
                      }
                    }}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={palette.midGray}
                  />
                  <View style={styles.sliderButtons}>
                    <TouchableOpacity
                      onPress={() => {
                        const num = Math.max(0, parseInt(hrtMonths, 10) - 1);
                        setHrtMonths(num.toString());
                      }}
                      style={styles.sliderButton}
                    >
                      <Text style={styles.sliderButtonText}>−</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        const num = Math.min(120, parseInt(hrtMonths, 10) + 1);
                        setHrtMonths(num.toString());
                      }}
                      style={styles.sliderButton}
                    >
                      <Text style={styles.sliderButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.sliderLabel}>{formatMonths(hrtMonthsNum)}</Text>
                <Text style={styles.sliderInfo}>
                  We use this to adjust recovery time and volume
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Binding Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Binding Information</Text>
            <Text style={styles.sectionDescription}>
              Do you bind your chest during workouts?
            </Text>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              onPress={() => setBindsSelected('yes')}
              activeOpacity={0.7}
              style={[
                styles.largeButton,
                bindsSelected === 'yes' && styles.largeButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.largeButtonText,
                  bindsSelected === 'yes' && styles.largeButtonTextSelected,
                ]}
              >
                Yes, I bind
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setBindsSelected('no');
                setBindingFrequency(null);
                setBindingHours('0');
                setBinderType(null);
              }}
              activeOpacity={0.7}
              style={[
                styles.largeButton,
                bindsSelected === 'no' && styles.largeButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.largeButtonText,
                  bindsSelected === 'no' && styles.largeButtonTextSelected,
                ]}
              >
                No / Not applicable
              </Text>
            </TouchableOpacity>
          </View>

          {bindsSelected === 'yes' && (
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>How often do you bind during workouts?</Text>
              <View style={styles.optionsContainer}>
                {BINDING_FREQUENCY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setBindingFrequency(option.value)}
                    activeOpacity={0.7}
                    style={[
                      styles.optionCard,
                      bindingFrequency === option.value && styles.optionCardSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        bindingFrequency === option.value && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.subsectionTitle}>How long do you typically wear a binder?</Text>
              <View style={styles.sliderContainer}>
                <View style={styles.sliderInputContainer}>
                  <TextInput
                    style={styles.numberInput}
                    value={bindingHours}
                    onChangeText={(text) => {
                      const num = parseFloat(text.replace(/[^0-9.]/g, ''));
                      if (!isNaN(num) && num >= 0 && num <= 12) {
                        setBindingHours(num.toString());
                      } else if (text === '') {
                        setBindingHours('0');
                      }
                    }}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={palette.midGray}
                  />
                  <Text style={styles.hoursLabel}>hours</Text>
                  <View style={styles.sliderButtons}>
                    <TouchableOpacity
                      onPress={() => {
                        const num = Math.max(0, parseFloat(bindingHours) - 0.5);
                        setBindingHours(num.toFixed(1));
                      }}
                      style={styles.sliderButton}
                    >
                      <Text style={styles.sliderButtonText}>−</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        const num = Math.min(12, parseFloat(bindingHours) + 0.5);
                        setBindingHours(num.toFixed(1));
                      }}
                      style={styles.sliderButton}
                    >
                      <Text style={styles.sliderButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {showBindingWarning && (
                  <View style={styles.warningContainer}>
                    <Text style={styles.warningText}>
                      ⚠️ Medical guidance recommends limiting binding to 8 hours/day
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.subsectionTitle}>What type of binder? (optional)</Text>
              <View style={styles.optionsContainer}>
                {BINDER_TYPE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setBinderType(option.value)}
                    activeOpacity={0.7}
                    style={[
                      styles.optionCard,
                      binderType === option.value && styles.optionCardSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        binderType === option.value && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.privacyNote}>
          <Text style={styles.privacyText}>
            This information is private and only used to keep you safe during workouts.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.ctaContainer}>
        <PrimaryButton
          onPress={handleContinue}
          label="Continue"
          disabled={!canContinue}
        />
        {!canContinue && (
          <Text style={styles.hintText}>Please answer both questions to continue</Text>
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
    marginBottom: spacing.xxs,
    color: palette.white,
    letterSpacing: -0.5,
  },
  sectionDescription: {
    ...typography.body,
    color: palette.midGray,
    lineHeight: 22,
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
  optionsContainer: {
    gap: spacing.s,
    marginBottom: spacing.l,
  },
  optionCard: {
    backgroundColor: palette.darkerCard,
    borderRadius: 12,
    padding: spacing.m,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  optionCardSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealGlow,
  },
  optionText: {
    ...typography.body,
    color: palette.lightGray,
  },
  optionTextSelected: {
    color: palette.tealPrimary,
    fontWeight: '600',
  },
  sliderContainer: {
    marginBottom: spacing.l,
  },
  sliderInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: spacing.s,
  },
  numberInput: {
    backgroundColor: palette.darkerCard,
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: 12,
    padding: spacing.m,
    minWidth: 80,
    ...typography.h3,
    color: palette.white,
    textAlign: 'center',
  },
  hoursLabel: {
    ...typography.body,
    color: palette.midGray,
    marginRight: spacing.s,
  },
  sliderButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  sliderButton: {
    backgroundColor: palette.darkCard,
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderButtonText: {
    ...typography.h2,
    color: palette.tealPrimary,
  },
  sliderLabel: {
    ...typography.body,
    color: palette.tealPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  sliderInfo: {
    ...typography.caption,
    color: palette.midGray,
    lineHeight: 16,
  },
  warningContainer: {
    backgroundColor: 'rgba(255, 184, 77, 0.15)',
    borderWidth: 1,
    borderColor: palette.warning,
    borderRadius: 12,
    padding: spacing.m,
    marginTop: spacing.s,
  },
  warningText: {
    ...typography.bodySmall,
    color: palette.warning,
    lineHeight: 18,
  },
  privacyNote: {
    marginTop: spacing.m,
    padding: spacing.m,
    backgroundColor: palette.darkerCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  privacyText: {
    ...typography.caption,
    color: palette.midGray,
    textAlign: 'center',
    lineHeight: 16,
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

