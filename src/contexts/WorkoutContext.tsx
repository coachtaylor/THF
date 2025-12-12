import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ExerciseInstance } from '../types/plan';
import { SafetyCheckpoint } from '../services/rulesEngine/rules/types';
import { AssembledWorkout } from '../services/workoutGeneration/workoutAssembler';
import { WarmupExercise } from '../services/workoutGeneration/warmupCooldown';
import {
  LastPerformance,
  getLastPerformanceForExercises,
  calculateSuggestedWeight,
} from '../services/storage/workoutLog';

/**
 * Workout phase type - tracks which section of workout we're in
 */
export type WorkoutPhase = 'warmup' | 'main' | 'cooldown';

/**
 * Set log entry for completed sets
 */
export interface SetLog {
  exercise_id: string;
  set_number: number;
  reps: number;
  weight: number;
  rpe: number;
  timestamp: Date;
}

/**
 * Extended workout type for active session
 * Combines AssembledWorkout with session-specific data
 */
export interface ActiveWorkout extends Omit<AssembledWorkout, 'main_workout'> {
  id: string;
  main_workout: Array<ExerciseInstance & {
    exercise_name?: string;
    last_performed?: {
      reps: number;
      weight: number;
    };
    suggested_weight?: number;
  }>;
}

/**
 * Safety checkpoint with trigger information
 */
export interface SafetyCheckpointWithTrigger extends SafetyCheckpoint {
  trigger_exercise_id?: string;
  timing_minutes?: number;
}

interface WorkoutContextType {
  // Current workout state
  workout: ActiveWorkout | null;
  currentExerciseIndex: number;
  currentSetNumber: number;

  // Phase tracking
  currentPhase: WorkoutPhase;
  phaseExerciseIndex: number; // Index within current phase
  completedWarmupExercises: string[]; // Track completed warmup exercises by name
  completedCooldownExercises: string[]; // Track completed cooldown exercises by name
  skipWarmup: boolean;
  skipCooldown: boolean;

  // Set logging
  currentSetData: {
    reps: number;
    weight: number;
    rpe: number;
  };
  completedSets: SetLog[];

  // Timers
  workoutDuration: number; // Total workout time in seconds
  restTimer: number; // Rest countdown in seconds
  isResting: boolean;

  // Progress
  totalExercises: number;
  exercisesCompleted: number;
  totalSets: number;
  setsCompleted: number;
  isWorkoutComplete: boolean;

  // Phase-specific getters
  currentWarmupExercise: WarmupExercise | null;
  currentCooldownExercise: WarmupExercise | null;
  warmupExerciseCount: number;
  cooldownExerciseCount: number;

  // Exercise history for weight suggestions
  exerciseHistory: Map<string, LastPerformance>;
  getExerciseLastPerformance: (exerciseId: string) => LastPerformance | null;
  getSuggestedWeight: (exerciseId: string) => number | null;

  // Actions
  startWorkout: (workout: ActiveWorkout, options?: { skipWarmup?: boolean; userId?: string }) => Promise<void>;
  updateSetData: (field: 'reps' | 'weight' | 'rpe', value: number) => void;
  completeSet: () => Promise<void>;
  skipSet: () => void;
  skipRest: () => void;
  nextExercise: () => void;
  previousExercise: () => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  completeWorkout: () => Promise<void>;
  clearWorkout: () => void;

  // Phase actions
  completeWarmupExercise: () => void;
  skipWarmupPhase: () => void;
  completeCooldownExercise: () => void;
  skipCooldownPhase: () => void;

  // Safety
  checkpointTriggered: boolean;
  currentCheckpoint: SafetyCheckpointWithTrigger | null;
  dismissCheckpoint: () => void;
}

export const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [workout, setWorkout] = useState<ActiveWorkout | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [completedSets, setCompletedSets] = useState<SetLog[]>([]);

  // Phase tracking state
  const [currentPhase, setCurrentPhase] = useState<WorkoutPhase>('warmup');
  const [phaseExerciseIndex, setPhaseExerciseIndex] = useState(0);
  const [completedWarmupExercises, setCompletedWarmupExercises] = useState<string[]>([]);
  const [completedCooldownExercises, setCompletedCooldownExercises] = useState<string[]>([]);
  const [skipWarmup, setSkipWarmup] = useState(false);
  const [skipCooldown, setSkipCooldown] = useState(false);

  const [currentSetData, setCurrentSetData] = useState({
    reps: 0,
    weight: 0,
    rpe: 7,
  });

  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [checkpointTriggered, setCheckpointTriggered] = useState(false);
  const [currentCheckpoint, setCurrentCheckpoint] = useState<SafetyCheckpointWithTrigger | null>(null);
  const [isWorkoutComplete, setIsWorkoutComplete] = useState(false);

  // Exercise history for weight suggestions
  const [exerciseHistory, setExerciseHistory] = useState<Map<string, LastPerformance>>(new Map());

  // Derived phase values
  const warmupExercises = workout?.warm_up?.exercises || [];
  const cooldownExercises = workout?.cool_down?.exercises || [];
  const warmupExerciseCount = warmupExercises.length;
  const cooldownExerciseCount = cooldownExercises.length;
  const currentWarmupExercise = currentPhase === 'warmup' && phaseExerciseIndex < warmupExercises.length
    ? warmupExercises[phaseExerciseIndex]
    : null;
  const currentCooldownExercise = currentPhase === 'cooldown' && phaseExerciseIndex < cooldownExercises.length
    ? cooldownExercises[phaseExerciseIndex]
    : null;

  // Helper to get last performance for an exercise
  const getExerciseLastPerformance = useCallback((exerciseId: string): LastPerformance | null => {
    return exerciseHistory.get(exerciseId) || null;
  }, [exerciseHistory]);

  // Helper to get suggested weight for an exercise
  const getSuggestedWeight = useCallback((exerciseId: string): number | null => {
    const lastPerf = exerciseHistory.get(exerciseId);
    if (!lastPerf) return null;
    return calculateSuggestedWeight(lastPerf);
  }, [exerciseHistory]);
  
  // Workout timer (total duration)
  useEffect(() => {
    if (!workout || isPaused) return;
    
    const interval = setInterval(() => {
      setWorkoutDuration(prev => {
        const newDuration = prev + 1;
        
        // Check for safety checkpoints every minute
        if (newDuration > 0 && newDuration % 60 === 0) {
          checkForSafetyCheckpoints(newDuration);
        }
        
        return newDuration;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [workout, isPaused, checkForSafetyCheckpoints]);
  
  // Rest timer (countdown)
  useEffect(() => {
    if (!isResting || restTimer <= 0 || isPaused) return;
    
    const interval = setInterval(() => {
      setRestTimer(prev => {
        if (prev <= 1) {
          setIsResting(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isResting, restTimer, isPaused]);
  
  const startWorkout = async (newWorkout: ActiveWorkout, options?: { skipWarmup?: boolean; userId?: string }) => {
    setWorkout(newWorkout);
    setCurrentExerciseIndex(0);
    setCurrentSetNumber(1);
    setCompletedSets([]);
    setWorkoutDuration(0);
    setIsResting(false);
    setRestTimer(0);
    setIsPaused(false);
    setCheckpointTriggered(false);
    setCurrentCheckpoint(null);
    setIsWorkoutComplete(false);

    // Reset phase state
    setCompletedWarmupExercises([]);
    setCompletedCooldownExercises([]);
    setPhaseExerciseIndex(0);
    setSkipWarmup(options?.skipWarmup || false);
    setSkipCooldown(false);

    // Load exercise history for weight suggestions
    if (options?.userId && newWorkout.main_workout.length > 0) {
      try {
        const exerciseIds = newWorkout.main_workout.map(ex => ex.exerciseId);
        const history = await getLastPerformanceForExercises(options.userId, exerciseIds);
        setExerciseHistory(history);
      } catch (error) {
        console.error('Failed to load exercise history:', error);
        setExerciseHistory(new Map());
      }
    } else {
      setExerciseHistory(new Map());
    }

    // Determine starting phase
    const hasWarmup = newWorkout.warm_up?.exercises?.length > 0;
    const shouldStartWithWarmup = hasWarmup && !options?.skipWarmup;

    if (shouldStartWithWarmup) {
      setCurrentPhase('warmup');
    } else {
      setCurrentPhase('main');
      // Pre-fill with last workout data if available for main phase
      const currentExercise = newWorkout.main_workout[0];
      if (currentExercise?.last_performed) {
        setCurrentSetData({
          reps: currentExercise.last_performed.reps,
          weight: currentExercise.last_performed.weight,
          rpe: 7,
        });
      } else if (currentExercise) {
        const repsValue = typeof currentExercise.reps === 'number'
          ? currentExercise.reps
          : parseInt(String(currentExercise.reps).split('-')[0]) || 10;
        setCurrentSetData({
          reps: repsValue,
          weight: currentExercise.suggested_weight || 0,
          rpe: 7,
        });
      }
    }
  };
  
  const updateSetData = (field: 'reps' | 'weight' | 'rpe', value: number) => {
    setCurrentSetData(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const completeSet = async () => {
    if (!workout) return;
    
    const currentExercise = workout.main_workout[currentExerciseIndex];
    
    // Create set log
    const setLog: SetLog = {
      exercise_id: currentExercise.exerciseId,
      set_number: currentSetNumber,
      reps: currentSetData.reps,
      weight: currentSetData.weight,
      rpe: currentSetData.rpe,
      timestamp: new Date(),
    };
    
    // Save set to database
    await saveSetToDatabase(workout.id, setLog);
    
    // Add to completed sets
    setCompletedSets(prev => [...prev, setLog]);
    
    // Check if more sets for this exercise
    if (currentSetNumber < currentExercise.sets) {
      // More sets remaining
      setCurrentSetNumber(prev => prev + 1);
      
      // Start rest timer
      setRestTimer(currentExercise.restSeconds);
      setIsResting(true);
      
      // Reset set data for next set (keep weight, adjust reps if needed)
      setCurrentSetData(prev => ({
        ...prev,
        reps: typeof currentExercise.reps === 'number' 
          ? currentExercise.reps 
          : parseInt(String(currentExercise.reps).split('-')[0]) || prev.reps,
      }));
    } else {
      // Exercise complete, move to next
      nextExercise();
    }
  };
  
  const skipSet = () => {
    if (!workout) return;
    
    const currentExercise = workout.main_workout[currentExerciseIndex];
    
    if (currentSetNumber < currentExercise.sets) {
      setCurrentSetNumber(prev => prev + 1);
    } else {
      nextExercise();
    }
  };

  const skipRest = () => {
    setIsResting(false);
    setRestTimer(0);
  };
  
  const nextExercise = () => {
    if (!workout) return;

    if (currentExerciseIndex < workout.main_workout.length - 1) {
      const nextIndex = currentExerciseIndex + 1;
      const nextEx = workout.main_workout[nextIndex];

      setCurrentExerciseIndex(nextIndex);
      setCurrentSetNumber(1);
      setIsResting(false);
      setRestTimer(0);

      // Pre-fill next exercise data
      const repsValue = typeof nextEx.reps === 'number'
        ? nextEx.reps
        : parseInt(String(nextEx.reps).split('-')[0]) || 10;

      if (nextEx.last_performed) {
        setCurrentSetData({
          reps: nextEx.last_performed.reps,
          weight: nextEx.last_performed.weight,
          rpe: 7,
        });
      } else {
        setCurrentSetData({
          reps: repsValue,
          weight: nextEx.suggested_weight || 0,
          rpe: 7,
        });
      }
    } else {
      // Main workout complete - transition to cooldown or finish
      const hasCooldown = workout.cool_down?.exercises?.length > 0;
      if (hasCooldown && !skipCooldown) {
        setCurrentPhase('cooldown');
        setPhaseExerciseIndex(0);
      } else {
        setIsWorkoutComplete(true);
      }
    }
  };

  // Transition from warmup to main workout
  const transitionToMainWorkout = useCallback(() => {
    if (!workout) return;

    setCurrentPhase('main');
    setPhaseExerciseIndex(0);
    setCurrentExerciseIndex(0);
    setCurrentSetNumber(1);

    // Pre-fill with first main exercise data
    const currentExercise = workout.main_workout[0];
    if (currentExercise?.last_performed) {
      setCurrentSetData({
        reps: currentExercise.last_performed.reps,
        weight: currentExercise.last_performed.weight,
        rpe: 7,
      });
    } else if (currentExercise) {
      const repsValue = typeof currentExercise.reps === 'number'
        ? currentExercise.reps
        : parseInt(String(currentExercise.reps).split('-')[0]) || 10;
      setCurrentSetData({
        reps: repsValue,
        weight: currentExercise.suggested_weight || 0,
        rpe: 7,
      });
    }
  }, [workout]);

  // Complete a warmup exercise and move to next or transition to main
  const completeWarmupExercise = useCallback(() => {
    if (!workout || currentPhase !== 'warmup') return;

    const warmupExs = workout.warm_up?.exercises || [];
    const currentEx = warmupExs[phaseExerciseIndex];

    if (currentEx) {
      setCompletedWarmupExercises(prev => [...prev, currentEx.name]);
    }

    if (phaseExerciseIndex < warmupExs.length - 1) {
      // More warmup exercises
      setPhaseExerciseIndex(prev => prev + 1);
    } else {
      // Warmup complete, transition to main workout
      transitionToMainWorkout();
    }
  }, [workout, currentPhase, phaseExerciseIndex, transitionToMainWorkout]);

  // Skip entire warmup phase
  const skipWarmupPhase = useCallback(() => {
    setSkipWarmup(true);
    transitionToMainWorkout();
  }, [transitionToMainWorkout]);

  // Complete a cooldown exercise and move to next or finish
  const completeCooldownExercise = useCallback(() => {
    if (!workout || currentPhase !== 'cooldown') return;

    const cooldownExs = workout.cool_down?.exercises || [];
    const currentEx = cooldownExs[phaseExerciseIndex];

    if (currentEx) {
      setCompletedCooldownExercises(prev => [...prev, currentEx.name]);
    }

    if (phaseExerciseIndex < cooldownExs.length - 1) {
      // More cooldown exercises
      setPhaseExerciseIndex(prev => prev + 1);
    } else {
      // Cooldown complete, workout finished
      setIsWorkoutComplete(true);
    }
  }, [workout, currentPhase, phaseExerciseIndex]);

  // Skip entire cooldown phase
  const skipCooldownPhase = useCallback(() => {
    setSkipCooldown(true);
    setIsWorkoutComplete(true);
  }, []);
  
  const previousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      setCurrentSetNumber(1);
      setIsResting(false);
      setRestTimer(0);
    }
  };
  
  const pauseWorkout = () => {
    setIsPaused(true);
  };
  
  const resumeWorkout = () => {
    setIsPaused(false);
  };
  
  const completeWorkout = async () => {
    if (!workout) return;
    
    // Save workout completion to database
    await saveWorkoutCompletion(workout.id, {
      duration_minutes: Math.floor(workoutDuration / 60),
      completed_sets: completedSets,
      exercises_completed: currentExerciseIndex + 1,
    });
    
    // Mark as complete (don't clear state yet - let summary screen use it)
    setIsWorkoutComplete(true);
  };

  const clearWorkout = () => {
    // Clear state after summary screen is done
    setWorkout(null);
    setCurrentExerciseIndex(0);
    setCurrentSetNumber(1);
    setCompletedSets([]);
    setWorkoutDuration(0);
    setIsResting(false);
    setRestTimer(0);
    setIsPaused(false);
    setCheckpointTriggered(false);
    setCurrentCheckpoint(null);
    setIsWorkoutComplete(false);
    // Clear phase state
    setCurrentPhase('warmup');
    setPhaseExerciseIndex(0);
    setCompletedWarmupExercises([]);
    setCompletedCooldownExercises([]);
    setSkipWarmup(false);
    setSkipCooldown(false);
    // Clear exercise history
    setExerciseHistory(new Map());
  };
  
  const checkForSafetyCheckpoints = useCallback((durationSeconds: number) => {
    if (!workout) return;
    
    const durationMinutes = Math.floor(durationSeconds / 60);
    
    // Check binding checkpoint (every 45 minutes)
    if (durationMinutes === 45 && workout.safety_checkpoints?.some(c => c.type === 'binder_break')) {
      const checkpoint = workout.safety_checkpoints.find(c => c.type === 'binder_break');
      if (checkpoint) {
        setCurrentCheckpoint(checkpoint as SafetyCheckpointWithTrigger);
        setCheckpointTriggered(true);
        setIsPaused(true);
      }
    }
    
    // Check post-op checkpoint (before specific exercises)
    const currentExercise = workout.main_workout[currentExerciseIndex];
    const exerciseCheckpoint = workout.safety_checkpoints?.find(
      (c): c is SafetyCheckpointWithTrigger => 
        'trigger_exercise_id' in c && 
        c.trigger_exercise_id === currentExercise.exerciseId
    );
    
    if (exerciseCheckpoint && currentSetNumber === 1) {
      setCurrentCheckpoint(exerciseCheckpoint);
      setCheckpointTriggered(true);
      setIsPaused(true);
    }
  }, [workout, currentExerciseIndex, currentSetNumber]);
  
  const dismissCheckpoint = () => {
    setCheckpointTriggered(false);
    setCurrentCheckpoint(null);
    resumeWorkout();
  };
  
  // Calculate derived values
  const totalExercises = workout?.main_workout.length || 0;
  const exercisesCompleted = currentExerciseIndex;
  const totalSets = workout?.main_workout.reduce((sum, ex) => sum + ex.sets, 0) || 0;
  const setsCompleted = completedSets.length;
  
  const value: WorkoutContextType = {
    workout,
    currentExerciseIndex,
    currentSetNumber,
    // Phase tracking
    currentPhase,
    phaseExerciseIndex,
    completedWarmupExercises,
    completedCooldownExercises,
    skipWarmup,
    skipCooldown,
    // Set data
    currentSetData,
    completedSets,
    // Timers
    workoutDuration,
    restTimer,
    isResting,
    // Progress
    totalExercises,
    exercisesCompleted,
    totalSets,
    setsCompleted,
    isWorkoutComplete,
    // Phase-specific getters
    currentWarmupExercise,
    currentCooldownExercise,
    warmupExerciseCount,
    cooldownExerciseCount,
    // Exercise history for weight suggestions
    exerciseHistory,
    getExerciseLastPerformance,
    getSuggestedWeight,
    // Safety
    checkpointTriggered,
    currentCheckpoint,
    // Actions
    startWorkout,
    updateSetData,
    completeSet,
    skipSet,
    skipRest,
    nextExercise,
    previousExercise,
    pauseWorkout,
    resumeWorkout,
    completeWorkout,
    clearWorkout,
    // Phase actions
    completeWarmupExercise,
    skipWarmupPhase,
    completeCooldownExercise,
    skipCooldownPhase,
    dismissCheckpoint,
  };
  
  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
}

// Safe version that returns null instead of throwing
export function useWorkoutSafe() {
  const context = useContext(WorkoutContext);
  return context || null;
}

// Helper functions

async function saveSetToDatabase(workoutId: string, setLog: SetLog): Promise<void> {
  // TODO: Implement database save
  console.log('Saving set:', setLog);
}

async function saveWorkoutCompletion(workoutId: string, data: {
  duration_minutes: number;
  completed_sets: SetLog[];
  exercises_completed: number;
}): Promise<void> {
  // TODO: Implement database save
  console.log('Completing workout:', data);
}

