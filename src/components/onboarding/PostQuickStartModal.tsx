import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';
import { palette, spacing, typography } from '../../theme';

interface PostQuickStartModalProps {
  visible: boolean;
  onCompleteProfile: () => void;
  onSkip: () => void;
}

export default function PostQuickStartModal({ visible, onCompleteProfile, onSkip }: PostQuickStartModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onSkip}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.headline}>Great work! 🎉</Text>
          <Text style={styles.body}>
            Complete your profile to save progress and get personalized plans tailored to your goals and
            constraints.
          </Text>

          <Button
            mode="contained"
            onPress={onCompleteProfile}
            style={styles.primaryButton}
            contentStyle={styles.primaryButtonContent}
            labelStyle={styles.primaryButtonLabel}
          >
            Complete Profile
          </Button>

          <Button mode="text" onPress={onSkip} labelStyle={styles.secondaryButtonLabel}>
            Skip for Now
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 14, 0.8)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: palette.darkCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  headline: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.m,
    color: palette.tealPrimary,
  },
  body: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: typography.body.fontSize * 1.5,
    color: palette.lightGray,
  },
  primaryButton: {
    borderRadius: 16,
    marginBottom: spacing.s,
  },
  primaryButtonContent: {
    paddingVertical: spacing.m,
    backgroundColor: palette.tealPrimary,
  },
  primaryButtonLabel: {
    ...typography.button,
    color: palette.deepBlack,
  },
  secondaryButtonLabel: {
    ...typography.button,
    color: palette.tealPrimary,
  },
});

