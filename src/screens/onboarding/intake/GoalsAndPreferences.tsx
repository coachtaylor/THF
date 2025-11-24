import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import { palette, spacing, typography } from '../../../theme';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';
import BodyRegionChip from '../../../components/onboarding/BodyRegionChip';
import { fetchGoalsFromDatabase, formatGoalLabel } from '../../../utils/goals';

// Body region options for focus areas
const BODY_FOCUS_PREFER_OPTIONS = [
  { value: 'legs', label: 'Legs' },
  { value: 'glutes', label: 'Glutes' },
  { value: 'back', label: 'Back' },
  { value: 'core', label: 'Core' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'arms', label: 'Arms' },
  { value: 'chest', label: 'Chest' },
];

// Body region options for soft avoid areas
const BODY_FOCUS_SOFT_AVOID_OPTIONS = [
  { value: 'chest', label: 'Chest' },
  { value: 'hips', label: 'Hips' },
  { value: 'glutes', label: 'Glutes' },
  { value: 'abdomen', label: 'Abdomen' },
  { value: 'shoulders', label: 'Shoulders' },
];



export default function GoalsAndPreferences({ navigation }: OnboardingScreenProps<'Goals'>) {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < 375;

  // Goals from database
  const [availableGoals, setAvailableGoals] = useState<string[]>([]);
  const [loadingGoals, setLoadingGoals] = useState<boolean>(true);
  
  // Initialize from profile if available
  const [primaryGoal, setPrimaryGoal] = useState<string | null>(null);
  const [secondaryGoal, setSecondaryGoal] = useState<string | null>(null);
  const [bodyFocusPrefer, setBodyFocusPrefer] = useState<string[]>(profile?.body_focus_prefer || []);
  const [bodyFocusSoftAvoid, setBodyFocusSoftAvoid] = useState<string[]>(profile?.body_focus_soft_avoid || []);

  // Load goals from database and add gender-specific goals
  useEffect(() => {
    const loadGoals = async () => {
      try {
        setLoadingGoals(true);
        const dbGoals = await fetchGoalsFromDatabase();
        
        // Add gender-specific goals based on gender_identity
        const allGoals: string[] = [...dbGoals];
        
        if (profile?.gender_identity === 'mtf') {
          // Add feminization if not already present
          if (!allGoals.includes('feminization')) {
            allGoals.unshift('feminization'); // Add at beginning
          }
        } else if (profile?.gender_identity === 'ftm') {
          // Add masculinization if not already present
          if (!allGoals.includes('masculinization')) {
            allGoals.unshift('masculinization'); // Add at beginning
          }
        }
        
        setAvailableGoals(allGoals);
        
        // Initialize selected goals from profile
        if (profile?.primary_goal) {
          // Use primary_goal if available
          setPrimaryGoal(profile.primary_goal);
        } else if (profile?.goals && profile.goals.length > 0) {
          // Fallback to old goals array
          const goals = profile.goals;
          setPrimaryGoal(goals[0] || null);
          setSecondaryGoal(goals[1] || null);
        }
      } catch (error) {
        console.error('Error loading goals:', error);
        // Fallback to default goals
        const fallbackGoals = ['strength', 'conditioning', 'mobility', 'endurance'];
        if (profile?.gender_identity === 'mtf') {
          fallbackGoals.unshift('feminization');
        } else if (profile?.gender_identity === 'ftm') {
          fallbackGoals.unshift('masculinization');
        }
        setAvailableGoals(fallbackGoals);
      } finally {
        setLoadingGoals(false);
      }
    };

    loadGoals();
  }, [profile?.gender_identity]);


  const handleGoalPress = (goal: string) => {
    if (primaryGoal === goal) {
      setPrimaryGoal(null);
      if (secondaryGoal === goal) {
        setSecondaryGoal(null);
      }
    } else if (secondaryGoal === goal) {
      setSecondaryGoal(null);
    } else if (!primaryGoal) {
      setPrimaryGoal(goal);
    } else if (!secondaryGoal) {
      setSecondaryGoal(goal);
    } else {
      setPrimaryGoal(goal);
      setSecondaryGoal(primaryGoal);
    }
  };

  const getSelectionType = (goal: string): 'primary' | 'secondary' | null => {
    if (primaryGoal === goal) return 'primary';
    if (secondaryGoal === goal) return 'secondary';
    return null;
  };

  const toggleBodyFocusPrefer = (value: string) => {
    setBodyFocusPrefer((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleBodyFocusSoftAvoid = (value: string) => {
    setBodyFocusSoftAvoid((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleNoPreference = () => {
    setBodyFocusSoftAvoid([]);
  };



  // Map selected goal to primary_goal value
  const mapGoalToPrimaryGoal = (goal: string): 'feminization' | 'masculinization' | 'general_fitness' | 'strength' | 'endurance' => {
    // Check if goal is already a primary_goal value
    if (goal === 'feminization' || goal === 'masculinization' || goal === 'general_fitness' || goal === 'strength' || goal === 'endurance') {
      return goal as 'feminization' | 'masculinization' | 'general_fitness' | 'strength' | 'endurance';
    }
    
    // Map database goals to primary_goal
    if (goal === 'strength') return 'strength';
    if (goal === 'cardio' || goal === 'endurance' || goal === 'conditioning') return 'endurance';
    if (goal === 'flexibility' || goal === 'mobility') return 'general_fitness';
    
    // Default based on gender_identity if available
    if (profile?.gender_identity === 'mtf') return 'feminization';
    if (profile?.gender_identity === 'ftm') return 'masculinization';
    
    // Default fallback
    return 'general_fitness';
  };

  const handleContinue = async () => {
    if (!primaryGoal) return;

    const goals: string[] = [primaryGoal];
    if (secondaryGoal) {
      goals.push(secondaryGoal);
    }

    // Calculate goal weighting
    const goalWeighting = secondaryGoal
      ? { primary: 70, secondary: 30 }
      : { primary: 100, secondary: 0 };

    // Map selected goal to primary_goal
    const mappedPrimaryGoal = mapGoalToPrimaryGoal(primaryGoal);

    try {
      await updateProfile({
        goals,
        goal_weighting: goalWeighting,
        primary_goal: mappedPrimaryGoal,
        body_focus_prefer: bodyFocusPrefer.length > 0 ? bodyFocusPrefer : undefined,
        body_focus_soft_avoid: bodyFocusSoftAvoid.length > 0 ? bodyFocusSoftAvoid : undefined,
      });
      // Navigate to HRT & Binding screen
      navigation.navigate('HRTAndBinding');
    } catch (error) {
      console.error('Error saving goals and preferences:', error);
    }
  };

  const canContinue = primaryGoal !== null;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, spacing.m),
          paddingBottom: Math.max(insets.bottom + spacing.m, spacing.l),
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.headline, isSmall && styles.headlineSmall]}>Goals & Preferences</Text>
        <Text style={[styles.subheadline, isSmall && styles.subheadlineSmall]}>
          Customize your workout plan
        </Text>
      </View>

      <ProgressIndicator
        currentStep={2}
        totalSteps={5}
        stepLabels={['Gender Identity', 'Goals', 'HRT & Binding', 'Surgery', 'Review']}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Goals</Text>
            <Text style={styles.sectionDescription}>Select your primary goal. Optional secondary goal.</Text>
          </View>
          {loadingGoals ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={palette.tealPrimary} />
              <Text style={styles.loadingText}>Loading goals...</Text>
            </View>
          ) : (
            <View style={styles.goalsGrid}>
              {availableGoals.map((goal) => {
                const selectionType = getSelectionType(goal);
                const isSelected = primaryGoal === goal || secondaryGoal === goal;
                return (
                  <TouchableOpacity
                    key={goal}
                    onPress={() => handleGoalPress(goal)}
                    activeOpacity={0.7}
                    style={[
                      styles.goalCard,
                      isSelected && styles.goalCardSelected,
                      selectionType === 'primary' && styles.goalCardPrimary,
                      selectionType === 'secondary' && styles.goalCardSecondary,
                    ]}
                  >
                    {selectionType === 'primary' ? (
                      <View key="primary-badge" style={styles.badge}>
                        <Text style={styles.badgeText}>Primary</Text>
                      </View>
                    ) : selectionType === 'secondary' ? (
                      <View key="secondary-badge" style={[styles.badge, styles.badgeSecondary]}>
                        <Text style={styles.badgeText}>Secondary</Text>
                      </View>
                    ) : null}
                    <Text style={[styles.goalLabel, isSelected && styles.goalLabelSelected]}>
                      {formatGoalLabel(goal)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Body Region Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Body Focus</Text>
            <Text style={styles.sectionDescription}>
              Optional: Help us customize your workouts to target specific areas
            </Text>
          </View>

          <View style={styles.bodyFocusCard}>
            <View style={styles.bodyFocusCardHeader}>
              <View style={styles.bodyFocusIconContainer}>
                <Text style={styles.bodyFocusIcon}>↑</Text>
              </View>
              <View style={styles.bodyFocusHeaderText}>
                <Text style={styles.bodyFocusGroupTitle}>Focus more on</Text>
                <Text style={styles.bodyFocusGroupDescription}>
                  Select areas you want to prioritize in your workouts
                </Text>
              </View>
            </View>
            <View style={styles.chipContainer}>
              {BODY_FOCUS_PREFER_OPTIONS.map((option) => (
                <BodyRegionChip
                  key={option.value}
                  label={option.label}
                  selected={bodyFocusPrefer.includes(option.value)}
                  onPress={() => toggleBodyFocusPrefer(option.value)}
                />
              ))}
            </View>
            {bodyFocusPrefer.length > 0 && (
              <View style={styles.selectionCount}>
                <Text style={styles.selectionCountText}>
                  {bodyFocusPrefer.length} {bodyFocusPrefer.length === 1 ? 'area' : 'areas'} selected
                </Text>
              </View>
            )}
          </View>

          <View style={styles.bodyFocusCard}>
            <View style={styles.bodyFocusCardHeader}>
              <View style={[styles.bodyFocusIconContainer, styles.bodyFocusIconContainerGentle]}>
                <Text style={[styles.bodyFocusIcon, styles.bodyFocusIconGentle]}>↓</Text>
              </View>
              <View style={styles.bodyFocusHeaderText}>
                <Text style={styles.bodyFocusGroupTitle}>Go gently with</Text>
                <Text style={styles.bodyFocusGroupDescription}>
                  Select areas to approach with more care or avoid
                </Text>
              </View>
            </View>
            <View style={styles.chipContainer}>
              {BODY_FOCUS_SOFT_AVOID_OPTIONS.map((option) => (
                <BodyRegionChip
                  key={option.value}
                  label={option.label}
                  selected={bodyFocusSoftAvoid.includes(option.value)}
                  onPress={() => toggleBodyFocusSoftAvoid(option.value)}
                />
              ))}
              <BodyRegionChip
                key="no-preference"
                label="No preference"
                selected={bodyFocusSoftAvoid.length === 0}
                onPress={handleNoPreference}
              />
            </View>
            {bodyFocusSoftAvoid.length > 0 && (
              <View style={styles.selectionCount}>
                <Text style={styles.selectionCountText}>
                  {bodyFocusSoftAvoid.length} {bodyFocusSoftAvoid.length === 1 ? 'area' : 'areas'} selected
                </Text>
              </View>
            )}
          </View>
        </View>


      </ScrollView>

      <View style={styles.ctaContainer}>
        <Button
          mode="contained"
          onPress={handleContinue}
          disabled={!canContinue}
          style={styles.continueButton}
          contentStyle={styles.continueButtonContent}
          labelStyle={styles.continueButtonLabel}
        >
          Continue
        </Button>
        {!canContinue && (
          <Text style={styles.hintText}>
            Please select at least one goal
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.deepBlack,
    paddingHorizontal: spacing.l,
  },
  header: {
    marginBottom: spacing.l,
    paddingTop: spacing.s,
  },
  headline: {
    ...typography.h1,
    textAlign: 'left',
    marginBottom: spacing.xs,
    letterSpacing: -0.8,
  },
  headlineSmall: {
    fontSize: 28,
  },
  subheadline: {
    ...typography.bodyLarge,
    textAlign: 'left',
    color: palette.midGray,
    lineHeight: 24,
  },
  subheadlineSmall: {
    fontSize: 15,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.l,
  },
  sectionHeader: {
    marginBottom: spacing.s,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.xxs,
    color: palette.white,
    letterSpacing: -0.5,
  },
  sectionDescription: {
    ...typography.body,
    color: palette.midGray,
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.l,
    gap: spacing.s,
  },
  loadingText: {
    ...typography.bodySmall,
    color: palette.midGray,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
  },
  goalCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.s,
    borderWidth: 1.5,
    borderColor: palette.border,
    alignItems: 'center',
    minHeight: 60,
    justifyContent: 'center',
    position: 'relative',
  },
  goalCardSelected: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.darkerCard,
    borderWidth: 2,
  },
  goalCardPrimary: {
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealGlow,
    borderWidth: 2,
  },
  goalCardSecondary: {
    borderColor: palette.tealDark,
    borderWidth: 2,
    backgroundColor: palette.tealLight,
  },
  goalLabel: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    color: palette.white,
  },
  goalLabelSelected: {
    color: palette.tealPrimary,
  },
  badge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: palette.tealPrimary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeSecondary: {
    backgroundColor: palette.tealDark,
  },
  badgeText: {
    ...typography.caption,
    color: palette.deepBlack,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.2,
  },
  bodyFocusCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 14,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: palette.border,
  },
  bodyFocusCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.m,
    gap: spacing.m,
  },
  bodyFocusIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.tealGlow,
    borderWidth: 1.5,
    borderColor: palette.tealPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bodyFocusIconContainerGentle: {
    backgroundColor: 'rgba(255, 184, 77, 0.15)',
    borderColor: palette.warning,
  },
  bodyFocusIcon: {
    fontSize: 16,
    color: palette.tealPrimary,
    fontWeight: '700',
  },
  bodyFocusIconGentle: {
    color: palette.warning,
  },
  bodyFocusHeaderText: {
    flex: 1,
  },
  bodyFocusGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.white,
    marginBottom: spacing.xxs,
  },
  bodyFocusGroupDescription: {
    ...typography.bodySmall,
    color: palette.midGray,
    lineHeight: 18,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  selectionCount: {
    marginTop: spacing.m,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  selectionCountText: {
    ...typography.caption,
    color: palette.tealPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  ctaContainer: {
    marginTop: spacing.s,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  continueButton: {
    borderRadius: 12,
    marginBottom: spacing.xs,
    shadowColor: palette.tealPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonContent: {
    paddingVertical: spacing.s,
    backgroundColor: palette.tealPrimary,
  },
  continueButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.deepBlack,
  },
  hintText: {
    ...typography.caption,
    textAlign: 'center',
    color: palette.midGray,
    marginTop: spacing.xs,
  },
});

