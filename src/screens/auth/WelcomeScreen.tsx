import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

// SVG Icons
const ShieldCheckSVG = () => (
  <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
    <Path
      d="M14 2 L24 6 L24 14 C24 19 20 23 14 26 C8 23 4 19 4 14 L4 6 Z"
      stroke="#00D9C0"
      strokeWidth="2"
    />
    <Path
      d="M10 14 L13 17 L18 12"
      stroke="#00D9C0"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

const ClockSVG = () => (
  <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
    <Circle cx="14" cy="14" r="11" stroke="#00D9C0" strokeWidth="2" />
    <Path
      d="M14 8 L14 14 L18 16"
      stroke="#00D9C0"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

const LockSVG = () => (
  <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
    <Rect x="6" y="12" width="16" height="12" rx="2" stroke="#00D9C0" strokeWidth="2" />
    <Path
      d="M10 12 L10 8 C10 5.8 11.8 4 14 4 C16.2 4 18 5.8 18 8 L18 12"
      stroke="#00D9C0"
      strokeWidth="2"
    />
  </Svg>
);

const HeartSVG = () => (
  <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
    <Path
      d="M14 24 L6 16 C4 14 4 10.5 6 8.5 C8 6.5 11 7 14 10 C17 7 20 6.5 22 8.5 C24 10.5 24 14 22 16 Z"
      stroke="#00D9C0"
      strokeWidth="2"
    />
  </Svg>
);

const SparkleSVG = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path d="M9 1 L10 7 L16 8 L10 9 L9 15 L8 9 L2 8 L8 7 Z" fill="#0F1419" />
  </Svg>
);

// Feature data
const FEATURES = [
  {
    icon: 'shield',
    title: 'Binder-Aware Exercises',
    description: 'Safe alternatives for chest compression',
  },
  {
    icon: 'clock',
    title: 'Flexible Workouts',
    description: '5-45 minute options for any energy level',
  },
  {
    icon: 'lock',
    title: 'Privacy-First',
    description: 'Your data stays on your device',
  },
  {
    icon: 'heart',
    title: 'Recovery Support',
    description: 'Post-surgery modifications included',
  },
];

interface WelcomeScreenProps {
  navigation: any;
}

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();

  const handleGetStarted = () => {
    // Navigate to Signup or WhyTransFitness if it exists
    if (navigation.canGoBack()) {
      navigation.navigate('WhyTransFitness');
    } else {
      // If WhyTransFitness is not in the same navigator, try Signup
      navigation.navigate('Signup');
    }
  };

  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  const handleContinueAsGuest = () => {
    // Navigate to onboarding for anonymous session
    navigation.navigate('WhyTransFitness');
  };

  const handleTerms = () => {
    // TODO: Open terms modal or navigate to terms screen
    console.log('Terms pressed');
  };

  const handlePrivacy = () => {
    // TODO: Open privacy modal or navigate to privacy screen
    console.log('Privacy pressed');
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO SECTION */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={['rgba(0, 217, 192, 0.08)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.heroBackground}
          />

          <View style={styles.logoContainer}>
            <View style={styles.logoGradientCircle}>
              <LinearGradient
                colors={['#00D9C0', '#A78BFA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              />
            </View>
            <Text style={styles.appName}>TransFitness</Text>
            <Text style={styles.tagline}>Affirming Fitness for Every Body</Text>
          </View>

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

        {/* MASCOT (Optional) */}
        <View style={styles.mascotContainer}>
          <View style={styles.mascotPlaceholder}>
            <Text style={styles.mascotText}>Riley Phoenix</Text>
          </View>
          <Text style={styles.mascotCaption}>Your workout companion</Text>
        </View>

        {/* FEATURE CARDS */}
        <View style={styles.featuresContainer}>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={styles.featureCard}>
              <View style={styles.iconContainer}>
                {feature.icon === 'shield' && <ShieldCheckSVG />}
                {feature.icon === 'clock' && <ClockSVG />}
                {feature.icon === 'lock' && <LockSVG />}
                {feature.icon === 'heart' && <HeartSVG />}
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* SOCIAL PROOF (Optional) */}
        <View style={styles.socialProofContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>10K+</Text>
              <Text style={styles.statLabel}>Downloads</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4.8★</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>500+</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>

          <View style={styles.testimonialCard}>
            <Text style={styles.testimonialText}>
              "Finally, a fitness app that gets it. The binder-aware exercises are a game-changer."
            </Text>
            <Text style={styles.testimonialAuthor}>— Alex, 27</Text>
          </View>
        </View>

        {/* CTA SECTION */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
            <LinearGradient
              colors={['#00D9C0', '#00B39D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <View style={styles.buttonIconContainer}>
                <SparkleSVG />
              </View>
              <Text style={styles.buttonText}>Get Started Free</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleSignIn}>
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestLink} onPress={handleContinueAsGuest}>
            <Text style={styles.guestText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <View style={styles.footerContainer}>
          <Text style={styles.legalText}>
            By continuing, you agree to our{' '}
            <Text style={styles.legalLink} onPress={handleTerms}>
              Terms
            </Text>{' '}
            and{' '}
            <Text style={styles.legalLink} onPress={handlePrivacy}>
              Privacy Policy
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  heroContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 48,
    alignItems: 'center',
    position: 'relative',
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logoGradientCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    shadowColor: '#00D9C0',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    overflow: 'hidden',
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
  headlineContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
  headline: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 44,
    letterSpacing: -1,
    marginBottom: 12,
  },
  subheadline: {
    fontSize: 18,
    fontWeight: '500',
    color: '#B8C5C5',
    textAlign: 'center',
    lineHeight: 28,
  },
  mascotContainer: {
    marginVertical: 32,
    alignItems: 'center',
  },
  mascotPlaceholder: {
    width: 280,
    height: 280,
    borderRadius: 20,
    backgroundColor: '#1A1F26',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2A2F36',
  },
  mascotText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  mascotCaption: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  featuresContainer: {
    paddingHorizontal: 24,
    marginBottom: 48,
  },
  featureCard: {
    backgroundColor: '#1A1F26',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2F36',
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 217, 192, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 22,
    textAlign: 'left',
  },
  featureDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    lineHeight: 20,
    textAlign: 'left',
  },
  socialProofContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00D9C0',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  testimonialCard: {
    backgroundColor: 'rgba(0, 217, 192, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#00D9C0',
    width: '100%',
  },
  testimonialText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#B8C5C5',
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 21,
    textAlign: 'left',
  },
  testimonialAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00D9C0',
    textAlign: 'left',
  },
  ctaContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  primaryButton: {
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#00D9C0',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 20, 25, 0.15)',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F1419',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#2A2F36',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#E0E4E8',
  },
  guestLink: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  guestText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  footerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 0,
    alignItems: 'center',
  },
  legalText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  legalLink: {
    color: '#9CA3AF',
    textDecorationLine: 'underline',
  },
});
