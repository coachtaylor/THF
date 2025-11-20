import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import type { OnboardingScreenProps } from '../../types/onboarding';
import { useProfile } from '../../hooks/useProfile';
import { palette, spacing, typography } from '../../theme';

const DISCLAIMER_POINTS = [
  {
    icon: '⚠️',
    text: 'This is not medical advice. Consult a qualified healthcare provider for personalized guidance.',
  },
  {
    icon: '📚',
    text: 'TransFitness provides educational content designed with trans-inclusive considerations.',
  },
  {
    icon: '🚫',
    text: 'It cannot replace professional medical advice, diagnosis, or treatment.',
  },
  {
    icon: '🛑',
    text: 'If you experience pain, dizziness, or shortness of breath, stop immediately and seek medical care.',
  },
];

export default function Disclaimer({ navigation }: OnboardingScreenProps<'Disclaimer'>) {
  const { updateProfile } = useProfile();
  const [checked, setChecked] = useState(false);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;

  const handleContinue = async () => {
    const nowIso = new Date().toISOString();
    try {
      await updateProfile({ disclaimer_acknowledged_at: nowIso });
    } catch {
      // no-op for now; storage added in US-2.2
    }
    navigation.navigate('Goals');
  };

  const handleQuickStart = () => {
    if (!checked) return; // Block navigation if user hasn't agreed
    navigation.navigate('QuickStart');
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Math.max(insets.top, spacing.l), paddingBottom: Math.max(insets.bottom + spacing.s, spacing.l) },
      ]}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.iconEmoji}>⚕️</Text>
        </View>
        <Text style={[styles.headline, isSmallScreen && styles.headlineSmall]}>
          Important Safety Information
        </Text>
        <Text style={styles.subheadline}>
          Please read and acknowledge before continuing
        </Text>
      </View>

      {/* Content Card */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustContentInsets={false}
      >
        <View style={styles.contentCard}>
          {DISCLAIMER_POINTS.map((point, index) => (
            <View key={index} style={[styles.pointRow, index !== DISCLAIMER_POINTS.length - 1 && styles.pointRowSpacing]}>
              <View style={styles.pointIconContainer}>
                <Text style={styles.pointIcon}>{point.icon}</Text>
              </View>
              <Text style={[styles.pointText, isSmallScreen && styles.pointTextSmall]}>
                {point.text}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Agreement Section */}
      <View style={styles.agreementSection}>
        <TouchableOpacity
          onPress={() => setChecked((v) => !v)}
          activeOpacity={0.7}
          style={styles.checkboxRow}
        >
          <View style={[styles.checkboxContainer, checked && styles.checkboxContainerChecked]}>
            {checked && (
              <View style={styles.checkboxMarkContainer}>
                <Text style={styles.checkboxMark}>✓</Text>
              </View>
            )}
          </View>
          <Text style={[styles.checkboxLabel, isSmallScreen && styles.checkboxLabelSmall]}>
            I understand and agree to these terms
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleContinue}
          disabled={!checked}
          style={[styles.primaryButton, !checked && styles.primaryButtonDisabled]}
          contentStyle={styles.primaryButtonContent}
          labelStyle={styles.primaryButtonLabel}
        >
          Continue to Setup
        </Button>

        <Button
          mode="text"
          onPress={handleQuickStart}
          disabled={!checked}
          labelStyle={[styles.secondaryButtonLabel, !checked && styles.secondaryButtonLabelDisabled]}
          style={styles.secondaryButton}
        >
          Quick Start
        </Button>
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
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: palette.tealGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.m,
    borderWidth: 2,
    borderColor: palette.tealPrimary,
  },
  iconEmoji: {
    fontSize: 32,
  },
  headline: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.xs,
    color: palette.white,
  },
  headlineSmall: {
    fontSize: 24,
  },
  subheadline: {
    ...typography.body,
    textAlign: 'center',
    color: palette.midGray,
    fontSize: 14,
  },
  scroll: {
    flex: 1,
    marginBottom: spacing.m,
  },
  scrollContent: {
    paddingBottom: spacing.s,
  },
  contentCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.l,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pointRowSpacing: {
    marginBottom: spacing.m,
  },
  pointIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.darkerCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
    borderWidth: 1,
    borderColor: palette.border,
  },
  pointIcon: {
    fontSize: 20,
  },
  pointText: {
    flex: 1,
    ...typography.bodyLarge,
    lineHeight: typography.bodyLarge.fontSize * 1.6,
    color: palette.lightGray,
  },
  pointTextSmall: {
    fontSize: 15,
    lineHeight: 15 * 1.6,
  },
  agreementSection: {
    marginBottom: spacing.m,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  checkboxContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: palette.deepBlack,
    borderWidth: 2,
    borderColor: palette.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  checkboxContainerChecked: {
    backgroundColor: palette.tealPrimary,
    borderColor: palette.tealPrimary,
    shadowColor: palette.tealPrimary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  checkboxMarkContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxMark: {
    color: palette.deepBlack,
    fontSize: 20,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    ...typography.body,
    color: palette.lightGray,
    lineHeight: typography.body.fontSize * 1.4,
  },
  checkboxLabelSmall: {
    fontSize: 14,
  },
  buttonContainer: {
    // gap handled by individual button margins
  },
  primaryButton: {
    borderRadius: 16,
    shadowColor: palette.tealPrimary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primaryButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonContent: {
    paddingVertical: spacing.m,
    backgroundColor: palette.tealPrimary,
  },
  primaryButtonLabel: {
    ...typography.button,
    color: palette.deepBlack,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: spacing.xs,
  },
  secondaryButtonLabel: {
    ...typography.button,
    color: palette.tealPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButtonLabelDisabled: {
    color: palette.disabled,
    opacity: 0.5,
  },
});

