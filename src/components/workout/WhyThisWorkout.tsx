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
  getFallbackMessage,
  WorkoutPersonalizationSummary,
  PersonalizationExplanation,
  PersonalizationCategory,
} from '../../types/explanations';

interface WhyThisWorkoutProps {
  visible: boolean;
  onClose: () => void;
  explanations: WorkoutExplanation[];
  primaryGoal?: string;
  personalizationSummary?: WorkoutPersonalizationSummary | null;
}

// Icon and color mapping for personalization categories
const PERSONALIZATION_CONFIG: Record<
  PersonalizationCategory,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  goal: { icon: 'star', color: colors.accent.primary },
  body_focus: { icon: 'body', color: '#F59E0B' }, // Amber
  hrt: { icon: 'pulse', color: '#A78BFA' }, // Purple
  safety: { icon: 'shield-checkmark', color: colors.accent.secondary },
  dysphoria: { icon: 'heart', color: '#EC4899' }, // Pink
  equipment: { icon: 'barbell', color: colors.text.secondary },
  experience: { icon: 'trending-up', color: '#10B981' }, // Green
};

// Personalization item component
function PersonalizationItem({ item }: { item: PersonalizationExplanation }) {
  const config = PERSONALIZATION_CONFIG[item.category] || PERSONALIZATION_CONFIG.goal;
  const iconName = (item.icon as keyof typeof Ionicons.glyphMap) || config.icon;

  return (
    <View style={styles.personalizationItem}>
      <View style={[styles.personalizationIcon, { backgroundColor: `${config.color}15` }]}>
        <Ionicons name={iconName} size={16} color={config.color} />
      </View>
      <View style={styles.personalizationContent}>
        <Text style={styles.personalizationTitle}>{item.title}</Text>
        <Text style={styles.personalizationDescription}>{item.description}</Text>
        {item.examples && item.examples.length > 0 && (
          <Text style={styles.personalizationExamples}>
            e.g., {item.examples.slice(0, 2).join(', ')}
          </Text>
        )}
      </View>
      {item.impact_level === 'high' && (
        <View style={styles.impactBadge}>
          <Ionicons name="flash" size={10} color={colors.accent.primary} />
        </View>
      )}
    </View>
  );
}

export default function WhyThisWorkout({
  visible,
  onClose,
  explanations,
  primaryGoal,
  personalizationSummary,
}: WhyThisWorkoutProps) {
  const insets = useSafeAreaInsets();
  const hasPersonalization = personalizationSummary && personalizationSummary.total_factors > 0;

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
            {/* Personalization Summary Section */}
            {hasPersonalization && (
              <>
                <Text style={styles.sectionLabel}>Personalized for you</Text>

                {/* Primary influences */}
                {personalizationSummary.primary_influences.map((item, index) => (
                  <PersonalizationItem key={`primary-${index}`} item={item} />
                ))}

                {/* Secondary influences (collapsed by default, show top 2) */}
                {personalizationSummary.secondary_influences.slice(0, 2).map((item, index) => (
                  <PersonalizationItem key={`secondary-${index}`} item={item} />
                ))}
              </>
            )}

            {/* Fallback if no personalization */}
            {!hasPersonalization ? (
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
            ) : null}

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
  // Personalization summary styles
  sectionLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.m,
  },
  personalizationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.m,
    paddingVertical: spacing.s,
  },
  personalizationIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  personalizationContent: {
    flex: 1,
  },
  personalizationTitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  personalizationDescription: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.secondary,
    lineHeight: 18,
  },
  personalizationExamples: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '400',
    color: colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  impactBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
