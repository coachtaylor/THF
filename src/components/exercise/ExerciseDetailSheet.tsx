import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { useExerciseDetail } from '../../hooks/useExerciseDetail';
import { Profile } from '../../services/storage/profile';
import { palette, spacing, typography } from '../../theme';

type Props = {
  exerciseId: number | null;
  profile: Profile;
  onClose: () => void;
};

export function ExerciseDetailSheet({ exerciseId, profile, onClose }: Props) {
  const { exercise, loading } = useExerciseDetail(exerciseId, profile);

  const visible = exerciseId !== null;

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Exercise Details</Text>
            <IconButton
              icon="close"
              size={24}
              iconColor={palette.lightGray}
              onPress={onClose}
              style={styles.closeButton}
            />
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={palette.tealPrimary} />
              <Text style={styles.loadingText}>Loading exercise details...</Text>
            </View>
          ) : exercise ? (
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
                  <Image source={{ uri: exercise.mediaThumb }} style={styles.thumbnail} />
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
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load exercise details</Text>
              <TouchableOpacity onPress={onClose} style={styles.errorButton}>
                <Text style={styles.errorButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 14, 14, 0.8)',
  },
  sheet: {
    backgroundColor: palette.darkCard,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: spacing.s,
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xxl,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderTopColor: palette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: palette.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.m,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.l,
  },
  headerTitle: {
    ...typography.h2,
    flex: 1,
  },
  closeButton: {
    margin: 0,
  },
  loadingContainer: {
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
    height: 200,
    resizeMode: 'cover',
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
});

