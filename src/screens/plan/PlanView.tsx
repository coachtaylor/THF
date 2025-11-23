import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlan } from '../../hooks/usePlan';
import { useProfile } from '../../hooks/useProfile';
import WeeklyCalendar from '../../components/plan/WeeklyCalendar';
import DayCard from '../../components/plan/DayCard';
import { ExerciseDetailSheet } from '../../components/exercise/ExerciseDetailSheet';
import { palette, spacing, typography } from '../../theme';

interface PlanViewProps {
  navigation: any;
}

export default function PlanView({ navigation }: PlanViewProps) {
  const { plan, loading } = usePlan();
  const { profile } = useProfile();
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<5 | 15 | 30 | 45>(15);
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: Math.max(insets.top, spacing.l) }]}>
        <ActivityIndicator size="large" color={palette.tealPrimary} />
        <Text style={styles.loadingText}>Loading plan...</Text>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: Math.max(insets.top, spacing.l) }]}>
        <Text style={styles.errorText}>No plan found</Text>
        <Text style={styles.errorSubtext}>Please generate a plan from the Review screen</Text>
      </View>
    );
  }

  const currentDay = plan.days[selectedDay];
  const currentWorkout = currentDay.variants[selectedVariant];

  const handleStartWorkout = () => {
    navigation.navigate('SessionPlayer', { 
      workout: currentWorkout,
      planId: plan.id 
    });
  };

  const handlePreview = () => {
    // TODO: Navigate to WorkoutPreview when implemented
    // navigation.navigate('WorkoutPreview', { workout: currentWorkout });
    console.log('Preview workout:', currentWorkout);
  };

  const handleExercisePress = (exerciseId: string) => {
    // Convert string exerciseId to number for ExerciseDetailSheet
    const numericId = parseInt(exerciseId, 10);
    if (!isNaN(numericId)) {
      setSelectedExerciseId(numericId);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.s) }]}>
      {/* Header with Settings Button */}
      <View style={styles.header}>
        <View style={styles.testButtons}>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('TimerTest')}
            style={styles.testButton}
            labelStyle={styles.testButtonLabel}
            compact
          >
            Test Timer
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('ExerciseDisplayTest')}
            style={styles.testButton}
            labelStyle={styles.testButtonLabel}
            compact
          >
            Test Exercise
          </Button>
        </View>
        <Text style={styles.headerTitle}>My Plan</Text>
        <TouchableOpacity
          onPress={() => {
            // Navigate to Goals screen to edit preferences
            // Note: Goals screen is now GoalsAndPreferences combined
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              // If we can't go back, just log for now
              // TODO: Add proper settings/profile edit screen
              console.log('Menu - navigate to profile edit');
            }
          }}
          style={styles.menuButton}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconContainer}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Weekly Calendar */}
      <WeeklyCalendar days={plan.days} selectedDay={selectedDay} onSelectDay={setSelectedDay} />

      {/* Day Card */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <DayCard
          day={currentDay}
          workout={currentWorkout}
          onStartWorkout={handleStartWorkout}
          onPreview={handlePreview}
          onExercisePress={handleExercisePress}
          selectedVariant={selectedVariant}
          onSelectVariant={setSelectedVariant}
        />
      </ScrollView>

      {/* Exercise Detail Sheet */}
      {profile && (
        <ExerciseDetailSheet
          exerciseId={selectedExerciseId}
          profile={profile}
          onClose={() => setSelectedExerciseId(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.deepBlack,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
  },
  testButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  testButton: {
    borderColor: palette.tealPrimary,
    borderWidth: 1,
  },
  testButtonLabel: {
    color: palette.tealPrimary,
    fontSize: 12,
  },
  headerTitle: {
    ...typography.h2,
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconContainer: {
    width: 20,
    height: 14,
    justifyContent: 'space-between',
  },
  menuLine: {
    width: 20,
    height: 2,
    backgroundColor: palette.white,
    borderRadius: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.m,
    color: palette.lightGray,
  },
  errorText: {
    ...typography.h3,
    color: palette.error,
    marginBottom: spacing.s,
    textAlign: 'center',
  },
  errorSubtext: {
    ...typography.body,
    color: palette.midGray,
    textAlign: 'center',
  },
});

