import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import WhyTransFitness from '../screens/onboarding/WhyTransFitness';
import Disclaimer from '../screens/onboarding/Disclaimer';
import type { OnboardingStackParamList } from '../types/onboarding';
import GenderIdentity from '../screens/onboarding/intake/GenderIdentity';
import HRTStatus from '../screens/onboarding/intake/HRTStatus';
import BindingInfo from '../screens/onboarding/intake/BindingInfo';
import Surgery from '../screens/onboarding/intake/Surgery';
import Goals from '../screens/onboarding/intake/Goals';
import Experience from '../screens/onboarding/intake/Experience';
import DysphoriaTriggers from '../screens/onboarding/intake/DysphoriaTriggers';
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
      <Stack.Screen name="HRTStatus" component={HRTStatus} />
      <Stack.Screen name="BindingInfo" component={BindingInfo} />
      <Stack.Screen name="Surgery" component={Surgery} />
      <Stack.Screen name="Goals" component={Goals} />
      <Stack.Screen name="Experience" component={Experience} />
      <Stack.Screen name="DysphoriaTriggers" component={DysphoriaTriggers} />
      <Stack.Screen name="Review" component={Review} />
      <Stack.Screen name="QuickStart" component={QuickStart} />
      <Stack.Screen name="PlanView" component={PlanView} />
      <Stack.Screen name="TimerTest" component={TimerTestScreen} />
      <Stack.Screen name="ExerciseDisplayTest" component={ExerciseDisplayTestScreen} />
      <Stack.Screen name="SessionPlayer" component={SessionPlayer} />
    </Stack.Navigator>
  );
}

