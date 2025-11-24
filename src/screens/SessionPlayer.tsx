// src/screens/SessionPlayer.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text, Modal, Portal, Card } from 'react-native-paper';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Workout, ExerciseInstance } from '../types/plan';
import { Exercise } from '../types';
import { CompletedSet, TimerFormat } from '../types/session';
import Timer from '../components/session/Timer';
import RPELogger from '../components/session/RPELogger';
import SetCompletionForm from '../components/session/SetCompletionForm';
import RestTimer from '../components/session/RestTimer';
import SwapDrawer from '../components/session/SwapDrawer';
import PainFlagButton from '../components/session/PainFlagButton';
import CompletionScreen from '../components/session/CompletionScreen';
import WarmUpPhase from '../components/session/WarmUpPhase';
import CoolDownPhase from '../components/session/CoolDownPhase';
import SafetyCheckpointModal from '../components/session/SafetyCheckpointModal';
import { saveSession, buildSessionData } from '../services/sessionLogger';
import { autoRegress, AutoRegressionResult } from '../services/autoRegress';
import { fetchAllExercises } from '../services/exerciseService';
import { useProfile } from '../hooks/useProfile';
import { getCachedVideo, cacheVideo } from '../services/videoCache';
import { palette, spacing, typography } from '../theme';
import { useWorkout } from '../contexts/WorkoutContext';
import type { OnboardingScreenProps } from '../types/onboarding';

type WorkoutPhase = 'warm-up' | 'main' | 'cool-down';

interface WarmUpData {
  total_duration_minutes: number;
  exercises: Array<{
    name: string;
    duration?: string;
    reps?: string;
    description?: string;
  }>;
}

interface CoolDownData {
  total_duration_minutes: number;
  exercises: Array<{
    name: string;
    duration?: string;
    reps?: string;
    description?: string;
  }>;
}

interface SafetyCheckpoint {
  message: string;
}

interface SessionPlayerProps extends OnboardingScreenProps<'SessionPlayer'> {
  route: {
    params: {
      workout: Workout;
      planId?: string;
      warmUp?: WarmUpData;
      coolDown?: CoolDownData;
      safetyCheckpoints?: SafetyCheckpoint[];
    };
  };
}

// Extended ExerciseInstance with full Exercise data
interface ExerciseInstanceWithData extends ExerciseInstance {
  exercise: Exercise;
}

export default function SessionPlayer({ navigation, route }: SessionPlayerProps) {
  const { workout, planId = 'default', warmUp, coolDown, safetyCheckpoints = [] } = route.params;
  const { profile } = useProfile();
  const { startWorkout } = useWorkout();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<WorkoutPhase>(warmUp ? 'warm-up' : 'main');
  const [exercises, setExercises] = useState<ExerciseInstanceWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState<CompletedSet[]>([]);
  const [startedAt, setStartedAt] = useState<string>(new Date().toISOString());
  const [mainWorkoutStartedAt, setMainWorkoutStartedAt] = useState<string | null>(null);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [showSwapDrawer, setShowSwapDrawer] = useState(false);
  const [currentRPE, setCurrentRPE] = useState<number | null>(null);
  const [swappedExercises, setSwappedExercises] = useState<Map<string, string>>(new Map());
  const [painFlaggedExercises, setPainFlaggedExercises] = useState<Set<string>>(new Set());
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [showCuesModal, setShowCuesModal] = useState(false);
  const [showSafetyCheckpoint, setShowSafetyCheckpoint] = useState(false);
  const [safetyCheckpointShown, setSafetyCheckpointShown] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [currentSetBeingCompleted, setCurrentSetBeingCompleted] = useState<number | null>(null);
  const [showSkipExerciseModal, setShowSkipExerciseModal] = useState(false);
  const [skippedExercises, setSkippedExercises] = useState<Set<string>>(new Set());
  const totalElapsedSecondsRef = useRef(0);
  const elapsedTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load exercise data
  useEffect(() => {
    console.log('🚀 SessionPlayer mounted, loading exercises...');
    loadExercises();
  }, []);

  // Debug phase changes
  useEffect(() => {
    console.log('📊 Phase changed:', phase, { exercisesCount: exercises.length, loading });
  }, [phase, exercises.length, loading]);

  // Start tracking elapsed time when main workout starts
  useEffect(() => {
    if (phase === 'main' && mainWorkoutStartedAt && !elapsedTimeIntervalRef.current) {
      elapsedTimeIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor(
          (new Date().getTime() - new Date(mainWorkoutStartedAt).getTime()) / 1000
        );
        totalElapsedSecondsRef.current = elapsed;

        // Check for safety checkpoint at 45 minutes (2700 seconds)
        if (
          !safetyCheckpointShown &&
          safetyCheckpoints.length > 0 &&
          profile?.binds_chest &&
          elapsed >= 2700
        ) {
          setShowSafetyCheckpoint(true);
          setSafetyCheckpointShown(true);
        }
      }, 1000);
    }

    return () => {
      if (elapsedTimeIntervalRef.current) {
        clearInterval(elapsedTimeIntervalRef.current);
        elapsedTimeIntervalRef.current = null;
      }
    };
  }, [phase, mainWorkoutStartedAt, safetyCheckpointShown, safetyCheckpoints, profile?.binds_chest]);

  // Load video when exercise changes
  useEffect(() => {
    if (phase === 'main' && currentExercise && !profile?.low_sensory_mode) {
      loadVideo();
    } else {
      setVideoUri(null);
    }
  }, [phase, currentExerciseIndex, profile?.low_sensory_mode]);

  const loadExercises = async () => {
    try {
      console.log('🔄 Loading exercises...', { workoutExercisesCount: workout.exercises.length });
      setLoading(true);
      const allExercises = await fetchAllExercises();
      console.log('✅ Fetched all exercises:', allExercises.length);
      const exerciseMap = new Map(allExercises.map(ex => [ex.id, ex]));

      const exercisesWithData: ExerciseInstanceWithData[] = workout.exercises.map(instance => {
        const exercise = exerciseMap.get(instance.exerciseId);
        if (!exercise) {
          console.error(`❌ Exercise ${instance.exerciseId} not found in exercise map`);
          throw new Error(`Exercise ${instance.exerciseId} not found`);
        }
        return {
          ...instance,
          exercise,
        };
      });

      console.log('✅ Loaded exercises with data:', exercisesWithData.length);
      setExercises(exercisesWithData);
      setStartedAt(new Date().toISOString());
    } catch (error) {
      console.error('❌ Failed to load exercises:', error);
    } finally {
      setLoading(false);
      console.log('✅ Exercise loading complete');
    }
  };

  const loadVideo = async () => {
      if (!currentExercise?.videoUrl && !currentExercise?.video_url || profile?.low_sensory_mode) {
      setVideoUri(null);
      return;
    }

    try {
      setLoadingVideo(true);
      const cached = await getCachedVideo(currentExercise.id);
      
      if (cached) {
        setVideoUri(cached);
        setLoadingVideo(false);
        return;
      }

      const videoUrl = currentExercise.videoUrl || currentExercise.video_url;
      if (videoUrl) {
        const uri = await cacheVideo(currentExercise.id, videoUrl);
        setVideoUri(uri);
      }
    } catch (error) {
      console.warn('Failed to load exercise video', error);
    } finally {
      setLoadingVideo(false);
    }
  };

  // Handle safety checkpoint modal
  const handleStartBreak = () => {
    setShowSafetyCheckpoint(false);
    // Break timer is handled in SafetyCheckpointModal
  };

  const handleTakeBreakLater = () => {
    setShowSafetyCheckpoint(false);
  };

  const handleSkipExercise = () => {
    setShowSkipExerciseModal(true);
  };

  const confirmSkipExercise = () => {
    if (!currentExercise) return;
    
    // Mark exercise as skipped
    setSkippedExercises(prev => new Set(prev).add(currentExercise.id));
    
    // Log skip
    console.log('Exercise skipped:', {
      exerciseId: currentExercise.id,
      exerciseIndex: currentExerciseIndex,
      exerciseName: currentExercise.name,
    });

    // Move to next exercise or complete workout
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentRPE(null);
      setShowRestTimer(false);
      setShowSkipExerciseModal(false);
    } else {
      // Last exercise - complete main workout
      setShowSkipExerciseModal(false);
      handleMainWorkoutComplete();
    }
  };

  const cancelSkipExercise = () => {
    setShowSkipExerciseModal(false);
  };

  const handleWarmUpComplete = () => {
    console.log('🔥🔥🔥 Warm-up complete button clicked 🔥🔥🔥');
    console.log('Current state BEFORE update:', { 
      phase, 
      exercisesCount: exercises.length, 
      loading,
      workoutExercises: workout.exercises.length 
    });
    
    // Always set phase to main - the component will handle loading state
    console.log('Setting phase to main...');
    setPhase('main');
    const startTime = new Date().toISOString();
    setMainWorkoutStartedAt(startTime);
    
    // POST /workouts/{id}/start - session started
    console.log('✅✅✅ Phase set to main, workout started:', { 
      workoutId: planId, 
      startedAt: startTime,
      exercisesCount: exercises.length,
      willShowMainWorkout: exercises.length > 0 && !loading
    });
    
    // Force a re-render check
    setTimeout(() => {
      console.log('🔄 State check after phase change:', {
        phase,
        exercisesCount: exercises.length,
        loading,
        currentPhase: phase // This will still be 'warm-up' due to closure, but state should be 'main'
      });
    }, 100);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: Math.max(insets.top, spacing.l) }]}>
        <ActivityIndicator size="large" color={palette.tealPrimary} />
        <Text style={styles.loadingText}>Loading workout...</Text>
      </View>
    );
  }

  // Show Warm-Up Phase
  if (phase === 'warm-up' && warmUp) {
    const warmUpExercises = warmUp.exercises.map(ex => ({
      ...ex,
      description: ex.description || 'Follow along with the movement',
    }));

    return (
      <>
        <WarmUpPhase
          warmUpExercises={warmUpExercises}
          totalDurationMinutes={warmUp.total_duration_minutes}
          onComplete={handleWarmUpComplete}
        />
        <SafetyCheckpointModal
          visible={showSafetyCheckpoint}
          message={safetyCheckpoints[0]?.message || 'Time for a binder break'}
          breakDurationMinutes={10}
          onStartBreak={handleStartBreak}
          onTakeBreakLater={handleTakeBreakLater}
        />
      </>
    );
  }

  // Show Cool-Down Phase
  if (phase === 'cool-down' && coolDown) {
    const coolDownExercises = coolDown.exercises.map(ex => ({
      ...ex,
      description: ex.description || 'Take your time with this stretch',
    }));

    return (
      <CoolDownPhase
        coolDownExercises={coolDownExercises}
        totalDurationMinutes={coolDown.total_duration_minutes}
        onComplete={handleCoolDownComplete}
      />
    );
  }

  // Show loading state if in main phase but exercises aren't loaded yet
  // Only show loading if we're actually still loading OR if exercises is empty AND we have workout exercises to load
  if (phase === 'main' && loading) {
    console.log('⏳ Showing loading state for main phase (still loading)');
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: Math.max(insets.top, spacing.l) }]}>
        <ActivityIndicator size="large" color={palette.tealPrimary} />
        <Text style={styles.loadingText}>Loading workout exercises...</Text>
        <Text style={[styles.loadingText, { marginTop: spacing.s, fontSize: 12, color: palette.midGray }]}>
          Preparing exercises...
        </Text>
      </View>
    );
  }

  // Show error if exercises failed to load (only if we're not loading and have no exercises)
  if (phase === 'main' && exercises.length === 0 && !loading && workout.exercises.length > 0) {
    console.error('❌ Main phase but no exercises loaded', { 
      workoutExercisesCount: workout.exercises.length,
      exercisesStateCount: exercises.length 
    });
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: Math.max(insets.top, spacing.l) }]}>
        <Text style={styles.errorText}>No exercises found</Text>
        <Text style={[styles.errorText, { fontSize: 12, marginTop: spacing.s, color: palette.midGray }]}>
          Workout has {workout.exercises.length} exercises but couldn't load them
        </Text>
        <Button mode="outlined" onPress={() => {
          console.log('🔄 Retrying exercise load...');
          loadExercises();
        }}>
          Retry
        </Button>
        <Button mode="outlined" onPress={() => navigation.goBack()} style={{ marginTop: spacing.s }}>
          Go Back
        </Button>
      </View>
    );
  }

  // Debug: Log when we're about to render main workout
  if (phase === 'main' && exercises.length > 0) {
    console.log('✅ Rendering main workout', { 
      exerciseIndex: currentExerciseIndex, 
      totalExercises: exercises.length,
      currentExercise: exercises[currentExerciseIndex]?.exercise?.name 
    });
  }

  const currentExerciseInstance = exercises[currentExerciseIndex];
  const currentExercise = currentExerciseInstance?.exercise;

  if (!currentExercise) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: Math.max(insets.top, spacing.l) }]}>
        <ActivityIndicator size="large" color={palette.tealPrimary} />
        <Text style={styles.loadingText}>Loading exercise...</Text>
      </View>
    );
  }

  // Get current exercise's completed sets
  const currentExerciseSets = completedSets.filter(
    set => set.exerciseId === currentExercise.id
  );

  // Determine timer format - use exercise instance format or default to straight_sets
  const timerFormat: TimerFormat = 
    (currentExerciseInstance.format as TimerFormat) || 'straight_sets';
  const totalSets = currentExerciseInstance.sets;

  const handleSetComplete = (reps: number, weight: number, rpe: number) => {
    if (!currentExercise) return;
    
    const setNumber = currentExerciseSets.length + 1;
    
    const newSet: CompletedSet = {
      exerciseId: currentExercise.id,
      setNumber,
      rpe,
      reps,
      weight,
      completedAt: new Date().toISOString(),
    };

    const updatedSets = [...completedSets, newSet];
    setCompletedSets(updatedSets);
    setCurrentRPE(null);

    // POST /workouts/{id}/exercises/{exerciseIndex}/log-set
    console.log('Set logged:', {
      workoutId: planId,
      exerciseId: currentExercise.id,
      exerciseIndex: currentExerciseIndex,
      setNumber,
      rpe,
      reps,
      weight,
    });

    // Show rest timer (unless it's the last set of the last exercise)
    const completedSetsForExercise = updatedSets.filter(
      set => set.exerciseId === currentExercise.id
    );

    if (completedSetsForExercise.length >= totalSets) {
      // Last set of current exercise - check if there are more exercises
      if (currentExerciseIndex < exercises.length - 1) {
        // More exercises - show rest timer, then move to next exercise
        setShowRestTimer(true);
        setCurrentSetBeingCompleted(setNumber);
      } else {
        // Last set of last exercise - complete main workout
        handleMainWorkoutComplete();
      }
    } else {
      // More sets remaining - show rest timer
      setShowRestTimer(true);
      setCurrentSetBeingCompleted(setNumber);
    }
  };

  const handleRestTimerComplete = () => {
    setShowRestTimer(false);
    const completedSetsForExercise = completedSets.filter(
      set => set.exerciseId === currentExercise.id
    );

    // Check if all sets for current exercise are complete
    if (completedSetsForExercise.length >= totalSets) {
      // Move to next exercise
      if (currentExerciseIndex < exercises.length - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentRPE(null);
      } else {
        handleMainWorkoutComplete();
      }
    }
    setCurrentSetBeingCompleted(null);
  };

  const handleMainWorkoutComplete = () => {
    if (coolDown) {
      setPhase('cool-down');
    } else {
      handleWorkoutComplete();
    }
  };

  const handleCoolDownComplete = async () => {
    await handleWorkoutComplete();
  };

  const handleWorkoutComplete = async () => {
    console.log('🏋️ Workout completion started');
    const endTime = new Date().toISOString();
    setCompletedAt(endTime);
    
    // Clear interval
    if (elapsedTimeIntervalRef.current) {
      clearInterval(elapsedTimeIntervalRef.current);
      elapsedTimeIntervalRef.current = null;
    }

    // Calculate workout duration
    const startTime = new Date(startedAt);
    const endTimeDate = new Date(endTime);
    const durationSeconds = Math.floor((endTimeDate.getTime() - startTime.getTime()) / 1000);
    const durationMinutes = Math.floor(durationSeconds / 60);

    // Convert completed sets to WorkoutContext format
    // Group by exercise to get correct set numbers
    const exerciseSetCounts = new Map<string, number>();
    const contextSets = completedSets.map((set) => {
      const count = exerciseSetCounts.get(set.exerciseId) || 0;
      exerciseSetCounts.set(set.exerciseId, count + 1);
      return {
        exercise_id: set.exerciseId,
        set_number: count + 1,
        reps: set.reps,
        weight: set.weight || 0,
        rpe: set.rpe,
        timestamp: new Date(set.completedAt),
      };
    });

    // Create ActiveWorkout for context
    const activeWorkout = {
      id: planId,
      workout_name: `Workout - ${new Date().toLocaleDateString()}`,
      estimated_duration_minutes: durationMinutes,
      warm_up: warmUp || { total_duration_minutes: 0, exercises: [] },
      main_workout: exercises.map((ex, idx) => ({
        exerciseId: ex.id,
        sets: ex.sets || 3,
        reps: ex.reps || 10,
        format: 'straight_sets' as const,
        restSeconds: ex.restSeconds || 60,
        exercise_name: ex.name,
      })),
      cool_down: coolDown || { total_duration_minutes: 0, exercises: [] },
      safety_checkpoints: safetyCheckpoints,
      metadata: {
        template_name: 'Session',
        day_focus: 'Full Body',
        user_goal: profile?.primary_goal || 'general_fitness',
        hrt_adjusted: false,
        rules_applied: [],
        exercises_excluded_count: 0,
        total_exercises: exercises.length,
        generation_timestamp: new Date(),
      },
    };

    // Note: We'll pass data via navigation params instead of context
    // since startWorkout resets everything. WorkoutSummaryScreen will
    // need to be updated to accept navigation params as fallback.
    console.log('✅ Workout data prepared:', {
      exercises: exercises.length,
      sets: completedSets.length,
      duration: durationMinutes,
    });

    // POST /workouts/{id}/complete
    try {
      const sessionData = buildSessionData(
        completedSets,
        planId,
        workout.duration || 15,
        startedAt,
        endTime
      );
      await saveSession(sessionData);
      console.log('✅ Workout saved to database');
    } catch (error) {
      console.error('Failed to save session:', error);
    }

    // Navigate to summary screen with data
    console.log('🧭 Navigating to WorkoutSummaryScreen');
    navigation.replace('WorkoutSummary', {
      workoutData: {
        completedSets: contextSets,
        workoutDuration: durationSeconds,
        totalExercises: exercises.length,
        exercisesCompleted: exercises.length,
        workoutName: `Workout - ${new Date().toLocaleDateString()}`,
      },
    });
  };

  const handleRPESubmit = (rpe: number) => {
    setCurrentRPE(rpe);
  };

  const handleSwapSelect = (swapExerciseId: string) => {
    // Track swapped exercise
    setSwappedExercises(prev => {
      const newMap = new Map(prev);
      newMap.set(currentExercise.id, swapExerciseId);
      return newMap;
    });
    setShowSwapDrawer(false);
    // TODO: Update current exercise with swapped exercise
    console.log('Swapped to exercise:', swapExerciseId);
  };

  const handlePainFlag = async (result: AutoRegressionResult) => {
    // Track pain flagged exercise
    setPainFlaggedExercises(prev => new Set(prev).add(currentExercise.id));
    console.log('Pain flag applied:', result);
    // TODO: Apply auto-regression changes to exercise instance
  };

  const handleSaveSession = async () => {
    if (completedAt) {
      try {
        const sessionData = buildSessionData(
          completedSets,
          planId,
          workout.duration || 15,
          startedAt,
          completedAt
        );
        await saveSession(sessionData);
        // Show success message or navigate
        navigation.navigate('PlanView');
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }
  };

  // Note: Navigation now happens directly in handleWorkoutComplete
  // This useEffect is no longer needed but kept for backwards compatibility

  if (!currentExercise) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: Math.max(insets.top, spacing.l) }]}>
        <Text style={styles.errorText}>Exercise not found</Text>
        <Button mode="outlined" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.l) }]}>
      <SafetyCheckpointModal
        visible={showSafetyCheckpoint}
        message={safetyCheckpoints[0]?.message || 'Time for a binder break'}
        breakDurationMinutes={10}
        onStartBreak={handleStartBreak}
        onTakeBreakLater={handleTakeBreakLater}
      />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={palette.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{workout.duration} min Workout</Text>
          <View style={styles.progressDots}>
            {exercises.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index <= currentExerciseIndex && styles.progressDotActive,
                ]}
              />
            ))}
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.timerText}>
            ⏱️ {Math.floor(totalElapsedSecondsRef.current / 60)}:{(totalElapsedSecondsRef.current % 60).toString().padStart(2, '0')}
          </Text>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={20} color={palette.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Exercise Counter */}
        <View style={styles.exerciseCounter}>
          <Text style={styles.exerciseCounterText}>
            Exercise {currentExerciseIndex + 1} of {exercises.length}
          </Text>
        </View>

        {/* Set Completion Form */}
        {!showRestTimer && currentExercise && (
          <View style={styles.setCompletionSection}>
            <SetCompletionForm
              setNumber={currentExerciseSets.length + 1}
              totalSets={totalSets}
              prescribedReps={currentExerciseInstance.reps}
              exercise={currentExercise}
              previousSet={
                currentExerciseSets.length > 0
                  ? {
                      reps: currentExerciseSets[currentExerciseSets.length - 1].reps,
                      weight: currentExerciseSets[currentExerciseSets.length - 1].weight || 0,
                      rpe: currentExerciseSets[currentExerciseSets.length - 1].rpe,
                    }
                  : undefined
              }
              onComplete={handleSetComplete}
              onViewForm={() => setShowCuesModal(true)}
              onViewDetails={() => setShowCuesModal(true)}
              onStopIfPain={() => {
                // TODO: Open pain flag modal
                console.log('Stop if pain clicked');
              }}
              onSkipExercise={handleSkipExercise}
            />
          </View>
        )}

        {/* Rest Timer */}
        {showRestTimer && currentExerciseInstance && currentExercise && (
          <View style={styles.restTimerSection}>
            <RestTimer
              restSeconds={currentExerciseInstance.restSeconds}
              previousSet={
                currentExerciseSets.length > 0
                  ? {
                      reps: currentExerciseSets[currentExerciseSets.length - 1].reps,
                      weight: currentExerciseSets[currentExerciseSets.length - 1].weight || 0,
                      rpe: currentExerciseSets[currentExerciseSets.length - 1].rpe,
                    }
                  : undefined
              }
              nextSetNumber={currentExerciseSets.length + 1}
              totalSets={totalSets}
              onComplete={handleRestTimerComplete}
              onSkip={handleRestTimerComplete}
              onAddTime={(seconds) => {
                // Extend rest timer
                console.log(`Adding ${seconds} seconds to rest timer`);
              }}
              onSkipExercise={handleSkipExercise}
            />
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {currentExercise.swaps && currentExercise.swaps.length > 0 && (
            <Button
              mode="outlined"
              onPress={() => setShowSwapDrawer(true)}
              style={styles.actionButton}
            >
              Swap Exercise
            </Button>
          )}
          <PainFlagButton
            exercise={currentExercise}
            exerciseInstance={currentExerciseInstance}
            onPainFlag={handlePainFlag}
            profile={profile}
          />
        </View>
      </ScrollView>

      {/* Swap Drawer */}
      <SwapDrawer
        visible={showSwapDrawer}
        onDismiss={() => setShowSwapDrawer(false)}
        exercise={currentExercise}
        onSwapSelect={handleSwapSelect}
      />

      {/* Skip Exercise Confirmation Modal */}
      <Portal>
        <Modal
          visible={showSkipExerciseModal}
          onDismiss={cancelSkipExercise}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <Card.Title
              title="Skip Exercise?"
              titleStyle={styles.modalTitle}
            />
            <Card.Content>
              <Text style={styles.modalText}>
                Are you sure you want to skip <Text style={styles.modalBold}>{currentExercise?.name}</Text>?
              </Text>
              <Text style={styles.modalSubtext}>
                You can always come back to this exercise later. Your progress will be saved.
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button onPress={cancelSkipExercise}>Cancel</Button>
              <Button 
                mode="contained" 
                onPress={confirmSkipExercise}
                buttonColor={palette.error}
              >
                Skip Exercise
              </Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>

      {/* Cues Modal */}
      <Portal>
        <Modal
          visible={showCuesModal}
          onDismiss={() => setShowCuesModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <Card.Title
              title={currentExercise.name}
              titleStyle={styles.modalTitle}
            />
            <Card.Content>
              <ScrollView style={styles.modalScrollView}>
                {currentExercise.neutral_cues && currentExercise.neutral_cues.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Neutral Cues</Text>
                    {currentExercise.neutral_cues.map((cue: string, index: number) => (
                      <Text key={index} style={styles.modalListItem}>
                        • {cue}
                      </Text>
                    ))}
                  </View>
                )}

                {currentExercise.breathing_cues && currentExercise.breathing_cues.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Breathing Cues</Text>
                    {currentExercise.breathing_cues.map((cue: string, index: number) => (
                      <Text key={index} style={styles.modalListItem}>
                        • {cue}
                      </Text>
                    ))}
                  </View>
                )}

                {(currentExercise.trans_notes?.binder || currentExercise.trans_notes?.pelvic_floor) && (
                  <View style={styles.modalTransNotes}>
                    <Text style={styles.modalTransNotesTitle}>Trans-Specific Notes</Text>
                    {currentExercise.trans_notes?.binder && (
                      <Text style={styles.modalTransNotesItem}>
                        <Text style={styles.modalTransNoteLabel}>Binder:</Text>{' '}
                        {currentExercise.trans_notes.binder}
                      </Text>
                    )}
                    {currentExercise.trans_notes?.pelvic_floor && (
                      <Text style={styles.modalTransNotesItem}>
                        <Text style={styles.modalTransNoteLabel}>Pelvic Floor:</Text>{' '}
                        {currentExercise.trans_notes.pelvic_floor}
                      </Text>
                    )}
                  </View>
                )}
              </ScrollView>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => setShowCuesModal(false)}>Close</Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.deepBlack,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.m,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    color: palette.white,
    marginBottom: spacing.xs,
  },
  progressDots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.border,
  },
  progressDotActive: {
    backgroundColor: palette.tealPrimary,
  },
  progressDotCurrent: {
    backgroundColor: palette.tealPrimary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotSkipped: {
    backgroundColor: palette.midGray,
    opacity: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  timerText: {
    ...typography.body,
    color: palette.midGray,
  },
  exerciseCounter: {
    alignItems: 'center',
    marginBottom: spacing.m,
    marginTop: spacing.m,
  },
  exerciseCounterText: {
    ...typography.body,
    color: palette.midGray,
  },
  backButton: {
    marginLeft: spacing.s,
  },
  videoContainer: {
    width: '100%',
    marginBottom: spacing.s,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
  },
  video: {
    width: '100%',
    height: 180,
    backgroundColor: palette.darkerCard,
  },
  lowSensoryNotice: {
    padding: spacing.s,
    backgroundColor: palette.darkCard,
    borderRadius: 8,
    marginBottom: spacing.s,
    borderWidth: 1,
    borderColor: palette.border,
  },
  lowSensoryText: {
    color: palette.midGray,
    textAlign: 'center',
    fontSize: 13,
  },
  timerSection: {
    marginBottom: spacing.s,
  },
  setCompletionSection: {
    marginBottom: spacing.m,
  },
  restTimerSection: {
    marginBottom: spacing.m,
  },
  exerciseNameContainer: {
    marginBottom: spacing.xs,
    alignItems: 'center',
  },
  exerciseName: {
    ...typography.h3,
    color: palette.white,
    textAlign: 'center',
  },
  cuesLink: {
    marginBottom: spacing.s,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: 8,
    backgroundColor: palette.darkCard,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
  },
  cuesLinkText: {
    ...typography.body,
    color: palette.tealPrimary,
    textDecorationLine: 'underline',
  },
  rpeSection: {
    marginVertical: spacing.s,
  },
  modalContainer: {
    padding: spacing.l,
  },
  modalCard: {
    backgroundColor: palette.darkCard,
    maxHeight: '80%',
  },
  modalTitle: {
    color: palette.white,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalSection: {
    marginBottom: spacing.m,
  },
  modalSectionTitle: {
    ...typography.bodyLarge,
    color: palette.tealPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  modalListItem: {
    ...typography.bodySmall,
    color: palette.lightGray,
    marginBottom: spacing.xxs,
    marginLeft: spacing.xs,
  },
  modalTransNotes: {
    borderRadius: 8,
    padding: spacing.s,
    backgroundColor: palette.darkerCard,
    borderWidth: 1,
    borderColor: palette.tealPrimary,
    marginTop: spacing.s,
  },
  modalTransNotesTitle: {
    ...typography.bodyLarge,
    color: palette.tealPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  modalTransNotesItem: {
    ...typography.bodySmall,
    color: palette.lightGray,
    marginBottom: spacing.xxs,
  },
  modalTransNoteLabel: {
    fontWeight: '600',
    color: palette.tealPrimary,
  },
  modalText: {
    ...typography.body,
    color: palette.white,
    marginBottom: spacing.m,
  },
  modalBold: {
    fontWeight: '700',
    color: palette.white,
  },
  modalSubtext: {
    ...typography.bodySmall,
    color: palette.midGray,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.s,
    marginTop: spacing.s,
  },
  actionButton: {
    flex: 1,
  },
  loadingText: {
    color: palette.lightGray,
    marginTop: spacing.m,
  },
  errorText: {
    color: palette.error,
    marginBottom: spacing.m,
  },
});

