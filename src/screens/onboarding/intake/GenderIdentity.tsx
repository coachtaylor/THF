import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
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
}

interface GenderIdentityProps {
  navigation: GenderIdentityNavigationProp;
  initialData?: GenderIdentityData;
}

export default function GenderIdentity({ navigation, initialData }: GenderIdentityProps) {
  const [selectedGender, setSelectedGender] = useState<GenderIdentity | null>(
    initialData?.genderIdentity || null
  );
  const [pronouns, setPronouns] = useState(initialData?.pronouns || '');
  const [isFocused, setIsFocused] = useState(false);

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
        // Save gender identity and pronouns to profile
        await updateProfile({
          gender_identity: selectedGender,
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

        {/* Optional Pronouns Input */}
        <View style={styles.pronounsSection}>
          <Text style={[textStyles.label, styles.label]}>
            Pronouns <Text style={styles.optional}>(Optional)</Text>
          </Text>
          <TextInput
            placeholder="e.g., she/her, he/him, they/them"
            placeholderTextColor={colors.text.tertiary}
            value={pronouns}
            onChangeText={setPronouns}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={[
              inputStyles.textInput,
              isFocused && inputStyles.textInputFocused,
            ]}
          />
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.base,
  },
  pronounsSection: {
    marginTop: spacing.base,
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