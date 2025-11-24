import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import OnboardingNavigator from './src/navigation/OnboardingNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import { checkOnboardingStatus } from './src/services/storage/onboarding';
import { initializeApp } from './src/services/init';
import { theme } from './src/theme';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      // Initialize database, storage, services
      await initializeApp();

      // Check if user has completed onboarding
      const completed = await checkOnboardingStatus();
      setHasCompletedOnboarding(completed);

      setIsReady(true);
    } catch (error) {
      console.error('App initialization failed:', error);
      setIsReady(true); // Still show app even if initialization fails
    }
  };

  if (!isReady) {
    return null; // Or loading screen
  }

  return (
    <SafeAreaProvider style={{ backgroundColor: theme.colors.background }}>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          {hasCompletedOnboarding ? <MainNavigator /> : <OnboardingNavigator />}
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
