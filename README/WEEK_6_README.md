# Week 6: BYO Import (Plus Feature) - Implementation Guide

**Goal**: Plus users can import their existing routines via text parsing  
**Estimated Effort**: 35-40 hours  
**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete

---

## 📋 Pre-Week Checklist

- [ ] Completed Week 5 (Progress & Logging)
- [ ] Plus tier implemented (Week 7 can be done in parallel)
- [ ] All Week 5 tests passing

---

## 🗂️ File Structure for Week 6

```
src/
├── screens/
│   ├── BYOImport.tsx                    ← US-6.1, 6.2
│   └── ParsedPreview.tsx                ← US-6.2
├── components/
│   ├── byo/
│   │   ├── TextInput.tsx                ← US-6.1
│   │   ├── ParsedExerciseList.tsx       ← US-6.2
│   │   └── PlusGate.tsx                 ← US-6.4
├── services/
│   ├── textParser.ts                    ← US-6.1
│   └── byoScheduler.ts                  ← US-6.3
```

---

## 🎯 User Story 6.1: Text Parser

**Estimated Time**: 12 hours  
**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete

### Supported Patterns (v2.2)

1. **Pattern 1**: `3x10 squat`
2. **Pattern 2**: `4 sets of 8 bench press`
3. **Pattern 3**: `10-min EMOM: 5 burpees`
4. **Pattern 4**: `Squat 3x10 @ 135lbs`

### Implementation

**File**: `src/services/textParser.ts`

```typescript
export interface ParsedExercise {
  exerciseName: string;
  sets: number;
  reps: number;
  format: 'EMOM' | 'AMRAP' | 'straight_sets';
  duration?: number; // For EMOM/AMRAP
  weight?: string; // Optional weight (e.g., "135lbs")
  parsed: boolean;
  originalText: string;
}

export function parseWorkoutText(text: string): ParsedExercise[] {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  return lines.map(line => parseLine(line));
}

function parseLine(line: string): ParsedExercise {
  const trimmed = line.trim();

  // Try Pattern 1: "3x10 squat"
  const pattern1 = /^(\d+)x(\d+)\s+(.+)$/i;
  const match1 = trimmed.match(pattern1);
  if (match1) {
    return {
      exerciseName: match1[3].trim(),
      sets: parseInt(match1[1]),
      reps: parseInt(match1[2]),
      format: 'straight_sets',
      parsed: true,
      originalText: line
    };
  }

  // Try Pattern 2: "4 sets of 8 bench press"
  const pattern2 = /^(\d+)\s+sets?\s+of\s+(\d+)\s+(.+)$/i;
  const match2 = trimmed.match(pattern2);
  if (match2) {
    return {
      exerciseName: match2[3].trim(),
      sets: parseInt(match2[1]),
      reps: parseInt(match2[2]),
      format: 'straight_sets',
      parsed: true,
      originalText: line
    };
  }

  // Try Pattern 3: "10-min EMOM: 5 burpees"
  const pattern3 = /^(\d+)-min\s+EMOM:\s+(\d+)\s+(.+)$/i;
  const match3 = trimmed.match(pattern3);
  if (match3) {
    return {
      exerciseName: match3[3].trim(),
      sets: parseInt(match3[1]), // Duration in minutes = number of sets
      reps: parseInt(match3[2]),
      format: 'EMOM',
      duration: parseInt(match3[1]),
      parsed: true,
      originalText: line
    };
  }

  // Try Pattern 4: "Squat 3x10 @ 135lbs"
  const pattern4 = /^(.+?)\s+(\d+)x(\d+)\s+@\s+(.+)$/i;
  const match4 = trimmed.match(pattern4);
  if (match4) {
    return {
      exerciseName: match4[1].trim(),
      sets: parseInt(match4[2]),
      reps: parseInt(match4[3]),
      format: 'straight_sets',
      weight: match4[4].trim(),
      parsed: true,
      originalText: line
    };
  }

  // Failed to parse (v2.2: graceful failure)
  return {
    exerciseName: trimmed,
    sets: 3,
    reps: 10,
    format: 'straight_sets',
    parsed: false,
    originalText: line
  };
}

export function matchExerciseToLibrary(
  parsedExercise: ParsedExercise,
  exerciseLibrary: Exercise[]
): Exercise | null {
  const searchTerm = parsedExercise.exerciseName.toLowerCase();

  // Exact match
  const exactMatch = exerciseLibrary.find(ex =>
    ex.name.toLowerCase() === searchTerm
  );
  if (exactMatch) return exactMatch;

  // Fuzzy match (contains)
  const fuzzyMatch = exerciseLibrary.find(ex =>
    ex.name.toLowerCase().includes(searchTerm) ||
    searchTerm.includes(ex.name.toLowerCase())
  );
  if (fuzzyMatch) return fuzzyMatch;

  return null;
}
```

**AI Prompt**:
```
Create src/services/textParser.ts with:
- Define ParsedExercise interface (exerciseName, sets, reps, format, duration, weight, parsed, originalText)
- Create parseWorkoutText function that:
  - Splits text by newlines
  - Parses each line using parseLine function
  - Returns array of ParsedExercise
- Create parseLine function that:
  - Tries Pattern 1: "3x10 squat" (regex: /^(\d+)x(\d+)\s+(.+)$/i)
  - Tries Pattern 2: "4 sets of 8 bench press" (regex: /^(\d+)\s+sets?\s+of\s+(\d+)\s+(.+)$/i)
  - Tries Pattern 3: "10-min EMOM: 5 burpees" (regex: /^(\d+)-min\s+EMOM:\s+(\d+)\s+(.+)$/i)
  - Tries Pattern 4: "Squat 3x10 @ 135lbs" (regex: /^(.+?)\s+(\d+)x(\d+)\s+@\s+(.+)$/i)
  - If no match: returns unparsed exercise with default values (v2.2)
- Create matchExerciseToLibrary function that:
  - Tries exact match first
  - Tries fuzzy match (contains) second
  - Returns null if no match
```

**Checklist**:
- [ ] textParser.ts created
- [ ] parseWorkoutText function works
- [ ] Pattern 1 parses correctly ("3x10 squat")
- [ ] Pattern 2 parses correctly ("4 sets of 8 bench press")
- [ ] Pattern 3 parses correctly ("10-min EMOM: 5 burpees")
- [ ] Pattern 4 parses correctly ("Squat 3x10 @ 135lbs")
- [ ] Graceful failure for unparsed lines (v2.2)
- [ ] matchExerciseToLibrary finds exact matches
- [ ] matchExerciseToLibrary finds fuzzy matches
- [ ] Returns null when no match found

---

## 🎯 User Story 6.2: Parsed Preview

**Estimated Time**: 8 hours  
**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete

### Implementation

**File**: `src/screens/BYOImport.tsx`

```typescript
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { parseWorkoutText, matchExerciseToLibrary } from '../../services/textParser';
import { exerciseLibrary } from '../../data/exercises';
import ParsedExerciseList from '../../components/byo/ParsedExerciseList';
import PlusGate from '../../components/byo/PlusGate';
import { useSubscription } from '../../hooks/useSubscription';

export default function BYOImport({ navigation }: any) {
  const [text, setText] = useState('');
  const [parsedExercises, setParsedExercises] = useState<any[]>([]);
  const { subscription } = useSubscription();

  const handleParse = () => {
    const parsed = parseWorkoutText(text);
    
    // Match to exercise library
    const matched = parsed.map(ex => ({
      ...ex,
      matchedExercise: matchExerciseToLibrary(ex, exerciseLibrary)
    }));

    setParsedExercises(matched);
  };

  const handleSave = () => {
    if (subscription?.tier !== 'plus') {
      // Show Plus gate (v2.2)
      navigation.navigate('Paywall', { feature: 'byo' });
      return;
    }

    // Save and schedule into blocks (US-6.3)
    navigation.navigate('BYOSchedule', { exercises: parsedExercises });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Import Your Routine</Text>
      <Text style={styles.subtitle}>
        Paste your workout routine below. We support these formats:
      </Text>

      {/* Inline examples (v2.2) */}
      <View style={styles.examplesContainer}>
        <Text style={styles.exampleTitle}>Supported formats:</Text>
        <Text style={styles.example}>• 3x10 squat</Text>
        <Text style={styles.example}>• 4 sets of 8 bench press</Text>
        <Text style={styles.example}>• 10-min EMOM: 5 burpees</Text>
        <Text style={styles.example}>• Squat 3x10 @ 135lbs</Text>
      </View>

      {/* Text input */}
      <TextInput
        style={styles.textInput}
        multiline
        numberOfLines={10}
        value={text}
        onChangeText={setText}
        placeholder="3x10 squat\n4 sets of 8 bench press\n10-min EMOM: 5 burpees"
      />

      <Button mode="contained" onPress={handleParse} style={styles.parseButton}>
        Parse Routine
      </Button>

      {/* Parsed preview */}
      {parsedExercises.length > 0 && (
        <>
          <ParsedExerciseList
            exercises={parsedExercises}
            onEdit={(index, updated) => {
              const newParsed = [...parsedExercises];
              newParsed[index] = updated;
              setParsedExercises(newParsed);
            }}
            onDelete={(index) => {
              setParsedExercises(parsedExercises.filter((_, i) => i !== index));
            }}
          />

          {/* Save button (Plus gate) */}
          {subscription?.tier === 'plus' ? (
            <Button mode="contained" onPress={handleSave} style={styles.saveButton}>
              Save & Schedule
            </Button>
          ) : (
            <PlusGate onUpgrade={() => navigation.navigate('Paywall', { feature: 'byo' })} />
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  examplesContainer: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  example: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 200,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  parseButton: {
    marginBottom: 24,
  },
  saveButton: {
    marginTop: 16,
  },
});
```

**File**: `src/components/byo/ParsedExerciseList.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconButton, Chip } from 'react-native-paper';

interface Props {
  exercises: any[];
  onEdit: (index: number, updated: any) => void;
  onDelete: (index: number) => void;
}

export default function ParsedExerciseList({ exercises, onEdit, onDelete }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Parsed Exercises ({exercises.length})</Text>
      
      {exercises.map((ex, index) => (
        <View key={index} style={styles.exerciseCard}>
          {/* Parsed status */}
          {ex.parsed ? (
            <Chip icon="check" style={styles.successChip}>Parsed</Chip>
          ) : (
            <Chip icon="alert" style={styles.warningChip}>
              Couldn't parse - tap to edit (v2.2)
            </Chip>
          )}

          {/* Exercise details */}
          <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
          <Text style={styles.exerciseDetails}>
            {ex.sets} sets × {ex.reps} reps
            {ex.weight && ` @ ${ex.weight}`}
          </Text>

          {/* Matched exercise (if found) */}
          {ex.matchedExercise ? (
            <Text style={styles.matchedText}>
              ✓ Matched to: {ex.matchedExercise.name}
            </Text>
          ) : (
            <Text style={styles.unmatchedText}>
              ⚠ No match found - will be added as custom exercise
            </Text>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <IconButton icon="pencil" onPress={() => onEdit(index, ex)} />
            <IconButton icon="delete" onPress={() => onDelete(index)} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  exerciseCard: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  successChip: {
    backgroundColor: '#C8E6C9',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  warningChip: {
    backgroundColor: '#FFE0B2',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  matchedText: {
    fontSize: 14,
    color: '#4CAF50',
  },
  unmatchedText: {
    fontSize: 14,
    color: '#FF9800',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
```

**AI Prompt**:
```
Create src/screens/BYOImport.tsx with:
- Import React, useState
- Import View, TextInput, StyleSheet, ScrollView
- Import Text, Button from react-native-paper
- Import parseWorkoutText, matchExerciseToLibrary
- Import ParsedExerciseList, PlusGate components
- Import useSubscription hook
- Create functional component that:
  - Displays title: "Import Your Routine"
  - Shows inline examples of supported formats (v2.2)
  - Displays multiline TextInput with placeholder
  - "Parse Routine" button calls parseWorkoutText
  - Displays ParsedExerciseList with parsed exercises
  - Shows Plus gate if user is not Plus subscriber (v2.2)
  - "Save & Schedule" button navigates to BYOSchedule (Plus only)
- Use StyleSheet for styling

Create src/components/byo/ParsedExerciseList.tsx with:
- Import React
- Import View, Text, StyleSheet
- Import IconButton, Chip from react-native-paper
- Create Props interface (exercises, onEdit, onDelete)
- Create functional component that:
  - Displays list of parsed exercises
  - Shows "Parsed" chip if parsed = true
  - Shows "Couldn't parse - tap to edit" chip if parsed = false (v2.2)
  - Displays exercise name, sets, reps, weight
  - Shows matched exercise (if found)
  - Shows "No match found" warning (if not found)
  - Edit and Delete buttons for each exercise
- Use StyleSheet for styling
```

**Checklist**:
- [ ] BYOImport.tsx created
- [ ] Title and subtitle display
- [ ] Inline examples display (v2.2)
- [ ] TextInput allows multiline input
- [ ] "Parse Routine" button parses text
- [ ] ParsedExerciseList displays parsed exercises
- [ ] "Parsed" chip shows for successfully parsed exercises
- [ ] "Couldn't parse" chip shows for failed parses (v2.2)
- [ ] Matched exercises show "✓ Matched to: [name]"
- [ ] Unmatched exercises show warning
- [ ] Edit button allows manual editing
- [ ] Delete button removes exercise
- [ ] Plus gate shows for non-Plus users (v2.2)
- [ ] "Save & Schedule" button enabled for Plus users only

---

## 🎯 User Story 6.3: Schedule into Blocks

**Estimated Time**: 10 hours  
**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete

### Implementation

**File**: `src/services/byoScheduler.ts`

```typescript
import { Plan, Day, Workout, ExerciseInstance } from '../types/plan';
import { ParsedExercise } from './textParser';

export function scheduleIntoBlocks(
  parsedExercises: ParsedExercise[],
  blockLength: 1 | 4,
  startDate: Date
): Plan {
  const numDays = blockLength === 1 ? 7 : 28;
  const exercisesPerDay = Math.ceil(parsedExercises.length / numDays);

  const days: Day[] = [];

  for (let i = 0; i < numDays; i++) {
    const dayExercises = parsedExercises.slice(
      i * exercisesPerDay,
      (i + 1) * exercisesPerDay
    );

    if (dayExercises.length === 0) continue;

    const day = generateDayWithVariants(i, addDays(startDate, i), dayExercises);
    days.push(day);
  }

  return {
    id: generateId(),
    blockLength,
    startDate,
    goals: ['custom'], // BYO imports are "custom" goal
    goalWeighting: { primary: 100, secondary: 0 },
    days
  };
}

function generateDayWithVariants(
  dayNumber: number,
  date: Date,
  exercises: ParsedExercise[]
): Day {
  return {
    dayNumber,
    date,
    variants: {
      5: null, // BYO doesn't auto-generate 5-min variant
      15: generateWorkoutFromParsed(exercises, 15),
      30: generateWorkoutFromParsed(exercises, 30),
      45: generateWorkoutFromParsed(exercises, 45)
    }
  };
}

function generateWorkoutFromParsed(
  exercises: ParsedExercise[],
  targetDuration: 15 | 30 | 45
): Workout {
  const exerciseInstances: ExerciseInstance[] = exercises.map(ex => ({
    exerciseId: ex.matchedExercise?.id || `custom_${ex.exerciseName}`,
    sets: ex.sets,
    reps: ex.reps,
    format: ex.format,
    restSeconds: 30
  }));

  return {
    duration: targetDuration,
    exercises: exerciseInstances,
    totalMinutes: targetDuration
  };
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function generateId(): string {
  return `byo_plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

**AI Prompt**:
```
Create src/services/byoScheduler.ts with:
- Import Plan, Day, Workout, ExerciseInstance types
- Import ParsedExercise type
- Create scheduleIntoBlocks function that:
  - Takes parsedExercises, blockLength (1 or 4), startDate
  - Distributes exercises evenly across days (7 or 28)
  - Generates Day objects with 4 time variants (5, 15, 30, 45 min)
  - BYO imports don't auto-generate 5-min variant (set to null)
  - Returns Plan object with id, blockLength, startDate, goals: ['custom']
- Create generateDayWithVariants helper function
- Create generateWorkoutFromParsed helper function
- Helper functions: addDays, generateId
```

**Checklist**:
- [ ] byoScheduler.ts created
- [ ] scheduleIntoBlocks function works
- [ ] Exercises distributed evenly across days
- [ ] Each day has 3 variants (15, 30, 45 min)
- [ ] 5-min variant set to null
- [ ] Plan has goals: ['custom']
- [ ] Returns valid Plan object

---

## 🎯 User Story 6.4: Plus Gate

**Estimated Time**: 6 hours  
**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete

### Implementation

**File**: `src/components/byo/PlusGate.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

interface Props {
  onUpgrade: () => void;
}

export default function PlusGate({ onUpgrade }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title}>Plus Feature</Text>
      <Text style={styles.body}>
        Import your own routines with TransFitness Plus. Get advanced progression, priority support, and early access to new features.
      </Text>
      <Button mode="contained" onPress={onUpgrade} style={styles.button}>
        Upgrade to Plus
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  body: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    // Styles
  },
});
```

**AI Prompt**:
```
Create src/components/byo/PlusGate.tsx with:
- Import React
- Import View, Text, StyleSheet
- Import Button from react-native-paper
- Create Props interface (onUpgrade)
- Create functional component that:
  - Displays lock icon (🔒)
  - Displays title: "Plus Feature"
  - Displays body text about Plus benefits
  - "Upgrade to Plus" button calls onUpgrade
- Use StyleSheet for styling (centered, card-like design)
```

**Checklist**:
- [ ] PlusGate.tsx created
- [ ] Lock icon displays
- [ ] Title displays
- [ ] Body text displays
- [ ] "Upgrade to Plus" button works
- [ ] onUpgrade callback fires
- [ ] Layout looks good

---

## 📝 Week 6 Summary Checklist

### Screens Completed
- [ ] BYOImport.tsx
- [ ] ParsedPreview.tsx (integrated into BYOImport)

### Components Completed
- [ ] TextInput.tsx (native TextInput)
- [ ] ParsedExerciseList.tsx
- [ ] PlusGate.tsx

### Services Completed
- [ ] textParser.ts (4 patterns + graceful failure)
- [ ] byoScheduler.ts (distribute into blocks)

### Testing Completed
- [ ] Pattern 1 parses correctly ("3x10 squat")
- [ ] Pattern 2 parses correctly ("4 sets of 8 bench")
- [ ] Pattern 3 parses correctly ("10-min EMOM: 5 burpees")
- [ ] Pattern 4 parses correctly ("Squat 3x10 @ 135lbs")
- [ ] Graceful failure for unparsed lines (v2.2)
- [ ] Inline examples display (v2.2)
- [ ] Parsed exercises display correctly
- [ ] Edit and delete work
- [ ] Plus gate shows for non-Plus users
- [ ] Schedule into blocks works
- [ ] Plan generated correctly

### Ready for Week 7
- [ ] All Week 6 user stories complete
- [ ] Code committed and pushed to Git

---

**End of Week 6 README**
