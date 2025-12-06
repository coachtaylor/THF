import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/theme';
import { useProfile } from '../../hooks/useProfile';

interface EnrichedExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  name: string;
  mediaThumb: string | null;
}

interface TodayWorkoutCardProps {
  workout: {
    name: string;
    duration?: number;
    exercises: EnrichedExercise[];
    totalSets: number;
  };
  onStartWorkout: () => void;
  onSaveWorkout?: () => void;
  isSaved?: boolean;
}

export default function TodayWorkoutCard({ workout, onStartWorkout, onSaveWorkout, isSaved = false }: TodayWorkoutCardProps) {
  const { profile } = useProfile();
  const duration = workout.duration || 45;
  const exerciseCount = workout.exercises.length;

  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const getDayLabel = () => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[new Date().getDay()];
  };

  const tags: string[] = [];
  if (profile?.binds_chest) tags.push('Binding-Safe');
  if (profile?.on_hrt) tags.push('HRT-Optimized');

  const displayExercises = workout.exercises.slice(0, 4);
  const remainingCount = workout.exercises.length - 4;

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 400],
  });

  return (
    <View style={styles.container}>
      {/* Base gradient background - deep glass effect */}
      <LinearGradient
        colors={['rgba(25, 25, 30, 0.95)', 'rgba(15, 15, 20, 0.98)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Warm orange/amber glow - like the reference image */}
      <LinearGradient
        colors={['rgba(255, 140, 50, 0.15)', 'rgba(255, 100, 50, 0.08)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.8 }}
        style={styles.glowOverlay}
      />

      {/* Secondary warm glow - bottom */}
      <LinearGradient
        colors={['rgba(255, 120, 50, 0.1)', 'transparent']}
        start={{ x: 0.3, y: 1 }}
        end={{ x: 0.7, y: 0.3 }}
        style={styles.glowOverlayPink}
      />

      {/* Liquid glass shimmer effect */}
      <Animated.View
        style={[
          styles.shimmerOverlay,
          { transform: [{ translateX: shimmerTranslate }] }
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.03)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Top highlight for glass depth */}
      <View style={styles.glassHighlight} />

      {/* Content */}
      <View style={styles.content}>
        {/* Header row */}
        <View style={styles.header}>
          <View style={styles.dayBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.dayLabel}>{getDayLabel()}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.meta}>
              {duration} min · {workout.totalSets} sets
            </Text>
            {onSaveWorkout && (
              <Pressable
                onPress={onSaveWorkout}
                style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
                hitSlop={8}
              >
                <Ionicons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={isSaved ? colors.accent.primary : colors.text.tertiary}
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{workout.name}</Text>

        {/* Tags */}
        {tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.map((tag, i) => (
              <View key={i} style={styles.tag}>
                <View style={styles.tagDot} />
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Exercise list */}
        <View style={styles.exerciseList}>
          {displayExercises.map((ex, index) => (
            <View key={index} style={styles.exerciseRow}>
              <View style={styles.exerciseNumber}>
                <Text style={styles.exerciseNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.exerciseName} numberOfLines={1}>{ex.name}</Text>
              <Text style={styles.exerciseSets}>{ex.sets}×{ex.reps}</Text>
            </View>
          ))}
          {remainingCount > 0 && (
            <Text style={styles.moreText}>+{remainingCount} more exercises</Text>
          )}
        </View>

        {/* Start button - Liquid Glass Effect */}
        <Pressable
          style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
          onPress={onStartWorkout}
        >
          {/* Frosted glass background */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Glass overlay - top highlight */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.2)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
            style={styles.buttonGlassOverlay}
          />
          {/* Shimmer effect */}
          <Animated.View
            style={[
              styles.buttonShimmer,
              { transform: [{ translateX: shimmerTranslate }] }
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255, 255, 255, 0.1)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          {/* Content */}
          <View style={styles.startButtonContent}>
            <Ionicons name="play" size={15} color={colors.text.primary} style={styles.playIcon} />
            <Text style={styles.startButtonText}>Start Workout</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(30, 30, 35, 0.7)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.4,
        shadowRadius: 32,
      },
      android: { elevation: 12 },
    }),
  },
  glowOverlay: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: '80%',
    height: '60%',
    borderRadius: 100,
  },
  glowOverlayPink: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: '60%',
    height: '50%',
    borderRadius: 100,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 200,
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.primary,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
      },
    }),
  },
  dayLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  meta: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '400',
    color: colors.text.tertiary,
  },
  saveButton: {
    padding: 4,
  },
  saveButtonPressed: {
    opacity: 0.7,
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '300',
    color: colors.text.primary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 2,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tagDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent.success,
  },
  tagText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '400',
    color: colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 12,
    marginHorizontal: 4,
  },
  exerciseList: {
    gap: 8,
    marginBottom: 14,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  exerciseNumber: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseNumberText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  exerciseName: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.secondary,
  },
  exerciseSets: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  moreText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '400',
    color: colors.text.tertiary,
    marginLeft: 30,
    marginTop: 2,
  },
  startButton: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  startButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonGlassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  buttonShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 100,
  },
  startButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  playIcon: {
    marginLeft: 2,
  },
  startButtonText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
});
