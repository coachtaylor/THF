// src/screens/SessionPlayer.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text, Modal, Portal, Card } from 'react-native-paper';
import { Video } from 'expo-av';
import { Workout, ExerciseInstance, Exercise } from '../types/plan';
import { CompletedSet, TimerFormat } from '../types/session';
import Timer from '../components/session/Timer';
import RPELogger from '../components/session/RPELogger';
import SwapDrawer from '../components/session/SwapDrawer';
import PainFlagButton from '../components/session/PainFlagButton';
import CompletionScreen from '../components/session/CompletionScreen';
import { saveSession, buildSessionData } from '../services/sessionLogger';
import { autoRegress, AutoRegressionResult } from '../services/autoRegress';
import { fetchAllExercises } from '../services/exerciseService';
import { useProfile } from '../hooks/useProfile';
import { getCachedVideo, cacheVideo } from '../services/videoCache';
import { palette, spacing, typography } from '../theme';
import type { OnboardingScreenProps } from '../types/onboarding';

interface SessionPlayerProps extends OnboardingScreenProps<'SessionPlayer'> {
  route: {
    params: {
      workout: Workout;
      planId?: string;
    };
  };
}

// Extended ExerciseInstance with full Exercise data
interface ExerciseInstanceWithData extends ExerciseInstance {
  exercise: Exercise;
}

export default function SessionPlayer({ navigation, route }: SessionPlayerProps) {
  const { workout, planId = 'default' } = route.params;
  const { profile } = useProfile();
  const insets = useSafeAreaInsets();

  const [exercises, setExercises] = useState<ExerciseInstanceWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState<CompletedSet[]>([]);
  const [startedAt, setStartedAt] = useState<string>(new Date().toISOString());
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [showSwapDrawer, setShowSwapDrawer] = useState(false);
  const [currentRPE, setCurrentRPE] = useState<number | null>(null);
  const [swappedExercises, setSwappedExercises] = useState<Map<string, string>>(new Map());
  const [painFlaggedExercises, setPainFlaggedExercises] = useState<Set<string>>(new Set());
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [showCuesModal, setShowCuesModal] = useState(false);

  // Load exercise data
  useEffect(() => {
    loadExercises();
  }, []);

  // Load video when exercise changes
  useEffect(() => {
    if (currentExercise && !profile?.low_sensory_mode) {
      loadVideo();
    } else {
      setVideoUri(null);
    }
  }, [currentExerciseIndex, profile?.low_sensory_mode]);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const allExercises = await fetchAllExercises();
      const exerciseMap = new Map(allExercises.map(ex => [ex.id, ex]));

      const exercisesWithData: ExerciseInstanceWithData[] = workout.exercises.map(instance => {
        const exercise = exerciseMap.get(instance.exerciseId);
        if (!exercise) {
          throw new Error(`Exercise ${instance.exerciseId} not found`);
        }
        return {
          ...instance,
          exercise,
        };
      });

      setExercises(exercisesWithData);
      setStartedAt(new Date().toISOString());
    } catch (error) {
      console.error('Failed to load exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVideo = async () => {
    if (!currentExercise?.videoUrl || profile?.low_sensory_mode) {
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

      if (currentExercise.videoUrl) {
        const uri = await cacheVideo(currentExercise.id, currentExercise.videoUrl);
        setVideoUri(uri);
      }
    } catch (error) {
      console.warn('Failed to load exercise video', error);
    } finally {
      setLoadingVideo(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: Math.max(insets.top, spacing.l) }]}>
        <ActivityIndicator size="large" color={palette.tealPrimary} />
        <Text style={styles.loadingText}>Loading workout...</Text>
      </View>
    );
  }

  if (exercises.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: Math.max(insets.top, spacing.l) }]}>
        <Text style={styles.errorText}>No exercises found</Text>
        <Button mode="outlined" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  const currentExerciseInstance = exercises[currentExerciseIndex];
  const currentExercise = currentExerciseInstance.exercise;

  // Get current exercise's completed sets
  const currentExerciseSets = completedSets.filter(
    set => set.exerciseId === currentExercise.id
  );

  // Determine timer format - use exercise instance format or default to straight_sets
  const timerFormat: TimerFormat = 
    (currentExerciseInstance.format as TimerFormat) || 'straight_sets';
  const totalSets = currentExerciseInstance.sets;

  const handleSetComplete = (setNumber: number, elapsedSeconds: number) => {
    if (!currentRPE) {
      // Require RPE before completing set
      return;
    }

    const newSet: CompletedSet = {
      exerciseId: currentExercise.id,
      setNumber,
      rpe: currentRPE,
      reps: currentExerciseInstance.reps,
      completedAt: new Date().toISOString(),
    };

    const updatedSets = [...completedSets, newSet];
    setCompletedSets(updatedSets);
    setCurrentRPE(null);

    // Check if all sets for current exercise are complete
    const completedSetsForExercise = updatedSets.filter(
      set => set.exerciseId === currentExercise.id
    );

    if (completedSetsForExercise.length >= totalSets) {
      // Move to next exercise or complete session
      if (currentExerciseIndex < exercises.length - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentRPE(null);
      } else {
        handleWorkoutComplete();
      }
    }
  };

  const handleWorkoutComplete = async () => {
    const endTime = new Date().toISOString();
    setCompletedAt(endTime);
    setSessionComplete(true);

    // Save session to database
    try {
      const sessionData = buildSessionData(
        completedSets,
        planId,
        workout.duration || 15,
        startedAt,
        endTime
      );
      await saveSession(sessionData);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
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

  if (sessionComplete) {
    return (
      <CompletionScreen
        completedSets={completedSets}
        startedAt={startedAt}
        completedAt={completedAt!}
        exerciseCount={exercises.length}
        onSaveSession={handleSaveSession}
        onBackToPlan={() => navigation.navigate('PlanView')}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.l) }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.headerTitle}>
            Exercise {currentExerciseIndex + 1} of {exercises.length}
          </Text>
          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            compact
          >
            Exit
          </Button>
        </View>

        {/* Video at Top */}
        {!profile?.low_sensory_mode && videoUri && (
          <View style={styles.videoContainer}>
            <Video
              style={styles.video}
              source={{ uri: videoUri }}
              shouldPlay
              isLooping
              resizeMode="cover"
              useNativeControls
            />
          </View>
        )}

        {profile?.low_sensory_mode && (
          <View style={styles.lowSensoryNotice}>
            <Text style={styles.lowSensoryText}>Video hidden for low-sensory mode</Text>
          </View>
        )}

        {!profile?.low_sensory_mode && loadingVideo && (
          <View style={styles.lowSensoryNotice}>
            <Text style={styles.lowSensoryText}>Loading exercise video...</Text>
          </View>
        )}

        {/* Exercise Name */}
        <View style={styles.exerciseNameContainer}>
          <Text style={styles.exerciseName}>{currentExercise.name}</Text>
        </View>

        {/* View Cues Link */}
        <TouchableOpacity
          onPress={() => setShowCuesModal(true)}
          style={styles.cuesLink}
          activeOpacity={0.7}
        >
          <Text style={styles.cuesLinkText}>View Exercise Cues & Notes</Text>
        </TouchableOpacity>

        {/* Timer below Exercise Cues */}
        <View style={styles.timerSection}>
          <Timer
            format={timerFormat}
            totalSets={totalSets}
            initialSet={currentExerciseSets.length + 1}
            initialElapsedSeconds={0}
            completedSets={currentExerciseSets.map(s => s.setNumber)}
            onSetComplete={(setNumber, elapsedSeconds) =>
              handleSetComplete(setNumber, elapsedSeconds)
            }
            onWorkoutComplete={handleWorkoutComplete}
            onAdvanceToNextSet={() => {}}
          />
        </View>

        {/* RPE Logger */}
        <View style={styles.rpeSection}>
          <RPELogger
            exerciseId={currentExercise.id}
            setNumber={currentExerciseSets.length + 1}
            onRPESubmit={handleRPESubmit}
            rpeHistory={currentExerciseSets}
            initialRPE={currentRPE || undefined}
          />
        </View>

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
                {currentExercise.neutral_cues?.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Neutral Cues</Text>
                    {currentExercise.neutral_cues.map((cue, index) => (
                      <Text key={index} style={styles.modalListItem}>
                        • {cue}
                      </Text>
                    ))}
                  </View>
                )}

                {currentExercise.breathing_cues?.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Breathing Cues</Text>
                    {currentExercise.breathing_cues.map((cue, index) => (
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
    marginBottom: spacing.s,
  },
  headerTitle: {
    color: palette.white,
    flex: 1,
    fontSize: 18,
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

