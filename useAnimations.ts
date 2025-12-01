import { useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay } from 'react-native-reanimated';

interface EntranceAnimationConfig {
  delay?: number;
  duration?: number;
  type?: 'fade' | 'slideUp' | 'slideRight' | 'scale' | 'fadeScale';
}

export const useEntranceAnimation = (config: EntranceAnimationConfig = {}) => {
  const {
    delay = 0,
    duration = 600,
    type = 'fadeScale',
  } = config;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const translateX = useSharedValue(-100);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    const animationDelay = delay;

    opacity.value = withDelay(animationDelay, withTiming(1, { duration: duration * 0.8 }));

    if (type === 'slideUp' || type === 'fadeScale') {
      translateY.value = withDelay(
        animationDelay,
        withSpring(0, {
          damping: 20,
          stiffness: 90,
        })
      );
    }

    if (type === 'slideRight') {
      translateX.value = withDelay(
        animationDelay,
        withSpring(0, {
          damping: 20,
          stiffness: 90,
        })
      );
    }

    if (type === 'scale' || type === 'fadeScale') {
      scale.value = withDelay(
        animationDelay,
        withSpring(1, {
          damping: 15,
          stiffness: 100,
        })
      );
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const style: any = {
      opacity: opacity.value,
    };

    if (type === 'slideUp' || type === 'fadeScale') {
      style.transform = [
        { translateY: translateY.value },
        { scale: scale.value },
      ];
    } else if (type === 'slideRight') {
      style.transform = [{ translateX: translateX.value }];
    } else if (type === 'scale') {
      style.transform = [{ scale: scale.value }];
    }

    return style;
  });

  return animatedStyle;
};

// Button press animation hook
export const useButtonPress = () => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.96, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 10,
      stiffness: 300,
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, handlePressIn, handlePressOut };
};