import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../theme/theme';
import { useProfile } from '../../hooks/useProfile';

export default function TodaysReminderCard() {
  const { profile } = useProfile();
  
  // Show reminder card - always visible per Figma design
  // The condition can be adjusted if needed, but for now show it
  const shouldShow = profile?.binds_chest ?? true; // Default to true if profile not loaded yet
  
  if (!shouldShow) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#424750', '#202326']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={20} color="#f5cc99" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Today's Reminder</Text>
          <Text style={styles.message}>
            Remember to remove your binder if you feel any discomfort during your workout.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    borderWidth: 0.748,
    borderColor: 'rgba(245,204,153,0.67)',
    padding: spacing.s,
    marginBottom: spacing.l,
    overflow: 'hidden',
    shadowColor: '#7e7a7a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 9,
    elevation: 4,
    minHeight: 107,
  },
  content: {
    flexDirection: 'row',
    gap: 7,
    paddingLeft: 11,
    paddingRight: 20.747,
    paddingTop: 4,
    paddingBottom: 0.748,
    minHeight: 92,
  },
  iconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: typography.weights.regular,
    color: '#f5cc99',
    lineHeight: 22.5,
  },
  message: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: typography.weights.regular,
    color: colors.text.primary,
    lineHeight: 20,
  },
});

