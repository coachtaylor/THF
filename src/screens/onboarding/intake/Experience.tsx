import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import { palette, spacing, typography } from '../../../theme';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';
import PrimaryButton from '../../../components/ui/PrimaryButton';

type FitnessExperience = 'beginner' | 'intermediate' | 'advanced';
type WorkoutFrequency = 3 | 4 | 5 | 6;
type SessionDuration = 30 | 45 | 60 | 90;

interface ExperienceOption {
  value: FitnessExperience;
  title: string;
  description: string;
}

const EXPERIENCE_OPTIONS: ExperienceOption[] = [
  {
    value: 'beginner',
    title: 'Beginner',
    description: 'New to structured fitness or returning after a long break',
  },
  {
    value: 'intermediate',
    title: 'Intermediate',
    description: '6+ months of consistent training',
  },
  {
    value: 'advanced',
    title: 'Advanced',
    description: '2+ years of structured training experience',
  },
];

const EQUIPMENT_OPTIONS = [
  'bodyweight',
  'dumbbells',
  'barbell',
  'kettlebell',
  'bands',
  'pull_up_bar',
  'bench',
  'step',
  'wall',
  'chair',
  'mat',
  'other',
];

const EQUIPMENT_LABELS: Record<string, string> = {
  bodyweight: 'Bodyweight',
  dumbbells: 'Dumbbells',
  barbell: 'Barbell',
  kettlebell: 'Kettlebell',
  bands: 'Resistance Bands',
  pull_up_bar: 'Pull-up Bar',
  bench: 'Bench',
  step: 'Step',
  wall: 'Wall',
  chair: 'Chair',
  mat: 'Mat',
  other: 'Other',
};

const FREQUENCY_OPTIONS: WorkoutFrequency[] = [3, 4, 5, 6];
const DURATION_OPTIONS: SessionDuration[] = [30, 45, 60, 90];

export default function Experience({ navigation }: OnboardingScreenProps<'Experience'>) {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < 375;

  const [fitnessExperience, setFitnessExperience] = useState<FitnessExperience | null>(
    (profile?.fitness_experience as FitnessExperience) || null
  );

  const [equipment, setEquipment] = useState<string[]>(
    profile?.equipment && profile.equipment.length > 0
      ? profile.equipment
      : ['bodyweight'] // Default to bodyweight
  );

  const [workoutFrequency, setWorkoutFrequency] = useState<WorkoutFrequency | null>(
    (profile?.workout_frequency as WorkoutFrequency) || null
  );

  const [sessionDuration, setSessionDuration] = useState<SessionDuration | null>(
    (profile?.session_duration as SessionDuration) || null
  );

  // Ensure bodyweight is always selected
  useEffect(() => {
    if (!equipment.includes('bodyweight')) {
      setEquipment([...equipment, 'bodyweight']);
    }
  }, [equipment]);

  const toggleEquipment = (item: string) => {
    // Bodyweight cannot be unselected
    if (item === 'bodyweight') return;

    if (equipment.includes(item)) {
      setEquipment(equipment.filter(e => e !== item));
    } else {
      setEquipment([...equipment, item]);
    }
  };

  const handleContinue = async () => {
    if (!fitnessExperience || equipment.length === 0 || !workoutFrequency || !sessionDuration) {
      return;
    }

    try {
      await updateProfile({
        fitness_experience: fitnessExperience,
        equipment: equipment,
        workout_frequency: workoutFrequency,
        session_duration: sessionDuration,
      });
      navigation.navigate('DysphoriaTriggers');
    } catch (error) {
      console.error('Error saving experience information:', error);
    }
  };

  const canContinue =
    fitnessExperience !== null &&
    equipment.length > 0 &&
    workoutFrequency !== null &&
    sessionDuration !== null;

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
        <Text style={[styles.headline, isSmall && styles.headlineSmall]}>
          Tell us about your fitness background
        </Text>
        <Text style={[styles.subheadline, isSmall && styles.subheadlineSmall]}>
          This helps us set appropriate intensity and exercise selection.
        </Text>
      </View>

      <ProgressIndicator
        currentStep={6}
        totalSteps={8}
        stepLabels={['Gender Identity', 'HRT Status', 'Binding Info', 'Surgery History', 'Goals', 'Experience', 'Dysphoria', 'Review']}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION A: Fitness Experience */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's your experience level?</Text>
          <View style={styles.experienceContainer}>
            {EXPERIENCE_OPTIONS.map((option) => {
              const isSelected = fitnessExperience === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setFitnessExperience(option.value)}
                  activeOpacity={0.7}
                  style={[
                    styles.experienceCard,
                    isSelected && styles.experienceCardSelected,
                  ]}
                >
                  {isSelected && (
                    <View style={styles.checkmarkContainer}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  )}
                  <View style={styles.experienceCardContent}>
                    <Text style={[styles.experienceCardTitle, isSelected && styles.experienceCardTitleSelected]}>
                      {option.title}
                    </Text>
                    <Text style={[styles.experienceCardDescription, isSelected && styles.experienceCardDescriptionSelected]}>
                      {option.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.divider} />

        {/* SECTION B: Equipment Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What equipment do you have access to? (Select all that apply)</Text>
          <View style={styles.equipmentGrid}>
            {EQUIPMENT_OPTIONS.map((item) => {
              const isSelected = equipment.includes(item);
              const isBodyweight = item === 'bodyweight';
              return (
                <TouchableOpacity
                  key={item}
                  onPress={() => toggleEquipment(item)}
                  activeOpacity={isBodyweight ? 1 : 0.7}
                  disabled={isBodyweight}
                  style={[
                    styles.equipmentChip,
                    isSelected && styles.equipmentChipSelected,
                    isBodyweight && styles.equipmentChipBodyweight,
                  ]}
                >
                  <Text
                    style={[
                      styles.equipmentChipText,
                      isSelected && styles.equipmentChipTextSelected,
                      isBodyweight && styles.equipmentChipTextBodyweight,
                    ]}
                  >
                    {EQUIPMENT_LABELS[item]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.divider} />

        {/* SECTION C: Workout Frequency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How many days per week can you train?</Text>
          <View style={styles.frequencyGrid}>
            {FREQUENCY_OPTIONS.map((freq) => {
              const isSelected = workoutFrequency === freq;
              return (
                <TouchableOpacity
                  key={freq}
                  onPress={() => setWorkoutFrequency(freq)}
                  activeOpacity={0.7}
                  style={[
                    styles.frequencyButton,
                    isSelected && styles.frequencyButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.frequencyButtonText,
                      isSelected && styles.frequencyButtonTextSelected,
                    ]}
                  >
                    {freq} days/week
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.guidanceBox}>
            <Text style={styles.guidanceIcon}>💡</Text>
            <Text style={styles.guidanceText}>
              We recommend 3-5 days/week for most people
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* SECTION D: Session Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How long is each workout session?</Text>
          <View style={styles.durationGrid}>
            {DURATION_OPTIONS.map((duration) => {
              const isSelected = sessionDuration === duration;
              return (
                <TouchableOpacity
                  key={duration}
                  onPress={() => setSessionDuration(duration)}
                  activeOpacity={0.7}
                  style={[
                    styles.durationButton,
                    isSelected && styles.durationButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      isSelected && styles.durationButtonTextSelected,
                    ]}
                  >
                    {duration} minutes
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.guidanceBox}>
            <Text style={styles.guidanceIcon}>💡</Text>
            <Text style={styles.guidanceText}>
              Longer sessions aren't always better - quality over quantity!
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.ctaContainer}>
        <PrimaryButton
          onPress={handleContinue}
          label="Continue"
          disabled={!canContinue}
        />
        {!canContinue && (
          <Text style={styles.hintText}>
            Please complete all sections before continuing
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
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: palette.white,
    marginBottom: spacing.m,
  },
  divider: {
    height: 1,
    backgroundColor: palette.border,
    marginVertical: spacing.l,
  },
  // Experience Cards
  experienceContainer: {
    gap: spacing.m,
  },
  experienceCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 16,
    padding: spacing.l,
    borderWidth: 2,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    minHeight: 100,
  },
  experienceCardSelected: {
    borderWidth: 3,
    borderColor: palette.tealPrimary,
    backgroundColor: palette.darkerCard,
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.tealPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkmark: {
    color: palette.deepBlack,
    fontSize: 16,
    fontWeight: '700',
  },
  experienceCardContent: {
    flex: 1,
  },
  experienceCardTitle: {
    ...typography.h3,
    color: palette.white,
    marginBottom: spacing.xs,
  },
  experienceCardTitleSelected: {
    color: palette.tealPrimary,
  },
  experienceCardDescription: {
    ...typography.body,
    color: palette.midGray,
    lineHeight: 20,
  },
  experienceCardDescriptionSelected: {
    color: palette.lightGray,
  },
  // Equipment Chips
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  equipmentChip: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: 20,
    backgroundColor: palette.darkCard,
    borderWidth: 1.5,
    borderColor: palette.border,
    minWidth: 100,
  },
  equipmentChipSelected: {
    backgroundColor: palette.tealPrimary,
    borderColor: palette.tealPrimary,
  },
  equipmentChipBodyweight: {
    backgroundColor: palette.tealPrimary,
    borderColor: palette.tealPrimary,
  },
  equipmentChipText: {
    ...typography.bodySmall,
    color: palette.white,
    textAlign: 'center',
  },
  equipmentChipTextSelected: {
    color: palette.deepBlack,
    fontWeight: '600',
  },
  equipmentChipTextBodyweight: {
    color: palette.deepBlack,
    fontWeight: '600',
  },
  // Frequency Buttons
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
    marginBottom: spacing.m,
  },
  frequencyButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
  frequencyButtonSelected: {
    borderWidth: 3,
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealGlow,
  },
  frequencyButtonText: {
    ...typography.h3,
    color: palette.white,
  },
  frequencyButtonTextSelected: {
    color: palette.tealPrimary,
    fontWeight: '600',
  },
  // Duration Buttons
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
    marginBottom: spacing.m,
  },
  durationButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
  durationButtonSelected: {
    borderWidth: 3,
    borderColor: palette.tealPrimary,
    backgroundColor: palette.tealGlow,
  },
  durationButtonText: {
    ...typography.h3,
    color: palette.white,
  },
  durationButtonTextSelected: {
    color: palette.tealPrimary,
    fontWeight: '600',
  },
  // Guidance Box
  guidanceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s,
    backgroundColor: 'rgba(0, 204, 204, 0.1)',
    borderRadius: 12,
    padding: spacing.m,
    marginTop: spacing.s,
  },
  guidanceIcon: {
    fontSize: 20,
    flexShrink: 0,
  },
  guidanceText: {
    ...typography.body,
    color: palette.tealPrimary,
    flex: 1,
    lineHeight: 20,
  },
  // CTA
  ctaContainer: {
    marginTop: spacing.s,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  hintText: {
    ...typography.caption,
    textAlign: 'center',
    color: palette.midGray,
    marginTop: spacing.xs,
  },
});

