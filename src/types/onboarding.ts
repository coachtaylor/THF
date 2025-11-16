// TransFitness - Onboarding type definitions

import type { StackNavigationProp } from '@react-navigation/stack';

export type OnboardingStackParamList = {
  WhyTransFitness: undefined;
  Disclaimer: undefined;
  Goals: undefined;
  QuickStart: undefined;
};

export interface OnboardingScreenProps<RouteName extends keyof OnboardingStackParamList = 'WhyTransFitness'> {
  navigation: StackNavigationProp<OnboardingStackParamList, RouteName>;
}

export interface WhyTransFitnessContent {
  headline: string;
  bullets: string[];
  ctaText: string;
  skipText: string;
}

