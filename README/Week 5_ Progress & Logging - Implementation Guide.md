# Week 5: Progress & Logging - Implementation Guide

**Goal**: User can view workout history, streaks, and progress  
**Estimated Effort**: 35-40 hours  
**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete

---

## 📋 Pre-Week Checklist

- [ ] Completed Week 4 (Session Player)
- [ ] Sessions save to SQLite correctly
- [ ] Session data includes RPE, swaps, pain flags
- [ ] All Week 4 tests passing

---

## 🗂️ File Structure for Week 5

```
src/
├── screens/
│   ├── Progress.tsx                     ← US-5.1
│   └── SessionDetail.tsx                ← US-5.2
├── components/
│   ├── progress/
│   │   ├── StreakDisplay.tsx            ← US-5.3
│   │   ├── WeeklyStats.tsx              ← US-5.4
│   │   ├── SessionCard.tsx              ← US-5.1
│   │   └── ExportButton.tsx             ← US-5.5
├── services/
│   ├── streakTracker.ts                 ← US-5.3
│   ├── weeklyAggregates.ts              ← US-5.4
│   ├── dataExport.ts                    ← US-5.5
│   └── dataDelete.ts                    ← US-5.5
```

---

## 📊 Database Schema for Week 5

### SQLite (Local Storage)

```sql
-- streaks table
CREATE TABLE IF NOT EXISTS streaks (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_workout_date TEXT,
  grace_days_used_this_week INTEGER DEFAULT 0,
  week_start_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- weekly_aggregates table
CREATE TABLE IF NOT EXISTS weekly_aggregates (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  week_start_date TEXT,
  total_minutes INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  avg_rpe REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎯 User Story 5.1: Progress Screen

**Estimated Time**: 8 hours  
**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete

### Implementation

**File**: `src/screens/Progress.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useSessions } from '../../hooks/useSessions';
import { useStreak } from '../../hooks/useStreak';
import { useWeeklyStats } from '../../hooks/useWeeklyStats';
import StreakDisplay from '../../components/progress/StreakDisplay';
import WeeklyStats from '../../components/progress/WeeklyStats';
import SessionCard from '../../components/progress/SessionCard';

export default function Progress({ navigation }: any) {
  const { sessions, loading } = useSessions();
  const { streak } = useStreak();
  const { weeklyStats } = useWeeklyStats();

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Streak Display */}
      <StreakDisplay streak={streak} />

      {/* Weekly Stats */}
      <WeeklyStats stats={weeklyStats} />

      {/* Session History */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Workout History</Text>
        {sessions.map(session => (
          <SessionCard
            key={session.id}
            session={session}
            onPress={() => navigation.navigate('SessionDetail', { sessionId: session.id })}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  historySection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
});
```

**AI Prompt**:
```
Create src/screens/Progress.tsx with:
- Import React, useState, useEffect
- Import View, ScrollView, StyleSheet
- Import Text from react-native-paper
- Import useSessions, useStreak, useWeeklyStats hooks
- Import StreakDisplay, WeeklyStats, SessionCard components
- Create functional component that:
  - Loads sessions, streak, weekly stats
  - Displays StreakDisplay component
  - Displays WeeklyStats component
  - Displays list of SessionCard components
  - Navigates to SessionDetail on card press
- Use StyleSheet for styling
```

**Checklist**:
- [ ] Progress.tsx created
- [ ] useSessions hook loads sessions
- [ ] useStreak hook loads streak
- [ ] useWeeklyStats hook loads weekly stats
- [ ] StreakDisplay component displays
- [ ] WeeklyStats component displays
- [ ] SessionCard list displays
- [ ] Tapping SessionCard navigates to SessionDetail
- [ ] Layout looks good

---

## 🎯 User Story 5.3: Streak Tracking with Forgiveness

**Estimated Time**: 8 hours  
**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete

### Implementation

**File**: `src/services/streakTracker.ts`

```typescript
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('transfitness.db');

export interface Streak {
  id: string;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: Date | null;
  graceDaysUsedThisWeek: number;
  weekStartDate: Date;
}

// Get current streak
export async function getStreak(userId: string): Promise<Streak | null> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM streaks WHERE user_id = ? LIMIT 1;',
        [userId],
        (_, { rows }) => {
          if (rows.length > 0) {
            const row = rows.item(0);
            resolve({
              id: row.id,
              currentStreak: row.current_streak,
              longestStreak: row.longest_streak,
              lastWorkoutDate: row.last_workout_date ? new Date(row.last_workout_date) : null,
              graceDaysUsedThisWeek: row.grace_days_used_this_week,
              weekStartDate: new Date(row.week_start_date)
            });
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

// Update streak after workout
export async function updateStreak(userId: string, sessionDate: Date): Promise<Streak> {
  const currentStreak = await getStreak(userId);
  
  if (!currentStreak) {
    // First workout ever
    return createStreak(userId, sessionDate);
  }

  const daysSinceLastWorkout = getDaysDifference(currentStreak.lastWorkoutDate!, sessionDate);
  const isNewWeek = isStartOfNewWeek(currentStreak.weekStartDate, sessionDate);

  // Reset grace days if new week
  if (isNewWeek) {
    currentStreak.graceDaysUsedThisWeek = 0;
    currentStreak.weekStartDate = getWeekStartDate(sessionDate);
  }

  if (daysSinceLastWorkout === 0) {
    // Same day, no change
    return currentStreak;
  } else if (daysSinceLastWorkout === 1) {
    // Next day, increment streak
    currentStreak.currentStreak += 1;
    currentStreak.longestStreak = Math.max(currentStreak.longestStreak, currentStreak.currentStreak);
  } else if (daysSinceLastWorkout === 2 && currentStreak.graceDaysUsedThisWeek < 1) {
    // Missed 1 day, use grace day (v2.2)
    currentStreak.graceDaysUsedThisWeek += 1;
    // Streak stays alive
  } else {
    // Streak broken, reset
    currentStreak.currentStreak = 1;
    currentStreak.graceDaysUsedThisWeek = 0;
  }

  currentStreak.lastWorkoutDate = sessionDate;

  // Save to database
  await saveStreak(userId, currentStreak);

  return currentStreak;
}

// Create initial streak
async function createStreak(userId: string, sessionDate: Date): Promise<Streak> {
  const streak: Streak = {
    id: generateId(),
    currentStreak: 1,
    longestStreak: 1,
    lastWorkoutDate: sessionDate,
    graceDaysUsedThisWeek: 0,
    weekStartDate: getWeekStartDate(sessionDate)
  };

  await saveStreak(userId, streak);
  return streak;
}

// Save streak to database
async function saveStreak(userId: string, streak: Streak): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT OR REPLACE INTO streaks 
         (id, user_id, current_streak, longest_streak, last_workout_date, grace_days_used_this_week, week_start_date)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          streak.id || generateId(),
          userId,
          streak.currentStreak,
          streak.longestStreak,
          streak.lastWorkoutDate?.toISOString() || null,
          streak.graceDaysUsedThisWeek,
          streak.weekStartDate.toISOString()
        ],
        () => resolve(),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
}

// Helper functions
function getDaysDifference(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function isStartOfNewWeek(weekStartDate: Date, currentDate: Date): boolean {
  return currentDate >= addDays(weekStartDate, 7);
}

function getWeekStartDate(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day; // Monday as start of week
  return new Date(date.setDate(diff));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function generateId(): string {
  return `streak_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

**AI Prompt**:
```
Create src/services/streakTracker.ts with:
- Import expo-sqlite
- Define Streak interface (id, currentStreak, longestStreak, lastWorkoutDate, graceDaysUsedThisWeek, weekStartDate)
- Create getStreak function (retrieves from SQLite)
- Create updateStreak function that:
  - Calculates days since last workout
  - If 0 days: no change
  - If 1 day: increment streak
  - If 2 days AND grace days available: use grace day, streak stays alive (v2.2)
  - If >2 days OR no grace days: reset streak to 1
  - Resets grace days at start of new week (Monday)
  - Updates longest streak if current > longest
  - Saves to database
- Create createStreak function (first workout)
- Create saveStreak function (saves to SQLite)
- Helper functions: getDaysDifference, isStartOfNewWeek, getWeekStartDate, addDays
```

**Checklist**:
- [ ] streakTracker.ts created
- [ ] getStreak function works
- [ ] updateStreak function works
- [ ] Streak increments on consecutive days
- [ ] Grace day used when 1 day missed (v2.2)
- [ ] Streak resets when >1 day missed
- [ ] Grace days reset at start of new week
- [ ] Longest streak tracked correctly
- [ ] Saves to SQLite correctly

---

## 🎯 User Story 5.5: Export & Delete Data

**Estimated Time**: 8 hours  
**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete

### Implementation

**File**: `src/services/dataExport.ts`

```typescript
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getProfile } from './storage/profile';
import { getSessions } from './storage/sessions';

export async function exportDataAsJSON(userId: string): Promise<void> {
  try {
    // 1. Gather all user data
    const profile = await getProfile();
    const sessions = await getSessions(userId);

    const exportData = {
      profile,
      sessions,
      exportedAt: new Date().toISOString()
    };

    // 2. Convert to JSON
    const json = JSON.stringify(exportData, null, 2);

    // 3. Save to file
    const filename = `transfitness_export_${Date.now()}.json`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    
    await FileSystem.writeAsStringAsync(fileUri, json);

    // 4. Share file
    await Sharing.shareAsync(fileUri);
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}

export async function exportDataAsCSV(userId: string): Promise<void> {
  try {
    // 1. Get sessions
    const sessions = await getSessions(userId);

    // 2. Convert to CSV
    const headers = 'Date,Duration (min),Exercises,Avg RPE\n';
    const rows = sessions.map(session => {
      const date = new Date(session.startedAt).toLocaleDateString();
      const duration = session.durationMinutes;
      const exercises = session.exercises.length;
      const avgRpe = session.exercises.reduce((sum, ex) => {
        const setRpes = ex.sets.map(s => s.rpe);
        const avgExRpe = setRpes.reduce((a, b) => a + b, 0) / setRpes.length;
        return sum + avgExRpe;
      }, 0) / session.exercises.length;

      return `${date},${duration},${exercises},${avgRpe.toFixed(1)}`;
    }).join('\n');

    const csv = headers + rows;

    // 3. Save to file
    const filename = `transfitness_export_${Date.now()}.csv`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    
    await FileSystem.writeAsStringAsync(fileUri, csv);

    // 4. Share file
    await Sharing.shareAsync(fileUri);
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}
```

**File**: `src/services/dataDelete.ts`

```typescript
import * as SQLite from 'expo-sqlite';
import { supabase } from './supabase';

const db = SQLite.openDatabase('transfitness.db');

export async function deleteAllData(userId: string): Promise<void> {
  try {
    // 1. Delete from local SQLite
    await deleteLocalData(userId);

    // 2. Delete from Supabase (if cloud sync enabled)
    await deleteCloudData(userId);

    console.log('All data deleted successfully');
  } catch (error) {
    console.error('Delete failed:', error);
    throw error;
  }
}

async function deleteLocalData(userId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // Delete all user data
      tx.executeSql('DELETE FROM profiles WHERE id = ?;', [userId]);
      tx.executeSql('DELETE FROM plans WHERE user_id = ?;', [userId]);
      tx.executeSql('DELETE FROM sessions WHERE user_id = ?;', [userId]);
      tx.executeSql('DELETE FROM streaks WHERE user_id = ?;', [userId]);
      tx.executeSql('DELETE FROM weekly_aggregates WHERE user_id = ?;', [userId]);
    }, (error) => {
      reject(error);
    }, () => {
      resolve();
    });
  });
}

async function deleteCloudData(userId: string): Promise<void> {
  // Delete from Supabase
  await supabase.from('profiles').delete().eq('id', userId);
  await supabase.from('plans').delete().eq('user_id', userId);
  await supabase.from('sessions').delete().eq('user_id', userId);
}
```

**AI Prompt**:
```
Create src/services/dataExport.ts with:
- Import expo-file-system, expo-sharing
- Import getProfile, getSessions
- Create exportDataAsJSON function that:
  - Gathers profile + sessions
  - Converts to JSON
  - Saves to file
  - Shares file (native share sheet)
- Create exportDataAsCSV function that:
  - Gathers sessions
  - Converts to CSV (headers: Date, Duration, Exercises, Avg RPE)
  - Saves to file
  - Shares file

Create src/services/dataDelete.ts with:
- Import expo-sqlite, supabase
- Create deleteAllData function that:
  - Deletes from local SQLite (profiles, plans, sessions, streaks, weekly_aggregates)
  - Deletes from Supabase (if cloud sync enabled)
  - Shows success toast with support link (v2.2)
```

**Checklist**:
- [ ] dataExport.ts created
- [ ] exportDataAsJSON works
- [ ] exportDataAsCSV works
- [ ] Files save correctly
- [ ] Native share sheet opens
- [ ] dataDelete.ts created
- [ ] deleteAllData deletes from SQLite
- [ ] deleteAllData deletes from Supabase
- [ ] Success toast shows with support link (v2.2)

---

## 📝 Week 5 Summary Checklist

### Screens Completed
- [ ] Progress.tsx
- [ ] SessionDetail.tsx

### Components Completed
- [ ] StreakDisplay.tsx
- [ ] WeeklyStats.tsx
- [ ] SessionCard.tsx
- [ ] ExportButton.tsx

### Services Completed
- [ ] streakTracker.ts (with grace day forgiveness)
- [ ] weeklyAggregates.ts
- [ ] dataExport.ts (JSON + CSV)
- [ ] dataDelete.ts (local + cloud)

### Testing Completed
- [ ] Progress screen displays correctly
- [ ] Streak tracking works (with forgiveness)
- [ ] Grace day used when 1 day missed
- [ ] Grace days reset weekly
- [ ] Weekly stats calculate correctly
- [ ] Export JSON works
- [ ] Export CSV works
- [ ] Delete all data works

### Ready for Week 6
- [ ] All Week 5 user stories complete
- [ ] Code committed and pushed to Git

---

**End of Week 5 README**
