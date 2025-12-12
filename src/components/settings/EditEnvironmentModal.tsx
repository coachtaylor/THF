/**
 * Edit Environment Modal
 *
 * Full-screen modal for editing training environment
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { textStyles } from '../../theme/components';
import { Profile, TrainingEnvironment } from '../../types';
import { updateProfile } from '../../services/storage/profile';
import SelectionCard from '../onboarding/SelectionCard';

interface EditEnvironmentModalProps {
  visible: boolean;
  onClose: () => void;
  profile: Profile | null;
  onSave: () => void;
}

interface EnvironmentOption {
  id: TrainingEnvironment;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const ENVIRONMENT_OPTIONS: EnvironmentOption[] = [
  {
    id: 'home',
    icon: 'home-outline',
    title: 'Home',
    description: 'Training at home with limited or no gym equipment',
  },
  {
    id: 'gym',
    icon: 'barbell-outline',
    title: 'Commercial Gym',
    description: 'Full access to machines, free weights, and equipment',
  },
  {
    id: 'studio',
    icon: 'fitness-outline',
    title: 'Small Studio',
    description: 'Community gym or studio with basic equipment',
  },
  {
    id: 'outdoors',
    icon: 'sunny-outline',
    title: 'Outdoors / Mixed',
    description: 'Parks, outdoor spaces, or varying locations',
  },
];

export default function EditEnvironmentModal({
  visible,
  onClose,
  profile,
  onSave,
}: EditEnvironmentModalProps) {
  const insets = useSafeAreaInsets();
  const [environment, setEnvironment] = useState<TrainingEnvironment | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible && profile) {
      setEnvironment(profile.training_environment || null);
    }
  }, [visible, profile]);

  const handleSave = async () => {
    if (!environment) return;

    try {
      setIsSaving(true);
      await updateProfile({
        training_environment: environment,
      });
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving environment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = environment !== null;

  const getEnvironmentInfo = (env: TrainingEnvironment): string => {
    switch (env) {
      case 'home':
        return "We'll focus on bodyweight and minimal equipment exercises. Perfect if gyms feel uncomfortable or inaccessible.";
      case 'gym':
        return "We'll include a full range of equipment options. You can always skip exercises if specific machines aren't available.";
      case 'studio':
        return "We'll focus on common studio equipment like dumbbells, kettlebells, and basic machines.";
      case 'outdoors':
        return "We'll prioritize portable and bodyweight exercises that work anywhere.";
    }
  };

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
          <Text style={styles.headerTitle}>Edit Environment</Text>
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Primary Training Environment</Text>
            <Text style={styles.sectionSubtitle}>
              Select where you'll do most of your workouts. Your equipment options
              will be filtered based on this selection.
            </Text>
            <View style={styles.optionsContainer}>
              {ENVIRONMENT_OPTIONS.map((option) => (
                <SelectionCard
                  key={option.id}
                  icon={option.icon}
                  title={option.title}
                  description={option.description}
                  selected={environment === option.id}
                  onClick={() => setEnvironment(option.id)}
                />
              ))}
            </View>
          </View>

          {environment && (
            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={colors.cyan[500]}
              />
              <Text style={styles.infoText}>{getEnvironmentInfo(environment)}</Text>
            </View>
          )}

          {environment && profile?.training_environment !== environment && (
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.warning} />
              <Text style={styles.warningText}>
                Changing your environment may affect your available equipment options.
                You may need to update your equipment in Training Preferences after saving.
              </Text>
            </View>
          )}
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
  section: {
    gap: spacing.m,
  },
  sectionTitle: {
    ...textStyles.h3,
    fontSize: 18,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    ...textStyles.bodySmall,
    fontSize: 14,
    color: colors.text.secondary,
  },
  optionsContainer: {
    gap: spacing.m,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.base,
    backgroundColor: colors.glass.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
  },
  infoText: {
    ...textStyles.bodySmall,
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.base,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  warningText: {
    ...textStyles.bodySmall,
    fontSize: 14,
    color: colors.warning,
    flex: 1,
    lineHeight: 20,
  },
});
