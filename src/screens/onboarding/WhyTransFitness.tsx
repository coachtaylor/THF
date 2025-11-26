import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import type { OnboardingScreenProps } from '../../types/onboarding';
import AnimatedGradientHero from '../../components/onboarding/AnimatedGradientHero';
import ValueCard from '../../components/onboarding/ValueCard';
import { palette, spacing, typography } from '../../theme/theme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function WhyTransFitness({ navigation }: OnboardingScreenProps<'WhyTransFitness'>) {
  // Animation values for entrance animations
  const headlineOpacity = useSharedValue(0);
  const headlineTranslateY = useSharedValue(20);
  const subheadlineOpacity = useSharedValue(0);
  const subheadlineTranslateY = useSharedValue(20);

  // Button press animation
  const primaryButtonScale = useSharedValue(1);
  const secondaryButtonScale = useSharedValue(1);

  useEffect(() => {
    // Headline animation
    headlineOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
    );
    headlineTranslateY.value = withDelay(
      200,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) })
    );

    // Subheadline animation
    subheadlineOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
    );
    subheadlineTranslateY.value = withDelay(
      400,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) })
    );
  }, []);

  const headlineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headlineOpacity.value,
    transform: [{ translateY: headlineTranslateY.value }],
  }));

  const subheadlineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subheadlineOpacity.value,
    transform: [{ translateY: subheadlineTranslateY.value }],
  }));

  const primaryButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: primaryButtonScale.value }],
  }));

  const secondaryButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: secondaryButtonScale.value }],
  }));

  const handlePrimaryPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('Disclaimer');
  };

  const handlePrimaryPressIn = () => {
    primaryButtonScale.value = withTiming(0.96, { duration: 100 });
  };

  const handlePrimaryPressOut = () => {
    primaryButtonScale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  const handleSecondaryPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('QuickStart');
  };

  const handleSecondaryPressIn = () => {
    secondaryButtonScale.value = withTiming(0.96, { duration: 100 });
  };

  const handleSecondaryPressOut = () => {
    secondaryButtonScale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* HERO SECTION */}
      <View style={styles.heroSection}>
        <AnimatedGradientHero height={180} />
        <LinearGradient
          colors={['transparent', 'rgba(15, 20, 25, 0.9)']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* CONTENT SECTION */}
      <View style={styles.contentSection}>
          {/* HEADLINE */}
          <Animated.View style={headlineAnimatedStyle}>
            <Text style={styles.headline}>
              You shouldn't have to mentally translate your workout app
            </Text>
          </Animated.View>

          {/* SUBHEADLINE */}
          <Animated.View style={subheadlineAnimatedStyle}>
            <Text style={styles.subheadline}>
              TransFitness speaks your language—with programming that accounts for binding, HRT, surgery recovery, and dysphoria.
            </Text>
          </Animated.View>

          {/* VALUE CARDS */}
          <ValueCard
            delay={600}
            problem="I'm worried about exercises that compress my chest"
            solution="137 binding-safe exercises with video demos and alternatives"
          />

          <ValueCard
            delay={700}
            problem="My app doesn't account for how HRT affects my recovery"
            solution="Hormone-adjusted training volumes that adapt to your cycle"
          />

          <ValueCard
            delay={800}
            problem="I'm tired of 'ladies' this, 'guys' that in every app"
            solution="Body-neutral cues focused on movement mechanics, not looks"
          />

          {/* PRIMARY CTA */}
          <AnimatedTouchableOpacity
            onPress={handlePrimaryPress}
            onPressIn={handlePrimaryPressIn}
            onPressOut={handlePrimaryPressOut}
            style={[styles.primaryButton, primaryButtonAnimatedStyle]}
            activeOpacity={1}
          >
            <LinearGradient
              colors={['#00D9C0', '#00B39D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.primaryButtonText}>Start Training Safely</Text>
            </LinearGradient>
          </AnimatedTouchableOpacity>

          {/* SECONDARY OPTION */}
          <AnimatedTouchableOpacity
            onPress={handleSecondaryPress}
            onPressIn={handleSecondaryPressIn}
            onPressOut={handleSecondaryPressOut}
            style={[styles.secondaryButton, secondaryButtonAnimatedStyle]}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>I need help right now →</Text>
          </AnimatedTouchableOpacity>
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  heroSection: {
    height: 180,
    position: 'relative',
    overflow: 'hidden',
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: spacing.l,
    marginTop: -40,
    paddingTop: spacing.s,
    paddingBottom: 0,
  },
  headline: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: 12,
    textAlign: 'left',
  },
  subheadline: {
    fontSize: 15,
    fontWeight: '400',
    color: '#B8C5C5',
    lineHeight: 22,
    marginBottom: 16,
    textAlign: 'left',
  },
  primaryButton: {
    height: 52,
    borderRadius: 26,
    marginTop: 16,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#00D9C0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
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
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: spacing.s,
    marginBottom: 4,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
});
