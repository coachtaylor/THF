import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

interface ModernCheckboxProps {
  checked: boolean;
  onPress: () => void;
  label: string;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function ModernCheckbox({ checked, onPress, label }: ModernCheckboxProps) {
  const scale = useSharedValue(checked ? 1 : 0.8);
  const checkmarkProgress = useSharedValue(checked ? 1 : 0);
  const borderColor = useSharedValue(checked ? 1 : 0);
  const backgroundColor = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    if (checked) {
      scale.value = withSpring(1, {
        damping: 12,
        stiffness: 200,
      });
      checkmarkProgress.value = withTiming(1, {
        duration: 300,
      });
      borderColor.value = withTiming(1, {
        duration: 200,
      });
      backgroundColor.value = withTiming(1, {
        duration: 200,
      });
    } else {
      scale.value = withSpring(0.8, {
        damping: 12,
        stiffness: 200,
      });
      checkmarkProgress.value = withTiming(0, {
        duration: 200,
      });
      borderColor.value = withTiming(0, {
        duration: 200,
      });
      backgroundColor.value = withTiming(0, {
        duration: 200,
      });
    }
  }, [checked]);

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const checkboxAnimatedStyle = useAnimatedStyle(() => {
    const borderColorValue = interpolate(
      borderColor.value,
      [0, 1],
      [0, 1],
      Extrapolate.CLAMP
    );
    const backgroundColorValue = interpolate(
      backgroundColor.value,
      [0, 1],
      [0, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale: scale.value }],
      borderColor: borderColorValue === 1 ? '#00D9C0' : '#2A2F36',
      backgroundColor: backgroundColorValue === 1 ? '#00D9C0' : 'transparent',
    };
  });

  const checkmarkAnimatedProps = useAnimatedProps(() => {
    // Checkmark path length is approximately 18
    const pathLength = 18;
    const strokeDashoffset = pathLength * (1 - checkmarkProgress.value);

    return {
      strokeDashoffset,
      opacity: checkmarkProgress.value,
    } as any;
  });

  const checkmarkContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: checkmarkProgress.value,
    };
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.checkbox, checkboxAnimatedStyle]}>
        <Animated.View style={checkmarkContainerStyle}>
          <Svg width={16} height={16} viewBox="0 0 16 16">
            <AnimatedPath
              d="M3 8 L6 11 L13 4"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="18"
              fill="none"
              animatedProps={checkmarkAnimatedProps}
            />
          </Svg>
        </Animated.View>
      </Animated.View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '400',
    color: '#E0E4E8',
    flex: 1,
    lineHeight: 22,
  },
});

