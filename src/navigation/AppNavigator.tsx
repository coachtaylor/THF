import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import OnboardingNavigator from './OnboardingNavigator';

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <OnboardingNavigator />
    </NavigationContainer>
  );
}
