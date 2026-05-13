/**
 * Edit Flagged Exercises Modal
 *
 * Lists exercises the user has pain-flagged mid-session. Each row offers a
 * "Try again" action that removes that exercise from
 * profile.flagged_exercise_ids, after which rule USR-01 will stop excluding
 * it from generated workouts.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { textStyles } from '../../theme/components';
import { Profile, Exercise } from '../../types';
import { updateProfile } from '../../services/storage/profile';
import { fetchExercisesByIds } from '../../services/exerciseService';

interface EditFlaggedExercisesModalProps {
  visible: boolean;
  onClose: () => void;
  profile: Profile | null;
  onSave: () => void;
}

export default function EditFlaggedExercisesModal({
  visible,
  onClose,
  profile,
  onSave,
}: EditFlaggedExercisesModalProps) {
  const insets = useSafeAreaInsets();
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [exercises, setExercises] = useState<Record<string, Exercise>>({});
  const [loading, setLoading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // Hydrate from profile + fetch exercise rows for name/pattern display.
  useEffect(() => {
    if (!visible) return;
    const ids = profile?.flagged_exercise_ids ?? [];
    setFlaggedIds(ids);
    setDirty(false);
    if (ids.length === 0) {
      setExercises({});
      return;
    }
    setLoading(true);
    fetchExercisesByIds(ids)
      .then((rows) => {
        const map: Record<string, Exercise> = {};
        for (const ex of rows) {
          map[String(ex.id)] = ex;
        }
        setExercises(map);
      })
      .catch((err) => {
        console.error('Failed to fetch flagged exercise rows:', err);
      })
      .finally(() => setLoading(false));
  }, [visible, profile]);

  const handleTryAgain = async (exerciseId: string) => {
    try {
      setPendingId(exerciseId);
      const next = flaggedIds.filter((id) => id !== exerciseId);
      await updateProfile({ flagged_exercise_ids: next });
      setFlaggedIds(next);
      setDirty(true);
    } catch (error) {
      console.error('Failed to remove flagged exercise:', error);
    } finally {
      setPendingId(null);
    }
  };

  const handleClose = () => {
    // Only trigger plan regeneration if the list actually changed.
    if (dirty) onSave();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pain-Flagged Exercises</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Intro card */}
          <View style={styles.introCard}>
            <Ionicons
              name="information-circle"
              size={22}
              color={colors.accent.primary}
              style={styles.introIcon}
            />
            <View style={styles.introContent}>
              <Text style={styles.introTitle}>How this list works</Text>
              <Text style={styles.introText}>
                Exercises you flagged during a workout. We leave these out of
                future plans. Tap "Try again" to bring one back into rotation.
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={colors.accent.primary} />
            </View>
          ) : flaggedIds.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons
                name="checkmark-circle-outline"
                size={36}
                color={colors.text.tertiary}
              />
              <Text style={styles.emptyTitle}>Nothing flagged</Text>
              <Text style={styles.emptyText}>
                If an exercise feels off mid-workout, flag it and we'll skip it
                next time.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {flaggedIds.map((id) => {
                const exercise = exercises[id];
                const name = exercise?.name ?? `Exercise #${id}`;
                const pattern = exercise?.pattern ?? null;
                const isPending = pendingId === id;
                return (
                  <View key={id} style={styles.row}>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>{name}</Text>
                      {pattern && (
                        <Text style={styles.rowSubtitle}>
                          {String(pattern).replace(/_/g, ' ')}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleTryAgain(id)}
                      disabled={isPending}
                      style={[
                        styles.tryAgainButton,
                        isPending && styles.tryAgainButtonDisabled,
                      ]}
                      hitSlop={4}
                    >
                      <Text style={styles.tryAgainText}>
                        {isPending ? 'Removing...' : 'Try again'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
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
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.xl,
    gap: spacing.xl,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.accent.primaryMuted,
    borderWidth: 1,
    borderColor: colors.accent.primaryGlow,
  },
  introIcon: {
    marginTop: 2,
  },
  introContent: {
    flex: 1,
  },
  introTitle: {
    ...textStyles.label,
    fontSize: 15,
    fontWeight: '600',
    color: colors.accent.primary,
    marginBottom: spacing.xs,
  },
  introText: {
    ...textStyles.bodySmall,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  centerState: {
    alignItems: 'center',
    gap: spacing.s,
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    ...textStyles.h3,
    fontSize: 16,
    color: colors.text.primary,
    marginTop: spacing.s,
  },
  emptyText: {
    ...textStyles.bodySmall,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.l,
  },
  list: {
    gap: spacing.s,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.m,
    padding: spacing.lg,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: borderRadius.base,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...textStyles.label,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  rowSubtitle: {
    ...textStyles.bodySmall,
    fontSize: 13,
    color: colors.text.tertiary,
    textTransform: 'capitalize',
  },
  tryAgainButton: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.accent.primary,
  },
  tryAgainButtonDisabled: {
    opacity: 0.5,
  },
  tryAgainText: {
    ...textStyles.label,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});
