// Post-Op Movement Guide Screen
// PRD 3.0 requirement: General outline for returning to movement after top surgery

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

interface PhaseInfo {
  title: string;
  weeks: string;
  focus: string;
  activities: string[];
  avoid: string[];
  color: string;
  bgColor: string;
}

const RECOVERY_PHASES: PhaseInfo[] = [
  {
    title: 'Phase 1: Rest & Heal',
    weeks: 'Weeks 0-2',
    focus: 'Complete rest and initial healing',
    activities: [
      'Short, gentle walks (5-10 minutes)',
      'Light stretching of lower body only',
      'Deep breathing exercises',
      'Focus on sleep and nutrition',
    ],
    avoid: [
      'Any upper body movement',
      'Raising arms above shoulder level',
      'Lifting anything heavier than 5 lbs',
      'Driving (first week minimum)',
    ],
    color: colors.accent.secondary,
    bgColor: colors.accent.secondaryMuted,
  },
  {
    title: 'Phase 2: Gentle Mobility',
    weeks: 'Weeks 2-6',
    focus: 'Gradual mobility restoration',
    activities: [
      'Walking (gradually increasing distance)',
      'Gentle lower body movements',
      'Light core work (no crunches)',
      'Range of motion for shoulders (if cleared)',
    ],
    avoid: [
      'Chest exercises of any kind',
      'Overhead movements',
      'Heavy carrying or lifting',
      'High-impact activities',
    ],
    color: colors.accent.primary,
    bgColor: colors.accent.primaryMuted,
  },
  {
    title: 'Phase 3: Building Back',
    weeks: 'Weeks 6-12',
    focus: 'Conservative strength rebuilding',
    activities: [
      'Light upper body work (surgeon approved)',
      'Bodyweight exercises',
      'Resistance bands',
      'Stationary cardio',
    ],
    avoid: [
      'Heavy pressing movements',
      'Direct chest loading',
      'Pull-ups and dips',
      'Pushing to failure',
    ],
    color: colors.success,
    bgColor: colors.accent.successMuted,
  },
  {
    title: 'Phase 4: Progressive Return',
    weeks: 'Weeks 12-24',
    focus: 'Gradual return to normal training',
    activities: [
      'Progressive overload (slowly)',
      'Full range of motion work',
      'Most exercises with modifications',
      'Scar massage and mobility',
    ],
    avoid: [
      'Maximal lifts (PRs)',
      'Anything causing pulling at incisions',
      'Ignoring pain signals',
      'Rushing the process',
    ],
    color: colors.accent.primary,
    bgColor: colors.accent.primaryMuted,
  },
];

const GENERAL_TIPS = [
  {
    icon: 'medical-outline' as const,
    text: 'Always follow your surgeon\'s specific instructions—they override any general guidelines.',
  },
  {
    icon: 'body-outline' as const,
    text: 'Every body heals differently. Some people progress faster, some slower. Both are normal.',
  },
  {
    icon: 'alert-circle-outline' as const,
    text: 'Sharp pain, pulling at incisions, or unusual swelling are signals to stop and check with your provider.',
  },
  {
    icon: 'heart-outline' as const,
    text: 'Mental health matters too. Be patient with yourself—this is a marathon, not a sprint.',
  },
];

export default function PostOpMovementGuide() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Post-Op Movement</Text>
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
              colors={[colors.accent.secondary, colors.accent.primary]}
              style={styles.heroIconGradient}
            >
              <Ionicons name="trending-up" size={32} color={colors.text.inverse} />
            </LinearGradient>
          </View>
          <Text style={styles.heroTitle}>Returning to Movement</Text>
          <Text style={styles.heroSubtitle}>
            A general outline for getting back to training after top surgery
          </Text>
        </GlassCard>

        {/* Important Disclaimer */}
        <GlassCard variant="default" style={styles.disclaimerCard}>
          <View style={styles.disclaimerHeader}>
            <Ionicons name="warning" size={20} color={colors.warning} />
            <Text style={styles.disclaimerTitle}>Important</Text>
          </View>
          <Text style={styles.disclaimerText}>
            This is a general educational outline, not a medical protocol. Your surgeon's
            instructions take priority. Every surgery and every body is different—
            these phases are approximate guidelines, not strict rules.
          </Text>
        </GlassCard>

        {/* Recovery Phases */}
        <Text style={styles.sectionHeading}>Recovery Phases</Text>

        {RECOVERY_PHASES.map((phase, index) => (
          <GlassCard key={index} variant="default" style={styles.phaseCard}>
            {/* Phase Header */}
            <View style={styles.phaseHeader}>
              <View style={[styles.phaseBadge, { backgroundColor: phase.bgColor }]}>
                <Text style={[styles.phaseBadgeText, { color: phase.color }]}>
                  {phase.weeks}
                </Text>
              </View>
              <Text style={styles.phaseTitle}>{phase.title}</Text>
            </View>

            <Text style={styles.phaseFocus}>{phase.focus}</Text>

            {/* Activities */}
            <View style={styles.phaseSection}>
              <View style={styles.phaseSectionHeader}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.phaseSectionTitle}>Generally Okay</Text>
              </View>
              {phase.activities.map((activity, i) => (
                <Text key={i} style={styles.phaseItem}>• {activity}</Text>
              ))}
            </View>

            {/* Avoid */}
            <View style={styles.phaseSection}>
              <View style={styles.phaseSectionHeader}>
                <Ionicons name="close-circle" size={16} color={colors.error} />
                <Text style={styles.phaseSectionTitle}>Usually Avoid</Text>
              </View>
              {phase.avoid.map((item, i) => (
                <Text key={i} style={styles.phaseItem}>• {item}</Text>
              ))}
            </View>
          </GlassCard>
        ))}

        {/* General Tips */}
        <Text style={styles.sectionHeading}>Key Reminders</Text>

        <GlassCard variant="default" style={styles.tipsCard}>
          {GENERAL_TIPS.map((tip, index) => (
            <View
              key={index}
              style={[
                styles.tipItem,
                index > 0 && styles.tipItemBorder,
              ]}
            >
              <View style={styles.tipIcon}>
                <Ionicons name={tip.icon} size={18} color={colors.accent.primary} />
              </View>
              <Text style={styles.tipText}>{tip.text}</Text>
            </View>
          ))}
        </GlassCard>

        {/* TransFitness Integration */}
        <GlassCard variant="heroPink" style={styles.integrationCard}>
          <View style={styles.integrationHeader}>
            <Ionicons name="sparkles" size={20} color={colors.accent.secondary} />
            <Text style={styles.integrationTitle}>How TransFitness Adapts</Text>
          </View>
          <Text style={styles.integrationText}>
            When you enter your surgery date, we:
          </Text>
          <View style={styles.integrationList}>
            <Text style={styles.integrationItem}>• Calculate your current recovery phase</Text>
            <Text style={styles.integrationItem}>• Exclude exercises that are typically too risky</Text>
            <Text style={styles.integrationItem}>• Suggest appropriate movement for your phase</Text>
            <Text style={styles.integrationItem}>• Gradually reintroduce upper body work</Text>
            <Text style={styles.integrationItem}>• Include scar care reminders when relevant</Text>
          </View>
        </GlassCard>

        {/* When to Seek Help */}
        <GlassCard variant="default" style={styles.helpCard}>
          <View style={styles.helpHeader}>
            <Ionicons name="call" size={20} color={colors.warning} />
            <Text style={styles.helpTitle}>Contact Your Provider If:</Text>
          </View>
          <View style={styles.helpList}>
            <Text style={styles.helpItem}>• New or worsening pain during activity</Text>
            <Text style={styles.helpItem}>• Pulling, popping, or tearing sensation</Text>
            <Text style={styles.helpItem}>• Increased swelling or redness at incision sites</Text>
            <Text style={styles.helpItem}>• Fluid discharge from incisions</Text>
            <Text style={styles.helpItem}>• Any concerning changes in healing</Text>
          </View>
        </GlassCard>

        {/* Footer Note */}
        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            Recovery is not linear. Some weeks will feel great, others less so.
            Trust the process and give yourself grace.
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
        shadowColor: colors.accent.secondary,
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
  disclaimerCard: {
    marginBottom: spacing.xl,
    borderColor: `${colors.warning}40`,
    backgroundColor: `${colors.warning}08`,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: spacing.s,
  },
  disclaimerTitle: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: colors.warning,
  },
  disclaimerText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.secondary,
    lineHeight: 20,
  },
  sectionHeading: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.m,
    letterSpacing: -0.3,
  },
  phaseCard: {
    marginBottom: spacing.m,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    marginBottom: spacing.s,
  },
  phaseBadge: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  phaseBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phaseTitle: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  phaseFocus: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: spacing.m,
  },
  phaseSection: {
    marginBottom: spacing.m,
  },
  phaseSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.s,
  },
  phaseSectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  phaseItem: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.secondary,
    lineHeight: 22,
    paddingLeft: spacing.s,
  },
  tipsCard: {
    marginBottom: spacing.xl,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.m,
    paddingVertical: spacing.m,
  },
  tipItemBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.accent.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
    lineHeight: 22,
  },
  integrationCard: {
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
  helpCard: {
    marginBottom: spacing.l,
    borderColor: `${colors.warning}40`,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  helpTitle: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  helpList: {
    gap: spacing.xs,
  },
  helpItem: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.secondary,
    lineHeight: 20,
  },
  footerNote: {
    paddingVertical: spacing.l,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
