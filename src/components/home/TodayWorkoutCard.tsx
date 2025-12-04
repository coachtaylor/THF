import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../theme/theme';
import { textStyles } from '../../theme/components';
import { useProfile } from '../../hooks/useProfile';

interface TodayWorkoutCardProps {
  workout: {
    name: string;
    duration?: number;
    exercises: any[];
    totalSets: number;
  };
  onStartWorkout: () => void;
}

export default function TodayWorkoutCard({ workout, onStartWorkout }: TodayWorkoutCardProps) {
  const { profile } = useProfile();
  const duration = workout.duration || 45;
  const exerciseCount = workout.exercises.length;

  // Format date like "SUNDAY, NOV 21ST"
  const formatDate = () => {
    const today = new Date();
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const dayName = dayNames[today.getDay()];
    const month = monthNames[today.getMonth()];
    const day = today.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? 'ST' : day === 2 || day === 22 ? 'ND' : day === 3 || day === 23 ? 'RD' : 'TH';
    return `${dayName}, ${month} ${day}${suffix}`;
  };

  // Determine badges based on profile - always show if conditions are met
  const badges = [];
  if (profile?.binds_chest) {
    badges.push({ label: 'BINDING-SAFE', color: 'rgba(75,205,227,0.52)' });
  }
  if (profile?.on_hrt) {
    badges.push({ label: 'HRT-OPTIMIZED', color: '#b86a77' });
  }
  
  // Ensure badges are always shown if profile data exists
  // If no profile yet, badges will be empty array (which is fine)

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.dateText}>{formatDate()}</Text>
        <Text style={styles.workoutName}>{workout.name}</Text>
        
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color={colors.text.primary} />
            <Text style={styles.metaText}>{duration} min</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="barbell-outline" size={16} color={colors.text.primary} />
            <Text style={styles.metaText}>{exerciseCount} exercises</Text>
          </View>
        </View>

        {badges.length > 0 && (
          <View style={styles.badgesRow}>
            {badges.map((badge, index) => (
              <View key={index} style={[styles.badge, { backgroundColor: badge.color }]}>
                <Text style={styles.badgeText}>{badge.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={onStartWorkout}
          activeOpacity={0.8}
        >
          <View style={styles.buttonInner}>
            <Text style={styles.buttonText}>Start Workout</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.primary} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#30363b',
    borderRadius: 15,
    paddingLeft: 22,
    paddingRight: spacing.l,
    paddingTop: 20,
    paddingBottom: 20,
    marginBottom: spacing.l,
    gap: spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 40,
    elevation: 4,
  },
  content: {
    gap: spacing.sm,
  },
  dateText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: typography.weights.regular,
    color: colors.text.tertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  workoutName: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: typography.weights.regular,
    color: colors.text.primary,
    letterSpacing: -0.5697,
    lineHeight: 31.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.l,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: typography.weights.regular,
    color: colors.text.primary,
    lineHeight: 21,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.m,
    marginTop: spacing.xs,
  },
  badge: {
    paddingVertical: 11.221,
    paddingHorizontal: 8.743,
    borderRadius: 10,
    height: 35,
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: 'Poppins',
    fontSize: 9,
    fontWeight: typography.weights.semibold,
    color: '#e6f8fb',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    lineHeight: 13.5,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 297,
    height: 55,
    borderRadius: 15,
    backgroundColor: colors.bg.elevated,
    shadowColor: '#1f2427',
    shadowOffset: { width: 7, height: 7 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
  },
  buttonText: {
    fontFamily: 'Montserrat',
    fontSize: 16,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    lineHeight: 24,
  },
});