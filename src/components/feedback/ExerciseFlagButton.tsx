// Exercise Flag Button Component
// Compact button for flagging exercise-specific issues during session
// Opens ExerciseFlagSheet when tapped

import React, { useState } from 'react';
import { StyleSheet, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, typography } from '../../theme';
import ExerciseFlagSheet from './ExerciseFlagSheet';
import { ExerciseFlagType, FlaggedExercise } from '../../types/feedback';

interface ExerciseFlagButtonProps {
  exerciseId: string;
  exerciseName: string;
  setNumber?: number;
  onFlag: (flag: FlaggedExercise) => void;
  disabled?: boolean;
  isFlagged?: boolean;
  compact?: boolean;
}

export default function ExerciseFlagButton({
  exerciseId,
  exerciseName,
  setNumber,
  onFlag,
  disabled = false,
  isFlagged = false,
  compact = false,
}: ExerciseFlagButtonProps) {
  const [showSheet, setShowSheet] = useState(false);

  const handlePress = () => {
    if (!disabled) {
      setShowSheet(true);
    }
  };

  const handleFlagSelect = (flagType: ExerciseFlagType, notes?: string) => {
    const flag: FlaggedExercise = {
      exercise_id: exerciseId,
      exercise_name: exerciseName,
      flag_type: flagType,
      set_number: setNumber,
      notes,
      timestamp: new Date().toISOString(),
    };
    onFlag(flag);
    setShowSheet(false);
  };

  if (compact) {
    return (
      <>
        <Pressable
          style={[
            styles.compactButton,
            isFlagged && styles.compactButtonFlagged,
            disabled && styles.buttonDisabled,
          ]}
          onPress={handlePress}
          disabled={disabled}
          hitSlop={8}
        >
          <Ionicons
            name={isFlagged ? 'flag' : 'flag-outline'}
            size={18}
            color={isFlagged ? palette.warning : palette.midGray}
          />
        </Pressable>

        <ExerciseFlagSheet
          visible={showSheet}
          onClose={() => setShowSheet(false)}
          onFlagSelect={handleFlagSelect}
          exerciseName={exerciseName}
        />
      </>
    );
  }

  return (
    <>
      <Pressable
        style={[
          styles.button,
          isFlagged && styles.buttonFlagged,
          disabled && styles.buttonDisabled,
        ]}
        onPress={handlePress}
        disabled={disabled}
      >
        <Ionicons
          name={isFlagged ? 'flag' : 'flag-outline'}
          size={16}
          color={isFlagged ? palette.warning : palette.midGray}
        />
        <Text style={[styles.buttonText, isFlagged && styles.buttonTextFlagged]}>
          {isFlagged ? 'Flagged' : 'Something felt off?'}
        </Text>
      </Pressable>

      <ExerciseFlagSheet
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        onFlagSelect={handleFlagSelect}
        exerciseName={exerciseName}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: palette.border,
  },
  buttonFlagged: {
    backgroundColor: `${palette.warning}15`,
    borderColor: palette.warning,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...typography.bodySmall,
    color: palette.midGray,
    fontWeight: '500',
  },
  buttonTextFlagged: {
    color: palette.warning,
  },
  compactButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: palette.darkerCard,
    borderWidth: 1,
    borderColor: palette.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactButtonFlagged: {
    backgroundColor: `${palette.warning}15`,
    borderColor: palette.warning,
  },
});
