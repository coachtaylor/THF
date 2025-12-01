import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface ValueCardProps {
  problem: string;
  solution: string;
  delay?: number;
}

export default function ValueCard({ problem, solution, delay = 0 }: ValueCardProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      })
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <View style={styles.accentBar} />
      <View style={styles.textContainer}>
        <Text style={styles.problem}>{problem}</Text>
        <Text style={styles.solution}>{solution}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#151920',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2A2F36',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  accentBar: {
    width: 3,
    borderRadius: 999,
    backgroundColor: '#00D9C0',
    marginRight: 10,
    alignSelf: 'stretch',
    opacity: 0.6,
  },
  textContainer: {
    flex: 1,
  },
  problem: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 4,
  },
  solution: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D9C0',
    lineHeight: 20,
  },
});

