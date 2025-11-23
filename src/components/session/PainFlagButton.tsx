// src/components/session/PainFlagButton.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { Button, Portal, Card, Snackbar } from 'react-native-paper';
import { Exercise, ExerciseInstance } from '../../types/plan';
import { Profile } from '../../services/storage/profile';
import { autoRegress, AutoRegressionResult, getAutoRegressionDescription } from '../../services/autoRegress';
import { palette, spacing, typography } from '../../theme';

interface PainFlagButtonProps {
  exercise: Exercise;
  exerciseInstance: ExerciseInstance;
  onPainFlag: (result: AutoRegressionResult) => void;
  profile?: Profile | null;
  disabled?: boolean;
}

const PainFlagButton: React.FC<PainFlagButtonProps> = ({
  exercise,
  exerciseInstance,
  onPainFlag,
  profile,
  disabled = false,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [regressionResult, setRegressionResult] = useState<AutoRegressionResult | null>(null);

  const handlePainFlagPress = async () => {
    setProcessing(true);
    try {
      const result = await autoRegress(exercise, exerciseInstance, profile);
      setRegressionResult(result);
      setShowConfirmModal(true);
    } catch (error) {
      console.error('Failed to auto-regress exercise:', error);
      // Still show modal with error state
      setShowConfirmModal(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (regressionResult) {
      onPainFlag(regressionResult);
      setShowConfirmModal(false);
      setShowToast(true);
      setRegressionResult(null);
    }
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setRegressionResult(null);
  };

  return (
    <>
      <Button
        mode="outlined"
        onPress={handlePainFlagPress}
        disabled={disabled || processing}
        icon="alert-circle"
        textColor={palette.error}
        buttonColor="transparent"
        style={styles.button}
        labelStyle={styles.buttonLabel}
      >
        {processing ? 'Processing...' : 'Flag Pain'}
      </Button>

      <Portal>
        <Modal
          visible={showConfirmModal}
          transparent
          animationType="fade"
          onRequestClose={handleCancel}
        >
          <View style={styles.modalOverlay}>
            <Card style={styles.modalCard}>
              <Card.Content>
                <Text style={styles.modalTitle}>Pain Flag Confirmation</Text>
                
                {regressionResult ? (
                  <>
                    <Text style={styles.modalText}>
                      We'll adjust your workout to reduce pain:
                    </Text>
                    <View style={styles.resultContainer}>
                      <Text style={styles.resultText}>
                        {getAutoRegressionDescription(regressionResult)}
                      </Text>
                    </View>
                    <Text style={styles.modalSubtext}>
                      This change will be saved to your session.
                    </Text>
                  </>
                ) : (
                  <Text style={styles.modalText}>
                    Failed to process pain flag. Please try again.
                  </Text>
                )}

                <View style={styles.modalButtons}>
                  <Button
                    mode="contained"
                    onPress={handleConfirm}
                    disabled={!regressionResult}
                    buttonColor={palette.error}
                    textColor={palette.white}
                    style={styles.confirmButton}
                  >
                    Confirm
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={handleCancel}
                    textColor={palette.lightGray}
                    style={styles.cancelButton}
                  >
                    Cancel
                  </Button>
                </View>
              </Card.Content>
            </Card>
          </View>
        </Modal>
      </Portal>

      {/* Confirmation Toast */}
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
        Pain flag saved. Workout adjusted.
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
    marginBottom: spacing.m,
    textAlign: 'center',
  },
  modalText: {
    ...typography.body,
    color: palette.lightGray,
    marginBottom: spacing.m,
    textAlign: 'center',
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
  modalSubtext: {
    ...typography.bodySmall,
    color: palette.midGray,
    marginBottom: spacing.l,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.m,
    marginTop: spacing.m,
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

