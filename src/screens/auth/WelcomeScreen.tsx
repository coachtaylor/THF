import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme/theme';

// Feature data
const FEATURES = [
  {
    icon: 'shield-checkmark' as const,
    title: 'Binder-Aware Exercises',
    description: 'Safe alternatives for chest compression',
  },
  {
    icon: 'time' as const,
    title: 'Flexible Workouts',
    description: '5-45 minute options for any energy level',
  },
  {
    icon: 'lock-closed' as const,
    title: 'Privacy-First',
    description: 'Your data stays on your device',
  },
  {
    icon: 'heart' as const,
    title: 'Recovery Support',
    description: 'Post-surgery modifications included',
  },
];

// Feature card component
function FeatureCard({
  icon,
  title,
  description,
  index,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  index: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.featureCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['#141418', '#0A0A0C']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glassHighlight} />

      <View style={styles.featureIconContainer}>
        <Ionicons name={icon} size={24} color={colors.accent.primary} />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </Animated.View>
  );
}

interface WelcomeScreenProps {
  navigation: any;
}

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0)).current;
  const logoGlowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo animation
    Animated.spring(logoScaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Logo glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoGlowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(logoGlowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Button shimmer
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 400],
  });

  const logoGlowOpacity = logoGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  const handleGetStarted = () => {
    navigation.navigate('Signup');
  };

  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bg.primary, colors.bg.secondary]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          {/* Logo */}
          <Animated.View
            style={[
              styles.logoContainer,
              { transform: [{ scale: logoScaleAnim }] },
            ]}
          >
            <Animated.View
              style={[styles.logoGlow, { opacity: logoGlowOpacity }]}
            >
              <LinearGradient
                colors={['rgba(91, 206, 250, 0.4)', 'transparent']}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            <LinearGradient
              colors={[colors.accent.primary, colors.accent.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Ionicons name="fitness" size={36} color={colors.text.inverse} />
            </LinearGradient>
          </Animated.View>

          <Text style={styles.appName}>TransFitness</Text>
          <Text style={styles.tagline}>Affirming Fitness for Every Body</Text>

          {/* Headline */}
          <View style={styles.headlineContainer}>
            <Text style={styles.headline}>
              Safety-first workouts{'\n'}for trans bodies
            </Text>
            <Text style={styles.subheadline}>
              Binder-aware exercises. HRT-informed programming.{' '}
              Built by trans people, for trans people.
            </Text>
          </View>
        </View>

        {/* Feature Cards */}
        <View style={styles.featuresContainer}>
          {FEATURES.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </View>

        {/* Social Proof */}
        <View style={styles.socialProofContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>10K+</Text>
              <Text style={styles.statLabel}>Downloads</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4.8</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>500+</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>

          <View style={styles.testimonialCard}>
            <LinearGradient
              colors={[colors.accent.primaryMuted, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.testimonialAccent} />
            <Text style={styles.testimonialText}>
              "Finally, a fitness app that gets it. The binder-aware exercises are a game-changer."
            </Text>
            <Text style={styles.testimonialAuthor}>— Alex, 27</Text>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleGetStarted}
          >
            <LinearGradient
              colors={[colors.accent.primary, colors.accent.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.2)', 'transparent']}
              style={styles.buttonGlassOverlay}
            />
            <Animated.View
              style={[
                styles.buttonShimmer,
                { transform: [{ translateX: shimmerTranslate }] },
              ]}
            >
              <LinearGradient
                colors={['transparent', 'rgba(255, 255, 255, 0.2)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            <Ionicons name="sparkles" size={20} color={colors.text.inverse} />
            <Text style={styles.primaryButtonText}>Get Started Free</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleSignIn}
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </Pressable>

        </View>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.legalText}>
            By continuing, you agree to our{' '}
            <Text style={styles.legalLink}>Terms</Text>
            {' '}and{' '}
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
  },
  // Hero
  heroContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 88,
    height: 88,
    marginBottom: spacing.l,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
      },
      android: { elevation: 8 },
    }),
  },
  appName: {
    fontFamily: 'Poppins',
    fontSize: 32,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  headlineContainer: {
    alignItems: 'center',
  },
  headline: {
    fontFamily: 'Poppins',
    fontSize: 32,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -1,
    marginBottom: spacing.m,
  },
  subheadline: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Features
  featuresContainer: {
    marginBottom: spacing.xl,
    gap: spacing.m,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.accent.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  featureDescription: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  // Social proof
  socialProofContainer: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.l,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.default,
  },
  statValue: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '800',
    color: colors.accent.primary,
    marginBottom: spacing.xxs,
  },
  statLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  testimonialCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
    padding: spacing.lg,
    width: '100%',
    overflow: 'hidden',
  },
  testimonialAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.accent.primary,
  },
  testimonialText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: spacing.s,
  },
  testimonialAuthor: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  // CTA
  ctaContainer: {
    marginBottom: spacing.xl,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    height: 56,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.m,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  buttonGlassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  buttonShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 200,
  },
  primaryButtonText: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  secondaryButton: {
    height: 52,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  secondaryButtonText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  // Footer
  footerContainer: {
    alignItems: 'center',
  },
  legalText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: colors.text.disabled,
    textAlign: 'center',
    lineHeight: 16,
  },
  legalLink: {
    color: colors.text.tertiary,
    textDecorationLine: 'underline',
  },
});
