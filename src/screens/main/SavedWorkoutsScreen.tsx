import React, { useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSavedWorkouts } from '../../hooks/useSavedWorkouts';
import { useProfile } from '../../hooks/useProfile';
import { useSensoryMode } from '../../contexts/SensoryModeContext';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { GlassCard, GlassButton } from '../../components/common';

export default function SavedWorkoutsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { profile } = useProfile();
  const { disableAnimations } = useSensoryMode();
  const userId = profile?.user_id || profile?.id || 'default';
  const { savedWorkouts, loading, remove, recordUsage, refresh } = useSavedWorkouts(userId);

  useFocusEffect(
    useCallback(() => {
      console.log('SavedWorkoutsScreen focused, refreshing...');
      refresh();
    }, [refresh])
  );

  const handleStartWorkout = async (workout: any) => {
    await recordUsage(workout.id);
    navigation.navigate('SessionPlayer', {
      workout: workout.workout_data,
      planId: workout.plan_id,
    });
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Remove Saved Workout',
      `Remove "${name}" from your saved workouts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(id);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove workout');
            }
          },
        },
      ]
    );
  };

  const handleSwapIntoSchedule = (workout: any) => {
    navigation.navigate('WorkoutSwap', { savedWorkout: workout });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="bookmark" size={20} color={colors.accent.primary} />
          </View>
          <Text style={styles.headerTitle}>Saved Workouts</Text>
        </View>

        <Text style={styles.headerSubtitle}>
          Your favorite workouts ready to use anytime
        </Text>

        {/* Empty state */}
        {savedWorkouts.length === 0 && (
          <GlassCard variant="hero" shimmer style={styles.emptyStateCard}>
            <View style={styles.emptyIconContainer}>
              <LinearGradient
                colors={[colors.accent.primaryMuted, colors.glass.bg]}
                style={styles.emptyIconGradient}
              >
                <Ionicons name="bookmark-outline" size={40} color={colors.accent.primary} />
              </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>No saved workouts yet</Text>
            <Text style={styles.emptyText}>
              Tap the bookmark icon on any workout to save it here for quick access
            </Text>
          </GlassCard>
        )}

        {/* Saved workouts list */}
        {savedWorkouts.map((workout) => {
          const exercises = workout.workout_data?.exercises || [];
          const exerciseCount = exercises.length;
          const totalSets = exercises.reduce(
            (sum: number, ex: any) => sum + (ex.sets || 0),
            0
          );

          return (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              exerciseCount={exerciseCount}
              totalSets={totalSets}
              onStart={() => handleStartWorkout(workout)}
              onSwap={() => handleSwapIntoSchedule(workout)}
              onDelete={() => handleDelete(workout.id, workout.workout_name)}
              formatDate={formatDate}
              disableAnimations={disableAnimations}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

// Workout card with shimmer animation
function WorkoutCard({
  workout,
  exerciseCount,
  totalSets,
  onStart,
  onSwap,
  onDelete,
  formatDate,
  disableAnimations,
}: {
  workout: any;
  exerciseCount: number;
  totalSets: number;
  onStart: () => void;
  onSwap: () => void;
  onDelete: () => void;
  formatDate: (date: Date) => string;
  disableAnimations?: boolean;
}) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Skip animations in low sensory mode
    if (disableAnimations) return;

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
  }, [disableAnimations]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 400],
  });

  return (
    <View style={styles.workoutCard}>
      {/* Base gradient */}
      <LinearGradient
        colors={['#141418', '#0A0A0C']}
        style={StyleSheet.absoluteFill}
      />

      {/* Accent glow */}
      <LinearGradient
        colors={['rgba(91, 206, 250, 0.1)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.cardGlow}
      />

      {/* Shimmer - hidden in low sensory mode */}
      {!disableAnimations && (
        <Animated.View
          style={[
            styles.shimmerOverlay,
            { transform: [{ translateX: shimmerTranslate }] },
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(255, 255, 255, 0.02)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      {/* Glass highlight */}
      <View style={styles.glassHighlight} />

      {/* Content */}
      <View style={styles.cardTop}>
        <View style={styles.cardHeader}>
          <Text style={styles.workoutName}>{workout.workout_name}</Text>
          <Pressable
            onPress={onDelete}
            hitSlop={8}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.deleteButtonPressed,
            ]}
          >
            <Ionicons name="trash-outline" size={16} color={colors.text.tertiary} />
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Ionicons name="time-outline" size={14} color={colors.accent.primary} />
            <Text style={styles.statText}>{workout.duration} min</Text>
          </View>
          <View style={styles.statChip}>
            <Ionicons name="barbell-outline" size={14} color={colors.accent.primary} />
            <Text style={styles.statText}>{exerciseCount} exercises</Text>
          </View>
          <View style={styles.statChip}>
            <Ionicons name="layers-outline" size={14} color={colors.accent.primary} />
            <Text style={styles.statText}>{totalSets} sets</Text>
          </View>
        </View>

        {/* Meta info */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            Saved {formatDate(workout.saved_at)}
          </Text>
          {workout.use_count > 0 && (
            <View style={styles.useCountBadge}>
              <Text style={styles.useCountText}>
                Used {workout.use_count}x
              </Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {workout.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesText} numberOfLines={2}>
              {workout.notes}
            </Text>
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.cardActions}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.secondaryAction,
            pressed && styles.actionPressed,
          ]}
          onPress={onSwap}
        >
          <Ionicons name="swap-horizontal" size={16} color={colors.text.secondary} />
          <Text style={styles.secondaryActionText}>Swap In</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.primaryAction,
            pressed && styles.actionPressed,
          ]}
          onPress={onStart}
        >
          <LinearGradient
            colors={[colors.accent.primary, colors.accent.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.2)', 'transparent']}
            style={styles.buttonGlassOverlay}
          />
          <Ionicons name="play" size={16} color={colors.text.inverse} />
          <Text style={styles.primaryActionText}>Start</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    marginBottom: spacing.s,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accent.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 28,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.tertiary,
    marginBottom: spacing.xl,
  },
  // Empty state
  emptyStateCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginTop: spacing.xl,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: spacing.l,
  },
  emptyIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.s,
  },
  emptyText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.l,
  },
  // Workout card
  workoutCard: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
    marginBottom: spacing.l,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: { elevation: 6 },
    }),
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '60%',
    height: '60%',
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
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTop: {
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.m,
  },
  workoutName: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.m,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.glass.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonPressed: {
    backgroundColor: colors.glass.bgLight,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.s,
    marginBottom: spacing.m,
    flexWrap: 'wrap',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.glass.bgHero,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xs,
  },
  statText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  metaText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: colors.text.tertiary,
  },
  useCountBadge: {
    backgroundColor: colors.accent.primaryMuted,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.xs,
  },
  useCountText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: colors.accent.primary,
  },
  notesContainer: {
    marginTop: spacing.m,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  notesText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  // Actions
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.m,
    overflow: 'hidden',
  },
  secondaryAction: {
    borderRightWidth: 1,
    borderRightColor: colors.border.default,
  },
  primaryAction: {
    position: 'relative',
  },
  actionPressed: {
    opacity: 0.8,
  },
  buttonGlassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  secondaryActionText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  primaryActionText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});
