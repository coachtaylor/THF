// src/components/session/CompletionScreen.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import { CompletedSet } from '../../types/session';
import { palette, spacing, typography } from '../../theme';

interface CompletionScreenProps {
  completedSets: CompletedSet[];
  startedAt: string;
  completedAt: string;
  exerciseCount: number;
  onSaveSession: () => void;
  onShareProgress?: () => void;
  onBackToPlan: () => void;
}

const ENCOURAGEMENT_MESSAGES = [
  "Amazing work! You crushed it! 💪",
  "You're building strength every day! 🌟",
  "Incredible effort! Keep it up! 🔥",
  "You showed up and gave it your all! ✨",
  "Every rep counts - you did great! 🎯",
  "Your consistency is inspiring! 🌈",
];

const CompletionScreen: React.FC<CompletionScreenProps> = ({
  completedSets,
  startedAt,
  completedAt,
  exerciseCount,
  onSaveSession,
  onShareProgress,
  onBackToPlan,
}) => {
  const insets = useSafeAreaInsets();

  // Calculate session stats
  const stats = useMemo(() => {
    const startTime = new Date(startedAt);
    const endTime = new Date(completedAt);
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60);
    
    const totalSets = completedSets.length;
    
    // Calculate average RPE
    const totalRPE = completedSets.reduce((sum, set) => sum + set.rpe, 0);
    const avgRPE = totalSets > 0 ? (totalRPE / totalSets).toFixed(1) : '0.0';
    
    // Get unique exercise count
    const uniqueExercises = new Set(completedSets.map(set => set.exerciseId)).size;
    
    return {
      durationMinutes,
      exerciseCount: uniqueExercises || exerciseCount,
      totalSets,
      avgRPE: parseFloat(avgRPE),
    };
  }, [completedSets, startedAt, completedAt, exerciseCount]);

  // Get random encouragement message
  const encouragementMessage = useMemo(() => {
    return ENCOURAGEMENT_MESSAGES[
      Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)
    ];
  }, []);

  const handleShareProgress = async () => {
    if (onShareProgress) {
      onShareProgress();
      return;
    }

    // Default share behavior - create a text summary
    try {
      const shareText = `Just completed my workout! 💪\n\n` +
        `Duration: ${stats.durationMinutes} minutes\n` +
        `Exercises: ${stats.exerciseCount}\n` +
        `Sets: ${stats.totalSets}\n` +
        `Average RPE: ${stats.avgRPE}/10\n\n` +
        `${encouragementMessage}`;

      if (await Sharing.isAvailableAsync()) {
        // Note: Sharing.shareAsync requires a file URI, not text
        // For text sharing, we'd need to use a different approach
        // This is a placeholder - actual implementation would need
        // to create a shareable image or use a different sharing method
        console.log('Share text:', shareText);
      }
    } catch (error) {
      console.error('Failed to share progress:', error);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: Math.max(insets.top, spacing.l) },
      ]}
    >
      {/* Celebration Header */}
      <View style={styles.header}>
        <Text style={styles.celebrationEmoji}>🎉</Text>
        <Text style={styles.celebrationTitle}>Workout Complete!</Text>
        <Text style={styles.encouragementText}>{encouragementMessage}</Text>
      </View>

      {/* Session Stats */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Text style={styles.statsTitle}>Session Stats</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatTime(stats.durationMinutes)}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.exerciseCount}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalSets}</Text>
              <Text style={styles.statLabel}>Sets</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.avgRPE}</Text>
              <Text style={styles.statLabel}>Avg RPE</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={onSaveSession}
          style={styles.actionButton}
          buttonColor={palette.tealPrimary}
          textColor={palette.deepBlack}
          contentStyle={styles.buttonContent}
        >
          Save Session
        </Button>

        <Button
          mode="outlined"
          onPress={handleShareProgress}
          style={[styles.actionButton, { borderColor: palette.tealPrimary }]}
          textColor={palette.tealPrimary}
          contentStyle={styles.buttonContent}
        >
          Share Progress
        </Button>

        <Button
          mode="text"
          onPress={onBackToPlan}
          style={styles.actionButton}
          textColor={palette.midGray}
          contentStyle={styles.buttonContent}
        >
          Back to Plan
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.deepBlack,
  },
  contentContainer: {
    padding: spacing.l,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.xl,
  },
  celebrationEmoji: {
    fontSize: 80,
    marginBottom: spacing.m,
  },
  celebrationTitle: {
    ...typography.h1,
    color: palette.tealPrimary,
    fontWeight: 'bold',
    marginBottom: spacing.m,
    textAlign: 'center',
  },
  encouragementText: {
    ...typography.bodyLarge,
    color: palette.lightGray,
    textAlign: 'center',
    paddingHorizontal: spacing.l,
  },
  statsCard: {
    backgroundColor: palette.darkCard,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: spacing.xl,
  },
  statsTitle: {
    ...typography.h3,
    color: palette.white,
    marginBottom: spacing.m,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: spacing.m,
  },
  statItem: {
    alignItems: 'center',
    minWidth: '40%',
    padding: spacing.m,
  },
  statValue: {
    ...typography.h2,
    color: palette.tealPrimary,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.bodySmall,
    color: palette.midGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actions: {
    gap: spacing.m,
    marginTop: spacing.l,
  },
  actionButton: {
    marginBottom: spacing.s,
  },
  buttonContent: {
    paddingVertical: spacing.s,
  },
});

export default CompletionScreen;

