# Week 1: Project Setup & Initialization - COMPLETE GUIDE

**Goal**: Set up development environment and initialize project structure  
**Estimated Effort**: 8-12 hours  
**Status**: [ ] Not Started | [x] In Progress | [ ] Complete

---

## 📋 What You'll Build

By the end of Week 1, you will have:
- ✅ Complete development environment (Node.js, pnpm, Expo, VS Code)
- ✅ Expo project with TypeScript running on iOS + Android
- ✅ Supabase backend with database schema
- ✅ GitHub repository with version control
- ✅ SQLite database initialized
- ✅ 60-exercise library imported
- ✅ Basic navigation working
- ✅ App displaying "Week 1 Complete! 🎉"

---

## 🎯 Task 1.1: Install Development Tools (1 hour)

### Step 1: Install Node.js (30 min)

**macOS**:
```bash
# Using Homebrew (recommended)
brew install node@20

# Verify
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

**Windows**:
1. Download from [nodejs.org](https://nodejs.org) (LTS version)
2. Run installer
3. Verify in Command Prompt:
```cmd
node --version
npm --version
```

**Linux (Ubuntu/Debian)**:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

**Checklist**:
- [x] Node.js v20.x installed
- [x] npm v10.x installed

---

### Step 2: Install pnpm (15 min)

```bash
npm install -g pnpm
pnpm --version  # Should show 8.x.x or 9.x.x
```

**Checklist**:
- [x] pnpm installed

---

### Step 3: Install Expo CLI (15 min)

```bash
pnpm install -g expo-cli eas-cli
expo --version  # Should show 6.x.x or 7.x.x
eas --version   # Should show 5.x.x or higher
```

**Checklist**:
- [x] Expo CLI installed
- [x] EAS CLI installed

---

## 🎯 Task 1.2: Initialize Expo Project (2 hours)

### Step 1: Create Project (30 min)

```bash
# Create project directory
mkdir transfitness
cd transfitness

# Initialize Expo project with TypeScript
npx create-expo-app@latest . --template blank-typescript

# Install dependencies
pnpm install

# Test run
pnpm start
# Press 'w' to open in web browser (quick test)
# Press Ctrl+C to stop
```

**Checklist**:
- [x] Project created
- [x] Dependencies installed
- [ ] `pnpm start` runs without errors

---

### Step 2: Configure app.json (30 min)

Replace the entire contents of `app.json`:

```json
{
  "expo": {
    "name": "TransFitness",
    "slug": "transfitness",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.transfitness.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSUserTrackingUsageDescription": "We use analytics to improve the app. Your data is anonymized and never shared."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.transfitness.app",
      "versionCode": 1,
      "permissions": []
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-sqlite",
      "expo-av",
      "expo-notifications"
    ]
  }
}
```

**Checklist**:
- [x] app.json updated
- [x] Bundle IDs set (com.transfitness.app)

---

### Step 3: Install All Dependencies (1 hour)

```bash
# Core UI and Navigation
pnpm add react-native-paper react-native-safe-area-context
pnpm add @react-navigation/native @react-navigation/stack
pnpm add react-native-screens react-native-gesture-handler

# Expo Modules
pnpm add expo-sqlite expo-av expo-notifications
pnpm add expo-file-system expo-sharing expo-constants

# Backend and Data
pnpm add @supabase/supabase-js
pnpm add expo-in-app-purchases

# Utilities
pnpm add react-native-view-shot
pnpm add date-fns

# Development Dependencies
pnpm add -D @types/react @types/react-native
pnpm add -D typescript
pnpm add -D prettier eslint
pnpm add -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

**Checklist**:
- [x] All dependencies installed
- [x] No errors in terminal

---

## 🎯 Task 1.3: Set Up Supabase (1 hour)

### Step 1: Create Supabase Account (15 min)

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub
4. Create organization: "TransFitness"
5. Create project:
   - Name: `transfitness-prod`
   - Database password: **(Generate strong password, save in password manager)**
   - Region: **Choose closest to you**
   - Plan: **Free**

**Checklist**:
- [ ] Supabase account created
- [ ] Project created
- [ ] Password saved securely

---

### Step 2: Get API Credentials (15 min)

1. In Supabase Dashboard, go to **Settings** → **API**
2. Copy **Project URL** (e.g., `https://abcdefgh.supabase.co`)
3. Copy **anon public** key (long string starting with `eyJ...`)

Create `.env` file in project root:

```bash
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**IMPORTANT**: Add `.env` to `.gitignore`:

```bash
echo ".env" >> .gitignore
```

**Checklist**:
- [ ] `.env` file created with credentials
- [ ] `.env` added to `.gitignore`

---

### Step 3: Initialize Supabase Database Schema (30 min)

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New query**
3. Paste this COMPLETE SQL script:

```sql
-- ============================================
-- TransFitness Database Schema (Supabase)
-- ============================================

-- profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goals TEXT[],
  goal_weighting JSONB,
  constraints TEXT[],
  preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- plans table
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  block_length INTEGER,
  start_date DATE,
  plan_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  workout_data JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- purchases table (for founder offers and subscriptions)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  purchase_token TEXT,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- founder_offers table (inventory tracking)
CREATE TABLE IF NOT EXISTS founder_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT UNIQUE NOT NULL,
  total_inventory INTEGER NOT NULL,
  sold_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert founder offer inventory
INSERT INTO founder_offers (product_id, total_inventory, sold_count)
VALUES 
  ('lifetime_plus', 100, 0),
  ('founder_plus_annual', 300, 0),
  ('founder_core_annual', 300, 0)
ON CONFLICT (product_id) DO NOTHING;

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_offers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies - profiles
-- ============================================

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS Policies - plans
-- ============================================

CREATE POLICY "Users can view own plans" ON plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans" ON plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans" ON plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans" ON plans
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS Policies - sessions
-- ============================================

CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RLS Policies - purchases
-- ============================================

CREATE POLICY "Users can view own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases" ON purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS Policies - founder_offers
-- ============================================

CREATE POLICY "Anyone can view founder offers" ON founder_offers
  FOR SELECT USING (TRUE);

CREATE POLICY "Only authenticated users can update founder offers" ON founder_offers
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_plans_user_id ON plans(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_plan_id ON sessions(plan_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON purchases(product_id);

-- ============================================
-- Complete!
-- ============================================
```

4. Click **RUN**
5. Verify success: Go to **Table Editor** → You should see 5 tables

**Checklist**:
- [ ] SQL executed successfully
- [ ] 5 tables visible in Table Editor
- [ ] RLS enabled on all tables

---

## 🎯 Task 1.4: Set Up GitHub (1 hour)

### Step 1: Create Repository (15 min)

1. Go to [github.com](https://github.com)
2. Click **New repository**
3. Repository name: `transfitness`
4. Description: "Safety-first fitness app for trans and gender-diverse people"
5. Visibility: **Private**
6. ✅ Add README
7. ✅ Add .gitignore (Node template)
8. Click **Create repository**

**Checklist**:
- [x] Repository created

---

### Step 2: Connect Local Project (15 min)

```bash
# Initialize git
git init

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/transfitness.git

# Verify .gitignore includes these lines:
cat >> .gitignore << 'EOF'
node_modules/
.expo/
.expo-shared/
dist/
*.jks
*.p8
*.p12
*.key
*.mobileprovision
.env
.env.local
EOF

# Initial commit
git add .
git commit -m "Initial commit: Week 1 setup"
git branch -M main
git push -u origin main
```

**Checklist**:
- [x] Git initialized
- [x] Remote added
- [x] Code pushed to GitHub

---

### Step 3: Create Development Branch (15 min)

```bash
git checkout -b develop
git push -u origin develop
```

**Checklist**:
- [x] `develop` branch created

---

## 🎯 Task 1.5: Create Project Structure (2 hours)

### Step 1: Create Directories (15 min)

```bash
# Create all directories
mkdir -p src/{screens,components,services,hooks,types,data,utils,navigation}
mkdir -p config scripts

# Create placeholder files
touch src/types/index.ts
touch src/utils/database.ts
touch src/utils/supabase.ts
touch src/data/exercises.ts
touch src/navigation/AppNavigator.tsx
touch config/forbidden-phrases.json
touch config/required-flags.json
```

**Checklist**:
- [x] All directories created

---

### Step 2: Create TypeScript Types (30 min)

Create `src/types/index.ts` with this COMPLETE content:

```typescript
// ============================================
// TransFitness - TypeScript Type Definitions
// ============================================

// User Profile
export interface Profile {
  id: string;
  goals: Goal[];
  goalWeighting: { primary: number; secondary: number };
  constraints: Constraint[];
  preferences: Preferences;
}

export type Goal = 'strength' | 'cardio' | 'flexibility' | 'custom';
export type Constraint = 'binder_aware' | 'heavy_binding' | 'post_op' | 'hrt';

export interface Preferences {
  workoutDurations: (5 | 15 | 30 | 45)[];
  blockLength: 1 | 4;
  equipment: Equipment[];
  lowSensoryMode: boolean;
}

export type Equipment = 'bodyweight' | 'dumbbells' | 'bands' | 'kettlebell';

// Exercise
export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  equipment: Equipment[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  binder_aware: boolean;
  heavy_binding_safe: boolean;
  pelvic_floor_aware: boolean;
  pressure_level: 'low' | 'medium' | 'high';
  neutral_cues: string[];
  breathing_cues: string[];
  trans_notes: {
    binder?: string;
    pelvic_floor?: string;
  };
  swaps: Swap[];
  videoUrl: string;
  tags: string[];
}

export type ExerciseCategory = 
  | 'lower_body' 
  | 'core' 
  | 'upper_push' 
  | 'upper_pull' 
  | 'cardio' 
  | 'full_body';

export interface Swap {
  exerciseId: string;
  rationale: string;
}

// Plan
export interface Plan {
  id: string;
  blockLength: 1 | 4;
  startDate: Date;
  goals: Goal[];
  goalWeighting: { primary: number; secondary: number };
  days: Day[];
}

export interface Day {
  dayNumber: number;
  date: Date;
  variants: {
    5: Workout | null;
    15: Workout;
    30: Workout;
    45: Workout;
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

// Session
export interface Session {
  id: string;
  planId: string;
  workoutDuration: 5 | 15 | 30 | 45;
  exercises: CompletedExercise[];
  startedAt: Date;
  completedAt: Date;
  durationMinutes: number;
}

export interface CompletedExercise {
  exerciseId: string;
  sets: CompletedSet[];
  swappedTo: string | null;
  painFlagged: boolean;
}

export interface CompletedSet {
  rpe: number;
  reps: number;
  completedAt: Date;
}

// Subscription
export interface Subscription {
  tier: 'free' | 'core' | 'plus';
  status: 'active' | 'trial' | 'canceled' | 'expired';
  trialEndsAt: Date | null;
  renewsAt: Date | null;
  purchaseType: 'monthly' | 'annual' | 'lifetime' | null;
}

// Streak
export interface Streak {
  id: string;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: Date | null;
  graceDaysUsedThisWeek: number;
  weekStartDate: Date;
}
```

**Checklist**:
- [x] `src/types/index.ts` created
- [x] No TypeScript errors

---

### Step 3: Create Exercise Library Placeholder (15 min)

Create `src/data/exercises.ts`:

```typescript
import { Exercise } from '../types';

// Placeholder - we'll add full 60-exercise library next
export const exerciseLibrary: Exercise[] = [
  {
    id: '1',
    name: 'Bodyweight Squat',
    category: 'lower_body',
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    binder_aware: true,
    heavy_binding_safe: true,
    pelvic_floor_aware: true,
    pressure_level: 'low',
    neutral_cues: [
      'Feet hip-width apart',
      'Lower hips back and down',
      'Keep chest lifted'
    ],
    breathing_cues: [
      'Inhale on the way down',
      'Exhale on the way up'
    ],
    trans_notes: {
      binder: 'Safe for binding - minimal chest compression',
      pelvic_floor: 'Engage core gently, avoid bearing down'
    },
    swaps: [
      { exerciseId: '2', rationale: 'Lower impact option' }
    ],
    videoUrl: 'https://example.com/squat.mp4',
    tags: ['beginner', 'lower_body', 'bodyweight']
  }
];

export function getExerciseById(id: string): Exercise | undefined {
  return exerciseLibrary.find(ex => ex.id === id);
}

export function getExercisesByCategory(category: string): Exercise[] {
  return exerciseLibrary.filter(ex => ex.category === category);
}

export function getBinderAwareExercises(): Exercise[] {
  return exerciseLibrary.filter(ex => ex.binder_aware);
}

export function getHeavyBindingSafeExercises(): Exercise[] {
  return exerciseLibrary.filter(ex => ex.heavy_binding_safe);
}
```

**Note**: We'll add the full 60-exercise library in Task 1.6

**Checklist**:
- [x] `src/data/exercises.ts` created

---

### Step 4: Initialize SQLite Database (30 min)

Create `src/utils/database.ts`:

```typescript
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('transfitness.db');

export async function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // profiles table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS profiles (
          id TEXT PRIMARY KEY,
          goals TEXT,
          goal_weighting TEXT,
          constraints TEXT,
          preferences TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );`
      );

      // plans table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS plans (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          block_length INTEGER,
          start_date TEXT,
          plan_data TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );`
      );

      // sessions table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          plan_id TEXT,
          workout_data TEXT,
          started_at TEXT,
          completed_at TEXT,
          duration_minutes INTEGER,
          synced_at TEXT
        );`
      );

      // streaks table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS streaks (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          current_streak INTEGER DEFAULT 0,
          longest_streak INTEGER DEFAULT 0,
          last_workout_date TEXT,
          grace_days_used_this_week INTEGER DEFAULT 0,
          week_start_date TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );`
      );

      // weekly_aggregates table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS weekly_aggregates (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          week_start_date TEXT,
          total_minutes INTEGER DEFAULT 0,
          total_sessions INTEGER DEFAULT 0,
          avg_rpe REAL DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );`
      );
    }, (error) => {
      console.error('Database initialization failed:', error);
      reject(error);
    }, () => {
      console.log('✅ Database initialized successfully');
      resolve();
    });
  });
}

export { db };
```

**Checklist**:
- [x] `src/utils/database.ts` created

---

### Step 5: Initialize Supabase Client (15 min)

Create `src/utils/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.SUPABASE_URL || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Update `app.json`** to include environment variables:

```json
{
  "expo": {
    "name": "TransFitness",
    "slug": "transfitness",
    "version": "1.0.0",
    "extra": {
      "supabaseUrl": process.env.SUPABASE_URL,
      "supabaseAnonKey": process.env.SUPABASE_ANON_KEY
    },
    ...rest of config
  }
}
```

**Checklist**:
- [x] `src/utils/supabase.ts` created
- [x] `app.json` updated with `extra` field

---

### Step 6: Create Navigation (30 min)

Create `src/navigation/AppNavigator.tsx`:

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';

const Stack = createStackNavigator();

// Placeholder Home Screen
function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>TransFitness</Text>
      <Text style={styles.subtitle}>Week 1 Setup Complete! 🎉</Text>
      <Text style={styles.body}>
        Your development environment is ready.{'\n'}
        Next: Open WEEK_2_README.md to start building features!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'TransFitness' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

**Checklist**:
- [x] `src/navigation/AppNavigator.tsx` created

---

### Step 7: Update App.tsx (15 min)

Replace entire contents of `App.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/utils/database';

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    async function setup() {
      try {
        await initDatabase();
        console.log('✅ App setup complete');
        setDbInitialized(true);
      } catch (error) {
        console.error('❌ App setup failed:', error);
      }
    }
    setup();
  }, []);

  if (!dbInitialized) {
    return null; // Or add a loading screen
  }

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AppNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
```

**Checklist**:
- [x] `App.tsx` updated

---

## 🎯 Task 1.6: Add Full Exercise Library (1 hour)

### Create exercises.json (45 min)

Create `src/data/exercises.json` with this sample (you'll add all 60 later):

```json
[
  {
    "id": "1",
    "name": "Bodyweight Squat",
    "category": "lower_body",
    "equipment": ["bodyweight"],
    "difficulty": "beginner",
    "binder_aware": true,
    "heavy_binding_safe": true,
    "pelvic_floor_aware": true,
    "pressure_level": "low",
    "neutral_cues": [
      "Feet hip-width apart",
      "Lower hips back and down",
      "Keep chest lifted",
      "Press through heels to stand"
    ],
    "breathing_cues": [
      "Inhale on the way down",
      "Exhale on the way up"
    ],
    "trans_notes": {
      "binder": "Safe for binding - minimal chest compression during movement",
      "pelvic_floor": "Engage core gently, avoid bearing down"
    },
    "swaps": [
      {
        "exerciseId": "2",
        "rationale": "Lower impact option with less depth"
      },
      {
        "exerciseId": "3",
        "rationale": "Supported variation for balance concerns"
      }
    ],
    "videoUrl": "https://example.com/squat.mp4",
    "tags": ["beginner", "lower_body", "bodyweight", "fundamental"]
  }
]
```

**Note**: For now, just add 1-2 exercises as placeholders. You'll import the full 60-exercise library from the validation package later.

**Update `src/data/exercises.ts`**:

```typescript
import { Exercise } from '../types';
import exercisesData from './exercises.json';

export const exerciseLibrary: Exercise[] = exercisesData as Exercise[];

export function getExerciseById(id: string): Exercise | undefined {
  return exerciseLibrary.find(ex => ex.id === id);
}

export function getExercisesByCategory(category: string): Exercise[] {
  return exerciseLibrary.filter(ex => ex.category === category);
}

export function getBinderAwareExercises(): Exercise[] {
  return exerciseLibrary.filter(ex => ex.binder_aware);
}

export function getHeavyBindingSafeExercises(): Exercise[] {
  return exerciseLibrary.filter(ex => ex.heavy_binding_safe);
}

export function filterByConstraints(constraints: string[]): Exercise[] {
  return exerciseLibrary.filter(ex => {
    if (constraints.includes('binder_aware') && !ex.binder_aware) return false;
    if (constraints.includes('heavy_binding') && !ex.heavy_binding_safe) return false;
    return true;
  });
}
```

**Checklist**:
- [x] `src/data/exercises.json` created
- [x] `src/data/exercises.ts` updated to import JSON

---

## 🎯 Task 1.7: Create Safety Lint Config (30 min)

### Create forbidden-phrases.json

Create `config/forbidden-phrases.json`:

```json
[
  "ladies",
  "girls",
  "guys",
  "men",
  "women",
  "female",
  "male",
  "feminine",
  "masculine",
  "bikini body",
  "beach body",
  "manly",
  "girly"
]
```

### Create required-flags.json

Create `config/required-flags.json`:

```json
[
  "binder_aware",
  "heavy_binding_safe",
  "pelvic_floor_aware"
]
```

**Checklist**:
- [x] `config/forbidden-phrases.json` created
- [x] `config/required-flags.json` created

---

## 🎯 Task 1.8: Test the App (1 hour)

### Step 1: Run on iOS Simulator (macOS only) (30 min)

```bash
# Start Expo
pnpm start

# In the terminal, press 'i' to open iOS simulator
# Or scan QR code with Expo Go app on your iPhone
```

**Expected Result**:
- App opens
- Shows "TransFitness - Week 1 Setup Complete! 🎉"
- No errors in terminal

**Checklist**:
- [ ] App runs on iOS
- [ ] Success message displays
- [ ] No errors

---

### Step 2: Run on Android Emulator (30 min)

**First time setup**:
1. Install Android Studio
2. Open Android Studio → More Actions → Virtual Device Manager
3. Create Device → Pixel 5 → API 33 (Android 13)
4. Start emulator

**Run app**:
```bash
# Start Expo
pnpm start

# In the terminal, press 'a' to open Android emulator
# Or scan QR code with Expo Go app on your Android phone
```

**Expected Result**:
- App opens
- Shows "TransFitness - Week 1 Setup Complete! 🎉"
- No errors in terminal

**Checklist**:
- [ ] App runs on Android
- [ ] Success message displays
- [ ] No errors

---

## 🎯 Task 1.9: Commit Everything (15 min)

```bash
# Check status
git status

# Add all files
git add .

# Commit
git commit -m "Week 1 complete: Project setup and initialization"

# Push to develop branch
git push origin develop
```

**Checklist**:
- [x] All changes committed
- [x] Code pushed to GitHub

---

## 📝 Week 1 Complete Checklist

### Development Environment
- [x] Node.js v20.x installed
- [x] pnpm installed
- [x] Expo CLI + EAS CLI installed
- [ ] VS Code with extensions installed

### Project Setup
- [x] Expo project created with TypeScript
- [x] app.json configured
- [x] All dependencies installed (25+ packages)
- [x] No errors when running `pnpm install`

### Supabase Backend
- [ ] Supabase account created
- [ ] Project created
- [ ] Database schema initialized (5 tables)
- [ ] RLS policies enabled
- [ ] Credentials in `.env` file

### GitHub
- [x] Repository created
- [x] Local project connected
- [x] Initial commit pushed
- [x] `develop` branch created

### Project Structure
- [x] All directories created (screens, components, services, etc.)
- [x] TypeScript types defined (`src/types/index.ts`)
- [x] SQLite database initialized (`src/utils/database.ts`)
- [x] Supabase client initialized (`src/utils/supabase.ts`)
- [x] Exercise library placeholder created
- [x] Navigation set up (`src/navigation/AppNavigator.tsx`)
- [x] App.tsx updated

### Safety Lint Config
- [x] `config/forbidden-phrases.json` created
- [x] `config/required-flags.json` created

### Testing
- [ ] App runs on iOS simulator (or device)
- [ ] App runs on Android emulator (or device)
- [ ] "Week 1 Complete! 🎉" message displays
- [ ] No errors in console
- [ ] Database initializes successfully

### Git
- [x] All changes committed
- [x] Code pushed to GitHub

---

## 🎉 Congratulations - Week 1 Complete!

**You now have**:
- ✅ Complete development environment
- ✅ Expo project running on iOS + Android
- ✅ Supabase backend configured
- ✅ SQLite database initialized
- ✅ GitHub version control
- ✅ Project structure ready for features

**Next Steps**:
1. ✅ Verify "Week 1 Complete! 🎉" displays in your app
2. ✅ Commit and push all changes
3. ✅ Open `WEEK_2_README.md` and start building Onboarding & Intake

**You're ready to build!** 🚀💪🏳️‍⚧️

---

**End of Week 1 - Complete Guide**
