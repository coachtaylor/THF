import React from 'react';
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
  textStyles,
  layoutStyles,
} from '../../theme/components';

type WhyTransFitnessNavigationProp = StackNavigationProp<OnboardingStackParamList, 'WhyTransFitness'>;

interface WhyTransFitnessProps {
  navigation: WhyTransFitnessNavigationProp;
}

interface Feature {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

export default function WhyTransFitness({ navigation }: WhyTransFitnessProps) {
  const features: Feature[] = [
    {
      icon: 'shield-checkmark',
      title: 'Safety First',
      description: 'Binding-aware exercises and post-surgical recovery protocols designed specifically for trans athletes',
    },
    {
      icon: 'heart',
      title: 'Gender-Affirming',
      description: 'Personalized programs that respect your goals, whether feminization, masculinization, or general fitness',
    },
    {
      icon: 'barbell',
      title: 'HRT-Aware',
      description: 'Programming that adapts to hormone therapy effects on strength, recovery, and training capacity',
    },
    {
      icon: 'sparkles',
      title: 'Dysphoria-Sensitive',
      description: 'Exercise selection that respects your comfort zones and helps you feel confident in your body',
    },
  ];

  const handleContinue = () => {
    navigation.navigate('Disclaimer');
  };

  return (
    <SafeAreaView style={layoutStyles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Logo Badge */}
          <View style={[glassStyles.card, styles.logoBadge]}>
            <Ionicons name="barbell" size={32} color={colors.cyan[500]} />
            <Text style={[textStyles.display2, styles.logoText]}>
              TransFitness
            </Text>
          </View>

          {/* Hero Title */}
          <View style={styles.titleContainer}>
            <Text style={textStyles.display2}>
              Fitness That{' '}
            </Text>
            <Text style={[textStyles.display2, styles.highlightText]}>
              Understands You
            </Text>
          </View>

          {/* Subtitle */}
          <Text style={[textStyles.body, styles.subtitle]}>
            The only fitness app designed specifically for transgender and non-binary athletes. Safe, effective, and affirming.
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={glassStyles.card}>
              <View style={styles.featureContent}>
                <View style={[glassStyles.circle, styles.iconCircle]}>
                  <Ionicons 
                    name={feature.icon} 
                    size={24} 
                    color={colors.cyan[500]} 
                  />
                </View>
                <View style={styles.featureText}>
                  <Text style={textStyles.h3}>{feature.title}</Text>
                  <Text style={textStyles.bodySmall}>{feature.description}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* CTA Button */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            onPress={handleContinue}
            style={buttonStyles.primary}
            activeOpacity={0.8}
          >
            <Text style={buttonStyles.primaryText}>Get Started</Text>
          </TouchableOpacity>

          {/* Privacy Note */}
          <Text style={[textStyles.caption, styles.privacyNote]}>
            Your data stays private and secure on your device
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Only screen-specific layout styles
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing['4xl'],
    alignItems: 'center',
  },
  heroSection: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  logoText: {
    color: colors.cyan[500],
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  highlightText: {
    color: colors.cyan[500],
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: spacing['4xl'],
  },
  featuresContainer: {
    width: '100%',
    maxWidth: 480,
    gap: spacing.base,
    marginBottom: spacing['4xl'],
  },
  featureContent: {
    flexDirection: 'row',
    gap: spacing.base,
    padding: spacing.xl,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    gap: spacing.sm,
  },
  ctaContainer: {
    width: '100%',
    maxWidth: 480,
    gap: spacing.base,
  },
  privacyNote: {
    textAlign: 'center',
    color: colors.text.tertiary,
  },
});