/**
 * Edit Training Modal
 *
 * Full-screen modal for editing training preferences (experience, frequency, duration, equipment)
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { textStyles, inputStyles } from '../../theme/components';
import { Profile, TrainingEnvironment } from '../../types';
import { updateProfile, logEquipmentRequest } from '../../services/storage/profile';
import SelectionCard from '../onboarding/SelectionCard';

type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

interface EditTrainingModalProps {
  visible: boolean;
  onClose: () => void;
  profile: Profile | null;
  onSave: () => void;
}

const DURATION_OPTIONS = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min' },
];

interface EquipmentOption {
  id: string;
  label: string;
  environments: TrainingEnvironment[];
}

const ALL_EQUIPMENT_OPTIONS: EquipmentOption[] = [
  { id: 'bodyweight', label: 'Bodyweight', environments: ['home', 'gym', 'studio', 'outdoors'] },
  { id: 'dumbbells', label: 'Dumbbells', environments: ['home', 'gym', 'studio'] },
  { id: 'bands', label: 'Resistance Bands', environments: ['home', 'gym', 'studio', 'outdoors'] },
  { id: 'kettlebells', label: 'Kettlebell', environments: ['home', 'gym', 'studio'] },
  { id: 'barbells', label: 'Barbell', environments: ['gym', 'studio'] },
  { id: 'cables', label: 'Cable Machine', environments: ['gym'] },
  { id: 'machines', label: 'Weight Machines', environments: ['gym'] },
  { id: 'pull_up_bar', label: 'Pull-up Bar', environments: ['home', 'gym', 'studio', 'outdoors'] },
  { id: 'bench', label: 'Bench', environments: ['home', 'gym', 'studio'] },
  { id: 'other', label: 'Other Equipment', environments: ['home', 'gym', 'studio', 'outdoors'] },
];

const experienceOptions = [
  {
    id: 'beginner' as ExperienceLevel,
    icon: 'trophy-outline' as keyof typeof Ionicons.glyphMap,
    title: 'Beginner',
    description: 'New to fitness or returning after a long break',
  },
  {
    id: 'intermediate' as ExperienceLevel,
    icon: 'barbell-outline' as keyof typeof Ionicons.glyphMap,
    title: 'Intermediate',
    description: 'Comfortable with basic exercises, 6+ months experience',
  },
  {
    id: 'advanced' as ExperienceLevel,
    icon: 'trophy' as keyof typeof Ionicons.glyphMap,
    title: 'Advanced',
    description: 'Experienced lifter with 2+ years of consistent training',
  },
];

function getEquipmentForEnvironment(env?: TrainingEnvironment): EquipmentOption[] {
  if (!env) return ALL_EQUIPMENT_OPTIONS;
  return ALL_EQUIPMENT_OPTIONS.filter((opt) => opt.environments.includes(env));
}

export default function EditTrainingModal({
  visible,
  onClose,
  profile,
  onSave,
}: EditTrainingModalProps) {
  const insets = useSafeAreaInsets();
  const [experience, setExperience] = useState<ExperienceLevel | null>(null);
  const [frequency, setFrequency] = useState<number>(3);
  const [duration, setDuration] = useState<number>(45);
  const [equipment, setEquipment] = useState<Set<string>>(new Set());
  const [otherEquipmentText, setOtherEquipmentText] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const trainingEnvironment = profile?.training_environment;

  const availableEquipment = useMemo(
    () => getEquipmentForEnvironment(trainingEnvironment),
    [trainingEnvironment]
  );

  // Reset state when modal opens
  useEffect(() => {
    if (visible && profile) {
      setExperience(profile.fitness_experience || null);
      setFrequency(profile.workout_frequency || 3);
      setDuration(profile.session_duration || 45);
      setEquipment(new Set(profile.equipment || []));
      setOtherEquipmentText(profile.other_equipment_text || '');
    }
  }, [visible, profile]);

  const toggleEquipment = (id: string) => {
    const newEquipment = new Set(equipment);
    if (newEquipment.has(id)) {
      newEquipment.delete(id);
    } else {
      newEquipment.add(id);
    }
    setEquipment(newEquipment);
  };

  const handleSave = async () => {
    if (!experience || equipment.size === 0) return;

    try {
      setIsSaving(true);
      const hasOther = equipment.has('other');
      const trimmedOtherText = otherEquipmentText.trim();

      await updateProfile({
        fitness_experience: experience,
        workout_frequency: frequency,
        session_duration: duration,
        equipment: Array.from(equipment),
        other_equipment_text: hasOther && trimmedOtherText ? trimmedOtherText : undefined,
      });

      // Log equipment request for analytics
      if (hasOther && trimmedOtherText) {
        logEquipmentRequest(trimmedOtherText).catch(console.warn);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving training preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = experience !== null && equipment.size > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Training</Text>
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
          keyboardShouldPersistTaps="handled"
        >
          {/* Experience Level */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience Level</Text>
            <View style={styles.experienceContainer}>
              {experienceOptions.map((option) => (
                <SelectionCard
                  key={option.id}
                  icon={option.icon}
                  title={option.title}
                  description={option.description}
                  selected={experience === option.id}
                  onClick={() => setExperience(option.id)}
                />
              ))}
            </View>
          </View>

          {/* Workout Frequency */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout Frequency</Text>
            <Text style={styles.label}>DAYS PER WEEK</Text>

            <View style={styles.frequencyContainer}>
              <TouchableOpacity
                onPress={() => setFrequency(Math.max(1, frequency - 1))}
                disabled={frequency <= 1}
                activeOpacity={0.7}
                style={[
                  styles.frequencyButton,
                  frequency <= 1 && styles.frequencyButtonDisabled,
                ]}
              >
                <Ionicons
                  name="remove"
                  size={24}
                  color={frequency <= 1 ? colors.text.tertiary : colors.cyan[500]}
                />
              </TouchableOpacity>

              <View style={styles.frequencyDisplay}>
                <Text style={styles.frequencyText}>{frequency}</Text>
              </View>

              <TouchableOpacity
                onPress={() => setFrequency(Math.min(7, frequency + 1))}
                disabled={frequency >= 7}
                activeOpacity={0.7}
                style={[
                  styles.frequencyButton,
                  frequency >= 7 && styles.frequencyButtonDisabled,
                ]}
              >
                <Ionicons
                  name="add"
                  size={24}
                  color={frequency >= 7 ? colors.text.tertiary : colors.cyan[500]}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Session Duration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Session Duration</Text>
            <View style={styles.durationGrid}>
              {DURATION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setDuration(option.value)}
                  activeOpacity={0.7}
                  style={[
                    styles.durationButton,
                    duration === option.value && styles.durationButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      duration === option.value && styles.durationButtonTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Equipment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Equipment</Text>
            {trainingEnvironment && (
              <View style={styles.environmentNote}>
                <Ionicons name="location-outline" size={16} color={colors.cyan[500]} />
                <Text style={styles.environmentNoteText}>
                  Showing equipment for {trainingEnvironment} workouts
                </Text>
              </View>
            )}
            <Text style={styles.equipmentSubtitle}>
              Select all that apply (at least 1 required)
            </Text>
            <View style={styles.equipmentGrid}>
              {availableEquipment.map((option) => {
                const isSelected = equipment.has(option.id);
                return (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => toggleEquipment(option.id)}
                    activeOpacity={0.7}
                    style={[
                      styles.equipmentButton,
                      isSelected && styles.equipmentButtonSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.equipmentCheckbox,
                        isSelected && styles.equipmentCheckboxSelected,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={18} color={colors.text.primary} />
                      )}
                    </View>
                    <Text style={styles.equipmentLabel} numberOfLines={1}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Other Equipment Text Input */}
            {equipment.has('other') && (
              <View style={styles.otherEquipmentContainer}>
                <Text style={styles.inputLabel}>
                  What equipment do you have? <Text style={styles.optionalText}>(Optional)</Text>
                </Text>
                <TextInput
                  value={otherEquipmentText}
                  onChangeText={setOtherEquipmentText}
                  placeholder="e.g., suspension trainer, medicine ball, foam roller..."
                  placeholderTextColor={colors.text.tertiary}
                  multiline
                  numberOfLines={2}
                  maxLength={200}
                  style={styles.otherEquipmentInput}
                />
              </View>
            )}

            {equipment.size === 0 && (
              <Text style={styles.equipmentError}>
                Please select at least one equipment option
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  label: {
    ...textStyles.label,
    fontSize: 14,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  experienceContainer: {
    gap: spacing.m,
  },
  frequencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  frequencyButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequencyButtonDisabled: {
    opacity: 0.4,
  },
  frequencyDisplay: {
    flex: 1,
    height: 60,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequencyText: {
    ...textStyles.statMedium,
    fontSize: 36,
    color: colors.cyan[500],
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  durationButton: {
    flex: 1,
    minWidth: '45%',
    height: 56,
    borderRadius: borderRadius.base,
    backgroundColor: colors.glass.bg,
    borderWidth: 2,
    borderColor: colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationButtonSelected: {
    backgroundColor: colors.glass.bgHero,
    borderColor: colors.cyan[500],
  },
  durationButtonText: {
    ...textStyles.label,
    fontSize: 16,
    color: colors.text.primary,
  },
  durationButtonTextSelected: {
    color: colors.cyan[500],
  },
  environmentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  environmentNoteText: {
    ...textStyles.bodySmall,
    fontSize: 13,
    color: colors.cyan[500],
  },
  equipmentSubtitle: {
    ...textStyles.bodySmall,
    fontSize: 14,
    color: colors.text.secondary,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  equipmentButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: borderRadius.base,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  equipmentButtonSelected: {
    backgroundColor: colors.glass.bgHero,
    borderWidth: 2,
    borderColor: colors.cyan[500],
  },
  equipmentCheckbox: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.glass.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipmentCheckboxSelected: {
    backgroundColor: colors.cyan[500],
    borderColor: colors.cyan[500],
  },
  equipmentLabel: {
    ...textStyles.body,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    color: colors.text.primary,
  },
  equipmentError: {
    ...textStyles.bodySmall,
    fontSize: 13,
    color: colors.semantic.warning,
  },
  otherEquipmentContainer: {
    marginTop: spacing.m,
    gap: spacing.sm,
  },
  inputLabel: {
    ...textStyles.label,
    fontSize: 14,
    color: colors.text.primary,
  },
  optionalText: {
    color: colors.text.tertiary,
  },
  otherEquipmentInput: {
    ...inputStyles.textInput,
    height: 80,
    paddingTop: spacing.base,
    textAlignVertical: 'top',
  },
});
