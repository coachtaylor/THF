// src/components/session/PostWorkoutCheckin.tsx
// Post-workout body check-in component (PRD User Story 26)
// "How did moving today feel in your body?"

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../../theme/theme';

export type BodyCheckinResponse = 'connected' | 'neutral' | 'disconnected' | 'skip';

export interface BodyCheckinData {
  response: BodyCheckinResponse;
  timestamp: string;
}

interface BodyCheckinOption {
  value: Exclude<BodyCheckinResponse, 'skip'>;
  emoji: string;
  label: string;
  description: string;
  color: string;
}

const CHECKIN_OPTIONS: BodyCheckinOption[] = [
  {
    value: 'connected',
    emoji: '✨',
    label: 'Connected',
    description: 'I felt present in my body',
    color: colors.success,
  },
  {
    value: 'neutral',
    emoji: '🤔',
    label: 'Neutral',
    description: 'Just moving through it',
    color: colors.accent.primary,
  },
  {
    value: 'disconnected',
    emoji: '😶',
    label: 'Disconnected',
    description: 'My body felt far away',
    color: colors.accent.secondary,
  },
];

interface PostWorkoutCheckinProps {
  visible: boolean;
  onSubmit: (data: BodyCheckinData) => void;
  onSkip: () => void;
}

export function PostWorkoutCheckin({
  visible,
  onSubmit,
  onSkip,
}: PostWorkoutCheckinProps) {
  const insets = useSafeAreaInsets();
  const [selectedOption, setSelectedOption] = useState<BodyCheckinResponse | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      setSelectedOption(null);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible, fadeAnim, slideAnim]);

  const handleOptionSelect = (option: BodyCheckinResponse) => {
    setSelectedOption(option);
  };

  const handleSubmit = () => {
    if (selectedOption) {
      onSubmit({
        response: selectedOption,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleSkip = () => {
    onSubmit({
      response: 'skip',
      timestamp: new Date().toISOString(),
    });
    onSkip();
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: fadeAnim },
          ]}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.container,
            {
              paddingBottom: Math.max(insets.bottom, spacing.xl),
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.card}>
            <LinearGradient
              colors={['#141418', '#0A0A0C']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.glassHighlight} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={[colors.accent.primaryMuted, colors.glass.bg]}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="body" size={24} color={colors.accent.primary} />
              </View>
              <Text style={styles.title}>Body Check-in</Text>
              <Text style={styles.subtitle}>
                How did moving today feel in your body?
              </Text>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              {CHECKIN_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={({ pressed }) => [
                    styles.optionCard,
                    selectedOption === option.value && styles.optionCardSelected,
                    selectedOption === option.value && {
                      borderColor: option.color,
                    },
                    pressed && styles.optionCardPressed,
                  ]}
                  onPress={() => handleOptionSelect(option.value)}
                >
                  {selectedOption === option.value && (
                    <LinearGradient
                      colors={[option.color + '20', 'transparent']}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <View style={styles.optionTextContainer}>
                    <Text
                      style={[
                        styles.optionLabel,
                        selectedOption === option.value && { color: option.color },
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  </View>
                  {selectedOption === option.value && (
                    <View
                      style={[
                        styles.checkmark,
                        { backgroundColor: option.color },
                      ]}
                    >
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={colors.text.inverse}
                      />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [
                  styles.submitButton,
                  !selectedOption && styles.submitButtonDisabled,
                  pressed && selectedOption && styles.buttonPressed,
                ]}
                onPress={handleSubmit}
                disabled={!selectedOption}
              >
                <LinearGradient
                  colors={
                    selectedOption
                      ? [colors.accent.primary, colors.accent.primaryDark]
                      : ['#333', '#222']
                  }
                  style={StyleSheet.absoluteFill}
                />
                <Text
                  style={[
                    styles.submitButtonText,
                    !selectedOption && styles.submitButtonTextDisabled,
                  ]}
                >
                  Save Check-in
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.skipButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleSkip}
              >
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </Pressable>
            </View>

            {/* Privacy note */}
            <Text style={styles.privacyNote}>
              This helps us understand how workouts affect you. Your data stays on your device.
            </Text>
          </View>
        </Animated.View>
      </View>
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
  },
  container: {
    paddingHorizontal: spacing.l,
  },
  card: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
    padding: spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.m,
    overflow: 'hidden',
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: spacing.m,
    marginBottom: spacing.xl,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.glass.bg,
    overflow: 'hidden',
  },
  optionCardSelected: {
    borderWidth: 2,
  },
  optionCardPressed: {
    opacity: 0.8,
  },
  optionEmoji: {
    fontSize: 32,
    marginRight: spacing.m,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  optionDescription: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.tertiary,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.s,
  },
  actions: {
    gap: spacing.m,
    marginBottom: spacing.m,
  },
  submitButton: {
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.m,
    alignItems: 'center',
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.5,
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
    paddingVertical: spacing.s,
    alignItems: 'center',
  },
  skipButtonText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.tertiary,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  privacyNote: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

export default PostWorkoutCheckin;
