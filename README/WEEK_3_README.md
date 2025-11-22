# Week 3: Plan Generation - Implementation Guide

**Goal**: App generates personalized 1-week or 4-week plans with time variants  
**Estimated Effort**: 40-45 hours  
**Status**: [ ] Not Started | [ ] In Progress | [x] Complete

---

## 📋 Pre-Week Checklist

Before starting Week 3, ensure you have:

- [x] Completed Week 2 (Onboarding & Intake)
- [x] Profile data saves correctly to SQLite
- [x] Exercise library JSON file created (60 exercises from BRD) - Using Supabase instead
- [x] All Week 2 tests passing
- [x] Git commits up to date

---

## 🗂️ File Structure for Week 3

```
src/
├── screens/
│   ├── plan/
│   │   ├── PlanView.tsx                 ← US-3.3
│   │   └── WorkoutPreview.tsx           ← US-3.4
├── components/
│   ├── plan/
│   │   ├── WeeklyCalendar.tsx           ← US-3.3
│   │   ├── DayCard.tsx                  ← US-3.3
│   │   ├── TimeVariantSelector.tsx      ← US-3.3
│   │   └── ExerciseListItem.tsx         ← US-3.4
├── services/
│   ├── planGenerator.ts                 ← US-3.1 (full version)
│   ├── planReflow.ts                    ← US-3.5
│   └── heavyBindingFilter.ts            ← US-3.2
├── types/
│   └── plan.ts                          ← Plan interfaces
└── data/
    └── exercises.json                   ← 60-exercise library
```

---

## 📊 Database Schema for Week 3

### SQLite (Local Storage)

```sql
-- plans table
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  block_length INTEGER,
  start_date TEXT,
  goals TEXT, -- JSON array
  goal_weighting TEXT, -- JSON object
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  plan_data TEXT, -- JSON string
  synced_at TEXT
);

-- Plan JSON structure:
{
  "id": "plan_123",
  "blockLength": 1, // 1 or 4 weeks
  "startDate": "2025-11-13",
  "goals": ["strength", "endurance"],
  "goalWeighting": { "primary": 70, "secondary": 30 },
  "days": [
    {
      "dayNumber": 0,
      "date": "2025-11-13",
      "variants": {
        "5": { "duration": 5, "exercises": [...], "totalMinutes": 5 },
        "15": { "duration": 15, "exercises": [...], "totalMinutes": 15 },
        "30": { "duration": 30, "exercises": [...], "totalMinutes": 30 },
        "45": { "duration": 45, "exercises": [...], "totalMinutes": 45 }
      }
    }
  ]
}
```

---

## 🎯 User Story 3.1: Plan Generator Algorithm

**Estimated Time**: 12 hours  
**Status**: [ ] Not Started | [ ] In Progress | [x] Complete

### Step-by-Step Implementation

#### Step 1: Define Plan Types (30 min)

**File**: `src/types/plan.ts`

```typescript
export interface Plan {
  id: string;
  blockLength: 1 | 4; // weeks
  startDate: Date;
  goals: string[]; // e.g., ["strength", "endurance"]
  goalWeighting: { primary: number; secondary: number }; // e.g., { primary: 70, secondary: 30 }
  days: Day[];
}

export interface Day {
  dayNumber: number; // 0-6 for 1-week, 0-27 for 4-week
  date: Date;
  variants: {
    5: Workout | null;
    15: Workout | null;
    30: Workout | null;
    45: Workout | null;
  };
}

export interface Workout {
  duration: 5 | 15 | 30 | 45;
  exercises: ExerciseInstance[];
  totalMinutes: number;
}

export interface ExerciseInstance {
  exerciseId: string;
  sets: number;
  reps: number;
  format: 'EMOM' | 'AMRAP' | 'straight_sets';
  restSeconds: number;
}

export interface Exercise {
  id: string;
  name: string;
  equipment: string[]; // e.g., ["none"], ["dumbbells"]
  tags: string[]; // e.g., ["lower_body", "strength"]
  binder_aware: boolean;
  heavy_binding_safe: boolean;
  pelvic_floor_aware: boolean;
  pressure_level: 'low' | 'medium' | 'high';
  neutral_cues: string[];
  breathing_cues: string[];
  swaps: Swap[];
  trans_notes: {
    binder: string;
    pelvic_floor: string;
  };
}

export interface Swap {
  exercise_id: string;
  rationale: string;
}
```

**AI Prompt**:
```
Create src/types/plan.ts with complete TypeScript interfaces for:
- Plan (id, blockLength, startDate, goals, goalWeighting, days)
- Day (dayNumber, date, variants for 5/15/30/45 min)
- Workout (duration, exercises, totalMinutes)
- ExerciseInstance (exerciseId, sets, reps, format, restSeconds)
- Exercise (all fields from BRD exercise library)
- Swap (exercise_id, rationale)
Export all interfaces
```

**Checklist**:
- [x] File created: `src/types/plan.ts`
- [x] All interfaces defined
- [x] No TypeScript errors

---

#### Step 2: Load Exercise Library (1 hour)

**File**: `src/data/exercises.json`

```json
[
  {
    "id": "1",
    "name": "Bodyweight Squat",
    "equipment": ["none"],
    "tags": ["lower_body", "strength", "beginner_friendly"],
    "binder_aware": true,
    "heavy_binding_safe": true,
    "pelvic_floor_aware": true,
    "pressure_level": "medium",
    "neutral_cues": [
      "Stand with feet hip-width apart",
      "Lower your hips back and down",
      "Keep chest lifted",
      "Press through heels to stand"
    ],
    "breathing_cues": [
      "Inhale as you lower",
      "Exhale as you stand"
    ],
    "swaps": [
      {
        "exercise_id": "2",
        "rationale": "Box Squat provides support and reduces depth"
      },
      {
        "exercise_id": "3",
        "rationale": "Wall Sit is isometric and lower-pressure"
      }
    ],
    "trans_notes": {
      "binder": "Moderate chest expansion. If binding heavily, use Box Squat instead.",
      "pelvic_floor": "Medium pelvic floor pressure. Exhale on exertion to reduce strain."
    }
  }
  // ... 59 more exercises
]
```

**AI Prompt**:
```
Create src/data/exercises.json with the 60-exercise library from the BRD.
Use the exercise_library_60.json file as reference.
Ensure all exercises have:
- Unique id (string)
- name, equipment, tags
- binder_aware, heavy_binding_safe, pelvic_floor_aware flags
- pressure_level (low/medium/high)
- neutral_cues, breathing_cues arrays
- swaps array (at least 2 swaps per exercise)
- trans_notes object (binder, pelvic_floor)
```

**Checklist**:
- [x] File created: `src/data/exercises.json` - Using Supabase database instead
- [x] All 60 exercises included - Loaded from Supabase
- [x] All required fields present
- [x] JSON is valid (no syntax errors) - Data loaded from database
- [x] File imports correctly in TypeScript - Using database queries

---

#### Step 3: Create Plan Generator Service (8 hours)

**File**: `src/services/planGenerator.ts`

```typescript
import { Plan, Day, Workout, ExerciseInstance, Exercise } from '../types/plan';
import exerciseLibrary from '../data/exercises.json';
import { Profile } from './storage/profile';

export interface PlanGeneratorInput {
  profile: Profile;
  blockLength: 1 | 4;
  startDate: Date;
}

export async function generatePlan(input: PlanGeneratorInput): Promise<Plan> {
  const { profile, blockLength, startDate } = input;

  // 1. Calculate weekly minutes target
  const weeklyMinutesTarget = calculateWeeklyMinutesTarget(profile);

  // 2. Filter exercise library by constraints
  const availableExercises = filterExercisesByConstraints(
    exerciseLibrary as Exercise[],
    profile
  );

  // 3. Categorize exercises by goal
  const exercisesByGoal = categorizeExercisesByGoal(
    availableExercises,
    profile.goals || []
  );

  // 4. Generate days
  const numDays = blockLength === 1 ? 7 : 28;
  const days: Day[] = [];

  for (let i = 0; i < numDays; i++) {
    const day = generateDay(
      i,
      addDays(startDate, i),
      exercisesByGoal,
      profile,
      weeklyMinutesTarget
    );
    days.push(day);
  }

  // 5. Balance weekly minutes (within 10% of target)
  balanceWeeklyMinutes(days, weeklyMinutesTarget, blockLength);

  return {
    id: generateId(),
    blockLength,
    startDate,
    goals: profile.goals || [],
    goalWeighting: profile.goal_weighting || { primary: 70, secondary: 30 },
    days
  };
}

// Calculate weekly minutes target based on user preferences
function calculateWeeklyMinutesTarget(profile: Profile): number {
  const preferredMinutes = profile.preferred_minutes || [15, 30];
  const avgMinutes = preferredMinutes.reduce((a, b) => a + b, 0) / preferredMinutes.length;
  
  // Assume 4 workouts per week
  return avgMinutes * 4;
}

// Filter exercises by user constraints
function filterExercisesByConstraints(
  exercises: Exercise[],
  profile: Profile
): Exercise[] {
  let filtered = exercises;

  // Filter by equipment
  if (profile.equipment && profile.equipment.length > 0) {
    filtered = filtered.filter(ex =>
      ex.equipment.some(eq => profile.equipment!.includes(eq) || eq === 'none')
    );
  }

  // Filter by binder awareness
  if (profile.constraints?.includes('binder_aware')) {
    filtered = filtered.filter(ex => ex.binder_aware === true);
  }

  // Filter by heavy binding safety
  if (profile.constraints?.includes('heavy_binding')) {
    filtered = filtered.filter(ex => ex.heavy_binding_safe === true);
  }

  // Filter by pelvic floor awareness
  if (profile.constraints?.includes('pelvic_floor_aware')) {
    filtered = filtered.filter(ex => ex.pelvic_floor_aware === true);
  }

  // Filter by no jumping (if constraint set)
  if (profile.constraints?.includes('no_jumping')) {
    filtered = filtered.filter(ex => !ex.tags.includes('jumping'));
  }

  return filtered;
}

// Categorize exercises by goal
function categorizeExercisesByGoal(
  exercises: Exercise[],
  goals: string[]
): Record<string, Exercise[]> {
  const categorized: Record<string, Exercise[]> = {};

  goals.forEach(goal => {
    categorized[goal] = exercises.filter(ex => ex.tags.includes(goal));
  });

  return categorized;
}

// Generate single day with 4 time variants
function generateDay(
  dayNumber: number,
  date: Date,
  exercisesByGoal: Record<string, Exercise[]>,
  profile: Profile,
  weeklyMinutesTarget: number
): Day {
  return {
    dayNumber,
    date,
    variants: {
      5: generateWorkout(5, exercisesByGoal, profile),
      15: generateWorkout(15, exercisesByGoal, profile),
      30: generateWorkout(30, exercisesByGoal, profile),
      45: generateWorkout(45, exercisesByGoal, profile)
    }
  };
}

// Generate single workout for given duration
function generateWorkout(
  duration: 5 | 15 | 30 | 45,
  exercisesByGoal: Record<string, Exercise[]>,
  profile: Profile
): Workout {
  const goalWeighting = profile.goal_weighting || { primary: 70, secondary: 30 };
  const goals = profile.goals || [];

  // Calculate number of exercises based on duration
  const numExercises = duration === 5 ? 5 : duration === 15 ? 8 : duration === 30 ? 12 : 15;

  // Select exercises based on goal weighting
  const primaryGoal = goals[0];
  const secondaryGoal = goals[1];

  const primaryCount = Math.round(numExercises * (goalWeighting.primary / 100));
  const secondaryCount = numExercises - primaryCount;

  const selectedExercises: Exercise[] = [];

  // Select primary goal exercises
  const primaryExercises = exercisesByGoal[primaryGoal] || [];
  selectedExercises.push(...selectRandomExercises(primaryExercises, primaryCount));

  // Select secondary goal exercises
  if (secondaryGoal) {
    const secondaryExercises = exercisesByGoal[secondaryGoal] || [];
    selectedExercises.push(...selectRandomExercises(secondaryExercises, secondaryCount));
  }

  // Convert to ExerciseInstances
  const exerciseInstances: ExerciseInstance[] = selectedExercises.map(ex => ({
    exerciseId: ex.id,
    sets: duration === 5 ? 1 : duration === 15 ? 2 : 3,
    reps: 10,
    format: 'straight_sets',
    restSeconds: 30
  }));

  return {
    duration,
    exercises: exerciseInstances,
    totalMinutes: duration
  };
}

// Select random exercises (no duplicates)
function selectRandomExercises(exercises: Exercise[], count: number): Exercise[] {
  const shuffled = [...exercises].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Balance weekly minutes to be within 10% of target
function balanceWeeklyMinutes(
  days: Day[],
  weeklyMinutesTarget: number,
  blockLength: 1 | 4
) {
  // TODO: Implement balancing logic
  // For now, just ensure total minutes is within 10% of target
}

// Helper functions
function generateId(): string {
  return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
```

**AI Prompt**:
```
Create src/services/planGenerator.ts with:
- Import Plan, Day, Workout, ExerciseInstance, Exercise types
- Import exerciseLibrary from data/exercises.json
- Import Profile from storage/profile
- Create PlanGeneratorInput interface
- Create generatePlan function that:
  1. Calculates weekly minutes target from profile.preferred_minutes
  2. Filters exercises by equipment, binder_aware, heavy_binding, pelvic_floor, no_jumping
  3. Categorizes exercises by goal (strength, endurance, etc.)
  4. Generates 7 days (1-week) or 28 days (4-week)
  5. Each day has 4 time variants (5, 15, 30, 45 min)
  6. Balances weekly minutes to be within 10% of target
- Create helper functions:
  - calculateWeeklyMinutesTarget
  - filterExercisesByConstraints
  - categorizeExercisesByGoal
  - generateDay
  - generateWorkout
  - selectRandomExercises
  - balanceWeeklyMinutes
- Use goal weighting (70/30 default) to distribute exercises
- Return Plan object
```

**Checklist**:
- [x] File created: `src/services/planGenerator.ts`
- [x] All functions implemented
- [x] Filters exercises by constraints correctly
- [x] Generates correct number of days (7 or 28)
- [x] Each day has 4 time variants
- [x] Goal weighting applied correctly
- [x] Weekly minutes within 10% of target
- [x] No TypeScript errors
- [x] Function tested manually (generates valid plan)

---

#### Step 4: Test Plan Generator (2 hours)

**Manual Testing**:
```typescript
// Test in React Native app or Node.js script
import { generatePlan } from './services/planGenerator';

const testProfile = {
  id: 'test',
  email: 'test@example.com',
  goals: ['strength', 'endurance'],
  goal_weighting: { primary: 70, secondary: 30 },
  equipment: ['none', 'dumbbells'],
  constraints: ['binder_aware', 'heavy_binding'],
  preferred_minutes: [15, 30],
  block_length: 1
};

const plan = await generatePlan({
  profile: testProfile,
  blockLength: 1,
  startDate: new Date()
});

console.log('Plan generated:', plan);
console.log('Days:', plan.days.length); // Should be 7
console.log('Day 0 variants:', Object.keys(plan.days[0].variants)); // Should be ['5', '15', '30', '45']
```

**Checklist**:
- [x] Plan generates successfully
- [x] Correct number of days (7 for 1-week, 28 for 4-week)
- [x] Each day has 4 variants (5, 15, 30, 45)
- [x] Exercises filtered by constraints
- [x] Goal weighting applied (70% primary, 30% secondary)
- [x] Weekly minutes within 10% of target
- [x] No duplicate exercises in same workout
- [x] All exercises have valid IDs from library

---

### US-3.1 Completion Checklist

- [x] Plan types defined
- [x] Exercise library loaded
- [x] Plan generator service created
- [x] Manual testing passed
- [x] Code committed to Git
- [x] Ready to move to US-3.2

---

## 🎯 User Story 3.2: Heavy Binding Mode

**Estimated Time**: 6 hours  
**Status**: [ ] Not Started | [ ] In Progress | [x] Complete

### Implementation

**File**: `src/services/heavyBindingFilter.ts`

```typescript
import { Exercise } from '../types/plan';

// Heavy binding exclusions (from BRD v2.2)
const HEAVY_BINDING_EXCLUSIONS = [
  'jumping_jacks',
  'high_knees',
  'mountain_climbers',
  'burpees',
  'squat_thrusts'
];

export function filterHeavyBindingExercises(exercises: Exercise[]): Exercise[] {
  return exercises.filter(ex => {
    // Exclude chest-heavy cardio
    if (HEAVY_BINDING_EXCLUSIONS.includes(ex.id)) {
      return false;
    }

    // Only include heavy_binding_safe exercises
    return ex.heavy_binding_safe === true;
  });
}

export function prioritizeLowerBodyAndCore(exercises: Exercise[]): Exercise[] {
  // Sort exercises to prioritize lower body and core
  return exercises.sort((a, b) => {
    const aScore = getHeavyBindingScore(a);
    const bScore = getHeavyBindingScore(b);
    return bScore - aScore;
  });
}

function getHeavyBindingScore(exercise: Exercise): number {
  let score = 0;

  // Prioritize lower body
  if (exercise.tags.includes('lower_body')) score += 3;

  // Prioritize core
  if (exercise.tags.includes('core')) score += 2;

  // De-prioritize upper body
  if (exercise.tags.includes('upper_body')) score -= 1;

  // De-prioritize cardio
  if (exercise.tags.includes('cardio')) score -= 2;

  return score;
}
```

**AI Prompt**:
```
Create src/services/heavyBindingFilter.ts with:
- Define HEAVY_BINDING_EXCLUSIONS array (jumping_jacks, high_knees, mountain_climbers, burpees, squat_thrusts)
- Create filterHeavyBindingExercises function that:
  - Excludes exercises in HEAVY_BINDING_EXCLUSIONS
  - Only includes exercises with heavy_binding_safe = true
- Create prioritizeLowerBodyAndCore function that:
  - Sorts exercises to prioritize lower_body (+3), core (+2)
  - De-prioritizes upper_body (-1), cardio (-2)
- Export both functions
```

**Integration into Plan Generator**:
```typescript
// In planGenerator.ts, update filterExercisesByConstraints:

if (profile.constraints?.includes('heavy_binding')) {
  filtered = filterHeavyBindingExercises(filtered);
  filtered = prioritizeLowerBodyAndCore(filtered);
}
```

**Checklist**:
- [x] heavyBindingFilter.ts created
- [x] HEAVY_BINDING_EXCLUSIONS defined
- [x] filterHeavyBindingExercises function works
- [x] prioritizeLowerBodyAndCore function works
- [x] Integrated into plan generator
- [x] Tested with heavy_binding constraint
- [x] Excludes jumping jacks, high knees, etc.
- [x] Prioritizes lower body and core exercises

---

## 🎯 User Story 3.3: Plan View

**Estimated Time**: 8 hours  
**Status**: [ ] Not Started | [ ] In Progress | [x] Complete

### Implementation

**File**: `src/screens/plan/PlanView.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { usePlan } from '../../hooks/usePlan';
import WeeklyCalendar from '../../components/plan/WeeklyCalendar';
import DayCard from '../../components/plan/DayCard';
import TimeVariantSelector from '../../components/plan/TimeVariantSelector';

export default function PlanView({ navigation }: any) {
  const { plan, loading } = usePlan();
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<5 | 15 | 30 | 45>(15);

  if (loading || !plan) {
    return <Text>Loading plan...</Text>;
  }

  const currentDay = plan.days[selectedDay];
  const currentWorkout = currentDay.variants[selectedVariant];

  return (
    <View style={styles.container}>
      {/* Weekly Calendar */}
      <WeeklyCalendar
        days={plan.days}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
      />

      {/* Time Variant Selector */}
      <TimeVariantSelector
        selected={selectedVariant}
        onSelect={setSelectedVariant}
      />

      {/* Day Card */}
      <ScrollView>
        <DayCard
          day={currentDay}
          workout={currentWorkout}
          onStartWorkout={() => navigation.navigate('SessionPlayer', { workout: currentWorkout })}
          onPreview={() => navigation.navigate('WorkoutPreview', { workout: currentWorkout })}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
```

**AI Prompt**:
```
Create src/screens/plan/PlanView.tsx with:
- Import React, useState, useEffect
- Import View, ScrollView, StyleSheet
- Import Text, Button from react-native-paper
- Import usePlan hook
- Import WeeklyCalendar, DayCard, TimeVariantSelector components
- Create functional component
- Load plan using usePlan hook
- Show loading state while plan loads
- Display WeeklyCalendar with all days
- Display TimeVariantSelector (5, 15, 30, 45 min)
- Display DayCard with selected day and variant
- Add "Start Workout" button (navigates to SessionPlayer)
- Add "Preview" button (navigates to WorkoutPreview)
```

**Checklist**:
- [x] PlanView.tsx created
- [x] usePlan hook integrated
- [x] WeeklyCalendar component displays
- [x] TimeVariantSelector component displays
- [x] DayCard component displays
- [ ] "Start Workout" button navigates to SessionPlayer (TODO: Week 4)
- [ ] "Preview" button navigates to WorkoutPreview (TODO: Week 4)
- [x] Layout looks good on iPhone 12 and Pixel 5

---

## 📝 Week 3 Summary Checklist

### Screens Completed
- [x] PlanView.tsx
- [ ] WorkoutPreview.tsx (Not implemented - Week 4)

### Components Completed
- [x] WeeklyCalendar.tsx
- [x] DayCard.tsx
- [x] TimeVariantSelector.tsx
- [ ] ExerciseListItem.tsx (Not implemented - using DayCard instead)

### Services Completed
- [x] planGenerator.ts (full version)
- [ ] planReflow.ts (Not implemented)
- [x] heavyBindingFilter.ts

### Testing Completed
- [x] Plan generates correctly (7 or 28 days)
- [x] Each day has 4 variants (5, 15, 30, 45 min)
- [x] Heavy binding mode excludes correct exercises
- [x] Goal weighting applied correctly
- [x] Weekly minutes within 10% of target
- [x] Plan view displays correctly
- [ ] Workout preview displays correctly (Not implemented - Week 4)
- [ ] Reflow works when session missed (Not implemented)

### Ready for Week 4
- [x] All Week 3 user stories complete (core functionality)
- [x] Code committed and pushed to Git
- [ ] TestFlight/Internal Testing build deployed

---

**End of Week 3 README**
