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
  experienceScore: number;
  clarityScore: number;
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
  const [experienceScore, setExperienceScore] = useState(0);
  const [clarityScore, setClarityScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [feedbackFocused, setFeedbackFocused] = useState(false);

  const canSubmit = experienceScore > 0 && clarityScore > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;

    const response: SurveyResponse = {
      experienceScore,
      clarityScore,
      feedback: feedback.trim() || undefined,
      timestamp: new Date().toISOString(),
      triggerPoint,
    };

    onSubmit(response);

    // Reset form
    setExperienceScore(0);
    setClarityScore(0);
    setFeedback('');
  };

  const handleSkip = () => {
    // Reset form
    setExperienceScore(0);
    setClarityScore(0);
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
            {/* Question 1: Overall Experience */}
            <ScoreSelector
              label="How was your onboarding experience?"
              description="Setting up your profile and preferences"
              value={experienceScore}
              onChange={setExperienceScore}
            />

            {/* Question 2: Clarity Score */}
            <ScoreSelector
              label="How clear were the instructions?"
              description="Was it easy to understand what to do at each step?"
              value={clarityScore}
              onChange={setClarityScore}
            />

            {/* Optional Feedback */}
            <View style={styles.questionContainer}>
              <Text style={styles.questionLabel}>What could we improve? (optional)</Text>
              <View
                style={[
                  styles.feedbackContainer,
                  feedbackFocused && styles.feedbackContainerFocused,
                ]}
              >
                <TextInput
                  style={styles.feedbackInput}
                  placeholder="Any confusing parts? Missing options? Suggestions?"
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
