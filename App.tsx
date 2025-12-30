import React, { useState, useEffect } from 'react';
import { NavigationContainer, useNavigationContainerRef, LinkingOptions } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import * as Sentry from '@sentry/react-native';
import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Anton_400Regular } from '@expo-google-fonts/anton';
import './src/index.css';
import OnboardingNavigator from './src/navigation/OnboardingNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import { checkOnboardingStatus } from './src/services/storage/onboarding';
import { initializeApp } from './src/services/init';
import { setupDeepLinking } from './src/services/auth/deepLinking';
import { onOnboardingComplete, clearOnboardingCallback, onLogout, clearLogoutCallback } from './src/services/events/onboardingEvents';
import { AuthProvider } from './src/contexts/AuthContext';
import { SubscriptionProvider } from './src/contexts/SubscriptionContext';
import { ToastProvider } from './src/contexts/ToastContext';
import { SensoryModeProvider } from './src/contexts/SensoryModeContext';
import { SyncProvider } from './src/contexts/SyncContext';
import { theme } from './src/theme';

// Initialize Sentry for error tracking
// Privacy-safe: Only sends anonymized error data, no personal info
Sentry.init({
  dsn: process.env.SENTRY_DSN || '', // Add your Sentry DSN to .env
  enabled: !__DEV__, // Only enable in production
  debug: __DEV__, // Enable debug mode in development
  tracesSampleRate: 0.2, // Sample 20% of transactions for performance monitoring
  // Privacy: Don't send any PII
  beforeSend(event) {
    // Remove any potential PII from the event
    if (event.user) {
      delete event.user.email;
      delete event.user.username;
      delete event.user.ip_address;
    }
    return event;
  },
  // Don't capture breadcrumbs that might contain sensitive data
  beforeBreadcrumb(breadcrumb) {
    // Filter out console breadcrumbs that might contain sensitive info
    if (breadcrumb.category === 'console') {
      return null;
    }
    return breadcrumb;
  },
});

// Deep linking configuration for React Navigation
const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: [
    Linking.createURL('/'),
    'transfitness://',
    'https://transfitness.app',
  ],
  config: {
    screens: {
      // Auth screens (OnboardingNavigator)
      Login: 'login',
      EmailVerification: 'verify-email',
      ResetPassword: 'reset-password',
      // Main app screens
      Home: 'home',
      Workouts: 'workouts',
      Progress: 'progress',
      Settings: 'settings',
    },
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Anton_400Regular,
    // Map to simple names for easier use
    'Poppins': Poppins_400Regular,
    'Poppins-Light': Poppins_300Light,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
    'Anton': Anton_400Regular,
  });

  const [isReady, setIsReady] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    initialize();
  }, []);

  // Listen for onboarding completion event
  useEffect(() => {
    onOnboardingComplete(() => {
      if (__DEV__) console.log('📱 App received onboarding complete signal');
      setHasCompletedOnboarding(true);
    });

    return () => {
      clearOnboardingCallback();
    };
  }, []);

  // Listen for logout event
  useEffect(() => {
    onLogout(() => {
      if (__DEV__) console.log('📱 App received logout signal');
      setHasCompletedOnboarding(false);
    });

    return () => {
      clearLogoutCallback();
    };
  }, []);

  useEffect(() => {
    // Setup deep linking once navigation is ready
    if (isReady && navigationRef.current) {
      const cleanup = setupDeepLinking(navigationRef.current);
      return cleanup;
    }
  }, [isReady, navigationRef]);

  const initialize = async () => {
    try {
      // Initialize database, storage, services
      await initializeApp();

      // Check if user has completed onboarding
      const completed = await checkOnboardingStatus();

      // Debug logging (development only)
      if (__DEV__) {
        console.log('🔍 App initialization - Onboarding status:', completed);
        const { getProfile, debugProfileStorage } = await import('./src/services/storage/profile');
        const profile = await getProfile();
        console.log('🔍 Current profile on app start:', profile ? 'EXISTS' : 'NULL');
        if (profile) {
          console.log('🔍 Profile fields check:');
          console.log('  - gender_identity:', profile.gender_identity);
          console.log('  - primary_goal:', profile.primary_goal);
          console.log('  - fitness_experience:', profile.fitness_experience);
          console.log('  - id:', profile.id || profile.user_id);
        } else {
          console.log('🔍 No profile found in database');
        }
        await debugProfileStorage();
      }

      setHasCompletedOnboarding(completed);

      setIsReady(true);
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      setIsReady(true); // Still show app even if initialization fails
    }
  };

  if (!fontsLoaded || !isReady) {
    return null; // Wait for fonts and initialization
  }

  if (__DEV__) {
    console.log('🔍 App render - hasCompletedOnboarding:', hasCompletedOnboarding);
    console.log('🔍 App render - Rendering:', hasCompletedOnboarding ? 'MainNavigator' : 'OnboardingNavigator');
  }

  return (
    <SafeAreaProvider style={{ backgroundColor: theme.colors.background }}>
      <PaperProvider theme={theme}>
        <ToastProvider>
          <AuthProvider>
            <SensoryModeProvider>
              <SyncProvider>
                <SubscriptionProvider>
                  <NavigationContainer ref={navigationRef} linking={linking}>
                    {hasCompletedOnboarding ? <MainNavigator /> : <OnboardingNavigator />}
                  </NavigationContainer>
                </SubscriptionProvider>
              </SyncProvider>
            </SensoryModeProvider>
          </AuthProvider>
        </ToastProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
