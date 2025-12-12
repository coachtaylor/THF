/**
 * Edit Profile Modal
 *
 * Full-screen modal for editing profile information (pronouns, gender identity)
 */
import React, { useState, useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { textStyles, glassStyles } from '../../theme/components';
import { Profile } from '../../types';
import { updateProfile } from '../../services/storage/profile';
import SelectionCard from '../onboarding/SelectionCard';

type GenderIdentity = 'mtf' | 'ftm' | 'nonbinary' | 'questioning';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  profile: Profile | null;
  onSave: () => void;
}

const GENDER_OPTIONS = [
  {
    id: 'mtf' as GenderIdentity,
    icon: 'sparkles' as keyof typeof Ionicons.glyphMap,
    title: 'Transfeminine',
    description: 'Trans woman, transfem, or MTF',
  },
  {
    id: 'ftm' as GenderIdentity,
    icon: 'flash' as keyof typeof Ionicons.glyphMap,
    title: 'Transmasculine',
    description: 'Trans man, transmasc, or FTM',
  },
  {
    id: 'nonbinary' as GenderIdentity,
    icon: 'infinite' as keyof typeof Ionicons.glyphMap,
    title: 'Non-binary',
    description: 'Genderqueer, genderfluid, or agender',
  },
  {
    id: 'questioning' as GenderIdentity,
    icon: 'help-circle' as keyof typeof Ionicons.glyphMap,
    title: 'Questioning',
    description: 'Exploring my gender identity',
  },
];

export default function EditProfileModal({
  visible,
  onClose,
  profile,
  onSave,
}: EditProfileModalProps) {
  const insets = useSafeAreaInsets();
  const [pronouns, setPronouns] = useState(profile?.pronouns || '');
  const [genderIdentity, setGenderIdentity] = useState<GenderIdentity | null>(
    profile?.gender_identity || null
  );
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible && profile) {
      setPronouns(profile.pronouns || '');
      setGenderIdentity(profile.gender_identity || null);
    }
  }, [visible, profile]);

  const handleSave = async () => {
    if (!genderIdentity) return;

    try {
      setIsSaving(true);
      await updateProfile({
        pronouns: pronouns.trim() || undefined,
        gender_identity: genderIdentity,
      });
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = genderIdentity !== null;

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
          <Text style={styles.headerTitle}>Edit Profile</Text>
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
          {/* Pronouns */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pronouns</Text>
            <TextInput
              value={pronouns}
              onChangeText={setPronouns}
              placeholder="e.g., she/her, he/him, they/them"
              placeholderTextColor={colors.text.tertiary}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Gender Identity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gender Identity</Text>
            <Text style={styles.sectionSubtitle}>
              This helps us personalize your workout recommendations
            </Text>
            <View style={styles.optionsContainer}>
              {GENDER_OPTIONS.map((option) => (
                <SelectionCard
                  key={option.id}
                  icon={option.icon}
                  title={option.title}
                  description={option.description}
                  selected={genderIdentity === option.id}
                  onClick={() => setGenderIdentity(option.id)}
                />
              ))}
            </View>
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
  sectionSubtitle: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  input: {
    height: 56,
    borderRadius: borderRadius.base,
    backgroundColor: colors.glass.bg,
    borderWidth: 2,
    borderColor: colors.glass.border,
    paddingHorizontal: spacing.base,
    color: colors.text.primary,
    fontSize: 16,
  },
  optionsContainer: {
    gap: spacing.m,
  },
});
