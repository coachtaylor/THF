import React, { useState, useEffect } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
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
import { theme } from './src/theme';

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
      console.log('🔍 App initialization - Onboarding status:', completed);
      
      // Debug: Check what profile exists
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

  console.log('🔍 App render - hasCompletedOnboarding:', hasCompletedOnboarding);
  console.log('🔍 App render - Rendering:', hasCompletedOnboarding ? 'MainNavigator' : 'OnboardingNavigator');

  return (
    <SafeAreaProvider style={{ backgroundColor: theme.colors.background }}>
      <PaperProvider theme={theme}>
        <NavigationContainer ref={navigationRef}>
          {hasCompletedOnboarding ? <MainNavigator /> : <OnboardingNavigator />}
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
