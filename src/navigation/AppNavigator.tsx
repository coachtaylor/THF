import React from 'react';
import OnboardingNavigator from './OnboardingNavigator';
import MainNavigator from './MainNavigator';

type AppNavigatorProps = {
  hasCompletedOnboarding: boolean;
};

export default function AppNavigator({ hasCompletedOnboarding }: AppNavigatorProps) {
  return hasCompletedOnboarding ? <MainNavigator /> : <OnboardingNavigator />;
}
