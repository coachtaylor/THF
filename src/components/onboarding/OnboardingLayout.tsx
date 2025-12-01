import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/theme';
import { buttonStyles, textStyles, layoutStyles } from '../../theme/components';

interface OnboardingLayoutProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  onBack: () => void;
  onContinue: () => void;
  canContinue: boolean;
  children: React.ReactNode;
  continueButtonText?: string;
}

export default function OnboardingLayout({
  currentStep,
  totalSteps,
  title,
  subtitle,
  onBack,
  onContinue,
  canContinue,
  children,
  continueButtonText = 'Continue',
}: OnboardingLayoutProps) {
  return (
    <SafeAreaView style={layoutStyles.screen}>
      <View style={layoutStyles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={buttonStyles.icon}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>

          {/* Progress Dots */}
          <View style={styles.progressContainer}>
            <Text style={[textStyles.caption, styles.stepText]}>
              STEP {currentStep} OF {totalSteps}
            </Text>
            <View style={styles.dotsContainer}>
              {Array.from({ length: totalSteps }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index < currentStep && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Title & Subtitle */}
        <View style={styles.titleSection}>
          <Text style={textStyles.h1}>{title}</Text>
          <Text style={textStyles.body}>{subtitle}</Text>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        {/* Continue Button */}
        <TouchableOpacity
          onPress={onContinue}
          disabled={!canContinue}
          style={[
            buttonStyles.primary,
            !canContinue && buttonStyles.primaryDisabled,
          ]}
          activeOpacity={0.8}
        >
          <Text style={buttonStyles.primaryText}>{continueButtonText}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing['3xl'],
    gap: spacing.md,
  },
  progressContainer: {
    gap: spacing.sm,
  },
  stepText: {
    color: colors.text.tertiary,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.glass.border,
  },
  dotActive: {
    width: 14,
    backgroundColor: colors.cyan[500],
  },
  titleSection: {
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
});