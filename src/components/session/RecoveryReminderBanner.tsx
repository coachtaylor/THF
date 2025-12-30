import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { Surgery, SurgeryType } from '../../types';
import { getRecoveryGuide } from '../../data/recoveryPhases';

interface RecoveryReminderBannerProps {
  surgeries: Surgery[];
  onLearnMore?: (surgery: Surgery) => void;
}

// Human-readable surgery names
const SURGERY_LABELS: Record<SurgeryType, string> = {
  top_surgery: 'Top Surgery',
  bottom_surgery: 'Bottom Surgery',
  vaginoplasty: 'Vaginoplasty',
  phalloplasty: 'Phalloplasty',
  metoidioplasty: 'Metoidioplasty',
  ffs: 'Facial Feminization',
  orchiectomy: 'Orchiectomy',
  hysterectomy: 'Hysterectomy',
  breast_augmentation: 'Breast Augmentation',
  other: 'Surgery',
};

// Get current recovery phase based on weeks post-op
function getRecoveryPhaseInfo(weeksPostOp: number): { phase: number; label: string; color: string } {
  if (weeksPostOp < 2) {
    return { phase: 1, label: 'Rest & Heal', color: colors.accent.secondary };
  } else if (weeksPostOp < 6) {
    return { phase: 2, label: 'Gentle Mobility', color: colors.accent.primary };
  } else if (weeksPostOp < 12) {
    return { phase: 3, label: 'Building Back', color: colors.success };
  } else {
    return { phase: 4, label: 'Progressive Return', color: colors.accent.primary };
  }
}

export default function RecoveryReminderBanner({ surgeries, onLearnMore }: RecoveryReminderBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter to only show surgeries that are not fully healed (within ~24 weeks / 6 months)
  const activeSurgeries = surgeries.filter(s => {
    const weeks = s.weeks_post_op ?? 0;
    return !s.fully_healed && weeks < 24;
  });

  if (activeSurgeries.length === 0) {
    return null;
  }

  // Get the most recent/relevant surgery for the primary message
  const primarySurgery = activeSurgeries.reduce((mostRecent, current) => {
    const currentWeeks = current.weeks_post_op ?? 999;
    const mostRecentWeeks = mostRecent.weeks_post_op ?? 999;
    return currentWeeks < mostRecentWeeks ? current : mostRecent;
  }, activeSurgeries[0]);

  const weeksPostOp = primarySurgery.weeks_post_op ?? 0;
  const phaseInfo = getRecoveryPhaseInfo(weeksPostOp);
  const surgeryLabel = SURGERY_LABELS[primarySurgery.type] || 'Surgery';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.banner}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(245, 169, 184, 0.15)', 'rgba(91, 206, 250, 0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.glassHighlight} />

        <View style={styles.iconContainer}>
          <Ionicons name="medical-outline" size={20} color={phaseInfo.color} />
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Recovery Mode Active</Text>
            <View style={[styles.phaseBadge, { backgroundColor: `${phaseInfo.color}20` }]}>
              <Text style={[styles.phaseBadgeText, { color: phaseInfo.color }]}>
                Phase {phaseInfo.phase}
              </Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            {surgeryLabel} - {weeksPostOp} {weeksPostOp === 1 ? 'week' : 'weeks'} post-op
          </Text>
        </View>

        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.text.tertiary}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <LinearGradient
            colors={['rgba(20, 20, 24, 0.95)', 'rgba(10, 10, 12, 0.98)']}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.phaseInfoRow}>
            <View style={styles.phaseIcon}>
              <Ionicons name="leaf-outline" size={16} color={phaseInfo.color} />
            </View>
            <Text style={styles.phaseLabel}>{phaseInfo.label}</Text>
          </View>

          <Text style={styles.reminderText}>
            Your workout has been adapted for your recovery. Listen to your body and stop if you feel:
          </Text>

          <View style={styles.warningsList}>
            <View style={styles.warningItem}>
              <View style={styles.warningDot} />
              <Text style={styles.warningText}>Sharp pain at incision sites</Text>
            </View>
            <View style={styles.warningItem}>
              <View style={styles.warningDot} />
              <Text style={styles.warningText}>Pulling or tension in surgical area</Text>
            </View>
            <View style={styles.warningItem}>
              <View style={styles.warningDot} />
              <Text style={styles.warningText}>Unusual swelling or discomfort</Text>
            </View>
          </View>

          {onLearnMore && (
            <TouchableOpacity
              style={styles.learnMoreButton}
              onPress={() => onLearnMore(primarySurgery)}
              activeOpacity={0.7}
            >
              <Ionicons name="book-outline" size={16} color={colors.accent.primary} />
              <Text style={styles.learnMoreText}>View Recovery Guide</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.accent.primary} />
            </TouchableOpacity>
          )}

          {activeSurgeries.length > 1 && (
            <View style={styles.additionalSurgeries}>
              <Text style={styles.additionalLabel}>
                Also recovering from:
              </Text>
              {activeSurgeries.slice(1).map((surgery, index) => (
                <Text key={index} style={styles.additionalItem}>
                  {SURGERY_LABELS[surgery.type]} ({surgery.weeks_post_op ?? 0} weeks)
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.m,
    marginBottom: spacing.m,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245, 169, 184, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    gap: spacing.s,
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 169, 184, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  phaseBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  phaseBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '600',
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  expandedContent: {
    padding: spacing.m,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  phaseInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.s,
    paddingTop: spacing.m,
  },
  phaseIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(91, 206, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseLabel: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  reminderText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.s,
  },
  warningsList: {
    gap: spacing.xs,
    marginBottom: spacing.m,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  warningDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent.secondary,
  },
  warningText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: colors.text.tertiary,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    backgroundColor: 'rgba(91, 206, 250, 0.1)',
    borderRadius: borderRadius.m,
    alignSelf: 'flex-start',
  },
  learnMoreText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: colors.accent.primary,
  },
  additionalSurgeries: {
    marginTop: spacing.m,
    paddingTop: spacing.s,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  additionalLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  additionalItem: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: spacing.s,
  },
});
