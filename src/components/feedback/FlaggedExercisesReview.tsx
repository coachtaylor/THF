// Flagged Exercises Review Component
// Displays flagged exercises on workout summary screen
// Allows users to add details or submit feedback

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { FlaggedExercise, EXERCISE_FLAG_OPTIONS } from '../../types/feedback';
import FeedbackDetailModal from './FeedbackDetailModal';
import { FeedbackCategory, FeedbackContext } from '../../types/feedback';

interface FlaggedExercisesReviewProps {
  flaggedExercises: FlaggedExercise[];
  onSubmitAll: () => Promise<void>;
  onDismiss: () => void;
  onSubmitWithDetails: (data: {
    category: FeedbackCategory;
    severity?: string;
    quickFeedback: string[];
    description?: string;
  }) => Promise<void>;
  workoutId?: string;
}

export default function FlaggedExercisesReview({
  flaggedExercises,
  onSubmitAll,
  onDismiss,
  onSubmitWithDetails,
  workoutId,
}: FlaggedExercisesReviewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<FlaggedExercise | null>(null);

  if (flaggedExercises.length === 0) {
    return null;
  }

  const handleSubmitAll = async () => {
    setIsSubmitting(true);
    try {
      await onSubmitAll();
    } catch (error) {
      console.error('Error submitting flagged exercises:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDetails = (exercise: FlaggedExercise) => {
    setSelectedExercise(exercise);
    setShowDetailModal(true);
  };

  const handleDetailSubmit = async (data: {
    category: FeedbackCategory;
    severity?: string;
    quickFeedback: string[];
    description?: string;
  }) => {
    await onSubmitWithDetails(data);
    setShowDetailModal(false);
    setSelectedExercise(null);
  };

  const getFlagLabel = (flagType: string) => {
    const option = EXERCISE_FLAG_OPTIONS.find(o => o.type === flagType);
    return option?.label || flagType;
  };

  const getFlagIcon = (flagType: string) => {
    const option = EXERCISE_FLAG_OPTIONS.find(o => o.type === flagType);
    return option?.icon || 'flag';
  };

  // Map flag type to initial category
  const getInitialCategory = (flag: FlaggedExercise): FeedbackCategory | undefined => {
    switch (flag.flag_type) {
      case 'pain':
        return 'safety_concern';
      case 'dysphoria':
        return 'dysphoria_trigger';
      case 'too_hard':
      case 'too_easy':
        return 'difficulty_issue';
      case 'unclear_instructions':
        return 'instruction_clarity';
      default:
        return undefined;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="flag" size={18} color={colors.warning} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Flagged Exercises</Text>
          <Text style={styles.subtitle}>
            {flaggedExercises.length} exercise{flaggedExercises.length !== 1 ? 's' : ''} flagged during workout
          </Text>
        </View>
      </View>

      {/* Flagged Exercise List */}
      <View style={styles.list}>
        {flaggedExercises.map((flag, index) => (
          <View key={`${flag.exercise_id}-${flag.set_number || index}`} style={styles.flagItem}>
            <View style={styles.flagInfo}>
              <View style={styles.flagIconContainer}>
                <Ionicons name={getFlagIcon(flag.flag_type) as any} size={16} color={colors.warning} />
              </View>
              <View style={styles.flagDetails}>
                <Text style={styles.exerciseName} numberOfLines={1}>
                  {flag.exercise_name}
                </Text>
                <Text style={styles.flagType}>{getFlagLabel(flag.flag_type)}</Text>
              </View>
            </View>
            <Pressable
              style={styles.detailButton}
              onPress={() => handleAddDetails(flag)}
            >
              <Text style={styles.detailButtonText}>Add details</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.text.tertiary} />
            </Pressable>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmitAll}
          disabled={isSubmitting}
        >
          <LinearGradient
            colors={[colors.warning, '#D97706']}
            style={StyleSheet.absoluteFill}
          />
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.text.inverse} />
          ) : (
            <>
              <Ionicons name="send" size={16} color={colors.text.inverse} />
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={styles.dismissButton}
          onPress={onDismiss}
          disabled={isSubmitting}
        >
          <Text style={styles.dismissButtonText}>Dismiss</Text>
        </Pressable>
      </View>

      {/* Detail Modal */}
      <FeedbackDetailModal
        visible={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedExercise(null);
        }}
        onSubmit={handleDetailSubmit}
        context="post_workout"
        initialCategory={selectedExercise ? getInitialCategory(selectedExercise) : undefined}
        exerciseName={selectedExercise?.exercise_name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.l,
    borderWidth: 1,
    borderColor: `${colors.warning}40`,
    overflow: 'hidden',
    marginBottom: spacing.l,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    backgroundColor: `${colors.warning}10`,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${colors.warning}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.secondary,
  },
  list: {
    padding: spacing.m,
    gap: spacing.s,
  },
  flagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.s,
    backgroundColor: colors.glass.bgLight,
    borderRadius: borderRadius.m,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  flagInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flagIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: `${colors.warning}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s,
  },
  flagDetails: {
    flex: 1,
  },
  exerciseName: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.primary,
  },
  flagType: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '400',
    color: colors.warning,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
  },
  detailButtonText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.m,
    padding: spacing.m,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.m,
    borderRadius: borderRadius.l,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  dismissButton: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissButtonText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
});
