import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { generateQuickStartPlan } from '../../services/planGenerator';
import { Plan } from '../../types';
import { palette, spacing, typography } from '../../theme';
import type { OnboardingScreenProps } from '../../types/onboarding';

export default function QuickStart({ navigation }: OnboardingScreenProps<'QuickStart'>) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    generatePlan();
  }, []);

  async function generatePlan() {
    try {
      setLoading(true);
      setError(null);

      // Generate default 5-min bodyweight workout
      const quickPlan = await generateQuickStartPlan();
      console.log('✅ Quick Start plan generated:', quickPlan);

      // TODO: Navigate to SessionPlayer when it's implemented (Week 4)
      // For now, show success message and navigate back
      // navigation.navigate('SessionPlayer', { plan: quickPlan });
      
      // Temporary: Navigate back to onboarding or show success
      setTimeout(() => {
        // For now, just show that plan was created
        // In Week 4, this will navigate to SessionPlayer
        setLoading(false);
      }, 1500);
    } catch (err) {
      console.error('❌ Failed to generate Quick Start plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate workout plan');
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.l) }]}>
        <ActivityIndicator size="large" color={palette.tealPrimary} />
        <Text style={styles.loadingText}>Creating your 5-minute workout...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.l) }]}>
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorHint}>Please try again or complete your profile for a personalized plan.</Text>
      </View>
    );
  }

  // Success state (temporary until SessionPlayer is implemented)
  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.l) }]}>
      <Text style={styles.successTitle}>Workout Created! 🎉</Text>
      <Text style={styles.successText}>
        Your 5-minute Quick Start workout has been generated. Session Player coming in Week 4!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.deepBlack,
    padding: spacing.l,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.bodyLarge,
    marginTop: spacing.l,
    textAlign: 'center',
    color: palette.lightGray,
  },
  errorTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.m,
    color: palette.error,
  },
  errorText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.m,
    color: palette.lightGray,
  },
  errorHint: {
    ...typography.bodySmall,
    textAlign: 'center',
    color: palette.midGray,
  },
  successTitle: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.m,
    color: palette.tealPrimary,
  },
  successText: {
    ...typography.body,
    textAlign: 'center',
    color: palette.lightGray,
  },
});

