import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { usePlan } from '../../hooks/usePlan';
import { useProfile } from '../../hooks/useProfile';
import { ExerciseDetailSheet } from '../../components/exercise/ExerciseDetailSheet';
import { getExerciseLibrary } from '../../data/exercises';
import { formatEquipmentLabel } from '../../utils/equipment';
import type { Exercise } from '../../types';
import type { Workout } from '../../types/plan';

// SVG Icons
const HamburgerIcon = () => (
  <View style={styles.hamburgerIcon}>
    <View style={styles.menuLine} />
    <View style={styles.menuLine} />
    <View style={styles.menuLine} />
  </View>
);

const PlayIconSVG = () => (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <Path d="M3 2 L11 7 L3 12 Z" fill="#0F1419" />
  </Svg>
);

const DumbbellIconSVG = () => (
  <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
    <Path d="M6 12 L6 20 M26 12 L26 20 M10 16 L22 16" stroke="#6B7280" strokeWidth="3" strokeLinecap="round" />
    <Circle cx="6" cy="16" r="3" fill="#6B7280" />
    <Circle cx="26" cy="16" r="3" fill="#6B7280" />
  </Svg>
);

const ChevronRightSVG = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path d="M6 4 L10 8 L6 12" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

interface PlanViewProps {
  navigation: any;
}

export default function PlanView({ navigation }: PlanViewProps) {
  const { plan, loading } = usePlan();
  const { profile } = useProfile();
  const insets = useSafeAreaInsets();

  const [selectedDay, setSelectedDay] = useState(0);
  // Initialize from profile's session_duration, default to 30 if not set
  const [selectedVariant, setSelectedVariant] = useState<30 | 45 | 60 | 90>(
    (profile?.session_duration && [30, 45, 60, 90].includes(profile.session_duration))
      ? (profile.session_duration as 30 | 45 | 60 | 90)
      : 30
  );
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  const [exerciseMap, setExerciseMap] = useState<Record<string, Exercise>>({});
  const [exercisesLoading, setExercisesLoading] = useState(false);

  // Update selectedVariant when profile's session_duration changes
  useEffect(() => {
    if (profile?.session_duration && [30, 45, 60, 90].includes(profile.session_duration)) {
      setSelectedVariant(profile.session_duration as 30 | 45 | 60 | 90);
    }
  }, [profile?.session_duration]);

  // Load exercises for current workout
  useEffect(() => {
    if (!plan) return;

    const currentDay = plan.days[selectedDay];
    const currentWorkout = currentDay?.variants[selectedVariant];
    
    if (!currentWorkout) {
      setExerciseMap({});
      return;
    }

    const loadExercises = async () => {
      setExercisesLoading(true);
      try {
        const allExercises = await getExerciseLibrary();
        const exercises: Record<string, Exercise> = {};
        
        for (const exerciseInstance of currentWorkout.exercises) {
          if (!exercises[exerciseInstance.exerciseId]) {
            const exercise = allExercises.find(ex => 
              ex.id === exerciseInstance.exerciseId || 
              String(ex.id) === String(exerciseInstance.exerciseId)
            );
            
            if (exercise) {
              exercises[exerciseInstance.exerciseId] = exercise;
            }
          }
        }
        
        setExerciseMap(exercises);
      } catch (error) {
        console.error('Error loading exercises:', error);
      } finally {
        setExercisesLoading(false);
      }
    };

    loadExercises();
  }, [plan, selectedDay, selectedVariant]);

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top + 8 }]}>
        <ActivityIndicator size="large" color="#00D9C0" />
        <Text style={styles.loadingText}>Loading your plan...</Text>
      </View>
    );
  }

  // No plan state
  if (!plan) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.errorText}>No workout plan yet</Text>
        <Text style={styles.errorSubtext}>Complete your profile to generate a plan</Text>
        <TouchableOpacity
          style={styles.createPlanButton}
          onPress={() => navigation.navigate('Review')}
        >
          <LinearGradient
            colors={['#00D9C0', '#00B39D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createPlanGradient}
          >
            <Text style={styles.createPlanText}>Create Plan</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  const currentDay = plan.days[selectedDay];
  const currentWorkout = currentDay?.variants[selectedVariant];

  // Format day name
  const formatDayName = (date: Date): string => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return daysOfWeek[date.getDay()];
  };

  // Format date for workout subtitle
  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Format workout title
  const formatWorkoutTitle = (workout: Workout | null): string => {
    if (!workout) return 'No Workout';

    // First, check if workout has a name set from generation
    if (workout.name) {
      return workout.name;
    }

    // Fallback: Try to infer from exercises or use generic title
    const hasUpperPush = workout.exercises.some(ex => {
      const exercise = exerciseMap[ex.exerciseId];
      return exercise?.tags?.some(tag => tag.includes('upper_push') || tag.includes('push'));
    });
    const hasUpperPull = workout.exercises.some(ex => {
      const exercise = exerciseMap[ex.exerciseId];
      return exercise?.tags?.some(tag => tag.includes('upper_pull') || tag.includes('pull'));
    });
    const hasLower = workout.exercises.some(ex => {
      const exercise = exerciseMap[ex.exerciseId];
      return exercise?.tags?.some(tag => tag.includes('lower_body'));
    });
    const hasCore = workout.exercises.some(ex => {
      const exercise = exerciseMap[ex.exerciseId];
      return exercise?.tags?.some(tag => tag.includes('core'));
    });

    if (hasUpperPush && hasUpperPull) return 'Upper Body';
    if (hasUpperPush) return 'Upper Body Push';
    if (hasUpperPull) return 'Upper Body Pull';
    if (hasLower && hasCore) return 'Lower Body & Core';
    if (hasLower) return 'Lower Body';
    if (hasCore) return 'Core';

    return 'Full Body';
  };

  // Calculate total sets
  const calculateTotalSets = (workout: Workout | null): number => {
    if (!workout) return 0;
    return workout.exercises.reduce((total, ex) => total + ex.sets, 0);
  };

  // Check if day has workout
  const hasWorkout = (day: typeof currentDay): boolean => {
    return !!(day.variants[30] || day.variants[45] || day.variants[60] || day.variants[90]);
  };

  // Check if today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleStartWorkout = () => {
    if (!currentWorkout) return;
    navigation.navigate('SessionPlayer', {
      workout: currentWorkout,
      planId: plan.id,
    });
  };

  const handleExercisePress = (exerciseId: string) => {
    const numericId = parseInt(exerciseId, 10);
    if (!isNaN(numericId)) {
      setSelectedExerciseId(numericId);
    }
  };

  const handleMenu = () => {
    // TODO: Open menu/settings
    console.log('Menu pressed');
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>My Plan</Text>
        <TouchableOpacity style={styles.menuButton} onPress={handleMenu}>
          <HamburgerIcon />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* WEEKLY CALENDAR */}
        <View style={styles.calendarContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calendarContent}
          >
            {plan.days.map((day) => {
              const dayIsToday = isToday(day.date);
              const dayIsSelected = day.dayNumber === selectedDay;
              const dayHasWorkout = hasWorkout(day);
              
              return (
                <TouchableOpacity
                  key={day.dayNumber}
                  style={[
                    styles.dayCard,
                    dayIsToday && styles.dayCardToday,
                    dayIsSelected && styles.dayCardSelected,
                  ]}
                  onPress={() => setSelectedDay(day.dayNumber)}
                >
                  <Text style={[
                    styles.dayName,
                    (dayIsToday || dayIsSelected) && styles.dayNameSelected,
                  ]}>
                    {formatDayName(day.date)}
                  </Text>
                  <Text style={[
                    styles.dayNumber,
                    (dayIsToday || dayIsSelected) && styles.dayNumberSelected,
                  ]}>
                    {day.date.getDate()}
                  </Text>
                  {dayHasWorkout && <View style={styles.workoutIndicator} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* TIME VARIANT SELECTOR */}
        <View style={styles.selectorContainer}>
          <View style={styles.segmentedControl}>
            {([30, 45, 60, 90] as const).map((duration) => (
              <TouchableOpacity
                key={duration}
                style={[
                  styles.segmentButton,
                  selectedVariant === duration && styles.segmentSelected,
                ]}
                onPress={() => setSelectedVariant(duration)}
              >
                <Text style={[
                  styles.segmentText,
                  selectedVariant === duration && styles.segmentTextSelected,
                ]}>
                  {duration} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* WORKOUT SUMMARY CARD */}
        {currentWorkout ? (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.workoutTitle}>{formatWorkoutTitle(currentWorkout)}</Text>
                <Text style={styles.workoutSubtitle}>{formatDate(currentDay.date)}</Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{currentWorkout.exercises.length}</Text>
                  <Text style={styles.statLabel}>Exercises</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{currentWorkout.totalMinutes || currentWorkout.duration}</Text>
                  <Text style={styles.statLabel}>Minutes</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{calculateTotalSets(currentWorkout)}</Text>
                  <Text style={styles.statLabel}>Sets</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.startButton} onPress={handleStartWorkout}>
                <LinearGradient
                  colors={['#00D9C0', '#00B39D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <View style={styles.buttonIconContainer}>
                    <PlayIconSVG />
                  </View>
                  <Text style={styles.buttonText}>Start Workout</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.noWorkoutText}>No workout available for {selectedVariant} minutes</Text>
              <Text style={styles.noWorkoutSubtext}>Try a different duration</Text>
            </View>
          </View>
        )}

        {/* EXERCISE LIST */}
        {currentWorkout && currentWorkout.exercises.length > 0 && (
          <View style={styles.exerciseListContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Exercises</Text>
              <View style={styles.exerciseCountBadge}>
                <Text style={styles.badgeText}>{currentWorkout.exercises.length}</Text>
              </View>
            </View>

            {exercisesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#00D9C0" />
              </View>
            ) : (
              currentWorkout.exercises.map((exerciseInstance, index) => {
                const exercise = exerciseMap[exerciseInstance.exerciseId];
                const exerciseName = exercise?.name || `Exercise ${index + 1}`;
                const equipment = exercise?.equipment?.[0] || exerciseInstance.exerciseId;
                const binderSafe = exercise?.binder_aware || false;
                const pelvicFloorSafe = exercise?.pelvic_floor_safe || false;

                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.exerciseCard}
                    onPress={() => handleExercisePress(exerciseInstance.exerciseId)}
                  >
                    <View style={styles.exerciseThumbnail}>
                      <DumbbellIconSVG />
                    </View>

                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exerciseName}</Text>

                      <View style={styles.exerciseDetailsRow}>
                        <View style={styles.detailBadge}>
                          <Text style={styles.detailText}>{exerciseInstance.sets} sets</Text>
                        </View>
                        <View style={styles.detailBadge}>
                          <Text style={styles.detailText}>{exerciseInstance.reps} reps</Text>
                        </View>
                      </View>

                      {equipment && (
                        <Text style={styles.equipmentText}>{formatEquipmentLabel(equipment)}</Text>
                      )}

                      {(binderSafe || pelvicFloorSafe) && (
                        <View style={styles.safetyTagsRow}>
                          {binderSafe && (
                            <View style={styles.safetyTag}>
                              <Text style={styles.safetyTagText}>Binder Safe</Text>
                            </View>
                          )}
                          {pelvicFloorSafe && (
                            <View style={styles.safetyTag}>
                              <Text style={styles.safetyTagText}>Pelvic Floor</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>

                    <View style={styles.chevronContainer}>
                      <ChevronRightSVG />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* Bottom padding */}
        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>

      {/* Exercise Detail Sheet */}
      {profile && selectedExerciseId && (
        <ExerciseDetailSheet
          exerciseId={selectedExerciseId}
          profile={profile}
          onClose={() => setSelectedExerciseId(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'left',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1A1F26',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburgerIcon: {
    width: 18,
    height: 10,
    justifyContent: 'space-between',
  },
  menuLine: {
    width: 18,
    height: 2,
    backgroundColor: '#E0E4E8',
    borderRadius: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  calendarContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  calendarContent: {
    gap: 10,
  },
  dayCard: {
    width: 56,
    height: 72,
    borderRadius: 14,
    backgroundColor: '#1A1F26',
    borderWidth: 2,
    borderColor: '#2A2F36',
    padding: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayCardToday: {
    borderColor: '#00D9C0',
    backgroundColor: 'rgba(0, 217, 192, 0.08)',
  },
  dayCardSelected: {
    borderColor: '#00D9C0',
    backgroundColor: 'rgba(0, 217, 192, 0.12)',
    shadowColor: '#00D9C0',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  dayNameSelected: {
    color: '#00D9C0',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  dayNumberSelected: {
    color: '#00D9C0',
  },
  workoutIndicator: {
    position: 'absolute',
    bottom: 6,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#00D9C0',
  },
  selectorContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  segmentedControl: {
    backgroundColor: '#1A1F26',
    borderRadius: 12,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  segmentSelected: {
    backgroundColor: '#00D9C0',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  segmentTextSelected: {
    color: '#0F1419',
    fontWeight: '700',
  },
  summaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#1A1F26',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2F36',
  },
  cardHeader: {
    marginBottom: 16,
  },
  workoutTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'left',
  },
  workoutSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'left',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2F36',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00D9C0',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  startButton: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00D9C0',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  buttonIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 20, 25, 0.2)',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F1419',
  },
  exerciseListContainer: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'left',
  },
  exerciseCountBadge: {
    backgroundColor: 'rgba(0, 217, 192, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00D9C0',
  },
  exerciseCard: {
    backgroundColor: '#1A1F26',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2F36',
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#2A2F36',
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 20,
    textAlign: 'left',
  },
  exerciseDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  detailBadge: {
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  detailText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A78BFA',
  },
  equipmentText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'left',
  },
  safetyTagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  safetyTag: {
    backgroundColor: 'rgba(0, 217, 192, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  safetyTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#00D9C0',
    textTransform: 'uppercase',
  },
  chevronContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  createPlanButton: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 200,
  },
  createPlanGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createPlanText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F1419',
  },
  noWorkoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'left',
  },
  noWorkoutSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'left',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
});
