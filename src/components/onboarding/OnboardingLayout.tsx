import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
  KeyboardAvoidingView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';

interface OnboardingLayoutProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  onBack: () => void;
  onContinue: () => void;
  canContinue: boolean;
  children: React.ReactNode;
  continueButtonText?: string;
}

// Animated progress dot
function ProgressDot({ isActive, isComplete }: { isActive: boolean; isComplete: boolean }) {
  const widthAnim = useRef(new Animated.Value(isActive ? 20 : 8)).current;

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: isActive ? 20 : 8,
      tension: 300,
      friction: 15,
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  if (isActive) {
    return (
      <Animated.View style={[styles.dotActive, { width: widthAnim }]}>
        <LinearGradient
          colors={[colors.accent.primary, colors.accent.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    );
  }

  if (isComplete) {
    return (
      <View style={styles.dotComplete}>
        <LinearGradient
          colors={[colors.accent.primary, colors.accent.primaryDark]}
          style={StyleSheet.absoluteFill}
        />
      </View>
    );
  }

  return <View style={styles.dot} />;
}

export default function OnboardingLayout({
  currentStep,
  totalSteps,
  title,
  subtitle,
  onBack,
  onContinue,
  canContinue,
  children,
  continueButtonText = 'Continue',
}: OnboardingLayoutProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < 375;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (canContinue) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [canContinue]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 400],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bg.primary, colors.bg.secondary]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.content, { paddingTop: insets.top + spacing.m }]}>
          {/* Scrollable Content - header and title scroll with content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={onBack}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.buttonPressed,
              ]}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
            </Pressable>

            {/* Progress */}
            <View style={styles.progressContainer}>
              <Text style={styles.stepText}>
                STEP {currentStep} OF {totalSteps}
              </Text>
              <View style={styles.dotsContainer}>
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <ProgressDot
                    key={index}
                    isActive={index === currentStep - 1}
                    isComplete={index < currentStep - 1}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* Title & Subtitle */}
          <View style={styles.titleSection}>
            <Text style={[styles.title, isSmall && styles.titleSmall]}>{title}</Text>
            <Text style={[styles.subtitle, isSmall && styles.subtitleSmall]}>{subtitle}</Text>
          </View>

          {/* Screen-specific content */}
          {children}
        </ScrollView>

        {/* Continue Button */}
        <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + spacing.m }]}>
          <Pressable
            onPress={onContinue}
            disabled={!canContinue}
            style={({ pressed }) => [
              styles.continueButton,
              !canContinue && styles.continueButtonDisabled,
              pressed && canContinue && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={canContinue
                ? [colors.accent.primary, colors.accent.primaryDark]
                : [colors.glass.bg, colors.glass.bg]
              }
              style={StyleSheet.absoluteFill}
            />
            {canContinue && (
              <>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.2)', 'transparent']}
                  style={styles.buttonGlassOverlay}
                />
                <Animated.View
                  style={[
                    styles.buttonShimmer,
                    { transform: [{ translateX: shimmerTranslate }] },
                  ]}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.15)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </>
            )}
            <Text style={[
              styles.continueButtonText,
              !canContinue && styles.continueButtonTextDisabled,
            ]}>
              {continueButtonText}
            </Text>
            {canContinue && (
              <Ionicons name="arrow-forward" size={20} color={colors.text.inverse} />
            )}
          </Pressable>
        </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  header: {
    marginBottom: spacing.l,
    gap: spacing.s,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.glass.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  progressContainer: {
    gap: spacing.s,
  },
  stepText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.tertiary,
    letterSpacing: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: spacing.s,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border.default,
  },
  dotActive: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  dotComplete: {
    width: 8,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  titleSection: {
    marginBottom: spacing.l,
    gap: spacing.xs,
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  titleSmall: {
    fontSize: 18,
  },
  subtitleSmall: {
    fontSize: 13,
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.m,
    paddingBottom: spacing.xl,
  },
  buttonContainer: {
    paddingTop: spacing.m,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.m,
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
  continueButtonDisabled: {
    ...Platform.select({
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
    }),
  },
  buttonGlassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  buttonShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 200,
  },
  continueButtonText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  continueButtonTextDisabled: {
    color: colors.text.tertiary,
  },
});
