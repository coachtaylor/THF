// Feedback FAB (Floating Action Button) Component
// Self-contained floating button for quick feedback access
// Positioned bottom-right, above tab bar

import React, { useState } from 'react';
import {
  StyleSheet,
  Pressable,
  View,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme/theme';
import { FeedbackCategory, FeedbackContext, FeedbackSeverity } from '../../types/feedback';
import { saveFeedbackReport } from '../../services/feedback/feedbackReport';
import { useProfile } from '../../hooks/useProfile';
import FeedbackQuickSheet from './FeedbackQuickSheet';
import FeedbackDetailModal from './FeedbackDetailModal';

interface FeedbackFABProps {
  // Context for where feedback originated
  context?: FeedbackContext;
  // Position adjustments
  bottomOffset?: number; // Extra offset from bottom (e.g., for tab bar)
  rightOffset?: number;
  // Appearance
  size?: 'small' | 'medium';
}

export default function FeedbackFAB({
  context = 'general',
  bottomOffset = 80, // Default offset for tab bar
  rightOffset = spacing.l,
  size = 'medium',
}: FeedbackFABProps) {
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const [showSheet, setShowSheet] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailCategory, setDetailCategory] = useState<FeedbackCategory | undefined>();

  const buttonSize = size === 'small' ? 44 : 52;
  const iconSize = size === 'small' ? 18 : 22;

  const handlePress = () => {
    setShowSheet(true);
  };

  const handleQuickSubmit = async (presetId: string, category: FeedbackCategory) => {
    if (!profile?.userId) {
      console.warn('Cannot submit feedback: no user ID');
      return;
    }

    await saveFeedbackReport(
      {
        category,
        context,
        quick_feedback: [presetId],
      },
      profile.userId
    );
  };

  const handleOpenDetail = (category?: FeedbackCategory) => {
    setDetailCategory(category);
    setShowDetailModal(true);
  };

  const handleDetailSubmit = async (data: {
    category: FeedbackCategory;
    severity?: FeedbackSeverity;
    quickFeedback: string[];
    description?: string;
  }) => {
    if (!profile?.userId) {
      console.warn('Cannot submit feedback: no user ID');
      return;
    }

    await saveFeedbackReport(
      {
        category: data.category,
        context,
        severity: data.severity,
        quick_feedback: data.quickFeedback,
        description: data.description,
      },
      profile.userId
    );

    setShowDetailModal(false);
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.container,
          {
            width: buttonSize,
            height: buttonSize,
            bottom: insets.bottom + bottomOffset,
            right: rightOffset,
            opacity: pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
        onPress={handlePress}
      >
        <LinearGradient
          colors={[colors.glass.bgLight, colors.glass.bg]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.iconContainer}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={iconSize}
            color={colors.accent.primary}
          />
        </View>
      </Pressable>

      {/* Feedback Quick Sheet */}
      <FeedbackQuickSheet
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        onQuickSubmit={handleQuickSubmit}
        onOpenDetail={handleOpenDetail}
        context={context}
      />

      {/* Feedback Detail Modal */}
      <FeedbackDetailModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onSubmit={handleDetailSubmit}
        initialCategory={detailCategory}
        context={context}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
