import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import type { OnboardingStackParamList } from '../../types/onboarding';
import { colors, spacing, borderRadius } from '../../theme/theme';

type SplashScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Splash'>;

interface SplashScreenProps {
  navigation: SplashScreenNavigationProp;
}

export default function SplashScreen({ navigation }: SplashScreenProps) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const badgeFadeAnim = useRef(new Animated.Value(0)).current;
  const badgeSlideAnim = useRef(new Animated.Value(-30)).current;
  const featureAnim1 = useRef(new Animated.Value(0)).current;
  const featureAnim2 = useRef(new Animated.Value(0)).current;
  const featureAnim3 = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const buttonSlideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Staggered animations
    Animated.parallel([
      // Top badge
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(badgeFadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(badgeSlideAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // Middle content
      Animated.sequence([
        Animated.delay(500),
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // Feature pills
      Animated.sequence([
        Animated.delay(900),
        Animated.parallel([
          Animated.timing(featureAnim1, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.delay(100),
          Animated.timing(featureAnim2, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.delay(100),
          Animated.timing(featureAnim3, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // Bottom button
      Animated.sequence([
        Animated.delay(1200),
        Animated.parallel([
          Animated.timing(buttonAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(buttonSlideAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    navigation.navigate('WhyTransFitness');
  };

  const features = ['Binding-Safe', 'HRT-Adaptive', 'Post-Surgery Protocols'];
  const featureAnims = [featureAnim1, featureAnim2, featureAnim3];

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../../assets/onboarding-hero-pullup-corrected.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
        imageStyle={styles.imageStyle}
      >
        {/* Gradient Overlay */}
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.8)']}
          locations={[0, 0.5, 1]}
          style={styles.gradientOverlay}
        />

        {/* Content */}
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={[styles.content, { paddingTop: Math.max(insets.top, spacing.xl * 2) }]}>
            {/* Top Section - Branding Badge */}
            <Animated.View
              style={[
                styles.topSection,
                {
                  opacity: badgeFadeAnim,
                  transform: [{ translateY: badgeSlideAnim }],
                },
              ]}
            >
              <View style={styles.brandBadge}>
                <Ionicons name="sparkles" size={18} color={colors.cyan[500]} />
                <Text style={styles.brandBadgeText}>GENDER-AFFIRMING FITNESS</Text>
              </View>
            </Animated.View>

            {/* Middle Section - Main Message */}
            <Animated.View
              style={[
                styles.middleSection,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <Text style={styles.mainTitle}>TransFitness</Text>

              <View style={styles.descriptionCard}>
                <Text style={styles.descriptionText}>
                  Fitness designed for{' '}
                  <Text style={styles.descriptionHighlight}>your body</Text>,{'\n'}
                  built with{' '}
                  <Text style={styles.descriptionHighlight}>your journey</Text> in mind.
                </Text>
              </View>

              {/* Feature Pills */}
              <View style={styles.featurePills}>
                {features.map((feature, index) => (
                  <Animated.View
                    key={feature}
                    style={[
                      styles.featurePill,
                      {
                        opacity: featureAnims[index],
                        transform: [{ translateY: featureAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }) }],
                      },
                    ]}
                  >
                    <Text style={styles.featurePillText}>{feature}</Text>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>

            {/* Bottom Section - CTA */}
            <Animated.View
              style={[
                styles.bottomSection,
                {
                  opacity: buttonAnim,
                  transform: [{ translateY: buttonSlideAnim }],
                },
              ]}
            >
              {/* Get Started Button */}
              <TouchableOpacity
                onPress={handleGetStarted}
                style={styles.getStartedButton}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.cyan[500], colors.cyan[600]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.getStartedText}>Get Started</Text>
                  <Ionicons name="arrow-forward" size={22} color={colors.text.primary} />
                </LinearGradient>
              </TouchableOpacity>

              {/* Privacy Notice */}
              <View style={styles.privacyNotice}>
                <Text style={styles.privacyText}>
                  🔒 Your data stays private. All information is stored locally on your device.
                </Text>
              </View>
            </Animated.View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.deep,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageStyle: {
    opacity: 1,
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 1.5,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.base,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    ...Platform.select({
      ios: {
        shadowColor: colors.cyan[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  brandBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.08 * 16,
    textTransform: 'uppercase',
    color: colors.cyan[500],
  },
  middleSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  mainTitle: {
    fontFamily: 'Poppins',
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: -0.12 * 56,
    lineHeight: 56 * 1.1,
    color: colors.text.primary,
    marginBottom: spacing.xl,
    textAlign: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  descriptionCard: {
    paddingHorizontal: spacing.xl + 4,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  descriptionText: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 18 * 1.5,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  descriptionHighlight: {
    color: colors.cyan[500],
    fontWeight: '600',
    ...Platform.select({
      ios: {
        shadowColor: colors.cyan[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
    }),
  },
  featurePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featurePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  featurePillText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.03 * 11,
    textTransform: 'uppercase',
    color: colors.semantic.success,
  },
  bottomSection: {
    gap: spacing.base,
  },
  getStartedButton: {
    height: 64,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.cyan[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 32,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  getStartedText: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  privacyNotice: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.base,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  privacyText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 13 * 1.5,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

