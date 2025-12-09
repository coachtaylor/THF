// Beta Survey Modal Component
// PRD 3.0 Section 7.3: User validation metrics for MVP
// Questions:
// 1. Safety score (1-5): "How safe do you feel following these workouts?"
// 2. Relevance score (1-5): "How well does this app understand your situation?"
// 3. "Would you be sad?" (Very/Somewhat/Not really)

import React, { useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';

export interface SurveyResponse {
  safetyScore: number;
  relevanceScore: number;
  sadnessLevel: 'very' | 'somewhat' | 'not_really' | null;
  feedback?: string;
  timestamp: string;
  triggerPoint: 'onboarding' | 'workout' | 'manual';
}

interface BetaSurveyModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (response: SurveyResponse) => void;
  triggerPoint: 'onboarding' | 'workout' | 'manual';
}

const SADNESS_OPTIONS = [
  { value: 'very' as const, emoji: '😢', label: 'Very sad' },
  { value: 'somewhat' as const, emoji: '😕', label: 'Somewhat sad' },
  { value: 'not_really' as const, emoji: '😐', label: 'Not really' },
];

function ScoreSelector({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (score: number) => void;
}) {
  return (
    <View style={styles.questionContainer}>
      <Text style={styles.questionLabel}>{label}</Text>
      <Text style={styles.questionDescription}>{description}</Text>
      <View style={styles.scoreRow}>
        {[1, 2, 3, 4, 5].map((score) => (
          <Pressable
            key={score}
            style={[
              styles.scoreButton,
              value === score && styles.scoreButtonSelected,
            ]}
            onPress={() => onChange(score)}
          >
            {value === score && (
              <LinearGradient
                colors={[colors.accent.primary, colors.accent.primaryDark]}
                style={StyleSheet.absoluteFill}
              />
            )}
            <Text
              style={[
                styles.scoreText,
                value === score && styles.scoreTextSelected,
              ]}
            >
              {score}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.scaleLabels}>
        <Text style={styles.scaleLabel}>Not at all</Text>
        <Text style={styles.scaleLabel}>Very much</Text>
      </View>
    </View>
  );
}

export default function BetaSurveyModal({
  visible,
  onClose,
  onSubmit,
  triggerPoint,
}: BetaSurveyModalProps) {
  const insets = useSafeAreaInsets();
  const [safetyScore, setSafetyScore] = useState(0);
  const [relevanceScore, setRelevanceScore] = useState(0);
  const [sadnessLevel, setSadnessLevel] = useState<'very' | 'somewhat' | 'not_really' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackFocused, setFeedbackFocused] = useState(false);

  const canSubmit = safetyScore > 0 && relevanceScore > 0 && sadnessLevel !== null;

  const handleSubmit = () => {
    if (!canSubmit) return;

    const response: SurveyResponse = {
      safetyScore,
      relevanceScore,
      sadnessLevel,
      feedback: feedback.trim() || undefined,
      timestamp: new Date().toISOString(),
      triggerPoint,
    };

    onSubmit(response);

    // Reset form
    setSafetyScore(0);
    setRelevanceScore(0);
    setSadnessLevel(null);
    setFeedback('');
  };

  const handleSkip = () => {
    // Reset form
    setSafetyScore(0);
    setRelevanceScore(0);
    setSadnessLevel(null);
    setFeedback('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleSkip}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={handleSkip} />

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
              <Ionicons name="chatbubble-ellipses" size={20} color={colors.accent.secondary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Quick Feedback</Text>
              <Text style={styles.subtitle}>Help us make TransFitness better</Text>
            </View>
            <Pressable onPress={handleSkip} hitSlop={8} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.tertiary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Question 1: Safety Score */}
            <ScoreSelector
              label="How safe do you feel?"
              description="Following these workouts with your body and situation"
              value={safetyScore}
              onChange={setSafetyScore}
            />

            {/* Question 2: Relevance Score */}
            <ScoreSelector
              label="How well do we understand you?"
              description="Does the app feel tailored to your specific situation?"
              value={relevanceScore}
              onChange={setRelevanceScore}
            />

            {/* Question 3: Sadness Level */}
            <View style={styles.questionContainer}>
              <Text style={styles.questionLabel}>If TransFitness went away...</Text>
              <Text style={styles.questionDescription}>
                How would you feel if you could no longer use this app?
              </Text>
              <View style={styles.sadnessRow}>
                {SADNESS_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.sadnessOption,
                      sadnessLevel === option.value && styles.sadnessOptionSelected,
                    ]}
                    onPress={() => setSadnessLevel(option.value)}
                  >
                    {sadnessLevel === option.value && (
                      <LinearGradient
                        colors={[`${colors.accent.secondary}30`, 'transparent']}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                    <Text style={styles.sadnessEmoji}>{option.emoji}</Text>
                    <Text
                      style={[
                        styles.sadnessLabel,
                        sadnessLevel === option.value && styles.sadnessLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {sadnessLevel === option.value && (
                      <View style={styles.checkmark}>
                        <Ionicons name="checkmark" size={12} color={colors.text.inverse} />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Optional Feedback */}
            <View style={styles.questionContainer}>
              <Text style={styles.questionLabel}>Anything else? (optional)</Text>
              <View
                style={[
                  styles.feedbackContainer,
                  feedbackFocused && styles.feedbackContainerFocused,
                ]}
              >
                <TextInput
                  style={styles.feedbackInput}
                  placeholder="What's working? What's not? What would you love to see?"
                  placeholderTextColor={colors.text.tertiary}
                  value={feedback}
                  onChangeText={setFeedback}
                  onFocus={() => setFeedbackFocused(true)}
                  onBlur={() => setFeedbackFocused(false)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Submit Button */}
            <Pressable
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              <LinearGradient
                colors={
                  canSubmit
                    ? [colors.accent.primary, colors.accent.primaryDark]
                    : [colors.glass.bgLight, colors.glass.bg]
                }
                style={StyleSheet.absoluteFill}
              />
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
                Send Feedback
              </Text>
            </Pressable>

            {/* Skip Link */}
            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Maybe later</Text>
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
  questionContainer: {
    marginBottom: spacing.xl,
  },
  questionLabel: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  questionDescription: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.secondary,
    marginBottom: spacing.m,
    lineHeight: 18,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  scoreButton: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.m,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  scoreButtonSelected: {
    borderColor: colors.accent.primary,
  },
  scoreText: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  scoreTextSelected: {
    color: colors.text.inverse,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  scaleLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '400',
    color: colors.text.tertiary,
  },
  sadnessRow: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  sadnessOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.l,
    paddingHorizontal: spacing.s,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
    position: 'relative',
  },
  sadnessOptionSelected: {
    borderColor: colors.accent.secondary,
  },
  sadnessEmoji: {
    fontSize: 28,
    marginBottom: spacing.s,
  },
  sadnessLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  sadnessLabelSelected: {
    color: colors.accent.secondary,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackContainer: {
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.m,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  feedbackContainerFocused: {
    borderColor: colors.accent.primary,
  },
  feedbackInput: {
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
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.m,
    marginTop: spacing.s,
  },
  skipText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
});
