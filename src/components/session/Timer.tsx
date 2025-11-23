import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, IconButton } from 'react-native-paper';

import { TimerFormat, TimerState } from '../../types/session';
import { palette, spacing, typography } from '../../theme';

interface TimerProps {
  format: TimerFormat;
  totalSets: number;
  initialSet?: number;
  initialElapsedSeconds?: number;
  completedSets?: number[];
  onSetComplete?: (setNumber: number, elapsedSeconds: number) => void;
  onWorkoutComplete?: () => void;
  onAdvanceToNextSet?: (nextSet: number) => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const getFormatInstructions = (format: TimerFormat) => {
  switch (format) {
    case 'EMOM':
      return 'EMOM: Complete the prescribed work every 60 seconds. The timer switches sets automatically.';
    case 'AMRAP':
      return 'AMRAP: Accumulate as many reps as possible until you decide to stop.';
    case 'straight_sets':
    default:
      return 'Straight Sets: Finish the required reps for each set, then tap Complete Set to advance.';
  }
};

const Timer: React.FC<TimerProps> = ({
  format,
  totalSets,
  initialSet = 1,
  initialElapsedSeconds = 0,
  completedSets = [],
  onSetComplete,
  onWorkoutComplete,
  onAdvanceToNextSet,
}) => {
  const [timerState, setTimerState] = useState<TimerState>({
    format,
    currentSet: initialSet,
    totalSets,
    elapsedSeconds: initialElapsedSeconds,
    isRunning: false,
    isPaused: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTimerState((prev) => ({
      ...prev,
      format,
      totalSets,
      currentSet: initialSet,
      elapsedSeconds: initialElapsedSeconds,
    }));
  }, [format, totalSets, initialSet, initialElapsedSeconds]);

  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused) {
      intervalRef.current = setInterval(() => {
        setTimerState((prev) => ({
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1,
        }));
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerState.isRunning, timerState.isPaused]);

  const handleAdvanceSet = useCallback(
    (skipped: boolean) => {
      setTimerState((prev) => {
        const completedSetNumber = prev.currentSet;
        const completedElapsedSeconds = prev.elapsedSeconds;

        // Stop the timer - parent will determine next set
        const newState = {
          ...prev,
          elapsedSeconds: 0,
          isRunning: false,
          isPaused: false,
        };

        // Call onSetComplete after state update, but capture values from prev state
        if (!skipped && completedSetNumber > 0) {
          // Use setTimeout to ensure state update happens after this callback
          setTimeout(() => {
            onSetComplete?.(completedSetNumber, completedElapsedSeconds);
          }, 0);
        }

        return newState;
      });
    },
    [onSetComplete],
  );

  useEffect(() => {
    // EMOM: Auto-advance every 60 seconds, but don't auto-start next set
    // The timer will stop after advancing, requiring user to click start again
    // Only trigger when elapsedSeconds is exactly 60, 120, 180, etc. (not at 0)
    if (
      format === 'EMOM' &&
      timerState.isRunning &&
      !timerState.isPaused &&
      timerState.elapsedSeconds > 0 &&
      timerState.elapsedSeconds % 60 === 0 &&
      timerState.currentSet > 0
    ) {
      handleAdvanceSet(false);
    }
  }, [
    format,
    handleAdvanceSet,
    timerState.elapsedSeconds,
    timerState.isPaused,
    timerState.isRunning,
    timerState.currentSet,
  ]);

  const startTimer = () => {
    setTimerState((prev) => ({
      ...prev,
      // Don't reset currentSet - start from current set
      elapsedSeconds: 0,
      isRunning: true,
      isPaused: false,
    }));
  };

  const continueTimer = () => {
    setTimerState((prev) => ({
      ...prev,
      // Continue from current elapsed time
      isRunning: true,
      isPaused: false,
    }));
  };

  const restartTimer = () => {
    setTimerState((prev) => ({
      ...prev,
      // Restart from 0
      elapsedSeconds: 0,
      isRunning: true,
      isPaused: false,
    }));
  };

  const pauseTimer = () => {
    setTimerState((prev) => ({
      ...prev,
      isPaused: true,
    }));
  };

  const resumeTimer = () => {
    setTimerState((prev) => ({
      ...prev,
      isPaused: false,
      isRunning: true,
    }));
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimerState((prev) => ({
      ...prev,
      isRunning: false,
      isPaused: false,
    }));
  };

  const resetTimer = () => {
    stopTimer();
    setTimerState((prev) => ({
      ...prev,
      currentSet: 1,
      elapsedSeconds: 0,
    }));
  };

  const formattedElapsed = useMemo(
    () => formatTime(timerState.elapsedSeconds),
    [timerState.elapsedSeconds],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.instructions}>{getFormatInstructions(format)}</Text>

      <View style={styles.timerCard}>
        <Text style={styles.timerText}>{formattedElapsed}</Text>
        <Text style={styles.setCounter}>
          Set {timerState.currentSet} of {timerState.totalSets}
        </Text>
      </View>

      <View style={styles.controls}>
        {!timerState.isRunning && timerState.elapsedSeconds === 0 && (
          <Button mode="contained" onPress={startTimer}>
            Start Set {timerState.currentSet}
          </Button>
        )}
        
        {!timerState.isRunning && timerState.elapsedSeconds > 0 && (
          <>
            <Button mode="contained" onPress={restartTimer} style={styles.actionButton}>
              Restart Set {timerState.currentSet}
            </Button>
            <Button mode="outlined" onPress={continueTimer} style={styles.actionButton}>
              Continue Set {timerState.currentSet}
            </Button>
          </>
        )}

        {timerState.isRunning && !timerState.isPaused && (
          <Button mode="outlined" onPress={pauseTimer}>
            Pause
          </Button>
        )}

        {timerState.isRunning && timerState.isPaused && (
          <Button mode="contained" onPress={resumeTimer}>
            Resume
          </Button>
        )}

        {timerState.isRunning && (
          <Button
            mode="contained-tonal"
            style={styles.completeButton}
            onPress={() => handleAdvanceSet(false)}
          >
            Complete Set
          </Button>
        )}
      </View>

      <View style={styles.secondaryControls}>
        <Button
          mode="text"
          icon="skip-next"
          onPress={() => handleAdvanceSet(true)}
          disabled={!timerState.isRunning}
        >
          Skip Set
        </Button>
        <Button
          mode="text"
          icon="stop"
          onPress={stopTimer}
          disabled={!timerState.isRunning}
        >
          Stop
        </Button>
      </View>

      <View style={styles.iconRow}>
        <IconButton icon="refresh" onPress={resetTimer} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.m,
    gap: spacing.s,
  },
  instructions: {
    ...typography.bodySmall,
    color: palette.midGray,
    textAlign: 'center',
  },
  timerCard: {
    backgroundColor: palette.darkerCard,
    borderRadius: 12,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  timerText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: palette.tealPrimary,
    letterSpacing: 1,
  },
  setCounter: {
    marginTop: spacing.xs,
    ...typography.bodySmall,
    color: palette.midGray,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  completeButton: {
    minWidth: 120,
  },
  actionButton: {
    minWidth: 120,
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

export default Timer;
