import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
  Platform,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useExerciseDetail } from '../../hooks/useExerciseDetail';
import { Profile } from '../../services/storage/profile';
import { palette, spacing, typography } from '../../theme';
import { FlaggedExercise } from '../../types/feedback';
import ExerciseFlagSheet from '../feedback/ExerciseFlagSheet';

type Props = {
  exerciseId: number | null;
  profile: Profile;
  onClose: () => void;
  onAddToWorkout?: (exerciseId: number) => void;
  onSwapExercise?: (exerciseId: number) => void;
  onFlagExercise?: (flag: FlaggedExercise) => void;
};

export function ExerciseDetailSheet({ exerciseId, profile, onClose, onAddToWorkout, onSwapExercise, onFlagExercise }: Props) {
  const { exercise, loading } = useExerciseDetail(exerciseId, profile);
  const [showFlagSheet, setShowFlagSheet] = useState(false);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const visible = exerciseId !== null;

  // Calculate modal dimensions
  const modalWidth = Math.min(screenWidth - 48, 400);
  const modalHeight = Math.min(screenHeight * 0.85, 700);

  // Animation effect
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleFlagSelect = (flagType: string, notes?: string) => {
    if (exercise && onFlagExercise) {
      const flag: FlaggedExercise = {
        exercise_id: String(exerciseId),
        exercise_name: exercise.name,
        flag_type: flagType as any,
        notes,
        timestamp: new Date().toISOString(),
      };
      onFlagExercise(flag);
      setShowFlagSheet(false);
    }
  };

  console.log('📋 ExerciseDetailSheet render:', { exerciseId, visible, loading, hasExercise: !!exercise, exerciseName: exercise?.name });

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              width: modalWidth,
              maxHeight: modalHeight,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Glass background */}
          <View style={styles.glassBackground}>
            <LinearGradient
              colors={['rgba(30, 30, 35, 0.95)', 'rgba(20, 20, 25, 0.98)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.glassHighlight} />
          </View>

          {/* Close button - absolute positioned top right */}
          <Pressable
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={8}
          >
            <Ionicons name="close" size={24} color={palette.lightGray} />
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Exercise Details</Text>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={palette.tealPrimary} />
              <Text style={styles.loadingText}>Loading exercise details...</Text>
            </View>
          ) : exercise ? (
            <>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Exercise Name */}
              <Text style={styles.exerciseName}>{exercise.name}</Text>

              {/* Basic Info Grid */}
              <View style={styles.infoGrid}>
                {exercise.pattern && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Pattern</Text>
                    <Text style={styles.infoValue}>{exercise.pattern}</Text>
                  </View>
                )}
                {exercise.goal && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Goal</Text>
                    <Text style={styles.infoValue}>{exercise.goal}</Text>
                  </View>
                )}
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Difficulty</Text>
                  <Text style={styles.infoValue}>
                    {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                  </Text>
                </View>
                {exercise.equipment.length > 0 && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Equipment</Text>
                    <Text style={styles.infoValue}>{exercise.equipment.join(', ')}</Text>
                  </View>
                )}
              </View>

              {/* Badges */}
              <View style={styles.badgesContainer}>
                {exercise.binderAware && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Binder Aware</Text>
                  </View>
                )}
                {exercise.pelvicFloorSafe && (
                  <View style={[styles.badge, styles.badgePelvic]}>
                    <Text style={styles.badgeText}>Pelvic Floor Safe</Text>
                  </View>
                )}
              </View>

              {/* Thumbnail Image */}
              {exercise.mediaThumb && (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: exercise.mediaThumb }} style={styles.thumbnail} resizeMode="contain" />
                </View>
              )}

              {/* Muscles */}
              {(exercise.targetMuscles || exercise.secondaryMuscles) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Target Muscles</Text>
                  {exercise.targetMuscles && (
                    <Text style={styles.sectionContent}>
                      <Text style={styles.boldText}>Primary: </Text>
                      {exercise.targetMuscles}
                    </Text>
                  )}
                  {exercise.secondaryMuscles && (
                    <Text style={styles.sectionContent}>
                      <Text style={styles.boldText}>Secondary: </Text>
                      {exercise.secondaryMuscles}
                    </Text>
                  )}
                </View>
              )}

              {/* General Coaching Section */}
              {(exercise.cuePrimary ||
                exercise.cues.length > 0 ||
                exercise.breathing ||
                exercise.coachingPoints.length > 0 ||
                exercise.commonErrors.length > 0) && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Coaching</Text>

                  {exercise.cuePrimary && (
                    <View style={styles.coachingItem}>
                      <Text style={styles.coachingLabel}>Primary Cue</Text>
                      <Text style={styles.coachingText}>{exercise.cuePrimary}</Text>
                    </View>
                  )}

                  {exercise.cues.length > 0 && (
                    <View style={styles.coachingItem}>
                      <Text style={styles.coachingLabel}>Cues</Text>
                      {exercise.cues.map((cue, index) => (
                        <Text key={index} style={styles.coachingText}>
                          • {cue}
                        </Text>
                      ))}
                    </View>
                  )}

                  {exercise.breathing && (
                    <View style={styles.coachingItem}>
                      <Text style={styles.coachingLabel}>Breathing</Text>
                      <Text style={styles.coachingText}>{exercise.breathing}</Text>
                    </View>
                  )}

                  {exercise.coachingPoints.length > 0 && (
                    <View style={styles.coachingItem}>
                      <Text style={styles.coachingLabel}>Coaching Points</Text>
                      {exercise.coachingPoints.map((point, index) => (
                        <Text key={index} style={styles.coachingText}>
                          • {point}
                        </Text>
                      ))}
                    </View>
                  )}

                  {exercise.commonErrors.length > 0 && (
                    <View style={styles.coachingItem}>
                      <Text style={styles.coachingLabel}>Common Errors</Text>
                      {exercise.commonErrors.map((error, index) => (
                        <Text key={index} style={[styles.coachingText, styles.errorText]}>
                          • {error}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Trans-Specific Tips */}
              {exercise.transTips.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Trans-Specific Tips</Text>
                  {exercise.transTips.map((tipGroup, index) => (
                    <View key={index} style={styles.tipGroup}>
                      {tipGroup.population && (
                        <Text style={styles.tipPopulation}>{tipGroup.population}</Text>
                      )}
                      {tipGroup.context && (
                        <Text style={styles.tipContext}>{tipGroup.context}</Text>
                      )}
                      {tipGroup.tips.map((tip, tipIndex) => (
                        <Text key={tipIndex} style={styles.tipText}>
                          • {tip}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Action Buttons - Fixed at bottom */}
            {(onAddToWorkout || onSwapExercise || onFlagExercise) && (
              <View style={styles.actionsContainer}>
                {/* Feedback Button */}
                {onFlagExercise && (
                  <TouchableOpacity
                    style={styles.feedbackButton}
                    onPress={() => setShowFlagSheet(true)}
                  >
                    <Ionicons name="flag-outline" size={18} color={palette.warning} />
                    <Text style={styles.feedbackButtonText}>Something felt off?</Text>
                  </TouchableOpacity>
                )}

                {/* Primary Actions */}
                <View style={styles.primaryActions}>
                  {onSwapExercise && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => { onSwapExercise(exerciseId!); handleClose(); }}
                    >
                      <Text style={styles.actionButtonText}>Swap Exercise</Text>
                    </TouchableOpacity>
                  )}
                  {onAddToWorkout && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => { onAddToWorkout(exerciseId!); handleClose(); }}
                    >
                      <Text style={styles.actionButtonText}>Add to Workout</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Flag Exercise Sheet */}
            {exercise && (
              <ExerciseFlagSheet
                visible={showFlagSheet}
                onClose={() => setShowFlagSheet(false)}
                onFlagSelect={handleFlagSelect}
                exerciseName={exercise.name}
              />
            )}
          </>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load exercise details</Text>
              <TouchableOpacity onPress={handleClose} style={styles.errorButton}>
                <Text style={styles.errorButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  glassBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.m,
  },
  headerTitle: {
    ...typography.h2,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.m,
    right: spacing.m,
    zIndex: 1,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.m,
    color: palette.midGray,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xl,
  },
  exerciseName: {
    ...typography.h1,
    marginBottom: spacing.l,
    color: palette.white,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.l,
    gap: spacing.m,
  },
  infoItem: {
    minWidth: '45%',
    marginBottom: spacing.m,
  },
  infoLabel: {
    ...typography.caption,
    marginBottom: spacing.xxs,
    color: palette.midGray,
  },
  infoValue: {
    ...typography.body,
    color: palette.lightGray,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
    marginBottom: spacing.l,
  },
  badge: {
    backgroundColor: palette.tealPrimary,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xxs,
    borderRadius: 12,
  },
  badgePelvic: {
    backgroundColor: palette.tealDark,
  },
  badgeText: {
    ...typography.caption,
    color: palette.deepBlack,
    fontWeight: '700',
    fontSize: 11,
  },
  imageContainer: {
    marginBottom: spacing.l,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: palette.darkerCard,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.m,
    color: palette.tealPrimary,
  },
  sectionContent: {
    ...typography.body,
    lineHeight: typography.body.fontSize * 1.5,
    color: palette.lightGray,
    marginBottom: spacing.xs,
  },
  boldText: {
    fontWeight: '600',
    color: palette.white,
  },
  coachingItem: {
    marginBottom: spacing.m,
  },
  coachingLabel: {
    ...typography.h4,
    marginBottom: spacing.xs,
    color: palette.white,
  },
  coachingText: {
    ...typography.body,
    lineHeight: typography.body.fontSize * 1.5,
    color: palette.lightGray,
    marginBottom: spacing.xs,
  },
  errorText: {
    ...typography.body,
    color: palette.error,
  },
  tipGroup: {
    marginBottom: spacing.m,
    padding: spacing.m,
    backgroundColor: palette.darkerCard,
    borderRadius: 12,
  },
  tipPopulation: {
    ...typography.h4,
    marginBottom: spacing.xs,
    color: palette.tealPrimary,
  },
  tipContext: {
    ...typography.bodySmall,
    marginBottom: spacing.s,
    color: palette.midGray,
    fontStyle: 'italic',
  },
  tipText: {
    ...typography.body,
    lineHeight: typography.body.fontSize * 1.5,
    color: palette.lightGray,
    marginBottom: spacing.xs,
  },
  errorContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorButton: {
    marginTop: spacing.m,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    backgroundColor: palette.tealPrimary,
    borderRadius: 16,
  },
  errorButtonText: {
    ...typography.button,
    color: palette.deepBlack,
  },
  actionsContainer: {
    marginTop: spacing.l,
    paddingTop: spacing.l,
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.l,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    gap: spacing.m,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    backgroundColor: `${palette.warning}15`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${palette.warning}40`,
  },
  feedbackButtonText: {
    ...typography.body,
    color: palette.warning,
    fontWeight: '500',
  },
  primaryActions: {
    gap: spacing.m,
  },
  actionButton: {
    backgroundColor: palette.tealPrimary,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    ...typography.button,
    color: palette.deepBlack,
    fontWeight: '600',
  },
});


