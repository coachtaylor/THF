// QuickActions component
// Provides quick access to exercise library and other common actions from home

import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';

type MainStackParamList = {
  ExerciseLibrary: { mode: 'browse' | 'swap' };
  SafetyGuides: undefined;
  SavedWorkouts: undefined;
  [key: string]: any;
};

type QuickActionsNavigationProp = StackNavigationProp<MainStackParamList>;

interface QuickActionItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  screen: keyof MainStackParamList;
  params?: any;
  color: 'primary' | 'secondary' | 'success';
}

const quickActions: QuickActionItem[] = [
  {
    icon: 'fitness-outline',
    label: 'Exercises',
    screen: 'ExerciseLibrary',
    params: { mode: 'browse' },
    color: 'primary',
  },
  {
    icon: 'bookmark-outline',
    label: 'Saved',
    screen: 'SavedWorkouts',
    color: 'secondary',
  },
  {
    icon: 'shield-checkmark-outline',
    label: 'Safety',
    screen: 'SafetyGuides',
    color: 'success',
  },
];

export function QuickActions() {
  const navigation = useNavigation<QuickActionsNavigationProp>();

  const getColorStyles = (color: 'primary' | 'secondary' | 'success') => {
    switch (color) {
      case 'primary':
        return {
          bg: colors.accent.primaryMuted,
          icon: colors.accent.primary,
          gradient: ['rgba(91, 206, 250, 0.15)', 'transparent'] as [string, string],
        };
      case 'secondary':
        return {
          bg: colors.accent.secondaryMuted,
          icon: colors.accent.secondary,
          gradient: ['rgba(245, 169, 184, 0.15)', 'transparent'] as [string, string],
        };
      case 'success':
        return {
          bg: colors.accent.successMuted,
          icon: colors.success,
          gradient: ['rgba(52, 211, 153, 0.15)', 'transparent'] as [string, string],
        };
    }
  };

  const handlePress = (action: QuickActionItem) => {
    try {
      navigation.navigate(action.screen, action.params);
    } catch (error) {
      console.log(`Navigate to ${action.screen}`, action.params);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>

      <View style={styles.actionsRow}>
        {quickActions.map((action) => {
          const colorStyles = getColorStyles(action.color);

          return (
            <Pressable
              key={action.screen}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={() => handlePress(action)}
            >
              <LinearGradient
                colors={['#141418', '#0A0A0C']}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={colorStyles.gradient}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.actionGlow}
              />
              <View style={styles.glassHighlight} />

              <View style={[styles.iconContainer, { backgroundColor: colorStyles.bg }]}>
                <Ionicons name={action.icon} size={22} color={colorStyles.icon} />
              </View>

              <Text style={styles.actionLabel}>{action.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.l,
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.m,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.l,
    paddingHorizontal: spacing.m,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  actionButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  actionGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '80%',
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  actionLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default QuickActions;
