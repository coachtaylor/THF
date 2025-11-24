import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import { palette, spacing, typography } from '../../../theme';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';
import PrimaryButton from '../../../components/ui/PrimaryButton';

type GenderIdentityOption = 'mtf' | 'ftm' | 'nonbinary' | 'questioning';
type PronounOption = 'he/him' | 'she/her' | 'they/them' | 'other';

interface GenderOption {
  value: GenderIdentityOption;
  title: string;
  description: string;
}

const GENDER_OPTIONS: GenderOption[] = [
  {
    value: 'mtf',
    title: 'Trans woman (MTF)',
    description: 'Assigned male at birth, woman-identified',
  },
  {
    value: 'ftm',
    title: 'Trans man (FTM)',
    description: 'Assigned female at birth, man-identified',
  },
  {
    value: 'nonbinary',
    title: 'Non-binary',
    description: 'Gender identity outside the binary',
  },
  {
    value: 'questioning',
    title: 'Questioning',
    description: 'Still exploring gender identity',
  },
];

const PRONOUN_OPTIONS: PronounOption[] = ['he/him', 'she/her', 'they/them', 'other'];

export default function GenderIdentity({ navigation }: OnboardingScreenProps<'GenderIdentity'>) {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < 375;

  // Parse existing pronouns from profile
  const parsePronouns = (pronounsString?: string): PronounOption[] => {
    if (!pronounsString) return [];
    const parts = pronounsString.split('/').map(p => p.trim());
    return parts.filter(p => PRONOUN_OPTIONS.includes(p as PronounOption)) as PronounOption[];
  };

  const [selectedGender, setSelectedGender] = useState<GenderIdentityOption | null>(
    (profile?.gender_identity as GenderIdentityOption) || null
  );

  const [selectedPronouns, setSelectedPronouns] = useState<PronounOption[]>(
    profile?.pronouns ? parsePronouns(profile.pronouns) : []
  );

  const [customPronouns, setCustomPronouns] = useState<string>(
    profile?.pronouns && !PRONOUN_OPTIONS.some(p => profile.pronouns?.includes(p))
      ? profile.pronouns
      : ''
  );

  const [showCustomInput, setShowCustomInput] = useState<boolean>(
    profile?.pronouns ? !PRONOUN_OPTIONS.some(p => profile.pronouns?.includes(p)) : false
  );

  const handleGenderPress = (option: GenderIdentityOption) => {
    setSelectedGender(option);
  };

  const handlePronounPress = (pronoun: PronounOption) => {
    if (pronoun === 'other') {
      setShowCustomInput(true);
      // Don't add 'other' to selectedPronouns, just show input
      return;
    }

    if (selectedPronouns.includes(pronoun)) {
      setSelectedPronouns(selectedPronouns.filter(p => p !== pronoun));
    } else {
      setSelectedPronouns([...selectedPronouns, pronoun]);
    }
  };

  const handleContinue = async () => {
    if (!selectedGender) return;

    try {
      // Build pronouns string
      let pronounsString: string | undefined = undefined;
      if (selectedPronouns.length > 0) {
        pronounsString = selectedPronouns.join('/');
      } else if (showCustomInput && customPronouns.trim()) {
        pronounsString = customPronouns.trim();
      }

      await updateProfile({
        gender_identity: selectedGender,
        pronouns: pronounsString,
      });
      navigation.navigate('HRTStatus');
    } catch (error) {
      console.error('Error saving gender identity:', error);
    }
  };

  const canContinue = selectedGender !== null;

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
        <Text style={[styles.headline, isSmall && styles.headlineSmall]}>How do you identify?</Text>
        <Text style={[styles.subheadline, isSmall && styles.subheadlineSmall]}>
          This helps us personalize your training program for your body composition goals.
        </Text>
      </View>

      <ProgressIndicator
        currentStep={1}
        totalSteps={8}
        stepLabels={['Gender Identity', 'HRT Status', 'Binding Info', 'Surgery History', 'Goals', 'Experience', 'Dysphoria', 'Review']}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Gender Identity Section */}
        <View style={styles.section}>
          <View style={styles.optionsContainer}>
            {GENDER_OPTIONS.map((option) => {
              const isSelected = selectedGender === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => handleGenderPress(option.value)}
                  activeOpacity={0.7}
                  style={[
                    styles.genderCard,
                    isSelected && styles.genderCardSelected,
                  ]}
                >
                  <View style={styles.genderCardContent}>
                    <View style={styles.genderCardLeft}>
                      {isSelected && (
                        <View style={styles.checkmarkContainer}>
                          <Text style={styles.checkmark}>✓</Text>
                        </View>
                      )}
                      <View style={styles.genderTextContainer}>
                        <Text style={[styles.genderTitle, isSelected && styles.genderTitleSelected]}>
                          {option.title}
                        </Text>
                        <Text style={[styles.genderDescription, isSelected && styles.genderDescriptionSelected]}>
                          {option.description}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Pronouns Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What are your pronouns? (Optional)</Text>
          <View style={styles.pronounChipsContainer}>
            {PRONOUN_OPTIONS.map((pronoun) => {
              const isSelected = selectedPronouns.includes(pronoun);
              const isOther = pronoun === 'other';

              return (
                <TouchableOpacity
                  key={pronoun}
                  onPress={() => handlePronounPress(pronoun)}
                  activeOpacity={0.7}
                  style={[
                    styles.pronounChip,
                    isSelected && styles.pronounChipSelected,
                    isOther && showCustomInput && styles.pronounChipSelected,
                  ]}
                >
                  <Text style={[styles.pronounChipText, isSelected && styles.pronounChipTextSelected]}>
                    {pronoun}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {showCustomInput && (
            <View style={styles.customPronounsContainer}>
              <Text style={styles.customPronounsLabel}>Custom pronouns:</Text>
              <TextInput
                style={styles.customPronounsInput}
                value={customPronouns}
                onChangeText={setCustomPronouns}
                placeholder="e.g., xe/xem, ze/zir"
                placeholderTextColor={palette.midGray}
                autoCapitalize="none"
              />
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
        {!canContinue && (
          <Text style={styles.hintText}>Please select a gender identity to continue</Text>
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
    marginBottom: spacing.l,
  },
  sectionTitle: {
    ...typography.h3,
    color: palette.white,
    marginBottom: spacing.m,
  },
  optionsContainer: {
    gap: spacing.m,
  },
  genderCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 16,
    padding: spacing.l,
    borderWidth: 2,
    borderColor: palette.border,
    minHeight: 80,
  },
  genderCardSelected: {
    borderWidth: 3,
    borderColor: palette.tealPrimary,
    backgroundColor: palette.darkerCard,
  },
  genderCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  genderCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.m,
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
  genderTextContainer: {
    flex: 1,
  },
  genderTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
    color: palette.white,
  },
  genderTitleSelected: {
    color: palette.tealPrimary,
  },
  genderDescription: {
    ...typography.body,
    color: palette.midGray,
    lineHeight: 20,
  },
  genderDescriptionSelected: {
    color: palette.lightGray,
  },
  divider: {
    height: 1,
    backgroundColor: palette.border,
    marginVertical: spacing.xl,
  },
  pronounChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  pronounChip: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: 20,
    backgroundColor: palette.darkCard,
    borderWidth: 2,
    borderColor: palette.border,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pronounChipSelected: {
    backgroundColor: palette.tealPrimary,
    borderColor: palette.tealPrimary,
  },
  pronounChipText: {
    ...typography.body,
    color: palette.lightGray,
    fontWeight: '500',
  },
  pronounChipTextSelected: {
    color: palette.deepBlack,
    fontWeight: '600',
  },
  customPronounsContainer: {
    marginTop: spacing.m,
  },
  customPronounsLabel: {
    ...typography.bodySmall,
    color: palette.midGray,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  customPronounsInput: {
    backgroundColor: palette.darkCard,
    borderWidth: 2,
    borderColor: palette.border,
    borderRadius: 12,
    padding: spacing.m,
    ...typography.body,
    color: palette.white,
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
