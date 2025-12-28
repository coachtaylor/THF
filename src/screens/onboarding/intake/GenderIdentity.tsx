import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Keyboard } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../../../types/onboarding';
import OnboardingLayout from '../../../components/onboarding/OnboardingLayout';
import SelectionCard from '../../../components/onboarding/SelectionCard';
import { colors, spacing, borderRadius } from '../../../theme';
import { inputStyles, textStyles } from '../../../theme/components';
import { updateProfile } from '../../../services/storage/profile';

type GenderIdentity = 'mtf' | 'ftm' | 'nonbinary' | 'questioning';
type GenderIdentityNavigationProp = StackNavigationProp<OnboardingStackParamList, 'GenderIdentity'>;

interface GenderIdentityData {
  genderIdentity: GenderIdentity | null;
  pronouns: string;
  chosenName: string;
}

interface GenderIdentityProps {
  navigation: GenderIdentityNavigationProp;
  initialData?: GenderIdentityData;
}

export default function GenderIdentity({ navigation, initialData }: GenderIdentityProps) {
  const [selectedGender, setSelectedGender] = useState<GenderIdentity | null>(
    initialData?.genderIdentity || null
  );
  const [chosenName, setChosenName] = useState(initialData?.chosenName || '');
  const [pronouns, setPronouns] = useState(initialData?.pronouns || '');
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isPronounsFocused, setIsPronounsFocused] = useState(false);

  const genderOptions = [
    {
      id: 'mtf' as GenderIdentity,
      icon: 'heart' as const,
      title: 'Trans Woman',
      description: 'Assigned male at birth, identify as woman/feminine',
    },
    {
      id: 'ftm' as GenderIdentity,
      icon: 'person' as const,
      title: 'Trans Man',
      description: 'Assigned female at birth, identify as man/masculine',
    },
    {
      id: 'nonbinary' as GenderIdentity,
      icon: 'sparkles' as const,
      title: 'Non-Binary',
      description: 'Gender identity outside the binary spectrum',
    },
    {
      id: 'questioning' as GenderIdentity,
      icon: 'help-circle' as const,
      title: 'Questioning',
      description: 'Still exploring my gender identity',
    },
  ];

  const handleContinue = async () => {
    if (selectedGender) {
      try {
        // Save gender identity, chosen name, and pronouns to profile
        await updateProfile({
          gender_identity: selectedGender,
          chosen_name: chosenName || undefined,
          pronouns: pronouns || undefined,
        });

        navigation.navigate('HRTStatus', {
          genderIdentity: selectedGender
        });
      } catch (error) {
        console.error('Error saving gender identity:', error);
        // Still navigate even if save fails
        navigation.navigate('HRTStatus', {
          genderIdentity: selectedGender
        });
      }
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={8}
      title="Your Gender Identity"
      subtitle="Help us personalize your fitness journey. This information is private and stays on your device."
      onBack={handleBack}
      onContinue={handleContinue}
      canContinue={selectedGender !== null}
    >
      <View style={styles.container}>
        {/* Gender Selection Cards */}
        {genderOptions.map((option) => (
          <SelectionCard
            key={option.id}
            icon={option.icon}
            title={option.title}
            description={option.description}
            selected={selectedGender === option.id}
            onClick={() => setSelectedGender(option.id)}
          />
        ))}

        {/* Personal Info Section */}
        <View style={styles.personalInfoSection}>
          {/* Chosen Name Input */}
          <View style={styles.inputGroup}>
            <Text style={[textStyles.label, styles.label]}>
              What should we call you? <Text style={styles.optional}>(Optional)</Text>
            </Text>
            <TextInput
              placeholder="Your chosen name"
              placeholderTextColor={colors.text.tertiary}
              value={chosenName}
              onChangeText={setChosenName}
              onFocus={() => setIsNameFocused(true)}
              onBlur={() => setIsNameFocused(false)}
              style={[
                inputStyles.textInput,
                isNameFocused && inputStyles.textInputFocused,
              ]}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
          </View>

          {/* Pronouns Input */}
          <View style={styles.inputGroup}>
            <Text style={[textStyles.label, styles.label]}>
              Pronouns <Text style={styles.optional}>(Optional)</Text>
            </Text>
            <TextInput
              placeholder="e.g., she/her, he/him, they/them"
              placeholderTextColor={colors.text.tertiary}
              value={pronouns}
              onChangeText={setPronouns}
              onFocus={() => setIsPronounsFocused(true)}
              onBlur={() => setIsPronounsFocused(false)}
              style={[
                inputStyles.textInput,
                isPronounsFocused && inputStyles.textInputFocused,
              ]}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
          </View>
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.base,
  },
  personalInfoSection: {
    marginTop: spacing.base,
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.md,
  },
  label: {
    marginBottom: 0,
  },
  optional: {
    color: colors.text.tertiary,
    fontWeight: '400',
  },
});