import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import WhyTransFitness from '../screens/onboarding/WhyTransFitness';
import Disclaimer from '../screens/onboarding/Disclaimer';
import type { OnboardingStackParamList } from '../types/onboarding';

const Stack = createStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="WhyTransFitness" component={WhyTransFitness} />
      <Stack.Screen name="Disclaimer" component={Disclaimer} />
    </Stack.Navigator>
  );
}

