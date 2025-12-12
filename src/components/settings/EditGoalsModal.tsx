/**
 * Edit Goals Modal
 *
 * Full-screen modal for editing fitness goals
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { textStyles, glassStyles } from '../../theme/components';
import { Profile } from '../../types';
import { updateProfile } from '../../services/storage/profile';

type Goal = 'feminization' | 'masculinization' | 'general_fitness' | 'strength' | 'endurance';

interface EditGoalsModalProps {
  visible: boolean;
  onClose: () => void;
  profile: Profile | null;
  onSave: () => void;
}

interface GoalCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  selected: 'primary' | 'secondary' | null;
  onPress: () => void;
}

function GoalCard({ icon, title, description, selected, onPress }: GoalCardProps) {
  const borderColor =
    selected === 'primary'
      ? colors.cyan[500]
      : selected === 'secondary'
      ? colors.red[500]
      : colors.glass.border;

  const backgroundColor =
    selected === 'primary'
      ? colors.glass.bgHero
      : selected === 'secondary'
      ? 'rgba(244, 63, 94, 0.08)'
      : colors.glass.bg;

  const iconColor =
    selected === 'primary'
      ? colors.cyan[500]
      : selected === 'secondary'
      ? colors.red[500]
      : colors.text.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.goalCard,
        {
          backgroundColor,
          borderColor,
          borderWidth: selected ? 2 : 1,
        },
      ]}
    >
      {selected && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: selected === 'primary' ? colors.cyan[500] : colors.red[500],
            },
          ]}
        >
          <Text style={styles.badgeText}>
            {selected === 'primary' ? 'PRIMARY' : 'SECONDARY'}
          </Text>
        </View>
      )}

      <View style={styles.iconContainer}>
        <Ionicons
          name={icon}
          size={28}
          color={iconColor}
          style={{ opacity: selected ? 1 : 0.7 }}
        />
      </View>

      <Text style={styles.goalTitle}>{title}</Text>
      <Text style={styles.goalDescription}>{description}</Text>
    </TouchableOpacity>
  );
}

const goalInfo: Record<Goal, { description: string }> = {
  feminization: {
    description: 'Build a curvier, more feminine physique',
  },
  masculinization: {
    description: 'Develop a broader, more masculine build',
  },
  general_fitness: {
    description: 'Overall health, energy, and well-being',
  },
  strength: {
    description: 'Build maximum strength and power',
  },
  endurance: {
    description: 'Improve cardiovascular and muscular endurance',
  },
};

export default function EditGoalsModal({
  visible,
  onClose,
  profile,
  onSave,
}: EditGoalsModalProps) {
  const insets = useSafeAreaInsets();
  const [primaryGoal, setPrimaryGoal] = useState<Goal | null>(null);
  const [secondaryGoal, setSecondaryGoal] = useState<Goal | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible && profile) {
      setPrimaryGoal(profile.primary_goal || null);
      setSecondaryGoal(
        profile.secondary_goals && profile.secondary_goals.length > 0
          ? (profile.secondary_goals[0] as Goal)
          : null
      );
    }
  }, [visible, profile]);

  const getAvailableGoals = () => {
    const genderIdentity = profile?.gender_identity || 'nonbinary';
    const baseGoals: Array<{ id: Goal; icon: keyof typeof Ionicons.glyphMap; title: string }> = [
      { id: 'general_fitness', icon: 'heart-outline', title: 'General Fitness' },
      { id: 'strength', icon: 'flash', title: 'Strength' },
      { id: 'endurance', icon: 'trending-up', title: 'Endurance' },
    ];

    if (
      genderIdentity === 'mtf' ||
      genderIdentity === 'nonbinary' ||
      genderIdentity === 'questioning'
    ) {
      baseGoals.unshift({ id: 'feminization', icon: 'sparkles', title: 'Feminization' });
    }

    if (
      genderIdentity === 'ftm' ||
      genderIdentity === 'nonbinary' ||
      genderIdentity === 'questioning'
    ) {
      baseGoals.unshift({ id: 'masculinization', icon: 'pulse-outline', title: 'Masculinization' });
    }

    return baseGoals;
  };

  const handleGoalPress = (goalId: Goal) => {
    if (primaryGoal === goalId) {
      setPrimaryGoal(secondaryGoal);
      setSecondaryGoal(null);
    } else if (secondaryGoal === goalId) {
      setSecondaryGoal(null);
    } else if (!primaryGoal) {
      setPrimaryGoal(goalId);
    } else if (!secondaryGoal) {
      setSecondaryGoal(goalId);
    } else {
      setSecondaryGoal(goalId);
    }
  };

  const getGoalSelection = (goalId: Goal): 'primary' | 'secondary' | null => {
    if (primaryGoal === goalId) return 'primary';
    if (secondaryGoal === goalId) return 'secondary';
    return null;
  };

  const handleSave = async () => {
    if (!primaryGoal) return;

    try {
      setIsSaving(true);
      const secondaryGoals = secondaryGoal ? [secondaryGoal] : undefined;
      await updateProfile({
        primary_goal: primaryGoal,
        secondary_goals: secondaryGoals,
      });
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving goals:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const availableGoals = getAvailableGoals();
  const canSave = primaryGoal !== null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Goals</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSave || isSaving}
            hitSlop={8}
          >
            <Text
              style={[
                styles.saveButton,
                (!canSave || isSaving) && styles.saveButtonDisabled,
              ]}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.instructions}>
            Tap to select your primary goal. Tap again to add a secondary focus.
          </Text>

          <View style={styles.goalsContainer}>
            {availableGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                icon={goal.icon}
                title={goal.title}
                description={goalInfo[goal.id].description}
                selected={getGoalSelection(goal.id)}
                onPress={() => handleGoalPress(goal.id)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerTitle: {
    ...textStyles.h3,
    fontSize: 18,
    color: colors.text.primary,
  },
  saveButton: {
    ...textStyles.body,
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent.primary,
  },
  saveButtonDisabled: {
    color: colors.text.tertiary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.xl,
    gap: spacing.xl,
  },
  instructions: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  goalsContainer: {
    gap: spacing.m,
  },
  goalCard: {
    ...glassStyles.card,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  badge: {
    position: 'absolute',
    top: spacing.m,
    right: spacing.m,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    ...textStyles.caption,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.text.primary,
    textTransform: 'uppercase',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.base,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.m,
  },
  goalTitle: {
    ...textStyles.h3,
    fontSize: 18,
    marginBottom: spacing.xs,
    color: colors.text.primary,
  },
  goalDescription: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
});
