import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useWorkout } from '../../contexts/WorkoutContext';
import { palette, spacing, typography } from '../../theme';

type RootStackParamList = {
  WorkoutSummary: undefined;
  Home: undefined;
  DetailedStats: undefined;
  [key: string]: any;
};

type WorkoutSummaryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'WorkoutSummary'>;

type WorkoutRating = 'great' | 'good' | 'okay' | 'hard' | 'tough';

const RATING_OPTIONS: Array<{ value: WorkoutRating; emoji: string; label: string }> = [
  { value: 'great', emoji: '😊', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'hard', emoji: '😕', label: 'Hard' },
  { value: 'tough', emoji: '😣', label: 'Tough' },
];

export default function WorkoutSummaryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<WorkoutSummaryScreenNavigationProp>();
  const {
    workout,
    completedSets,
    workoutDuration,
    totalExercises,
    exercisesCompleted,
    completeWorkout,
  } = useWorkout();

  const [rating, setRating] = useState<WorkoutRating | null>(null);
  const [notes, setNotes] = useState('');

  // Calculate workout statistics
  const stats = useMemo(() => {
    if (!completedSets || completedSets.length === 0) {
      return {
        totalVolume: 0,
        avgRPE: 0,
        totalSets: 0,
        totalReps: 0,
        avgRest: 0,
      };
    }

    const totalVolume = completedSets.reduce((sum, set) => sum + (set.reps * set.weight), 0);
    const totalRPE = completedSets.reduce((sum, set) => sum + set.rpe, 0);
    const avgRPE = totalRPE / completedSets.length;
    const totalReps = completedSets.reduce((sum, set) => sum + set.reps, 0);
    
    // Calculate average rest time (assuming 60s default, would need actual rest data)
    const avgRest = 60; // This would come from actual rest timer data

    return {
      totalVolume,
      avgRPE: Math.round(avgRPE * 10) / 10, // Round to 1 decimal
      totalSets: completedSets.length,
      totalReps,
      avgRest,
    };
  }, [completedSets]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  // Format rest time
  const formatRestTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}:${secs.toString().padStart(2, '0')} min`;
  };

  // Get achievements (mock data for now)
  const achievements = useMemo(() => {
    const achievementsList = [];
    
    // Streak (mock - would come from user data)
    achievementsList.push({
      icon: '🔥',
      text: '8-day streak maintained!',
    });

    // PRs (mock - would check against previous workouts)
    if (stats.totalVolume > 2000) {
      achievementsList.push({
        icon: '💪',
        text: `New PR: Total Volume (${stats.totalVolume.toLocaleString()} lbs)`,
      });
    }

    // Safety milestones (mock - would check workout data)
    achievementsList.push({
      icon: '✓',
      text: 'No binding incidents',
    });

    return achievementsList;
  }, [stats]);

  // Get next workout (mock - would come from plan)
  const nextWorkout = useMemo(() => {
    // This would come from the user's plan
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return {
      name: 'Lower Body',
      day: dayNames[nextDate.getDay()],
      date: `${monthNames[nextDate.getMonth()]} ${nextDate.getDate()}`,
    };
  }, []);

  const handleDone = async () => {
    try {
      // Save workout rating and notes
      if (rating) {
        console.log('Workout rating:', rating);
      }
      if (notes.trim()) {
        console.log('Workout notes:', notes);
      }

      // Complete workout in context
      await completeWorkout();

      // Navigate to Home
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      console.error('Error completing workout:', error);
      Alert.alert('Error', 'Failed to save workout. Please try again.');
    }
  };

  const handleShareProgress = () => {
    // TODO: Implement share functionality
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  const handleViewDetailedStats = () => {
    // TODO: Navigate to detailed stats screen
    navigation.navigate('DetailedStats');
  };

  if (!workout) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>No workout data found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration Header */}
        <View style={styles.header}>
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <Text style={styles.celebrationText}>Workout Complete!</Text>
          <Text style={styles.durationText}>{formatDuration(workoutDuration)}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{exercisesCompleted}/{totalExercises}</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalVolume.toLocaleString()}</Text>
            <Text style={styles.statLabel}>lbs</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.avgRPE}</Text>
            <Text style={styles.statLabel}>RPE</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalSets}</Text>
            <Text style={styles.statLabel}>Sets</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalReps}</Text>
            <Text style={styles.statLabel}>Reps</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatRestTime(stats.avgRest)}</Text>
            <Text style={styles.statLabel}>Rest Avg</Text>
          </View>
        </View>

        {/* Achievements */}
        {achievements.length > 0 && (
          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>🏆 Achievements:</Text>
            {achievements.map((achievement, index) => (
              <View key={index} style={styles.achievementItem}>
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <Text style={styles.achievementText}>{achievement.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Workout Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>💬 How was your workout?</Text>
          <View style={styles.ratingOptions}>
            {RATING_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.ratingOption,
                  rating === option.value && styles.ratingOptionSelected,
                ]}
                onPress={() => setRating(option.value)}
              >
                <Text style={styles.ratingEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.ratingLabel,
                    rating === option.value && styles.ratingLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {rating === option.value && (
                  <View style={styles.radioButton}>
                    <View style={styles.radioButtonInner} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes Input */}
        <View style={styles.notesSection}>
          <TextInput
            style={styles.notesInput}
            placeholder="Add notes (optional)"
            placeholderTextColor={palette.midGray}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Next Workout Preview */}
        <View style={styles.nextWorkoutSection}>
          <Text style={styles.nextWorkoutText}>
            📅 Next: {nextWorkout.name} - {nextWorkout.day}, {nextWorkout.date}
          </Text>
        </View>

        {/* Done Button */}
        <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneButtonText}>Done ✓</Text>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShareProgress}
          >
            <Ionicons name="share-outline" size={20} color={palette.white} />
            <Text style={styles.actionButtonText}>Share Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewDetailedStats}
          >
            <Ionicons name="stats-chart-outline" size={20} color={palette.white} />
            <Text style={styles.actionButtonText}>View Detailed Stats</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.deepBlack,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.l,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: spacing.s,
  },
  celebrationText: {
    ...typography.h1,
    color: palette.white,
    marginBottom: spacing.xs,
  },
  durationText: {
    ...typography.bodyLarge,
    color: palette.midGray,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '30%',
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  statValue: {
    ...typography.h2,
    color: palette.tealPrimary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.bodySmall,
    color: palette.midGray,
  },
  achievementsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: palette.white,
    marginBottom: spacing.m,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  achievementIcon: {
    fontSize: 20,
    marginRight: spacing.s,
  },
  achievementText: {
    ...typography.body,
    color: palette.lightGray,
  },
  ratingSection: {
    marginBottom: spacing.xl,
  },
  ratingOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
    marginTop: spacing.m,
  },
  ratingOption: {
    flex: 1,
    minWidth: '18%',
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.border,
    position: 'relative',
  },
  ratingOptionSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealPrimary + '20',
  },
  ratingEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  ratingLabel: {
    ...typography.bodySmall,
    color: palette.midGray,
  },
  ratingLabelSelected: {
    color: palette.tealPrimary,
    fontWeight: '600',
  },
  radioButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.tealPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.tealPrimary,
  },
  notesSection: {
    marginBottom: spacing.xl,
  },
  notesInput: {
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    ...typography.body,
    color: palette.white,
    minHeight: 100,
    borderWidth: 1,
    borderColor: palette.border,
  },
  nextWorkoutSection: {
    backgroundColor: palette.tealPrimary + '20',
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  nextWorkoutText: {
    ...typography.bodyLarge,
    color: palette.tealPrimary,
  },
  doneButton: {
    backgroundColor: palette.tealPrimary,
    borderRadius: 12,
    padding: spacing.m,
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  doneButtonText: {
    ...typography.button,
    color: palette.deepBlack,
    fontWeight: '700',
    fontSize: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: palette.border,
  },
  actionButtonText: {
    ...typography.body,
    color: palette.white,
  },
  errorText: {
    ...typography.body,
    color: palette.error,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

