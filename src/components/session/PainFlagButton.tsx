// src/components/session/PainFlagButton.tsx
//
// Mid-session pain entry point. Replaces the prior auto-regress-only modal
// with an explicit three-choice prompt: Lighten / Swap / Skip. All three
// record the exercise into the session's painFlaggedExercises Set, which
// SessionPlayer persists to profile.flagged_exercise_ids so rule USR-01
// excludes the exercise from future generation.

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { Button, Portal, Card, Snackbar } from 'react-native-paper';
import { Exercise, ExerciseInstance } from '../../types/plan';
import { Profile } from '../../services/storage/profile';
import { autoRegress, AutoRegressionResult, getAutoRegressionDescription } from '../../services/autoRegress';
import { palette, spacing, typography } from '../../theme';

interface PainFlagButtonProps {
  exercise: Exercise;
  exerciseInstance: ExerciseInstance;
  // Called with an AutoRegressionResult when the user picks "Lighten this exercise".
  // SessionPlayer applies the regression to the active instance and adds the
  // original exercise id to painFlaggedExercises.
  onPainFlag: (result: AutoRegressionResult) => void;
  // Called when the user picks "Swap to alternative". SessionPlayer should
  // record the original exercise id in painFlaggedExercises and open the
  // swap drawer.
  onRequestSwap: () => void;
  // Called when the user picks "Skip exercise". SessionPlayer should record
  // the original exercise id in painFlaggedExercises and advance to the next
  // exercise (or open its skip-exercise confirmation flow).
  onRequestSkip: () => void;
  profile?: Profile | null;
  disabled?: boolean;
}

type Choice = 'lighten' | 'swap' | 'skip' | null;

const PainFlagButton: React.FC<PainFlagButtonProps> = ({
  exercise,
  exerciseInstance,
  onPainFlag,
  onRequestSwap,
  onRequestSkip,
  profile,
  disabled = false,
}) => {
  const [showChooser, setShowChooser] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<Choice>(null);
  const [regressionResult, setRegressionResult] = useState<AutoRegressionResult | null>(null);
  const [regressing, setRegressing] = useState(false);

  const openChooser = () => {
    // Reset state on each open — old results from a previous exercise
    // shouldn't leak into the next prompt.
    setRegressionResult(null);
    setPendingChoice(null);
    setShowChooser(true);
  };

  const handleLighten = async () => {
    setPendingChoice('lighten');
    setRegressing(true);
    try {
      const result = await autoRegress(exercise, exerciseInstance, profile);
      setRegressionResult(result);
    } catch (error) {
      console.error('Failed to auto-regress exercise:', error);
    } finally {
      setRegressing(false);
    }
  };

  const confirmLighten = () => {
    if (regressionResult) {
      onPainFlag(regressionResult);
      setShowChooser(false);
      setShowToast(true);
      setRegressionResult(null);
      setPendingChoice(null);
    }
  };

  const handleSwap = () => {
    setShowChooser(false);
    setPendingChoice(null);
    onRequestSwap();
  };

  const handleSkip = () => {
    setShowChooser(false);
    setPendingChoice(null);
    onRequestSkip();
  };

  const handleCancel = () => {
    setShowChooser(false);
    setRegressionResult(null);
    setPendingChoice(null);
  };

  return (
    <>
      <Button
        mode="outlined"
        onPress={openChooser}
        disabled={disabled}
        icon="alert-circle"
        textColor={palette.error}
        buttonColor="transparent"
        style={styles.button}
        labelStyle={styles.buttonLabel}
      >
        Pain or discomfort
      </Button>

      <Portal>
        <Modal
          visible={showChooser}
          transparent
          animationType="fade"
          onRequestClose={handleCancel}
        >
          <View style={styles.modalOverlay}>
            <Card style={styles.modalCard}>
              <Card.Content>
                <Text style={styles.modalTitle}>Pain or discomfort?</Text>
                <Text style={styles.modalText}>
                  We'll remember this so it doesn't come back next time. What do you want to do right now?
                </Text>

                {/* Step 1: show the three choices unless we're previewing the Lighten regression */}
                {pendingChoice !== 'lighten' && (
                  <View style={styles.choiceList}>
                    <Button
                      mode="contained"
                      onPress={handleLighten}
                      buttonColor={palette.tealPrimary}
                      textColor={palette.white}
                      style={styles.choiceButton}
                      icon="trending-down"
                    >
                      Lighten this exercise
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleSwap}
                      buttonColor={palette.darkerCard}
                      textColor={palette.lightGray}
                      style={styles.choiceButton}
                      icon="swap-horizontal"
                    >
                      Swap to alternative
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleSkip}
                      buttonColor={palette.darkerCard}
                      textColor={palette.lightGray}
                      style={styles.choiceButton}
                      icon="skip-next"
                    >
                      Skip exercise
                    </Button>
                    <Button
                      mode="text"
                      onPress={handleCancel}
                      textColor={palette.midGray}
                      style={styles.cancelInline}
                    >
                      Not now
                    </Button>
                  </View>
                )}

                {/* Step 2: Lighten preview — show the regressed plan, confirm or back out */}
                {pendingChoice === 'lighten' && (
                  <>
                    {regressing ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={palette.tealPrimary} />
                        <Text style={styles.modalSubtext}>Calculating a lighter version…</Text>
                      </View>
                    ) : regressionResult ? (
                      <>
                        <View style={styles.resultContainer}>
                          <Text style={styles.resultText}>
                            {getAutoRegressionDescription(regressionResult)}
                          </Text>
                        </View>
                        <Text style={styles.modalSubtext}>
                          This change is saved with your session.
                        </Text>
                        <View style={styles.modalButtons}>
                          <Button
                            mode="contained"
                            onPress={confirmLighten}
                            buttonColor={palette.tealPrimary}
                            textColor={palette.white}
                            style={styles.confirmButton}
                          >
                            Use this
                          </Button>
                          <Button
                            mode="outlined"
                            onPress={() => setPendingChoice(null)}
                            textColor={palette.lightGray}
                            style={styles.cancelButton}
                          >
                            Back
                          </Button>
                        </View>
                      </>
                    ) : (
                      <>
                        <Text style={styles.modalText}>
                          Couldn't calculate a lighter version. Try Swap or Skip instead.
                        </Text>
                        <Button
                          mode="outlined"
                          onPress={() => setPendingChoice(null)}
                          textColor={palette.lightGray}
                        >
                          Back
                        </Button>
                      </>
                    )}
                  </>
                )}
              </Card.Content>
            </Card>
          </View>
        </Modal>
      </Portal>

      <Snackbar
        visible={showToast}
        onDismiss={() => setShowToast(false)}
        duration={3000}
        style={styles.toast}
        action={{
          label: 'OK',
          onPress: () => setShowToast(false),
        }}
      >
        Saved. We'll skip this in future workouts — manage in Settings.
      </Snackbar>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    borderColor: palette.error,
    borderWidth: 2,
  },
  buttonLabel: {
    color: palette.error,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  modalCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: palette.border,
  },
  modalTitle: {
    ...typography.h3,
    color: palette.error,
    marginBottom: spacing.s,
    textAlign: 'center',
  },
  modalText: {
    ...typography.body,
    color: palette.lightGray,
    marginBottom: spacing.m,
    textAlign: 'center',
  },
  modalSubtext: {
    ...typography.bodySmall,
    color: palette.midGray,
    marginBottom: spacing.l,
    textAlign: 'center',
  },
  choiceList: {
    gap: spacing.s,
    marginTop: spacing.s,
  },
  choiceButton: {
    width: '100%',
  },
  cancelInline: {
    marginTop: spacing.xs,
  },
  resultContainer: {
    backgroundColor: palette.darkerCard,
    borderRadius: 8,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: palette.border,
  },
  resultText: {
    ...typography.bodyMedium,
    color: palette.tealPrimary,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    paddingVertical: spacing.l,
    alignItems: 'center',
    gap: spacing.s,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.m,
    marginTop: spacing.s,
  },
  confirmButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
    borderColor: palette.border,
  },
  toast: {
    backgroundColor: palette.darkCard,
  },
});

export default PainFlagButton;
