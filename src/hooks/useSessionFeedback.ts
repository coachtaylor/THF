// useSessionFeedback Hook
// Tracks flagged exercises during an active workout session
// Provides state and actions for exercise-specific feedback

import { useState, useEffect, useCallback } from 'react';
import { FlaggedExercise } from '../types/feedback';
import {
  flagExerciseInSession,
  unflagExerciseInSession,
  getSessionFlags,
  clearSessionFlags,
  submitFlaggedExercisesAsFeedback,
} from '../services/feedback/feedbackReport';

interface UseSessionFeedbackOptions {
  sessionId: string;
  workoutId?: string;
  userId?: string;
}

export function useSessionFeedback({ sessionId, workoutId, userId }: UseSessionFeedbackOptions) {
  const [flaggedExercises, setFlaggedExercises] = useState<FlaggedExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing flags on mount
  useEffect(() => {
    const loadFlags = async () => {
      try {
        const flags = await getSessionFlags(sessionId);
        setFlaggedExercises(flags);
      } catch (error) {
        console.error('Error loading session flags:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFlags();
  }, [sessionId]);

  // Add a flag to an exercise
  const addFlag = useCallback(async (flag: FlaggedExercise) => {
    try {
      await flagExerciseInSession(sessionId, flag);
      setFlaggedExercises(prev => {
        // Check if already flagged (same exercise + set)
        const existingIndex = prev.findIndex(
          f => f.exercise_id === flag.exercise_id && f.set_number === flag.set_number
        );
        if (existingIndex >= 0) {
          // Replace existing
          const updated = [...prev];
          updated[existingIndex] = flag;
          return updated;
        }
        // Add new
        return [...prev, flag];
      });
    } catch (error) {
      console.error('Error adding flag:', error);
      throw error;
    }
  }, [sessionId]);

  // Remove a flag from an exercise
  const removeFlag = useCallback(async (exerciseId: string, setNumber?: number) => {
    try {
      await unflagExerciseInSession(sessionId, exerciseId, setNumber);
      setFlaggedExercises(prev =>
        prev.filter(
          f => !(f.exercise_id === exerciseId && (setNumber === undefined || f.set_number === setNumber))
        )
      );
    } catch (error) {
      console.error('Error removing flag:', error);
      throw error;
    }
  }, [sessionId]);

  // Check if an exercise is flagged
  const isExerciseFlagged = useCallback((exerciseId: string, setNumber?: number) => {
    return flaggedExercises.some(
      f => f.exercise_id === exerciseId && (setNumber === undefined || f.set_number === setNumber)
    );
  }, [flaggedExercises]);

  // Get flag for a specific exercise
  const getExerciseFlag = useCallback((exerciseId: string, setNumber?: number): FlaggedExercise | undefined => {
    return flaggedExercises.find(
      f => f.exercise_id === exerciseId && (setNumber === undefined || f.set_number === setNumber)
    );
  }, [flaggedExercises]);

  // Clear all flags (e.g., when workout is abandoned)
  const clearFlags = useCallback(async () => {
    try {
      await clearSessionFlags(sessionId);
      setFlaggedExercises([]);
    } catch (error) {
      console.error('Error clearing flags:', error);
    }
  }, [sessionId]);

  // Submit all flags as feedback reports (e.g., at workout completion)
  const submitFlags = useCallback(async () => {
    if (!workoutId || !userId) {
      console.warn('Cannot submit flags: missing workoutId or userId');
      return;
    }

    if (flaggedExercises.length === 0) {
      return;
    }

    try {
      await submitFlaggedExercisesAsFeedback(sessionId, workoutId, userId);
      setFlaggedExercises([]);
    } catch (error) {
      console.error('Error submitting flags:', error);
      throw error;
    }
  }, [sessionId, workoutId, userId, flaggedExercises.length]);

  // Get count of flagged exercises
  const flagCount = flaggedExercises.length;

  // Check if there are any flags
  const hasFlags = flagCount > 0;

  return {
    // State
    flaggedExercises,
    flagCount,
    hasFlags,
    isLoading,

    // Actions
    addFlag,
    removeFlag,
    clearFlags,
    submitFlags,

    // Helpers
    isExerciseFlagged,
    getExerciseFlag,
  };
}

export default useSessionFeedback;
