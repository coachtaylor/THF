import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/theme';
import { getWeekWorkoutLogs, type WorkoutLog } from '../../services/storage/workoutLog';
import { saveWorkout, isWorkoutSaved, deleteSavedWorkout, findSavedWorkout } from '../../services/storage/savedWorkouts';
import { useProfile } from '../../hooks/useProfile';
import type { Day } from '../../types/plan';
import type { Exercise } from '../../types';

interface WeekDayWithWorkout {
  day: Day;
  workout: any;
  workoutName?: string;
  completed?: boolean;
}

interface UpcomingWorkoutsSectionProps {
  weekDays: WeekDayWithWorkout[];
  exerciseMap: Record<string, Exercise>;
  userId?: string;
  planId?: string;
  onWorkoutPress?: (workout: any) => void;
  onRestDayPress?: (day: Day) => void;
}

type ViewMode = 'upcoming' | 'history';

// Toggle button component
function ViewModeToggle({
  mode,
  onModeChange
}: {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}) {
  return (
    <View style={styles.toggleContainer}>
      <Pressable
        style={[styles.toggleButton, mode === 'upcoming' && styles.toggleButtonActive]}
        onPress={() => onModeChange('upcoming')}
      >
        <Text style={[styles.toggleText, mode === 'upcoming' && styles.toggleTextActive]}>
          Upcoming
        </Text>
      </Pressable>
      <Pressable
        style={[styles.toggleButton, mode === 'history' && styles.toggleButtonActive]}
        onPress={() => onModeChange('history')}
      >
        <Text style={[styles.toggleText, mode === 'history' && styles.toggleTextActive]}>
          History
        </Text>
      </Pressable>
    </View>
  );
}

// History workout card component
function HistoryWorkoutCard({
  dayName,
  date,
  month,
  workoutName,
  status,
  durationMinutes,
  exerciseCount,
  isSaved,
  onSave,
}: {
  dayName: string;
  date: number;
  month: string;
  workoutName: string;
  status: 'completed' | 'missed' | 'abandoned';
  durationMinutes?: number;
  exerciseCount?: number;
  isSaved?: boolean;
  onSave?: () => void;
}) {
  const statusConfig = {
    completed: {
      icon: 'checkmark-circle' as const,
      color: colors.accent.success,
      bgColor: 'rgba(52, 199, 89, 0.1)',
    },
    missed: {
      icon: 'close-circle' as const,
      color: colors.text.disabled,
      bgColor: 'rgba(142, 142, 147, 0.1)',
    },
    abandoned: {
      icon: 'alert-circle' as const,
      color: colors.accent.warning,
      bgColor: 'rgba(255, 159, 10, 0.1)',
    },
  };

  const { icon, color, bgColor } = statusConfig[status];

  return (
    <View style={[styles.historyCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <LinearGradient
        colors={[bgColor, 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Left section - Date */}
      <View style={styles.historyDateSection}>
        <Text style={styles.historyDayName}>{dayName}</Text>
        <Text style={styles.historyDateNumber}>{date}</Text>
        <Text style={styles.historyMonthName}>{month}</Text>
      </View>

      {/* Right section - Details */}
      <View style={styles.historyDetailsSection}>
        <View style={styles.historyNameRow}>
          <Text style={styles.historyWorkoutName} numberOfLines={1}>
            {workoutName}
          </Text>
          <View style={styles.historyIconsRow}>
            {onSave && status === 'completed' && (
              <Pressable onPress={onSave} hitSlop={8} style={styles.historySaveButton}>
                <Ionicons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={isSaved ? colors.accent.primary : colors.text.tertiary}
                />
              </Pressable>
            )}
            <Ionicons name={icon} size={20} color={color} />
          </View>
        </View>

        {status === 'completed' && (
          <View style={styles.historyStatsRow}>
            {durationMinutes && (
              <View style={styles.historyStatItem}>
                <Ionicons name="time-outline" size={12} color={colors.text.tertiary} />
                <Text style={styles.historyStatText}>{durationMinutes} min</Text>
              </View>
            )}
            {exerciseCount && (
              <View style={styles.historyStatItem}>
                <Ionicons name="barbell-outline" size={12} color={colors.text.tertiary} />
                <Text style={styles.historyStatText}>{exerciseCount} exercises</Text>
              </View>
            )}
          </View>
        )}

        {status === 'missed' && (
          <Text style={styles.historyMissedText}>Workout not completed</Text>
        )}

        {status === 'abandoned' && (
          <Text style={styles.historyMissedText}>Workout abandoned early</Text>
        )}
      </View>
    </View>
  );
}

export default function UpcomingWorkoutsSection({
  weekDays,
  exerciseMap,
  userId,
  planId,
  onWorkoutPress,
  onRestDayPress
}: UpcomingWorkoutsSectionProps) {
  const { profile } = useProfile();
  const [viewMode, setViewMode] = useState<ViewMode>('upcoming');
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [savedWorkouts, setSavedWorkouts] = useState<Record<string, boolean>>({});

  // Build tags based on user profile
  const tags: string[] = [];
  if (profile?.binds_chest) tags.push('Binding-Safe');
  if (profile?.on_hrt) tags.push('HRT-Optimized');

  // Fetch workout logs when switching to history view
  useEffect(() => {
    async function fetchLogs() {
      if (!userId) return;

      const today = new Date();
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      monday.setHours(0, 0, 0, 0);

      const logs = await getWeekWorkoutLogs(userId, monday);
      setWorkoutLogs(logs);
    }

    if (viewMode === 'history' && userId) {
      fetchLogs();
    }
  }, [viewMode, userId]);

  // Check saved status for workouts
  useEffect(() => {
    async function checkSavedStatus() {
      if (!userId || !planId) return;

      const savedMap: Record<string, boolean> = {};

      for (const wd of weekDays) {
        if (wd.workout && wd.day.dayNumber) {
          const duration = 45; // Default duration
          const key = `${wd.day.dayNumber}-${duration}`;
          const saved = await isWorkoutSaved(userId, planId, wd.day.dayNumber, duration);
          savedMap[key] = saved;
        }
      }

      setSavedWorkouts(savedMap);
    }

    checkSavedStatus();
  }, [userId, planId, weekDays]);

  // Handle save/unsave workout
  const handleSaveWorkout = useCallback(async (dayNumber: number, workoutName: string, workoutData: any) => {
    if (!userId || !planId) return;

    const duration = 45;
    const key = `${dayNumber}-${duration}`;
    const currentlySaved = savedWorkouts[key];

    try {
      if (currentlySaved) {
        const saved = await findSavedWorkout(userId, planId, dayNumber, duration);
        if (saved) {
          await deleteSavedWorkout(saved.id);
          setSavedWorkouts(prev => ({ ...prev, [key]: false }));
        }
      } else {
        await saveWorkout(userId, {
          planId,
          dayNumber,
          duration,
          name: workoutName,
          data: workoutData,
        });
        setSavedWorkouts(prev => ({ ...prev, [key]: true }));
      }
    } catch (error) {
      console.error('Error saving/unsaving workout:', error);
    }
  }, [userId, planId, savedWorkouts]);

  // Get all days of current week with workout info (for upcoming)
  const getUpcomingWorkouts = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const days: Array<{
      dayName: string;
      date: number;
      month: string;
      isToday: boolean;
      isRestDay: boolean;
      workout?: WeekDayWithWorkout;
      day?: Day;
      fullDate: Date;
    }> = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      const isPast = date.getTime() < todayDate.getTime();
      const isToday = date.getTime() === todayDate.getTime();

      // Check if this day has a workout in the plan
      const workoutDay = weekDays.find(wd => {
        const wdDate = new Date(wd.day.date);
        wdDate.setHours(0, 0, 0, 0);
        return wdDate.getTime() === date.getTime();
      });

      // Only show future days (not past, not today - today is in TodayWorkoutCard)
      if (!isPast && !isToday) {
        // Check if this is a rest day:
        // 1. Explicitly marked as rest day (isRestDay: true)
        // 2. Has day entry but no workout (null workout means rest day)
        // 3. All variants are null (legacy plans without isRestDay field)
        const hasNullVariants = workoutDay?.day?.variants &&
          workoutDay.day.variants[30] === null &&
          workoutDay.day.variants[45] === null &&
          workoutDay.day.variants[60] === null &&
          workoutDay.day.variants[90] === null;
        const isRestDay = workoutDay?.day?.isRestDay === true ||
          (workoutDay && !workoutDay.workout) ||
          hasNullVariants;

        if (workoutDay?.workout) {
          // Workout day
          days.push({
            dayName: dayNames[i],
            date: date.getDate(),
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            isToday: false,
            isRestDay: false,
            workout: workoutDay,
            fullDate: date,
          });
        } else if (isRestDay && workoutDay?.day) {
          // Rest day - include in upcoming
          days.push({
            dayName: dayNames[i],
            date: date.getDate(),
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            isToday: false,
            isRestDay: true,
            day: workoutDay.day,
            fullDate: date,
          });
        }
      }
    }

    // Ensure days are sorted by date (chronological order)
    days.sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());

    return days;
  };

  // Get history data by comparing scheduled workouts with actual logs
  const historyData = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const history = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      const isPast = date.getTime() < todayDate.getTime();

      // Only show past days in history
      if (!isPast) continue;

      // Check if this day had a scheduled workout
      const workoutDay = weekDays.find(wd => {
        const wdDate = new Date(wd.day.date);
        wdDate.setHours(0, 0, 0, 0);
        return wdDate.getTime() === date.getTime();
      });

      if (!workoutDay?.workout) continue;

      // Check if user completed the workout that day
      const dateStr = date.toISOString().split('T')[0];
      const log = workoutLogs.find(l => {
        const logDate = new Date(l.workout_date).toISOString().split('T')[0];
        return logDate === dateStr;
      });

      let status: 'completed' | 'missed' | 'abandoned' = 'missed';
      if (log) {
        status = log.status === 'completed' ? 'completed' : 'abandoned';
      }

      history.push({
        dayName: dayNames[i].slice(0, 3).toUpperCase(),
        date: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        workoutName: workoutDay.workoutName || 'Workout',
        status,
        durationMinutes: log?.duration_minutes,
        exerciseCount: log?.exercises_completed,
        dayNumber: workoutDay.day.dayNumber,
        workoutData: workoutDay.workout,
      });
    }

    return history;
  }, [weekDays, workoutLogs]);

  const upcomingWorkouts = getUpcomingWorkouts();

  // Get muscle groups from exercises
  const getMuscleGroups = (exercises: any[]): string[] => {
    const muscles = new Set<string>();
    exercises.forEach(ex => {
      const exercise = exerciseMap[ex.exerciseId];
      if (exercise?.target_muscles) {
        exercise.target_muscles.split(',').forEach(m => {
          const muscle = m.trim();
          if (muscle.includes('Chest')) muscles.add('Chest');
          else if (muscle.includes('Back') || muscle.includes('Lat')) muscles.add('Back');
          else if (muscle.includes('Shoulder') || muscle.includes('Delt')) muscles.add('Shoulders');
          else if (muscle.includes('Bicep')) muscles.add('Biceps');
          else if (muscle.includes('Tricep')) muscles.add('Triceps');
          else if (muscle.includes('Quad')) muscles.add('Quads');
          else if (muscle.includes('Hamstring')) muscles.add('Hamstrings');
          else if (muscle.includes('Glute')) muscles.add('Glutes');
          else if (muscle.includes('Calf') || muscle.includes('Calves')) muscles.add('Calves');
          else if (muscle.includes('Core') || muscle.includes('Ab')) muscles.add('Core');
        });
      }
    });
    return Array.from(muscles).slice(0, 4);
  };

  // Get exercise names preview
  const getExercisePreview = (exercises: any[]): string[] => {
    return exercises.slice(0, 3).map(ex => {
      const exercise = exerciseMap[ex.exerciseId];
      return exercise?.name || 'Exercise';
    });
  };

  // If no content for either view, return null
  if (upcomingWorkouts.length === 0 && historyData.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Section header with toggle */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar-outline" size={16} color={colors.text.tertiary} />
          <Text style={styles.headerText}>
            {viewMode === 'upcoming' ? 'UPCOMING' : 'THIS WEEK'}
          </Text>
        </View>
        <ViewModeToggle mode={viewMode} onModeChange={setViewMode} />
      </View>

      {/* Upcoming view */}
      {viewMode === 'upcoming' && (
        <>
          {upcomingWorkouts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No more workouts this week</Text>
            </View>
          ) : (
            upcomingWorkouts.map((day, index) => {
              // Render REST DAY card
              if (day.isRestDay && day.day) {
                return (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.restDayCard,
                      pressed && styles.workoutCardPressed,
                    ]}
                    onPress={() => onRestDayPress?.(day.day!)}
                  >
                    <LinearGradient
                      colors={['rgba(245, 169, 184, 0.05)', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />

                    {/* Left section - Date */}
                    <View style={styles.restDayDateSection}>
                      <Text style={styles.dayName}>
                        {day.dayName.slice(0, 3).toUpperCase()}
                      </Text>
                      <Text style={styles.restDayDateNumber}>{day.date}</Text>
                      <Text style={styles.monthName}>{day.month}</Text>
                    </View>

                    {/* Right section - Rest day info */}
                    <View style={styles.detailsSection}>
                      <View style={styles.restDayContent}>
                        <Ionicons name="moon-outline" size={18} color="rgba(245, 169, 184, 0.8)" />
                        <Text style={styles.restDayTitle}>Rest Day</Text>
                      </View>
                      <Text style={styles.restDaySubtitle}>Recovery is part of progress</Text>
                    </View>

                    <View style={styles.chevronContainer}>
                      <Ionicons name="chevron-forward" size={18} color={colors.text.disabled} />
                    </View>
                  </Pressable>
                );
              }

              // Render WORKOUT card
              const exercises = day.workout?.workout?.exercises || [];
              const muscleGroups = getMuscleGroups(exercises);
              const exercisePreview = getExercisePreview(exercises);
              const totalSets = exercises.reduce((sum: number, ex: any) => sum + (ex.sets || 0), 0);

              return (
                <Pressable
                  key={index}
                  style={({ pressed }) => [
                    styles.workoutCard,
                    pressed && styles.workoutCardPressed,
                  ]}
                  onPress={() => onWorkoutPress?.(day.workout)}
                >
                  {/* Subtle gradient overlay */}
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.03)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />

                  {/* Left section - Date */}
                  <View style={styles.dateSection}>
                    <Text style={styles.dayName}>
                      {day.dayName.slice(0, 3).toUpperCase()}
                    </Text>
                    <Text style={styles.dateNumber}>{day.date}</Text>
                    <Text style={styles.monthName}>{day.month}</Text>
                  </View>

                  {/* Right section - Workout details */}
                  <View style={styles.detailsSection}>
                    <View style={styles.workoutNameRow}>
                      <Text style={styles.workoutName}>
                        {day.workout?.workoutName || 'Workout'}
                      </Text>
                      {day.workout?.day?.wasRestDay && (
                        <View style={styles.bonusWorkoutBadge}>
                          <Ionicons name="add-circle" size={10} color="rgba(245, 169, 184, 0.9)" />
                          <Text style={styles.bonusWorkoutText}>Bonus</Text>
                        </View>
                      )}
                      {planId && day.workout && (
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            handleSaveWorkout(
                              day.workout!.day.dayNumber,
                              day.workout!.workoutName || 'Workout',
                              day.workout!.workout
                            );
                          }}
                          hitSlop={8}
                          style={styles.saveButton}
                        >
                          <Ionicons
                            name={savedWorkouts[`${day.workout.day.dayNumber}-45`] ? 'bookmark' : 'bookmark-outline'}
                            size={18}
                            color={savedWorkouts[`${day.workout.day.dayNumber}-45`] ? colors.accent.primary : colors.text.tertiary}
                          />
                        </Pressable>
                      )}
                    </View>

                    {/* Profile-based tags */}
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

                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Ionicons name="barbell-outline" size={12} color={colors.text.tertiary} />
                        <Text style={styles.statText}>{exercises.length} exercises</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons name="layers-outline" size={12} color={colors.text.tertiary} />
                        <Text style={styles.statText}>{totalSets} sets</Text>
                      </View>
                    </View>

                    {muscleGroups.length > 0 && (
                      <View style={styles.muscleRow}>
                        {muscleGroups.map((muscle, i) => (
                          <View key={i} style={styles.muscleTag}>
                            <Text style={styles.muscleText}>{muscle}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.exercisePreview}>
                      {exercisePreview.map((name, i) => (
                        <Text key={i} style={styles.exerciseName} numberOfLines={1}>
                          {i + 1}. {name}
                        </Text>
                      ))}
                      {exercises.length > 3 && (
                        <Text style={styles.moreExercises}>
                          +{exercises.length - 3} more
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.chevronContainer}>
                    <Ionicons name="chevron-forward" size={18} color={colors.text.disabled} />
                  </View>
                </Pressable>
              );
            })
          )}
        </>
      )}

      {/* History view */}
      {viewMode === 'history' && (
        <>
          {historyData.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No workout history yet this week</Text>
            </View>
          ) : (
            historyData.map((item, index) => (
              <HistoryWorkoutCard
                key={index}
                dayName={item.dayName}
                date={item.date}
                month={item.month}
                workoutName={item.workoutName}
                status={item.status}
                durationMinutes={item.durationMinutes}
                exerciseCount={item.exerciseCount}
                isSaved={savedWorkouts[`${item.dayNumber}-45`]}
                onSave={() => handleSaveWorkout(item.dayNumber, item.workoutName, item.workoutData)}
              />
            ))
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.tertiary,
    letterSpacing: 1,
  },
  // Toggle styles
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  toggleButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 7,
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  toggleText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '500',
    color: colors.text.disabled,
  },
  toggleTextActive: {
    color: colors.text.primary,
  },
  // Empty state
  emptyState: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(25, 25, 30, 0.5)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.tertiary,
  },
  // Workout card styles
  workoutCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(25, 25, 30, 0.6)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
    }),
  },
  workoutCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  dateSection: {
    width: 65,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  dayName: {
    fontFamily: 'Poppins',
    fontSize: 9,
    fontWeight: '600',
    color: colors.text.disabled,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dateNumber: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 26,
  },
  monthName: {
    fontFamily: 'Poppins',
    fontSize: 9,
    fontWeight: '500',
    color: colors.text.disabled,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsSection: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  workoutNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  workoutName: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.2,
    flex: 1,
  },
  saveButton: {
    padding: 4,
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '500',
    color: colors.text.disabled,
  },
  muscleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 8,
  },
  muscleTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  muscleText: {
    fontFamily: 'Poppins',
    fontSize: 9,
    fontWeight: '500',
    color: colors.text.tertiary,
    letterSpacing: 0.2,
  },
  exercisePreview: {
    gap: 1,
  },
  exerciseName: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '400',
    color: colors.text.disabled,
  },
  moreExercises: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '500',
    color: colors.text.disabled,
    marginTop: 2,
  },
  chevronContainer: {
    justifyContent: 'center',
    paddingRight: 10,
  },
  // History card styles
  historyCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(25, 25, 30, 0.5)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 8,
    overflow: 'hidden',
  },
  historyDateSection: {
    width: 55,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.05)',
  },
  historyDayName: {
    fontFamily: 'Poppins',
    fontSize: 9,
    fontWeight: '600',
    color: colors.text.tertiary,
    letterSpacing: 0.5,
  },
  historyDateNumber: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 22,
  },
  historyMonthName: {
    fontFamily: 'Poppins',
    fontSize: 9,
    fontWeight: '500',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
  },
  historyDetailsSection: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  historyNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historySaveButton: {
    padding: 2,
  },
  historyWorkoutName: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  historyStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  historyStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyStatText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: colors.text.tertiary,
  },
  historyMissedText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: colors.text.disabled,
    marginTop: 4,
  },
  // Tag styles
  tagsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
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
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  // Rest day card styles
  restDayCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(25, 25, 30, 0.4)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(245, 169, 184, 0.15)',
    marginBottom: 10,
    overflow: 'hidden',
  },
  restDayDateSection: {
    width: 65,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(245, 169, 184, 0.1)',
    backgroundColor: 'rgba(245, 169, 184, 0.03)',
  },
  restDayDateNumber: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '600',
    color: 'rgba(245, 169, 184, 0.7)',
    lineHeight: 26,
  },
  restDayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  restDayTitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(245, 169, 184, 0.9)',
  },
  restDaySubtitle: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: colors.text.disabled,
  },
  // Bonus workout badge (for workouts generated on rest days)
  bonusWorkoutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 169, 184, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  bonusWorkoutText: {
    fontFamily: 'Poppins',
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(245, 169, 184, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
