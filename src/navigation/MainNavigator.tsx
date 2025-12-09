import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { palette, spacing } from '../theme';

import HomeScreen from '../screens/main/HomeScreen';
import WorkoutsScreen from '../screens/main/WorkoutsScreen';
import ProgressScreen from '../screens/main/ProgressScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import SavedWorkoutsScreen from '../screens/main/SavedWorkoutsScreen';
import WorkoutOverviewScreen from '../screens/workout/WorkoutOverviewScreen';
import SessionPlayer from '../screens/SessionPlayer';
import ActiveWorkoutScreen from '../screens/workout/ActiveWorkoutScreen';
import WorkoutSummaryScreen from '../screens/workout/WorkoutSummaryScreen';
import WorkoutSwapScreen from '../screens/workout/WorkoutSwapScreen';
import { BinderSafetyGuide, PostOpMovementGuide } from '../screens/guides';
import { CopilotScreen } from '../screens/copilot';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Profile button component that navigates to Settings
function ProfileButton() {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Settings')}
      style={{ marginRight: spacing.l, padding: spacing.xs }}
    >
      <Ionicons name="person-circle-outline" size={28} color={palette.white} />
    </TouchableOpacity>
  );
}

// Bottom Tab Navigator for main screens
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: palette.deepBlack,
          borderBottomWidth: 1,
          borderBottomColor: palette.border,
        },
        headerTintColor: palette.white,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
        },
        headerRight: () => <ProfileButton />,
        tabBarActiveTintColor: palette.tealPrimary,
        tabBarInactiveTintColor: palette.midGray,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: palette.deepBlack,
          borderTopColor: palette.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingHorizontal: 16,
          height: 85,
          paddingBottom: 25,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false, // HomeScreen has custom header
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Workouts"
        component={WorkoutsScreen}
        options={{
          headerShown: false, // WorkoutsScreen has custom header
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Saved"
        component={SavedWorkoutsScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: false, // SettingsScreen has custom header
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Stack Navigator that wraps tabs and includes workout screens
export default function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="WorkoutOverview"
        component={WorkoutOverviewScreen}
      />
      <Stack.Screen
        name="SessionPlayer"
        component={SessionPlayer}
      />
      <Stack.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
      />
      <Stack.Screen
        name="WorkoutSummary"
        component={WorkoutSummaryScreen}
      />
      <Stack.Screen
        name="WorkoutSwap"
        component={WorkoutSwapScreen}
      />
      <Stack.Screen
        name="BinderSafetyGuide"
        component={BinderSafetyGuide}
      />
      <Stack.Screen
        name="PostOpMovementGuide"
        component={PostOpMovementGuide}
      />
      <Stack.Screen
        name="Copilot"
        component={CopilotScreen}
      />
    </Stack.Navigator>
  );
}

