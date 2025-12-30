// Feedback Quick Sheet Component
// Bottom sheet with quick preset options for fast feedback
// Opens FeedbackDetailModal for more details

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { FeedbackCategory, FeedbackContext } from '../../types/feedback';

// Quick feedback presets for the quick sheet
const QUICK_PRESETS = [
  { id: 'felt_unsafe', label: 'Felt unsafe', icon: 'warning', category: 'safety_concern' as FeedbackCategory, color: '#EF4444' },
  { id: 'triggered_dysphoria', label: 'Triggered dysphoria', icon: 'sad', category: 'dysphoria_trigger' as FeedbackCategory, color: '#A855F7' },
  { id: 'too_hard', label: 'Too hard', icon: 'trending-up', category: 'difficulty_issue' as FeedbackCategory, color: '#F59E0B' },
  { id: 'too_easy', label: 'Too easy', icon: 'trending-down', category: 'difficulty_issue' as FeedbackCategory, color: '#F59E0B' },
  { id: 'unclear', label: 'Instructions unclear', icon: 'help-circle', category: 'instruction_clarity' as FeedbackCategory, color: '#3B82F6' },
  { id: 'broken', label: 'Something broken', icon: 'bug', category: 'technical_bug' as FeedbackCategory, color: '#6B7280' },
];

interface FeedbackQuickSheetProps {
  visible: boolean;
  onClose: () => void;
  onQuickSubmit: (presetId: string, category: FeedbackCategory) => Promise<void>;
  onOpenDetail: (category?: FeedbackCategory) => void;
  context: FeedbackContext;
}

export default function FeedbackQuickSheet({
  visible,
  onClose,
  onQuickSubmit,
  onOpenDetail,
  context,
}: FeedbackQuickSheetProps) {
  const insets = useSafeAreaInsets();
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const handleQuickSubmit = async (presetId: string, category: FeedbackCategory) => {
    setSubmittingId(presetId);
    try {
      await onQuickSubmit(presetId, category);
      onClose();
    } catch (error) {
      console.error('Error submitting quick feedback:', error);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleOpenDetail = (category?: FeedbackCategory) => {
    onClose();
    onOpenDetail(category);
  };

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
              <Ionicons name="chatbubble-ellipses" size={20} color={colors.accent.secondary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Quick Feedback</Text>
              <Text style={styles.subtitle}>What's on your mind?</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.tertiary} />
            </Pressable>
          </View>

          {/* Quick Options Grid */}
          <View style={styles.content}>
            <View style={styles.quickGrid}>
              {QUICK_PRESETS.map((preset) => (
                <Pressable
                  key={preset.id}
                  style={styles.quickButton}
                  onPress={() => handleQuickSubmit(preset.id, preset.category)}
                  disabled={submittingId !== null}
                >
                  <View style={[styles.quickIconContainer, { backgroundColor: `${preset.color}20` }]}>
                    {submittingId === preset.id ? (
                      <ActivityIndicator size="small" color={preset.color} />
                    ) : (
                      <Ionicons name={preset.icon as any} size={24} color={preset.color} />
                    )}
                  </View>
                  <Text style={styles.quickLabel}>{preset.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* More Details Link */}
            <Pressable
              style={styles.detailButton}
              onPress={() => handleOpenDetail()}
              disabled={submittingId !== null}
            >
              <LinearGradient
                colors={[colors.glass.bgLight, colors.glass.bg]}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="create-outline" size={18} color={colors.text.secondary} />
              <Text style={styles.detailButtonText}>Add more details</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
            </Pressable>
          </View>
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
    padding: spacing.xl,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
    marginBottom: spacing.xl,
  },
  quickButton: {
    width: '30%',
    alignItems: 'center',
    gap: spacing.s,
  },
  quickIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    paddingVertical: spacing.m,
    borderRadius: borderRadius.l,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  detailButtonText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
});
