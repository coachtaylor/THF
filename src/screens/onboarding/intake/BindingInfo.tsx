import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import { palette, spacing, typography } from '../../../theme';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';
import PrimaryButton from '../../../components/ui/PrimaryButton';

type BindingAnswer = 'yes' | 'no';
type BindingFrequency = 'daily' | 'sometimes' | 'rarely' | 'never';
type BinderType = 'commercial' | 'sports_bra' | 'diy' | 'other';

interface BindingFrequencyOption {
  value: BindingFrequency;
  title: string;
}

const BINDING_FREQUENCY_OPTIONS: BindingFrequencyOption[] = [
  { value: 'daily', title: 'Every workout (Daily)' },
  { value: 'sometimes', title: 'Most workouts (Sometimes)' },
  { value: 'rarely', title: 'Occasionally (Rarely)' },
  { value: 'never', title: 'Testing it out (Never yet)' },
];

interface BinderTypeOption {
  value: BinderType;
  title: string;
  description?: string;
}

const BINDER_TYPE_OPTIONS: BinderTypeOption[] = [
  { value: 'commercial', title: 'Commercial binder', description: '(GC2B, Underworks, etc.)' },
  { value: 'sports_bra', title: 'Sports bra' },
  { value: 'diy', title: 'DIY / Makeshift' },
  { value: 'other', title: 'Other / Prefer not to say' },
];

export default function BindingInfo({ navigation }: OnboardingScreenProps<'BindingInfo'>) {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < 375;

  const [bindingAnswer, setBindingAnswer] = useState<BindingAnswer | null>(
    profile?.binds_chest === true ? 'yes' : profile?.binds_chest === false ? 'no' : null
  );

  const [bindingFrequency, setBindingFrequency] = useState<BindingFrequency | null>(
    (profile?.binding_frequency as BindingFrequency) || null
  );

  const [binderType, setBinderType] = useState<BinderType | null>(
    (profile?.binder_type as BinderType) || null
  );

  const [bindingHours, setBindingHours] = useState<string>(
    profile?.binding_duration_hours?.toString() || '0'
  );

  const [validationError, setValidationError] = useState<string | null>(null);

  const bindingHoursNum = parseFloat(bindingHours) || 0;
  const showWarning = bindingHoursNum > 8;

  const handleHoursChange = (value: string) => {
    const num = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num >= 0 && num <= 12) {
      setBindingHours(num.toString());
      setValidationError(null);
    } else if (value === '') {
      setBindingHours('0');
    }
  };

  const handleContinue = async () => {
    if (bindingAnswer === null) return;

    if (bindingAnswer === 'yes') {
      // Validate required fields
      if (!bindingFrequency) {
        setValidationError('Please select how often you bind during workouts');
        return;
      }

      const hours = parseFloat(bindingHours) || 0;
      if (hours < 0 || hours > 12) {
        setValidationError('Duration must be between 0 and 12 hours');
        return;
      }

      try {
        await updateProfile({
          binds_chest: true,
          binding_frequency: bindingFrequency,
          binder_type: binderType || undefined,
          binding_duration_hours: hours > 0 ? hours : undefined,
        });
        navigation.navigate('Surgery');
      } catch (error) {
        console.error('Error saving binding information:', error);
      }
    } else {
      try {
        await updateProfile({
          binds_chest: false,
          binding_frequency: undefined,
          binder_type: undefined,
          binding_duration_hours: undefined,
        });
        navigation.navigate('Surgery');
      } catch (error) {
        console.error('Error saving binding information:', error);
      }
    }
  };

  const canContinue = bindingAnswer !== null && 
    (bindingAnswer === 'no' || (bindingAnswer === 'yes' && bindingFrequency !== null && !validationError));

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
          Do you bind your chest during workouts?
        </Text>
        <Text style={[styles.subheadline, isSmall && styles.subheadlineSmall]}>
          This helps us exclude exercises that compress your chest or restrict breathing.
        </Text>
      </View>

      <ProgressIndicator
        currentStep={3}
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
                setBindingAnswer('yes');
                setValidationError(null);
              }}
              activeOpacity={0.7}
              style={[
                styles.largeButton,
                bindingAnswer === 'yes' && styles.largeButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.largeButtonText,
                  bindingAnswer === 'yes' && styles.largeButtonTextSelected,
                ]}
              >
                Yes, I bind during workouts
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setBindingAnswer('no');
                setBindingFrequency(null);
                setBinderType(null);
                setBindingHours('0');
                setValidationError(null);
              }}
              activeOpacity={0.7}
              style={[
                styles.largeButton,
                bindingAnswer === 'no' && styles.largeButtonSelected,
              ]}
            >
              <Text
                style={[
                  styles.largeButtonText,
                  bindingAnswer === 'no' && styles.largeButtonTextSelected,
                ]}
              >
                No / Not applicable
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Conditional Sections - Only show if Yes */}
        {bindingAnswer === 'yes' && (
          <>
            {/* Section A: Binding Frequency */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How often do you bind during workouts?</Text>
              <View style={styles.frequencyContainer}>
                {BINDING_FREQUENCY_OPTIONS.map((option) => {
                  const isSelected = bindingFrequency === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => {
                        setBindingFrequency(option.value);
                        setValidationError(null);
                      }}
                      activeOpacity={0.7}
                      style={[
                        styles.frequencyCard,
                        isSelected && styles.frequencyCardSelected,
                      ]}
                    >
                      {isSelected && (
                        <View style={styles.checkmarkContainer}>
                          <Text style={styles.checkmark}>✓</Text>
                        </View>
                      )}
                      <Text style={[styles.frequencyCardText, isSelected && styles.frequencyCardTextSelected]}>
                        {option.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section B: Binder Type (Optional) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What type of binder do you use? (Optional)</Text>
              <View style={styles.binderTypeContainer}>
                {BINDER_TYPE_OPTIONS.map((option) => {
                  const isSelected = binderType === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setBinderType(option.value)}
                      activeOpacity={0.7}
                      style={[
                        styles.binderTypeCard,
                        isSelected && styles.binderTypeCardSelected,
                      ]}
                    >
                      {isSelected && (
                        <View style={styles.checkmarkContainer}>
                          <Text style={styles.checkmark}>✓</Text>
                        </View>
                      )}
                      <View style={styles.binderTypeTextContainer}>
                        <Text style={[styles.binderTypeTitle, isSelected && styles.binderTypeTitleSelected]}>
                          {option.title}
                        </Text>
                        {option.description && (
                          <Text style={[styles.binderTypeDescription, isSelected && styles.binderTypeDescriptionSelected]}>
                            {option.description}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section C: Binding Duration */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How long do you typically wear a binder per session?</Text>
              <View style={styles.sliderContainer}>
                <View style={styles.sliderInputContainer}>
                  <TextInput
                    style={styles.sliderInput}
                    value={bindingHours}
                    onChangeText={handleHoursChange}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={palette.midGray}
                  />
                  <Text style={styles.hoursLabel}>hours</Text>
                  <View style={styles.sliderButtons}>
                    <TouchableOpacity
                      onPress={() => {
                        const newValue = Math.max(0, bindingHoursNum - 0.5);
                        setBindingHours(newValue.toFixed(1));
                        setValidationError(null);
                      }}
                      style={styles.sliderButton}
                    >
                      <Text style={styles.sliderButtonText}>−</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        const newValue = Math.min(12, bindingHoursNum + 0.5);
                        setBindingHours(newValue.toFixed(1));
                        setValidationError(null);
                      }}
                      style={styles.sliderButton}
                    >
                      <Text style={styles.sliderButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.sliderValueText}>
                  {bindingHoursNum.toFixed(1)} {bindingHoursNum === 1 ? 'hour' : 'hours'}
                </Text>
              </View>

              {showWarning && (
                <View style={styles.warningBanner}>
                  <Text style={styles.warningIcon}>⚠️</Text>
                  <Text style={styles.warningText}>
                    Medical guidance recommends limiting binding to 8 hours/day. We'll add extra breathing breaks to your workouts.
                  </Text>
                </View>
              )}
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
        {!canContinue && bindingAnswer === 'yes' && (
          <Text style={styles.hintText}>
            Please select how often you bind during workouts
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
  frequencyContainer: {
    gap: spacing.m,
  },
  frequencyCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 16,
    padding: spacing.l,
    borderWidth: 2,
    borderColor: palette.border,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  frequencyCardSelected: {
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
  frequencyCardText: {
    ...typography.h3,
    color: palette.white,
    flex: 1,
  },
  frequencyCardTextSelected: {
    color: palette.tealPrimary,
  },
  binderTypeContainer: {
    gap: spacing.m,
  },
  binderTypeCard: {
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
  binderTypeCardSelected: {
    borderWidth: 3,
    borderColor: palette.tealPrimary,
    backgroundColor: palette.darkerCard,
  },
  binderTypeTextContainer: {
    flex: 1,
  },
  binderTypeTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
    color: palette.white,
  },
  binderTypeTitleSelected: {
    color: palette.tealPrimary,
  },
  binderTypeDescription: {
    ...typography.body,
    color: palette.midGray,
    lineHeight: 20,
  },
  binderTypeDescriptionSelected: {
    color: palette.lightGray,
  },
  sliderContainer: {
    gap: spacing.m,
  },
  sliderInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  sliderInput: {
    backgroundColor: palette.darkCard,
    borderWidth: 2,
    borderColor: palette.border,
    borderRadius: 12,
    padding: spacing.m,
    minWidth: 100,
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
    borderWidth: 2,
    borderColor: palette.border,
    borderRadius: 8,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderButtonText: {
    ...typography.h2,
    color: palette.tealPrimary,
  },
  sliderValueText: {
    ...typography.body,
    color: palette.tealPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 184, 77, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: palette.warning,
    borderRadius: 12,
    padding: spacing.m,
    marginTop: spacing.m,
    alignItems: 'flex-start',
    gap: spacing.s,
  },
  warningIcon: {
    fontSize: 20,
    flexShrink: 0,
  },
  warningText: {
    ...typography.bodySmall,
    color: palette.warning,
    flex: 1,
    lineHeight: 18,
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
});

