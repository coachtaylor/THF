import React, { useState, useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../../components/common/GlassCard';
import ModernCheckbox from '../../components/onboarding/ModernCheckbox';
import { useSensoryMode } from '../../contexts/SensoryModeContext';

type DisclaimerNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Disclaimer'>;

interface DisclaimerProps {
  navigation: DisclaimerNavigationProp;
}

interface DisclaimerItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  content: string;
  color: string;
  variant: 'default' | 'hero';
}

// Animated disclaimer card component
interface AnimatedDisclaimerCardProps {
  item: DisclaimerItem;
  index: number;
  disableAnimations: boolean;
}

function AnimatedDisclaimerCard({ item, index, disableAnimations }: AnimatedDisclaimerCardProps) {
  const opacity = useSharedValue(disableAnimations ? 1 : 0);
  const translateY = useSharedValue(disableAnimations ? 0 : 20);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!disableAnimations) {
      const delay = 100 * index;
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

  return (
    <Animated.View style={animatedStyle}>
      <GlassCard
        variant={item.variant}
        pressable
        shimmer
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        noPadding
      >
        <View style={styles.cardContent}>
          <Ionicons
            name={item.icon}
            size={24}
            color={item.color}
            style={styles.icon}
          />
          <View style={styles.textContainer}>
            <Text style={textStyles.h3}>{item.title}</Text>
            <Text style={textStyles.bodySmall}>{item.content}</Text>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

export default function Disclaimer({ navigation }: DisclaimerProps) {
  const [hasAgreed, setHasAgreed] = useState(false);
  const { disableAnimations } = useSensoryMode();

  const disclaimers: DisclaimerItem[] = [
    {
      icon: 'warning-outline',
      title: 'Not Medical Advice',
      content: 'TransFitness provides fitness guidance only. This app is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers, especially regarding HRT, surgery recovery, and binding safety.',
      color: colors.semantic.warning,
      variant: 'default',
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Safety Considerations',
      content: 'While we provide binding-aware and post-surgical protocols, every body is different. Listen to your body, respect your limits, and seek medical attention if you experience pain, discomfort, or complications during exercise.',
      color: colors.cyan[500],
      variant: 'hero',
    },
    {
      icon: 'lock-closed-outline',
      title: 'Privacy & Data',
      content: 'Your personal information is stored locally on your device. We do not collect, store, or share personally identifiable information (PII). TransFitness is designed for fitness tracking, not for managing sensitive medical data.',
      color: colors.cyan[500],
      variant: 'hero',
    },
    {
      icon: 'document-text-outline',
      title: 'User Responsibility',
      content: 'You are responsible for the accuracy of information you provide and for using this app safely. If you have any medical conditions, injuries, or concerns, please consult healthcare professionals before starting any exercise program.',
      color: colors.cyan[500],
      variant: 'hero',
    },
  ];

  const handleContinue = () => {
    if (hasAgreed) {
      navigation.navigate('GenderIdentity');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // Header animation
  const headerOpacity = useSharedValue(disableAnimations ? 1 : 0);
  const headerTranslateY = useSharedValue(disableAnimations ? 0 : 15);

  // Footer (checkbox + CTA) animation
  const footerOpacity = useSharedValue(disableAnimations ? 1 : 0);
  const footerTranslateY = useSharedValue(disableAnimations ? 0 : 20);

  useEffect(() => {
    if (!disableAnimations) {
      // Header fades in immediately
      headerOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      headerTranslateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });

      // Footer appears after all cards (4 cards * 100ms delay + 300ms animation)
      const footerDelay = 500;
      footerOpacity.value = withDelay(footerDelay, withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }));
      footerTranslateY.value = withDelay(footerDelay, withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) }));
    }
  }, [disableAnimations]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const footerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
    transform: [{ translateY: footerTranslateY.value }],
  }));

  return (
    <SafeAreaView style={layoutStyles.screen}>
      <View style={layoutStyles.content}>
        {/* Back Button - Fixed at top */}
        <TouchableOpacity
          onPress={handleBack}
          style={buttonStyles.icon}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        {/* Scrollable Content */}
        <View style={styles.scrollContainer}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {/* Header - scrolls with content */}
            <Animated.View style={[styles.header, headerAnimatedStyle]}>
              <Text style={textStyles.display2}>Important</Text>
              <Text style={textStyles.display2}>Information</Text>
              <Text style={[textStyles.body, styles.subtitle]}>
                Please read and acknowledge these important disclaimers before continuing.
              </Text>
            </Animated.View>

            {/* Disclaimer Cards */}
            {disclaimers.map((item, index) => (
              <AnimatedDisclaimerCard
                key={index}
                item={item}
                index={index}
                disableAnimations={disableAnimations}
              />
            ))}
          </ScrollView>
          {/* Fade overlay to indicate scrollable content */}
          <LinearGradient
            colors={['transparent', colors.bg.primary]}
            style={styles.fadeOverlay}
            pointerEvents="none"
          />
        </View>

        {/* Agreement Checkbox + Continue Button */}
        <Animated.View style={footerAnimatedStyle}>
          <View style={styles.checkboxContainer}>
            <ModernCheckbox
              checked={hasAgreed}
              onPress={() => setHasAgreed(!hasAgreed)}
              label="I understand and acknowledge that TransFitness is for fitness guidance only and is not a substitute for professional medical advice. I will consult healthcare providers regarding medical decisions."
            />
          </View>

          <TouchableOpacity
            onPress={handleContinue}
            disabled={!hasAgreed}
            style={[
              buttonStyles.primary,
              !hasAgreed && buttonStyles.primaryDisabled
            ]}
            activeOpacity={0.8}
          >
            <Text style={buttonStyles.primaryText}>I Understand, Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

// ONLY screen-specific layout styles
const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.xl,
  },
  subtitle: {
    marginTop: spacing.md,
  },
  scrollContainer: {
    flex: 1,
    marginBottom: spacing.md,
  },
  scrollView: {
    flex: 1,
    marginBottom: spacing.xl,
  },
  scrollContent: {
    gap: spacing.base,
    paddingBottom: spacing.xl,
  },
  fadeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  cardContent: {
    flexDirection: 'row',
    gap: spacing.base,
    padding: spacing.xl,
  },
  icon: {
    marginTop: 2, // Align with text baseline
  },
  textContainer: {
    flex: 1,
    gap: spacing.sm,
  },
  checkboxContainer: {
    marginBottom: spacing.md,
  },
});