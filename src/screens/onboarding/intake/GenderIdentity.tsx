import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import { palette, spacing, typography } from '../../../theme';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';
import PrimaryButton from '../../../components/ui/PrimaryButton';

type GenderIdentityOption = 'mtf' | 'ftm' | 'nonbinary' | 'questioning';

interface GenderOption {
  value: GenderIdentityOption;
  title: string;
  description: string;
  icon: string;
  accentColor: string;
}

const GENDER_OPTIONS: GenderOption[] = [
  {
    value: 'mtf',
    title: 'Trans Woman / Transfeminine',
    description: "We'll emphasize lower body development (glutes, hips, legs)",
    icon: '♀',
    accentColor: palette.tealPrimary,
  },
  {
    value: 'ftm',
    title: 'Trans Man / Transmasculine',
    description: "We'll emphasize upper body development (shoulders, back, chest)",
    icon: '♂',
    accentColor: palette.tealPrimary,
  },
  {
    value: 'nonbinary',
    title: 'Nonbinary / Gender Diverse',
    description: "We'll create balanced, flexible programming",
    icon: '⚧',
    accentColor: palette.tealPrimary,
  },
  {
    value: 'questioning',
    title: 'Questioning / Prefer not to say',
    description: "We'll focus on general fitness without gender-specific emphasis",
    icon: '○',
    accentColor: palette.midGray,
  },
];

export default function GenderIdentity({ navigation }: OnboardingScreenProps<'GenderIdentity'>) {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < 375;

  const [selectedOption, setSelectedOption] = useState<GenderIdentityOption | null>(
    (profile?.gender_identity as GenderIdentityOption) || null
  );

  const handleOptionPress = (option: GenderIdentityOption) => {
    setSelectedOption(option);
  };

  const handleContinue = async () => {
    if (!selectedOption) return;

    try {
      await updateProfile({
        gender_identity: selectedOption,
      });
      navigation.navigate('Goals');
    } catch (error) {
      console.error('Error saving gender identity:', error);
    }
  };

  const canContinue = selectedOption !== null;

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
        <Text style={[styles.headline, isSmall && styles.headlineSmall]}>Your Gender Identity</Text>
        <Text style={[styles.subheadline, isSmall && styles.subheadlineSmall]}>
          This helps us personalize your workout programming
        </Text>
      </View>

      <ProgressIndicator
        currentStep={1}
        totalSteps={5}
        stepLabels={['Gender Identity', 'Goals', 'HRT & Binding', 'Surgery', 'Review']}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.optionsContainer}>
          {GENDER_OPTIONS.map((option) => {
            const isSelected = selectedOption === option.value;
            const isTealAccent = option.accentColor === palette.tealPrimary;

            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleOptionPress(option.value)}
                activeOpacity={0.7}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                  isSelected && isTealAccent && styles.optionCardSelectedTeal,
                ]}
              >
                <View style={styles.optionContent}>
                  <View
                    style={[
                      styles.iconContainer,
                      isSelected && isTealAccent && styles.iconContainerSelected,
                    ]}
                  >
                    <Text style={[styles.icon, isSelected && isTealAccent && styles.iconSelected]}>
                      {option.icon}
                    </Text>
                  </View>
                  <View style={styles.textContainer}>
                    <Text
                      style={[
                        styles.optionTitle,
                        isSelected && isTealAccent && styles.optionTitleSelected,
                      ]}
                    >
                      {option.title}
                    </Text>
                    <Text
                      style={[
                        styles.optionDescription,
                        isSelected && isTealAccent && styles.optionDescriptionSelected,
                      ]}
                    >
                      {option.description}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.privacyNote}>
          <Text style={styles.privacyText}>
            Your gender identity is private and never shared. It only affects workout programming.
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
          <Text style={styles.hintText}>Please select an option to continue</Text>
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
  optionsContainer: {
    gap: spacing.m,
    marginBottom: spacing.l,
  },
  optionCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 16,
    padding: spacing.l,
    borderWidth: 2,
    borderColor: palette.border,
    minHeight: 120,
  },
  optionCardSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.darkerCard,
  },
  optionCardSelectedTeal: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealGlow,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.m,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.darkerCard,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconContainerSelected: {
    backgroundColor: palette.tealPrimary,
    borderColor: palette.tealPrimary,
  },
  icon: {
    fontSize: 24,
    color: palette.midGray,
  },
  iconSelected: {
    color: palette.deepBlack,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  optionTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
    color: palette.white,
  },
  optionTitleSelected: {
    color: palette.tealPrimary,
  },
  optionDescription: {
    ...typography.body,
    color: palette.midGray,
    lineHeight: 20,
  },
  optionDescriptionSelected: {
    color: palette.lightGray,
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

