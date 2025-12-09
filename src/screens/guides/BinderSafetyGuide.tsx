// Binder Safety Guide Screen
// PRD 3.0 requirement: Mini-guide on binder safety basics

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { GlassCard } from '../../components/common';

interface GuideSection {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  content: string[];
  iconColor: string;
  iconBg: string;
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    icon: 'time-outline',
    title: 'Time Limits',
    content: [
      'Limit binding to 8-10 hours maximum per day',
      'Take breaks every few hours when possible',
      'Never sleep in a binder',
      'On workout days, consider shorter binding sessions',
    ],
    iconColor: colors.accent.primary,
    iconBg: colors.accent.primaryMuted,
  },
  {
    icon: 'fitness-outline',
    title: 'Exercise Modifications',
    content: [
      'Avoid high-intensity cardio while binding',
      'Reduce weights for chest-loading exercises',
      'Take longer rest periods between sets',
      'Skip jumping and high-impact movements',
      'Focus on lower body and core work',
    ],
    iconColor: colors.accent.secondary,
    iconBg: colors.accent.secondaryMuted,
  },
  {
    icon: 'alert-circle-outline',
    title: 'Warning Signs to Stop',
    content: [
      'Sharp or stabbing chest pain',
      'Difficulty taking a full breath',
      'Lightheadedness or dizziness',
      'Rib tenderness or bruising',
      'Numbness in arms or chest',
    ],
    iconColor: colors.warning,
    iconBg: colors.accent.warningMuted,
  },
  {
    icon: 'heart-outline',
    title: 'Safer Alternatives',
    content: [
      'Trans tape for longer activities',
      'Compression sports bras',
      'Layered loose clothing',
      'Consider binding less on workout days',
    ],
    iconColor: colors.success,
    iconBg: colors.accent.successMuted,
  },
  {
    icon: 'checkmark-circle-outline',
    title: 'Best Practices',
    content: [
      'Use properly sized binders (never too tight)',
      'Take full unbinding rest days each week',
      'Listen to your body—discomfort is a signal',
      'Stay hydrated during exercise',
      'Consider the post-workout binder break',
    ],
    iconColor: colors.accent.primary,
    iconBg: colors.accent.primaryMuted,
  },
];

export default function BinderSafetyGuide() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Binder Safety</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <GlassCard variant="hero" shimmer style={styles.heroCard}>
          <View style={styles.heroIconContainer}>
            <LinearGradient
              colors={[colors.accent.primary, colors.accent.secondary]}
              style={styles.heroIconGradient}
            >
              <Ionicons name="shield-checkmark" size={32} color={colors.text.inverse} />
            </LinearGradient>
          </View>
          <Text style={styles.heroTitle}>Exercise Safely While Binding</Text>
          <Text style={styles.heroSubtitle}>
            Practical guidance to help you train while respecting your body's limits
          </Text>
        </GlassCard>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons name="information-circle" size={18} color={colors.text.tertiary} />
          <Text style={styles.disclaimerText}>
            This guide provides general information only. It is not medical advice.
            If you experience pain or concerning symptoms, stop and consult a healthcare provider.
          </Text>
        </View>

        {/* Guide Sections */}
        {GUIDE_SECTIONS.map((section, index) => (
          <GlassCard key={index} variant="default" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: section.iconBg }]}>
                <Ionicons name={section.icon} size={20} color={section.iconColor} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <View style={styles.sectionContent}>
              {section.content.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.bulletItem}>
                  <View style={[styles.bullet, { backgroundColor: section.iconColor }]} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        ))}

        {/* TransFitness Integration Note */}
        <GlassCard variant="heroPink" style={styles.integrationCard}>
          <View style={styles.integrationHeader}>
            <Ionicons name="sparkles" size={20} color={colors.accent.secondary} />
            <Text style={styles.integrationTitle}>How TransFitness Helps</Text>
          </View>
          <Text style={styles.integrationText}>
            When you tell us you bind, we automatically:
          </Text>
          <View style={styles.integrationList}>
            <Text style={styles.integrationItem}>• Reduce high-impact exercises</Text>
            <Text style={styles.integrationItem}>• Add breathing check-ins to your workout</Text>
            <Text style={styles.integrationItem}>• Adjust rest periods for recovery</Text>
            <Text style={styles.integrationItem}>• Show relevant safety reminders</Text>
          </View>
        </GlassCard>

        {/* Resources */}
        <View style={styles.resourcesSection}>
          <Text style={styles.resourcesTitle}>External Resources</Text>
          <Text style={styles.resourcesText}>
            For comprehensive medical information about binding safety, consult
            organizations like GLMA, Fenway Health, or your healthcare provider.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.m,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.l,
  },
  heroIconContainer: {
    marginBottom: spacing.m,
  },
  heroIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  heroTitle: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.s,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.m,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s,
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.m,
    padding: spacing.m,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.tertiary,
    lineHeight: 18,
  },
  sectionCard: {
    marginBottom: spacing.m,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    marginBottom: spacing.m,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  sectionContent: {
    gap: spacing.s,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.m,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
    lineHeight: 22,
  },
  integrationCard: {
    marginTop: spacing.m,
    marginBottom: spacing.xl,
  },
  integrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  integrationTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  integrationText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
    marginBottom: spacing.s,
  },
  integrationList: {
    gap: spacing.xs,
  },
  integrationItem: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
    lineHeight: 22,
  },
  resourcesSection: {
    paddingVertical: spacing.m,
  },
  resourcesTitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.tertiary,
    marginBottom: spacing.s,
  },
  resourcesText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.tertiary,
    lineHeight: 20,
  },
});
