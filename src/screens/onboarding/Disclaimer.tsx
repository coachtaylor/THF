import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../../types/onboarding';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/theme';
import {
  glassStyles,
  buttonStyles,
  inputStyles,
  textStyles,
  layoutStyles,
} from '../../theme/components';

type DisclaimerNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Disclaimer'>;

interface DisclaimerProps {
  navigation: DisclaimerNavigationProp;
}

interface DisclaimerItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  content: string;
  color: string;
}

export default function Disclaimer({ navigation }: DisclaimerProps) {
  const [hasAgreed, setHasAgreed] = useState(false);

  const disclaimers: DisclaimerItem[] = [
    {
      icon: 'warning-outline',
      title: 'Not Medical Advice',
      content: 'TransFitness provides fitness guidance only. This app is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers, especially regarding HRT, surgery recovery, and binding safety.',
      color: colors.semantic.warning,
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Safety Considerations',
      content: 'While we provide binding-aware and post-surgical protocols, every body is different. Listen to your body, respect your limits, and seek medical attention if you experience pain, discomfort, or complications during exercise.',
      color: colors.cyan[500],
    },
    {
      icon: 'lock-closed-outline',
      title: 'Privacy & Data',
      content: 'Your personal information is stored locally on your device. We do not collect, store, or share personally identifiable information (PII). TransFitness is designed for fitness tracking, not for managing sensitive medical data.',
      color: colors.cyan[500],
    },
    {
      icon: 'document-text-outline',
      title: 'User Responsibility',
      content: 'You are responsible for the accuracy of information you provide and for using this app safely. If you have any medical conditions, injuries, or concerns, please consult healthcare professionals before starting any exercise program.',
      color: colors.cyan[500],
    },
  ];

  const handleContinue = () => {
    if (hasAgreed) {
      navigation.navigate('GenderIdentity');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={layoutStyles.screen}>
      <View style={layoutStyles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={buttonStyles.icon}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>

          <Text style={textStyles.h1}>Important Information</Text>
          <Text style={textStyles.body}>
            Please read and acknowledge these important disclaimers before continuing.
          </Text>
        </View>

        {/* Scrollable Disclaimers */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {disclaimers.map((item, index) => (
            <View key={index} style={glassStyles.card}>
              <View style={styles.cardContent}>
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={item.color}
                  style={styles.icon}
                />
                <View style={styles.textContainer}>
                  <Text style={textStyles.h3}>{item.title}</Text>
                  <Text style={textStyles.bodySmall}>{item.content}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Agreement Checkbox */}
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            onPress={() => setHasAgreed(!hasAgreed)}
            style={styles.checkboxRow}
            activeOpacity={0.7}
          >
            <View style={[
              inputStyles.checkbox,
              hasAgreed && inputStyles.checkboxChecked
            ]}>
              {hasAgreed && (
                <Ionicons name="checkmark" size={18} color={colors.text.primary} />
              )}
            </View>
            <Text style={textStyles.bodySmall}>
              I understand and acknowledge that TransFitness is for fitness guidance only and is not a substitute for professional medical advice. I will consult healthcare providers regarding medical decisions.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!hasAgreed}
          style={[
            buttonStyles.primary,
            !hasAgreed && buttonStyles.primaryDisabled
          ]}
          activeOpacity={0.8}
        >
          <Text style={buttonStyles.primaryText}>I Understand, Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ONLY screen-specific layout styles
const styles = StyleSheet.create({
  header: {
    marginBottom: spacing['3xl'],
    gap: spacing.md,
  },
  scrollView: {
    flex: 1,
    marginBottom: spacing.xl,
  },
  scrollContent: {
    gap: spacing.base,
  },
  cardContent: {
    flexDirection: 'row',
    gap: spacing.base,
    padding: spacing.xl,
  },
  icon: {
    marginTop: 2, // Align with text baseline
  },
  textContainer: {
    flex: 1,
    gap: spacing.sm,
  },
  checkboxContainer: {
    marginBottom: spacing.xl,
  },
  checkboxRow: {
    flexDirection: 'row',
    gap: spacing.base,
    alignItems: 'flex-start',
  },
});