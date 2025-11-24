import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { initializeSession } from '../../services/auth/session';
import { palette, spacing, typography } from '../../theme';

export default function SplashScreen({ navigation }: any) {
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const session = await initializeSession();

      // Add small delay for better UX (show logo briefly)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (session.isAuthenticated && session.user) {
        if (session.user.onboarding_completed) {
          // User is fully set up, go to main app
          navigation.replace('Main');
        } else {
          // User needs to complete onboarding
          navigation.replace('Onboarding');
        }
      } else {
        // No session, go to welcome
        navigation.replace('Welcome');
      }
    } catch (error) {
      console.error('Session check failed:', error);
      // On error, go to welcome
      navigation.replace('Welcome');
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo/App Name */}
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>TF</Text>
        </View>
        <Text style={styles.appName}>TransFitness</Text>
        <Text style={styles.tagline}>Affirming Fitness for Every Body</Text>
      </View>

      {/* Loading Indicator */}
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={palette.tealPrimary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.deepBlack,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: palette.tealPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  logoText: {
    ...typography.h1,
    color: palette.deepBlack,
    fontSize: 48,
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
  loadingContainer: {
    position: 'absolute',
    bottom: spacing.xxl * 2,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: palette.midGray,
    marginTop: spacing.m,
  },
});

