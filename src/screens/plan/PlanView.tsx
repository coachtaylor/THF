import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlan } from '../../hooks/usePlan';
import { useProfile } from '../../hooks/useProfile';
import WeeklyCalendar from '../../components/plan/WeeklyCalendar';
import DayCard from '../../components/plan/DayCard';
import TimeVariantSelector from '../../components/plan/TimeVariantSelector';
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
    // TODO: Navigate to SessionPlayer when implemented (Week 4)
    // navigation.navigate('SessionPlayer', { workout: currentWorkout });
    console.log('Start workout:', currentWorkout);
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
    <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.xs) }]}>
      {/* Header with Settings Button */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>My Plan</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Preferences')}
          style={styles.settingsButton}
          activeOpacity={0.8}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Weekly Calendar */}
      <WeeklyCalendar days={plan.days} selectedDay={selectedDay} onSelectDay={setSelectedDay} />

      {/* Time Variant Selector */}
      <TimeVariantSelector 
        selected={selectedVariant} 
        onSelect={setSelectedVariant}
      />

      {/* Day Card */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <DayCard
          day={currentDay}
          workout={currentWorkout}
          onStartWorkout={handleStartWorkout}
          onPreview={handlePreview}
          onExercisePress={handleExercisePress}
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
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    ...typography.h2,
    flex: 1,
    textAlign: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  settingsIcon: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
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

