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
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { textStyles } from '../../theme/components';
import { Profile, TrainingEnvironment } from '../../types';
import { updateProfile } from '../../services/storage/profile';
import SelectionCard from '../onboarding/SelectionCard';

const DAYS_OF_WEEK = [
  { id: 0, short: 'S', full: 'Sun' },
  { id: 1, short: 'M', full: 'Mon' },
  { id: 2, short: 'T', full: 'Tue' },
  { id: 3, short: 'W', full: 'Wed' },
  { id: 4, short: 'T', full: 'Thu' },
  { id: 5, short: 'F', full: 'Fri' },
  { id: 6, short: 'S', full: 'Sat' },
];

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
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // The cap on weekly workout days — set by the user in EditTrainingModal
  // (which is also where subscription-tier enforcement lives). Don't
  // duplicate tier logic here; just respect whatever frequency the profile
  // already has.
  const cap = profile?.workout_frequency || 3;

  // Reset state when modal opens
  useEffect(() => {
    if (visible && profile) {
      setEnvironment(profile.training_environment || null);
      setSelectedDays(new Set(profile.preferred_workout_days || []));
    }
  }, [visible, profile]);

  const toggleDay = (dayId: number) => {
    const next = new Set(selectedDays);
    if (next.has(dayId)) {
      next.delete(dayId);
    } else if (next.size < cap) {
      next.add(dayId);
    }
    setSelectedDays(next);
  };

  const handleSave = async () => {
    if (!environment || selectedDays.size === 0) return;

    try {
      setIsSaving(true);
      const daysArray = Array.from(selectedDays).sort((a, b) => a - b);
      // Clear first_week_substitute_days when the user explicitly resets
      // their schedule — substitutes are tied to a specific week's preferred
      // days and stop making sense once those change.
      await updateProfile({
        training_environment: environment,
        preferred_workout_days: daysArray,
        first_week_substitute_days: [],
      });
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving environment & schedule:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = environment !== null && selectedDays.size === cap;
  const remainingToSelect = cap - selectedDays.size;

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
          <Text style={styles.headerTitle}>Edit Environment & Schedule</Text>
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

          {/* Workout Days */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout Days</Text>
            <Text style={styles.sectionSubtitle}>
              Pick {cap} day{cap !== 1 ? 's' : ''} for your weekly workouts. To
              change how many days, update Workout Frequency in Training
              Preferences.
            </Text>

            <Text style={styles.daysCountLabel}>
              {selectedDays.size}/{cap} days selected
            </Text>

            <View style={styles.daysContainer}>
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = selectedDays.has(day.id);
                const atCap = !isSelected && selectedDays.size >= cap;
                return (
                  <Pressable
                    key={day.id}
                    onPress={() => toggleDay(day.id)}
                    disabled={atCap}
                    style={({ pressed }) => [
                      styles.dayButton,
                      isSelected && styles.dayButtonSelected,
                      atCap && styles.dayButtonDisabled,
                      pressed && !atCap && { opacity: 0.8 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayLetter,
                        isSelected && styles.dayLetterSelected,
                        atCap && styles.dayLetterDisabled,
                      ]}
                    >
                      {day.short}
                    </Text>
                    <Text
                      style={[
                        styles.dayLabel,
                        isSelected && styles.dayLabelSelected,
                        atCap && styles.dayLabelDisabled,
                      ]}
                    >
                      {day.full}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {remainingToSelect > 0 && (
              <View style={styles.validationMessage}>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={colors.text.tertiary}
                />
                <Text style={styles.validationText}>
                  Select {remainingToSelect} more day
                  {remainingToSelect !== 1 ? 's' : ''} to continue
                </Text>
              </View>
            )}

            <View style={styles.infoBox}>
              <Ionicons
                name="refresh-outline"
                size={20}
                color={colors.cyan[500]}
              />
              <Text style={styles.infoText}>
                Saving will clear any one-time substitute day for the current
                week. Regenerate your plan after saving to apply the new
                schedule.
              </Text>
            </View>
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
  daysCountLabel: {
    ...textStyles.h3,
    fontSize: 14,
    textAlign: 'center',
    color: colors.text.secondary,
    marginTop: spacing.s,
    marginBottom: spacing.s,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  dayButton: {
    flex: 1,
    aspectRatio: 0.7,
    maxWidth: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glass.bg,
    borderWidth: 2,
    borderColor: colors.glass.border,
  },
  dayButtonSelected: {
    backgroundColor: colors.glass.bgHero,
    borderColor: colors.cyan[500],
  },
  dayButtonDisabled: {
    opacity: 0.4,
  },
  dayLetter: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  dayLetterSelected: {
    color: colors.cyan[500],
  },
  dayLetterDisabled: {
    color: colors.text.disabled,
  },
  dayLabel: {
    fontSize: 10,
    color: colors.text.disabled,
    textTransform: 'uppercase',
  },
  dayLabelSelected: {
    color: colors.text.secondary,
  },
  dayLabelDisabled: {
    color: colors.text.disabled,
  },
  validationMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    paddingVertical: spacing.s,
  },
  validationText: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
});
