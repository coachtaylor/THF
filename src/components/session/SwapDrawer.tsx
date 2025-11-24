// src/components/session/SwapDrawer.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Button, Portal, Card, Divider } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swap } from '../../types/plan';
import { Exercise } from '../../types';
import { palette, spacing, typography } from '../../theme';
import { fetchAllExercises } from '../../services/exerciseService';

interface SwapDrawerProps {
  visible: boolean;
  onDismiss: () => void;
  exercise: Exercise;
  onSwapSelect: (swapExerciseId: string) => void;
  onViewFAQ?: () => void;
}

interface SwapOption {
  exercise_id: string;
  exerciseId?: string; // For backward compatibility
  rationale: string;
  exerciseName?: string;
  exerciseDetails?: Exercise;
}

const SwapDrawer: React.FC<SwapDrawerProps> = ({
  visible,
  onDismiss,
  exercise,
  onSwapSelect,
  onViewFAQ,
}) => {
  const [swaps, setSwaps] = useState<SwapOption[]>([]);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible && exercise?.swaps) {
      loadSwapDetails();
    }
  }, [visible, exercise]);

  const loadSwapDetails = async () => {
    if (!exercise?.swaps || exercise.swaps.length === 0) {
      setSwaps([]);
      return;
    }

    setLoading(true);
    try {
      // Fetch all exercises to get swap details
      const allExercises = await fetchAllExercises();
      
      const swapOptions: SwapOption[] = exercise.swaps
        .filter(swap => swap.exercise_id != null || swap.exerciseId != null) // Filter out undefined
        .map((swap): SwapOption | null => {
          const exerciseId = swap.exercise_id || swap.exerciseId;
          if (!exerciseId) {
            return null;
          }
          // Find the swap exercise details
          const swapExercise = allExercises.find(
            (ex) => ex.id === String(exerciseId) || ex.id === exerciseId.toString()
          );
          
          return {
            exercise_id: String(exerciseId),
            rationale: swap.rationale,
            exerciseName: swapExercise?.name || 'Unknown Exercise',
            exerciseDetails: swapExercise,
          };
        })
        .filter((swap): swap is SwapOption => swap !== null && swap.exercise_id != null);

      setSwaps(swapOptions);
    } catch (error) {
      console.error('Failed to load swap details:', error);
      // Fallback to swaps without details
      setSwaps(
        exercise.swaps
          .filter(swap => swap.exercise_id != null || swap.exerciseId != null)
          .map((swap): SwapOption => ({
            exercise_id: String(swap.exercise_id || swap.exerciseId || ''),
            rationale: swap.rationale,
            exerciseName: 'Loading...',
          }))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSwapSelect = (swapExerciseId: string) => {
    onSwapSelect(swapExerciseId);
    onDismiss();
  };

  const handleViewFAQ = () => {
    if (onViewFAQ) {
      onViewFAQ();
    } else {
      // Default behavior - could navigate to FAQ screen
      console.log('Navigate to FAQ page (v2.2)');
    }
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        transparent
        animationType="slide"
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={onDismiss}
          />
          <View
            style={[
              styles.drawer,
              { paddingBottom: Math.max(insets.bottom, spacing.m) },
            ]}
          >
            {/* Handle bar */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Swap Exercise</Text>
              <Text style={styles.subtitle}>
                Alternatives for {exercise.name}
              </Text>
            </View>

            <Divider style={styles.divider} />

            {/* Swap Options */}
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading swap options...</Text>
                </View>
              ) : swaps.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No swap options available for this exercise.
                  </Text>
                </View>
              ) : (
                swaps.map((swap, index) => (
                  <Card
                    key={swap.exercise_id || index}
                    style={styles.swapCard}
                    onPress={() => handleSwapSelect(swap.exercise_id)}
                  >
                    <Card.Content>
                      <View style={styles.swapHeader}>
                        <Text style={styles.swapExerciseName}>
                          {swap.exerciseName || 'Unknown Exercise'}
                        </Text>
                        {swap.exerciseDetails && (
                          <View style={styles.exerciseBadges}>
                            {swap.exerciseDetails.difficulty && (
                              <View
                                style={[
                                  styles.badge,
                                  styles.difficultyBadge,
                                ]}
                              >
                                <Text style={styles.badgeText}>
                                  {swap.exerciseDetails.difficulty}
                                </Text>
                              </View>
                            )}
                            {swap.exerciseDetails?.equipment &&
                              swap.exerciseDetails.equipment.length > 0 && (
                                <View style={[styles.badge, styles.equipmentBadge]}>
                                  <Text style={styles.badgeText}>
                                    {swap.exerciseDetails.equipment[0]}
                                  </Text>
                                </View>
                              )}
                          </View>
                        )}
                      </View>

                      <Text style={styles.swapRationale}>{swap.rationale}</Text>

                      <Button
                        mode="contained"
                        onPress={() => handleSwapSelect(swap.exercise_id)}
                        style={styles.selectButton}
                        buttonColor={palette.tealPrimary}
                        textColor={palette.deepBlack}
                      >
                        Select This Swap
                      </Button>
                    </Card.Content>
                  </Card>
                ))
              )}
            </ScrollView>

            {/* Footer with FAQ link */}
            <View style={styles.footer}>
              <Button
                mode="text"
                onPress={handleViewFAQ}
                textColor={palette.tealPrimary}
                style={styles.faqButton}
              >
                Learn more about swaps (FAQ)
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    backgroundColor: palette.darkCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: spacing.m,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: palette.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.m,
  },
  header: {
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.m,
  },
  title: {
    ...typography.h3,
    color: palette.white,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: palette.midGray,
  },
  divider: {
    backgroundColor: palette.border,
    marginVertical: spacing.m,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.m,
    gap: spacing.m,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.bodyMedium,
    color: palette.midGray,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodyMedium,
    color: palette.midGray,
    textAlign: 'center',
  },
  swapCard: {
    backgroundColor: palette.darkerCard,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: spacing.m,
  },
  swapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.s,
  },
  swapExerciseName: {
    ...typography.h4,
    color: palette.white,
    flex: 1,
    marginRight: spacing.s,
  },
  exerciseBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexShrink: 0,
  },
  badge: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  difficultyBadge: {
    backgroundColor: palette.tealPrimary + '30',
  },
  equipmentBadge: {
    backgroundColor: palette.border,
  },
  badgeText: {
    ...typography.caption,
    color: palette.white,
    fontSize: 11,
  },
  swapRationale: {
    ...typography.body,
    color: palette.lightGray,
    marginBottom: spacing.m,
    lineHeight: 20,
  },
  selectButton: {
    marginTop: spacing.s,
  },
  footer: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  faqButton: {
    marginVertical: spacing.s,
  },
});

export default SwapDrawer;

