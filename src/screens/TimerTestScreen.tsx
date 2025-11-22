// src/screens/TimerTestScreen.tsx
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Button, SegmentedButtons, Text, Modal, Portal } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Timer from '../components/session/Timer';
import { TimerFormat } from '../types/session';
import type { OnboardingScreenProps } from '../types/onboarding';
import { palette, spacing, typography } from '../theme';

interface SetCompletion {
  setNumber: number;
  elapsedSeconds: number;
}

export default function TimerTestScreen({ navigation }: OnboardingScreenProps<'TimerTest'>) {
  const [format, setFormat] = useState<TimerFormat>('straight_sets');
  const [totalSets, setTotalSets] = useState(3);
  const [setCompletions, setSetCompletions] = useState<SetCompletion[]>([]);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [initialSet, setInitialSet] = useState(1);
  const [initialElapsedSeconds, setInitialElapsedSeconds] = useState(0);
  const [redoingSet, setRedoingSet] = useState<number | null>(null);
  const [showSetCountModal, setShowSetCountModal] = useState(false);
  const [pendingSetCount, setPendingSetCount] = useState<number | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const findNextUncompletedSet = (completedSetNumbers: number[]) => {
    for (let i = 1; i <= totalSets; i++) {
      if (!completedSetNumbers.includes(i)) {
        return i;
      }
    }
    return null;
  };

  const handleSetComplete = (setNumber: number, elapsedSeconds: number) => {
    // Guard against invalid set numbers
    if (setNumber <= 0 || setNumber > totalSets) {
      console.warn(`Invalid set number: ${setNumber}. Skipping completion.`);
      return;
    }
    
    console.log(`✅ Set ${setNumber} completed in ${formatTime(elapsedSeconds)}`);
    setSetCompletions(prev => {
      let updated: SetCompletion[];
      
      // If we're redoing a set, replace the existing entry instead of adding a new one
      if (redoingSet !== null && setNumber === redoingSet) {
        updated = prev.map(completion => 
          completion.setNumber === setNumber 
            ? { setNumber, elapsedSeconds }
            : completion
        );
      } else {
        // Otherwise, add a new entry
        updated = [...prev, { setNumber, elapsedSeconds }];
      }
      
      // Check if all sets are now completed (works for all formats: straight_sets, EMOM, AMRAP)
      const completedSetNumbers = updated.map(c => c.setNumber);
      const allCompleted = Array.from({ length: totalSets }, (_, i) => i + 1)
        .every(setNum => completedSetNumbers.includes(setNum));
      
      if (allCompleted) {
        // Workout is complete - show completion screen for all formats
        console.log(`🎉 All ${totalSets} sets completed! Showing workout complete screen.`);
        setTimeout(() => {
          setWorkoutCompleted(true);
          handleWorkoutComplete();
        }, 0);
      } else {
        // Advance to next uncompleted set
        const nextSet = findNextUncompletedSet(completedSetNumbers);
        if (nextSet) {
          setTimeout(() => {
            setInitialSet(nextSet);
            setInitialElapsedSeconds(0);
            setTimerKey(prev => prev + 1);
          }, 0);
        }
      }
      
      return updated;
    });
    // Clear redoing state after completion
    setRedoingSet(null);
  };

  const handleAdvanceToNextSet = (nextSet: number) => {
    setInitialSet(nextSet);
    setInitialElapsedSeconds(0);
    setTimerKey(prev => prev + 1);
  };

  const handleWorkoutComplete = () => {
    console.log('🎉 Workout completed!');
    setWorkoutCompleted(true);
  };

  const reset = () => {
    setSetCompletions([]);
    setWorkoutCompleted(false);
    setInitialSet(1);
    setInitialElapsedSeconds(0);
    setRedoingSet(null);
    // Reset timer by changing key (forces remount)
    setTimerKey(prev => prev + 1);
  };

  const handleViewSet = (setNumber: number) => {
    // Find the completion data for this set
    const completion = setCompletions.find(c => c.setNumber === setNumber);
    if (completion) {
      // Set timer to show this set's time and set number (don't remove from log)
      setInitialSet(setNumber);
      setInitialElapsedSeconds(completion.elapsedSeconds);
      // Mark that we're redoing this set
      setRedoingSet(setNumber);
      // Reset timer to show the selected set by changing key (forces remount)
      setTimerKey(prev => prev + 1);
    }
  };

  const handleSetCountChange = (newSetCount: number) => {
    // If user has completed sets, show modal
    if (setCompletions.length > 0 && newSetCount !== totalSets) {
      setPendingSetCount(newSetCount);
      setShowSetCountModal(true);
    } else {
      // No completed sets, just update directly
      setTotalSets(newSetCount);
      setInitialSet(1);
      setInitialElapsedSeconds(0);
      setTimerKey(prev => prev + 1);
    }
  };

  const handleKeepSetLog = () => {
    if (pendingSetCount === null) return;
    
    const newSetCount = pendingSetCount;
    setTotalSets(newSetCount);
    
    // Filter out completions that exceed the new set count
    const filteredCompletions = setCompletions.filter(c => c.setNumber <= newSetCount);
    setSetCompletions(filteredCompletions);
    
    // Reset workout completed status since set count changed
    setWorkoutCompleted(false);
    
    // Find next uncompleted set
    const completedSetNumbers = filteredCompletions.map(c => c.setNumber);
    const nextSet = findNextUncompletedSet(completedSetNumbers);
    
    if (nextSet) {
      setInitialSet(nextSet);
      setInitialElapsedSeconds(0);
    } else {
      // All sets in new count are completed, start at 1
      setInitialSet(1);
      setInitialElapsedSeconds(0);
    }
    
    setTimerKey(prev => prev + 1);
    setShowSetCountModal(false);
    setPendingSetCount(null);
  };

  const handleResetSetLog = () => {
    if (pendingSetCount === null) return;
    
    const newSetCount = pendingSetCount;
    setTotalSets(newSetCount);
    setSetCompletions([]);
    setInitialSet(1);
    setInitialElapsedSeconds(0);
    setRedoingSet(null);
    setWorkoutCompleted(false);
    setTimerKey(prev => prev + 1);
    setShowSetCountModal(false);
    setPendingSetCount(null);
  };

  const insets = useSafeAreaInsets();

  // Show celebratory screen when workout is complete
  if (workoutCompleted) {
    return (
      <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.l) }]}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Set Log at Top */}
          <View style={styles.logContainer}>
            <Text variant="titleMedium" style={styles.logTitle}>
              Workout Summary
            </Text>
            {setCompletions
              .sort((a, b) => a.setNumber - b.setNumber)
              .map((completion, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    // Exit celebration screen and redo this set
                    setWorkoutCompleted(false);
                    handleViewSet(completion.setNumber);
                  }}
                  activeOpacity={0.7}
                  style={styles.logRow}
                >
                  <Text variant="bodyMedium" style={[styles.summaryLogItem, styles.clickableSummaryItem]}>
                    Set {completion.setNumber}: {formatTime(completion.elapsedSeconds)} - Tap to redo
                  </Text>
                </TouchableOpacity>
              ))}
          </View>

          {/* Celebratory Message in Middle */}
          <View style={styles.celebrationContainer}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.celebrationTitle}>
              Workout Complete!
            </Text>
            <Text style={styles.celebrationText}>
              Amazing work completing all {totalSets} sets!
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => {
                reset();
              }}
              style={styles.actionButton}
              contentStyle={styles.actionButtonContent}
            >
              Begin New Workout
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('PlanView')}
              style={styles.actionButton}
              contentStyle={styles.actionButtonContent}
            >
              Back to My Plan
            </Button>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Normal timer screen
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContentContainer}
    >
      <View style={[styles.controls, { paddingTop: Math.max(insets.top, spacing.l) }]}>
        <View style={styles.headerRow}>
          <Text variant="titleLarge" style={styles.title}>
            Timer Test Screen
          </Text>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('PlanView')}
            style={styles.backButton}
            labelStyle={styles.backButtonLabel}
            compact
          >
            Back to My Plan
          </Button>
        </View>
        
        <Text variant="bodyMedium" style={styles.label}>
          Format:
        </Text>
        <SegmentedButtons
          value={format}
          onValueChange={(value) => {
            setFormat(value as TimerFormat);
            reset();
          }}
          buttons={[
            { value: 'straight_sets', label: 'Straight Sets' },
            { value: 'EMOM', label: 'EMOM' },
            { value: 'AMRAP', label: 'AMRAP' },
          ]}
        />

        <Text variant="bodyMedium" style={styles.label}>
          Total Sets: {totalSets}
        </Text>
        <View style={styles.setButtons}>
          <Button onPress={() => handleSetCountChange(1)} mode={totalSets === 1 ? 'contained' : 'outlined'}>
            1
          </Button>
          <Button onPress={() => handleSetCountChange(3)} mode={totalSets === 3 ? 'contained' : 'outlined'}>
            3
          </Button>
          <Button onPress={() => handleSetCountChange(5)} mode={totalSets === 5 ? 'contained' : 'outlined'}>
            5
          </Button>
        </View>

        {setCompletions.length > 0 && (
          <View style={styles.logContainer}>
            <Text variant="bodySmall" style={styles.logTitle}>
              Test Log:
            </Text>
            {setCompletions.map((completion, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleViewSet(completion.setNumber)}
                activeOpacity={0.7}
              >
                <Text variant="bodySmall" style={[styles.logItem, styles.clickableLogItem]}>
                  • Set {completion.setNumber} completed ({formatTime(completion.elapsedSeconds)}) - Tap to view
                </Text>
              </TouchableOpacity>
            ))}
            <Button onPress={reset} mode="outlined" style={styles.resetButton}>
              Reset Log
            </Button>
          </View>
        )}
      </View>

      <View style={styles.timerContainer}>
        <Timer
          key={timerKey}
          format={format}
          totalSets={totalSets}
          initialSet={initialSet}
          initialElapsedSeconds={initialElapsedSeconds}
          completedSets={setCompletions.map(c => c.setNumber)}
          onSetComplete={handleSetComplete}
          onWorkoutComplete={handleWorkoutComplete}
          onAdvanceToNextSet={handleAdvanceToNextSet}
        />
      </View>

      {/* Modal for set count change confirmation */}
      <Portal>
        <Modal
          visible={showSetCountModal}
          onDismiss={() => {
            setShowSetCountModal(false);
            setPendingSetCount(null);
          }}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Change Set Count?
          </Text>
          <Text variant="bodyMedium" style={styles.modalText}>
            You have {setCompletions.length} completed set{setCompletions.length !== 1 ? 's' : ''}. 
            Changing to {pendingSetCount} set{pendingSetCount !== 1 ? 's' : ''}.
          </Text>
          <Text variant="bodySmall" style={styles.modalSubtext}>
            Would you like to keep your current set log or reset it?
          </Text>
          <View style={styles.modalButtons}>
            <Button
              mode="contained"
              onPress={handleKeepSetLog}
              style={styles.modalButton}
            >
              Keep Set Log
            </Button>
            <Button
              mode="outlined"
              onPress={handleResetSetLog}
              style={styles.modalButton}
            >
              Reset Log
            </Button>
            <Button
              mode="text"
              onPress={() => {
                setShowSetCountModal(false);
                setPendingSetCount(null);
              }}
              style={styles.modalButton}
            >
              Cancel
            </Button>
          </View>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.deepBlack,
  },
  controls: {
    padding: spacing.l,
    gap: spacing.m,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
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
  label: {
    color: palette.midGray,
  },
  setButtons: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  logContainer: {
    backgroundColor: palette.darkCard,
    padding: spacing.m,
    borderRadius: 12,
    marginTop: spacing.s,
    borderWidth: 1,
    borderColor: palette.border,
  },
  logTitle: {
    color: palette.lightGray,
    fontWeight: '600',
    marginBottom: spacing.s,
  },
  logItem: {
    color: palette.midGray,
    marginLeft: spacing.s,
    marginBottom: spacing.xs,
  },
  clickableLogItem: {
    color: palette.tealPrimary,
    textDecorationLine: 'underline',
  },
  completed: {
    color: palette.tealPrimary,
    fontWeight: '600',
  },
  resetButton: {
    marginTop: spacing.s,
  },
  timerContainer: {
    padding: spacing.l,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.l,
    paddingBottom: spacing.xl,
  },
  scrollContentContainer: {
    paddingBottom: spacing.xl,
  },
  celebrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    minHeight: 300,
  },
  celebrationEmoji: {
    fontSize: 80,
    marginBottom: spacing.l,
  },
  celebrationTitle: {
    ...typography.h1,
    color: palette.tealPrimary,
    fontWeight: 'bold',
    marginBottom: spacing.m,
    textAlign: 'center',
  },
  celebrationText: {
    ...typography.bodyLarge,
    color: palette.lightGray,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  actionButtons: {
    gap: spacing.m,
    paddingTop: spacing.l,
  },
  actionButton: {
    minWidth: '100%',
  },
  actionButtonContent: {
    paddingVertical: spacing.s,
  },
  logRow: {
    paddingVertical: spacing.xs,
  },
  summaryLogItem: {
    color: palette.lightGray,
  },
  clickableSummaryItem: {
    color: palette.tealPrimary,
    textDecorationLine: 'underline',
  },
  modalContainer: {
    backgroundColor: palette.darkCard,
    padding: spacing.xl,
    margin: spacing.l,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  modalTitle: {
    color: palette.white,
    fontWeight: 'bold',
    marginBottom: spacing.m,
    textAlign: 'center',
  },
  modalText: {
    color: palette.lightGray,
    marginBottom: spacing.s,
    textAlign: 'center',
  },
  modalSubtext: {
    color: palette.midGray,
    marginBottom: spacing.l,
    textAlign: 'center',
  },
  modalButtons: {
    gap: spacing.m,
    marginTop: spacing.m,
  },
  modalButton: {
    minWidth: '100%',
  },
});