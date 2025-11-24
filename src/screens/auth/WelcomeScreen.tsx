import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, typography } from '../../theme';

export default function WelcomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>TF</Text>
        </View>
        <Text style={styles.appName}>TransFitness</Text>
        <Text style={styles.tagline}>Affirming Fitness for Every Body</Text>
      </View>

      {/* Features */}
      <View style={styles.featuresContainer}>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>🎯</Text>
          <Text style={styles.featureText}>
            Personalized workouts for your unique journey
          </Text>
        </View>

        <View style={styles.feature}>
          <Text style={styles.featureIcon}>💪</Text>
          <Text style={styles.featureText}>HRT-aware programming</Text>
        </View>

        <View style={styles.feature}>
          <Text style={styles.featureIcon}>🔒</Text>
          <Text style={styles.featureText}>Binding-safe exercises</Text>
        </View>

        <View style={styles.feature}>
          <Text style={styles.featureIcon}>🏥</Text>
          <Text style={styles.featureText}>Post-op recovery support</Text>
        </View>
      </View>

      {/* CTA Buttons */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.signupButtonText}>Create Account →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>

      {/* Legal */}
      <Text style={styles.legalText}>
        By continuing, you agree to our{' '}
        <Text style={styles.legalLink}>Terms of Service</Text>
        {' '}and{' '}
        <Text style={styles.legalLink}>Privacy Policy</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.deepBlack,
    paddingHorizontal: spacing.l,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: spacing.xxl * 2,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: palette.tealPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  logoText: {
    ...typography.h1,
    color: palette.deepBlack,
    fontSize: 40,
    fontWeight: '800',
  },
  appName: {
    ...typography.h1,
    color: palette.white,
    marginBottom: spacing.xs,
  },
  tagline: {
    ...typography.body,
    color: palette.midGray,
    textAlign: 'center',
  },
  featuresContainer: {
    gap: spacing.m,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    ...typography.body,
    color: palette.lightGray,
    flex: 1,
  },
  ctaContainer: {
    gap: spacing.m,
    marginTop: spacing.xl,
  },
  signupButton: {
    backgroundColor: palette.tealPrimary,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
  },
  signupButtonText: {
    ...typography.button,
    color: palette.deepBlack,
    fontWeight: '700',
    fontSize: 18,
  },
  loginButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: palette.border,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
  },
  loginButtonText: {
    ...typography.button,
    color: palette.white,
    fontSize: 18,
  },
  legalText: {
    ...typography.bodySmall,
    color: palette.midGray,
    textAlign: 'center',
    marginTop: spacing.l,
  },
  legalLink: {
    color: palette.tealPrimary,
    textDecorationLine: 'underline',
  },
});

