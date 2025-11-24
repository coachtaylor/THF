import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, useWindowDimensions, LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  skipText: 'Skip',
};

export default function WhyTransFitness({ navigation }: OnboardingScreenProps<'WhyTransFitness'>) {
  const { profile } = useProfile();
  const lowSensoryMode = profile?.low_sensory_mode ?? false;
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [contentHeight, setContentHeight] = useState(0);
  const onContentLayout = useCallback((e: LayoutChangeEvent) => {
    setContentHeight(e.nativeEvent.layout.height);
  }, []);

  // Compute responsive dimensions so the screen fits without scrolling
  const layout = useMemo(() => {
    const paddingTop = Math.max(insets.top, spacing.m);
    const paddingBottom = Math.max(insets.bottom + spacing.s, spacing.l); // extra comfort above home indicator
    const isSmallScreen = windowHeight < 720;
    const headlineSize = isSmallScreen ? 24 : 28;

    // Reserve space for CTA cluster (button + skip)
    const reservedCta = (isSmallScreen ? 48 : 56) + spacing.m /* gap */ + 22 + spacing.s /* extra buffer */;
    const reserved = paddingTop + paddingBottom + contentHeight + reservedCta + spacing.m;
    const heroAvailable = windowHeight - reserved;
    // Clamp hero height to keep composition while ensuring everything fits
    const hero = Math.max(140, Math.min(320, Math.round(heroAvailable)));

    return { hero, isSmallScreen, headlineSize, paddingTop, paddingBottom };
  }, [windowHeight, insets.top, insets.bottom, contentHeight]);

  const handleContinue = () => {
    navigation.navigate('Disclaimer');
  };

  return (
    <View style={[styles.container, { paddingTop: layout.paddingTop, paddingBottom: layout.paddingBottom }]}>
      {!lowSensoryMode && (
        <View style={styles.heroContainer}>
          <Image
            source={require('../../../assets/onboarding-hero.png')}
            style={[styles.heroImage, { height: layout.hero }]}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(10, 14, 14, 0.6)', palette.deepBlack]}
            style={styles.heroGradient}
          />
        </View>
      )}
      <View style={styles.content}>
        <View onLayout={onContentLayout}>
          <Text style={[styles.headline, { fontSize: layout.headlineSize }]}>{CONTENT.headline}</Text>

          <View style={styles.bulletsContainer}>
            {CONTENT.bullets.map((bullet, index) => (
              <View
                key={bullet}
                style={[
                  styles.bulletRow,
                  layout.isSmallScreen && styles.bulletRowSmall,
                  index !== CONTENT.bullets.length - 1 && styles.bulletRowSpacing,
                ]}
              >
                <View style={styles.bulletIcon}>
                  <Text style={styles.bulletIconText}>✓</Text>
                </View>
                <Text style={[styles.bulletText, layout.isSmallScreen && styles.bulletTextSmall]}>{bullet}</Text>
              </View>
            ))}
          </View>
        </View>

        <Button
          mode="contained"
          onPress={handleContinue}
          style={styles.ctaButton}
          contentStyle={[styles.ctaContent, layout.isSmallScreen && styles.ctaContentSmall]}
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
    paddingTop: spacing.m,
    paddingBottom: spacing.l,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  heroContainer: {
    marginHorizontal: -spacing.l, // Break out of container padding for full width
    marginTop: 0,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    marginBottom: spacing.l,
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
    marginBottom: spacing.m,
    color: palette.white,
  },
  bulletsContainer: {
    marginBottom: spacing.m,
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
  bulletRowSmall: {
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
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
  bulletTextSmall: {
    fontSize: 15,
    lineHeight: 15 * 1.5,
  },
  ctaButton: {
    borderRadius: 16,
    marginBottom: spacing.m,
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
  ctaContentSmall: {
    paddingVertical: spacing.s,
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
