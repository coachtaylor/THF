import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface AnimatedGradientHeroProps {
  height?: number;
}

export default function AnimatedGradientHero({ height = 400 }: AnimatedGradientHeroProps) {
  // Animation values for three rectangles
  const progress1 = useSharedValue(0);
  const progress2 = useSharedValue(0);
  const progress3 = useSharedValue(0);

  useEffect(() => {
    // Rectangle 1: 8 second loop (top-left to bottom-right)
    progress1.value = withRepeat(
      withTiming(1, {
        duration: 8000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false
    );

    // Rectangle 2: 10 second loop (center rotation/scale)
    progress2.value = withRepeat(
      withTiming(1, {
        duration: 10000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false
    );

    // Rectangle 3: 12 second loop (bottom-right to top-left)
    progress3.value = withRepeat(
      withTiming(1, {
        duration: 12000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false
    );
  }, []);

  // Rectangle 1: Moves from top-left to bottom-right
  const rect1Props = useAnimatedProps(() => {
    const x = interpolate(progress1.value, [0, 1], [-SCREEN_WIDTH * 0.3, SCREEN_WIDTH * 0.7]);
    const y = interpolate(progress1.value, [0, 1], [-height * 0.2, height * 0.8]);
    const scale = interpolate(progress1.value, [0, 0.5, 1], [0.8, 1.2, 0.8]);
    const opacity = interpolate(progress1.value, [0, 0.5, 1], [0.4, 0.6, 0.4]);

    return {
      x,
      y,
      width: SCREEN_WIDTH * 0.6 * scale,
      height: height * 0.6 * scale,
      opacity,
    };
  });

  // Rectangle 2: Scales and moves in circular pattern from center
  const rect2Props = useAnimatedProps(() => {
    'worklet';
    const centerX = SCREEN_WIDTH * 0.5;
    const centerY = height * 0.5;
    const scale = interpolate(progress2.value, [0, 0.5, 1], [1, 1.3, 1]);
    const opacity = interpolate(progress2.value, [0, 0.5, 1], [0.5, 0.7, 0.5]);
    // Circular movement pattern
    const angle = progress2.value * Math.PI * 2;
    const radius = SCREEN_WIDTH * 0.1;
    const offsetX = Math.cos(angle) * radius;
    const offsetY = Math.sin(angle) * radius;

    return {
      x: centerX - (SCREEN_WIDTH * 0.5 * scale) / 2 + offsetX,
      y: centerY - (height * 0.5 * scale) / 2 + offsetY,
      width: SCREEN_WIDTH * 0.5 * scale,
      height: height * 0.5 * scale,
      opacity,
    };
  });

  // Rectangle 3: Moves from bottom-right to top-left
  const rect3Props = useAnimatedProps(() => {
    const x = interpolate(progress3.value, [0, 1], [SCREEN_WIDTH * 0.7, -SCREEN_WIDTH * 0.3]);
    const y = interpolate(progress3.value, [0, 1], [height * 0.8, -height * 0.2]);
    const scale = interpolate(progress3.value, [0, 0.5, 1], [1, 0.9, 1]);
    const opacity = interpolate(progress3.value, [0, 0.5, 1], [0.3, 0.5, 0.3]);

    return {
      x,
      y,
      width: SCREEN_WIDTH * 0.55 * scale,
      height: height * 0.55 * scale,
      opacity,
    };
  });

  return (
    <View style={[styles.container, { height }]}>
      <Svg width={SCREEN_WIDTH} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Gradient 1: Teal to Purple */}
          <SvgLinearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#00D9C0" stopOpacity="0.6" />
            <Stop offset="50%" stopColor="#A78BFA" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#00D9C0" stopOpacity="0.6" />
          </SvgLinearGradient>

          {/* Gradient 2: Purple to Teal */}
          <SvgLinearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#A78BFA" stopOpacity="0.6" />
            <Stop offset="50%" stopColor="#00D9C0" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#A78BFA" stopOpacity="0.6" />
          </SvgLinearGradient>

          {/* Gradient 3: Teal to Purple (reverse) */}
          <SvgLinearGradient id="gradient3" x1="100%" y1="100%" x2="0%" y2="0%">
            <Stop offset="0%" stopColor="#00D9C0" stopOpacity="0.6" />
            <Stop offset="50%" stopColor="#A78BFA" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#00D9C0" stopOpacity="0.6" />
          </SvgLinearGradient>
        </Defs>

        {/* Rectangle 1 */}
        <AnimatedRect
          animatedProps={rect1Props}
          rx={40}
          fill="url(#gradient1)"
        />

        {/* Rectangle 2 */}
        <AnimatedRect
          animatedProps={rect2Props}
          rx={50}
          fill="url(#gradient2)"
        />

        {/* Rectangle 3 */}
        <AnimatedRect
          animatedProps={rect3Props}
          rx={35}
          fill="url(#gradient3)"
        />
      </Svg>

      {/* Bottom gradient overlay for text readability */}
      <LinearGradient
        colors={['transparent', 'rgba(15, 20, 25, 0.9)']}
        style={styles.bottomOverlay}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
});

