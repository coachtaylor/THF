// ExerciseDemoPlaceholder component
// Displays a placeholder for exercise demonstrations with expandable tips

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';

interface ExerciseDemoPlaceholderProps {
  exerciseName: string;
  targetMuscles?: string;
  tips?: string[];
  externalLink?: string;
}

export function ExerciseDemoPlaceholder({
  exerciseName,
  targetMuscles,
  tips = [],
  externalLink,
}: ExerciseDemoPlaceholderProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Default tips if none provided
  const displayTips = tips.length > 0 ? tips : getDefaultTips(exerciseName);

  const handleExternalLink = () => {
    if (externalLink) {
      Linking.openURL(externalLink);
    }
  };

  return (
    <View style={styles.container}>
      {/* Demo Placeholder */}
      <Pressable
        style={({ pressed }) => [
          styles.demoCard,
          pressed && styles.demoCardPressed,
        ]}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <LinearGradient
          colors={['#1a1a1f', '#141418']}
          style={StyleSheet.absoluteFill}
        />

        {/* Placeholder visual */}
        <View style={styles.placeholderVisual}>
          <View style={styles.iconCircle}>
            <Ionicons name="videocam-outline" size={28} color={colors.accent.primary} />
          </View>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Demo Coming Soon</Text>
          </View>
        </View>

        {/* Expand hint */}
        <View style={styles.expandHint}>
          <Text style={styles.expandHintText}>
            {isExpanded ? 'Tap to collapse' : 'Tap for exercise tips'}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.text.tertiary}
          />
        </View>
      </Pressable>

      {/* Expandable Tips Section */}
      {isExpanded && (
        <View style={styles.tipsSection}>
          <LinearGradient
            colors={['rgba(91, 206, 250, 0.08)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />

          {/* Target Muscles */}
          {targetMuscles && (
            <View style={styles.muscleRow}>
              <View style={styles.muscleIcon}>
                <Ionicons name="body-outline" size={16} color={colors.accent.primary} />
              </View>
              <View>
                <Text style={styles.muscleLabel}>Target Muscles</Text>
                <Text style={styles.muscleValue}>{targetMuscles}</Text>
              </View>
            </View>
          )}

          {/* Tips List */}
          <View style={styles.tipsList}>
            <Text style={styles.tipsTitle}>Exercise Tips</Text>
            {displayTips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <View style={styles.tipBullet}>
                  <Text style={styles.tipBulletText}>{index + 1}</Text>
                </View>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* External Link */}
          {externalLink && (
            <Pressable
              style={({ pressed }) => [
                styles.linkButton,
                pressed && styles.linkButtonPressed,
              ]}
              onPress={handleExternalLink}
            >
              <Ionicons name="open-outline" size={16} color={colors.accent.primary} />
              <Text style={styles.linkButtonText}>View on ExRx.net</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

// Get default tips based on exercise name
function getDefaultTips(exerciseName: string): string[] {
  const name = exerciseName.toLowerCase();

  if (name.includes('squat')) {
    return [
      'Keep your chest up and core engaged',
      'Push through your heels as you stand',
      'Keep knees tracking over toes',
      'Descend until thighs are parallel (or as comfortable)',
    ];
  }

  if (name.includes('deadlift')) {
    return [
      'Maintain a neutral spine throughout',
      'Engage your lats before lifting',
      'Drive through your heels',
      'Keep the bar close to your body',
    ];
  }

  if (name.includes('bench') || name.includes('press')) {
    return [
      'Plant your feet firmly on the floor',
      'Keep shoulder blades retracted',
      'Lower the weight with control',
      'Full range of motion when possible',
    ];
  }

  if (name.includes('row')) {
    return [
      'Squeeze your shoulder blades together',
      'Keep your core tight',
      'Control the eccentric (lowering) phase',
      'Avoid using momentum',
    ];
  }

  if (name.includes('curl')) {
    return [
      'Keep your elbows fixed at your sides',
      'Avoid swinging or using momentum',
      'Squeeze at the top of the movement',
      'Lower with control',
    ];
  }

  // Generic tips
  return [
    'Focus on proper form over heavy weight',
    'Breathe out on exertion, in on release',
    'Control the weight through full range of motion',
    'Stop if you feel pain (not just muscle burn)',
  ];
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.m,
  },
  demoCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  demoCardPressed: {
    opacity: 0.9,
  },
  placeholderVisual: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.m,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
  },
  comingSoonBadge: {
    backgroundColor: colors.glass.bg,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  comingSoonText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.tertiary,
    letterSpacing: 0.5,
  },
  expandHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
    paddingBottom: spacing.m,
  },
  expandHintText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: colors.text.tertiary,
  },
  tipsSection: {
    marginTop: spacing.xs,
    borderRadius: borderRadius.lg,
    padding: spacing.m,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
  },
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    marginBottom: spacing.m,
    paddingBottom: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  muscleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  muscleLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  muscleValue: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  tipsList: {
    gap: spacing.s,
  },
  tipsTitle: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s,
  },
  tipBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.glass.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  tipBulletText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  tipText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.m,
    paddingVertical: spacing.s,
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.m,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  linkButtonPressed: {
    opacity: 0.8,
  },
  linkButtonText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: colors.accent.primary,
  },
});

export default ExerciseDemoPlaceholder;
