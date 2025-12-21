// TransFitness - Centralized Navigation Type Definitions
// All navigation param lists should be defined here to ensure type safety

import { NavigatorScreenParams } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp, StackScreenProps } from '@react-navigation/stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import type { Day, ExerciseInstance } from './plan';

// ============================================================================
// Main Tab Navigator Types
// ============================================================================

export type MainTabParamList = {
  Home: undefined;
  Workouts: undefined;
  Saved: undefined;
  Progress: undefined;
  Settings: undefined;
};

// ============================================================================
// Main Stack Navigator Types (wraps tabs and includes modal screens)
// ============================================================================

export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  WorkoutOverview: {
    dayIndex: number;
    weekIndex?: number;
    day?: Day;
    exercises?: ExerciseInstance[];
    workoutName?: string;
  };
  SessionPlayer: {
    dayIndex: number;
    weekIndex?: number;
    day?: Day;
    exercises?: ExerciseInstance[];
    workoutName?: string;
  };
  ActiveWorkout: {
    dayIndex: number;
    weekIndex?: number;
    day?: Day;
    exercises?: ExerciseInstance[];
    workoutName?: string;
  };
  WorkoutSummary: {
    dayIndex?: number;
    weekIndex?: number;
    duration?: number;
    completedSets?: number;
    totalVolume?: number;
    averageRPE?: number;
    exercises?: Array<{
      name: string;
      sets: number;
      volume: number;
    }>;
  };
  WorkoutSwap: {
    exerciseId: string;
    exerciseName: string;
    currentExercise?: ExerciseInstance;
    onSwapComplete?: (newExercise: ExerciseInstance) => void;
  };
  BinderSafetyGuide: undefined;
  PostOpMovementGuide: undefined;
  Copilot: undefined;
  ExerciseLibrary: {
    onSelectExercise?: (exercise: ExerciseInstance) => void;
    filterCategory?: string;
  };
  RestDayOverview: {
    dayIndex: number;
    weekIndex?: number;
  };
  Paywall: undefined;
};

// ============================================================================
// Composite Navigation Types (for screens that need access to both stack and tabs)
// ============================================================================

export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

export type MainStackNavigationProp = StackNavigationProp<MainStackParamList>;

// Combined navigation prop for tab screens that also need stack navigation
export type CombinedNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  StackNavigationProp<MainStackParamList>
>;

// ============================================================================
// Screen Props Types
// ============================================================================

export type HomeScreenProps = StackScreenProps<MainStackParamList, 'MainTabs'>;
export type WorkoutOverviewScreenProps = StackScreenProps<MainStackParamList, 'WorkoutOverview'>;
export type SessionPlayerScreenProps = StackScreenProps<MainStackParamList, 'SessionPlayer'>;
export type ActiveWorkoutScreenProps = StackScreenProps<MainStackParamList, 'ActiveWorkout'>;
export type WorkoutSummaryScreenProps = StackScreenProps<MainStackParamList, 'WorkoutSummary'>;
export type RestDayOverviewScreenProps = StackScreenProps<MainStackParamList, 'RestDayOverview'>;
export type ExerciseLibraryScreenProps = StackScreenProps<MainStackParamList, 'ExerciseLibrary'>;

// ============================================================================
// React Navigation Global Types
// ============================================================================

declare global {
  namespace ReactNavigation {
    interface RootParamList extends MainStackParamList {}
  }
}
