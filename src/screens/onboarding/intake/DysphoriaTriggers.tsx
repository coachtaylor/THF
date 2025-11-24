import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import { palette, spacing, typography } from '../../../theme';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';
import PrimaryButton from '../../../components/ui/PrimaryButton';
import type { DysphoriaTrigger } from '../../../types';

interface TriggerOption {
  value: DysphoriaTrigger;
  label: string;
}

const TRIGGER_OPTIONS: TriggerOption[] = [
  { value: 'looking_at_chest', label: 'Looking at chest in mirror' },
  { value: 'tight_clothing', label: 'Tight or form-fitting clothing' },
  { value: 'mirrors', label: 'Mirrors / reflective surfaces' },
  { value: 'body_contact', label: 'Body contact (spotting, partner exercises)' },
  { value: 'crowded_spaces', label: 'Crowded workout spaces' },
  { value: 'locker_rooms', label: 'Locker rooms / changing areas' },
  { value: 'voice', label: 'Voice (grunting, heavy breathing)' },
  { value: 'other', label: 'Other (please specify)' },
];

const MAX_NOTES_LENGTH = 500;

export default function DysphoriaTriggers({ navigation }: OnboardingScreenProps<'DysphoriaTriggers'>) {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < 375;

  const [selectedTriggers, setSelectedTriggers] = useState<DysphoriaTrigger[]>(
    profile?.dysphoria_triggers || []
  );

  const [otherTriggerText, setOtherTriggerText] = useState<string>(
    profile?.dysphoria_notes?.includes('Other:') 
      ? profile.dysphoria_notes.split('Other:')[1]?.trim() || ''
      : ''
  );

  const [notesText, setNotesText] = useState<string>(
    profile?.dysphoria_notes && !profile.dysphoria_notes.includes('Other:')
      ? profile.dysphoria_notes
      : ''
  );

  const toggleTrigger = (trigger: DysphoriaTrigger) => {
    if (selectedTriggers.includes(trigger)) {
      setSelectedTriggers(selectedTriggers.filter(t => t !== trigger));
      // Clear other text if "other" is deselected
      if (trigger === 'other') {
        setOtherTriggerText('');
      }
    } else {
      setSelectedTriggers([...selectedTriggers, trigger]);
    }
  };

  const handleOtherTextChange = (text: string) => {
    const trimmed = text.slice(0, 500);
    setOtherTriggerText(trimmed);
  };

  const handleNotesChange = (text: string) => {
    const trimmed = text.slice(0, MAX_NOTES_LENGTH);
    setNotesText(trimmed);
  };

  const handleContinue = async () => {
    try {
      // Combine other trigger text with notes if both exist
      let finalNotes = notesText;
      if (selectedTriggers.includes('other') && otherTriggerText.trim()) {
        const otherNote = `Other: ${otherTriggerText.trim()}`;
        finalNotes = notesText.trim() 
          ? `${notesText.trim()}\n\n${otherNote}`
          : otherNote;
      }

      await updateProfile({
        dysphoria_triggers: selectedTriggers.length > 0 ? selectedTriggers : undefined,
        dysphoria_notes: finalNotes.trim() || undefined,
      });
      navigation.navigate('Review');
    } catch (error) {
      console.error('Error saving dysphoria information:', error);
    }
  };

  const handleSkip = async () => {
    // Save empty state (or don't save at all - both are fine since it's optional)
    try {
      await updateProfile({
        dysphoria_triggers: undefined,
        dysphoria_notes: undefined,
      });
      navigation.navigate('Review');
    } catch (error) {
      // Even if save fails, navigate to Review
      navigation.navigate('Review');
    }
  };

  const showOtherInput = selectedTriggers.includes('other');

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
          Dysphoria Triggers (Optional)
        </Text>
        <Text style={[styles.subheadline, isSmall && styles.subheadlineSmall]}>
          Help us create a more comfortable workout experience by avoiding triggers when possible.
        </Text>
      </View>

      <ProgressIndicator
        currentStep={7}
        totalSteps={8}
        stepLabels={['Gender Identity', 'HRT Status', 'Binding Info', 'Surgery History', 'Goals', 'Experience', 'Dysphoria', 'Review']}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Text */}
        <View style={styles.introSection}>
          <Text style={styles.introText}>
            This information is entirely optional and private. You can skip this step or fill it out partially. It helps us:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>• Suggest clothing modifications</Text>
            <Text style={styles.bulletPoint}>• Offer alternative exercises</Text>
            <Text style={styles.bulletPoint}>• Provide mental health resources</Text>
          </View>
        </View>

        {/* Trigger Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Do any of these trigger dysphoria for you? (Optional)
          </Text>
          <View style={styles.triggerGrid}>
            {TRIGGER_OPTIONS.map((option) => {
              const isSelected = selectedTriggers.includes(option.value);
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => toggleTrigger(option.value)}
                  activeOpacity={0.7}
                  style={[
                    styles.triggerCard,
                    isSelected && styles.triggerCardSelected,
                  ]}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text
                    style={[
                      styles.triggerCardText,
                      isSelected && styles.triggerCardTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Other Trigger Input */}
          {showOtherInput && (
            <View style={styles.otherInputContainer}>
              <Text style={styles.otherInputLabel}>Please describe: (Optional)</Text>
              <TextInput
                style={styles.otherInput}
                value={otherTriggerText}
                onChangeText={handleOtherTextChange}
                placeholder="Describe your trigger..."
                placeholderTextColor={palette.midGray}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.characterCount}>
                {otherTriggerText.length}/500
              </Text>
            </View>
          )}
        </View>

        {/* Additional Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Anything else we should know? (Optional)</Text>
          <View style={styles.notesContainer}>
            <TextInput
              style={styles.notesInput}
              value={notesText}
              onChangeText={handleNotesChange}
              placeholder="E.g., specific exercises that make you uncomfortable, preferred workout times, accommodations that help..."
              placeholderTextColor={palette.midGray}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={MAX_NOTES_LENGTH}
            />
            <View style={styles.notesFooter}>
              <Text style={styles.characterCount}>
                {notesText.length}/{MAX_NOTES_LENGTH}
              </Text>
            </View>
          </View>
        </View>

        {/* Privacy Reassurance */}
        <View style={styles.privacySection}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <Text style={styles.privacyText}>
            This information is private and encrypted. You can update or delete it anytime in Settings.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.ctaContainer}>
        <PrimaryButton
          onPress={handleContinue}
          label="Continue"
          disabled={false}
        />
        <TouchableOpacity
          onPress={handleSkip}
          activeOpacity={0.7}
          style={styles.skipButton}
        >
          <Text style={styles.skipButtonText}>Skip This Step →</Text>
        </TouchableOpacity>
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
    color: palette.white,
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
  introSection: {
    marginBottom: spacing.xl,
    padding: spacing.m,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: palette.midGray,
  },
  introText: {
    ...typography.body,
    color: palette.lightGray,
    marginBottom: spacing.m,
    lineHeight: 22,
  },
  bulletList: {
    gap: spacing.xs,
  },
  bulletPoint: {
    ...typography.body,
    color: palette.lightGray,
    lineHeight: 22,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: palette.white,
    marginBottom: spacing.m,
    fontWeight: '500',
  },
  triggerGrid: {
    gap: spacing.s,
  },
  triggerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    borderWidth: 1.5,
    borderColor: palette.border,
    minHeight: 56,
  },
  triggerCardSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: 'rgba(0, 204, 204, 0.1)',
    borderWidth: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: palette.border,
    backgroundColor: palette.darkerCard,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealPrimary,
  },
  checkmark: {
    color: palette.deepBlack,
    fontSize: 12,
    fontWeight: '700',
  },
  triggerCardText: {
    ...typography.body,
    color: palette.lightGray,
    flex: 1,
  },
  triggerCardTextSelected: {
    color: palette.white,
  },
  otherInputContainer: {
    marginTop: spacing.m,
    padding: spacing.m,
    backgroundColor: palette.darkerCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  otherInputLabel: {
    ...typography.bodySmall,
    color: palette.midGray,
    marginBottom: spacing.xs,
  },
  otherInput: {
    ...typography.body,
    color: palette.white,
    backgroundColor: palette.darkCard,
    borderRadius: 8,
    padding: spacing.m,
    minHeight: 60,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: spacing.xs,
  },
  notesContainer: {
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: palette.border,
    padding: spacing.m,
  },
  notesInput: {
    ...typography.body,
    color: palette.white,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  notesFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  characterCount: {
    ...typography.caption,
    color: palette.midGray,
  },
  privacySection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s,
    padding: spacing.m,
    backgroundColor: 'rgba(128, 128, 128, 0.08)',
    borderRadius: 12,
    marginTop: spacing.l,
    marginBottom: spacing.m,
  },
  privacyIcon: {
    fontSize: 20,
    flexShrink: 0,
  },
  privacyText: {
    ...typography.bodySmall,
    color: palette.midGray,
    flex: 1,
    lineHeight: 18,
  },
  ctaContainer: {
    marginTop: spacing.s,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.m,
    marginTop: spacing.s,
  },
  skipButtonText: {
    ...typography.body,
    color: palette.midGray,
    textDecorationLine: 'underline',
  },
});

