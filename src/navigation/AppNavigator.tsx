import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import OnboardingNavigator from './OnboardingNavigator';
import MainNavigator from './MainNavigator';
import { getProfile } from '../services/storage/profile';

export default function AppNavigator() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        const profile = await getProfile();
        setHasCompletedOnboarding(profile !== null);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setHasCompletedOnboarding(false);
      }
    }
    checkOnboardingStatus();
  }, []);

  // Show nothing while checking onboarding status
  if (hasCompletedOnboarding === null) {
    return null;
  }

  return (
    <NavigationContainer>
      {hasCompletedOnboarding ? <MainNavigator /> : <OnboardingNavigator />}
    </NavigationContainer>
  );
}
