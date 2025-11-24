import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Slider from '@react-native-community/slider';
import { useWorkout } from '../../contexts/WorkoutContext';
import { palette, spacing, typography } from '../../theme';

type RootStackParamList = {
  ActiveWorkout: undefined;
  ExerciseDetail: { exerciseId: string };
  [key: string]: any;
};

type ActiveWorkoutScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ActiveWorkout'>;

export default function ActiveWorkoutScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ActiveWorkoutScreenNavigationProp>();
  const {
    workout,
    currentExerciseIndex,
    currentSetNumber,
    currentSetData,
    completedSets,
    workoutDuration,
    restTimer,
    isResting,
    totalExercises,
    exercisesCompleted,
    updateSetData,
    completeSet,
    skipSet,
    skipRest,
    pauseWorkout,
    resumeWorkout,
  } = useWorkout();
  
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  if (!workout) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>No active workout</Text>
      </View>
    );
  }
  
  const currentExercise = workout.main_workout[currentExerciseIndex];
  if (!currentExercise) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Exercise not found</Text>
      </View>
    );
  }

  const currentExerciseSets = completedSets.filter(
    s => s.exercise_id === currentExercise.exerciseId
  );
  
  const canCompleteSet = 
    currentSetData.reps > 0 && 
    currentSetData.weight >= 0 &&
    currentSetData.rpe > 0;
  
  const handleExit = () => {
    Alert.alert(
      'End Workout?',
      'Are you sure you want to end this workout? Your progress will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Workout', 
          style: 'destructive',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };
  
  const handleCompleteSet = async () => {
    await completeSet();
  };

  const handleSkipRest = () => {
    skipRest();
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get exercise name - could be from exercise_name property or need to fetch
  const exerciseName = currentExercise.exercise_name || 'Exercise';
  const targetMuscle = (currentExercise as any).target_muscle || 'Full body';
  const restSeconds = currentExercise.restSeconds || 60;
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit}>
          <Ionicons name="close" size={28} color={palette.white} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.workoutName} numberOfLines={1}>
            {workout.workout_name}
          </Text>
          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={16} color={palette.tealPrimary} />
            <Text style={styles.timerText}>{formatTime(workoutDuration)}</Text>
          </View>
        </View>
        
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color={palette.white} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Exercise {currentExerciseIndex + 1} of {totalExercises}
          </Text>
          
          <View style={styles.progressDots}>
            {Array.from({ length: totalExercises }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentExerciseIndex && styles.progressDotActive,
                  index < currentExerciseIndex && styles.progressDotComplete
                ]}
              />
            ))}
          </View>
        </View>
        
        {/* Current Exercise */}
        <View style={styles.exerciseHeader}>
          <Text style={styles.exerciseName}>{exerciseName}</Text>
          <Text style={styles.targetMuscle}>
            🎯 {targetMuscle}
          </Text>
        </View>
        
        <Text style={styles.setTitle}>Set {currentSetNumber} of {currentExercise.sets}</Text>
        
        {/* Set Logging Card */}
        <View style={styles.setCard}>
          {/* Reps */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Reps</Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.repsScroller}
              contentContainerStyle={styles.repsScrollerContent}
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map(rep => (
                <TouchableOpacity
                  key={rep}
                  style={[
                    styles.repButton,
                    currentSetData.reps === rep && styles.repButtonActive
                  ]}
                  onPress={() => updateSetData('reps', rep)}
                >
                  <Text style={[
                    styles.repButtonText,
                    currentSetData.reps === rep && styles.repButtonTextActive
                  ]}>
                    {rep}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          {/* Weight */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Weight (lbs)</Text>
            
            <View style={styles.weightContainer}>
              <TouchableOpacity
                style={styles.weightButton}
                onPress={() => updateSetData('weight', Math.max(0, currentSetData.weight - 5))}
              >
                <Text style={styles.weightButtonText}>-5</Text>
              </TouchableOpacity>
              
              <TextInput
                style={styles.weightInput}
                value={currentSetData.weight.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text) || 0;
                  updateSetData('weight', num);
                }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={palette.midGray}
              />
              
              <TouchableOpacity
                style={styles.weightButton}
                onPress={() => updateSetData('weight', currentSetData.weight + 5)}
              >
                <Text style={styles.weightButtonText}>+5</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* RPE */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>How hard was this set? (RPE)</Text>
            
            <View style={styles.rpeContainer}>
              <Slider
                style={styles.rpeSlider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={currentSetData.rpe}
                onValueChange={(value) => updateSetData('rpe', Math.round(value))}
                minimumTrackTintColor={palette.tealPrimary}
                maximumTrackTintColor={palette.border}
                thumbTintColor={palette.tealPrimary}
              />
              
              <View style={styles.rpeLabels}>
                <Text style={styles.rpeLabel}>Easy</Text>
                <Text style={styles.rpeValue}>{currentSetData.rpe}</Text>
                <Text style={styles.rpeLabel}>Max Effort</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Complete Set Button */}
        <TouchableOpacity
          style={[styles.completeButton, !canCompleteSet && styles.completeButtonDisabled]}
          onPress={handleCompleteSet}
          disabled={!canCompleteSet || isResting}
        >
          <Text style={styles.completeButtonText}>Complete Set ✓</Text>
        </TouchableOpacity>
        
        {/* Rest Timer */}
        {isResting && (
          <View style={styles.restTimerContainer}>
            <View style={styles.restTimer}>
              <Text style={styles.restTimerLabel}>⏱️ Rest Timer</Text>
              <Text style={styles.restTimerValue}>{formatTime(restTimer)}</Text>
              <Text style={styles.restTimerRecommended}>
                ({restSeconds}s recommended)
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.skipRestButton}
              onPress={handleSkipRest}
            >
              <Text style={styles.skipRestButtonText}>Skip Rest →</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Previous Sets */}
        {currentExerciseSets.length > 0 && (
          <View style={styles.previousSets}>
            <Text style={styles.previousSetsTitle}>Previous Sets</Text>
            
            {currentExerciseSets.map((set, index) => (
              <View key={index} style={styles.previousSet}>
                <Text style={styles.previousSetText}>
                  Set {set.set_number}: ✓ {set.reps} reps @ {set.weight} lbs • RPE {set.rpe}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Last Workout */}
        {(currentExercise as any).last_performed && (
          <View style={styles.lastWorkout}>
            <Text style={styles.lastWorkoutText}>
              💡 Last workout: {(currentExercise as any).last_performed.sets} × {(currentExercise as any).last_performed.reps} @ {(currentExercise as any).last_performed.weight} lbs
            </Text>
          </View>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={skipSet}
          >
            <Text style={styles.actionButtonText}>Skip Set</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('ExerciseDetail', { 
              exerciseId: currentExercise.exerciseId
            })}
          >
            <Text style={styles.actionButtonText}>View Exercise Details</Text>
          </TouchableOpacity>
        </View>
        
        {/* Emergency Button */}
        <TouchableOpacity style={styles.emergencyButton}>
          <Ionicons name="alert-circle" size={20} color={palette.error} />
          <Text style={styles.emergencyButtonText}>Stop if pain</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.deepBlack,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.m,
  },
  workoutName: {
    ...typography.bodyLarge,
    color: palette.white,
    fontWeight: '600',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  timerText: {
    ...typography.bodySmall,
    color: palette.tealPrimary,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.m,
    paddingBottom: spacing.xxl,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  progressText: {
    ...typography.body,
    color: palette.midGray,
    marginBottom: spacing.s,
  },
  progressDots: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.border,
  },
  progressDotActive: {
    backgroundColor: palette.tealPrimary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotComplete: {
    backgroundColor: palette.tealPrimary,
  },
  exerciseHeader: {
    marginBottom: spacing.m,
  },
  exerciseName: {
    ...typography.h2,
    color: palette.white,
    marginBottom: spacing.xs,
  },
  targetMuscle: {
    ...typography.body,
    color: palette.midGray,
  },
  setTitle: {
    ...typography.h3,
    color: palette.white,
    marginBottom: spacing.m,
  },
  setCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 16,
    padding: spacing.l,
    marginBottom: spacing.l,
  },
  inputSection: {
    marginBottom: spacing.l,
  },
  inputLabel: {
    ...typography.body,
    color: palette.white,
    marginBottom: spacing.s,
  },
  repsScroller: {
    flexGrow: 0,
  },
  repsScrollerContent: {
    paddingRight: spacing.l,
  },
  repButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: palette.deepBlack,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.s,
  },
  repButtonActive: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealPrimary + '20',
  },
  repButtonText: {
    ...typography.bodyLarge,
    color: palette.white,
  },
  repButtonTextActive: {
    color: palette.tealPrimary,
    fontWeight: '700',
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  weightButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: palette.deepBlack,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightButtonText: {
    ...typography.body,
    color: palette.white,
    fontWeight: '600',
  },
  weightInput: {
    flex: 1,
    ...typography.h2,
    color: palette.white,
    textAlign: 'center',
    backgroundColor: palette.deepBlack,
    borderWidth: 2,
    borderColor: palette.border,
    borderRadius: 12,
    padding: spacing.m,
  },
  rpeContainer: {
    marginTop: spacing.s,
  },
  rpeSlider: {
    width: '100%',
    height: 40,
    marginBottom: spacing.m,
  },
  rpeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rpeLabel: {
    ...typography.bodySmall,
    color: palette.midGray,
  },
  rpeValue: {
    ...typography.h2,
    color: palette.tealPrimary,
    fontWeight: '700',
  },
  completeButton: {
    backgroundColor: palette.tealPrimary,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  completeButtonDisabled: {
    opacity: 0.5,
  },
  completeButtonText: {
    ...typography.button,
    color: palette.deepBlack,
    fontWeight: '700',
    fontSize: 18,
  },
  restTimerContainer: {
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.l,
    marginBottom: spacing.l,
    alignItems: 'center',
  },
  restTimer: {
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  restTimerLabel: {
    ...typography.body,
    color: palette.white,
    marginBottom: spacing.xs,
  },
  restTimerValue: {
    ...typography.h1,
    color: palette.tealPrimary,
    fontSize: 48,
    fontWeight: '700',
  },
  restTimerRecommended: {
    ...typography.bodySmall,
    color: palette.midGray,
  },
  skipRestButton: {
    paddingVertical: spacing.s,
  },
  skipRestButtonText: {
    ...typography.body,
    color: palette.tealPrimary,
  },
  previousSets: {
    marginBottom: spacing.l,
  },
  previousSetsTitle: {
    ...typography.bodyLarge,
    color: palette.white,
    fontWeight: '600',
    marginBottom: spacing.s,
  },
  previousSet: {
    paddingVertical: spacing.s,
  },
  previousSetText: {
    ...typography.body,
    color: palette.lightGray,
  },
  lastWorkout: {
    backgroundColor: palette.tealPrimary + '20',
    borderRadius: 8,
    padding: spacing.m,
    marginBottom: spacing.l,
  },
  lastWorkoutText: {
    ...typography.body,
    color: palette.tealPrimary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.l,
  },
  actionButton: {
    flex: 1,
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
  },
  actionButtonText: {
    ...typography.body,
    color: palette.white,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    backgroundColor: palette.error + '20',
    borderRadius: 12,
    padding: spacing.m,
  },
  emergencyButtonText: {
    ...typography.body,
    color: palette.error,
    fontWeight: '600',
  },
  errorText: {
    ...typography.body,
    color: palette.error,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

