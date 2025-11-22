# Week 4: Session Player - Implementation Guide

**Goal**: User can complete workouts with timer, RPE logging, swaps, and pain flags  
**Estimated Effort**: 40-45 hours  
**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete

---

## 📋 Pre-Week Checklist

Before starting Week 4, ensure you have:

- [ ] Completed Week 3 (Plan Generation)
- [ ] Plan generates correctly with 4 time variants
- [ ] Exercise library loaded (60 exercises)
- [ ] Video files prepared (60 exercise videos)
- [ ] All Week 3 tests passing

---

## 🗂️ File Structure for Week 4

```
src/
├── screens/
│   └── SessionPlayer.tsx                ← Main screen
├── components/
│   ├── session/
│   │   ├── Timer.tsx                    ← US-4.1
│   │   ├── ExerciseDisplay.tsx          ← US-4.2
│   │   ├── RPELogger.tsx                ← US-4.3
│   │   ├── SwapDrawer.tsx               ← US-4.4
│   │   ├── PainFlagButton.tsx           ← US-4.5
│   │   └── CompletionScreen.tsx         ← US-4.6
├── services/
│   ├── sessionLogger.ts                 ← Save session data
│   ├── autoRegress.ts                   ← Pain flag auto-regression
│   └── videoCache.ts                    ← Offline video caching
└── types/
    └── session.ts                       ← Session interfaces
```

---

## 📊 Database Schema for Week 4

### SQLite (Local Storage)

```sql
-- sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  plan_id TEXT,
  workout_data TEXT, -- JSON string
  started_at TEXT,
  completed_at TEXT,
  duration_minutes INTEGER,
  synced_at TEXT
);

-- Session JSON structure:
{
  "id": "session_123",
  "planId": "plan_123",
  "workoutDuration": 15,
  "exercises": [
    {
      "exerciseId": "1",
      "sets": [
        { "rpe": 7, "reps": 10, "completedAt": "2025-11-13T10:00:00Z" },
        { "rpe": 8, "reps": 10, "completedAt": "2025-11-13T10:02:00Z" }
      ],
      "swappedTo": null,
      "painFlagged": false
    }
  ],
  "startedAt": "2025-11-13T10:00:00Z",
  "completedAt": "2025-11-13T10:15:00Z",
  "durationMinutes": 15
}
```

---

## 🎯 User Story 4.1: Timer (EMOM, AMRAP, Straight Sets)

**Estimated Time**: 10 hours  
**Status**: [ ] Not Started | [ ] In Progress | [x] Complete

### Step-by-Step Implementation

#### Step 1: Define Timer Types (30 min)

**File**: `src/types/session.ts`

```typescript
export type TimerFormat = 'EMOM' | 'AMRAP' | 'straight_sets';

export interface TimerState {
  format: TimerFormat;
  currentSet: number;
  totalSets: number;
  elapsedSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
}

export interface SessionState {
  currentExerciseIndex: number;
  exercises: ExerciseInstance[];
  completedSets: CompletedSet[];
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface CompletedSet {
  exerciseId: string;
  setNumber: number;
  rpe: number;
  reps: number;
  completedAt: Date;
}
```

**AI Prompt**:
```
Create src/types/session.ts with:
- TimerFormat type ('EMOM' | 'AMRAP' | 'straight_sets')
- TimerState interface (format, currentSet, totalSets, elapsedSeconds, isRunning, isPaused)
- SessionState interface (currentExerciseIndex, exercises, completedSets, startedAt, completedAt)
- CompletedSet interface (exerciseId, setNumber, rpe, reps, completedAt)
Export all types
```

**Checklist**:
- [x] File created: `src/types/session.ts`
- [x] All types defined
- [x] No TypeScript errors

---

#### Step 2: Create Timer Component (6 hours)

**File**: `src/components/session/Timer.tsx`

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import { TimerFormat, TimerState } from '../../types/session';

interface Props {
  format: TimerFormat;
  totalSets: number;
  onSetComplete: () => void;
  onWorkoutComplete: () => void;
}

export default function Timer({ format, totalSets, onSetComplete, onWorkoutComplete }: Props) {
  const [state, setState] = useState<TimerState>({
    format,
    currentSet: 1,
    totalSets,
    elapsedSeconds: 0,
    isRunning: false,
    isPaused: false
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      intervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1
        }));

        // EMOM: Auto-advance every 60 seconds
        if (format === 'EMOM' && state.elapsedSeconds > 0 && state.elapsedSeconds % 60 === 0) {
          handleSetComplete();
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning, state.isPaused, state.elapsedSeconds]);

  const handleStart = () => {
    setState(prev => ({ ...prev, isRunning: true, isPaused: false }));
  };

  const handlePause = () => {
    setState(prev => ({ ...prev, isPaused: true }));
  };

  const handleResume = () => {
    setState(prev => ({ ...prev, isPaused: false }));
  };

  const handleSetComplete = () => {
    onSetComplete();

    if (state.currentSet >= state.totalSets) {
      // Workout complete
      onWorkoutComplete();
      setState(prev => ({ ...prev, isRunning: false }));
    } else {
      // Move to next set
      setState(prev => ({
        ...prev,
        currentSet: prev.currentSet + 1,
        elapsedSeconds: format === 'EMOM' ? 0 : prev.elapsedSeconds
      }));
    }
  };

  const handleSkip = () => {
    handleSetComplete();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Timer Display */}
      <View style={styles.timerDisplay}>
        <Text style={styles.timerText}>{formatTime(state.elapsedSeconds)}</Text>
        <Text style={styles.setCounter}>
          Set {state.currentSet} of {state.totalSets}
        </Text>
      </View>

      {/* Format-specific instructions */}
      {format === 'EMOM' && (
        <Text style={styles.instructions}>
          Every Minute On the Minute - Complete reps, rest remainder
        </Text>
      )}
      {format === 'AMRAP' && (
        <Text style={styles.instructions}>
          As Many Reps As Possible - Go until time runs out
        </Text>
      )}
      {format === 'straight_sets' && (
        <Text style={styles.instructions}>
          Complete all reps, rest 30-60 seconds between sets
        </Text>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {!state.isRunning && (
          <Button mode="contained" onPress={handleStart} style={styles.button}>
            Start
          </Button>
        )}

        {state.isRunning && !state.isPaused && (
          <>
            <Button mode="outlined" onPress={handlePause} style={styles.button}>
              Pause
            </Button>
            <Button mode="contained" onPress={handleSetComplete} style={styles.button}>
              Complete Set
            </Button>
          </>
        )}

        {state.isPaused && (
          <>
            <Button mode="contained" onPress={handleResume} style={styles.button}>
              Resume
            </Button>
            <Button mode="outlined" onPress={handleSkip} style={styles.button}>
              Skip Set
            </Button>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  setCounter: {
    fontSize: 20,
    color: '#666',
    marginTop: 8,
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
```

**AI Prompt**:
```
Create src/components/session/Timer.tsx with:
- Import React, useState, useEffect, useRef
- Import View, Text, StyleSheet
- Import Button, IconButton from react-native-paper
- Import TimerFormat, TimerState types
- Create Props interface (format, totalSets, onSetComplete, onWorkoutComplete)
- Create functional component with timer logic:
  - State: currentSet, totalSets, elapsedSeconds, isRunning, isPaused
  - useEffect with setInterval for timer (increments every second)
  - EMOM: Auto-advance every 60 seconds
  - AMRAP: Run until user stops
  - Straight sets: User manually completes each set
- Display: Large timer (MM:SS), set counter (Set X of Y)
- Controls: Start, Pause, Resume, Complete Set, Skip Set buttons
- Format-specific instructions
- Use StyleSheet for styling
```

**Checklist**:
- [x] File created: `src/components/session/Timer.tsx`
- [x] Timer increments every second
- [x] EMOM auto-advances every 60 seconds
- [x] AMRAP runs continuously
- [x] Straight sets wait for user input
- [x] Pause/Resume works correctly
- [x] Complete Set advances to next set
- [x] Skip Set skips current set
- [x] onWorkoutComplete called when all sets done
- [x] Timer display shows MM:SS format
- [x] Set counter shows "Set X of Y"

---

#### Step 3: Test Timer Component (2 hours)

**Manual Testing**:
```typescript
// Test in SessionPlayer screen
<Timer
  format="EMOM"
  totalSets={3}
  onSetComplete={() => console.log('Set complete')}
  onWorkoutComplete={() => console.log('Workout complete')}
/>
```

**Test Cases**:
- [x] EMOM: Timer auto-advances every 60 seconds
- [x] AMRAP: Timer runs continuously until stopped
- [x] Straight sets: Timer waits for "Complete Set" button
- [x] Pause button pauses timer
- [x] Resume button resumes timer
- [x] Skip button skips current set
- [x] onSetComplete called after each set
- [x] onWorkoutComplete called after all sets
- [x] Timer resets correctly between sets (EMOM only)
- [x] Timer display shows correct time (MM:SS)

**Note**: Test screen created at `src/screens/TimerTestScreen.tsx` and added to navigation for easy testing.

---

### US-4.1 Completion Checklist

- [x] Timer types defined
- [x] Timer component created
- [x] EMOM format works correctly
- [x] AMRAP format works correctly
- [x] Straight sets format works correctly
- [x] Pause/Resume works
- [x] Skip works
- [x] Manual testing passed (via TimerTestScreen)
- [ ] Code committed to Git

---

## 🎯 User Story 4.2: Exercise Display

**Estimated Time**: 8 hours  
**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete

### Implementation

**File**: `src/components/session/ExerciseDisplay.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Video } from 'expo-av';
import { Exercise } from '../../types/plan';
import { cacheVideo, getCachedVideo } from '../../services/videoCache';

interface Props {
  exercise: Exercise;
  lowSensoryMode?: boolean;
}

export default function ExerciseDisplay({ exercise, lowSensoryMode = false }: Props) {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideo();
  }, [exercise.id]);

  async function loadVideo() {
    try {
      setLoading(true);
      
      // Try to get cached video first
      const cached = await getCachedVideo(exercise.id);
      
      if (cached) {
        setVideoUri(cached);
      } else {
        // Download and cache video
        const uri = await cacheVideo(exercise.id, exercise.videoUrl);
        setVideoUri(uri);
      }
    } catch (error) {
      console.error('Failed to load video:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Video (if not low-sensory mode) */}
      {!lowSensoryMode && videoUri && (
        <Video
          source={{ uri: videoUri }}
          style={styles.video}
          shouldPlay
          isLooping
          resizeMode="contain"
        />
      )}

      {/* Exercise name */}
      <Text style={styles.exerciseName}>{exercise.name}</Text>

      {/* Neutral cues */}
      <ScrollView style={styles.cuesContainer}>
        <Text style={styles.cuesTitle}>Form Cues:</Text>
        {exercise.neutral_cues.map((cue, index) => (
          <Text key={index} style={styles.cue}>
            • {cue}
          </Text>
        ))}

        {/* Breathing cues */}
        <Text style={styles.cuesTitle}>Breathing:</Text>
        {exercise.breathing_cues.map((cue, index) => (
          <Text key={index} style={styles.cue}>
            • {cue}
          </Text>
        ))}

        {/* Trans-specific notes */}
        {exercise.trans_notes.binder && (
          <View style={styles.transNotes}>
            <Text style={styles.transNotesTitle}>Binder Note:</Text>
            <Text style={styles.transNotesText}>{exercise.trans_notes.binder}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  video: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
    textAlign: 'center',
  },
  cuesContainer: {
    flex: 1,
    padding: 16,
  },
  cuesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  cue: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 24,
  },
  transNotes: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  transNotesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  transNotesText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
```

**AI Prompt**:
```
Create src/components/session/ExerciseDisplay.tsx with:
- Import React, useState, useEffect
- Import View, Text, StyleSheet, ScrollView
- Import Video from expo-av
- Import Exercise type
- Import cacheVideo, getCachedVideo from videoCache service
- Create Props interface (exercise, lowSensoryMode)
- Create functional component that:
  - Loads video from cache (or downloads and caches)
  - Displays video (looping, auto-play) if not low-sensory mode
  - Displays exercise name
  - Displays neutral cues (bullet list)
  - Displays breathing cues (bullet list)
  - Displays trans-specific notes (binder, pelvic floor) in highlighted box
- Use StyleSheet for styling
```

**Checklist**:
- [ ] ExerciseDisplay component created
- [ ] Video loads from cache
- [ ] Video downloads and caches if not cached
- [ ] Video loops and auto-plays
- [ ] Video hidden in low-sensory mode
- [ ] Exercise name displays
- [ ] Neutral cues display as bullet list
- [ ] Breathing cues display as bullet list
- [ ] Trans notes display in highlighted box
- [ ] Layout looks good on iPhone 12 and Pixel 5

---

## 🎯 User Stories 4.3-4.6: RPE, Swaps, Pain Flag, Completion

**Note**: Due to length, I'll provide condensed versions. Follow same pattern as US-4.1 and US-4.2.

### US-4.3: RPE Logger (6 hours)
- Create RPE slider (1-10 scale)
- Save RPE with each completed set
- Display RPE history for exercise

### US-4.4: Swap Drawer (8 hours)
- Create bottom sheet with swap options
- Display 2+ swaps per exercise
- Show swap rationale
- Link to FAQ page (v2.2)
- Update session with swapped exercise

### US-4.5: Pain Flag (6 hours)
- Create pain flag button
- Trigger auto-regression (safer variant + 20% volume reduction)
- Save pain flag to session
- Show confirmation toast

### US-4.6: Completion Screen (6 hours)
- Display session stats (duration, exercises, sets, avg RPE)
- Show encouragement message
- Add "Save Session" button
- Add "Share Progress" button (private)
- Navigate back to Plan View

---

## 📝 Week 4 Summary Checklist

### Components Completed
- [x] Timer.tsx (EMOM, AMRAP, Straight Sets)
- [ ] ExerciseDisplay.tsx (video, cues, trans notes)
- [ ] RPELogger.tsx (1-10 slider)
- [ ] SwapDrawer.tsx (bottom sheet with swaps)
- [ ] PainFlagButton.tsx (auto-regression trigger)
- [ ] CompletionScreen.tsx (stats, encouragement)

### Services Completed
- [ ] sessionLogger.ts (save session to SQLite)
- [ ] autoRegress.ts (pain flag logic)
- [ ] videoCache.ts (offline video caching)

### Testing Completed
- [x] Timer works for all formats
- [ ] Video loads and caches correctly
- [ ] RPE logging saves correctly
- [ ] Swaps work correctly
- [ ] Pain flag triggers auto-regression
- [ ] Session saves to SQLite
- [ ] Completion screen displays stats

### Ready for Week 5
- [ ] All Week 4 user stories complete
- [ ] Code committed and pushed to Git

---

**End of Week 4 README**
