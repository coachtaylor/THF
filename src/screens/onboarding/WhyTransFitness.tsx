import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../../types/onboarding';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/theme';
import {
  buttonStyles,
  textStyles,
  layoutStyles,
} from '../../theme/components';
import GlassCard from '../../components/common/GlassCard';
import { useSensoryMode } from '../../contexts/SensoryModeContext';

type WhyTransFitnessNavigationProp = StackNavigationProp<OnboardingStackParamList, 'WhyTransFitness'>;

interface WhyTransFitnessProps {
  navigation: WhyTransFitnessNavigationProp;
}

interface Feature {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: 'cyan' | 'pink';
}

// Animated feature card component
interface AnimatedFeatureCardProps {
  feature: Feature;
  index: number;
  disableAnimations: boolean;
}

function AnimatedFeatureCard({ feature, index, disableAnimations }: AnimatedFeatureCardProps) {
  const opacity = useSharedValue(disableAnimations ? 1 : 0);
  const translateY = useSharedValue(disableAnimations ? 0 : 20);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!disableAnimations) {
      const delay = 100 * index; // Stagger by 100ms per card
      opacity.value = withDelay(delay, withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }));
      translateY.value = withDelay(delay, withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) }));
    }
  }, [disableAnimations]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const iconColor = feature.color === 'cyan' ? colors.cyan[500] : colors.pink[500];
  const variant = feature.color === 'cyan' ? 'hero' : 'heroPink';

  return (
    <Animated.View style={animatedStyle}>
      <GlassCard
        variant={variant}
        pressable
        shimmer
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        noPadding
      >
        <View style={styles.featureContent}>
          <View style={[styles.iconCircle, { backgroundColor: `${iconColor}15` }]}>
            <Ionicons
              name={feature.icon}
              size={24}
              color={iconColor}
            />
          </View>
          <View style={styles.featureText}>
            <Text style={textStyles.h3}>{feature.title}</Text>
            <Text style={textStyles.bodySmall}>{feature.description}</Text>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

export default function WhyTransFitness({ navigation }: WhyTransFitnessProps) {
  const { disableAnimations } = useSensoryMode();

  const features: Feature[] = [
    {
      icon: 'shield-checkmark',
      title: 'Safety First',
      description: 'Binding-aware exercises and post-surgical recovery protocols designed specifically for trans athletes',
      color: 'cyan',
    },
    {
      icon: 'heart',
      title: 'Gender-Affirming',
      description: 'Personalized programs that respect your goals, whether feminization, masculinization, or general fitness',
      color: 'pink',
    },
    {
      icon: 'barbell',
      title: 'HRT-Aware',
      description: 'Programming that adapts to hormone therapy effects on strength, recovery, and training capacity',
      color: 'cyan',
    },
    {
      icon: 'sparkles',
      title: 'Dysphoria-Sensitive',
      description: 'Exercise selection that respects your comfort zones and helps you feel confident in your body',
      color: 'pink',
    },
  ];

  const handleContinue = () => {
    navigation.navigate('Disclaimer');
  };

  // Hero section animation
  const heroOpacity = useSharedValue(disableAnimations ? 1 : 0);
  const heroTranslateY = useSharedValue(disableAnimations ? 0 : 15);

  // CTA animation (appears after feature cards)
  const ctaOpacity = useSharedValue(disableAnimations ? 1 : 0);
  const ctaTranslateY = useSharedValue(disableAnimations ? 0 : 20);

  useEffect(() => {
    if (!disableAnimations) {
      // Hero fades in immediately
      heroOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      heroTranslateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });

      // CTA appears after all cards (4 cards * 100ms delay + 300ms animation)
      const ctaDelay = 500;
      ctaOpacity.value = withDelay(ctaDelay, withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }));
      ctaTranslateY.value = withDelay(ctaDelay, withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) }));
    }
  }, [disableAnimations]);

  const heroAnimatedStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslateY.value }],
  }));

  const ctaAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaTranslateY.value }],
  }));

  return (
    <SafeAreaView style={layoutStyles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Animated.View style={[styles.heroSection, heroAnimatedStyle]}>
          {/* Hero Title */}
          <View style={styles.titleContainer}>
            <Text style={textStyles.display2}>
              Fitness That{' '}
            </Text>
            <Text style={[textStyles.display2, styles.highlightText]}>
              Understands You
            </Text>
          </View>

          {/* Subtitle */}
          <Text style={[textStyles.body, styles.subtitle]}>
            The only fitness app designed specifically for transgender and non-binary athletes. Safe, effective, and affirming.
          </Text>
        </Animated.View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <AnimatedFeatureCard
              key={index}
              feature={feature}
              index={index}
              disableAnimations={disableAnimations}
            />
          ))}
        </View>

        {/* CTA Button */}
        <Animated.View style={[styles.ctaContainer, ctaAnimatedStyle]}>
          <TouchableOpacity
            onPress={handleContinue}
            style={buttonStyles.primary}
            activeOpacity={0.8}
          >
            <Text style={buttonStyles.primaryText}>Get Started</Text>
          </TouchableOpacity>

          {/* Privacy Note */}
          <Text style={[textStyles.caption, styles.privacyNote]}>
            Your data stays private and secure on your device
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Only screen-specific layout styles
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing['4xl'],
    alignItems: 'center',
  },
  heroSection: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  highlightText: {
    color: colors.cyan[500],
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  featuresContainer: {
    width: '100%',
    maxWidth: 480,
    gap: spacing.base,
    marginBottom: spacing['4xl'],
  },
  featureContent: {
    flexDirection: 'row',
    gap: spacing.base,
    padding: spacing.xl,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    gap: spacing.sm,
  },
  ctaContainer: {
    width: '100%',
    maxWidth: 480,
    gap: spacing.base,
  },
  privacyNote: {
    textAlign: 'center',
    color: colors.text.tertiary,
  },
});