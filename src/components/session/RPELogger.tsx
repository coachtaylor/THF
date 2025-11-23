// src/components/session/RPELogger.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { CompletedSet } from '../../types/session';
import { palette, spacing, typography } from '../../theme';

interface RPELoggerProps {
  exerciseId: string;
  setNumber: number;
  onRPESubmit: (rpe: number) => void;
  rpeHistory?: CompletedSet[];
  initialRPE?: number;
}

const RPE_LABELS: Record<number, string> = {
  1: 'Very Easy',
  2: 'Easy',
  3: 'Moderate',
  4: 'Somewhat Hard',
  5: 'Hard',
  6: 'Very Hard',
  7: 'Extremely Hard',
  8: 'Maximum Effort',
  9: 'Near Maximum',
  10: 'Absolute Maximum',
};

const RPE_DESCRIPTIONS: Record<number, string> = {
  1: 'No effort, could do many more',
  2: 'Very light effort, easy to continue',
  3: 'Light effort, comfortable pace',
  4: 'Moderate effort, starting to feel it',
  5: 'Hard effort, challenging but manageable',
  6: 'Very hard, significant effort required',
  7: 'Extremely hard, very difficult to complete',
  8: 'Maximum effort, can barely complete',
  9: 'Near maximum, almost impossible',
  10: 'Absolute maximum, cannot do more',
};

const RPELogger: React.FC<RPELoggerProps> = ({
  exerciseId,
  setNumber,
  onRPESubmit,
  rpeHistory = [],
  initialRPE,
}) => {
  const [rpe, setRPE] = useState<number>(initialRPE || 5);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (initialRPE !== undefined) {
      setRPE(initialRPE);
      setSubmitted(true);
    } else {
      setSubmitted(false);
    }
  }, [initialRPE, setNumber]);

  const handleRPEChange = (value: number) => {
    setRPE(value);
    setSubmitted(false);
  };

  const handleSubmit = () => {
    onRPESubmit(rpe);
    setSubmitted(true);
  };

  // Filter history for this specific exercise
  const exerciseHistory = rpeHistory.filter(
    (set) => set.exerciseId === exerciseId && set.setNumber !== setNumber,
  );

  // Calculate average RPE for this exercise
  const averageRPE =
    exerciseHistory.length > 0
      ? exerciseHistory.reduce((sum, set) => sum + set.rpe, 0) / exerciseHistory.length
      : null;

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Rate Your Effort (RPE)</Text>
          <Text style={styles.subtitle}>Set {setNumber}</Text>

          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text style={styles.rpeValue}>{rpe}</Text>
              <Text style={styles.rpeLabel}>{RPE_LABELS[rpe]}</Text>
            </View>

            <View style={styles.rpeButtonsContainer}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.rpeButton,
                    rpe === value && styles.rpeButtonSelected,
                  ]}
                  onPress={() => handleRPEChange(value)}
                >
                  <Text
                    style={[
                      styles.rpeButtonText,
                      rpe === value && styles.rpeButtonTextSelected,
                    ]}
                  >
                    {value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.scaleLabels}>
              <Text style={styles.scaleLabel}>Easy</Text>
              <Text style={styles.scaleLabel}>Moderate</Text>
              <Text style={styles.scaleLabel}>Hard</Text>
            </View>

            <Text style={styles.description}>{RPE_DESCRIPTIONS[rpe]}</Text>
          </View>

          {!submitted && (
            <View style={styles.submitContainer}>
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
                buttonColor={palette.tealPrimary}
                textColor={palette.deepBlack}
              >
                Save RPE
              </Button>
            </View>
          )}

          {submitted && (
            <View style={styles.submittedContainer}>
              <Text style={styles.submittedText}>✓ RPE {rpe} saved for Set {setNumber}</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {exerciseHistory.length > 0 && (
        <Card style={styles.historyCard}>
          <Card.Content>
            <Text style={styles.historyTitle}>RPE History</Text>
            {averageRPE !== null && (
              <Text style={styles.averageRPE}>
                Average RPE: {averageRPE.toFixed(1)}
              </Text>
            )}
            <ScrollView style={styles.historyList}>
              {exerciseHistory
                .sort((a, b) => b.setNumber - a.setNumber)
                .map((set, index) => (
                  <View key={index} style={styles.historyItem}>
                    <Text style={styles.historySet}>Set {set.setNumber}</Text>
                    <Text style={styles.historyRPE}>RPE {set.rpe}</Text>
                    <Text style={styles.historyDate}>
                      {new Date(set.completedAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
            </ScrollView>
          </Card.Content>
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.m,
    gap: spacing.m,
  },
  card: {
    backgroundColor: palette.darkCard,
    borderWidth: 1,
    borderColor: palette.border,
  },
  title: {
    ...typography.h3,
    color: palette.white,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: palette.midGray,
    marginBottom: spacing.m,
  },
  sliderContainer: {
    marginVertical: spacing.m,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.m,
  },
  rpeValue: {
    ...typography.h2,
    color: palette.tealPrimary,
    fontWeight: 'bold',
  },
  rpeLabel: {
    ...typography.bodyLarge,
    color: palette.lightGray,
    flex: 1,
    marginLeft: spacing.m,
  },
  rpeButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginVertical: spacing.m,
  },
  rpeButton: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: palette.darkerCard,
    borderWidth: 2,
    borderColor: palette.border,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
    minHeight: 50,
  },
  rpeButtonSelected: {
    backgroundColor: palette.tealPrimary,
    borderColor: palette.tealPrimary,
  },
  rpeButtonText: {
    ...typography.bodyLarge,
    color: palette.lightGray,
    fontWeight: '600',
  },
  rpeButtonTextSelected: {
    color: palette.deepBlack,
    fontWeight: '700',
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.s,
    paddingHorizontal: spacing.xs,
  },
  scaleLabel: {
    ...typography.bodySmall,
    color: palette.midGray,
  },
  description: {
    ...typography.bodySmall,
    color: palette.lightGray,
    marginTop: spacing.m,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  submitContainer: {
    marginTop: spacing.m,
    alignItems: 'center',
  },
  submitButton: {
    minWidth: 150,
  },
  submittedContainer: {
    marginTop: spacing.m,
    padding: spacing.s,
    backgroundColor: palette.tealPrimary + '20',
    borderRadius: 8,
    alignItems: 'center',
  },
  submittedText: {
    ...typography.bodyMedium,
    color: palette.tealPrimary,
  },
  historyCard: {
    backgroundColor: palette.darkCard,
    borderWidth: 1,
    borderColor: palette.border,
  },
  historyTitle: {
    ...typography.h4,
    color: palette.white,
    marginBottom: spacing.s,
  },
  averageRPE: {
    ...typography.bodyMedium,
    color: palette.tealPrimary,
    marginBottom: spacing.m,
    fontWeight: '600',
  },
  historyList: {
    maxHeight: 200,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  historySet: {
    ...typography.bodyMedium,
    color: palette.lightGray,
    flex: 1,
  },
  historyRPE: {
    ...typography.bodyMedium,
    color: palette.tealPrimary,
    fontWeight: '600',
    marginHorizontal: spacing.m,
  },
  historyDate: {
    ...typography.bodySmall,
    color: palette.midGray,
  },
});

export default RPELogger;

