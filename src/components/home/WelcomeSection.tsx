import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/theme';

interface WelcomeSectionProps {
  userName?: string;
}

// Daily motivational messages - rotates by day of week
const MOTIVATIONAL_MESSAGES = [
  "Let's make today count",
  "Your body will thank you",
  "One workout closer to your goals",
  "Progress over perfection",
  "You've got this",
  "Strong is beautiful",
  "Let's crush today's workout",
];

export default function WelcomeSection({ userName }: WelcomeSectionProps) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const displayName = userName || 'Dakotah';

  const motivationalMessage = useMemo(() => {
    const dayOfWeek = new Date().getDay();
    return MOTIVATIONAL_MESSAGES[dayOfWeek];
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>
        {greeting}, <Text style={styles.name}>{displayName}</Text>
      </Text>
      <Text style={styles.motivation}>{motivationalMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  greeting: {
    fontFamily: 'Poppins',
    fontSize: 26,
    fontWeight: '300',
    color: colors.text.primary,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  name: {
    fontWeight: '500',
    color: colors.accent.primary,
  },
  motivation: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '400',
    color: colors.text.secondary,
    letterSpacing: -0.1,
  },
});
