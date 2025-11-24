import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import WhyTransFitness from '../screens/onboarding/WhyTransFitness';
import Disclaimer from '../screens/onboarding/Disclaimer';
import type { OnboardingStackParamList } from '../types/onboarding';
import GenderIdentity from '../screens/onboarding/intake/GenderIdentity';
import HRTAndBinding from '../screens/onboarding/intake/HRTAndBinding';
import Surgery from '../screens/onboarding/intake/Surgery';
import GoalsAndPreferences from '../screens/onboarding/intake/GoalsAndPreferences';
import ProgramSetup from '../screens/onboarding/intake/ProgramSetup';
import Constraints from '../screens/onboarding/intake/Constraints';
import Review from '../screens/onboarding/intake/Review';
import QuickStart from '../screens/onboarding/QuickStart';
import PlanView from '../screens/plan/PlanView';
import TimerTestScreen from '../screens/TimerTestScreen';
import ExerciseDisplayTestScreen from '../screens/ExerciseDisplayTestScreen';
import SessionPlayer from '../screens/SessionPlayer';

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
      <Stack.Screen name="GenderIdentity" component={GenderIdentity} />
      <Stack.Screen name="Goals" component={GoalsAndPreferences} />
      <Stack.Screen name="HRTAndBinding" component={HRTAndBinding} />
      <Stack.Screen name="Surgery" component={Surgery} />
      <Stack.Screen name="Review" component={Review} />
      <Stack.Screen name="QuickStart" component={QuickStart} />
      <Stack.Screen name="PlanView" component={PlanView} />
      <Stack.Screen name="TimerTest" component={TimerTestScreen} />
      <Stack.Screen name="ExerciseDisplayTest" component={ExerciseDisplayTestScreen} />
      <Stack.Screen name="SessionPlayer" component={SessionPlayer} />
    </Stack.Navigator>
  );
}

