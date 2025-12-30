import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import Slider from "@react-native-community/slider";
import { useWorkout, WorkoutPhase } from "../../contexts/WorkoutContext";
import { colors, spacing, borderRadius } from "../../theme/theme";
import { GlassCard, GlassButton } from "../../components/common";
import {
  WarmupExerciseCard,
  CooldownExerciseCard,
  PhaseTransition,
  WeightSuggestion,
  ExerciseDemoPlaceholder,
  PRCelebrationModal,
} from "../../components/workout";

type RootStackParamList = {
  ActiveWorkout: undefined;
  WorkoutSummary: undefined;
  ExerciseDetail: { exerciseId: string };
  [key: string]: any;
};

type ActiveWorkoutScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ActiveWorkout"
>;

// Animated rest timer with pulsing glow
function RestTimerOverlay({
  restTimer,
  restSeconds,
  onSkip,
  formatTime,
}: {
  restTimer: number;
  restSeconds: number;
  onSkip: () => void;
  formatTime: (s: number) => string;
}) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  return (
    <Animated.View
      style={[styles.restTimerContainer, { transform: [{ scale }] }]}
    >
      <LinearGradient
        colors={["#141418", "#0A0A0C"]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.restTimerGlow, { opacity: glowOpacity }]}>
        <LinearGradient
          colors={["rgba(91, 206, 250, 0.3)", "transparent"]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View style={styles.glassHighlight} />

      <View style={styles.restTimerContent}>
        <View style={styles.restTimerIconContainer}>
          <Ionicons name="time" size={24} color={colors.accent.primary} />
        </View>
        <Text style={styles.restTimerLabel}>Rest Timer</Text>
        <Text style={styles.restTimerValue}>{formatTime(restTimer)}</Text>
        <Text style={styles.restTimerRecommended}>
          {restSeconds}s recommended
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.skipRestButton,
          pressed && styles.buttonPressed,
        ]}
        onPress={onSkip}
      >
        <Text style={styles.skipRestButtonText}>Skip Rest</Text>
        <Ionicons
          name="arrow-forward"
          size={16}
          color={colors.accent.primary}
        />
      </Pressable>
    </Animated.View>
  );
}

// Progress dot component
function ProgressDot({
  isActive,
  isComplete,
}: {
  isActive: boolean;
  isComplete: boolean;
}) {
  if (isActive) {
    return (
      <View style={styles.progressDotActiveContainer}>
        <LinearGradient
          colors={[colors.accent.primary, colors.accent.primaryDark]}
          style={styles.progressDotActive}
        />
        <View style={styles.progressDotActiveGlow} />
      </View>
    );
  }

  if (isComplete) {
    return (
      <View style={styles.progressDotComplete}>
        <Ionicons name="checkmark" size={8} color={colors.text.inverse} />
      </View>
    );
  }

  return <View style={styles.progressDot} />;
}

export default function ActiveWorkoutScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ActiveWorkoutScreenNavigationProp>();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
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
    isWorkoutComplete,
    // Phase tracking
    currentPhase,
    phaseExerciseIndex,
    completedWarmupExercises,
    completedCooldownExercises,
    currentWarmupExercise,
    currentCooldownExercise,
    warmupExerciseCount,
    cooldownExerciseCount,
    // Exercise history for weight suggestions
    getExerciseLastPerformance,
    getSuggestedWeight,
    // Actions
    updateSetData,
    completeSet,
    skipSet,
    skipRest,
    pauseWorkout,
    resumeWorkout,
    completeWarmupExercise,
    skipWarmupPhase,
    completeCooldownExercise,
    skipCooldownPhase,
    // PR celebration
    prCelebration,
    dismissPRCelebration,
  } = useWorkout();

  // Phase transition state
  const [showPhaseTransition, setShowPhaseTransition] = useState(false);
  const [transitionFromPhase, setTransitionFromPhase] =
    useState<WorkoutPhase>("warmup");
  const [transitionToPhase, setTransitionToPhase] =
    useState<WorkoutPhase>("main");
  const prevPhaseRef = useRef<WorkoutPhase>(currentPhase);

  // Detect phase changes and show transition
  useEffect(() => {
    if (prevPhaseRef.current !== currentPhase && workout) {
      setTransitionFromPhase(prevPhaseRef.current);
      setTransitionToPhase(currentPhase);
      setShowPhaseTransition(true);
      prevPhaseRef.current = currentPhase;
    }
  }, [currentPhase, workout]);

  // Shimmer animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 400],
  });

  // Navigate to summary screen when workout is complete
  useEffect(() => {
    if (isWorkoutComplete && workout) {
      navigation.replace("WorkoutSummary");
    }
  }, [isWorkoutComplete, workout, navigation]);

  const [showExitConfirm, setShowExitConfirm] = useState(false);

  if (!workout) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <GlassCard variant="default" style={styles.errorCard}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>No active workout</Text>
        </GlassCard>
      </View>
    );
  }

  // Get current exercise only for main phase
  const currentExercise =
    currentPhase === "main" ? workout.main_workout[currentExerciseIndex] : null;

  // For main phase, verify exercise exists
  if (currentPhase === "main" && !currentExercise) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <GlassCard variant="default" style={styles.errorCard}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>Exercise not found</Text>
        </GlassCard>
      </View>
    );
  }

  // Get phase-specific display info
  const getPhaseTitle = (): string => {
    switch (currentPhase) {
      case "warmup":
        return "Warm-Up";
      case "cooldown":
        return "Cool-Down";
      default:
        return workout.workout_name;
    }
  };

  const getPhaseProgress = (): string => {
    switch (currentPhase) {
      case "warmup":
        return `Warm-up ${phaseExerciseIndex + 1} of ${warmupExerciseCount}`;
      case "cooldown":
        return `Cool-down ${phaseExerciseIndex + 1} of ${cooldownExerciseCount}`;
      default:
        return `Exercise ${currentExerciseIndex + 1} of ${totalExercises}`;
    }
  };

  const currentExerciseSets = currentExercise
    ? completedSets.filter((s) => s.exercise_id === currentExercise.exerciseId)
    : [];

  const canCompleteSet =
    currentSetData.reps > 0 &&
    currentSetData.weight >= 0 &&
    currentSetData.rpe > 0;

  const handleExit = () => {
    Alert.alert(
      "End Workout?",
      "Are you sure you want to end this workout? Your progress will be saved.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Workout",
          style: "destructive",
          onPress: () => navigation.goBack(),
        },
      ],
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
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Only get exercise info for main phase
  const exerciseName = currentExercise?.exercise_name || "Exercise";
  const targetMuscle = (currentExercise as any)?.target_muscle || "Full body";
  const restSeconds = currentExercise?.restSeconds || 60;

  // Render warmup phase content
  const renderWarmupContent = () => {
    const warmupExercises = workout.warm_up?.exercises || [];

    return (
      <>
        {/* Progress header */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>{getPhaseProgress()}</Text>
          <View style={styles.progressDots}>
            {warmupExercises.map((_, index) => (
              <ProgressDot
                key={index}
                isActive={index === phaseExerciseIndex}
                isComplete={completedWarmupExercises.includes(
                  warmupExercises[index]?.name,
                )}
              />
            ))}
          </View>
        </View>

        {/* Phase title */}
        <View style={styles.phaseHeader}>
          <View
            style={[
              styles.phaseIcon,
              { backgroundColor: colors.accent.primaryMuted },
            ]}
          >
            <Ionicons
              name="flame-outline"
              size={24}
              color={colors.accent.primary}
            />
          </View>
          <View>
            <Text style={styles.phaseTitle}>Warm-Up</Text>
            <Text style={styles.phaseSubtitle}>
              Prepare your body for the workout
            </Text>
          </View>
        </View>

        {/* Warmup exercises list */}
        {warmupExercises.map((exercise, index) => (
          <WarmupExerciseCard
            key={`warmup-${index}`}
            exercise={exercise}
            index={index}
            total={warmupExercises.length}
            isCompleted={completedWarmupExercises.includes(exercise.name)}
            isActive={index === phaseExerciseIndex}
            onComplete={completeWarmupExercise}
          />
        ))}

        {/* Skip warmup button */}
        <Pressable
          style={({ pressed }) => [
            styles.skipPhaseButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={skipWarmupPhase}
        >
          <Text style={styles.skipPhaseButtonText}>Skip Warm-Up</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.text.secondary}
          />
        </Pressable>
      </>
    );
  };

  // Render cooldown phase content
  const renderCooldownContent = () => {
    const cooldownExercises = workout.cool_down?.exercises || [];

    return (
      <>
        {/* Progress header */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>{getPhaseProgress()}</Text>
          <View style={styles.progressDots}>
            {cooldownExercises.map((_, index) => (
              <ProgressDot
                key={index}
                isActive={index === phaseExerciseIndex}
                isComplete={completedCooldownExercises.includes(
                  cooldownExercises[index]?.name,
                )}
              />
            ))}
          </View>
        </View>

        {/* Phase title */}
        <View style={styles.phaseHeader}>
          <View
            style={[
              styles.phaseIcon,
              { backgroundColor: "rgba(245, 169, 184, 0.2)" },
            ]}
          >
            <Ionicons
              name="leaf-outline"
              size={24}
              color={colors.accent.secondary}
            />
          </View>
          <View>
            <Text
              style={[styles.phaseTitle, { color: colors.accent.secondary }]}
            >
              Cool-Down
            </Text>
            <Text style={styles.phaseSubtitle}>Stretch and recover</Text>
          </View>
        </View>

        {/* Cooldown exercises list */}
        {cooldownExercises.map((exercise, index) => (
          <CooldownExerciseCard
            key={`cooldown-${index}`}
            exercise={exercise}
            index={index}
            total={cooldownExercises.length}
            isCompleted={completedCooldownExercises.includes(exercise.name)}
            isActive={index === phaseExerciseIndex}
            onComplete={completeCooldownExercise}
          />
        ))}

        {/* Skip cooldown button */}
        <Pressable
          style={({ pressed }) => [
            styles.skipPhaseButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={skipCooldownPhase}
        >
          <Text style={styles.skipPhaseButtonText}>Finish Workout</Text>
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={colors.text.secondary}
          />
        </Pressable>
      </>
    );
  };

  // Render main workout phase content
  const renderMainWorkoutContent = () => {
    if (!currentExercise) return null;

    return (
      <>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>{getPhaseProgress()}</Text>

          <View style={styles.progressDots}>
            {Array.from({ length: totalExercises }).map((_, index) => (
              <ProgressDot
                key={index}
                isActive={index === currentExerciseIndex}
                isComplete={index < currentExerciseIndex}
              />
            ))}
          </View>
        </View>

        {/* Current Exercise Header */}
        <View style={styles.exerciseHeader}>
          <View style={styles.exerciseIconContainer}>
            <LinearGradient
              colors={[colors.accent.primaryMuted, colors.glass.bg]}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name="barbell" size={20} color={colors.accent.primary} />
          </View>
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{exerciseName}</Text>
            <Text style={styles.targetMuscle}>{targetMuscle}</Text>
          </View>
        </View>

        {/* Exercise Demo Placeholder (shown only on first set) */}
        {currentSetNumber === 1 && (
          <ExerciseDemoPlaceholder
            exerciseName={exerciseName}
            targetMuscles={targetMuscle}
          />
        )}

        {/* Weight Suggestion based on history */}
        {currentSetNumber === 1 && (
          <WeightSuggestion
            lastPerformance={getExerciseLastPerformance(
              currentExercise.exerciseId,
            )}
            suggestedWeight={
              getSuggestedWeight(currentExercise.exerciseId) ||
              currentSetData.weight
            }
            currentWeight={currentSetData.weight}
            onApplySuggestion={(weight) => updateSetData("weight", weight)}
          />
        )}

        <View style={styles.setIndicator}>
          <View style={styles.setIndicatorLine} />
          <Text style={styles.setTitle}>
            Set {currentSetNumber} of {currentExercise.sets}
          </Text>
          <View style={styles.setIndicatorLine} />
        </View>

        {/* Set Logging Card */}
        <View style={styles.setCard}>
          <LinearGradient
            colors={["#141418", "#0A0A0C"]}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={["rgba(91, 206, 250, 0.15)", "transparent"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.cardGlow}
          />
          <Animated.View
            style={[
              styles.shimmerOverlay,
              { transform: [{ translateX: shimmerTranslate }] },
            ]}
          >
            <LinearGradient
              colors={[
                "transparent",
                "rgba(255, 255, 255, 0.03)",
                "transparent",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <View style={styles.glassHighlight} />

          {/* Reps */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Reps</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.repsScroller}
              contentContainerStyle={styles.repsScrollerContent}
            >
              {Array.from({ length: 20 }, (_, i) => i + 1).map((rep) => (
                <Pressable
                  key={rep}
                  style={({ pressed }) => [
                    styles.repButton,
                    currentSetData.reps === rep && styles.repButtonActive,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => updateSetData("reps", rep)}
                >
                  {currentSetData.reps === rep && (
                    <LinearGradient
                      colors={[colors.accent.primaryMuted, "transparent"]}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <Text
                    style={[
                      styles.repButtonText,
                      currentSetData.reps === rep && styles.repButtonTextActive,
                    ]}
                  >
                    {rep}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Weight */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Weight (lbs)</Text>

            <View style={styles.weightContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.weightButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() =>
                  updateSetData(
                    "weight",
                    Math.max(0, currentSetData.weight - 5),
                  )
                }
              >
                <Text style={styles.weightButtonText}>-5</Text>
              </Pressable>

              <View style={styles.weightInputContainer}>
                <TextInput
                  style={styles.weightInput}
                  value={currentSetData.weight.toString()}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 0;
                    updateSetData("weight", num);
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.text.tertiary}
                />
                <Text style={styles.weightUnit}>lbs</Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.weightButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() =>
                  updateSetData("weight", currentSetData.weight + 5)
                }
              >
                <Text style={styles.weightButtonText}>+5</Text>
              </Pressable>
            </View>
          </View>

          {/* RPE */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              Rate of Perceived Exertion (RPE)
            </Text>

            <View style={styles.rpeContainer}>
              <View style={styles.rpeValueContainer}>
                <Text style={styles.rpeValue}>{currentSetData.rpe}</Text>
                <Text style={styles.rpeSubtext}>
                  {currentSetData.rpe <= 3
                    ? "Light"
                    : currentSetData.rpe <= 5
                      ? "Moderate"
                      : currentSetData.rpe <= 7
                        ? "Hard"
                        : currentSetData.rpe <= 9
                          ? "Very Hard"
                          : "Max"}
                </Text>
              </View>

              <Slider
                style={styles.rpeSlider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={currentSetData.rpe}
                onValueChange={(value) =>
                  updateSetData("rpe", Math.round(value))
                }
                minimumTrackTintColor={colors.accent.primary}
                maximumTrackTintColor={colors.border.default}
                thumbTintColor={colors.accent.primary}
              />

              <View style={styles.rpeLabels}>
                <Text style={styles.rpeLabel}>1</Text>
                <Text style={styles.rpeLabel}>5</Text>
                <Text style={styles.rpeLabel}>10</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Complete Set Button */}
        <Pressable
          style={({ pressed }) => [
            styles.completeButton,
            !canCompleteSet && styles.completeButtonDisabled,
            pressed && canCompleteSet && !isResting && styles.buttonPressed,
          ]}
          onPress={handleCompleteSet}
          disabled={!canCompleteSet || isResting}
        >
          <LinearGradient
            colors={
              canCompleteSet && !isResting
                ? [colors.accent.primary, colors.accent.primaryDark]
                : [colors.glass.bg, colors.glass.bg]
            }
            style={StyleSheet.absoluteFill}
          />
          {canCompleteSet && !isResting && (
            <LinearGradient
              colors={["rgba(255, 255, 255, 0.2)", "transparent"]}
              style={styles.buttonGlassOverlay}
            />
          )}
          <Ionicons
            name="checkmark-circle"
            size={22}
            color={
              canCompleteSet && !isResting
                ? colors.text.inverse
                : colors.text.tertiary
            }
          />
          <Text
            style={[
              styles.completeButtonText,
              (!canCompleteSet || isResting) &&
                styles.completeButtonTextDisabled,
            ]}
          >
            Complete Set
          </Text>
        </Pressable>

        {/* Rest Timer */}
        {isResting && (
          <RestTimerOverlay
            restTimer={restTimer}
            restSeconds={restSeconds}
            onSkip={handleSkipRest}
            formatTime={formatTime}
          />
        )}

        {/* Previous Sets */}
        {currentExerciseSets.length > 0 && (
          <GlassCard variant="default" style={styles.previousSets}>
            <Text style={styles.previousSetsTitle}>Completed Sets</Text>

            {currentExerciseSets.map((set, index) => (
              <View key={index} style={styles.previousSet}>
                <View style={styles.previousSetBadge}>
                  <Text style={styles.previousSetBadgeText}>
                    {set.set_number}
                  </Text>
                </View>
                <View style={styles.previousSetInfo}>
                  <Text style={styles.previousSetReps}>{set.reps} reps</Text>
                  <Text style={styles.previousSetWeight}>
                    @ {set.weight} lbs
                  </Text>
                </View>
                <View style={styles.previousSetRpe}>
                  <Text style={styles.previousSetRpeLabel}>RPE</Text>
                  <Text style={styles.previousSetRpeValue}>{set.rpe}</Text>
                </View>
              </View>
            ))}
          </GlassCard>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={skipSet}
          >
            <Ionicons
              name="play-skip-forward"
              size={18}
              color={colors.text.secondary}
            />
            <Text style={styles.actionButtonText}>Skip Set</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() =>
              navigation.navigate("ExerciseDetail", {
                exerciseId: currentExercise.exerciseId,
              })
            }
          >
            <Ionicons
              name="information-circle"
              size={18}
              color={colors.text.secondary}
            />
            <Text style={styles.actionButtonText}>Exercise Info</Text>
          </Pressable>
        </View>

        {/* Emergency Button */}
        <Pressable
          style={({ pressed }) => [
            styles.emergencyButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <LinearGradient
            colors={["rgba(245, 169, 184, 0.15)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons
            name="alert-circle"
            size={20}
            color={colors.accent.secondary}
          />
          <Text style={styles.emergencyButtonText}>
            Stop if experiencing pain or discomfort
          </Text>
        </Pressable>
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={[colors.bg.primary, colors.bg.secondary]}
        style={StyleSheet.absoluteFill}
      />

      {/* Phase Transition Overlay */}
      <PhaseTransition
        fromPhase={transitionFromPhase}
        toPhase={transitionToPhase}
        visible={showPhaseTransition}
        onComplete={() => setShowPhaseTransition(false)}
      />

      {/* PR Celebration Modal */}
      {prCelebration && (
        <PRCelebrationModal
          prResult={prCelebration}
          visible={!!prCelebration}
          onDismiss={dismissPRCelebration}
        />
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.s }]}>
        <Pressable
          onPress={handleExit}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.buttonPressed,
          ]}
          hitSlop={8}
        >
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.workoutName} numberOfLines={1}>
            {getPhaseTitle()}
          </Text>
          <View style={styles.timerContainer}>
            <Ionicons
              name="time-outline"
              size={14}
              color={colors.accent.primary}
            />
            <Text style={styles.timerText}>{formatTime(workoutDuration)}</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.buttonPressed,
          ]}
          hitSlop={8}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={20}
            color={colors.text.primary}
          />
        </Pressable>
      </View>

      {/* Phase indicator pills */}
      <View style={styles.phaseIndicatorRow}>
        <View
          style={[
            styles.phasePill,
            currentPhase === "warmup" && styles.phasePillActive,
            (currentPhase === "main" || currentPhase === "cooldown") &&
              styles.phasePillComplete,
          ]}
        >
          <Ionicons
            name="flame-outline"
            size={14}
            color={
              currentPhase === "warmup"
                ? colors.accent.primary
                : colors.text.tertiary
            }
          />
          <Text
            style={[
              styles.phasePillText,
              currentPhase === "warmup" && styles.phasePillTextActive,
            ]}
          >
            Warm-Up
          </Text>
        </View>

        <View style={styles.phaseConnector} />

        <View
          style={[
            styles.phasePill,
            currentPhase === "main" && styles.phasePillActive,
            currentPhase === "cooldown" && styles.phasePillComplete,
          ]}
        >
          <Ionicons
            name="barbell-outline"
            size={14}
            color={
              currentPhase === "main"
                ? colors.accent.primary
                : colors.text.tertiary
            }
          />
          <Text
            style={[
              styles.phasePillText,
              currentPhase === "main" && styles.phasePillTextActive,
            ]}
          >
            Workout
          </Text>
        </View>

        <View style={styles.phaseConnector} />

        <View
          style={[
            styles.phasePill,
            currentPhase === "cooldown" && styles.phasePillActivePink,
          ]}
        >
          <Ionicons
            name="leaf-outline"
            size={14}
            color={
              currentPhase === "cooldown"
                ? colors.accent.secondary
                : colors.text.tertiary
            }
          />
          <Text
            style={[
              styles.phasePillText,
              currentPhase === "cooldown" && styles.phasePillTextActivePink,
            ]}
          >
            Cool-Down
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Render phase-specific content */}
        {currentPhase === "warmup" && renderWarmupContent()}
        {currentPhase === "main" && renderMainWorkoutContent()}
        {currentPhase === "cooldown" && renderCooldownContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.glass.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: spacing.m,
  },
  workoutName: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  timerText: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "600",
    color: colors.accent.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.l,
  },
  progressContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  progressText: {
    fontFamily: "Poppins",
    fontSize: 13,
    color: colors.text.tertiary,
    marginBottom: spacing.s,
  },
  progressDots: {
    flexDirection: "row",
    gap: spacing.s,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border.default,
  },
  progressDotActiveContainer: {
    width: 12,
    height: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  progressDotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotActiveGlow: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent.primary,
    opacity: 0.3,
  },
  progressDotComplete: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.m,
    marginBottom: spacing.l,
  },
  exerciseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontFamily: "Poppins",
    fontSize: 22,
    fontWeight: "600",
    color: colors.text.primary,
    letterSpacing: -0.3,
    marginBottom: spacing.xxs,
  },
  targetMuscle: {
    fontFamily: "Poppins",
    fontSize: 14,
    color: colors.text.secondary,
  },
  setIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.m,
    marginBottom: spacing.l,
  },
  setIndicatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.default,
  },
  setTitle: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.secondary,
  },
  setCard: {
    borderRadius: borderRadius["2xl"],
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
    overflow: "hidden",
    marginBottom: spacing.l,
    padding: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: { elevation: 6 },
    }),
  },
  cardGlow: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "60%",
    height: "60%",
  },
  shimmerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 200,
  },
  glassHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  inputSection: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.primary,
    marginBottom: spacing.m,
  },
  repsScroller: {
    flexGrow: 0,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  repsScrollerContent: {
    gap: spacing.s,
    paddingRight: spacing.xl,
  },
  repButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  repButtonActive: {
    borderColor: colors.accent.primary,
  },
  repButtonText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "500",
    color: colors.text.secondary,
  },
  repButtonTextActive: {
    color: colors.accent.primary,
    fontWeight: "700",
  },
  weightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.m,
  },
  weightButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: "center",
    justifyContent: "center",
  },
  weightButtonText: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  weightInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.m,
  },
  weightInput: {
    flex: 1,
    fontFamily: "Poppins",
    fontSize: 28,
    fontWeight: "600",
    color: colors.text.primary,
    textAlign: "center",
    paddingVertical: spacing.m,
  },
  weightUnit: {
    fontFamily: "Poppins",
    fontSize: 14,
    color: colors.text.tertiary,
  },
  rpeContainer: {
    alignItems: "center",
  },
  rpeValueContainer: {
    alignItems: "center",
    marginBottom: spacing.m,
  },
  rpeValue: {
    fontFamily: "Poppins",
    fontSize: 48,
    fontWeight: "700",
    color: colors.accent.primary,
  },
  rpeSubtext: {
    fontFamily: "Poppins",
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: -spacing.xs,
  },
  rpeSlider: {
    width: "100%",
    height: 40,
  },
  rpeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: spacing.xs,
  },
  rpeLabel: {
    fontFamily: "Poppins",
    fontSize: 12,
    color: colors.text.tertiary,
  },
  completeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.s,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.m,
    marginBottom: spacing.l,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  completeButtonDisabled: {
    ...Platform.select({
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
    }),
  },
  buttonGlassOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  completeButtonText: {
    fontFamily: "Poppins",
    fontSize: 17,
    fontWeight: "600",
    color: colors.text.inverse,
  },
  completeButtonTextDisabled: {
    color: colors.text.tertiary,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  // Rest timer
  restTimerContainer: {
    borderRadius: borderRadius["2xl"],
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
    overflow: "hidden",
    marginBottom: spacing.l,
    padding: spacing.xl,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
      },
      android: { elevation: 8 },
    }),
  },
  restTimerGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  restTimerContent: {
    alignItems: "center",
    marginBottom: spacing.l,
  },
  restTimerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent.primaryMuted,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.m,
  },
  restTimerLabel: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  restTimerValue: {
    fontFamily: "Poppins",
    fontSize: 56,
    fontWeight: "700",
    color: colors.accent.primary,
    letterSpacing: -2,
  },
  restTimerRecommended: {
    fontFamily: "Poppins",
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  skipRestButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
  },
  skipRestButtonText: {
    fontFamily: "Poppins",
    fontSize: 15,
    fontWeight: "500",
    color: colors.accent.primary,
  },
  // Previous sets
  previousSets: {
    marginBottom: spacing.l,
  },
  previousSetsTitle: {
    fontFamily: "Poppins",
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing.m,
  },
  previousSet: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  previousSetBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent.primaryMuted,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.m,
  },
  previousSetBadgeText: {
    fontFamily: "Poppins",
    fontSize: 13,
    fontWeight: "600",
    color: colors.accent.primary,
  },
  previousSetInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.s,
  },
  previousSetReps: {
    fontFamily: "Poppins",
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.primary,
  },
  previousSetWeight: {
    fontFamily: "Poppins",
    fontSize: 14,
    color: colors.text.secondary,
  },
  previousSetRpe: {
    alignItems: "center",
  },
  previousSetRpeLabel: {
    fontFamily: "Poppins",
    fontSize: 10,
    color: colors.text.tertiary,
    textTransform: "uppercase",
  },
  previousSetRpeValue: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "600",
    color: colors.accent.primary,
  },
  // Action buttons
  actionButtons: {
    flexDirection: "row",
    gap: spacing.m,
    marginBottom: spacing.l,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.s,
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.m,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  actionButtonText: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.secondary,
  },
  // Emergency button
  emergencyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.s,
    borderRadius: borderRadius.lg,
    padding: spacing.m,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.glass.borderPink,
  },
  emergencyButtonText: {
    fontFamily: "Poppins",
    fontSize: 13,
    fontWeight: "500",
    color: colors.accent.secondary,
  },
  // Error state
  errorCard: {
    alignItems: "center",
    marginTop: spacing.xxl,
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  errorText: {
    fontFamily: "Poppins",
    fontSize: 16,
    color: colors.error,
    textAlign: "center",
    marginTop: spacing.m,
  },
  // Phase indicator row
  phaseIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    gap: spacing.xs,
  },
  phasePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  phasePillActive: {
    backgroundColor: colors.accent.primaryMuted,
    borderColor: colors.accent.primary,
  },
  phasePillActivePink: {
    backgroundColor: "rgba(245, 169, 184, 0.2)",
    borderColor: colors.accent.secondary,
  },
  phasePillComplete: {
    borderColor: colors.glass.borderCyan,
  },
  phasePillText: {
    fontFamily: "Poppins",
    fontSize: 11,
    fontWeight: "500",
    color: colors.text.tertiary,
  },
  phasePillTextActive: {
    color: colors.accent.primary,
    fontWeight: "600",
  },
  phasePillTextActivePink: {
    color: colors.accent.secondary,
    fontWeight: "600",
  },
  phaseConnector: {
    width: 12,
    height: 1,
    backgroundColor: colors.border.default,
  },
  // Phase header
  phaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.m,
    marginBottom: spacing.xl,
  },
  phaseIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  phaseTitle: {
    fontFamily: "Poppins",
    fontSize: 22,
    fontWeight: "700",
    color: colors.accent.primary,
    letterSpacing: -0.3,
  },
  phaseSubtitle: {
    fontFamily: "Poppins",
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  // Skip phase button
  skipPhaseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.m,
    marginTop: spacing.m,
  },
  skipPhaseButtonText: {
    fontFamily: "Poppins",
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.secondary,
  },
});
