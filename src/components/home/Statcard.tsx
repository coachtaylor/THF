import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../theme/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularStatProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: number | string;
  label: string;
  progress?: number; // 0-1
  accentColor: 'primary' | 'secondary' | 'neutral';
}

// Progress ring component
function ProgressRing({
  progress = 0,
  size = 64,
  strokeWidth = 3,
  color,
}: {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
}) {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <Svg width={size} height={size} style={styles.progressRing}>
      {/* Background ring */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={colors.glass.border}
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      {/* Progress ring */}
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}

// Single circular stat item (Fitbit-style)
function CircularStat({ icon, value, label, progress = 0, accentColor }: CircularStatProps) {
  const getAccentColors = () => {
    switch (accentColor) {
      case 'primary':
        return {
          color: colors.accent.primary,
          glow: colors.accent.primaryGlow,
          bg: colors.glass.bgHero,
          border: colors.glass.borderCyan,
        };
      case 'secondary':
        return {
          color: colors.accent.secondary,
          glow: colors.accent.secondaryGlow,
          bg: colors.glass.bgHeroPink,
          border: colors.glass.borderPink,
        };
      default:
        return {
          color: colors.text.secondary,
          glow: 'rgba(255, 255, 255, 0.1)',
          bg: colors.glass.bg,
          border: colors.glass.border,
        };
    }
  };

  const accent = getAccentColors();

  return (
    <View style={styles.statItem}>
      {/* Circular icon container with progress ring */}
      <View style={styles.circleContainer}>
        {/* Progress ring */}
        <ProgressRing
          progress={progress}
          size={52}
          strokeWidth={2.5}
          color={accent.color}
        />

        {/* Inner circle with icon */}
        <View style={[styles.innerCircle, { backgroundColor: accent.bg, borderColor: accent.border }]}>
          <LinearGradient
            colors={[accent.bg, 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons
            name={icon}
            size={18}
            color={accent.color}
            style={[
              styles.icon,
              Platform.OS === 'ios' && {
                shadowColor: accent.color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 4,
              },
            ]}
          />
        </View>
      </View>

      {/* Value */}
      <Text style={[styles.value, { color: accent.color }]}>{value}</Text>

      {/* Label */}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

interface StatsRowProps {
  streak: number;
  weekProgress: string;
  total: number;
  weekGoal?: number; // e.g., 5 workouts per week
  streakGoal?: number; // e.g., 7 day streak goal
}

// Horizontal stats row with Fitbit-style circular icons
export function StatsRow({
  streak,
  weekProgress,
  total,
  weekGoal = 5,
  streakGoal = 7,
}: StatsRowProps) {
  // Parse week progress (e.g., "3/5" -> 0.6)
  const parseWeekProgress = () => {
    if (typeof weekProgress === 'string' && weekProgress.includes('/')) {
      const [current, goal] = weekProgress.split('/').map(Number);
      return current / goal;
    }
    return 0;
  };

  return (
    <View style={styles.container}>
      {/* Glass card background */}
      <LinearGradient
        colors={[colors.glass.bg, 'rgba(0,0,0,0)']}
        style={styles.glassBackground}
      />

      <CircularStat
        icon="flame"
        value={streak}
        label="Streak"
        progress={Math.min(streak / streakGoal, 1)}
        accentColor="primary"
      />

      <CircularStat
        icon="calendar"
        value={weekProgress}
        label="This Week"
        progress={parseWeekProgress()}
        accentColor="secondary"
      />

      <CircularStat
        icon="barbell"
        value={total}
        label="Total"
        progress={Math.min(total / 100, 1)} // Progress toward 100 workouts
        accentColor="neutral"
      />
    </View>
  );
}

// Legacy export for backwards compatibility
interface StatCardProps {
  value: number | string;
  label: string;
  iconType?: 'flame' | 'dumbbell' | 'time';
}

export default function StatCard({ value, label }: StatCardProps) {
  return (
    <View style={styles.legacyCard}>
      <Text style={styles.legacyValue}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  glassBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  circleContainer: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressRing: {
    position: 'absolute',
  },
  innerCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  icon: {
    // Shadow applied via Platform.select inline
  },
  value: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 1,
  },
  label: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '500',
    color: colors.text.tertiary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  // Legacy styles
  legacyCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  legacyValue: {
    fontFamily: 'Poppins',
    fontSize: 28,
    fontWeight: '300',
    color: colors.text.primary,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
});
