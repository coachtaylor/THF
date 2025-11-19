import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import WhyTransFitness from '../screens/onboarding/WhyTransFitness';
import Disclaimer from '../screens/onboarding/Disclaimer';
import type { OnboardingStackParamList } from '../types/onboarding';
import Goals from '../screens/onboarding/intake/Goals';
import Constraints from '../screens/onboarding/intake/Constraints';
import Preferences from '../screens/onboarding/intake/Preferences';
import Review from '../screens/onboarding/intake/Review';
import QuickStart from '../screens/onboarding/QuickStart';
import PlanView from '../screens/plan/PlanView';

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
      <Stack.Screen name="Goals" component={Goals} />
      <Stack.Screen name="Constraints" component={Constraints} />
      <Stack.Screen name="Preferences" component={Preferences} />
      <Stack.Screen name="Review" component={Review} />
      <Stack.Screen name="QuickStart" component={QuickStart} />
      <Stack.Screen name="PlanView" component={PlanView} />
    </Stack.Navigator>
  );
}

