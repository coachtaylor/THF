import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import type { OnboardingScreenProps } from '../../types/onboarding';
import { useProfile } from '../../hooks/useProfile';
import { palette, spacing, typography } from '../../theme';

const DISCLAIMER_POINTS = [
  {
    iconType: 'warning',
    text: 'This is not medical advice. Consult a qualified healthcare provider for personalized guidance.',
  },
  {
    iconType: 'education',
    text: 'TransFitness provides educational content designed with trans-inclusive considerations.',
  },
  {
    iconType: 'not-replacement',
    text: 'It cannot replace professional medical advice, diagnosis, or treatment.',
  },
  {
    iconType: 'stop',
    text: 'If you experience pain, dizziness, or shortness of breath, stop immediately and seek medical care.',
  },
];

// Modern icon components
const WarningIcon = () => (
  <View style={iconStyles.warningContainer}>
    <View style={iconStyles.warningShape}>
      <View style={iconStyles.warningExclamation} />
    </View>
  </View>
);

const EducationIcon = () => (
  <View style={iconStyles.educationContainer}>
    <View style={iconStyles.bookShape}>
      <View style={iconStyles.bookLine1} />
      <View style={iconStyles.bookLine2} />
    </View>
  </View>
);

const NotReplacementIcon = () => (
  <View style={iconStyles.notReplacementContainer}>
    <View style={iconStyles.circle} />
    <View style={iconStyles.slash} />
  </View>
);

const StopIcon = () => (
  <View style={iconStyles.stopContainer}>
    <View style={iconStyles.stopSquare} />
    <View style={iconStyles.stopLine} />
  </View>
);

const getIconComponent = (iconType: string) => {
  switch (iconType) {
    case 'warning':
      return <WarningIcon />;
    case 'education':
      return <EducationIcon />;
    case 'not-replacement':
      return <NotReplacementIcon />;
    case 'stop':
      return <StopIcon />;
    default:
      return null;
  }
};

export default function Disclaimer({ navigation }: OnboardingScreenProps<'Disclaimer'>) {
  const { updateProfile } = useProfile();
  const [checked, setChecked] = useState(false);
  const insets = useSafeAreaInsets();

  const handleContinue = async () => {
    const nowIso = new Date().toISOString();
    try {
      await updateProfile({ disclaimer_acknowledged_at: nowIso });
    } catch {
      // no-op for now; storage added in US-2.2
    }
    navigation.navigate('GenderIdentity');
  };

  const handleQuickStart = () => {
    if (!checked) return; // Block navigation if user hasn't agreed
    navigation.navigate('QuickStart');
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Math.max(insets.top, spacing.m), paddingBottom: Math.max(insets.bottom, spacing.l) },
      ]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <View style={styles.mainIcon}>
              <View style={styles.mainIconCircle} />
              <View style={styles.mainIconCross} />
            </View>
          </View>
          <Text style={styles.headline}>
            Safety First
          </Text>
          <Text style={styles.subheadline}>
            Important information to keep you safe
          </Text>
        </View>

        {/* Content Cards - Individual cards for each point */}
        <View style={styles.cardsContainer}>
          {DISCLAIMER_POINTS.map((point, index) => (
            <View key={index} style={styles.pointCard}>
              <View style={styles.pointIconContainer}>
                {getIconComponent(point.iconType)}
              </View>
              <View style={styles.pointTextContainer}>
                <Text style={styles.pointText}>
                  {point.text}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Agreement Section */}
        <View style={styles.agreementCard}>
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
            <Text style={styles.checkboxLabel}>
              I understand and agree to these terms
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Action Buttons - Fixed at bottom */}
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
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.l,
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
    shadowColor: palette.tealPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  mainIcon: {
    width: 40,
    height: 40,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: palette.tealPrimary,
  },
  mainIconCross: {
    position: 'absolute',
    width: 2.5,
    height: 20,
    backgroundColor: palette.tealPrimary,
    borderRadius: 1.25,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
    color: palette.white,
    letterSpacing: -0.5,
  },
  subheadline: {
    fontSize: 15,
    textAlign: 'center',
    color: palette.midGray,
    fontWeight: '400',
    lineHeight: 20,
  },
  cardsContainer: {
    gap: spacing.s,
    marginBottom: spacing.l,
  },
  pointCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.m,
    gap: spacing.m,
  },
  pointIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.darkerCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: palette.border,
    flexShrink: 0,
  },
  pointTextContainer: {
    flex: 1,
    paddingTop: 2,
  },
  pointText: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.lightGray,
    fontWeight: '400',
  },
  agreementCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.m,
    marginBottom: spacing.m,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  checkboxMarkContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxMark: {
    color: palette.deepBlack,
    fontSize: 18,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 15,
    color: palette.white,
    fontWeight: '400',
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.m,
    paddingBottom: spacing.m,
    backgroundColor: palette.deepBlack,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    gap: spacing.xs,
  },
  primaryButton: {
    borderRadius: 12,
    shadowColor: palette.tealPrimary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  primaryButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.4,
  },
  primaryButtonContent: {
    paddingVertical: spacing.s,
    backgroundColor: palette.tealPrimary,
  },
  primaryButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.deepBlack,
    letterSpacing: 0.2,
  },
  secondaryButton: {
    marginTop: 0,
  },
  secondaryButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.tealPrimary,
  },
  secondaryButtonLabelDisabled: {
    color: palette.disabled,
    opacity: 0.4,
  },
});

// Icon styles - Appropriately sized icons
const iconStyles = StyleSheet.create({
  // Warning icon (diamond shape with exclamation)
  warningContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningShape: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: palette.warning,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
  },
  warningExclamation: {
    width: 2,
    height: 10,
    backgroundColor: palette.deepBlack,
    borderRadius: 1,
    transform: [{ rotate: '-45deg' }],
  },
  // Education icon (book)
  educationContainer: {
    width: 24,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookShape: {
    width: 20,
    height: 16,
    borderWidth: 2,
    borderColor: palette.tealPrimary,
    borderRadius: 2,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  bookLine1: {
    position: 'absolute',
    left: 4,
    top: 4,
    width: 10,
    height: 1.5,
    backgroundColor: palette.tealPrimary,
  },
  bookLine2: {
    position: 'absolute',
    left: 4,
    top: 8,
    width: 8,
    height: 1.5,
    backgroundColor: palette.tealPrimary,
  },
  // Not replacement icon (circle with slash)
  notReplacementContainer: {
    width: 24,
    height: 24,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.error,
  },
  slash: {
    position: 'absolute',
    width: 16,
    height: 2,
    backgroundColor: palette.error,
    transform: [{ rotate: '45deg' }],
  },
  // Stop icon (square with line)
  stopContainer: {
    width: 24,
    height: 24,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopSquare: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: palette.error,
    backgroundColor: 'transparent',
  },
  stopLine: {
    position: 'absolute',
    width: 12,
    height: 2,
    backgroundColor: palette.error,
  },
});

