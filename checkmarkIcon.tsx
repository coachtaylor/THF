import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, { useAnimatedProps, withTiming, withDelay, useSharedValue } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

interface CheckmarkIconProps {
  size?: number;
  color?: string;
  delay?: number;
}

export const CheckmarkIcon: React.FC<CheckmarkIconProps> = ({ 
  size = 24, 
  color = '#00D9C0',
  delay = 0 
}) => {
  const circleProgress = useSharedValue(0);
  const checkProgress = useSharedValue(0);

  React.useEffect(() => {
    // Animate circle
    circleProgress.value = withDelay(
      delay,
      withTiming(1, { duration: 400 })
    );

    // Animate checkmark after circle
    checkProgress.value = withDelay(
      delay + 300,
      withTiming(1, { duration: 300 })
    );
  }, [delay]);

  const circleProps = useAnimatedProps(() => ({
    strokeDashoffset: 70 * (1 - circleProgress.value),
  }));

  const checkProps = useAnimatedProps(() => ({
    strokeDashoffset: 20 * (1 - checkProgress.value),
  }));

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Circle */}
      <AnimatedCircle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeDasharray="70"
        animatedProps={circleProps}
      />
      
      {/* Checkmark */}
      <AnimatedPath
        d="M7 12 L10.5 15.5 L17 9"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray="20"
        animatedProps={checkProps}
      />
    </Svg>
  );
};

// Simple static version for non-animated use
export const CheckmarkIconStatic: React.FC<{ size?: number; color?: string }> = ({ 
  size = 24, 
  color = '#00D9C0' 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
    <Path
      d="M7 12 L10.5 15.5 L17 9"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);