// useFeedback Hook
// Manages feedback modal state and submission
// Provides easy access to feedback functionality from components

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import {
  FeedbackCategory,
  FeedbackContext,
  FeedbackSeverity,
} from '../types/feedback';
import { saveFeedbackReport } from '../services/feedback/feedbackReport';
import { useAuth } from '../contexts/AuthContext';

interface FeedbackModalState {
  quickSheetVisible: boolean;
  detailModalVisible: boolean;
  context: FeedbackContext;
  initialCategory?: FeedbackCategory;
  exerciseId?: string;
  exerciseName?: string;
  workoutId?: string;
  setNumber?: number;
}

const initialState: FeedbackModalState = {
  quickSheetVisible: false,
  detailModalVisible: false,
  context: 'general',
};

export function useFeedback() {
  const { user } = useAuth();
  const [modalState, setModalState] = useState<FeedbackModalState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitSuccess, setLastSubmitSuccess] = useState<boolean | null>(null);

  // Open quick feedback sheet
  const openQuickSheet = useCallback((
    context: FeedbackContext = 'general',
    options?: {
      exerciseId?: string;
      exerciseName?: string;
      workoutId?: string;
      setNumber?: number;
    }
  ) => {
    setModalState({
      quickSheetVisible: true,
      detailModalVisible: false,
      context,
      ...options,
    });
  }, []);

  // Open detailed feedback modal
  const openDetailModal = useCallback((
    context: FeedbackContext = 'general',
    options?: {
      initialCategory?: FeedbackCategory;
      exerciseId?: string;
      exerciseName?: string;
      workoutId?: string;
      setNumber?: number;
    }
  ) => {
    setModalState({
      quickSheetVisible: false,
      detailModalVisible: true,
      context,
      ...options,
    });
  }, []);

  // Close all modals
  const closeModals = useCallback(() => {
    setModalState(initialState);
  }, []);

  // Transition from quick sheet to detail modal
  const transitionToDetail = useCallback((category?: FeedbackCategory) => {
    setModalState(prev => ({
      ...prev,
      quickSheetVisible: false,
      detailModalVisible: true,
      initialCategory: category,
    }));
  }, []);

  // Submit quick feedback (single preset)
  const submitQuickFeedback = useCallback(async (
    presetId: string,
    category: FeedbackCategory
  ): Promise<void> => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to submit feedback.');
      return;
    }

    setIsSubmitting(true);
    setLastSubmitSuccess(null);

    try {
      await saveFeedbackReport(
        {
          user_id: user.id,
          category,
          context: modalState.context,
          exercise_id: modalState.exerciseId,
          exercise_name: modalState.exerciseName,
          workout_id: modalState.workoutId,
          set_number: modalState.setNumber,
          quick_feedback: [presetId],
        },
        user.id
      );

      setLastSubmitSuccess(true);
      // Toast will be shown by the component
    } catch (error) {
      console.error('Error submitting quick feedback:', error);
      setLastSubmitSuccess(false);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, modalState]);

  // Submit detailed feedback
  const submitDetailedFeedback = useCallback(async (data: {
    category: FeedbackCategory;
    severity?: FeedbackSeverity;
    quickFeedback: string[];
    description?: string;
  }): Promise<void> => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to submit feedback.');
      return;
    }

    setIsSubmitting(true);
    setLastSubmitSuccess(null);

    try {
      await saveFeedbackReport(
        {
          user_id: user.id,
          category: data.category,
          severity: data.severity,
          context: modalState.context,
          exercise_id: modalState.exerciseId,
          exercise_name: modalState.exerciseName,
          workout_id: modalState.workoutId,
          set_number: modalState.setNumber,
          quick_feedback: data.quickFeedback,
          description: data.description,
        },
        user.id
      );

      setLastSubmitSuccess(true);
    } catch (error) {
      console.error('Error submitting detailed feedback:', error);
      setLastSubmitSuccess(false);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, modalState]);

  return {
    // Modal state
    quickSheetVisible: modalState.quickSheetVisible,
    detailModalVisible: modalState.detailModalVisible,
    context: modalState.context,
    initialCategory: modalState.initialCategory,
    exerciseName: modalState.exerciseName,

    // Actions
    openQuickSheet,
    openDetailModal,
    closeModals,
    transitionToDetail,
    submitQuickFeedback,
    submitDetailedFeedback,

    // Status
    isSubmitting,
    lastSubmitSuccess,
  };
}

export default useFeedback;
