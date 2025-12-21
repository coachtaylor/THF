/**
 * Edit Binding Modal
 *
 * Full-screen modal for editing binding information
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { textStyles, cardStyles } from '../../theme/components';
import { Profile } from '../../types';
import { updateProfile } from '../../services/storage/profile';
import SelectionCard from '../onboarding/SelectionCard';

type BindingFrequency = 'daily' | 'sometimes' | 'rarely' | 'never';
type BinderType = 'commercial' | 'sports_bra' | 'ace_bandage' | 'diy' | 'other';

interface EditBindingModalProps {
  visible: boolean;
  onClose: () => void;
  profile: Profile | null;
  onSave: () => void;
}

const BINDER_TYPE_OPTIONS = [
  { value: '' as const, label: 'Select type (optional)' },
  { value: 'commercial' as BinderType, label: 'Commercial binder (gc2b, Underworks, etc.)' },
  { value: 'sports_bra' as BinderType, label: 'Sports bra' },
  { value: 'other' as BinderType, label: 'Other' },
];

const frequencyOptions = [
  {
    id: 'daily' as BindingFrequency,
    icon: 'time' as keyof typeof Ionicons.glyphMap,
    title: 'Daily',
    description: 'I bind most days of the week',
  },
  {
    id: 'sometimes' as BindingFrequency,
    icon: 'time' as keyof typeof Ionicons.glyphMap,
    title: 'Sometimes',
    description: 'A few times per week',
  },
  {
    id: 'rarely' as BindingFrequency,
    icon: 'time' as keyof typeof Ionicons.glyphMap,
    title: 'Rarely',
    description: 'Occasionally or for special occasions',
  },
  {
    id: 'never' as BindingFrequency,
    icon: 'shield-checkmark' as keyof typeof Ionicons.glyphMap,
    title: 'Never',
    description: "I don't currently bind",
  },
];

export default function EditBindingModal({
  visible,
  onClose,
  profile,
  onSave,
}: EditBindingModalProps) {
  const insets = useSafeAreaInsets();
  const [bindsChest, setBindsChest] = useState<boolean | null>(null);
  const [frequency, setFrequency] = useState<BindingFrequency | null>(null);
  const [durationHours, setDurationHours] = useState<number>(6);
  const [binderType, setBinderType] = useState<string>('');
  const [showBinderTypePicker, setShowBinderTypePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible && profile) {
      setBindsChest(profile.binds_chest ?? null);
      setFrequency(profile.binding_frequency ?? null);
      setDurationHours(profile.binding_duration_hours ?? 6);
      setBinderType(profile.binder_type ?? '');
    }
  }, [visible, profile]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const bindingData: {
        binds_chest: boolean;
        binding_frequency?: BindingFrequency;
        binding_duration_hours?: number;
        binder_type?: BinderType;
      } = {
        binds_chest: bindsChest === true,
      };

      if (bindsChest === true && frequency) {
        bindingData.binding_frequency = frequency;
        if (frequency !== 'never') {
          bindingData.binding_duration_hours = durationHours;
        }
        if (binderType && binderType !== '') {
          bindingData.binder_type = binderType as BinderType;
        }
      }

      await updateProfile(bindingData);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving binding data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = bindsChest === false || (bindsChest === true && frequency !== null);
  const showWarning = durationHours > 8;

  const selectedBinderTypeLabel =
    BINDER_TYPE_OPTIONS.find((opt) => opt.value === binderType)?.label ||
    'Select type (optional)';

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
          <Text style={styles.headerTitle}>Edit Binding</Text>
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
          {/* Yes/No Question */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Do you bind your chest?</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={() => {
                  setBindsChest(true);
                  if (!frequency) {
                    setFrequency('sometimes');
                  }
                }}
                activeOpacity={0.7}
                style={[
                  styles.toggleButton,
                  bindsChest === true && styles.toggleButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    bindsChest === true && styles.toggleButtonTextSelected,
                  ]}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setBindsChest(false);
                  setFrequency(null);
                }}
                activeOpacity={0.7}
                style={[
                  styles.toggleButton,
                  bindsChest === false && styles.toggleButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    bindsChest === false && styles.toggleButtonTextSelected,
                  ]}
                >
                  No
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Binding Details */}
          {bindsChest === true && (
            <>
              {/* Frequency Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>How often do you bind?</Text>
                <View style={styles.frequencyContainer}>
                  {frequencyOptions.map((option) => (
                    <SelectionCard
                      key={option.id}
                      icon={option.icon}
                      title={option.title}
                      description={option.description}
                      selected={frequency === option.id}
                      onClick={() => setFrequency(option.id)}
                    />
                  ))}
                </View>
              </View>

              {/* Duration Input */}
              {frequency && frequency !== 'never' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Typical binding duration</Text>
                  <Text style={styles.label}>HOURS PER SESSION</Text>

                  <View style={styles.durationContainer}>
                    <TouchableOpacity
                      onPress={() => setDurationHours(Math.max(1, durationHours - 1))}
                      activeOpacity={0.7}
                      style={styles.durationButton}
                    >
                      <Ionicons name="remove" size={24} color={colors.cyan[500]} />
                    </TouchableOpacity>

                    <View style={styles.durationDisplay}>
                      <Text style={styles.durationText}>{durationHours}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => setDurationHours(Math.min(12, durationHours + 1))}
                      activeOpacity={0.7}
                      style={styles.durationButton}
                    >
                      <Ionicons name="add" size={24} color={colors.cyan[500]} />
                    </TouchableOpacity>
                  </View>

                  {showWarning && (
                    <View style={cardStyles.warning}>
                      <Ionicons
                        name="warning"
                        size={20}
                        color={colors.semantic.warning}
                        style={styles.warningIcon}
                      />
                      <Text style={styles.warningText}>
                        Binding for more than 8 hours isn't recommended. We'll
                        prioritize binding-safe exercises.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Binder Type */}
              {frequency && frequency !== 'never' && (
                <View style={styles.section}>
                  <Text style={styles.label}>
                    Binder Type <Text style={styles.optionalText}>(Optional)</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowBinderTypePicker(true)}
                    activeOpacity={0.7}
                    style={styles.pickerButton}
                  >
                    <Text
                      style={[
                        styles.pickerText,
                        !binderType && styles.pickerTextPlaceholder,
                      ]}
                    >
                      {selectedBinderTypeLabel}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={colors.text.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Binder Type Picker Modal */}
        <Modal
          visible={showBinderTypePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowBinderTypePicker(false)}
        >
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContent}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Binder Type</Text>
                <TouchableOpacity
                  onPress={() => setShowBinderTypePicker(false)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerScrollView}>
                {BINDER_TYPE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value || 'empty'}
                    onPress={() => {
                      setBinderType(option.value);
                      setShowBinderTypePicker(false);
                    }}
                    activeOpacity={0.7}
                    style={[
                      styles.pickerOption,
                      binderType === option.value && styles.pickerOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        binderType === option.value && styles.pickerOptionTextSelected,
                        !option.value && styles.pickerTextPlaceholder,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {binderType === option.value && (
                      <Ionicons name="checkmark" size={20} color={colors.cyan[500]} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  optionalText: {
    color: colors.text.tertiary,
    textTransform: 'none',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  toggleButton: {
    flex: 1,
    height: 56,
    borderRadius: borderRadius.base,
    backgroundColor: colors.glass.bg,
    borderWidth: 2,
    borderColor: colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonSelected: {
    backgroundColor: colors.glass.bgHero,
    borderColor: colors.cyan[500],
  },
  toggleButtonText: {
    ...textStyles.label,
    fontSize: 16,
    color: colors.text.primary,
  },
  toggleButtonTextSelected: {
    color: colors.cyan[500],
  },
  frequencyContainer: {
    gap: spacing.md,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  durationButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationDisplay: {
    flex: 1,
    height: 60,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationText: {
    ...textStyles.statMedium,
    fontSize: 36,
    color: colors.cyan[500],
  },
  warningIcon: {
    marginTop: 2,
  },
  warningText: {
    ...textStyles.bodySmall,
    flex: 1,
    color: colors.semantic.warning,
  },
  pickerButton: {
    height: 56,
    borderRadius: borderRadius.base,
    backgroundColor: colors.glass.bg,
    borderWidth: 2,
    borderColor: colors.glass.border,
    paddingHorizontal: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    ...textStyles.label,
    fontSize: 16,
    color: colors.text.primary,
    flex: 1,
  },
  pickerTextPlaceholder: {
    color: colors.text.tertiary,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  pickerContent: {
    backgroundColor: colors.bg.raised,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  pickerTitle: {
    ...textStyles.h3,
    fontSize: 20,
    color: colors.text.primary,
  },
  pickerScrollView: {
    maxHeight: 400,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  pickerOptionSelected: {
    backgroundColor: colors.glass.bgHero,
  },
  pickerOptionText: {
    ...textStyles.body,
    flex: 1,
    color: colors.text.primary,
  },
  pickerOptionTextSelected: {
    color: colors.cyan[500],
  },
});
