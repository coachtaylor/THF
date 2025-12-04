import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlan } from '../../hooks/usePlan';
import { useProfile } from '../../hooks/useProfile';
import { getWorkoutFromPlan } from '../../services/planGenerator';
import { recordWorkoutUsage } from '../../services/storage/savedWorkouts';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { GlassCard } from '../../components/common';

interface RouteParams {
  savedWorkout: {
    id: string;
    workout_name: string;
    workout_data: any;
    duration: number;
  };
}

// Mode option component
function ModeOption({
  icon,
  title,
  description,
  isSelected,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.modeOption,
        isSelected && styles.modeOptionActive,
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
    >
      {isSelected && (
        <LinearGradient
          colors={[colors.accent.primaryMuted, 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={styles.glassHighlight} />

      <View style={[
        styles.modeIconContainer,
        isSelected && styles.modeIconContainerActive,
      ]}>
        <Ionicons
          name={icon}
          size={22}
          color={isSelected ? colors.accent.primary : colors.text.tertiary}
        />
      </View>

      <Text style={[
        styles.modeOptionTitle,
        isSelected && styles.modeOptionTitleActive,
      ]}>
        {title}
      </Text>
      <Text style={styles.modeOptionDesc}>{description}</Text>

      {isSelected && (
        <View style={styles.modeCheckmark}>
          <Ionicons name="checkmark" size={12} color={colors.text.inverse} />
        </View>
      )}
    </Pressable>
  );
}

// Day card component
function DayCard({
  dayName,
  dateNumber,
  month,
  isToday,
  isSelected,
  exerciseCount,
  swapMode,
  onPress,
}: {
  dayName: string;
  dateNumber: number;
  month: string;
  isToday: boolean;
  isSelected: boolean;
  exerciseCount: number;
  swapMode: 'replace' | 'add';
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isSelected) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.98,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSelected]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={({ pressed }) => [
          styles.dayCard,
          isSelected && styles.dayCardSelected,
          isToday && !isSelected && styles.dayCardToday,
          pressed && styles.buttonPressed,
        ]}
        onPress={onPress}
      >
        {isSelected && (
          <LinearGradient
            colors={[colors.accent.primaryMuted, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.glassHighlight} />

        <View style={styles.dayLeft}>
          <Text style={[
            styles.dayName,
            isSelected && styles.dayNameSelected,
            isToday && styles.dayNameToday,
          ]}>
            {isToday ? 'TODAY' : dayName.toUpperCase()}
          </Text>
          <Text style={[
            styles.dateNumber,
            isSelected && styles.dateNumberSelected,
          ]}>
            {dateNumber}
          </Text>
          <Text style={styles.monthName}>{month}</Text>
        </View>

        <View style={styles.dayDivider} />

        <View style={styles.dayRight}>
          <View style={styles.dayWorkoutInfo}>
            {swapMode === 'replace' && (
              <Text style={styles.currentLabel}>Current workout</Text>
            )}
            <View style={styles.exerciseBadge}>
              <Ionicons name="barbell-outline" size={14} color={colors.text.secondary} />
              <Text style={[
                styles.exerciseCount,
                isSelected && styles.exerciseCountSelected,
              ]}>
                {exerciseCount} exercises
              </Text>
            </View>
          </View>

          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Ionicons name="checkmark-circle" size={24} color={colors.accent.primary} />
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function WorkoutSwapScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { savedWorkout } = route.params as RouteParams;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const { profile } = useProfile();
  const userId = profile?.user_id || profile?.id || 'default';
  const { plan } = usePlan(userId);

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [swapMode, setSwapMode] = useState<'replace' | 'add'>('replace');

  // Shimmer animation
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

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 400],
  });

  // Get upcoming days from the plan
  const upcomingDays = useMemo(() => {
    if (!plan || !plan.days || !profile) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const duration = (profile.session_duration && [30, 45, 60, 90].includes(profile.session_duration))
      ? profile.session_duration as 30 | 45 | 60 | 90
      : 45;

    return plan.days
      .filter(day => {
        const dayDate = new Date(day.date);
        dayDate.setHours(0, 0, 0, 0);
        return dayDate >= today;
      })
      .slice(0, 14)
      .map(day => {
        const workout = getWorkoutFromPlan(plan as any, day.dayNumber, duration);
        const dayDate = new Date(day.date);
        const isToday = dayDate.toDateString() === today.toDateString();

        return {
          day,
          date: dayDate,
          workout,
          isToday,
          dayName: dayDate.toLocaleDateString('en-US', { weekday: 'short' }),
          dateNumber: dayDate.getDate(),
          month: dayDate.toLocaleDateString('en-US', { month: 'short' }),
        };
      })
      .filter(d => d.workout);
  }, [plan, profile]);

  const handleConfirmSwap = async () => {
    if (!selectedDay) {
      Alert.alert('Select a Day', 'Please select a day to swap the workout into.');
      return;
    }

    await recordWorkoutUsage(savedWorkout.id);

    Alert.alert(
      'Workout Ready',
      swapMode === 'replace'
        ? `"${savedWorkout.workout_name}" will replace the workout on ${selectedDay.toLocaleDateString()}`
        : `"${savedWorkout.workout_name}" will be added as an extra workout`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Now',
          onPress: () => {
            navigation.navigate('SessionPlayer', {
              workout: savedWorkout.workout_data,
              planId: null,
            });
          },
        },
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bg.primary, colors.bg.secondary]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.l, paddingBottom: insets.bottom + 120 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed,
            ]}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Swap Workout</Text>
        </View>

        {/* Saved workout info */}
        <View style={styles.savedWorkoutCard}>
          <LinearGradient
            colors={['#141418', '#0A0A0C']}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={[colors.accent.primaryMuted, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.savedWorkoutGlow}
          />
          <Animated.View
            style={[
              styles.shimmerOverlay,
              { transform: [{ translateX: shimmerTranslate }] },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255, 255, 255, 0.03)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <View style={styles.glassHighlight} />

          <View style={styles.savedWorkoutIcon}>
            <Ionicons name="bookmark" size={20} color={colors.accent.primary} />
          </View>
          <View style={styles.savedWorkoutText}>
            <Text style={styles.savedWorkoutLabel}>Selected Workout</Text>
            <Text style={styles.savedWorkoutName}>{savedWorkout.workout_name}</Text>
          </View>
          <View style={styles.savedWorkoutDuration}>
            <Ionicons name="time-outline" size={14} color={colors.accent.primary} />
            <Text style={styles.durationText}>{savedWorkout.duration} min</Text>
          </View>
        </View>

        {/* Swap mode selection */}
        <Text style={styles.sectionTitle}>How would you like to use this?</Text>

        <View style={styles.modeContainer}>
          <ModeOption
            icon="swap-horizontal"
            title="Replace"
            description="Replace existing workout"
            isSelected={swapMode === 'replace'}
            onPress={() => setSwapMode('replace')}
          />

          <ModeOption
            icon="add-circle"
            title="Add Extra"
            description="Add as additional workout"
            isSelected={swapMode === 'add'}
            onPress={() => setSwapMode('add')}
          />
        </View>

        {/* Day selection */}
        <Text style={styles.sectionTitle}>Select a day</Text>

        {upcomingDays.length === 0 ? (
          <GlassCard variant="default" style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={32} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>No upcoming workouts in your plan</Text>
          </GlassCard>
        ) : (
          <View style={styles.daysContainer}>
            {upcomingDays.map((item, index) => {
              const isSelected = selectedDay?.toDateString() === item.date.toDateString();
              const exercises = item.workout?.exercises || [];

              return (
                <DayCard
                  key={index}
                  dayName={item.dayName}
                  dateNumber={item.dateNumber}
                  month={item.month}
                  isToday={item.isToday}
                  isSelected={isSelected}
                  exerciseCount={exercises.length}
                  swapMode={swapMode}
                  onPress={() => setSelectedDay(item.date)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Bottom action button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.l }]}>
        <LinearGradient
          colors={['transparent', colors.bg.primary]}
          style={styles.bottomGradient}
        />
        <Pressable
          style={({ pressed }) => [
            styles.confirmButton,
            !selectedDay && styles.confirmButtonDisabled,
            pressed && selectedDay && styles.buttonPressed,
          ]}
          onPress={handleConfirmSwap}
          disabled={!selectedDay}
        >
          <LinearGradient
            colors={selectedDay
              ? [colors.accent.primary, colors.accent.primaryDark]
              : [colors.glass.bg, colors.glass.bg]
            }
            style={StyleSheet.absoluteFill}
          />
          {selectedDay && (
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.2)', 'transparent']}
              style={styles.buttonGlassOverlay}
            />
          )}
          <Ionicons
            name={swapMode === 'replace' ? 'swap-horizontal' : 'add-circle'}
            size={20}
            color={selectedDay ? colors.text.inverse : colors.text.tertiary}
          />
          <Text style={[
            styles.confirmButtonText,
            !selectedDay && styles.confirmButtonTextDisabled,
          ]}>
            {swapMode === 'replace' ? 'Confirm Swap' : 'Add Workout'}
          </Text>
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
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.glass.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Saved workout card
  savedWorkoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
    padding: spacing.m,
    marginBottom: spacing.xl,
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
  savedWorkoutGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '50%',
    height: '100%',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 200,
  },
  savedWorkoutIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.accent.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  savedWorkoutText: {
    flex: 1,
  },
  savedWorkoutLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  savedWorkoutName: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.xxs,
  },
  savedWorkoutDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.glass.bg,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  durationText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: colors.accent.primary,
  },
  // Section
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.m,
  },
  // Mode selection
  modeContainer: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.xl,
  },
  modeOption: {
    flex: 1,
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.m,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  modeOptionActive: {
    borderColor: colors.accent.primary,
  },
  modeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.glass.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  modeIconContainerActive: {
    backgroundColor: colors.accent.primaryMuted,
  },
  modeOptionTitle: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.tertiary,
    marginBottom: spacing.xxs,
  },
  modeOptionTitleActive: {
    color: colors.accent.primary,
  },
  modeOptionDesc: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: colors.text.disabled,
    textAlign: 'center',
  },
  modeCheckmark: {
    position: 'absolute',
    top: spacing.s,
    right: spacing.s,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Day cards
  daysContainer: {
    gap: spacing.s,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: spacing.m,
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.m,
    overflow: 'hidden',
  },
  dayCardSelected: {
    borderColor: colors.accent.primary,
  },
  dayCardToday: {
    borderColor: colors.glass.borderCyan,
  },
  dayLeft: {
    width: 56,
    alignItems: 'center',
  },
  dayDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.default,
    marginHorizontal: spacing.m,
  },
  dayName: {
    fontFamily: 'Poppins',
    fontSize: 9,
    fontWeight: '600',
    color: colors.text.tertiary,
    letterSpacing: 0.5,
    marginBottom: spacing.xxs,
  },
  dayNameSelected: {
    color: colors.accent.primary,
  },
  dayNameToday: {
    color: colors.accent.primary,
  },
  dateNumber: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    lineHeight: 26,
  },
  dateNumberSelected: {
    color: colors.accent.primary,
  },
  monthName: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    marginTop: spacing.xxs,
  },
  dayRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayWorkoutInfo: {
    flex: 1,
  },
  currentLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xxs,
  },
  exerciseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  exerciseCount: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  exerciseCountSelected: {
    color: colors.text.primary,
  },
  selectedIndicator: {
    marginLeft: spacing.m,
  },
  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.m,
  },
  bottomGradient: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    height: 40,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.m,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  confirmButtonDisabled: {
    ...Platform.select({
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
    }),
  },
  buttonGlassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  confirmButtonText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  confirmButtonTextDisabled: {
    color: colors.text.tertiary,
  },
});
