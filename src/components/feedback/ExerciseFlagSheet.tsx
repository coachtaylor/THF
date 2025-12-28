// Exercise Flag Sheet Component
// Bottom sheet for flagging specific exercise issues during session
// Quick options with optional notes field

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { ExerciseFlagType, EXERCISE_FLAG_OPTIONS } from '../../types/feedback';

interface ExerciseFlagSheetProps {
  visible: boolean;
  onClose: () => void;
  onFlagSelect: (flagType: ExerciseFlagType, notes?: string) => void;
  exerciseName: string;
}

export default function ExerciseFlagSheet({
  visible,
  onClose,
  onFlagSelect,
  exerciseName,
}: ExerciseFlagSheetProps) {
  const insets = useSafeAreaInsets();
  const [selectedFlag, setSelectedFlag] = useState<ExerciseFlagType | null>(null);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [notesFocused, setNotesFocused] = useState(false);

  const handleFlagPress = (flagType: ExerciseFlagType) => {
    setSelectedFlag(flagType);
  };

  const handleSubmit = () => {
    if (selectedFlag) {
      onFlagSelect(selectedFlag, notes.trim() || undefined);
      // Reset state
      setSelectedFlag(null);
      setNotes('');
      setShowNotes(false);
    }
  };

  const handleClose = () => {
    setSelectedFlag(null);
    setNotes('');
    setShowNotes(false);
    onClose();
  };

  const canSubmit = selectedFlag !== null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.l }]}>
          <LinearGradient
            colors={['#1A1A1A', '#0A0A0A']}
            style={StyleSheet.absoluteFill}
          />

          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="flag" size={20} color={colors.warning} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Something felt off?</Text>
              <Text style={styles.subtitle} numberOfLines={1}>{exerciseName}</Text>
            </View>
            <Pressable onPress={handleClose} hitSlop={8} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.tertiary} />
            </Pressable>
          </View>

          {/* Flag Options */}
          <View style={styles.content}>
            <Text style={styles.sectionLabel}>What happened?</Text>
            <View style={styles.optionsGrid}>
              {EXERCISE_FLAG_OPTIONS.map((option) => (
                <Pressable
                  key={option.type}
                  style={[
                    styles.optionButton,
                    selectedFlag === option.type && styles.optionButtonSelected,
                  ]}
                  onPress={() => handleFlagPress(option.type)}
                >
                  <View
                    style={[
                      styles.optionIconContainer,
                      selectedFlag === option.type && styles.optionIconContainerSelected,
                    ]}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={20}
                      color={selectedFlag === option.type ? colors.warning : colors.text.secondary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.optionLabel,
                      selectedFlag === option.type && styles.optionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Add Notes Toggle */}
            {!showNotes && (
              <Pressable
                style={styles.addNotesButton}
                onPress={() => setShowNotes(true)}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.text.tertiary} />
                <Text style={styles.addNotesText}>Add notes (optional)</Text>
              </Pressable>
            )}

            {/* Notes Input */}
            {showNotes && (
              <View style={styles.notesSection}>
                <Text style={styles.sectionLabel}>Additional notes</Text>
                <View
                  style={[
                    styles.notesContainer,
                    notesFocused && styles.notesContainerFocused,
                  ]}
                >
                  <TextInput
                    style={styles.notesInput}
                    placeholder="Describe what felt off..."
                    placeholderTextColor={colors.text.tertiary}
                    value={notes}
                    onChangeText={setNotes}
                    onFocus={() => setNotesFocused(true)}
                    onBlur={() => setNotesFocused(false)}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            )}

            {/* Submit Button */}
            <Pressable
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              <LinearGradient
                colors={
                  canSubmit
                    ? [colors.warning, '#D97706']
                    : [colors.glass.bgLight, colors.glass.bg]
                }
                style={StyleSheet.absoluteFill}
              />
              <Ionicons
                name="flag"
                size={18}
                color={canSubmit ? colors.text.inverse : colors.text.tertiary}
              />
              <Text
                style={[
                  styles.submitButtonText,
                  !canSubmit && styles.submitButtonTextDisabled,
                ]}
              >
                Flag Exercise
              </Text>
            </Pressable>

            {/* Cancel Link */}
            <Pressable onPress={handleClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    backgroundColor: colors.bg.tertiary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: { elevation: 16 },
    }),
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.m,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.secondary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    padding: spacing.xl,
  },
  sectionLabel: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.m,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
    marginBottom: spacing.l,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.l,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  optionButtonSelected: {
    backgroundColor: `${colors.warning}15`,
    borderColor: colors.warning,
  },
  optionIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.glass.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconContainerSelected: {
    backgroundColor: `${colors.warning}25`,
  },
  optionLabel: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  optionLabelSelected: {
    color: colors.warning,
  },
  addNotesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.s,
    marginBottom: spacing.l,
  },
  addNotesText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  notesSection: {
    marginBottom: spacing.l,
  },
  notesContainer: {
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.m,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  notesContainerFocused: {
    borderColor: colors.warning,
  },
  notesInput: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.primary,
    padding: spacing.m,
    minHeight: 80,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.m,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.warning,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  submitButtonDisabled: {
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: { elevation: 0 },
    }),
  },
  submitButtonText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  submitButtonTextDisabled: {
    color: colors.text.tertiary,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.m,
    marginTop: spacing.s,
  },
  cancelText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
});
