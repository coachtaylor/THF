import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import type { OnboardingScreenProps } from '../../types/onboarding';
import ModernCheckbox from '../../components/onboarding/ModernCheckbox';
import {
  MedicalProfessionalIcon,
  EducationIcon,
  FitnessFocusIcon,
  StopSignalIcon,
} from '../../components/icons/DisclaimerIcons';
import { useProfile } from '../../hooks/useProfile';
import { palette, spacing, typography } from '../../theme/theme';

// Shield with checkmark icon for header badge
const ShieldCheckIcon = () => (
  <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
    {/* Shield shape */}
    <Path
      d="M16 4 L6 8 v8 c0 6 3 10 8 12 5-2 8-6 8-12 V8 Z"
      stroke="#00D9C0"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    {/* Checkmark */}
    <Path
      d="M10 16 L14 20 L22 12"
      stroke="#00D9C0"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function Disclaimer({ navigation }: OnboardingScreenProps<'Disclaimer'>) {
  const { updateProfile } = useProfile();
  const [checked, setChecked] = useState(false);
  const insets = useSafeAreaInsets();

  const handleContinue = async () => {
    if (!checked) return;

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const nowIso = new Date().toISOString();
    try {
      await updateProfile({ disclaimer_acknowledged_at: nowIso });
    } catch (error) {
      console.error('Error saving disclaimer acknowledgment:', error);
    }
    navigation.navigate('GenderIdentity');
  };

  const handleQuickStart = async () => {
    if (!checked) return;

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const nowIso = new Date().toISOString();
    try {
      await updateProfile({ disclaimer_acknowledged_at: nowIso });
    } catch (error) {
      console.error('Error saving disclaimer acknowledgment:', error);
    }
    navigation.navigate('QuickStart');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* HEADER - Fixed at top */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 8) }]}>
        <View style={styles.iconBadge}>
          <ShieldCheckIcon />
        </View>
        <Text style={styles.headline}>Your Safety Matters</Text>
        <Text style={styles.subheadline}>
          What you should know before you start training
        </Text>
      </View>

      {/* CONTENT - Scrollable */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: Medical Professional */}
        <View style={styles.infoCard}>
          <View style={styles.iconContainer}>
            <MedicalProfessionalIcon size={32} color="#00D9C0" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>Consult Your Healthcare Provider</Text>
            <Text style={styles.cardBody}>
              TransFitness provides fitness education, not medical advice. Always consult a qualified healthcare provider for personalized guidance, especially regarding HRT, surgery recovery, or health conditions.
            </Text>
          </View>
        </View>

        {/* Card 2: Educational Content */}
        <View style={styles.infoCard}>
          <View style={styles.iconContainer}>
            <EducationIcon size={32} color="#00D9C0" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>Evidence-Based Education</Text>
            <Text style={styles.cardBody}>
              Our programming is informed by peer-reviewed research and trans-inclusive fitness principles. We provide educational resources, not treatment plans.
            </Text>
          </View>
        </View>

        {/* Card 3: Fitness Focus */}
        <View style={styles.infoCard}>
          <View style={styles.iconContainer}>
            <FitnessFocusIcon size={32} color="#00D9C0" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>Fitness Training, Not Medical Treatment</Text>
            <Text style={styles.cardBody}>
              TransFitness helps you build strength and mobility. It cannot diagnose, treat, or manage medical conditions. Use it as a fitness tool, not a medical intervention.
            </Text>
          </View>
        </View>

        {/* Card 4: Listen to Your Body */}
        <View style={styles.infoCard}>
          <View style={styles.iconContainer}>
            <StopSignalIcon size={32} color="#FFB84D" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>Stop If Something Feels Wrong</Text>
            <Text style={styles.cardBody}>
              If you experience pain, dizziness, shortness of breath, or any concerning symptoms, stop immediately and seek medical care. Your safety always comes first.
            </Text>
          </View>
        </View>

        {/* AGREEMENT SECTION */}
        <View style={styles.agreementContainer}>
          <ModernCheckbox
            checked={checked}
            onPress={() => setChecked(!checked)}
            label="I understand these guidelines and agree to use TransFitness responsibly"
          />
        </View>

        {/* TRUST REINFORCEMENT */}
        <View style={styles.trustContainer}>
          <Text style={styles.trustText}>
            By continuing, you acknowledge this is a fitness education tool designed to empower your training journey.
          </Text>
        </View>
      </ScrollView>

      {/* FOOTER - Fixed at bottom */}
      <View style={[styles.footerContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {/* Primary CTA */}
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!checked}
          style={[styles.primaryButton, !checked && styles.disabledButton]}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ disabled: !checked }}
          accessibilityHint="Continue to profile setup after acknowledging the disclaimer"
        >
          <LinearGradient
            colors={checked ? ['#00D9C0', '#00B39D'] : ['#2A2F36', '#1A1F26']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={[styles.primaryButtonText, !checked && styles.disabledButtonText]}>
              Continue to Profile Setup
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Secondary option */}
        <TouchableOpacity
          onPress={handleQuickStart}
          disabled={!checked}
          style={styles.secondaryButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ disabled: !checked }}
          accessibilityHint="Skip profile setup and start a quick workout"
        >
          <Text style={[styles.secondaryButtonText, !checked && styles.disabledSecondaryText]}>
            Quick Start Workout
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  headerContainer: {
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.l,
    alignItems: 'center',
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 217, 192, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.m,
    borderWidth: 2,
    borderColor: 'rgba(0, 217, 192, 0.3)',
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subheadline: {
    fontSize: 16,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  infoCard: {
    backgroundColor: '#1A1F26',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: spacing.l,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: '#2A2F36',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 217, 192, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginRight: spacing.m,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 22,
    textAlign: 'left',
  },
  cardBody: {
    fontSize: 14,
    fontWeight: '400',
    color: '#B8C5C5',
    lineHeight: 21,
    textAlign: 'left',
  },
  agreementContainer: {
    marginHorizontal: spacing.l,
    marginTop: spacing.xl,
    marginBottom: spacing.m,
  },
  trustContainer: {
    marginHorizontal: spacing.l,
    marginBottom: spacing.xl,
    padding: spacing.m,
    backgroundColor: 'rgba(91, 159, 255, 0.1)',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#5B9FFF',
  },
  trustText: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 20,
    fontStyle: 'italic',
    textAlign: 'left',
  },
  footerContainer: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: '#2A2F36',
    backgroundColor: '#0F1419',
  },
  primaryButton: {
    height: 56,
    borderRadius: 28,
    marginBottom: spacing.s,
    overflow: 'hidden',
    shadowColor: '#00D9C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F1419',
  },
  disabledButtonText: {
    color: '#6B7280',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingBottom: 0,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  disabledSecondaryText: {
    opacity: 0.4,
  },
});
