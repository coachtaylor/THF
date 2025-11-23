// src/screens/ExerciseDisplayTestScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Button, Text, Switch, Card, Portal, Modal } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ExerciseDisplay from '../components/session/ExerciseDisplay';
import { Exercise } from '../types';
import { fetchAllExercises } from '../services/exerciseService';
import { palette, spacing, typography } from '../theme';
import type { OnboardingScreenProps } from '../types/onboarding';

export default function ExerciseDisplayTestScreen({
  navigation,
}: OnboardingScreenProps<'ExerciseDisplayTest'>) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [lowSensoryMode, setLowSensoryMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const allExercises = await fetchAllExercises();
      setExercises(allExercises);
      if (allExercises.length > 0) {
        setSelectedExercise(allExercises[0]);
      }
    } catch (error) {
      console.error('Failed to load exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowExercisePicker(false);
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.l) }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.title}>
            Exercise Display Test
          </Text>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('PlanView')}
            style={styles.backButton}
            labelStyle={styles.backButtonLabel}
            compact
          >
            Back to Plan
          </Button>
        </View>

        {/* Controls */}
        <Card style={styles.controlsCard}>
          <Card.Content>
            <View style={styles.controlRow}>
              <Text variant="bodyMedium" style={styles.label}>
                Low-Sensory Mode:
              </Text>
              <Switch
                value={lowSensoryMode}
                onValueChange={setLowSensoryMode}
                color={palette.tealPrimary}
              />
            </View>

            <View style={styles.controlRow}>
              <Text variant="bodyMedium" style={styles.label}>
                Selected Exercise:
              </Text>
              <Button
                mode="outlined"
                onPress={() => setShowExercisePicker(true)}
                style={styles.selectButton}
              >
                {selectedExercise?.name || 'Select Exercise'}
              </Button>
            </View>

            {selectedExercise && (
              <View style={styles.exerciseInfo}>
                <Text variant="bodySmall" style={styles.infoText}>
                  ID: {selectedExercise.id}
                </Text>
                {(selectedExercise as any).videoUrl ? (
                  <Text variant="bodySmall" style={styles.infoText}>
                    Video URL: {(selectedExercise as any).videoUrl.substring(0, 50)}...
                  </Text>
                ) : (
                  <Text variant="bodySmall" style={styles.warningText}>
                    ⚠️ No video URL
                  </Text>
                )}
                <Text variant="bodySmall" style={styles.infoText}>
                  Neutral Cues: {selectedExercise.neutral_cues?.length || 0}
                </Text>
                <Text variant="bodySmall" style={styles.infoText}>
                  Breathing Cues: {selectedExercise.breathing_cues?.length || 0}
                </Text>
                <Text variant="bodySmall" style={styles.infoText}>
                  Trans Notes: {selectedExercise.trans_notes?.binder || selectedExercise.trans_notes?.pelvic_floor ? 'Yes' : 'No'}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Exercise Display */}
        {selectedExercise ? (
          <View style={styles.displayCard}>
            <ExerciseDisplay
              exercise={selectedExercise}
              lowSensoryMode={lowSensoryMode}
            />
          </View>
        ) : (
          <Card style={styles.displayCard}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.placeholderText}>
                {loading ? 'Loading exercises...' : 'No exercise selected'}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Test Checklist */}
        <Card style={styles.checklistCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.checklistTitle}>
              Test Checklist
            </Text>
            <Text variant="bodySmall" style={styles.checklistItem}>
              ✓ Exercise name displays
            </Text>
            <Text variant="bodySmall" style={styles.checklistItem}>
              {selectedExercise?.neutral_cues?.length ? '✓' : '○'} Neutral cues display as bullet list
            </Text>
            <Text variant="bodySmall" style={styles.checklistItem}>
              {selectedExercise?.breathing_cues?.length ? '✓' : '○'} Breathing cues display as bullet list
            </Text>
            <Text variant="bodySmall" style={styles.checklistItem}>
              {selectedExercise?.trans_notes?.binder || selectedExercise?.trans_notes?.pelvic_floor ? '✓' : '○'} Trans notes display in highlighted box
            </Text>
            <Text variant="bodySmall" style={styles.checklistItem}>
              {!lowSensoryMode && (selectedExercise as any)?.videoUrl ? '✓' : '○'} Video loads and displays (when not in low-sensory mode)
            </Text>
            <Text variant="bodySmall" style={styles.checklistItem}>
              {lowSensoryMode ? '✓' : '○'} Video hidden in low-sensory mode
            </Text>
            <Text variant="bodySmall" style={styles.checklistItem}>
              {(selectedExercise as any)?.videoUrl ? '○' : '✓'} Video caching works (check console logs)
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Exercise Picker Modal */}
      <Portal>
        <Modal
          visible={showExercisePicker}
          onDismiss={() => setShowExercisePicker(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              Select Exercise
            </Text>
            <ScrollView style={styles.exerciseList}>
              {exercises.map((exercise) => (
                <Button
                  key={exercise.id}
                  mode={selectedExercise?.id === exercise.id ? 'contained' : 'outlined'}
                  onPress={() => handleSelectExercise(exercise)}
                  style={styles.exerciseButton}
                >
                  {exercise.name}
                </Button>
              ))}
            </ScrollView>
            <Button
              mode="text"
              onPress={() => setShowExercisePicker(false)}
              style={styles.closeButton}
            >
              Close
            </Button>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.l,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  title: {
    color: palette.white,
    flex: 1,
  },
  backButton: {
    marginLeft: spacing.m,
  },
  backButtonLabel: {
    fontSize: 12,
  },
  controlsCard: {
    backgroundColor: palette.darkCard,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: spacing.m,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  label: {
    color: palette.lightGray,
    flex: 1,
  },
  selectButton: {
    flex: 1,
    marginLeft: spacing.m,
  },
  exerciseInfo: {
    marginTop: spacing.m,
    padding: spacing.s,
    backgroundColor: palette.darkerCard,
    borderRadius: 8,
    gap: spacing.xs,
  },
  infoText: {
    color: palette.midGray,
  },
  warningText: {
    color: palette.warning,
  },
  displayCard: {
    backgroundColor: palette.deepBlack,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    marginBottom: spacing.m,
    minHeight: 400,
    overflow: 'hidden',
  },
  placeholderText: {
    color: palette.midGray,
    textAlign: 'center',
    padding: spacing.xl,
  },
  checklistCard: {
    backgroundColor: palette.darkCard,
    borderWidth: 1,
    borderColor: palette.border,
  },
  checklistTitle: {
    color: palette.white,
    marginBottom: spacing.m,
  },
  checklistItem: {
    color: palette.lightGray,
    marginBottom: spacing.xs,
    marginLeft: spacing.s,
  },
  modalContainer: {
    backgroundColor: palette.darkCard,
    padding: spacing.l,
    margin: spacing.l,
    borderRadius: 16,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: palette.border,
  },
  modalContent: {
    flex: 1,
  },
  modalTitle: {
    color: palette.white,
    marginBottom: spacing.m,
    textAlign: 'center',
  },
  exerciseList: {
    maxHeight: 400,
    marginBottom: spacing.m,
  },
  exerciseButton: {
    marginBottom: spacing.xs,
  },
  closeButton: {
    marginTop: spacing.m,
  },
});

