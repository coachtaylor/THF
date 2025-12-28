// src/screens/SessionPlayer.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Pressable, Image, Alert, useWindowDimensions, Animated, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text, Modal, Portal, Card } from 'react-native-paper';
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
import SafetyInfoModal from '../components/session/SafetyInfoModal';
import RecoveryReminderBanner from '../components/session/RecoveryReminderBanner';
import { saveSession, buildSessionData } from '../services/sessionLogger';
import type { InjectedCheckpoint } from '../services/workoutGeneration/checkpointInjection';
import { useSessionFeedback } from '../hooks/useSessionFeedback';
import { autoRegress, AutoRegressionResult } from '../services/autoRegress';
import { fetchAllExercises, getCachedExercises } from '../services/exerciseService';
import { useProfile } from '../hooks/useProfile';
import { DumbbellIcon } from '../components/icons/DumbbellIcon';
import ProgressRing from '../components/common/ProgressRing';
import GlassCard from '../components/common/GlassCard';
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

interface SessionPlayerProps extends OnboardingScreenProps<'SessionPlayer'> {
  route: {
    params: {
      workout: Workout;
      planId?: string;
      warmUp?: WarmUpData;
      coolDown?: CoolDownData;
      safetyCheckpoints?: InjectedCheckpoint[];
      selectedSwapExerciseId?: string; // From ExerciseLibraryScreen
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
  const { workout, planId = 'default', warmUp, coolDown, safetyCheckpoints = [], selectedSwapExerciseId } = route.params;
  const { profile } = useProfile();
  const insets = useSafeAreaInsets();

  // Generate a unique session ID for this workout session
  const sessionId = useRef(`session_${workout.id}_${Date.now()}`).current;

  // Session feedback hook for tracking flagged exercises
  const {
    flaggedExercises,
    addFlag,
    isExerciseFlagged,
    hasFlags,
    submitFlags,
    clearFlags,
  } = useSessionFeedback({
    sessionId,
    workoutId: workout.id,
    userId: profile?.id,
  });
  const { width } = useWindowDimensions();
  const isSmall = width < 375;

  const [phase, setPhase] = useState<WorkoutPhase>(warmUp ? 'warm-up' : 'main');
  const [exercises, setExercises] = useState<ExerciseInstanceWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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
  const [showCuesModal, setShowCuesModal] = useState(false);
  const [showSafetyCheckpoint, setShowSafetyCheckpoint] = useState(false);
  const [shownCheckpointIds, setShownCheckpointIds] = useState<Set<string>>(new Set());
  const [currentCheckpoint, setCurrentCheckpoint] = useState<InjectedCheckpoint | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [currentSetBeingCompleted, setCurrentSetBeingCompleted] = useState<number | null>(null);
  const [showSkipExerciseModal, setShowSkipExerciseModal] = useState(false);
  const [showSessionMenu, setShowSessionMenu] = useState(false);
  const [skippedExercises, setSkippedExercises] = useState<Set<string>>(new Set());
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0);
  const [showSafetyInfo, setShowSafetyInfo] = useState(false);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const elapsedTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pausedTimeRef = useRef(0); // Stores elapsed time when paused
  const timerStartRef = useRef<Date | null>(null); // Tracks when timer started/resumed
  
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

  // Handle swap selection from ExerciseLibraryScreen
  useEffect(() => {
    if (selectedSwapExerciseId && exercises.length > 0) {
      handleSwapSelect(selectedSwapExerciseId);
      // Clear the param to prevent re-triggering
      navigation.setParams({ selectedSwapExerciseId: undefined });
    }
  }, [selectedSwapExerciseId, exercises.length]);

  // Debug phase changes
  useEffect(() => {
    console.log('📊 Phase changed:', phase, { exercisesCount: exercises.length, loading });
  }, [phase, exercises.length, loading]);

  // Start tracking elapsed time when main workout starts
  useEffect(() => {
    if (phase === 'main' && mainWorkoutStartedAt && !isTimerPaused) {
      // Initialize timer start reference if not set
      if (!timerStartRef.current) {
        timerStartRef.current = new Date();
      }

      // Clear any existing interval
      if (elapsedTimeIntervalRef.current) {
        clearInterval(elapsedTimeIntervalRef.current);
      }

      elapsedTimeIntervalRef.current = setInterval(() => {
        const now = new Date();
        const sessionElapsed = Math.floor(
          (now.getTime() - timerStartRef.current!.getTime()) / 1000
        );
        const totalElapsed = pausedTimeRef.current + sessionElapsed;
        setTotalElapsedSeconds(totalElapsed);

        // Check for due safety checkpoints dynamically
        if (safetyCheckpoints.length > 0) {
          const dueCheckpoints = safetyCheckpoints.filter(cp => {
            // Generate a unique ID for each checkpoint
            const checkpointId = `${cp.type}-${cp.trigger}-${cp.timing_minutes || 0}`;

            // Skip if already shown
            if (shownCheckpointIds.has(checkpointId)) return false;

            // Only check during-workout checkpoints here
            if (cp.position !== 'during_workout') return false;

            // Check if timing threshold reached (convert minutes to seconds)
            const triggerTimeSeconds = (cp.timing_minutes || 0) * 60;
            return totalElapsed >= triggerTimeSeconds;
          });

          if (dueCheckpoints.length > 0) {
            const checkpoint = dueCheckpoints[0];
            const checkpointId = `${checkpoint.type}-${checkpoint.trigger}-${checkpoint.timing_minutes || 0}`;

            setCurrentCheckpoint(checkpoint);
            setShowSafetyCheckpoint(true);
            setShownCheckpointIds(prev => new Set(prev).add(checkpointId));
          }
        }
      }, 1000);
    } else if (isTimerPaused && elapsedTimeIntervalRef.current) {
      // Paused - clear interval and save current time
      clearInterval(elapsedTimeIntervalRef.current);
      elapsedTimeIntervalRef.current = null;
      pausedTimeRef.current = totalElapsedSeconds;
      timerStartRef.current = null;
    }

    return () => {
      if (elapsedTimeIntervalRef.current) {
        clearInterval(elapsedTimeIntervalRef.current);
        elapsedTimeIntervalRef.current = null;
      }
    };
  }, [phase, mainWorkoutStartedAt, isTimerPaused, shownCheckpointIds, safetyCheckpoints]);

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
      if (__DEV__) console.log('🔄 Loading exercises...', { workoutExercisesCount: workout.exercises.length });
      setLoading(true);
      setLoadError(null); // Clear any previous error
      const allExercises = await fetchAllExercises();
      if (__DEV__) console.log('✅ Fetched all exercises:', allExercises.length);
      const exerciseMap = new Map(allExercises.map(ex => [ex.id, ex]));

      const exercisesWithData: ExerciseInstanceWithData[] = workout.exercises.map(instance => {
        const exercise = exerciseMap.get(instance.exerciseId);
        if (!exercise) {
          if (__DEV__) console.error(`❌ Exercise ${instance.exerciseId} not found in exercise map`);
          throw new Error(`Exercise ${instance.exerciseId} not found`);
        }
        return {
          ...instance,
          exercise,
        };
      });

      if (__DEV__) console.log('✅ Loaded exercises with data:', exercisesWithData.length);
      setExercises(exercisesWithData);
      setStartedAt(new Date().toISOString());
    } catch (error: any) {
      console.error('❌ Failed to load exercises:', error);
      setLoadError(error?.message || 'Unable to load workout exercises. Please try again.');
    } finally {
      setLoading(false);
      if (__DEV__) console.log('✅ Exercise loading complete');
    }
  };

  // Handle safety checkpoint modal dismiss
  const handleDismissCheckpoint = () => {
    setShowSafetyCheckpoint(false);
    setCurrentCheckpoint(null);
  };

  // Handle safety checkpoint modal - for binder breaks
  const handleStartBreak = () => {
    setShowSafetyCheckpoint(false);
    setCurrentCheckpoint(null);
    // Break timer is handled in SafetyCheckpointModal
  };

  const handleTakeBreakLater = () => {
    setShowSafetyCheckpoint(false);
    setCurrentCheckpoint(null);
  };

  // Helper to get checkpoint title based on type
  const getCheckpointTitle = (checkpoint: InjectedCheckpoint | null): string => {
    if (!checkpoint) return 'Safety Reminder';
    switch (checkpoint.type) {
      case 'binder_break':
        return 'Binder Break';
      case 'scar_care':
        return 'Scar Care Reminder';
      case 'sensitivity_check':
        return 'Sensitivity Check';
      case 'post_workout_reminder':
        return 'Post-Workout Reminder';
      case 'safety_reminder':
        return 'Safety Reminder';
      case 'hrt_reminder':
        return 'HRT Reminder';
      default:
        return 'Safety Reminder';
    }
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
        {/* Render appropriate modal based on checkpoint type */}
        {currentCheckpoint?.type === 'binder_break' ? (
          <SafetyCheckpointModal
            visible={showSafetyCheckpoint}
            message={currentCheckpoint?.message || 'Time for a binder break'}
            breakDurationMinutes={10}
            onStartBreak={handleStartBreak}
            onTakeBreakLater={handleTakeBreakLater}
          />
        ) : (
          <SafetyInfoModal
            visible={showSafetyCheckpoint}
            title={getCheckpointTitle(currentCheckpoint)}
            message={currentCheckpoint?.message || ''}
            severity={currentCheckpoint?.severity === 'critical' ? 'high' : currentCheckpoint?.severity === 'high' ? 'high' : currentCheckpoint?.severity === 'medium' ? 'medium' : 'low'}
            onDismiss={handleDismissCheckpoint}
          />
        )}
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
    if (__DEV__) console.log('⏳ Showing loading state for main phase (still loading)');
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

  // Show error if exercise loading failed
  if (loadError) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: Math.max(insets.top, spacing.l) }]}>
        <Ionicons name="alert-circle" size={48} color={colors.error} style={{ marginBottom: spacing.m }} />
        <Text style={styles.errorText}>Unable to Load Workout</Text>
        <Text style={[styles.errorText, { fontSize: 14, marginTop: spacing.s, color: colors.text.tertiary, textAlign: 'center', paddingHorizontal: spacing.xl }]}>
          {loadError}
        </Text>
        <Button
          mode="contained"
          onPress={() => {
            if (__DEV__) console.log('🔄 Retrying exercise load...');
            loadExercises();
          }}
          style={{ marginTop: spacing.l }}
        >
          Try Again
        </Button>
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          style={{ marginTop: spacing.s }}
        >
          Go Back
        </Button>
      </View>
    );
  }

  // Show error if exercises failed to load (only if we're not loading and have no exercises)
  if (phase === 'main' && exercises.length === 0 && !loading && workout.exercises.length > 0) {
    if (__DEV__) console.error('❌ Main phase but no exercises loaded', {
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

    // Validate input - ensure reps is at least 1 and weight is non-negative
    const validatedReps = Math.max(1, Math.round(reps));
    const validatedWeight = Math.max(0, weight);
    const validatedRpe = Math.min(10, Math.max(1, rpe));

    const setNumber = currentExerciseSets.length + 1;

    const newSet: CompletedSet = {
      exerciseId: currentExercise.id,
      setNumber,
      rpe: validatedRpe,
      reps: validatedReps,
      weight: validatedWeight,
      completedAt: new Date().toISOString(),
    };

    const updatedSets = [...completedSets, newSet];
    setCompletedSets(updatedSets);
    setCurrentRPE(null);

    // POST /workouts/{id}/exercises/{exerciseIndex}/log-set
    if (__DEV__) {
      console.log('Set logged:', {
        workoutId: planId,
        exerciseId: currentExercise.id,
        exerciseIndex: currentExerciseIndex,
        setNumber,
        rpe: validatedRpe,
        reps: validatedReps,
        weight: validatedWeight,
      });
    }

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
    console.log('🏁 handleCoolDownComplete called');
    try {
      await handleWorkoutComplete();
    } catch (error) {
      console.error('❌ Error in handleCoolDownComplete:', error);
      Alert.alert('Error', 'Failed to complete workout. Please try again.');
    }
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
      // Pass flagged exercises for post-workout review
      flaggedExercises,
      sessionId,
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

    // Apply auto-regression changes to the current exercise instance
    setExercises(prev => prev.map((ex, idx) => {
      if (idx === currentExerciseIndex) {
        return {
          ...ex,
          exerciseId: result.exerciseId,
          sets: result.sets,
          reps: result.reps,
          exercise: {
            ...ex.exercise,
            id: result.exerciseId,
            name: result.exerciseName,
          },
        };
      }
      return ex;
    }));
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

  // Handle skip set
  const handleSkipSet = () => {
    const currentExerciseSets = completedSets.filter(
      set => set.exerciseId === currentExercise.id
    );
    const setNumber = currentExerciseSets.length + 1;

    // Add a skipped set to completedSets (with skipped flag)
    const skippedSet: CompletedSet = {
      exerciseId: currentExercise.id,
      setNumber,
      rpe: 0,
      reps: 0,
      weight: 0,
      completedAt: new Date().toISOString(),
      skipped: true,
    };

    const updatedSets = [...completedSets, skippedSet];
    setCompletedSets(updatedSets);

    // Check if this was the last set
    const completedSetsForExercise = updatedSets.filter(
      set => set.exerciseId === currentExercise.id
    );

    if (completedSetsForExercise.length >= totalSets) {
      // Last set - move to next exercise or complete workout
      if (currentExerciseIndex < exercises.length - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentRPE(null);
      } else {
        handleMainWorkoutComplete();
      }
    }
    // If more sets remain, the UI will automatically show the next set
    // (currentSet is derived from completedSets.length + 1)
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

  // Render main phase with new design
  if (phase === 'main') {
    return (
      <SafeAreaView style={styles.container}>
        {/* Render appropriate modal based on checkpoint type */}
        {currentCheckpoint?.type === 'binder_break' ? (
          <SafetyCheckpointModal
            visible={showSafetyCheckpoint}
            message={currentCheckpoint?.message || 'Time for a binder break'}
            breakDurationMinutes={10}
            onStartBreak={handleStartBreak}
            onTakeBreakLater={handleTakeBreakLater}
          />
        ) : (
          <SafetyInfoModal
            visible={showSafetyCheckpoint}
            title={getCheckpointTitle(currentCheckpoint)}
            message={currentCheckpoint?.message || ''}
            severity={currentCheckpoint?.severity === 'critical' ? 'high' : currentCheckpoint?.severity === 'high' ? 'high' : currentCheckpoint?.severity === 'medium' ? 'medium' : 'low'}
            onDismiss={handleDismissCheckpoint}
          />
        )}

        {/* Premium Header */}
        <View style={styles.premiumHeader}>
          <Pressable style={styles.headerGlassButton} onPress={handleBack}>
            <Ionicons name="close" size={22} color={colors.text.primary} />
          </Pressable>

          <Pressable
            style={styles.premiumTimerSection}
            onPress={() => setIsTimerPaused(!isTimerPaused)}
            activeOpacity={0.8}
          >
            <ProgressRing
              progress={Math.min(totalElapsedSeconds / ((workout?.duration || 45) * 60), 1)}
              size={72}
              strokeWidth={4}
              color={isTimerPaused ? 'warning' : 'primary'}
            >
              <Text style={[styles.timerDigits, isTimerPaused && styles.timerDigitsPaused]}>
                {formatTime(totalElapsedSeconds)}
              </Text>
            </ProgressRing>
            <Text style={styles.timerStatusLabel}>
              {isTimerPaused ? 'PAUSED' : 'ELAPSED'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.headerGlassButton}
            onPress={() => setShowSessionMenu(true)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={colors.text.primary} />
          </Pressable>
        </View>

        {/* Segmented Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressSegments}>
            {exercises.map((_, index) => {
              const isComplete = index < currentExerciseIndex;
              const isCurrent = index === currentExerciseIndex;
              const setProgress = isCurrent ? (currentExerciseSets.length / totalSets) * 100 : 0;

              return (
                <View
                  key={index}
                  style={[
                    styles.progressSegment,
                    isCurrent && styles.progressSegmentActive,
                  ]}
                >
                  {isComplete && (
                    <LinearGradient
                      colors={[colors.accent.primary, colors.accent.primaryDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  {isCurrent && setProgress > 0 && (
                    <View style={[styles.progressSegmentFill, { width: `${setProgress}%` }]}>
                      <LinearGradient
                        colors={[colors.accent.primary, '#4AA8D8']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressExerciseCount}>
              Exercise {currentExerciseIndex + 1}/{exercises.length}
            </Text>
            <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Recovery Reminder Banner */}
          {profile?.surgeries && profile.surgeries.length > 0 && (
            <RecoveryReminderBanner
              surgeries={profile.surgeries}
              onLearnMore={(surgery) => {
                // Navigate to PostOpMovementGuide when user taps "View Recovery Guide"
                navigation.navigate('PostOpMovementGuide', { surgeryType: surgery.type });
              }}
            />
          )}

          {/* Premium Exercise Card */}
          <View style={styles.exerciseCardWrapper}>
            {/* Floating Set Badge */}
            <View style={styles.setBadge}>
              <LinearGradient
                colors={[colors.accent.primary, colors.accent.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.setBadgeText}>SET {currentExerciseSets.length + 1}/{totalSets}</Text>
            </View>

            <GlassCard variant="hero" style={styles.premiumExerciseCard}>
              {/* Exercise Name */}
              <Text style={styles.premiumExerciseName}>{currentExercise.name}</Text>

              {/* Target Muscles Pill */}
              {currentExercise.target_muscles && (
                <View style={styles.targetPill}>
                  <Ionicons name="body-outline" size={12} color={colors.accent.secondary} />
                  <Text style={styles.targetPillText}>{currentExercise.target_muscles}</Text>
                </View>
              )}

              {/* Exercise Visual */}
              {!profile?.low_sensory_mode && (
                <View style={styles.exerciseVisualContainer}>
                  {currentExercise.media_thumb ? (
                    <Image
                      source={{ uri: currentExercise.media_thumb }}
                      style={styles.exerciseImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.exercisePlaceholder}>
                      <DumbbellIcon size={56} color={colors.text.tertiary} />
                    </View>
                  )}
                </View>
              )}

              {/* Quick Cue Preview */}
              {currentExercise.cue_primary && (
                <View style={styles.quickCueContainer}>
                  <Text style={styles.quickCueText}>"{currentExercise.cue_primary}"</Text>
                </View>
              )}
            </GlassCard>
          </View>

          {/* Premium Input Controls */}
          <View style={styles.premiumControls}>
            {/* Reps Input - Primary */}
            <View style={styles.inputCard}>
              <Text style={styles.inputCardLabel}>REPS COMPLETED</Text>
              <View style={styles.stepperContainer}>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => setReps(Math.max(1, reps - 1))}
                  onLongPress={() => setReps(Math.max(1, reps - 5))}
                >
                  <LinearGradient
                    colors={[colors.glass.bgLight, colors.glass.bg]}
                    style={StyleSheet.absoluteFill}
                  />
                  <Ionicons name="remove" size={28} color={colors.text.primary} />
                </Pressable>

                <View style={styles.stepperValueContainer}>
                  <Text style={styles.stepperValue}>{reps}</Text>
                  <Text style={styles.stepperUnit}>reps</Text>
                </View>

                <Pressable
                  style={styles.stepperButton}
                  onPress={() => setReps(reps + 1)}
                  onLongPress={() => setReps(reps + 5)}
                >
                  <LinearGradient
                    colors={[colors.glass.bgLight, colors.glass.bg]}
                    style={StyleSheet.absoluteFill}
                  />
                  <Ionicons name="add" size={28} color={colors.text.primary} />
                </Pressable>
              </View>
            </View>

            {/* Weight Input */}
            <View style={styles.inputCard}>
              <Text style={styles.inputCardLabel}>WEIGHT</Text>
              <View style={styles.stepperContainer}>
                <Pressable
                  style={styles.stepperButtonSmall}
                  onPress={() => setWeight(Math.max(0, weight - 5))}
                >
                  <Text style={styles.stepperButtonText}>-5</Text>
                </Pressable>

                <View style={styles.stepperValueContainerCompact}>
                  <Text style={styles.stepperValueCompact}>{weight}</Text>
                  <Text style={styles.stepperUnitCompact}>lbs</Text>
                </View>

                <Pressable
                  style={styles.stepperButtonSmall}
                  onPress={() => setWeight(weight + 5)}
                >
                  <Text style={styles.stepperButtonText}>+5</Text>
                </Pressable>
              </View>
            </View>

            {/* RPE Dots */}
            <View style={styles.rpeCard}>
              <View style={styles.rpeHeader}>
                <Text style={styles.inputCardLabel}>EFFORT LEVEL (RPE)</Text>
                <View style={styles.rpeValueBadge}>
                  <Text style={styles.rpeValueBadgeText}>{rpe}/10</Text>
                </View>
              </View>
              <View style={styles.rpeTrack}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <Pressable
                    key={value}
                    style={[
                      styles.rpeDot,
                      rpe >= value && styles.rpeDotActive,
                      rpe === value && styles.rpeDotCurrent,
                    ]}
                    onPress={() => setRpe(value)}
                  />
                ))}
              </View>
              <View style={styles.rpeDotsLabels}>
                <Text style={styles.rpeDotsLabel}>Easy</Text>
                <Text style={styles.rpeDotsLabel}>Moderate</Text>
                <Text style={styles.rpeDotsLabel}>Maximum</Text>
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

        {/* Premium Actions Row */}
        <View style={styles.actionsContainer}>
          <Pressable style={styles.actionButtonSecondary} onPress={handleSkipSet}>
            <Ionicons name="play-skip-forward" size={18} color={colors.text.secondary} />
            <Text style={styles.actionButtonSecondaryText}>Skip</Text>
          </Pressable>

          <View style={styles.actionDivider} />

          <Pressable style={styles.actionButtonSecondary} onPress={() => setShowSwapDrawer(true)}>
            <Ionicons name="swap-horizontal" size={18} color={colors.text.secondary} />
            <Text style={styles.actionButtonSecondaryText}>Swap</Text>
          </Pressable>

          <View style={styles.actionDivider} />

          <Pressable style={styles.actionButtonPrimary} onPress={() => setShowCuesModal(true)}>
            <Ionicons name="information-circle" size={18} color={colors.accent.primary} />
            <Text style={styles.actionButtonPrimaryText}>Cues</Text>
          </Pressable>
        </View>

        {/* Premium Complete Set CTA */}
        <View style={styles.ctaContainer}>
          <Pressable
            style={styles.premiumCompleteButton}
            onPress={() => handleSetComplete(reps, weight, rpe)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.accent.primary, '#45A8D8', colors.accent.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumCompleteButtonGradient}
            >
              {/* Glass highlight */}
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)', 'transparent']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.premiumCompleteButtonHighlight}
              />

              <View style={styles.premiumCompleteButtonContent}>
                <View style={styles.completeCheckCircle}>
                  <Ionicons name="checkmark" size={24} color={colors.accent.primary} />
                </View>
                <Text style={styles.premiumCompleteButtonText}>Complete Set</Text>
              </View>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Premium Rest Timer Overlay */}
        {showRestTimer && (
          <View style={styles.premiumRestOverlay}>
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.85)', 'rgba(10, 10, 15, 0.95)']}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.restContent}>
              <View style={styles.restHeader}>
                <Ionicons name="pause-circle" size={32} color={colors.accent.primary} />
                <Text style={styles.restLabel}>REST</Text>
              </View>

              <ProgressRing
                progress={1 - (restSeconds / (currentExerciseInstance?.restSeconds || 60))}
                size={200}
                strokeWidth={8}
                color="primary"
              >
                <Text style={styles.restTimerLarge}>{formatTime(restSeconds)}</Text>
              </ProgressRing>

              <Text style={styles.restNextUp}>
                Next: Set {currentExerciseSets.length + 2} of {totalSets}
              </Text>

              <Pressable style={styles.skipRestButtonPremium} onPress={handleRestTimerComplete}>
                <Text style={styles.skipRestButtonPremiumText}>Skip Rest</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.text.primary} />
              </Pressable>
            </View>
          </View>
        )}

        {/* Swap Drawer */}
        <SwapDrawer
          visible={showSwapDrawer}
          onDismiss={() => setShowSwapDrawer(false)}
          exercise={currentExercise}
          onSwapSelect={handleSwapSelect}
          onBrowseLibrary={() => {
            navigation.dispatch(
              CommonActions.navigate({
                name: 'ExerciseLibrary',
                params: {
                  mode: 'swap',
                  currentExerciseId: currentExercise?.id,
                  returnRoute: 'SessionPlayer',
                },
              })
            );
          }}
        />

        {/* Skip Exercise Confirmation Modal */}
        <Portal>
          <Modal
            visible={showSkipExerciseModal}
            onDismiss={cancelSkipExercise}
            contentContainerStyle={styles.modalContainer}
            style={styles.modalOverlay}
          >
            <Card style={styles.modalCard} mode="contained">
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
                <Button onPress={cancelSkipExercise} textColor={colors.text.primary}>Cancel</Button>
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
            style={styles.modalOverlay}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalHeaderTitle}>{currentExercise.name}</Text>
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
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
              <Pressable style={styles.modalCloseButton} onPress={() => setShowCuesModal(false)}>
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </Pressable>
            </View>
          </Modal>
        </Portal>
      </SafeAreaView>
    );
  }

  // Original rendering for non-main phases (warm-up, cool-down)
  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.l) }]}>
      {/* Render appropriate modal based on checkpoint type */}
      {currentCheckpoint?.type === 'binder_break' ? (
        <SafetyCheckpointModal
          visible={showSafetyCheckpoint}
          message={currentCheckpoint?.message || 'Time for a binder break'}
          breakDurationMinutes={10}
          onStartBreak={handleStartBreak}
          onTakeBreakLater={handleTakeBreakLater}
        />
      ) : (
        <SafetyInfoModal
          visible={showSafetyCheckpoint}
          title={getCheckpointTitle(currentCheckpoint)}
          message={currentCheckpoint?.message || ''}
          severity={currentCheckpoint?.severity === 'critical' ? 'high' : currentCheckpoint?.severity === 'high' ? 'high' : currentCheckpoint?.severity === 'medium' ? 'medium' : 'low'}
          onDismiss={handleDismissCheckpoint}
        />
      )}
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </Pressable>
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
          {/* Safety adjustments indicator */}
          {(workout.metadata?.rules_applied?.length ?? 0) > 0 && (
            <Pressable
              onPress={() => setShowSafetyInfo(true)}
              style={styles.safetyButton}
            >
              <Ionicons name="shield-checkmark" size={16} color={colors.accent.primaryLight} />
            </Pressable>
          )}
          <Text style={styles.timerText}>
            ⏱️ {Math.floor(totalElapsedSeconds / 60)}:{(totalElapsedSeconds % 60).toString().padStart(2, '0')}
          </Text>
          <Pressable>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.text.primary} />
          </Pressable>
        </View>
      </View>

      {/* Safety Info Modal */}
      <SafetyInfoModal
        visible={showSafetyInfo}
        onClose={() => setShowSafetyInfo(false)}
        rulesApplied={workout.metadata?.rules_applied || []}
        hrtAdjusted={workout.metadata?.hrt_adjusted}
        excludedCount={workout.metadata?.exercises_excluded_count}
      />

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
              onStopIfPain={async () => {
                // Trigger pain flag flow - auto-regress and apply changes
                if (currentExercise && currentExerciseInstance) {
                  try {
                    const result = await autoRegress(currentExercise, currentExerciseInstance, profile);
                    handlePainFlag(result);
                  } catch (error) {
                    console.error('Failed to process pain flag:', error);
                  }
                }
              }}
              onSkipExercise={handleSkipExercise}
              onFlagExercise={addFlag}
              isExerciseFlagged={isExerciseFlagged(
                String(currentExercise.id),
                currentExerciseSets.length + 1
              )}
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
          <Button
            mode="outlined"
            onPress={() => setShowSwapDrawer(true)}
            style={styles.actionButton}
          >
            Swap Exercise
          </Button>
          <PainFlagButton
            exercise={currentExercise}
            exerciseInstance={currentExerciseInstance}
            onPainFlag={handlePainFlag}
            profile={profile}
          />
        </View>
      </ScrollView>

      {/* Skip Exercise Confirmation Modal */}
      <Portal>
        <Modal
          visible={showSkipExerciseModal}
          onDismiss={cancelSkipExercise}
          contentContainerStyle={styles.modalContainer}
          style={styles.modalOverlay}
        >
          <Card style={styles.modalCard} mode="contained">
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
              <Button onPress={cancelSkipExercise} textColor={colors.text.primary}>Cancel</Button>
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
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalHeaderTitle}>{currentExercise.name}</Text>
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
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
            <Pressable style={styles.modalCloseButton} onPress={() => setShowCuesModal(false)}>
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </Pressable>
          </View>
        </Modal>
      </Portal>

      {/* Session Menu Modal */}
      <Portal>
        <Modal
          visible={showSessionMenu}
          onDismiss={() => setShowSessionMenu(false)}
          contentContainerStyle={styles.menuModalContainer}
          style={styles.modalOverlay}
        >
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>Session Options</Text>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setShowSessionMenu(false);
                setIsTimerPaused(!isTimerPaused);
              }}
            >
              <Ionicons
                name={isTimerPaused ? "play-circle-outline" : "pause-circle-outline"}
                size={24}
                color={colors.accent.primary}
              />
              <Text style={styles.menuItemText}>
                {isTimerPaused ? 'Resume Timer' : 'Pause Timer'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setShowSessionMenu(false);
                setShowSwapDrawer(true);
              }}
            >
              <Ionicons name="swap-horizontal-outline" size={24} color={colors.text.primary} />
              <Text style={styles.menuItemText}>Swap Exercise</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setShowSessionMenu(false);
                handleSkipSet();
              }}
            >
              <Ionicons name="play-skip-forward-outline" size={24} color={colors.text.primary} />
              <Text style={styles.menuItemText}>Skip This Exercise</Text>
            </Pressable>

            <View style={styles.menuDivider} />

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setShowSessionMenu(false);
                Alert.alert(
                  'End Workout Early?',
                  'Your progress will be saved, but this workout will be marked as incomplete.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'End Workout',
                      style: 'destructive',
                      onPress: () => navigation.goBack(),
                    },
                  ]
                );
              }}
            >
              <Ionicons name="exit-outline" size={24} color={colors.error} />
              <Text style={[styles.menuItemText, { color: colors.error }]}>End Workout Early</Text>
            </Pressable>

            <Pressable
              style={styles.menuCloseButton}
              onPress={() => setShowSessionMenu(false)}
            >
              <Text style={styles.menuCloseButtonText}>Close</Text>
            </Pressable>
          </View>
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
    gap: spacing.sm,
  },
  safetyButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.accent.primaryMuted,
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
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
  },
  modalContainer: {
    padding: spacing.l,
    margin: spacing.l,
    maxHeight: '80%',
  },
  modalCard: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.lg,
    padding: spacing.l,
  },
  modalHeaderTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.m,
  },
  modalTitle: {
    color: colors.text.primary,
  },
  modalScrollView: {
    maxHeight: 350,
  },
  modalCloseButton: {
    marginTop: spacing.m,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.l,
    borderRadius: borderRadius.m,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignSelf: 'flex-end',
  },
  modalCloseButtonText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
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
    marginBottom: spacing.m,
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

  // Session Menu Modal
  menuModalContainer: {
    padding: spacing.lg,
    margin: spacing.lg,
  },
  menuCard: {
    backgroundColor: colors.bg.elevated,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  menuTitle: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.s,
    borderRadius: borderRadius.lg,
  },
  menuItemText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.m,
  },
  menuCloseButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.m,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
  },
  menuCloseButtonText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.l,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutTimer: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
  },
  timerPaused: {
    color: colors.accent.primary,
  },
  timerIcon: {
    marginLeft: 8,
  },
  timerLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.tertiary,
    marginTop: 2,
    textAlign: 'center',
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.l,
    paddingBottom: spacing.lg,
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
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing['2xl'],
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
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.m,
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
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.bg.secondary,
    marginBottom: 20,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  exerciseThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.bg.secondary,
  },
  noMediaFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  noMediaText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  tipsHint: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 20, 25, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tipsHintText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: colors.accent.primary,
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
    paddingHorizontal: spacing.lg,
    marginBottom: spacing['2xl'],
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
    fontSize: 36,
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
    paddingHorizontal: spacing.lg,
    marginBottom: spacing['2xl'],
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
    paddingHorizontal: spacing.lg,
    gap: spacing.m,
    marginBottom: spacing.m,
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.m,
    paddingBottom: spacing.xl,
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
    padding: spacing['2xl'],
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.glass.borderCyan,
    minWidth: 280,
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
    fontSize: 60,
    fontWeight: '800',
    color: colors.accent.primary,
    marginBottom: spacing['2xl'],
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

  // ============================================
  // PREMIUM UI STYLES
  // ============================================

  // Premium Header
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.s,
    paddingBottom: spacing.m,
  },
  headerGlassButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumTimerSection: {
    alignItems: 'center',
    flex: 1,
  },
  timerDigits: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  timerDigitsPaused: {
    color: colors.warning,
  },
  timerStatusLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.tertiary,
    letterSpacing: 1.5,
    marginTop: 4,
  },

  // Segmented Progress Bar
  progressSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  progressSegments: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.glass.bg,
    overflow: 'hidden',
  },
  progressSegmentActive: {
    backgroundColor: colors.glass.bgLight,
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
  },
  progressSegmentFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressExerciseCount: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  progressPercentage: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent.primary,
  },

  // Premium Exercise Card
  exerciseCardWrapper: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    marginTop: spacing.m,
    position: 'relative',
  },
  premiumExerciseCard: {
    marginTop: 12,
  },
  setBadge: {
    position: 'absolute',
    top: 0,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  setBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '800',
    color: colors.text.inverse,
    letterSpacing: 1,
  },
  premiumExerciseName: {
    fontFamily: 'Poppins',
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.8,
    marginBottom: spacing.s,
  },
  targetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: colors.accent.secondaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glass.borderPink,
    marginBottom: spacing.lg,
  },
  targetPillText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exerciseVisualContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginBottom: spacing.l,
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  exercisePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary,
  },
  exerciseImageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  formTipsBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
  },
  formTipsBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  quickCueContainer: {
    backgroundColor: colors.glass.bg,
    borderRadius: 12,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  quickCueText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Premium Input Controls
  premiumControls: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  inputCard: {
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  inputCardLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.tertiary,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  stepperButton: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  stepperButtonSmall: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  stepperButtonText: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  stepperValueContainer: {
    minWidth: 120,
    alignItems: 'center',
  },
  stepperValue: {
    fontFamily: 'Poppins',
    fontSize: 48,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -2,
  },
  stepperUnit: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.tertiary,
    marginTop: -4,
  },
  stepperValueContainerCompact: {
    minWidth: 100,
    alignItems: 'center',
  },
  stepperValueCompact: {
    fontFamily: 'Poppins',
    fontSize: 36,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -1,
  },
  stepperUnitCompact: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.tertiary,
  },

  // RPE Dots
  rpeCard: {
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  rpeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  rpeValueBadge: {
    backgroundColor: colors.accent.primaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
  },
  rpeValueBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '800',
    color: colors.accent.primary,
  },
  rpeTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s,
    marginBottom: spacing.m,
  },
  rpeDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.glass.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  rpeDotActive: {
    backgroundColor: colors.accent.primaryMuted,
    borderColor: colors.glass.borderCyan,
  },
  rpeDotCurrent: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.primary,
    borderWidth: 2,
    borderColor: colors.accent.primaryLight,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  rpeDotsLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  rpeDotsLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.tertiary,
    letterSpacing: 0.3,
  },

  // Premium Actions Row
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.m,
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.accent.primaryMuted,
  },
  actionButtonSecondaryText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  actionButtonPrimaryText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  actionDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.default,
  },

  // Premium Complete Set CTA
  ctaContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl + 8,
    backgroundColor: colors.bg.primary,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  premiumCompleteButton: {
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
      },
      android: { elevation: 12 },
    }),
  },
  premiumCompleteButtonGradient: {
    flex: 1,
    position: 'relative',
    borderRadius: 36,
  },
  premiumCompleteButtonHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },
  premiumCompleteButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  completeCheckCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumCompleteButtonText: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.inverse,
    letterSpacing: -0.3,
  },

  // Premium Rest Timer Overlay
  premiumRestOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  restHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xl,
  },
  restLabel: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  restTimerLarge: {
    fontFamily: 'Poppins',
    fontSize: 56,
    fontWeight: '800',
    color: colors.accent.primary,
    letterSpacing: -2,
    textShadowColor: 'rgba(91, 206, 250, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
  },
  restNextUp: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.tertiary,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  skipRestButtonPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: colors.glass.bgLight,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  skipRestButtonPremiumText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
});

