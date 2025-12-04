import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';

interface CoolDownExercise {
  name: string;
  duration?: string;
  reps?: string;
  description: string;
}

interface CoolDownPhaseProps {
  coolDownExercises: CoolDownExercise[];
  totalDurationMinutes: number;
  onComplete: () => void;
}

export default function CoolDownPhase({ coolDownExercises, totalDurationMinutes, onComplete }: CoolDownPhaseProps) {
  const insets = useSafeAreaInsets();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[colors.bg.primary, colors.bg.secondary]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="flower-outline" size={24} color={colors.accent.secondary} />
          </View>
          <Text style={styles.headerTitle}>Cool-Down</Text>
        </View>
        <View style={styles.durationBadge}>
          <Ionicons name="time-outline" size={16} color={colors.accent.primary} />
          <Text style={styles.durationText}>{totalDurationMinutes} min</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.instructionCard}>
          <Ionicons name="heart-outline" size={24} color={colors.accent.secondary} />
          <Text style={styles.instructionText}>
            Take your time with these stretches to help your body recover.
          </Text>
        </View>

        {coolDownExercises.map((exercise, index) => (
          <View key={index} style={styles.exerciseItem}>
            <LinearGradient
              colors={['#141418', '#0A0A0C']}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['rgba(245, 169, 184, 0.08)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.glassHighlight} />

            <View style={styles.exerciseHeader}>
              <View style={styles.numberBadge}>
                <Text style={styles.exerciseNumber}>{index + 1}</Text>
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDescription}>{exercise.description}</Text>
              </View>
            </View>
            <View style={styles.exerciseDetails}>
              {exercise.duration && (
                <View style={styles.detailBadge}>
                  <Ionicons name="time-outline" size={14} color={colors.accent.primary} />
                  <Text style={styles.exerciseDetail}>{exercise.duration}</Text>
                </View>
              )}
              {exercise.reps && (
                <View style={styles.detailBadge}>
                  <Ionicons name="repeat-outline" size={14} color={colors.accent.primary} />
                  <Text style={styles.exerciseDetail}>{exercise.reps}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + spacing.m }]}>
        <TouchableOpacity style={styles.completeButton} onPress={onComplete} activeOpacity={0.8}>
          <LinearGradient
            colors={[colors.accent.secondary, '#E88FA0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.completeButtonGradient}
          >
            <Animated.View
              style={[
                styles.shimmerOverlay,
                { transform: [{ translateX: shimmerTranslate }] },
              ]}
            >
              <LinearGradient
                colors={['transparent', 'rgba(255, 255, 255, 0.2)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            <Text style={styles.completeButtonText}>Complete Workout</Text>
            <Ionicons name="checkmark-circle" size={22} color={colors.text.inverse} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accent.secondaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.glass.bg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
  },
  durationText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.l,
    paddingBottom: spacing.xl,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.xl,
    padding: spacing.m,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: colors.glass.borderPink,
  },
  instructionText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 22,
  },
  exerciseItem: {
    borderRadius: borderRadius.xl,
    padding: spacing.m,
    marginBottom: spacing.m,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseHeader: {
    flexDirection: 'row',
    marginBottom: spacing.s,
    gap: spacing.m,
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.accent.secondaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glass.borderPink,
  },
  exerciseNumber: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent.secondary,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  exerciseDescription: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.tertiary,
    lineHeight: 20,
  },
  exerciseDetails: {
    flexDirection: 'row',
    gap: spacing.s,
    marginTop: spacing.s,
    marginLeft: 44,
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.glass.bg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  exerciseDetail: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  buttonContainer: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    backgroundColor: colors.bg.primary,
  },
  completeButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.secondary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    padding: spacing.m,
    paddingVertical: 16,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
  },
  completeButtonText: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.inverse,
    letterSpacing: 0.3,
  },
});
