// src/screens/DevTestScreen.tsx
// Quick test screen you can add to your app right now - no Jest setup needed!

import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Platform } from 'react-native';
import { Button, Text, Card, ActivityIndicator } from 'react-native-paper';

// Import your test subjects
import { mapSupabaseExercises } from '../utils/supabaseMapper';
import { generateWorkout, filterByEquipment, filterByConstraints } from '../services/workoutGenerator';
import { onboardingToProfile, validateOnboardingData } from '../types/onboarding';

// Sample data (replace with your actual CSV data)
const SAMPLE_EXERCISE_DATA = [
  {
    id: 1,
    slug: 'bodyweight-squat',
    name: 'Bodyweight Squat',
    pattern: 'mobility',
    goal: 'mobility',
    difficulty: 'beginner' as const,
    equipment: '["bodyweight"]',
    binder_aware: true,
    pelvic_floor_safe: true,
    contraindications: '[]',
    cue_primary: 'Neutral ribs, long neck',
    cues: '["Exhale as you work","Keep range comfortable"]',
    breathing: 'Exhale on exertion',
    coaching_points: '["Stable base","Controlled tempo"]',
    common_errors: '["Shrugging","Rushing tempo"]',
    progressions: '["Add reps","Slow tempo"]',
    regressions: '["Reduce range","Use support"]',
    swaps: '["2","3"]',
    rep_5min: '2×8',
    rep_15min: '3×8-12',
    rep_30min: '4×8-10',
    rep_45min: '5×6-10',
    version: '1.0.0',
    last_reviewed_at: '2025-11-13',
    reviewer: 'TransFitness',
    created_at: '2025-11-17 08:07:24',
    updated_at: '2025-11-19 16:51:18',
    difficulty_source: 'import',
    binder_aware_source: 'rule',
    pelvic_floor_source: 'rule',
    flags_reviewed: false,
  },
  {
    id: 2,
    slug: 'glute-bridge',
    name: 'Glute Bridge',
    pattern: 'mobility',
    goal: 'mobility',
    difficulty: 'beginner' as const,
    equipment: '["bodyweight"]',
    binder_aware: true,
    pelvic_floor_safe: true,
    contraindications: '[]',
    cue_primary: 'Drive through heels',
    cues: '["Squeeze glutes","Keep core engaged"]',
    breathing: 'Exhale on lift',
    coaching_points: '["Stable base","Controlled tempo"]',
    common_errors: '["Arching back","Rushing tempo"]',
    progressions: '["Single leg","Add pause"]',
    regressions: '["Reduce range","Use support"]',
    swaps: '["1","3"]',
    rep_5min: '2×8',
    rep_15min: '3×8-12',
    rep_30min: '4×8-10',
    rep_45min: '5×6-10',
    version: '1.0.0',
    last_reviewed_at: '2025-11-13',
    reviewer: 'TransFitness',
    created_at: '2025-11-17 08:07:24',
    updated_at: '2025-11-19 16:51:18',
    difficulty_source: 'import',
    binder_aware_source: 'rule',
    pelvic_floor_source: 'rule',
    flags_reviewed: false,
  },
];

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: string;
}

export function DevTestScreen() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const runTests = async () => {
    setRunning(true);
    setResults([]);

    try {
      // TEST 1: Data Parsing
      addResult({
        name: 'Test 1: Data Parsing',
        passed: false,
        message: 'Running...',
      });

      const exercises = mapSupabaseExercises(SAMPLE_EXERCISE_DATA as any);
      const parsePass = exercises.length > 0 && Array.isArray(exercises[0].equipment);
      
      setResults(prev => prev.slice(0, -1).concat({
        name: 'Test 1: Data Parsing',
        passed: parsePass,
        message: parsePass ? 'Equipment parsed correctly' : 'Equipment parsing failed',
        details: `Parsed ${exercises.length} exercises. Equipment type: ${typeof exercises[0]?.equipment}`,
      }));

      // TEST 2: Equipment Filtering
      addResult({
        name: 'Test 2: Equipment Filter',
        passed: false,
        message: 'Running...',
      });

      const bodyweightExercises = filterByEquipment(exercises, ['bodyweight']);
      const filterPass = bodyweightExercises.length === 2; // Both sample exercises are bodyweight
      
      setResults(prev => prev.slice(0, -1).concat({
        name: 'Test 2: Equipment Filter',
        passed: filterPass,
        message: filterPass ? 'Filtering works correctly' : 'Filtering failed',
        details: `Found ${bodyweightExercises.length} bodyweight exercises (expected 2)`,
      }));

      // TEST 3: Constraint Filtering
      addResult({
        name: 'Test 3: Constraint Filter',
        passed: false,
        message: 'Running...',
      });

      const binderSafe = filterByConstraints(exercises, ['binder_aware']);
      const constraintPass = binderSafe.length === 2; // Both are binder aware
      
      setResults(prev => prev.slice(0, -1).concat({
        name: 'Test 3: Constraint Filter',
        passed: constraintPass,
        message: constraintPass ? 'Constraints work correctly' : 'Constraint filtering failed',
        details: `Found ${binderSafe.length} binder-aware exercises (expected 2)`,
      }));

      // TEST 4: Onboarding Validation
      addResult({
        name: 'Test 4: Onboarding Validation',
        passed: false,
        message: 'Running...',
      });

      const validData = {
        primaryGoal: 'strength' as const,
        fitnessLevel: 'beginner' as const,
        equipment: ['bodyweight' as const],
        binderAware: false,
        heavyBinding: false,
      };
      
      const validation = validateOnboardingData(validData);
      const validationPass = validation.valid;
      
      setResults(prev => prev.slice(0, -1).concat({
        name: 'Test 4: Onboarding Validation',
        passed: validationPass,
        message: validationPass ? 'Validation works' : 'Validation failed',
        details: validation.errors.length > 0 ? validation.errors.join(', ') : 'No errors',
      }));

      // TEST 5: Workout Generation
      addResult({
        name: 'Test 5: Workout Generation',
        passed: false,
        message: 'Running...',
      });

      const profile = onboardingToProfile(validData, 'test-user');
      const workout = generateWorkout(profile, 15, exercises);
      const workoutPass = workout.exercises.length > 0;
      
      setResults(prev => prev.slice(0, -1).concat({
        name: 'Test 5: Workout Generation',
        passed: workoutPass,
        message: workoutPass ? 'Workout generated successfully' : 'Workout generation failed',
        details: `Generated ${workout.exercises.length} exercises for 15min workout`,
      }));

      // Summary
      await new Promise(resolve => setTimeout(resolve, 500));
      const allPassed = results.every(r => r.passed);
      addResult({
        name: '✨ Summary',
        passed: allPassed,
        message: allPassed ? 'All tests passed!' : 'Some tests failed',
        details: `${results.filter(r => r.passed).length}/${results.length} tests passed`,
      });

    } catch (error) {
      addResult({
        name: 'ERROR',
        passed: false,
        message: 'Test suite crashed',
        details: String(error),
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.header}>
        <Card.Title 
          title="🧪 TransFitness Dev Tests"
          subtitle="Quick validation of workout generation"
        />
        <Card.Content>
          <Text variant="bodyMedium">
            These tests validate that:
          </Text>
          <Text variant="bodySmall" style={styles.listItem}>
            • Supabase data parses correctly
          </Text>
          <Text variant="bodySmall" style={styles.listItem}>
            • Equipment filtering works
          </Text>
          <Text variant="bodySmall" style={styles.listItem}>
            • Constraint filtering works
          </Text>
          <Text variant="bodySmall" style={styles.listItem}>
            • Onboarding validation works
          </Text>
          <Text variant="bodySmall" style={styles.listItem}>
            • Workout generation works
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button 
            mode="contained" 
            onPress={runTests}
            disabled={running}
            icon={running ? undefined : 'play'}
          >
            {running ? 'Running Tests...' : 'Run All Tests'}
          </Button>
        </Card.Actions>
      </Card>

      {running && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Running tests...</Text>
        </View>
      )}

      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          {results.map((result, index) => (
            <Card 
              key={index} 
              style={[
                styles.resultCard,
                result.passed ? styles.passCard : styles.failCard
              ]}
            >
              <Card.Content>
                <View style={styles.resultHeader}>
                  <Text 
                    variant="titleMedium" 
                    style={result.passed ? styles.passText : styles.failText}
                  >
                    {result.passed ? '✅' : '❌'} {result.name}
                  </Text>
                </View>
                <Text variant="bodyMedium" style={styles.resultMessage}>
                  {result.message}
                </Text>
                {result.details && (
                  <Text variant="bodySmall" style={styles.resultDetails}>
                    {result.details}
                  </Text>
                )}
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          💡 Tip: Update SAMPLE_EXERCISE_DATA with your actual Supabase data
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    margin: 16,
    marginBottom: 8,
  },
  listItem: {
    marginLeft: 16,
    marginTop: 4,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  resultsContainer: {
    padding: 16,
    paddingTop: 8,
  },
  resultCard: {
    marginBottom: 12,
  },
  passCard: {
    backgroundColor: '#e8f5e9',
  },
  failCard: {
    backgroundColor: '#ffebee',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  passText: {
    color: '#2e7d32',
  },
  failText: {
    color: '#c62828',
  },
  resultMessage: {
    marginBottom: 4,
  },
  resultDetails: {
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  footer: {
    padding: 16,
    marginTop: 16,
  },
  footerText: {
    textAlign: 'center',
    color: '#666',
  },
});