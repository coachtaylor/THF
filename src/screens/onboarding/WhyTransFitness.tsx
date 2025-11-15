import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';

import type { OnboardingScreenProps, WhyTransFitnessContent } from '../../types/onboarding';
import { useProfile } from '../../hooks/useProfile';
import { palette, spacing, typography } from '../../theme';

const CONTENT: WhyTransFitnessContent = {
  headline: 'Safety-first workouts for trans bodies',
  bullets: [
    'Binder-aware exercises with safe alternatives',
    '5-45 minute options for any energy level',
    'Privacy-first: your data stays on your device',
  ],
  ctaText: 'Get Started',
  skipText: "I already know, let's go",
};

export default function WhyTransFitness({ navigation }: OnboardingScreenProps) {
  const { profile } = useProfile();
  const lowSensoryMode = profile?.low_sensory_mode ?? false;

  const handleContinue = () => {
    navigation.navigate('Disclaimer');
  };

  return (
    <View style={styles.container}>
      {!lowSensoryMode && (
        <View style={styles.heroContainer}>
          <Image
            source={require('../../../assets/onboarding-hero.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(10, 14, 14, 0.6)', palette.deepBlack]}
            style={styles.heroGradient}
          />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.headline}>{CONTENT.headline}</Text>

        <View style={styles.bulletsContainer}>
          {CONTENT.bullets.map((bullet, index) => (
            <View
              key={bullet}
              style={[styles.bulletRow, index !== CONTENT.bullets.length - 1 && styles.bulletRowSpacing]}
            >
              <View style={styles.bulletIcon}>
                <Text style={styles.bulletIconText}>✓</Text>
              </View>
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>

        <Button
          mode="contained"
          onPress={handleContinue}
          style={styles.ctaButton}
          contentStyle={styles.ctaContent}
          labelStyle={styles.ctaLabel}
        >
          {CONTENT.ctaText}
        </Button>

        <Button mode="text" onPress={handleContinue} labelStyle={styles.skipLabel}>
          {CONTENT.skipText}
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
    paddingVertical: spacing.xxl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  heroContainer: {
    marginHorizontal: -spacing.l, // Break out of container padding for full width
    marginTop: -spacing.xxl, // Align with top edge
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 400,
    marginBottom: spacing.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headline: {
    ...typography.h1,
    textAlign: 'center',
    lineHeight: typography.h1.fontSize * 1.2,
    marginBottom: spacing.l,
    color: palette.white,
  },
  bulletsContainer: {
    marginBottom: spacing.xl,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.darkCard,
    borderRadius: 20,
    padding: spacing.m,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderColor: palette.border,
  },
  bulletRowSpacing: {
    marginBottom: spacing.s,
  },
  bulletIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.tealPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
    shadowColor: palette.tealPrimary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  bulletIconText: {
    color: palette.deepBlack,
    fontSize: 18,
    fontWeight: '700',
  },
  bulletText: {
    flex: 1,
    fontSize: typography.bodyLarge.fontSize,
    color: typography.bodyLarge.color,
    lineHeight: typography.bodyLarge.fontSize * 1.5,
  },
  ctaButton: {
    borderRadius: 16,
    marginBottom: spacing.s,
    shadowColor: palette.tealPrimary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  ctaContent: {
    paddingVertical: spacing.m,
    backgroundColor: palette.tealPrimary,
  },
  ctaLabel: {
    ...typography.button,
    color: palette.deepBlack,
  },
  skipLabel: {
    ...typography.button,
    color: palette.tealPrimary,
  },
});
