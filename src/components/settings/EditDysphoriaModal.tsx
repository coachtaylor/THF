/**
 * Edit Dysphoria Modal
 *
 * Full-screen modal for editing dysphoria-related preferences
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
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { textStyles, inputStyles } from '../../theme/components';
import { Profile, DysphoriaTrigger } from '../../types';
import { updateProfile } from '../../services/storage/profile';

interface EditDysphoriaModalProps {
  visible: boolean;
  onClose: () => void;
  profile: Profile | null;
  onSave: () => void;
}

const TRIGGER_MAPPING: Record<string, DysphoriaTrigger> = {
  mirrors: 'mirrors',
  public_spaces: 'crowded_spaces',
  photos: 'photos',
  changing_rooms: 'crowded_spaces',
  swimming: 'swimming',
  form_focused: 'form_focused',
};

const TRIGGER_OPTIONS = [
  {
    id: 'mirrors',
    icon: 'eye-outline' as keyof typeof Ionicons.glyphMap,
    label: 'Mirrors in Gym',
    description: 'I prefer to avoid mirror-facing exercises',
  },
  {
    id: 'public_spaces',
    icon: 'people-outline' as keyof typeof Ionicons.glyphMap,
    label: 'Crowded Spaces',
    description: "I'm more comfortable with home workouts or quiet times",
  },
  {
    id: 'photos',
    icon: 'camera-outline' as keyof typeof Ionicons.glyphMap,
    label: 'Progress Photos',
    description: "I'd rather skip photo-based tracking",
  },
  {
    id: 'changing_rooms',
    icon: 'shirt-outline' as keyof typeof Ionicons.glyphMap,
    label: 'Changing Rooms',
    description: 'I prefer workouts I can do without changing',
  },
  {
    id: 'swimming',
    icon: 'water-outline' as keyof typeof Ionicons.glyphMap,
    label: 'Swimming/Water Activities',
    description: 'I want to avoid aquatic exercises',
  },
  {
    id: 'form_focused',
    icon: 'heart-outline' as keyof typeof Ionicons.glyphMap,
    label: 'Body-Focused Movements',
    description: 'I prefer functional exercises over aesthetic ones',
  },
];

export default function EditDysphoriaModal({
  visible,
  onClose,
  profile,
  onSave,
}: EditDysphoriaModalProps) {
  const insets = useSafeAreaInsets();
  const [triggers, setTriggers] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && profile) {
      const uiTriggers = new Set<string>();
      if (profile.dysphoria_triggers && profile.dysphoria_triggers.length > 0) {
        profile.dysphoria_triggers.forEach((trigger) => {
          const uiId = Object.keys(TRIGGER_MAPPING).find(
            (key) => TRIGGER_MAPPING[key] === trigger,
          );
          if (uiId) {
            uiTriggers.add(uiId);
          }
        });
      }
      setTriggers(uiTriggers);
      setNotes(profile.dysphoria_notes ?? '');
    }
  }, [visible, profile]);

  const toggleTrigger = (id: string) => {
    const next = new Set(triggers);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setTriggers(next);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const profileTriggers: DysphoriaTrigger[] = Array.from(triggers)
        .map((uiId) => TRIGGER_MAPPING[uiId])
        .filter((t): t is DysphoriaTrigger => t !== undefined);

      await updateProfile({
        dysphoria_triggers: profileTriggers,
        dysphoria_notes: notes.trim() || undefined,
      });
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving dysphoria data:', error);
    } finally {
      setIsSaving(false);
    }
  };

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
          <Text style={styles.headerTitle}>Dysphoria Preferences</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving} hitSlop={8}>
            <Text
              style={[
                styles.saveButton,
                isSaving && styles.saveButtonDisabled,
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
          {/* Privacy Notice */}
          <View style={styles.privacyCard}>
            <Ionicons
              name="lock-closed"
              size={24}
              color={colors.accent.primary}
              style={styles.privacyIcon}
            />
            <View style={styles.privacyContent}>
              <Text style={styles.privacyTitle}>Your Privacy Matters</Text>
              <Text style={styles.privacyText}>
                This information stays on your device and is only used to
                customize your workout recommendations.
              </Text>
            </View>
          </View>

          {/* Triggers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select any that apply</Text>
            <Text style={styles.sectionSubtitle}>
              We'll adjust your program to respect these preferences
            </Text>
            <View style={styles.triggersContainer}>
              {TRIGGER_OPTIONS.map((option) => {
                const isSelected = triggers.has(option.id);
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => toggleTrigger(option.id)}
                    style={({ pressed }) => [
                      styles.triggerCard,
                      isSelected && styles.triggerCardSelected,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.triggerCheckbox,
                        isSelected && styles.triggerCheckboxSelected,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={colors.text.primary}
                        />
                      )}
                    </View>
                    <View style={styles.triggerContent}>
                      <View style={styles.triggerHeader}>
                        <Ionicons
                          name={option.icon}
                          size={20}
                          color={colors.accent.primary}
                        />
                        <Text style={styles.triggerLabel}>{option.label}</Text>
                      </View>
                      <Text style={styles.triggerDescription}>
                        {option.description}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Additional Notes */}
          <View style={styles.section}>
            <Text style={styles.inputLabel}>
              Additional Notes{' '}
              <Text style={styles.optionalText}>(Optional)</Text>
            </Text>
            <Text style={styles.inputHint}>
              Any other preferences or considerations we should know about?
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g., I prefer gender-neutral language in instructions..."
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={3}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              style={[
                styles.notesInput,
                isFocused && inputStyles.textInputFocused,
              ]}
            />
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
    gap: spacing.sm,
  },
  sectionTitle: {
    ...textStyles.h3,
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...textStyles.bodySmall,
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.base,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.accent.primaryMuted,
    borderWidth: 1,
    borderColor: colors.accent.primaryGlow,
  },
  privacyIcon: {
    marginTop: 2,
  },
  privacyContent: {
    flex: 1,
  },
  privacyTitle: {
    ...textStyles.label,
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent.primary,
    marginBottom: spacing.xs,
  },
  privacyText: {
    ...textStyles.bodySmall,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  triggersContainer: {
    gap: spacing.md,
  },
  triggerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.base,
    padding: spacing.lg,
    borderRadius: borderRadius.base,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  triggerCardSelected: {
    backgroundColor: colors.glass.bgHero,
    borderWidth: 2,
    borderColor: colors.accent.primary,
  },
  triggerCheckbox: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.glass.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  triggerCheckboxSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  triggerContent: {
    flex: 1,
  },
  triggerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  triggerLabel: {
    ...textStyles.label,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  triggerDescription: {
    ...textStyles.bodySmall,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  inputLabel: {
    ...textStyles.label,
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  optionalText: {
    color: colors.text.tertiary,
  },
  inputHint: {
    ...textStyles.bodySmall,
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  notesInput: {
    ...inputStyles.textInput,
    height: 100,
    paddingTop: spacing.base,
    textAlignVertical: 'top',
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
