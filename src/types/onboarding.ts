// src/types/onboarding.ts
// UPDATED: Added 'mobility' to goal types to match database

import { Profile, Goal, Constraint, Equipment } from './index';
import { Workout } from './plan';

/**
 * SIMPLIFIED MVP ONBOARDING DATA
 * Only collects data that is actually used in workout generation
 */
export interface OnboardingData {
  // STEP 1: Primary Goal (REQUIRED)
  primaryGoal: 'strength' | 'cardio' | 'flexibility' | 'mobility';
  
  // STEP 2: Fitness Level (REQUIRED)
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  
  // STEP 3: Equipment (REQUIRED - at least 1)
  equipment: Equipment[];
  
  // STEP 4: Safety Constraints (OPTIONAL)
  binderAware: boolean;
  heavyBinding: boolean; // Only relevant if binderAware = true
}

/**
 * FULL ONBOARDING DATA (For future use)
 * Includes all optional fields that may be added back later
 */
export interface OnboardingDataFull extends OnboardingData {
  // Optional fields (not currently used in workout generation)
  secondaryGoal?: 'strength' | 'cardio' | 'flexibility' | 'mobility';
  programLength?: 1 | 4;
  lowSensoryMode?: boolean;
  postOpRecovery?: boolean;
  onHRT?: boolean;
  
  // Body focus preferences (not currently implemented)
  bodyFocusAreas?: BodyFocusArea[];
  goGentlyWith?: BodyArea[];
  
  // Movement constraints (not currently implemented)
  noJumping?: boolean;
  noFloorWork?: boolean;
  
  // Surgery history (not currently implemented)
  surgeryHistory?: SurgeryType[];
  surgeonCleared?: boolean;
}

export type BodyFocusArea = 
  | 'legs' 
  | 'glutes' 
  | 'back' 
  | 'core' 
  | 'shoulders' 
  | 'arms' 
  | 'chest';

export type BodyArea = 
  | 'chest' 
  | 'hips' 
  | 'glutes' 
  | 'abdomen' 
  | 'shoulders';

export type SurgeryType = 
  | 'top_surgery' 
  | 'bottom_surgery' 
  | 'other';

/**
 * Convert simplified onboarding data to Profile
 * This is the core mapping function
 */
export function onboardingToProfile(data: OnboardingData, userId: string): Profile {
  // Build constraints array based on selections
  const constraints: Constraint[] = [];
  
  if (data.binderAware) {
    constraints.push('binder_aware');
  }
  
  if (data.heavyBinding && data.binderAware) {
    constraints.push('heavy_binding');
  }
  
  return {
    // NEW REQUIRED FIELDS
    id: userId,
    user_id: userId,
    gender_identity: 'nonbinary', // Default, should be set from data
    on_hrt: false, // Default, should be set from data
    binds_chest: false, // Default, should be set from data
    surgeries: [],
    primary_goal: 'general_fitness', // Default, should be set from data
    fitness_experience: data.fitnessLevel || 'beginner',
    workout_frequency: 3, // Default
    session_duration: 30, // Default
    equipment: data.equipment || [],
    
    // KEEP OLD FIELDS (for compatibility)
    goals: [data.primaryGoal as Goal],
    goalWeighting: {
      primary: 1.0, // 100% weight on primary goal for MVP
      secondary: 0.0,
    },
    goal_weighting: {
      primary: 100,
      secondary: 0,
    },
    constraints,
    preferences: {
      workoutDurations: [5, 15, 30, 45], // All durations available
      blockLength: 4, // Default to 4-week program
      equipment: data.equipment,
      lowSensoryMode: false, // Default off
    },
    block_length: 4,
    low_sensory_mode: false,
    
    // METADATA
    created_at: new Date(),
    updated_at: new Date(),
  };
}

/**
 * Convert full onboarding data to Profile (for future use)
 */
export function onboardingFullToProfile(
  data: OnboardingDataFull,
  userId: string
): Profile {
  const baseProfile = onboardingToProfile(data, userId);
  
  // Add secondary goal if provided
  if (data.secondaryGoal) {
    baseProfile.goals = baseProfile.goals || [];
    baseProfile.goals.push(data.secondaryGoal as Goal);
    baseProfile.goalWeighting = {
      primary: 0.7,
      secondary: 0.3,
    };
    baseProfile.goal_weighting = {
      primary: 70,
      secondary: 30,
    };
  }
  
  // Add optional constraints
  if (data.postOpRecovery) {
    baseProfile.constraints = baseProfile.constraints || [];
    baseProfile.constraints.push('post_op');
  }
  
  if (data.onHRT) {
    baseProfile.on_hrt = true;
    baseProfile.constraints = baseProfile.constraints || [];
    baseProfile.constraints.push('hrt');
  }
  
  // Add optional preferences
  if (data.programLength && baseProfile.preferences) {
    baseProfile.preferences.blockLength = data.programLength;
    baseProfile.block_length = data.programLength;
  }
  
  if (data.lowSensoryMode && baseProfile.preferences) {
    baseProfile.preferences.lowSensoryMode = true;
    baseProfile.low_sensory_mode = true;
  }
  
  return baseProfile;
}

/**
 * Validation: Ensure onboarding data is complete
 */
export function validateOnboardingData(data: Partial<OnboardingData>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check required fields
  if (!data.primaryGoal) {
    errors.push('Primary goal is required');
  }
  
  if (!data.fitnessLevel) {
    errors.push('Fitness level is required');
  }
  
  if (!data.equipment || data.equipment.length === 0) {
    errors.push('At least one equipment type must be selected');
  }
  
  // Validate heavy binding requires binder aware
  if (data.heavyBinding && !data.binderAware) {
    errors.push('Heavy binding can only be selected if binder aware is selected');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Default onboarding data (for testing)
 */
export const defaultOnboardingData: OnboardingData = {
  primaryGoal: 'strength',
  fitnessLevel: 'beginner',
  equipment: ['bodyweight'],
  binderAware: false,
  heavyBinding: false,
};

/**
 * Example onboarding scenarios (for testing)
 */
export const onboardingExamples = {
  beginnerBodyweight: {
    primaryGoal: 'strength' as const,
    fitnessLevel: 'beginner' as const,
    equipment: ['bodyweight'] as Equipment[],
    binderAware: false,
    heavyBinding: false,
  },
  
  intermediateWithBinder: {
    primaryGoal: 'cardio' as const,
    fitnessLevel: 'intermediate' as const,
    equipment: ['bodyweight', 'bands'] as Equipment[],
    binderAware: true,
    heavyBinding: false,
  },
  
  advancedHeavyBinding: {
    primaryGoal: 'strength' as const,
    fitnessLevel: 'advanced' as const,
    equipment: ['bodyweight', 'bands', 'kettlebell'] as Equipment[],
    binderAware: true,
    heavyBinding: true,
  },
  
  mobilityFocused: {
    primaryGoal: 'mobility' as const,
    fitnessLevel: 'beginner' as const,
    equipment: ['bodyweight', 'mat'] as Equipment[],
    binderAware: false,
    heavyBinding: false,
  },
};

/**
 * Navigation types for onboarding stack
 */
import { StackNavigationProp } from '@react-navigation/stack';

export type OnboardingStackParamList = {
  WhyTransFitness: undefined;
  Disclaimer: undefined;
  GenderIdentity: undefined;
  HRTStatus: undefined;
  BindingInfo: undefined;
  Surgery: undefined;
  Goals: undefined;
  Experience: undefined;
  DysphoriaTriggers: undefined;
  Review: undefined;
  QuickStart: undefined;
  PlanView: undefined;
  TimerTest: undefined;
  ExerciseDisplayTest: undefined;
  SessionPlayer: {
    workout: Workout;
    planId?: string;
  };
};

export type OnboardingScreenProps<T extends keyof OnboardingStackParamList> = {
  navigation: StackNavigationProp<OnboardingStackParamList, T>;
  route?: any;
};

export interface WhyTransFitnessContent {
  headline: string;
  bullets: string[];
  ctaText: string;
  skipText: string;
}