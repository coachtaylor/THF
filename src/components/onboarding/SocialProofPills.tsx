import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const PILLS = [
  { id: 1, text: '🏳️‍⚧️ Trans-led team', delay: 0 },
  { id: 2, text: '📚 Evidence-based', delay: 100 },
  { id: 3, text: '✓ 2,000+ users', delay: 200 },
];

interface PillProps {
  text: string;
  delay: number;
  isLast?: boolean;
}

const Pill = ({ text, delay, isLast }: PillProps) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.ease),
      })
    );
    scale.value = withDelay(
      delay,
      withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.back(1.2)),
      })
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View style={[styles.pill, isLast && styles.pillLast, animatedStyle]}>
      <Text style={styles.pillText}>{text}</Text>
    </Animated.View>
  );
};

export default function SocialProofPills() {
  return (
    <View style={styles.container}>
      {PILLS.map((pill, index) => (
        <Pill key={pill.id} text={pill.text} delay={pill.delay} isLast={index === PILLS.length - 1} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pill: {
    backgroundColor: 'rgba(0, 217, 192, 0.1)',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 192, 0.3)',
    marginRight: 8,
    marginBottom: 8,
  },
  pillLast: {
    marginRight: 0,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00D9C0',
  },
});

