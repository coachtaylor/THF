// PhaseTransition component
// Brief interstitial shown when transitioning between workout phases

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WorkoutPhase } from '../../contexts/WorkoutContext';
import { colors, spacing, borderRadius } from '../../theme/theme';

interface PhaseTransitionProps {
  fromPhase: WorkoutPhase;
  toPhase: WorkoutPhase;
  visible: boolean;
  onComplete: () => void;
}

const PHASE_CONFIG: Record<WorkoutPhase, {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
}> = {
  warmup: {
    icon: 'flame-outline',
    title: 'Warm-Up',
    subtitle: 'Prepare your body',
    color: colors.accent.primary,
  },
  main: {
    icon: 'barbell-outline',
    title: 'Main Workout',
    subtitle: "Let's get to work",
    color: colors.accent.primary,
  },
  cooldown: {
    icon: 'leaf-outline',
    title: 'Cool-Down',
    subtitle: 'Stretch and recover',
    color: colors.accent.secondary,
  },
};

export function PhaseTransition({
  fromPhase,
  toPhase,
  visible,
  onComplete,
}: PhaseTransitionProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Auto-dismiss after 1.5 seconds
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(onComplete);
        }, 1500);
      });
    }
  }, [visible]);

  if (!visible) return null;

  const config = PHASE_CONFIG[toPhase];

  return (
    <Animated.View style={[
      styles.container,
      {
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      },
    ]}>
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.95)', 'rgba(0, 0, 0, 0.9)']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* Icon with glow */}
        <View style={[styles.iconContainer, { backgroundColor: `${config.color}20` }]}>
          <Ionicons name={config.icon} size={48} color={config.color} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: config.color }]}>
          {config.title}
        </Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          {config.subtitle}
        </Text>

        {/* Progress indicator */}
        <View style={styles.phaseIndicator}>
          {(['warmup', 'main', 'cooldown'] as WorkoutPhase[]).map((phase) => (
            <View
              key={phase}
              style={[
                styles.phaseDot,
                phase === toPhase && styles.phaseDotActive,
                phase === toPhase && { backgroundColor: config.color },
              ]}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.l,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
    }),
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: spacing.s,
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  phaseIndicator: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border.default,
  },
  phaseDotActive: {
    width: 24,
    borderRadius: 4,
  },
});

export default PhaseTransition;
