import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Polygon } from 'react-native-svg';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';

type BindingAnswer = 'yes' | 'no' | null;
type BindingFrequency = 'daily' | 'sometimes' | 'rarely' | 'never' | null;
type BinderType = 'commercial' | 'sports_bra' | 'diy' | 'other' | null;

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Every workout' },
  { value: 'sometimes', label: 'Most workouts' },
  { value: 'rarely', label: 'Occasionally' },
  { value: 'never', label: 'Testing it out' },
] as const;

const BINDER_TYPE_OPTIONS = [
  {
    value: 'commercial',
    title: 'Commercial binder',
    description: 'GC2B, Underworks, Spectrum, etc.',
  },
  {
    value: 'sports_bra',
    title: 'Sports bra',
    description: 'Compression sports bra',
  },
  {
    value: 'diy',
    title: 'DIY / Makeshift',
    description: 'Homemade or improvised',
  },
  {
    value: 'other',
    title: 'Other',
    description: 'Prefer not to say',
  },
] as const;

// Warning Icon Component (SVG - NO EMOJI)
const WarningIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Polygon
      points="12,4 20,19 4,19"
      fill="none"
      stroke="#FFB84D"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <Path
      d="M12 10 L12 14 M12 16.5 L12 17"
      stroke="#FFB84D"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

export default function BindingInfo({ navigation }: OnboardingScreenProps<'BindingInfo'>) {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();

  const [bindingAnswer, setBindingAnswer] = useState<BindingAnswer>(
    profile?.binds_chest === true ? 'yes' : profile?.binds_chest === false ? 'no' : null
  );
  const [bindingFrequency, setBindingFrequency] = useState<BindingFrequency>(
    (profile?.binding_frequency as BindingFrequency) || null
  );
  const [binderType, setBinderType] = useState<BinderType>(
    (profile?.binder_type as BinderType) || null
  );
  const [duration, setDuration] = useState<number>(
    profile?.binding_duration_hours || 0
  );

  const handleContinue = async () => {
    if (bindingAnswer === null) return;

    try {
      if (bindingAnswer === 'yes') {
        await updateProfile({
          binds_chest: true,
          binding_frequency: bindingFrequency || undefined,
          binder_type: binderType || undefined,
          binding_duration_hours: duration > 0 ? duration : undefined,
        });
      } else {
        await updateProfile({
          binds_chest: false,
          binding_frequency: undefined,
          binder_type: undefined,
          binding_duration_hours: undefined,
        });
      }

      navigation.navigate('Surgery');
    } catch (error) {
      console.error('Error saving binding information:', error);
    }
  };

  const canContinue =
    bindingAnswer !== null &&
    (bindingAnswer === 'no' || bindingFrequency !== null);

  const decrementDuration = () => {
    setDuration((prev) => Math.max(0, prev - 0.5));
  };

  const incrementDuration = () => {
    setDuration((prev) => Math.min(12, prev + 0.5));
  };

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
            <ProgressIndicator currentStep={3} totalSteps={8} />
          </View>
          <Text style={styles.headline}>
            Do you bind your chest during workouts?
          </Text>
          <Text style={styles.subheadline}>
            This helps us exclude exercises that compress your chest
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
                  bindingAnswer === 'yes' && styles.segmentActive,
                ]}
                onPress={() => {
                  setBindingAnswer('yes');
                  if (bindingAnswer === 'no') {
                    setBindingFrequency(null);
                    setBinderType(null);
                    setDuration(0);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.segmentText,
                    bindingAnswer === 'yes' && styles.segmentTextActive,
                  ]}
                >
                  Yes, I bind
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segment,
                  bindingAnswer === 'no' && styles.segmentActive,
                ]}
                onPress={() => {
                  setBindingAnswer('no');
                  setBindingFrequency(null);
                  setBinderType(null);
                  setDuration(0);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.segmentText,
                    bindingAnswer === 'no' && styles.segmentTextActive,
                  ]}
                >
                  No / N/A
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Conditional: Frequency Pills (Required) */}
          {bindingAnswer === 'yes' && (
            <View style={styles.sectionContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.sectionLabel}>How often?</Text>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredBadgeText}>REQUIRED</Text>
                </View>
              </View>
              <Text style={styles.sectionDescription}>
                Select frequency of binding during workouts
              </Text>
              <View style={styles.pillsContainer}>
                {FREQUENCY_OPTIONS.map((option) => {
                  const isSelected = bindingFrequency === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.pill, isSelected && styles.pillSelected]}
                      onPress={() => setBindingFrequency(option.value)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.pillText, isSelected && styles.pillTextSelected]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Conditional: Binder Type (Optional) */}
          {bindingAnswer === 'yes' && (
            <View style={styles.sectionContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.sectionLabel}>Binder type</Text>
                <View style={styles.optionalBadge}>
                  <Text style={styles.optionalBadgeText}>OPTIONAL</Text>
                </View>
              </View>
              {BINDER_TYPE_OPTIONS.map((option, index) => {
                const isSelected = binderType === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.binderTypeCard,
                      isSelected && styles.binderTypeCardSelected,
                      index === BINDER_TYPE_OPTIONS.length - 1 && styles.lastCard,
                    ]}
                    onPress={() => setBinderType(option.value)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                    <View style={styles.cardTextContainer}>
                      <Text
                        style={[
                          styles.cardTitle,
                          isSelected && styles.cardTitleSelected,
                        ]}
                      >
                        {option.title}
                      </Text>
                      <Text
                        style={[
                          styles.cardDescription,
                          isSelected && styles.cardDescriptionSelected,
                        ]}
                      >
                        {option.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Conditional: Duration Stepper (Optional) */}
          {bindingAnswer === 'yes' && (
            <View style={styles.sectionContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.sectionLabel}>Duration per session</Text>
                <View style={styles.optionalBadge}>
                  <Text style={styles.optionalBadgeText}>OPTIONAL</Text>
                </View>
              </View>
              <View style={styles.stepperContainer}>
                <View style={styles.stepperLeft}>
                  <Text style={styles.stepperLabel}>Hours bound</Text>
                  <Text style={styles.stepperValue}>
                    {duration.toFixed(1)} hours
                  </Text>
                </View>
                <View style={styles.stepperButtons}>
                  <TouchableOpacity
                    style={[
                      styles.stepperButton,
                      duration === 0 && styles.stepperButtonDisabled,
                    ]}
                    onPress={decrementDuration}
                    disabled={duration === 0}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stepperButtonIcon}>−</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.stepperButton,
                      duration === 12 && styles.stepperButtonDisabled,
                    ]}
                    onPress={incrementDuration}
                    disabled={duration === 12}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stepperButtonIcon}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Conditional: Warning Badge */}
          {bindingAnswer === 'yes' && duration > 8 && (
            <View style={styles.warningContainer}>
              <View style={styles.warningBadge}>
                <View style={styles.warningIconContainer}>
                  <WarningIcon />
                </View>
                <View style={styles.warningTextContainer}>
                  <Text style={styles.warningTitle}>
                    Binding Safety Reminder
                  </Text>
                  <Text style={styles.warningDescription}>
                    Medical guidance recommends limiting binding to 8 hours per
                    day. We'll add breathing breaks to your workouts for safety.
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
            Optional fields help us personalize your training
          </Text>
        </View>
      </View>
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'left',
  },
  sectionDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
    textAlign: 'left',
  },
  requiredBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  requiredBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF6B6B',
    textTransform: 'uppercase',
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
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: -8,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: '#1A1F26',
    borderWidth: 2,
    borderColor: '#2A2F36',
    marginLeft: 8,
    marginBottom: 8,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillSelected: {
    backgroundColor: '#00D9C0',
    borderColor: '#00D9C0',
  },
  pillText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#E0E4E8',
    textAlign: 'left',
  },
  pillTextSelected: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F1419',
    textAlign: 'left',
  },
  binderTypeCard: {
    backgroundColor: '#1A1F26',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#2A2F36',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
  },
  binderTypeCardSelected: {
    borderColor: '#00D9C0',
    backgroundColor: 'rgba(0, 217, 192, 0.08)',
  },
  lastCard: {
    marginBottom: 0,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2A2F36',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#00D9C0',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00D9C0',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
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
    lineHeight: 16,
    textAlign: 'left',
  },
  cardDescriptionSelected: {
    color: '#B8C5C5',
  },
  stepperContainer: {
    backgroundColor: '#1A1F26',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#2A2F36',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 64,
  },
  stepperLeft: {
    flex: 1,
  },
  stepperLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 4,
    textAlign: 'left',
  },
  stepperValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'left',
  },
  stepperButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2F36',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3A4555',
  },
  stepperButtonDisabled: {
    opacity: 0.3,
  },
  stepperButtonIcon: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  warningContainer: {
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 24,
  },
  warningBadge: {
    backgroundColor: 'rgba(255, 184, 77, 0.12)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FFB84D',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningIconContainer: {
    width: 24,
    height: 24,
    marginRight: 12,
    flexShrink: 0,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFB84D',
    marginBottom: 4,
    textAlign: 'left',
  },
  warningDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#B8C5C5',
    lineHeight: 19,
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
});
