import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { useSensoryMode } from '../../contexts/SensoryModeContext';

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
  const { disableAnimations } = useSensoryMode();
  const [completedExercises, setCompletedExercises] = useState<boolean[]>(
    new Array(coolDownExercises.length).fill(false)
  );
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Skip shimmer animation in low sensory mode
    if (disableAnimations) return;

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
  }, [shimmerAnim, disableAnimations]);

  const toggleExercise = (index: number) => {
    setCompletedExercises(prev => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };

  const allCompleted = completedExercises.every(completed => completed);

  const handleCompletePress = () => {
    console.log('🎯 Complete Workout button pressed', { allCompleted, completedExercises });
    onComplete();
  };

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
          <TouchableOpacity
            key={index}
            style={[
              styles.exerciseItem,
              completedExercises[index] && styles.exerciseItemCompleted
            ]}
            onPress={() => toggleExercise(index)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#141418', '#0A0A0C']}
              style={StyleSheet.absoluteFill}
            />
            {completedExercises[index] && (
              <LinearGradient
                colors={['rgba(245, 169, 184, 0.1)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            <View style={styles.glassHighlight} />

            <View style={styles.exerciseCheckboxContainer}>
              <View style={[
                styles.checkbox,
                completedExercises[index] && styles.checkboxChecked
              ]}>
                {completedExercises[index] && (
                  <Ionicons name="checkmark" size={18} color={colors.text.inverse} />
                )}
              </View>
            </View>
            <View style={styles.exerciseContent}>
              <View style={styles.exerciseHeader}>
                <Text style={[
                  styles.exerciseName,
                  completedExercises[index] && styles.exerciseNameCompleted
                ]}>
                  {exercise.name}
                </Text>
              </View>
              <Text style={styles.exerciseDescription}>{exercise.description}</Text>
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
          </TouchableOpacity>
        ))}

        <View style={styles.hintContainer}>
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.accent.secondary} />
          <Text style={styles.hintText}>
            Check off each stretch as you complete it
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + spacing.m }]}>
        <TouchableOpacity
          style={[styles.completeButton, !allCompleted && styles.completeButtonDisabled]}
          onPress={handleCompletePress}
          activeOpacity={0.8}
          disabled={!allCompleted}
        >
          <LinearGradient
            colors={allCompleted ? [colors.accent.secondary, '#E88FA0'] : [colors.glass.bg, colors.glass.bg]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.completeButtonGradient}
          >
            {allCompleted && !disableAnimations && (
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
            )}
            <Text style={[
              styles.completeButtonText,
              !allCompleted && styles.completeButtonTextDisabled
            ]}>Complete Workout</Text>
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={allCompleted ? colors.text.inverse : colors.text.tertiary}
            />
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
    flexDirection: 'row',
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
  exerciseItemCompleted: {
    borderColor: colors.glass.borderPink,
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseCheckboxContainer: {
    marginRight: spacing.m,
    justifyContent: 'flex-start',
    paddingTop: spacing.xxs,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border.default,
    backgroundColor: colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.accent.secondary,
    borderColor: colors.accent.secondary,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.secondary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  exerciseName: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  exerciseNameCompleted: {
    color: colors.accent.secondary,
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
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  hintText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.tertiary,
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
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonTextDisabled: {
    color: colors.text.tertiary,
  },
});
