import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import type { OnboardingScreenProps } from '../../types/onboarding';
import { useProfile } from '../../hooks/useProfile';
import { palette, spacing, typography } from '../../theme';

const DISCLAIMER_TEXT = `
Important: This is not medical advice. Consult a qualified healthcare provider for personalized guidance. 
TransFitness provides educational content designed with trans-inclusive considerations, 
but it cannot replace professional medical advice, diagnosis, or treatment. 
If you experience pain, dizziness, or shortness of breath, stop immediately and seek medical care.
`;

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
      <Text style={styles.headline}>Important: This is not medical advice</Text>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustContentInsets={false}
      >
        <Text style={styles.text}>{DISCLAIMER_TEXT}</Text>
      </ScrollView>

      <View style={styles.checkboxRow}>
        <TouchableOpacity onPress={() => setChecked((v) => !v)} activeOpacity={0.8} style={styles.checkboxTapArea}>
          <View style={styles.checkboxContainer}>
            {checked && <Text style={styles.checkboxMark}>✓</Text>}
          </View>
        </TouchableOpacity>
        <Text style={styles.checkboxLabel}>I understand and agree</Text>
      </View>

      <Button
        mode="contained"
        onPress={handleContinue}
        disabled={!checked}
        style={styles.primaryButton}
        contentStyle={styles.primaryButtonContent}
        labelStyle={styles.primaryButtonLabel}
      >
        Continue
      </Button>

      <Button
        mode="text"
        onPress={handleQuickStart}
        disabled={!checked}
        labelStyle={styles.secondaryButtonLabel}
      >
        Quick Start
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.deepBlack,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.xl,
  },
  headline: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  scroll: {
    flex: 1,
    backgroundColor: palette.darkCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  scrollContent: {
    padding: spacing.l,
  },
  text: {
    fontSize: typography.body.fontSize,
    color: typography.body.color,
    lineHeight: typography.body.fontSize * 1.5,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.l,
    marginBottom: spacing.s,
  },
  checkboxTapArea: {
    padding: spacing.xs,
  },
  checkboxContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: palette.deepBlack,
    borderWidth: 2,
    borderColor: palette.tealPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s,
  },
  checkboxMark: {
    color: palette.tealPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  checkboxLabel: {
    ...typography.body,
  },
  primaryButton: {
    borderRadius: 16,
    marginBottom: spacing.s,
  },
  primaryButtonContent: {
    paddingVertical: spacing.m,
    backgroundColor: palette.tealPrimary,
  },
  primaryButtonLabel: {
    ...typography.button,
    color: palette.deepBlack,
  },
  secondaryButtonLabel: {
    ...typography.button,
    color: palette.tealPrimary,
  },
});

