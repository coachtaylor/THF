import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';

const GENDER_OPTIONS = [
  { value: 'mtf', title: 'Trans woman', description: 'Assigned male at birth' },
  { value: 'ftm', title: 'Trans man', description: 'Assigned female at birth' },
  { value: 'nonbinary', title: 'Non-binary', description: 'Outside the gender binary' },
  { value: 'questioning', title: 'Questioning / Exploring', description: 'Still figuring things out' },
] as const;

const PRONOUN_OPTIONS = ['he/him', 'she/her', 'they/them', 'other'] as const;

type GenderIdentityOption = (typeof GENDER_OPTIONS)[number]['value'];
type PronounOption = (typeof PRONOUN_OPTIONS)[number];

export default function GenderIdentity({ navigation }: OnboardingScreenProps<'GenderIdentity'>) {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();

  const parsePronouns = (pronounsString?: string): PronounOption[] => {
    if (!pronounsString) return [];
    return pronounsString
      .split('/')
      .map(part => part.trim())
      .filter(part => PRONOUN_OPTIONS.includes(part as PronounOption)) as PronounOption[];
  };

  const presetPronouns = parsePronouns(profile?.pronouns);
  const useCustomPronouns = !!profile?.pronouns && presetPronouns.length === 0;

  const [selectedGender, setSelectedGender] = useState<GenderIdentityOption | null>(
    (profile?.gender_identity as GenderIdentityOption) || null
  );
  const [selectedPronouns, setSelectedPronouns] = useState<PronounOption[]>(presetPronouns);
  const [customPronouns, setCustomPronouns] = useState<string>(useCustomPronouns ? profile?.pronouns ?? '' : '');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(useCustomPronouns);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

  const handleGenderPress = (option: GenderIdentityOption) => {
    setSelectedGender(option);
  };

  const handlePronounPress = (pronoun: PronounOption) => {
    if (pronoun === 'other') {
      setShowCustomInput(true);
      return;
    }

    setSelectedPronouns((prev) =>
      prev.includes(pronoun) ? prev.filter(p => p !== pronoun) : [...prev, pronoun]
    );
  };

  const handleContinue = async () => {
    if (!selectedGender) return;

    try {
      let pronounsString: string | undefined;
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
            <ProgressIndicator currentStep={1} totalSteps={8} />
          </View>
          <Text style={styles.headline}>How do you identify?</Text>
          <Text style={styles.subheadline}>This helps us personalize your training</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardsContainer}>
            {GENDER_OPTIONS.map((option, index) => {
              const isSelected = selectedGender === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.genderCard,
                    isSelected && styles.genderCardSelected,
                    index === GENDER_OPTIONS.length - 1 && styles.lastCard,
                  ]}
                  onPress={() => handleGenderPress(option.value)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                  <View style={styles.cardTextContainer}>
                    <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                      {option.title}
                    </Text>
                    <Text style={[styles.cardDescription, isSelected && styles.cardDescriptionSelected]}>
                      {option.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedGender && (
            <>
              <View style={styles.pronounsContainer}>
                <Text style={styles.sectionLabel}>Pronouns (Optional)</Text>
                <View style={styles.pillsContainer}>
                  {PRONOUN_OPTIONS.map((pronoun) => {
                    const isSelected = selectedPronouns.includes(pronoun);
                    const isOther = pronoun === 'other';
                    const isOtherActive = isOther && showCustomInput;
                    const pillSelected = isSelected || isOtherActive;

                    return (
                      <TouchableOpacity
                        key={pronoun}
                        style={[styles.pill, pillSelected && styles.pillSelected]}
                        onPress={() => handlePronounPress(pronoun)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.pillText, pillSelected && styles.pillTextSelected]}>
                          {pronoun}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {showCustomInput && (
                <View style={styles.customInputContainer}>
                  <Text style={styles.inputLabel}>Custom Pronouns</Text>
                  <TextInput
                    style={[styles.textInput, isInputFocused && styles.textInputFocused]}
                    value={customPronouns}
                    onChangeText={setCustomPronouns}
                    placeholder="e.g., xe/xem, fae/faer"
                    placeholderTextColor="#6B7280"
                    autoCapitalize="none"
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                  />
                </View>
              )}
            </>
          )}
        </ScrollView>

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
            Pronouns are optional and help us personalize your experience
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
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'left',
  },
  subheadline: {
    fontSize: 16,
    fontWeight: '400',
    color: '#9CA3AF',
    lineHeight: 24,
    textAlign: 'left',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  cardsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  genderCard: {
    backgroundColor: '#1A1F26',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2A2F36',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
  },
  genderCardSelected: {
    borderColor: '#00D9C0',
    backgroundColor: 'rgba(0, 217, 192, 0.08)',
  },
  lastCard: {
    marginBottom: 0,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2A2F36',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#00D9C0',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00D9C0',
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 2,
    textAlign: 'left',
  },
  cardTitleSelected: {
    color: '#00D9C0',
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    lineHeight: 20,
    textAlign: 'left',
  },
  cardDescriptionSelected: {
    color: '#B8C5C5',
  },
  pronounsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
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
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: -8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
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
  customInputContainer: {
    marginTop: 16,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    textAlign: 'left',
  },
  textInput: {
    backgroundColor: '#1A1F26',
    borderWidth: 2,
    borderColor: '#2A2F36',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 22,
    minHeight: 48,
    textAlign: 'left',
  },
  textInputFocused: {
    borderColor: '#00D9C0',
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
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
  },
  buttonShadow: {
    shadowColor: '#00D9C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F1419',
    textAlign: 'left',
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
