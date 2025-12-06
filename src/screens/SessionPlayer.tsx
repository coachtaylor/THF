// src/screens/SessionPlayer.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text, Modal, Portal, Card } from 'react-native-paper';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import Slider from '@react-native-community/slider';
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
import { fetchAllExercises, getCachedExercises } from '../services/exerciseService';
import { useProfile } from '../hooks/useProfile';
import { getCachedVideo, cacheVideo } from '../services/videoCache';
import { colors, spacing, borderRadius } from '../theme/theme';
import type { OnboardingScreenProps } from '../types/onboarding';
import { CommonActions } from '@react-navigation/native';

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

// SVG Icon Components
const PlayIconSVG = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M8 5 L19 12 L8 19 Z" fill="#0F1419" />
  </Svg>
);

const CheckmarkSVG = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path
      d="M3 9 L7 13 L15 5"
      stroke="#0F1419"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Helper Functions
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function SessionPlayer({ navigation, route }: SessionPlayerProps) {
  const { workout, planId = 'default', warmUp, coolDown, safetyCheckpoints = [] } = route.params;
  const { profile } = useProfile();
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
  
  // New state for main phase UI
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(0);
  const [rpe, setRpe] = useState(7);
  const [restSeconds, setRestSeconds] = useState(0);

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

  // Ref to store rest timer completion callback (avoids hook order issues)
  const restTimerCompleteCallbackRef = useRef<(() => void) | null>(null);

  // Sync reps state when exercise changes (only in main phase)
  useEffect(() => {
    if (phase === 'main' && exercises.length > 0 && currentExerciseIndex < exercises.length) {
      const instance = exercises[currentExerciseIndex];
      if (instance) {
        setReps(instance.reps || 10);
        setWeight(0);
        setRpe(7);
      }
    }
  }, [phase, currentExerciseIndex, exercises.length]);

  // Store completion callback in ref (moved to top to avoid hook order issues)
  // This will be updated when handleRestTimerComplete is defined
  useEffect(() => {
    // This effect runs on every render to keep the ref up to date
    // handleRestTimerComplete will be defined later, but we'll update the ref there
  });

  // Update rest timer (moved to top to avoid hook order issues)
  useEffect(() => {
    if (phase === 'main' && showRestTimer && exercises.length > 0 && currentExerciseIndex < exercises.length) {
      const instance = exercises[currentExerciseIndex];
      if (instance) {
        const initialSeconds = instance.restSeconds || 60;
        setRestSeconds(initialSeconds);
        
        const interval = setInterval(() => {
          setRestSeconds(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              setShowRestTimer(false);
              // Call completion callback if available (will be set by handleRestTimerComplete)
              setTimeout(() => {
                if (restTimerCompleteCallbackRef.current) {
                  restTimerCompleteCallbackRef.current();
                }
              }, 0);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(interval);
      }
    } else if (phase === 'main' && !showRestTimer && restSeconds > 0) {
      // Reset when rest timer is hidden
      setRestSeconds(0);
    }
  }, [phase, showRestTimer, currentExerciseIndex, exercises.length]);

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
        <ActivityIndicator size="large" color={colors.accent.primary} />
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
        <ActivityIndicator size="large" color={colors.accent.primary} />
        <Text style={styles.loadingText}>Loading workout exercises...</Text>
        <Text style={[styles.loadingText, { marginTop: spacing.s, fontSize: 12, color: colors.text.tertiary }]}>
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
        <Text style={[styles.errorText, { fontSize: 12, marginTop: spacing.s, color: colors.text.tertiary }]}>
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
        <ActivityIndicator size="large" color={colors.accent.primary} />
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

  // Update ref with completion callback (safe to do in render since it's not a hook)
  restTimerCompleteCallbackRef.current = handleRestTimerComplete;

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
    // WorkoutSummary is now in both OnboardingNavigator and MainNavigator
    navigation.navigate('WorkoutSummary', {
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

  const handleSwapSelect = async (swapExerciseId: string) => {
    // Track the original exercise ID before swapping
    const originalExerciseId = currentExercise.id;

    // Track swapped exercise mapping (original -> new)
    setSwappedExercises(prev => {
      const newMap = new Map(prev);
      newMap.set(originalExerciseId, swapExerciseId);
      return newMap;
    });

    // Find the swapped exercise from cached exercises
    try {
      const allExercises = await getCachedExercises();
      const swappedExercise = allExercises.find(ex =>
        ex.id === swapExerciseId || ex.slug === swapExerciseId
      );

      if (swappedExercise) {
        // Update exercises array with swapped exercise
        setExercises(prev => {
          const updated = [...prev];
          const currentInstance = updated[currentExerciseIndex];
          updated[currentExerciseIndex] = {
            // Spread the new exercise data
            ...swappedExercise,
            // Preserve the instance data (sets, reps, format, rest)
            sets: currentInstance.sets,
            reps: currentInstance.reps,
            format: currentInstance.format,
            restSeconds: currentInstance.restSeconds,
            exerciseId: swappedExercise.id,
          } as ExerciseInstanceWithData;
          return updated;
        });

        // Reset video for new exercise
        setVideoUri(null);
        setLoadingVideo(false);

        console.log('✅ Swapped to exercise:', swappedExercise.name);
      } else {
        console.warn('⚠️ Could not find swapped exercise:', swapExerciseId);
      }
    } catch (error) {
      console.error('❌ Error swapping exercise:', error);
    }

    setShowSwapDrawer(false);
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
          completedAt,
          swappedExercises,
          painFlaggedExercises
        );
        await saveSession(sessionData);
        // Show success message or navigate
        navigation.navigate('PlanView');
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }
  };

  // Handle back button with confirmation
  const handleBack = () => {
    if (completedSets.length > 0) {
      Alert.alert('End Workout?', 'Progress will be saved but workout incomplete.', [
        { text: 'Keep Going', style: 'cancel' },
        { text: 'End Workout', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
    } else {
      navigation.goBack();
    }
  };

  // Handle video play
  const handlePlayVideo = () => {
    if (videoUri) {
      setShowCuesModal(true);
    }
  };

  // Handle skip set
  const handleSkipSet = () => {
    // Move to next set or exercise
    const completedSetsForExercise = completedSets.filter(
      set => set.exerciseId === currentExercise.id
    );
    if (completedSetsForExercise.length >= totalSets) {
      // Move to next exercise
      if (currentExerciseIndex < exercises.length - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentRPE(null);
      } else {
        handleMainWorkoutComplete();
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

  // Calculate progress
  const progress = ((currentExerciseIndex + 1) / exercises.length) * 100;
  const totalElapsedSeconds = totalElapsedSecondsRef.current;

  // Render main phase with new design
  if (phase === 'main') {
    return (
      <SafeAreaView style={styles.container}>
        <SafetyCheckpointModal
          visible={showSafetyCheckpoint}
          message={safetyCheckpoints[0]?.message || 'Time for a binder break'}
          breakDurationMinutes={10}
          onStartBreak={handleStartBreak}
          onTakeBreakLater={handleTakeBreakLater}
        />
        
        {/* Header */}
        <View style={[styles.newHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.workoutTimer}>{formatTime(totalElapsedSeconds)}</Text>
            <Text style={styles.timerLabel}>Total Time</Text>
          </View>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressInfoRow}>
            <Text style={styles.progressText}>
              {currentExerciseIndex + 1} / {exercises.length} exercises
            </Text>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Exercise Card */}
          <View style={styles.exerciseCard}>
            <Text style={styles.exerciseName}>{currentExercise.name}</Text>
            
            {currentExercise.target_muscle && (
              <View style={styles.targetBadge}>
                <Text style={styles.targetBadgeText}>{currentExercise.target_muscle}</Text>
              </View>
            )}

            {/* Video Thumbnail */}
            {!profile?.low_sensory_mode && (
              <TouchableOpacity style={styles.videoContainer} onPress={handlePlayVideo}>
                {loadingVideo ? (
                  <View style={styles.videoThumbnail}>
                    <ActivityIndicator size="large" color={colors.accent.primary} />
                  </View>
                ) : videoUri ? (
                  <Video
                    source={{ uri: videoUri }}
                    style={styles.video}
                    useNativeControls={false}
                    resizeMode={ResizeMode.COVER}
                    isLooping
                    shouldPlay
                    isMuted
                  />
                ) : (currentExercise.videoUrl || currentExercise.video_url) ? (
                  <View style={styles.videoThumbnail}>
                    <View style={styles.videoPlaceholder}>
                      <Ionicons name="videocam-outline" size={48} color="#6B7280" />
                      <Text style={styles.videoPlaceholderText}>Loading video...</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.videoThumbnail}>
                    <View style={styles.videoPlaceholder}>
                      <Ionicons name="videocam-off-outline" size={48} color="#6B7280" />
                      <Text style={styles.videoPlaceholderText}>No video available</Text>
                    </View>
                  </View>
                )}
                {videoUri && (
                  <View style={styles.playOverlay}>
                    <View style={styles.playButtonCircle}>
                      <PlayIconSVG />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Set Info */}
            <Text style={styles.setInfoText}>
              Set {currentExerciseSets.length + 1} of {totalSets}
            </Text>
          </View>

          {/* Input Controls */}
          <View style={styles.controlsContainer}>
            {/* Reps */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Reps Completed</Text>
              <View style={styles.numberInputContainer}>
                <TouchableOpacity
                  style={styles.numberButton}
                  onPress={() => setReps(Math.max(1, reps - 1))}
                >
                  <Text style={styles.numberButtonText}>−</Text>
                </TouchableOpacity>
                <View style={styles.numberDisplay}>
                  <Text style={styles.numberText}>{reps}</Text>
                </View>
                <TouchableOpacity
                  style={styles.numberButton}
                  onPress={() => setReps(reps + 1)}
                >
                  <Text style={styles.numberButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Weight */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Weight (lbs)</Text>
              <View style={styles.numberInputContainer}>
                <TouchableOpacity
                  style={styles.numberButton}
                  onPress={() => setWeight(Math.max(0, weight - 5))}
                >
                  <Text style={styles.numberButtonText}>−5</Text>
                </TouchableOpacity>
                <View style={styles.numberDisplay}>
                  <Text style={styles.numberText}>{weight}</Text>
                </View>
                <TouchableOpacity
                  style={styles.numberButton}
                  onPress={() => setWeight(weight + 5)}
                >
                  <Text style={styles.numberButtonText}>+5</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* RPE Slider */}
            <View style={styles.rpeContainer}>
              <Text style={styles.inputLabel}>How Hard Was It?</Text>
              <View style={styles.rpeValueContainer}>
                <Text style={styles.rpeValueText}>{rpe}</Text>
              </View>
              <Slider
                value={rpe}
                onValueChange={setRpe}
                minimumValue={1}
                maximumValue={10}
                step={1}
                minimumTrackTintColor={colors.accent.primary}
                maximumTrackTintColor={colors.border.default}
                thumbTintColor={colors.accent.primary}
                style={styles.rpeSlider}
              />
              <View style={styles.rpeLabelsRow}>
                <Text style={styles.rpeLabel}>Easy</Text>
                <Text style={styles.rpeLabel}>Moderate</Text>
                <Text style={styles.rpeLabel}>Max Effort</Text>
              </View>
            </View>
          </View>

          {/* Previous Sets */}
          {currentExerciseSets.length > 0 && (
            <View style={styles.previousSetsContainer}>
              <Text style={styles.previousSetsTitle}>Previous Sets</Text>
              {currentExerciseSets.map((set, index) => (
                <View key={index} style={styles.setHistoryCard}>
                  <Text style={styles.setHistoryText}>
                    Set {set.setNumber}: {set.reps} reps × {set.weight} lbs • RPE {set.rpe}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Actions Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleSkipSet}>
            <Text style={styles.secondaryButtonText}>Skip Set</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setShowCuesModal(true)}
          >
            <Text style={styles.secondaryButtonText}>View Cues</Text>
          </TouchableOpacity>
        </View>

        {/* Complete Button */}
        <View style={styles.completeButtonContainer}>
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => handleSetComplete(reps, weight, rpe)}
          >
            <LinearGradient
              colors={[colors.accent.primary, '#4AA8D8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.completeButtonGradient}
            >
              <CheckmarkSVG />
              <Text style={styles.completeButtonText}>Complete Set</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Rest Timer Overlay */}
        {showRestTimer && (
          <View style={styles.restOverlay}>
            <View style={styles.restCard}>
              <Text style={styles.restTitle}>Rest</Text>
              <Text style={styles.restTimerText}>{formatTime(restSeconds)}</Text>
              <TouchableOpacity
                style={styles.skipRestButton}
                onPress={handleRestTimerComplete}
              >
                <Text style={styles.skipRestButtonText}>Skip Rest</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
                  buttonColor={colors.error}
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
      </SafeAreaView>
    );
  }

  // Original rendering for non-main phases (warm-up, cool-down)
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
          <Ionicons name="close" size={24} color={colors.text.primary} />
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
            <Ionicons name="ellipsis-vertical" size={20} color={colors.text.primary} />
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
                buttonColor={colors.error}
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
    backgroundColor: colors.bg.primary,
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.bg.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
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
    backgroundColor: colors.border.default,
  },
  progressDotActive: {
    backgroundColor: colors.accent.primary,
  },
  progressDotCurrent: {
    backgroundColor: colors.accent.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotSkipped: {
    backgroundColor: colors.text.tertiary,
    opacity: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  timerText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.tertiary,
  },
  exerciseCounter: {
    alignItems: 'center',
    marginBottom: spacing.m,
    marginTop: spacing.m,
  },
  exerciseCounterText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.tertiary,
  },
  backButton: {
    marginLeft: spacing.s,
  },
  lowSensoryNotice: {
    padding: spacing.s,
    backgroundColor: colors.glass.bg,
    borderRadius: 8,
    marginBottom: spacing.s,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  lowSensoryText: {
    color: colors.text.tertiary,
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
  cuesLink: {
    marginBottom: spacing.s,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: 8,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
  },
  cuesLinkText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.accent.primary,
    textDecorationLine: 'underline',
  },
  rpeSection: {
    marginVertical: spacing.s,
  },
  modalContainer: {
    padding: spacing.l,
  },
  modalCard: {
    backgroundColor: colors.glass.bg,
    maxHeight: '80%',
  },
  modalTitle: {
    color: colors.text.primary,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalSection: {
    marginBottom: spacing.m,
  },
  modalSectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent.primary,
    marginBottom: spacing.xs,
  },
  modalListItem: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: spacing.xxs,
    marginLeft: spacing.xs,
  },
  modalTransNotes: {
    borderRadius: 8,
    padding: spacing.s,
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.accent.primary,
    marginTop: spacing.s,
  },
  modalTransNotesTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent.primary,
    marginBottom: spacing.xs,
  },
  modalTransNotesItem: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: spacing.xxs,
  },
  modalTransNoteLabel: {
    fontWeight: '600',
    color: colors.accent.primary,
  },
  modalText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: spacing.m,
  },
  modalBold: {
    fontWeight: '700',
    color: colors.text.primary,
  },
  modalSubtext: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.tertiary,
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
    fontFamily: 'Poppins',
    color: colors.text.secondary,
    marginTop: spacing.m,
  },
  errorText: {
    fontFamily: 'Poppins',
    color: colors.error,
    marginBottom: spacing.m,
  },
  // New styles for redesigned main phase
  newHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  workoutTimer: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  timerLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.tertiary,
    marginTop: 2,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.glass.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: colors.bg.primary,
  },
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: 0.2,
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: colors.glass.bg,
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 5,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  exerciseCard: {
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius['2xl'],
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.border.default,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  exerciseName: {
    fontFamily: 'Poppins',
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  targetBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent.secondaryMuted,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.glass.borderPink,
  },
  targetBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent.secondary,
    letterSpacing: 0.3,
  },
  videoContainer: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.bg.secondary,
    marginBottom: 20,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
  },
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  videoPlaceholderText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.tertiary,
    marginTop: 8,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  playButtonCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  setInfoText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: 4,
  },
  controlsContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  numberButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.glass.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  numberButtonText: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
  },
  numberDisplay: {
    minWidth: 110,
    height: 72,
    backgroundColor: colors.bg.secondary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  numberText: {
    fontFamily: 'Poppins',
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  rpeContainer: {
    marginBottom: 32,
    backgroundColor: colors.glass.bg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  rpeValueContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  rpeValueText: {
    fontFamily: 'Poppins',
    fontSize: 42,
    fontWeight: '800',
    color: colors.accent.primary,
    letterSpacing: -1,
    textShadowColor: 'rgba(91, 206, 250, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  rpeSlider: {
    width: '100%',
    height: 40,
    marginBottom: 10,
  },
  rpeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  rpeLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.tertiary,
    letterSpacing: 0.2,
  },
  previousSetsContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  previousSetsTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  setHistoryCard: {
    backgroundColor: colors.glass.bg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  setHistoryText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: 0.2,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.glass.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  secondaryButtonText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  completeButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: colors.bg.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  completeButton: {
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  completeButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  completeButtonText: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  restOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 12, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  restCard: {
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius['2xl'],
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.glass.borderCyan,
    minWidth: 300,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  restTitle: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 24,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  restTimerText: {
    fontFamily: 'Poppins',
    fontSize: 72,
    fontWeight: '800',
    color: colors.accent.primary,
    marginBottom: 32,
    letterSpacing: -2,
    textShadowColor: 'rgba(91, 206, 250, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  skipRestButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.glass.bgLight,
    borderWidth: 1,
    borderColor: colors.border.default,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  skipRestButtonText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
});

