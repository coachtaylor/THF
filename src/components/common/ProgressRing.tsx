import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../theme/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type ProgressRingColor = 'primary' | 'secondary' | 'success' | 'warning' | 'neutral';

interface ProgressRingProps {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  color?: ProgressRingColor | string;
  backgroundColor?: string;
  animated?: boolean;
  duration?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}

const colorMap: Record<ProgressRingColor, string> = {
  primary: colors.accent.primary,
  secondary: colors.accent.secondary,
  success: colors.success,
  warning: colors.warning,
  neutral: colors.text.secondary,
};

export default function ProgressRing({
  progress = 0,
  size = 64,
  strokeWidth = 3,
  color = 'primary',
  backgroundColor = colors.glass.border,
  animated = true,
  duration = 1000,
  style,
  children,
}: ProgressRingProps) {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));

  // Resolve color
  const resolvedColor = colorMap[color as ProgressRingColor] || color;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedProgress, {
        toValue: clampedProgress,
        duration,
        useNativeDriver: false,
      }).start();
    } else {
      animatedProgress.setValue(clampedProgress);
    }
  }, [clampedProgress, animated]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress ring */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={resolvedColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {children && <View style={styles.childrenContainer}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
  childrenContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
