import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, spacing, typography } from '../../theme';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export default function ProgressIndicator({ currentStep, totalSteps, stepLabels }: ProgressIndicatorProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>
      <Text style={styles.stepLabel}>
        Step {currentStep} of {totalSteps}
      </Text>
      {stepLabels && stepLabels.length > 0 && (
        <Text style={styles.stepSubLabel}>
          {stepLabels[currentStep - 1]}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  progressBarContainer: {
    marginBottom: spacing.s,
  },
  progressBarBackground: {
    height: 3,
    backgroundColor: palette.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: palette.tealPrimary,
    borderRadius: 3,
  },
  stepLabel: {
    ...typography.bodySmall,
    textAlign: 'left',
    color: palette.white,
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.xs,
    letterSpacing: 0.2,
  },
  stepSubLabel: {
    ...typography.caption,
    textAlign: 'left',
    color: palette.midGray,
    fontSize: 11,
    marginTop: spacing.xs / 2,
    letterSpacing: 0.2,
  },
});

