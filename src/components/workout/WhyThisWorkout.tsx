// WhyThisWorkout bottom sheet component
// Displays explanations for workout customizations based on user's safety profile

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../../theme/theme';
import {
  WorkoutExplanation,
  ExplanationCategory,
  sortExplanationsByPriority,
  getFallbackMessage,
} from '../../types/explanations';

interface WhyThisWorkoutProps {
  visible: boolean;
  onClose: () => void;
  explanations: WorkoutExplanation[];
  primaryGoal?: string;
}

// Icon and color mapping for each category
const CATEGORY_CONFIG: Record<
  ExplanationCategory,
  { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }
> = {
  binder_safety: {
    icon: 'shield-checkmark',
    color: colors.accent.primary,
    label: 'Binding Safety',
  },
  post_op: {
    icon: 'medical',
    color: colors.accent.secondary,
    label: 'Post-Op Care',
  },
  hrt: {
    icon: 'pulse',
    color: '#A78BFA', // Purple for HRT
    label: 'HRT Considerations',
  },
  environment: {
    icon: 'home',
    color: colors.accent.primaryLight,
    label: 'Environment',
  },
  general: {
    icon: 'fitness',
    color: colors.text.secondary,
    label: 'General',
  },
};

export default function WhyThisWorkout({
  visible,
  onClose,
  explanations,
  primaryGoal,
}: WhyThisWorkoutProps) {
  const insets = useSafeAreaInsets();
  const sortedExplanations = sortExplanationsByPriority(explanations);
  const hasExplanations = sortedExplanations.length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

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
              <Ionicons name="bulb" size={20} color={colors.accent.primary} />
            </View>
            <Text style={styles.title}>Why this workout?</Text>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.tertiary} />
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {hasExplanations ? (
              <>
                <Text style={styles.subtitle}>
                  We customized today's workout based on your profile:
                </Text>

                {sortedExplanations.map((explanation, index) => {
                  const config = CATEGORY_CONFIG[explanation.category];
                  return (
                    <View key={explanation.ruleId || index} style={styles.explanationItem}>
                      <View
                        style={[
                          styles.iconContainer,
                          { backgroundColor: `${config.color}20` },
                        ]}
                      >
                        <Ionicons
                          name={config.icon}
                          size={18}
                          color={config.color}
                        />
                      </View>
                      <View style={styles.explanationContent}>
                        <Text style={[styles.categoryLabel, { color: config.color }]}>
                          {config.label}
                        </Text>
                        <Text style={styles.explanationText}>
                          {explanation.message}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </>
            ) : (
              <View style={styles.fallbackContainer}>
                <View style={styles.fallbackIcon}>
                  <Ionicons
                    name="sparkles"
                    size={32}
                    color={colors.accent.primary}
                  />
                </View>
                <Text style={styles.fallbackText}>
                  {getFallbackMessage(primaryGoal)}
                </Text>
                <Text style={styles.fallbackSubtext}>
                  Your workout is tailored to help you build consistent progress
                  while respecting your body's needs.
                </Text>
              </View>
            )}

            {/* Footer note */}
            <View style={styles.footer}>
              <Ionicons
                name="information-circle"
                size={16}
                color={colors.text.tertiary}
              />
              <Text style={styles.footerText}>
                These adjustments are based on the information you provided. Update
                your profile anytime to refine recommendations.
              </Text>
            </View>
          </ScrollView>
        </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    backgroundColor: colors.bg.tertiary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    minHeight: 350,
    maxHeight: '80%',
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
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.accent.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  title: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.xl,
    paddingTop: spacing.l,
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  explanationItem: {
    flexDirection: 'row',
    marginBottom: spacing.l,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  explanationContent: {
    flex: 1,
  },
  categoryLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  explanationText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.primary,
    lineHeight: 21,
  },
  fallbackContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  fallbackIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.accent.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  fallbackText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.m,
    paddingHorizontal: spacing.l,
  },
  fallbackSubtext: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.l,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.m,
    padding: spacing.m,
    marginTop: spacing.xl,
    gap: spacing.s,
  },
  footerText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.tertiary,
    lineHeight: 18,
  },
});
