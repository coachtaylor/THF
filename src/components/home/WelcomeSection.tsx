import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

  // Icon based on time of day
  const getTimeIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'sunny-outline';
    if (hour >= 12 && hour < 17) return 'partly-sunny-outline';
    return 'moon-outline';
  };

  return (
    <View style={styles.container}>
      <View style={styles.greetingRow}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={getTimeIcon()}
            size={16}
            color={colors.text.primary}
          />
        </View>
        <Text style={styles.greeting}>
          {greeting}, <Text style={styles.name}>{displayName}</Text>
        </Text>
      </View>
      <Text style={styles.motivation}>{motivationalMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  iconContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.glass.bgHero,
    borderWidth: 1,
    borderColor: colors.text.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  greeting: {
    fontFamily: 'Poppins',
    fontSize: 26,
    fontWeight: '300',
    color: colors.text.primary,
    letterSpacing: -0.3,
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
    marginLeft: 34, // Align with text after icon
  },
});
