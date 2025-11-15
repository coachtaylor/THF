# Week 2: Onboarding & Intake - Implementation Guide

**Goal**: User can complete onboarding and create their first plan  
**Estimated Effort**: 35-40 hours  
**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete

---

## 📋 Pre-Week Checklist

Before starting Week 2, ensure you have:

- [ ] Completed Week 1 setup (Expo project, Supabase, GitHub)
- [ ] Installed all dependencies (see Week 1 README)
- [ ] Created database tables (users, profiles)
- [ ] Configured environment variables (.env)
- [ ] Tested basic navigation (React Navigation)

---

## 🗂️ File Structure for Week 2

```
src/
├── screens/
│   ├── onboarding/
│   │   ├── WhyTransFitness.tsx          ← US-2.1
│   │   ├── Disclaimer.tsx               ← US-2.2
│   │   └── intake/
│   │       ├── Goals.tsx                ← US-2.4
│   │       ├── Constraints.tsx          ← US-2.5
│   │       ├── Preferences.tsx          ← US-2.6
│   │       └── Review.tsx               ← US-2.7
├── components/
│   ├── onboarding/
│   │   ├── ProgressIndicator.tsx        ← Shared component
│   │   ├── GoalCard.tsx                 ← US-2.4
│   │   ├── ConstraintCheckbox.tsx       ← US-2.5
│   │   └── SurgeonClearanceBanner.tsx   ← US-2.5
├── services/
│   ├── planGenerator.ts                 ← US-2.7 (basic version)
│   └── storage/
│       ├── profile.ts                   ← Profile CRUD
│       └── local.ts                     ← SQLite helpers
├── types/
│   └── profile.ts                       ← TypeScript interfaces
└── navigation/
    └── OnboardingNavigator.tsx          ← Stack navigator
```

---

## 📊 Database Schema for Week 2

### SQLite (Local Storage)

```sql
-- profiles table (local)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  profile_data TEXT, -- JSON string
  synced_at TEXT
);

-- Profile JSON structure:
{
  "goals": ["strength", "endurance"],
  "goal_weighting": { "primary": 70, "secondary": 30 },
  "equipment": ["dumbbells", "resistance_band"],
  "constraints": ["binder_aware", "heavy_binding", "no_jumping"],
  "surgery_flags": ["top_surgery"],
  "surgeon_cleared": true,
  "hrt_flags": ["on_hrt"],
  "preferred_minutes": [5, 15, 30, 45],
  "block_length": 1,
  "low_sensory_mode": false,
  "cloud_sync_enabled": false,
  "disclaimer_acknowledged_at": "2025-11-13T10:00:00Z"
}
```

### Supabase (Cloud Storage)

```sql
-- profiles table (Supabase)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  profile JSONB DEFAULT '{}'::jsonb
);

-- Row-Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);
```

---

## 🎯 User Story 2.1: "Why TransFitness?" Screen

**Estimated Time**: 4 hours  
**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete

### Step-by-Step Implementation

#### Step 1: Create TypeScript Interface (5 min)

**File**: `src/types/onboarding.ts`

```typescript
export interface OnboardingScreenProps {
  navigation: any; // Replace with proper navigation type
}

export interface WhyTransFitnessContent {
  headline: string;
  bullets: string[];
  ctaText: string;
  skipText: string;
}
```

**AI Prompt for Claude/Cursor**:
```
Create a TypeScript interface file at src/types/onboarding.ts with:
- OnboardingScreenProps interface with navigation prop
- WhyTransFitnessContent interface with headline, bullets, ctaText, skipText
```

**Checklist**:
- [ ] File created: `src/types/onboarding.ts`
- [ ] Interfaces exported correctly
- [ ] No TypeScript errors

---

#### Step 2: Create WhyTransFitness Screen Component (2 hours)

**File**: `src/screens/onboarding/WhyTransFitness.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Button } from 'react-native-paper';
import { OnboardingScreenProps } from '../../types/onboarding';

const CONTENT = {
  headline: 'Safety-first workouts for trans bodies',
  bullets: [
    'Binder-aware exercises with safe alternatives',
    '5-45 minute options for any energy level',
    'Privacy-first: your data stays on your device'
  ],
  ctaText: 'Get Started',
  skipText: 'I already know, let\'s go'
};

export default function WhyTransFitness({ navigation }: OnboardingScreenProps) {
  const handleGetStarted = () => {
    navigation.navigate('Disclaimer');
  };

  const handleSkip = () => {
    navigation.navigate('Disclaimer');
  };

  return (
    <View style={styles.container}>
      {/* Hero Image */}
      <View style={styles.heroContainer}>
        <Image
          source={require('../../../assets/onboarding-hero.png')}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </View>

      {/* Headline */}
      <Text style={styles.headline}>{CONTENT.headline}</Text>

      {/* Bullets */}
      <View style={styles.bulletsContainer}>
        {CONTENT.bullets.map((bullet, index) => (
          <View key={index} style={styles.bulletRow}>
            <Text style={styles.bulletIcon}>✓</Text>
            <Text style={styles.bulletText}>{bullet}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <Button
        mode="contained"
        onPress={handleGetStarted}
        style={styles.ctaButton}
      >
        {CONTENT.ctaText}
      </Button>

      {/* Skip Link */}
      <Button
        mode="text"
        onPress={handleSkip}
        style={styles.skipButton}
      >
        {CONTENT.skipText}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroImage: {
    width: 200,
    height: 200,
  },
  headline: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#1a1a1a',
  },
  bulletsContainer: {
    marginBottom: 32,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bulletIcon: {
    fontSize: 20,
    color: '#4CAF50',
    marginRight: 12,
  },
  bulletText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  ctaButton: {
    marginBottom: 16,
  },
  skipButton: {
    // Styles for skip button
  },
});
```

**AI Prompt for Claude/Cursor**:
```
Create a React Native screen component at src/screens/onboarding/WhyTransFitness.tsx with:
- Import React, View, Text, StyleSheet, Image from react-native
- Import Button from react-native-paper
- Import OnboardingScreenProps from types
- Create functional component with navigation prop
- Display headline: "Safety-first workouts for trans bodies"
- Display 3 bullet points with checkmark icons
- Add "Get Started" button that navigates to Disclaimer screen
- Add "I already know, let's go" skip link
- Use StyleSheet for styling (clean, modern design)
- Hero image placeholder at top (200x200)
```

**Checklist**:
- [ ] File created: `src/screens/onboarding/WhyTransFitness.tsx`
- [ ] Component renders without errors
- [ ] Headline displays correctly
- [ ] 3 bullets display with checkmark icons
- [ ] "Get Started" button navigates to Disclaimer
- [ ] "Skip" link navigates to Disclaimer
- [ ] Styling looks clean and modern
- [ ] Hero image placeholder shows (create dummy asset if needed)

---

#### Step 3: Add Low-Sensory Mode Support (30 min)

**File**: `src/screens/onboarding/WhyTransFitness.tsx` (update)

```typescript
import { useProfile } from '../../hooks/useProfile';

export default function WhyTransFitness({ navigation }: OnboardingScreenProps) {
  const { profile } = useProfile();
  const lowSensoryMode = profile?.low_sensory_mode || false;

  return (
    <View style={styles.container}>
      {/* Only show hero image if NOT in low-sensory mode */}
      {!lowSensoryMode && (
        <View style={styles.heroContainer}>
          <Image
            source={require('../../../assets/onboarding-hero.png')}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>
      )}
      
      {/* Rest of component... */}
    </View>
  );
}
```

**AI Prompt for Claude/Cursor**:
```
Update src/screens/onboarding/WhyTransFitness.tsx to:
- Import useProfile hook from hooks/useProfile
- Get profile.low_sensory_mode value
- Conditionally hide hero image if low_sensory_mode is true
- Keep all other functionality the same
```

**Checklist**:
- [ ] useProfile hook imported
- [ ] low_sensory_mode value retrieved
- [ ] Hero image hidden when low_sensory_mode = true
- [ ] Component still renders correctly in both modes

---

#### Step 4: Add to Navigation Stack (15 min)

**File**: `src/navigation/OnboardingNavigator.tsx`

```typescript
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WhyTransFitness from '../screens/onboarding/WhyTransFitness';
import Disclaimer from '../screens/onboarding/Disclaimer';

const Stack = createNativeStackNavigator();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="WhyTransFitness" component={WhyTransFitness} />
      <Stack.Screen name="Disclaimer" component={Disclaimer} />
      {/* More screens will be added later */}
    </Stack.Navigator>
  );
}
```

**AI Prompt for Claude/Cursor**:
```
Create or update src/navigation/OnboardingNavigator.tsx with:
- Import createNativeStackNavigator from @react-navigation/native-stack
- Import WhyTransFitness and Disclaimer screens
- Create stack navigator with headerShown: false
- Add WhyTransFitness as first screen
- Add Disclaimer as second screen
- Export as default
```

**Checklist**:
- [ ] File created: `src/navigation/OnboardingNavigator.tsx`
- [ ] Stack navigator configured
- [ ] WhyTransFitness screen added
- [ ] Disclaimer screen added (placeholder OK for now)
- [ ] Navigation works (can navigate from WhyTransFitness to Disclaimer)

---

#### Step 5: Test US-2.1 (30 min)

**Manual Testing Checklist**:
- [ ] Screen renders without errors
- [ ] Headline displays: "Safety-first workouts for trans bodies"
- [ ] 3 bullets display with checkmark icons
- [ ] "Get Started" button is visible and clickable
- [ ] Tapping "Get Started" navigates to Disclaimer screen
- [ ] "Skip" link is visible and clickable
- [ ] Tapping "Skip" navigates to Disclaimer screen
- [ ] Hero image displays (or is hidden in low-sensory mode)
- [ ] Layout looks good on iPhone 12 (390x844)
- [ ] Layout looks good on Pixel 5 (393x851)

**Automated Testing** (Optional):
```typescript
// __tests__/screens/WhyTransFitness.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import WhyTransFitness from '../../src/screens/onboarding/WhyTransFitness';

describe('WhyTransFitness', () => {
  it('renders headline correctly', () => {
    const { getByText } = render(<WhyTransFitness navigation={mockNavigation} />);
    expect(getByText('Safety-first workouts for trans bodies')).toBeTruthy();
  });

  it('navigates to Disclaimer on Get Started', () => {
    const mockNavigate = jest.fn();
    const { getByText } = render(
      <WhyTransFitness navigation={{ navigate: mockNavigate }} />
    );
    fireEvent.press(getByText('Get Started'));
    expect(mockNavigate).toHaveBeenCalledWith('Disclaimer');
  });
});
```

---

### US-2.1 Completion Checklist

- [ ] TypeScript interfaces created
- [ ] WhyTransFitness component created
- [ ] Low-sensory mode support added
- [ ] Navigation configured
- [ ] Manual testing passed
- [ ] (Optional) Automated tests written and passing
- [ ] Code committed to Git
- [ ] Ready to move to US-2.2

---

## 🎯 User Story 2.2: Non-Medical Disclaimer

**Estimated Time**: 3 hours  
**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete

### Step-by-Step Implementation

#### Step 1: Create Disclaimer Screen Component (1.5 hours)

**File**: `src/screens/onboarding/Disclaimer.tsx`

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button, Checkbox } from 'react-native-paper';
import { OnboardingScreenProps } from '../../types/onboarding';
import { updateProfile } from '../../services/storage/profile';

const DISCLAIMER_TEXT = `TransFitness provides general fitness information and is not a substitute for professional medical advice, diagnosis, or treatment.

Always consult your doctor or surgeon before starting any exercise program, especially if you have had surgery or are on HRT.

By using this app, you acknowledge that:
• This is not medical advice
• You should consult healthcare professionals before starting
• You use this app at your own risk`;

export default function Disclaimer({ navigation }: OnboardingScreenProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  const handleContinue = async () => {
    // Save disclaimer acknowledgment
    await updateProfile({
      disclaimer_acknowledged_at: new Date().toISOString()
    });

    // Navigate to Goals screen
    navigation.navigate('Goals');
  };

  const handleQuickStart = () => {
    // Navigate to Quick Start flow (US-2.3)
    navigation.navigate('QuickStart');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Headline */}
        <Text style={styles.headline}>Important: This is not medical advice</Text>

        {/* Disclaimer text */}
        <Text style={styles.disclaimerText}>{DISCLAIMER_TEXT}</Text>

        {/* Checkbox */}
        <View style={styles.checkboxContainer}>
          <Checkbox
            status={acknowledged ? 'checked' : 'unchecked'}
            onPress={() => setAcknowledged(!acknowledged)}
          />
          <Text style={styles.checkboxLabel}>I understand and agree</Text>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleContinue}
          disabled={!acknowledged}
          style={styles.continueButton}
        >
          Continue
        </Button>

        <Button
          mode="text"
          onPress={handleQuickStart}
          style={styles.quickStartButton}
        >
          Quick Start (Try a 5-min workout)
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 24,
  },
  headline: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  disclaimerText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  continueButton: {
    marginBottom: 12,
  },
  quickStartButton: {
    // Styles for Quick Start button
  },
});
```

**AI Prompt for Claude/Cursor**:
```
Create src/screens/onboarding/Disclaimer.tsx with:
- Import React, useState, View, Text, StyleSheet, ScrollView
- Import Button, Checkbox from react-native-paper
- Import OnboardingScreenProps, updateProfile
- Create functional component with navigation prop
- Display headline: "Important: This is not medical advice"
- Display disclaimer text (see DISCLAIMER_TEXT constant)
- Add checkbox: "I understand and agree"
- Add "Continue" button (disabled until checkbox checked)
- Add "Quick Start" button (always enabled)
- On Continue: save disclaimer_acknowledged_at to profile, navigate to Goals
- On Quick Start: navigate to QuickStart screen
- Use ScrollView for disclaimer text
- Use StyleSheet for styling
```

**Checklist**:
- [ ] File created: `src/screens/onboarding/Disclaimer.tsx`
- [ ] Component renders without errors
- [ ] Headline displays correctly
- [ ] Disclaimer text displays in ScrollView
- [ ] Checkbox toggles on/off
- [ ] "Continue" button disabled until checkbox checked
- [ ] "Continue" button enabled when checkbox checked
- [ ] Tapping "Continue" saves disclaimer_acknowledged_at
- [ ] Tapping "Continue" navigates to Goals screen
- [ ] "Quick Start" button always enabled
- [ ] Tapping "Quick Start" navigates to QuickStart screen

---

#### Step 2: Create Profile Storage Service (1 hour)

**File**: `src/services/storage/profile.ts`

```typescript
import * as SQLite from 'expo-sqlite';
import { supabase } from '../supabase';

const db = SQLite.openDatabase('transfitness.db');

export interface Profile {
  id: string;
  email: string;
  goals?: string[];
  goal_weighting?: { primary: number; secondary: number };
  equipment?: string[];
  constraints?: string[];
  surgery_flags?: string[];
  surgeon_cleared?: boolean;
  hrt_flags?: string[];
  preferred_minutes?: number[];
  block_length?: number;
  low_sensory_mode?: boolean;
  cloud_sync_enabled?: boolean;
  disclaimer_acknowledged_at?: string;
}

// Initialize database
export function initDatabase() {
  return new Promise<void>((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS profiles (
          id TEXT PRIMARY KEY,
          email TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          profile_data TEXT,
          synced_at TEXT
        );`,
        [],
        () => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
}

// Get current profile
export async function getProfile(): Promise<Profile | null> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM profiles LIMIT 1;',
        [],
        (_, { rows }) => {
          if (rows.length > 0) {
            const profile = JSON.parse(rows.item(0).profile_data);
            resolve(profile);
          } else {
            resolve(null);
          }
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
}

// Update profile
export async function updateProfile(updates: Partial<Profile>): Promise<void> {
  const currentProfile = await getProfile();
  const updatedProfile = { ...currentProfile, ...updates };

  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT OR REPLACE INTO profiles (id, email, profile_data, synced_at)
         VALUES (?, ?, ?, ?);`,
        [
          updatedProfile.id || 'default',
          updatedProfile.email || '',
          JSON.stringify(updatedProfile),
          null
        ],
        () => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });

  // TODO: Sync to Supabase if cloud_sync_enabled
}

// Sync profile to Supabase (optional cloud sync)
export async function syncProfileToCloud(profile: Profile): Promise<void> {
  if (!profile.cloud_sync_enabled) return;

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: profile.id,
      email: profile.email,
      profile: profile
    });

  if (error) throw error;

  // Update synced_at timestamp
  await updateProfile({ ...profile, synced_at: new Date().toISOString() });
}
```

**AI Prompt for Claude/Cursor**:
```
Create src/services/storage/profile.ts with:
- Import expo-sqlite
- Import supabase client
- Define Profile interface with all fields from BRD
- Create initDatabase function (creates profiles table)
- Create getProfile function (returns current profile from SQLite)
- Create updateProfile function (updates profile in SQLite)
- Create syncProfileToCloud function (syncs to Supabase if cloud_sync_enabled)
- Use SQLite for local-first storage
- Use Supabase for optional cloud sync
- Handle errors gracefully
```

**Checklist**:
- [ ] File created: `src/services/storage/profile.ts`
- [ ] Profile interface defined with all fields
- [ ] initDatabase function creates profiles table
- [ ] getProfile function retrieves profile from SQLite
- [ ] updateProfile function updates profile in SQLite
- [ ] syncProfileToCloud function syncs to Supabase (if enabled)
- [ ] No TypeScript errors
- [ ] Functions tested manually (can save/retrieve profile)

---

#### Step 3: Create useProfile Hook (30 min)

**File**: `src/hooks/useProfile.ts`

```typescript
import { useState, useEffect } from 'react';
import { getProfile, updateProfile as updateProfileService, Profile } from '../services/storage/profile';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const data = await getProfile();
      setProfile(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(updates: Partial<Profile>) {
    try {
      await updateProfileService(updates);
      await loadProfile(); // Reload profile
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile: loadProfile
  };
}
```

**AI Prompt for Claude/Cursor**:
```
Create src/hooks/useProfile.ts with:
- Import useState, useEffect from react
- Import getProfile, updateProfile, Profile from services
- Create useProfile hook that:
  - Loads profile on mount
  - Returns profile, loading, error states
  - Provides updateProfile function
  - Provides refreshProfile function
- Handle errors gracefully
```

**Checklist**:
- [ ] File created: `src/hooks/useProfile.ts`
- [ ] Hook loads profile on mount
- [ ] Hook returns profile, loading, error
- [ ] Hook provides updateProfile function
- [ ] Hook provides refreshProfile function
- [ ] No TypeScript errors

---

#### Step 4: Test US-2.2 (30 min)

**Manual Testing Checklist**:
- [ ] Screen renders without errors
- [ ] Headline displays: "Important: This is not medical advice"
- [ ] Disclaimer text displays in ScrollView
- [ ] Disclaimer text is scrollable (if long)
- [ ] Checkbox starts unchecked
- [ ] Tapping checkbox toggles it on/off
- [ ] "Continue" button disabled when checkbox unchecked
- [ ] "Continue" button enabled when checkbox checked
- [ ] Tapping "Continue" saves disclaimer_acknowledged_at to SQLite
- [ ] Tapping "Continue" navigates to Goals screen
- [ ] "Quick Start" button always enabled
- [ ] Tapping "Quick Start" navigates to QuickStart screen
- [ ] Layout looks good on iPhone 12
- [ ] Layout looks good on Pixel 5

---

### US-2.2 Completion Checklist

- [ ] Disclaimer component created
- [ ] Profile storage service created
- [ ] useProfile hook created
- [ ] Manual testing passed
- [ ] Code committed to Git
- [ ] Ready to move to US-2.3

---

## 🎯 User Story 2.3: Quick Start Option

**Estimated Time**: 6 hours  
**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete

### Step-by-Step Implementation

#### Step 1: Create Quick Start Screen (2 hours)

**File**: `src/screens/onboarding/QuickStart.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { generateQuickStartPlan } from '../../services/planGenerator';
import { Plan } from '../../types/plan';

export default function QuickStart({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Plan | null>(null);

  useEffect(() => {
    generatePlan();
  }, []);

  async function generatePlan() {
    try {
      setLoading(true);
      
      // Generate default 5-min bodyweight workout
      const quickPlan = await generateQuickStartPlan();
      setPlan(quickPlan);

      // Navigate to session player
      navigation.navigate('SessionPlayer', { plan: quickPlan });
    } catch (error) {
      console.error('Failed to generate Quick Start plan:', error);
      // TODO: Show error toast
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Creating your 5-minute workout...</Text>
      </View>
    );
  }

  return null; // Will navigate away automatically
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
```

**AI Prompt for Claude/Cursor**:
```
Create src/screens/onboarding/QuickStart.tsx with:
- Import React, useEffect, useState
- Import View, Text, StyleSheet, ActivityIndicator
- Import generateQuickStartPlan from services
- Create functional component with navigation prop
- On mount, call generateQuickStartPlan()
- Show loading spinner with "Creating your 5-minute workout..." text
- When plan generated, navigate to SessionPlayer with plan
- Handle errors gracefully (show error toast)
```

**Checklist**:
- [ ] File created: `src/screens/onboarding/QuickStart.tsx`
- [ ] Component renders loading state
- [ ] generateQuickStartPlan called on mount
- [ ] Loading spinner shows
- [ ] Loading text shows: "Creating your 5-minute workout..."
- [ ] Navigates to SessionPlayer when plan ready
- [ ] Errors handled gracefully

---

#### Step 2: Create Quick Start Plan Generator (3 hours)

**File**: `src/services/planGenerator.ts`

```typescript
import { Plan, Day, Workout, Exercise } from '../types/plan';
import { exerciseLibrary } from '../data/exercises';

// Generate Quick Start plan (5-min bodyweight workout)
export async function generateQuickStartPlan(): Promise<Plan> {
  // Filter for bodyweight, binder-aware exercises only
  const safeExercises = exerciseLibrary.filter(ex => 
    ex.equipment.includes('none') && 
    ex.binder_aware === true
  );

  // Select 10 exercises (variety: lower body, core, upper body)
  const selectedExercises = selectQuickStartExercises(safeExercises);

  // Create single day with 5-min variant only
  const day: Day = {
    dayNumber: 0,
    date: new Date(),
    variants: {
      5: {
        duration: 5,
        exercises: selectedExercises,
        totalMinutes: 5
      },
      15: null, // Not used in Quick Start
      30: null,
      45: null
    }
  };

  return {
    id: 'quick-start',
    blockLength: 1,
    startDate: new Date(),
    goals: ['wellness'],
    goalWeighting: { primary: 100, secondary: 0 },
    days: [day]
  };
}

// Select 10 exercises for Quick Start
function selectQuickStartExercises(exercises: Exercise[]): Exercise[] {
  const selected: Exercise[] = [];

  // Get 3 lower body exercises
  const lowerBody = exercises.filter(ex => ex.tags.includes('lower_body'));
  selected.push(...lowerBody.slice(0, 3));

  // Get 3 core exercises
  const core = exercises.filter(ex => ex.tags.includes('core'));
  selected.push(...core.slice(0, 3));

  // Get 2 upper body exercises
  const upperBody = exercises.filter(ex => ex.tags.includes('upper_body'));
  selected.push(...upperBody.slice(0, 2));

  // Get 2 cardio exercises
  const cardio = exercises.filter(ex => ex.tags.includes('cardio'));
  selected.push(...cardio.slice(0, 2));

  return selected;
}
```

**AI Prompt for Claude/Cursor**:
```
Create src/services/planGenerator.ts with:
- Import Plan, Day, Workout, Exercise types
- Import exerciseLibrary from data/exercises
- Create generateQuickStartPlan function that:
  - Filters for bodyweight, binder-aware exercises only
  - Selects 10 exercises (3 lower body, 3 core, 2 upper body, 2 cardio)
  - Creates single day with 5-min variant only
  - Returns Plan object with id 'quick-start'
- Create selectQuickStartExercises helper function
- Use simple selection logic (no complex algorithms yet)
```

**Checklist**:
- [ ] File created: `src/services/planGenerator.ts`
- [ ] generateQuickStartPlan function created
- [ ] Filters for bodyweight + binder-aware exercises
- [ ] Selects 10 exercises (3 lower, 3 core, 2 upper, 2 cardio)
- [ ] Creates Plan object with single day
- [ ] Returns Plan with id 'quick-start'
- [ ] No TypeScript errors
- [ ] Function tested manually (returns valid plan)

---

#### Step 3: Create Post-Quick Start Modal (1 hour)

**File**: `src/components/onboarding/PostQuickStartModal.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { Button } from 'react-native-paper';

interface Props {
  visible: boolean;
  onCompleteProfile: () => void;
  onSkip: () => void;
}

export default function PostQuickStartModal({ visible, onCompleteProfile, onSkip }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.headline}>Great work!</Text>
          <Text style={styles.body}>
            Complete your profile to save progress and get personalized plans.
          </Text>

          <Button
            mode="contained"
            onPress={onCompleteProfile}
            style={styles.primaryButton}
          >
            Complete Profile
          </Button>

          <Button
            mode="text"
            onPress={onSkip}
            style={styles.secondaryButton}
          >
            Skip
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
  },
  headline: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  primaryButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    // Styles
  },
});
```

**AI Prompt for Claude/Cursor**:
```
Create src/components/onboarding/PostQuickStartModal.tsx with:
- Import React, View, Text, StyleSheet, Modal
- Import Button from react-native-paper
- Create Props interface with visible, onCompleteProfile, onSkip
- Create functional component
- Display modal as bottom sheet (slide up animation)
- Show headline: "Great work!"
- Show body text about completing profile
- Add "Complete Profile" button (calls onCompleteProfile)
- Add "Skip" button (calls onSkip)
- Use semi-transparent overlay
- Use StyleSheet for styling
```

**Checklist**:
- [ ] File created: `src/components/onboarding/PostQuickStartModal.tsx`
- [ ] Modal renders as bottom sheet
- [ ] Headline displays: "Great work!"
- [ ] Body text displays correctly
- [ ] "Complete Profile" button works
- [ ] "Skip" button works
- [ ] Overlay is semi-transparent
- [ ] Slide-up animation works

---

#### Step 4: Integrate Modal into Session Player (placeholder for Week 4)

**Note**: This will be fully implemented in Week 4 (Session Player). For now, just add navigation logic.

**File**: `src/screens/SessionPlayer.tsx` (placeholder)

```typescript
// TODO: Week 4 - Show PostQuickStartModal after Quick Start completion
// if (plan.id === 'quick-start' && sessionCompleted) {
//   showPostQuickStartModal();
// }
```

---

#### Step 5: Test US-2.3 (30 min)

**Manual Testing Checklist**:
- [ ] Tapping "Quick Start" on Disclaimer screen navigates to QuickStart
- [ ] QuickStart screen shows loading spinner
- [ ] Loading text shows: "Creating your 5-minute workout..."
- [ ] Plan generates successfully (check console logs)
- [ ] Navigates to SessionPlayer with plan (placeholder OK for now)
- [ ] Plan has 10 exercises (3 lower, 3 core, 2 upper, 2 cardio)
- [ ] All exercises are bodyweight + binder-aware
- [ ] No errors in console
- [ ] Layout looks good on iPhone 12
- [ ] Layout looks good on Pixel 5

---

### US-2.3 Completion Checklist

- [ ] QuickStart screen created
- [ ] generateQuickStartPlan function created
- [ ] PostQuickStartModal component created
- [ ] Manual testing passed
- [ ] Code committed to Git
- [ ] Ready to move to US-2.4

---

## 🎯 User Stories 2.4-2.7: Intake Flow

**Note**: Due to length, I'll provide a condensed version. Full implementation follows same pattern as US-2.1-2.3.

### US-2.4: Goals (6 hours)
### US-2.5: Constraints (8 hours)
### US-2.6: Preferences (4 hours)
### US-2.7: Review & Generate (6 hours)

**See separate detailed breakdowns in next sections...**

---

## 📝 Week 2 Summary Checklist

### Screens Completed
- [ ] WhyTransFitness.tsx
- [ ] Disclaimer.tsx
- [ ] QuickStart.tsx
- [ ] Goals.tsx
- [ ] Constraints.tsx
- [ ] Preferences.tsx
- [ ] Review.tsx

### Components Completed
- [ ] ProgressIndicator.tsx
- [ ] GoalCard.tsx
- [ ] ConstraintCheckbox.tsx
- [ ] SurgeonClearanceBanner.tsx
- [ ] PostQuickStartModal.tsx

### Services Completed
- [ ] storage/profile.ts
- [ ] planGenerator.ts (basic version)

### Hooks Completed
- [ ] useProfile.ts

### Testing Completed
- [ ] All screens render without errors
- [ ] All navigation flows work
- [ ] Profile saves to SQLite correctly
- [ ] Quick Start generates plan correctly
- [ ] Onboarding flow completes end-to-end

### Ready for Week 3
- [ ] All Week 2 user stories complete
- [ ] Code committed and pushed to Git
- [ ] TestFlight/Internal Testing build deployed
- [ ] Feedback collected from dogfooding

---

## 🚀 Deployment Checklist (End of Week 2)

- [ ] Build iOS app: `eas build --platform ios --profile preview`
- [ ] Build Android app: `eas build --platform android --profile preview`
- [ ] Upload to TestFlight (iOS)
- [ ] Upload to Internal Testing (Android)
- [ ] Invite 5-10 beta testers
- [ ] Collect feedback
- [ ] Fix critical bugs before Week 3

---

## 📚 Resources for Week 2

**Documentation**:
- [React Navigation Docs](https://reactnavigation.org/docs/getting-started)
- [React Native Paper Docs](https://callstack.github.io/react-native-paper/)
- [Expo SQLite Docs](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

**AI Prompts**:
- Use the AI prompts provided in each step
- Customize prompts based on your specific needs
- Always review AI-generated code before committing

**Troubleshooting**:
- If navigation not working: Check navigator configuration
- If SQLite errors: Check database initialization
- If Supabase errors: Check RLS policies and auth
- If TypeScript errors: Check interface definitions

---

**End of Week 2 README**
