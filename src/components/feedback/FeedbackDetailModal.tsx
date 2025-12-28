// Feedback Detail Modal Component
// Full feedback form for detailed issue reporting
// Supports category selection, severity, and free-text description

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';
import {
  FeedbackCategory,
  FeedbackContext,
  FeedbackSeverity,
  FEEDBACK_CATEGORIES,
  QUICK_FEEDBACK_OPTIONS,
  getQuickOptionsByCategory,
} from '../../types/feedback';

interface FeedbackDetailModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    category: FeedbackCategory;
    severity?: FeedbackSeverity;
    quickFeedback: string[];
    description?: string;
  }) => Promise<void>;
  context: FeedbackContext;
  // Pre-fill options for exercise-specific feedback
  initialCategory?: FeedbackCategory;
  exerciseName?: string;
}

export default function FeedbackDetailModal({
  visible,
  onClose,
  onSubmit,
  context,
  initialCategory,
  exerciseName,
}: FeedbackDetailModalProps) {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<FeedbackCategory | null>(initialCategory || null);
  const [severity, setSeverity] = useState<FeedbackSeverity | null>(null);
  const [selectedQuickOptions, setSelectedQuickOptions] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [descriptionFocused, setDescriptionFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or initial category changes
  useEffect(() => {
    if (visible) {
      setCategory(initialCategory || null);
      setSeverity(null);
      setSelectedQuickOptions([]);
      setDescription('');
    }
  }, [visible, initialCategory]);

  const showSeverity = category === 'safety_concern' || category === 'dysphoria_trigger';
  const quickOptions = category ? getQuickOptionsByCategory(category) : [];
  const canSubmit = category !== null;

  const handleQuickOptionToggle = (optionId: string) => {
    setSelectedQuickOptions(prev =>
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit || !category) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        category,
        severity: severity || undefined,
        quickFeedback: selectedQuickOptions,
        description: description.trim() || undefined,
      });

      // Reset form and close
      setCategory(null);
      setSeverity(null);
      setSelectedQuickOptions([]);
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setCategory(null);
      setSeverity(null);
      setSelectedQuickOptions([]);
      setDescription('');
      onClose();
    }
  };

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
              <Ionicons name="flag" size={20} color={colors.accent.secondary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Report an Issue</Text>
              <Text style={styles.subtitle}>
                {exerciseName ? `About: ${exerciseName}` : 'Help us improve your experience'}
              </Text>
            </View>
            <Pressable onPress={handleClose} hitSlop={8} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.tertiary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Category Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>What type of issue?</Text>
              <View style={styles.categoryGrid}>
                {FEEDBACK_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.category}
                    style={[
                      styles.categoryButton,
                      category === cat.category && styles.categoryButtonSelected,
                      category === cat.category && { borderColor: cat.color },
                    ]}
                    onPress={() => {
                      setCategory(cat.category);
                      setSelectedQuickOptions([]);
                    }}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={20}
                      color={category === cat.category ? cat.color : colors.text.secondary}
                    />
                    <Text
                      style={[
                        styles.categoryLabel,
                        category === cat.category && { color: cat.color },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Severity Selection (for safety/dysphoria) */}
            {showSeverity && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>How serious was this?</Text>
                <View style={styles.severityRow}>
                  {(['low', 'medium', 'high', 'critical'] as FeedbackSeverity[]).map((sev) => (
                    <Pressable
                      key={sev}
                      style={[
                        styles.severityButton,
                        severity === sev && styles.severityButtonSelected,
                      ]}
                      onPress={() => setSeverity(sev)}
                    >
                      {severity === sev && (
                        <LinearGradient
                          colors={[colors.accent.primary, colors.accent.primaryDark]}
                          style={StyleSheet.absoluteFill}
                        />
                      )}
                      <Text
                        style={[
                          styles.severityText,
                          severity === sev && styles.severityTextSelected,
                        ]}
                      >
                        {sev.charAt(0).toUpperCase() + sev.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Quick Options (based on category) */}
            {quickOptions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>What happened? (select all that apply)</Text>
                <View style={styles.quickOptionsGrid}>
                  {quickOptions.map((option) => (
                    <Pressable
                      key={option.id}
                      style={[
                        styles.quickOptionButton,
                        selectedQuickOptions.includes(option.id) && styles.quickOptionButtonSelected,
                      ]}
                      onPress={() => handleQuickOptionToggle(option.id)}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={16}
                        color={
                          selectedQuickOptions.includes(option.id)
                            ? colors.accent.primary
                            : colors.text.secondary
                        }
                      />
                      <Text
                        style={[
                          styles.quickOptionLabel,
                          selectedQuickOptions.includes(option.id) && styles.quickOptionLabelSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Tell us more (optional)</Text>
              <View
                style={[
                  styles.descriptionContainer,
                  descriptionFocused && styles.descriptionContainerFocused,
                ]}
              >
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Describe what happened or what felt wrong..."
                  placeholderTextColor={colors.text.tertiary}
                  value={description}
                  onChangeText={setDescription}
                  onFocus={() => setDescriptionFocused(true)}
                  onBlur={() => setDescriptionFocused(false)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Submit Button */}
            <Pressable
              style={[styles.submitButton, (!canSubmit || isSubmitting) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit || isSubmitting}
            >
              <LinearGradient
                colors={
                  canSubmit && !isSubmitting
                    ? [colors.accent.primary, colors.accent.primaryDark]
                    : [colors.glass.bgLight, colors.glass.bg]
                }
                style={StyleSheet.absoluteFill}
              />
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.text.inverse} />
              ) : (
                <>
                  <Ionicons
                    name="send"
                    size={18}
                    color={canSubmit ? colors.text.inverse : colors.text.tertiary}
                  />
                  <Text
                    style={[
                      styles.submitButtonText,
                      !canSubmit && styles.submitButtonTextDisabled,
                    ]}
                  >
                    Submit Report
                  </Text>
                </>
              )}
            </Pressable>

            {/* Cancel Link */}
            <Pressable onPress={handleClose} style={styles.cancelButton} disabled={isSubmitting}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </ScrollView>
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
    maxHeight: '90%',
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
    backgroundColor: colors.accent.secondaryMuted,
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
    flex: 1,
  },
  contentContainer: {
    padding: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.m,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.l,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  categoryButtonSelected: {
    backgroundColor: colors.glass.bgLight,
  },
  categoryLabel: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  severityRow: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  severityButton: {
    flex: 1,
    height: 40,
    borderRadius: borderRadius.m,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  severityButtonSelected: {
    borderColor: colors.accent.primary,
  },
  severityText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  severityTextSelected: {
    color: colors.text.inverse,
  },
  quickOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  quickOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.l,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  quickOptionButtonSelected: {
    backgroundColor: colors.glass.bgLight,
    borderColor: colors.accent.primary,
  },
  quickOptionLabel: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  quickOptionLabelSelected: {
    color: colors.accent.primary,
  },
  descriptionContainer: {
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.m,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  descriptionContainerFocused: {
    borderColor: colors.accent.primary,
  },
  descriptionInput: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.primary,
    padding: spacing.m,
    minHeight: 100,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.m,
    marginTop: spacing.m,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
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
