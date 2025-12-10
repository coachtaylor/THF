import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { CommonActions } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { OnboardingStackParamList } from "../../../types/onboarding";
import { Plan, Day, Workout } from "../../../types/plan";
import { Exercise } from "../../../types";
import { colors, spacing, borderRadius } from "../../../theme/theme";
import { glassStyles, textStyles, buttonStyles } from "../../../theme/components";
import { useProfile } from "../../../hooks/useProfile";
import { getPlan } from "../../../services/storage/plan";
import { getExerciseLibrary } from "../../../data/exercises";
import { signalOnboardingComplete } from "../../../services/events/onboardingEvents";
import { Platform } from "react-native";
import { BetaSurveyModal, SurveyResponse } from "../../../components/feedback";
import {
  shouldShowOnboardingSurvey,
  saveSurveyResponse,
  trackSurveySkipped,
} from "../../../services/feedback";

type ProgramSetupNavigationProp = StackNavigationProp<OnboardingStackParamList>;

interface ProgramSetupProps {
  navigation: ProgramSetupNavigationProp;
}

const GOAL_LABELS: Record<string, string> = {
  feminization: "Feminization",
  masculinization: "Masculinization",
  general_fitness: "General Fitness",
  strength: "Strength",
  endurance: "Endurance"
};

export default function ProgramSetup({ navigation }: ProgramSetupProps) {
  const { profile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [exerciseMap, setExerciseMap] = useState<Record<string, Exercise>>({});
  const [error, setError] = useState<string | null>(null);
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyChecked, setSurveyChecked] = useState(false);

  useEffect(() => {
    if (profile) {
      loadProgram();
    }
  }, [profile]);

  // Check if we should show onboarding survey after program loads
  useEffect(() => {
    const checkSurvey = async () => {
      if (surveyChecked || loading || !plan) return;
      setSurveyChecked(true);

      try {
        const result = await shouldShowOnboardingSurvey();
        if (result.shouldShow) {
          // Small delay to let them see their program first
          setTimeout(() => {
            setShowSurvey(true);
          }, 3000);
        }
      } catch (error) {
        console.error('Error checking survey trigger:', error);
      }
    };

    checkSurvey();
  }, [surveyChecked, loading, plan]);

  const handleSurveySubmit = async (response: SurveyResponse) => {
    await saveSurveyResponse(response);
    setShowSurvey(false);
  };

  const handleSurveyClose = async () => {
    await trackSurveySkipped('onboarding');
    setShowSurvey(false);
  };

  const loadProgram = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      setError(null);

      // Load the plan from storage (already generated in Review screen)
      const savedPlan = await getPlan(profile.user_id);
      
      if (!savedPlan) {
        throw new Error("No plan found. Please generate a plan first.");
      }

      // Load exercise library to map exercise IDs to names
      const exercises = await getExerciseLibrary();
      const exerciseMap: Record<string, Exercise> = {};
      
      // Build exercise map from all workouts
      savedPlan.days.forEach(day => {
        Object.values(day.variants).forEach(workout => {
          if (workout) {
            workout.exercises.forEach(exerciseInstance => {
              if (!exerciseMap[exerciseInstance.exerciseId]) {
                const exercise = exercises.find(
                  ex => ex.id === exerciseInstance.exerciseId || 
                  String(ex.id) === String(exerciseInstance.exerciseId)
                );
                if (exercise) {
                  exerciseMap[exerciseInstance.exerciseId] = exercise;
                }
              }
            });
          }
        });
      });

      setExerciseMap(exerciseMap);
      setPlan(savedPlan as any);
      setLoading(false);
    } catch (err) {
      console.error("Error loading program:", err);
      setError(err instanceof Error ? err.message : "Failed to load program");
      setLoading(false);
    }
  };

  const getProgramName = (): string => {
    if (!profile) return "Your Program";
    
    const primary = profile.primary_goal;
    const secondary = profile.secondary_goals?.[0];
    
    if (primary === "strength" && secondary === "masculinization") return "Power Build";
    if (primary === "strength") return "Strength Foundation";
    if (primary === "masculinization") return "Masculine Build";
    if (primary === "feminization") return "Feminine Sculpt";
    if (primary === "endurance") return "Endurance Boost";
    return "Balanced Fitness";
  };

  const getWelcomeMessage = (): string => {
    const name = profile?.pronouns || "there";
    return `Welcome! Your personalized program is ready.`;
  };

  const getWorkoutForDay = (day: Day): Workout | null => {
    if (!profile) return null;
    const duration = profile.session_duration;
    
    // Find the closest matching duration variant
    if (duration <= 30 && day.variants[30]) return day.variants[30];
    if (duration <= 45 && day.variants[45]) return day.variants[45];
    if (duration <= 60 && day.variants[60]) return day.variants[60];
    if (day.variants[90]) return day.variants[90];
    
    // Fallback to first available
    return day.variants[30] || day.variants[45] || day.variants[60] || day.variants[90];
  };

  const getWorkoutBadges = (workout: Workout, day: Day): Array<{ label: string; color: 'cyan' | 'green' | 'blue' }> => {
    const badges: Array<{ label: string; color: 'cyan' | 'green' | 'blue' }> = [];
    
    if (!profile) return badges;
    
    // Primary goal badge (cyan)
    if (profile.primary_goal === "strength") {
      badges.push({ label: "STRENGTH FOCUS", color: 'cyan' });
    } else if (profile.primary_goal === "masculinization") {
      badges.push({ label: "MASCULINIZATION FOCUS", color: 'cyan' });
    } else if (profile.primary_goal === "feminization") {
      badges.push({ label: "FEMINIZATION FOCUS", color: 'cyan' });
    } else if (profile.primary_goal === "endurance") {
      badges.push({ label: "ENDURANCE FOCUS", color: 'cyan' });
    }

    // Safety badges (green)
    if (profile.binds_chest) {
      badges.push({ label: "BINDING-SAFE", color: 'green' });
    }

    // Check if workout has lower body focus (for pelvic floor safe badge)
    const hasLowerBodyFocus = workout.exercises.some(exerciseInstance => {
      const exercise = exerciseMap[exerciseInstance.exerciseId];
      if (!exercise) return false;
      const tags = exercise.tags || [];
      const pattern = exercise.pattern?.toLowerCase() || '';
      return tags.some(tag => tag.includes('lower') || tag.includes('leg') || tag.includes('glute')) ||
             pattern.includes('lower') || pattern.includes('leg') || pattern.includes('squat') || pattern.includes('deadlift');
    });
    
    if (hasLowerBodyFocus) {
      badges.push({ label: "PELVIC FLOOR SAFE", color: 'green' });
    }
    
    // HRT badge (blue)
    if (profile.on_hrt) {
      badges.push({ label: "HRT-OPTIMIZED", color: 'blue' });
    }

    return badges;
  };

  const getExerciseBadges = (exercise: Exercise | undefined): { type: 'secondary' | 'caution'; label: string }[] => {
    const badges: { type: 'secondary' | 'caution'; label: string }[] = [];
    
    if (!exercise || !profile) return badges;

    // Check if exercise matches secondary goal
    if (profile.secondary_goals && profile.secondary_goals.length > 0) {
      const secondaryGoal = profile.secondary_goals[0];
      const genderEmphasis = exercise.gender_goal_emphasis;
      const goal = exercise.goal?.toLowerCase() || '';
      const tags = exercise.tags || [];

      // Check for masculinization match
      if (secondaryGoal === "masculinization" && genderEmphasis && genderEmphasis.startsWith('masc_')) {
        badges.push({ type: 'secondary', label: 'MASCULINE' });
      }
      // Check for feminization match
      else if (secondaryGoal === "feminization" && genderEmphasis && genderEmphasis.startsWith('fem_')) {
        badges.push({ type: 'secondary', label: 'FEMININE' });
      }
      // Check for strength match
      else if (secondaryGoal === "strength" && (goal === 'strength' || tags.some(t => t.toLowerCase().includes('strength')))) {
        badges.push({ type: 'secondary', label: 'STRENGTH' });
      }
      // Check for endurance match
      else if (secondaryGoal === "endurance" && (goal === 'endurance' || goal === 'conditioning' || tags.some(t => t.toLowerCase().includes('cardio') || t.toLowerCase().includes('endurance')))) {
        badges.push({ type: 'secondary', label: 'CARDIO' });
      }
    }

    // Check for binding safety
    if (profile.binds_chest && !exercise.binder_aware) {
      badges.push({ type: 'caution', label: 'CAUTION' });
    }

    return badges;
  };

  const handleGetStarted = () => {
    if (!plan || !profile) return;
    
    // Get the first workout from the first day
    const firstDay = plan.days[0];
    if (!firstDay) return;
    
    const workout = getWorkoutForDay(firstDay);
    if (!workout) return;
    
    // Navigate to SessionPlayer with the first workout
    navigation.navigate("SessionPlayer", {
      workout: workout as any,
      planId: plan.id,
    });
  };

  const handleGoToDashboard = () => {
    // Signal the App component that onboarding is complete
    // This will trigger a re-render that switches from OnboardingNavigator to MainNavigator
    signalOnboardingComplete();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.cyan[500]} />
        <Text style={styles.loadingText}>Loading your program...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.semantic.error} />
          <Text style={styles.errorTitle}>Error Generating Program</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={loadProgram}
            style={buttonStyles.primary}
          >
            <Text style={buttonStyles.primaryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!plan || !profile) {
    return null;
  }

  // Get first week of workouts (up to 7 days)
  const weeklyWorkouts = plan.days.slice(0, Math.min(7, plan.days.length));

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      {/* Success Animation */}
      <View style={styles.successContainer}>
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={56} color={colors.cyan[500]} />
        </View>
      </View>

      {/* Welcome Message */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>Program Ready!</Text>
        <Text style={styles.welcomeText}>{getWelcomeMessage()}</Text>
      </View>

      {/* Program Card */}
      <View style={styles.programCard}>
        <View style={styles.programHeader}>
          <Ionicons name="sparkles" size={28} color={colors.cyan[500]} />
          <Text style={styles.programName}>{getProgramName()}</Text>
        </View>

        <Text style={styles.programDescription}>
          A {profile.workout_frequency}-day per week program designed specifically for your goals, experience level, and safety needs.
        </Text>

        {/* Program Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="calendar-outline" size={24} color={colors.cyan[500]} />
            <Text style={styles.statLabel}>FREQUENCY</Text>
            <Text style={styles.statValue}>{profile.workout_frequency} Days/Week</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="barbell-outline" size={24} color={colors.cyan[500]} />
            <Text style={styles.statLabel}>DURATION</Text>
            <Text style={styles.statValue}>{profile.session_duration} Minutes</Text>
          </View>
        </View>
      </View>

      {/* Key Features */}
      <View style={styles.featuresCard}>
        <Text style={styles.featuresTitle}>Your Program Includes</Text>
        <View style={styles.featuresList}>
          {[
            { icon: "heart-outline", text: "Exercises tailored to your body and goals" },
            { 
              icon: "shield-checkmark-outline", 
              text: profile.binds_chest 
                ? "Binding-safe exercise selection" 
                : profile.surgeries && profile.surgeries.length > 0
                ? "Post-surgical recovery protocols"
                : "Safety-first exercise selection"
            },
            { 
              icon: "calendar-outline", 
              text: profile.on_hrt 
                ? "HRT-aware programming and recovery" 
                : "Optimized recovery protocols"
            },
            { icon: "sparkles", text: "Progressive overload for sustainable results" }
          ].map((item, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name={item.icon as any} size={20} color={colors.cyan[500]} />
              <Text style={styles.featureText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Your Weekly Workouts */}
      <View style={styles.workoutsSection}>
        <Text style={styles.workoutsTitle}>Your Weekly Workouts</Text>
        
        <View style={styles.workoutsList}>
          {weeklyWorkouts.map((day, index) => {
            const workout = getWorkoutForDay(day);
            if (!workout) return null;

            const badges = getWorkoutBadges(workout, day);
            
            // Determine workout name based on exercise patterns
            const workoutName = (() => {
              const exercises = workout.exercises.map(ei => exerciseMap[ei.exerciseId]).filter(Boolean);
              const hasLowerBody = exercises.some(ex => {
                const tags = ex?.tags || [];
                const pattern = ex?.pattern?.toLowerCase() || '';
                return tags.some(t => t.includes('lower') || t.includes('leg') || t.includes('glute') || t.includes('squat') || t.includes('deadlift')) ||
                       pattern.includes('lower') || pattern.includes('leg') || pattern.includes('squat') || pattern.includes('deadlift');
              });
              const hasUpperBody = exercises.some(ex => {
                const tags = ex?.tags || [];
                const pattern = ex?.pattern?.toLowerCase() || '';
                return tags.some(t => t.includes('upper') || t.includes('push') || t.includes('pull') || t.includes('chest') || t.includes('shoulder')) ||
                       pattern.includes('upper') || pattern.includes('push') || pattern.includes('pull');
              });
              
              if (hasLowerBody && !hasUpperBody) return "Lower Body & Core";
              if (hasUpperBody && !hasLowerBody) return "Upper Body";
              if (index === 0) return "Full Body A";
              if (index === 2) return "Full Body B";
              return "Full Body";
            })();

            return (
              <View key={index} style={styles.workoutCard}>
                {/* Workout Header */}
                <View style={styles.workoutHeader}>
                  <View style={styles.workoutHeaderLeft}>
                    <Text style={styles.workoutDay}>DAY {day.dayNumber}</Text>
                    <Text style={styles.workoutName}>{workoutName}</Text>
                    <View style={styles.workoutMeta}>
                      <Ionicons name="time-outline" size={14} color={colors.text.tertiary} />
                      <Text style={styles.workoutMetaText}>{workout.duration} min</Text>
                      <Ionicons name="barbell-outline" size={14} color={colors.text.tertiary} style={styles.workoutMetaIcon} />
                      <Text style={styles.workoutMetaText}>{workout.exercises.length} exercises</Text>
                    </View>

                    {/* Workout Badges */}
                    {badges.length > 0 && (
                      <View style={styles.badgesContainer}>
                        {badges.map((badge, badgeIndex) => {
                          const badgeStyle = badge.color === 'cyan' 
                            ? styles.badgeCyan 
                            : badge.color === 'green' 
                            ? styles.badgeGreen 
                            : styles.badgeBlue;
                          const badgeTextStyle = badge.color === 'cyan'
                            ? styles.badgeTextCyan
                            : badge.color === 'green'
                            ? styles.badgeTextGreen
                            : styles.badgeTextBlue;
                          return (
                            <View key={badgeIndex} style={[styles.badge, badgeStyle]}>
                              <Text style={[styles.badgeText, badgeTextStyle]}>{badge.label}</Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                </View>

                {/* Exercise List */}
                <View style={styles.exercisesList}>
                  {workout.exercises.map((exerciseInstance, exerciseIndex) => {
                    const exercise = exerciseMap[exerciseInstance.exerciseId];
                    const exerciseName = exercise?.name || `Exercise ${exerciseInstance.exerciseId}`;
                    const exerciseBadges = getExerciseBadges(exercise);

                    return (
                      <View key={exerciseIndex} style={styles.exerciseRow}>
                        <View style={styles.exerciseLeft}>
                          <Text style={styles.exerciseName}>{exerciseName}</Text>
                          {exerciseBadges.map((badge, badgeIndex) => (
                            <View 
                              key={badgeIndex} 
                              style={badge.type === 'secondary' ? styles.exerciseBadge : styles.cautionBadge}
                            >
                              <Text style={badge.type === 'secondary' ? styles.exerciseBadgeText : styles.cautionBadgeText}>
                                {badge.label}
                              </Text>
                            </View>
                          ))}
                        </View>
                        <Text style={styles.exerciseSets}>
                          {exerciseInstance.sets} × {exerciseInstance.reps}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* CTA Buttons */}
      <View style={styles.ctaButtonsContainer}>
        <TouchableOpacity
          onPress={handleGoToDashboard}
          style={styles.dashboardButton}
          activeOpacity={0.8}
        >
          <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={handleGetStarted}
          style={styles.ctaButton}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaButtonText}>Start Your First Workout</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Beta Survey Modal */}
      <BetaSurveyModal
        visible={showSurvey}
        onClose={handleSurveyClose}
        onSubmit={handleSurveySubmit}
        triggerPoint="onboarding"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.deep,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.bg.raised,
    borderRadius: borderRadius['2xl'],
    padding: spacing['2xl'],
    gap: spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  modalTitle: {
    ...textStyles.h2,
    fontSize: 32,
    textAlign: 'center',
    color: colors.text.primary,
  },
  modalSubtitle: {
    ...textStyles.body,
    textAlign: 'center',
    color: colors.text.secondary,
    fontSize: 16,
    lineHeight: 24,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.cyan[500],
    borderRadius: borderRadius.full,
  },
  progressText: {
    ...textStyles.label,
    fontSize: 24,
    textAlign: 'center',
    color: colors.cyan[500],
    fontWeight: '700',
  },
  checklist: {
    gap: spacing.md,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checklistText: {
    ...textStyles.body,
    fontSize: 14,
    color: colors.text.tertiary,
  },
  checklistTextComplete: {
    color: colors.text.secondary,
  },
  errorContainer: {
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  errorTitle: {
    ...textStyles.h2,
    color: colors.semantic.error,
  },
  errorText: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  loadingText: {
    ...textStyles.body,
    color: colors.text.secondary,
    marginTop: spacing.lg,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.bg.deep,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
    gap: spacing.xl,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius['3xl'],
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    gap: spacing.md,
  },
  welcomeTitle: {
    ...textStyles.h1,
    fontSize: 36,
    textAlign: 'center',
    color: colors.text.primary,
  },
  welcomeText: {
    ...textStyles.body,
    fontSize: 18,
    textAlign: 'center',
    color: colors.text.secondary,
    lineHeight: 26,
  },
  programCard: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    padding: spacing['2xl'],
    borderRadius: borderRadius['3xl'],
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.15)',
    ...Platform.select({
      ios: {
        shadowColor: colors.cyan[500],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 32,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  programName: {
    ...textStyles.h2,
    fontSize: 24,
    fontWeight: '700',
    color: colors.cyan[500],
  },
  programDescription: {
    ...textStyles.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.base,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.glass.border,
    gap: spacing.xs,
  },
  statLabel: {
    ...textStyles.caption,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.text.tertiary,
  },
  statValue: {
    ...textStyles.h3,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  featuresCard: {
    ...glassStyles.card,
    padding: spacing.xl,
    borderRadius: borderRadius['2xl'],
  },
  featuresTitle: {
    ...textStyles.h3,
    fontSize: 18,
    marginBottom: spacing.base,
  },
  featuresList: {
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  featureText: {
    ...textStyles.body,
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
    color: colors.text.secondary,
  },
  workoutsSection: {
    gap: spacing.base,
  },
  workoutsTitle: {
    ...textStyles.h2,
    fontSize: 22,
    marginBottom: spacing.base,
  },
  workoutsList: {
    gap: spacing.base,
  },
  workoutCard: {
    ...glassStyles.card,
    padding: spacing.xl,
    borderRadius: borderRadius['2xl'],
    marginBottom: spacing.base,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  workoutHeaderLeft: {
    flex: 1,
  },
  workoutDay: {
    ...textStyles.caption,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  workoutName: {
    ...textStyles.h3,
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  workoutMetaIcon: {
    marginLeft: spacing.sm,
  },
  workoutMetaText: {
    ...textStyles.bodySmall,
    fontSize: 13,
    color: colors.text.tertiary,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  badgeCyan: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  badgeGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  badgeBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  badgeText: {
    ...textStyles.caption,
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  badgeTextCyan: {
    color: colors.cyan[500],
  },
  badgeTextGreen: {
    color: colors.semantic.success,
  },
  badgeTextBlue: {
    color: '#3b82f6',
  },
  exercisesList: {
    gap: spacing.sm,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.base,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: spacing.xs,
  },
  exerciseLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginRight: spacing.sm,
  },
  exerciseName: {
    ...textStyles.body,
    fontSize: 15,
    color: colors.text.primary,
  },
  exerciseBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  exerciseBadgeText: {
    ...textStyles.caption,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#f43f5e',
    fontWeight: '600',
  },
  cautionBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  cautionBadgeText: {
    ...textStyles.caption,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#f59e0b',
    fontWeight: '600',
  },
  exerciseSets: {
    ...textStyles.bodySmall,
    fontSize: 13,
    color: colors.text.tertiary,
  },
  ctaButtonsContainer: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  dashboardButton: {
    height: 56,
    borderRadius: borderRadius.base,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardButtonText: {
    ...textStyles.label,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  ctaButton: {
    ...buttonStyles.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    height: 60,
  },
  ctaButtonText: {
    ...buttonStyles.primaryText,
    fontSize: 16,
  },
});
