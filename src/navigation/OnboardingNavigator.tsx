import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from '../screens/onboarding/SplashScreen';
import TierSelectionScreen from '../screens/onboarding/TierSelectionScreen';
import WhyTransFitness from '../screens/onboarding/WhyTransFitness';
import Disclaimer from '../screens/onboarding/Disclaimer';
import type { OnboardingStackParamList } from '../types/onboarding';
import GenderIdentity from '../screens/onboarding/intake/GenderIdentity';
import HRTStatus from '../screens/onboarding/intake/HRTStatus';
import BindingInfo from '../screens/onboarding/intake/BindingInfo';
import Surgery from '../screens/onboarding/intake/Surgery';
import Goals from '../screens/onboarding/intake/Goals';
import TrainingEnvironment from '../screens/onboarding/intake/TrainingEnvironment';
import Experience from '../screens/onboarding/intake/Experience';
import WorkoutDays from '../screens/onboarding/intake/WorkoutDays';
import DysphoriaTriggers from '../screens/onboarding/intake/DysphoriaTriggers';
import Review from '../screens/onboarding/intake/Review';
import ProgramSetup from '../screens/onboarding/intake/ProgramSetup';
import PlanView from '../screens/plan/PlanView';
import HomeScreen from '../screens/main/HomeScreen';
import SessionPlayer from '../screens/SessionPlayer';

// Test screens - only import in development
const TimerTestScreen = __DEV__ ? require('../screens/TimerTestScreen').default : null;
const ExerciseDisplayTestScreen = __DEV__ ? require('../screens/ExerciseDisplayTestScreen').default : null;
import WorkoutSummaryScreen from '../screens/workout/WorkoutSummaryScreen';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

// Paywall
import PaywallScreen from '../screens/paywall/PaywallScreen';

const Stack = createStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Splash"
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="TierSelection" component={TierSelectionScreen} />
      <Stack.Screen name="WhyTransFitness" component={WhyTransFitness} />
      <Stack.Screen name="Disclaimer" component={Disclaimer} />
      <Stack.Screen name="GenderIdentity" component={GenderIdentity} />
      <Stack.Screen name="HRTStatus" component={HRTStatus} />
      <Stack.Screen name="BindingInfo" component={BindingInfo} />
      <Stack.Screen name="Surgery" component={Surgery} />
      <Stack.Screen name="Goals" component={Goals} />
      <Stack.Screen name="TrainingEnvironment" component={TrainingEnvironment} />
      <Stack.Screen name="Experience" component={Experience} />
      <Stack.Screen name="WorkoutDays" component={WorkoutDays} />
      <Stack.Screen name="DysphoriaTriggers" component={DysphoriaTriggers} />
      <Stack.Screen name="Review" component={Review} />
      <Stack.Screen name="ProgramSetup" component={ProgramSetup} />
      <Stack.Screen name="PlanView" component={PlanView} />
      <Stack.Screen name="Home" component={HomeScreen} />
      {/* Test screens - only available in development */}
      {__DEV__ && TimerTestScreen && (
        <Stack.Screen name="TimerTest" component={TimerTestScreen} />
      )}
      {__DEV__ && ExerciseDisplayTestScreen && (
        <Stack.Screen name="ExerciseDisplayTest" component={ExerciseDisplayTestScreen} />
      )}
      <Stack.Screen name="SessionPlayer" component={SessionPlayer} />
      <Stack.Screen name="WorkoutSummary" component={WorkoutSummaryScreen} />

      {/* Auth screens */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}

