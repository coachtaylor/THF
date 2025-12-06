// src/components/session/SwapDrawer.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform, Pressable } from 'react-native';
import { Portal } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Exercise } from '../../types';
import { palette, spacing, colors } from '../../theme';
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
  exerciseId?: string;
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
  const [showFAQInfo, setShowFAQInfo] = useState(false);
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
      const allExercises = await fetchAllExercises();

      const swapOptions: SwapOption[] = exercise.swaps
        .filter(swap => swap.exercise_id != null || swap.exerciseId != null)
        .map((swap): SwapOption | null => {
          const exerciseId = swap.exercise_id || swap.exerciseId;
          if (!exerciseId) {
            return null;
          }
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
      onDismiss();
    } else {
      setShowFAQInfo(prev => !prev);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onRequestClose={onDismiss}
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
            {/* Glass background */}
            <LinearGradient
              colors={['rgba(30, 30, 35, 0.98)', 'rgba(20, 20, 25, 0.99)']}
              style={StyleSheet.absoluteFill}
            />

            {/* Cyan glow overlay */}
            <LinearGradient
              colors={['rgba(91, 206, 250, 0.12)', 'rgba(91, 206, 250, 0.04)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.4 }}
              style={styles.glowOverlay}
            />

            {/* Glass highlight at top */}
            <View style={styles.glassHighlight} />

            {/* Handle bar */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Swap Exercise</Text>
              <Text style={styles.subtitle}>
                Alternatives for {exercise.name}
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* FAQ Info Section */}
            {showFAQInfo && (
              <View style={styles.faqInfo}>
                <LinearGradient
                  colors={['rgba(91, 206, 250, 0.15)', 'rgba(91, 206, 250, 0.05)']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.faqTitle}>About Exercise Swaps</Text>
                <Text style={styles.faqText}>
                  Swaps are alternative exercises that target similar muscle groups with comparable movement patterns.
                </Text>
                <Text style={styles.faqText}>
                  Use swaps when:{'\n'}
                  • Equipment isn't available{'\n'}
                  • You need a modification for comfort{'\n'}
                  • You want variety in your routine{'\n'}
                  • An exercise causes discomfort
                </Text>
                <Text style={styles.faqText}>
                  Your swap choice will be tracked and saved with your session data.
                </Text>
              </View>
            )}

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
                  <Pressable
                    key={swap.exercise_id || index}
                    style={({ pressed }) => [
                      styles.swapCard,
                      pressed && styles.swapCardPressed,
                    ]}
                    onPress={() => handleSwapSelect(swap.exercise_id)}
                  >
                    {/* Card glass background */}
                    <LinearGradient
                      colors={['rgba(25, 25, 30, 0.8)', 'rgba(18, 18, 22, 0.9)']}
                      style={StyleSheet.absoluteFill}
                    />

                    {/* Card glass highlight */}
                    <View style={styles.cardGlassHighlight} />

                    <View style={styles.swapCardContent}>
                      <View style={styles.swapHeader}>
                        <Text style={styles.swapExerciseName}>
                          {swap.exerciseName || 'Unknown Exercise'}
                        </Text>
                        {swap.exerciseDetails && (
                          <View style={styles.exerciseBadges}>
                            {swap.exerciseDetails.difficulty && (
                              <View style={[styles.badge, styles.difficultyBadge]}>
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

                      {/* Glass button */}
                      <View style={styles.selectButton}>
                        <LinearGradient
                          colors={[colors.accent.primary, colors.accent.primaryDark]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={StyleSheet.absoluteFill}
                        />
                        <Text style={styles.selectButtonText}>Select This Swap</Text>
                      </View>
                    </View>
                  </Pressable>
                ))
              )}
            </ScrollView>

            {/* Footer with FAQ link */}
            <View style={styles.footer}>
              <Pressable
                style={({ pressed }) => [
                  styles.faqButton,
                  pressed && styles.faqButtonPressed,
                ]}
                onPress={handleViewFAQ}
              >
                <Text style={styles.faqButtonText}>
                  {showFAQInfo ? 'Hide info' : 'Learn more about swaps'}
                </Text>
                <Ionicons
                  name={showFAQInfo ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.accent.primary}
                />
              </Pressable>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  drawer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: spacing.m,
    overflow: 'hidden',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
      },
      android: { elevation: 16 },
    }),
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 1,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.m,
  },
  header: {
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.m,
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginHorizontal: spacing.l,
    marginBottom: spacing.m,
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
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.tertiary,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  swapCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  swapCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  cardGlassHighlight: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  swapCardContent: {
    padding: spacing.l,
  },
  swapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.s,
  },
  swapExerciseName: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
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
    backgroundColor: 'rgba(91, 206, 250, 0.2)',
  },
  equipmentBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  badgeText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.primary,
  },
  swapRationale: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
    marginBottom: spacing.m,
    lineHeight: 20,
  },
  selectButton: {
    borderRadius: 12,
    overflow: 'hidden',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButtonText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  footer: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  faqButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.m,
  },
  faqButtonPressed: {
    opacity: 0.7,
  },
  faqButtonText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.accent.primary,
  },
  faqInfo: {
    marginHorizontal: spacing.l,
    marginBottom: spacing.m,
    padding: spacing.m,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(91, 206, 250, 0.2)',
  },
  faqTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '500',
    color: colors.accent.primary,
    marginBottom: spacing.s,
  },
  faqText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
    marginBottom: spacing.s,
    lineHeight: 20,
  },
});

export default SwapDrawer;
