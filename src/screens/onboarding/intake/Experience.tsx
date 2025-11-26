import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';

// Experience options
const EXPERIENCE_OPTIONS = [
  { value: 'beginner', title: 'Beginner', description: 'New to fitness or returning after a break' },
  { value: 'intermediate', title: 'Intermediate', description: '6+ months of consistent training' },
  { value: 'advanced', title: 'Advanced', description: '2+ years of structured training' },
];

// Equipment options (display names)
const EQUIPMENT_OPTIONS = [
  'Bodyweight',
  'Dumbbells',
  'Barbell',
  'Kettlebell',
  'Resistance Bands',
  'Pull-up Bar',
  'Bench',
  'Yoga Mat',
  'Step',
  'Wall',
  'Chair',
];

// Map display names to internal values
const EQUIPMENT_MAP: Record<string, string> = {
  'Bodyweight': 'bodyweight',
  'Dumbbells': 'dumbbells',
  'Barbell': 'barbell',
  'Kettlebell': 'kettlebell',
  'Resistance Bands': 'bands',
  'Pull-up Bar': 'pull_up_bar',
  'Bench': 'bench',
  'Yoga Mat': 'mat',
  'Step': 'step',
  'Wall': 'wall',
  'Chair': 'chair',
};

// Reverse map: internal value to display name
const EQUIPMENT_REVERSE_MAP: Record<string, string> = {
  'bodyweight': 'Bodyweight',
  'dumbbells': 'Dumbbells',
  'barbell': 'Barbell',
  'kettlebell': 'Kettlebell',
  'bands': 'Resistance Bands',
  'pull_up_bar': 'Pull-up Bar',
  'bench': 'Bench',
  'mat': 'Yoga Mat',
  'step': 'Step',
  'wall': 'Wall',
  'chair': 'Chair',
};

// Frequency options
const FREQUENCY_OPTIONS = [3, 4, 5, 6];

// Duration options
const DURATION_OPTIONS = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min' },
];

// SVG Components
const CheckmarkSVG = () => (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <Path
      d="M2 7 L5.5 10.5 L12 4"
      stroke="#0F1419"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const InfoIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <Circle cx="10" cy="10" r="8" stroke="#5B9FFF" strokeWidth="2" />
    <Path d="M10 6 L10 7 M10 9 L10 14" stroke="#5B9FFF" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export default function Experience({ navigation }: OnboardingScreenProps<'Experience'>) {
  const { profile, updateProfile } = useProfile();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  
  // Calculate widths for two-column grids
  // Container padding: 24px each side = 48px total
  // Gap between items: 8px
  // Formula: (screenWidth - 48 - 8) / 2
  const twoColumnItemWidth = (width - 48 - 8) / 2;

  // State
  const [fitnessExperience, setFitnessExperience] = useState<'beginner' | 'intermediate' | 'advanced' | null>(null);
  const [equipment, setEquipment] = useState<string[]>(['Bodyweight']); // Display names
  const [workoutFrequency, setWorkoutFrequency] = useState<3 | 4 | 5 | 6 | null>(null);
  const [sessionDuration, setSessionDuration] = useState<30 | 45 | 60 | 90 | null>(null);

  // Load from profile
  useEffect(() => {
    if (profile?.fitness_experience) {
      setFitnessExperience(profile.fitness_experience as 'beginner' | 'intermediate' | 'advanced');
    }
    if (profile?.equipment && profile.equipment.length > 0) {
      // Convert internal values to display names
      const displayNames = profile.equipment
        .map((val) => EQUIPMENT_REVERSE_MAP[val] || val)
        .filter((name) => name);
      setEquipment(displayNames.length > 0 ? displayNames : ['Bodyweight']);
    }
    if (profile?.workout_frequency) {
      setWorkoutFrequency(profile.workout_frequency as 3 | 4 | 5 | 6);
    }
    if (profile?.session_duration) {
      setSessionDuration(profile.session_duration as 30 | 45 | 60 | 90);
    }
  }, [profile]);

  // Ensure Bodyweight is always selected
  useEffect(() => {
    if (!equipment.includes('Bodyweight')) {
      setEquipment(['Bodyweight', ...equipment]);
    }
  }, [equipment]);

  // Equipment toggle logic
  const toggleEquipment = (item: string) => {
    if (item === 'Bodyweight') return; // Cannot unselect Bodyweight

    if (equipment.includes(item)) {
      setEquipment(equipment.filter((e) => e !== item));
    } else {
      setEquipment([...equipment, item]);
    }
  };

  // Continue handler
  const handleContinue = async () => {
    if (!fitnessExperience || equipment.length === 0 || !workoutFrequency || !sessionDuration) {
      return;
    }

    // Convert display names to internal values
    const equipmentValues = equipment.map((name) => EQUIPMENT_MAP[name] || name.toLowerCase().replace(/\s+/g, '_'));

    try {
      await updateProfile({
        fitness_experience: fitnessExperience,
        equipment: equipmentValues,
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
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <ProgressIndicator currentStep={6} totalSteps={8} />
          <Text style={styles.headline}>Tell us about your fitness background</Text>
          <Text style={styles.subheadline}>
            This helps us match you with the right program
          </Text>
        </View>

        {/* SECTION A: EXPERIENCE LEVEL */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>EXPERIENCE LEVEL</Text>

          {EXPERIENCE_OPTIONS.map((option) => {
            const isSelected = fitnessExperience === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.experienceCard, isSelected && styles.experienceCardSelected]}
                onPress={() => setFitnessExperience(option.value)}
              >
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.cardDescription, isSelected && styles.cardDescriptionSelected]}>
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SECTION B: EQUIPMENT */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>AVAILABLE EQUIPMENT</Text>
          <Text style={styles.sectionDescription}>Select all that apply</Text>

          <View style={styles.equipmentGrid}>
            {EQUIPMENT_OPTIONS.map((item) => {
              const isSelected = equipment.includes(item);
              const isBodyweight = item === 'Bodyweight';
              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.equipmentCheckbox,
                    { width: twoColumnItemWidth },
                    isSelected && styles.checkboxSelected,
                    isBodyweight && styles.checkboxBodyweight,
                  ]}
                  onPress={() => toggleEquipment(item)}
                  disabled={isBodyweight}
                >
                  <View style={[styles.checkboxSquare, isSelected && styles.squareSelected]}>
                    {isSelected && <CheckmarkSVG />}
                  </View>
                  <Text style={[styles.checkboxLabel, isSelected && styles.checkboxLabelSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* SECTION C: WORKOUT FREQUENCY */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>WORKOUT FREQUENCY</Text>

          <View style={styles.frequencySelector}>
            {FREQUENCY_OPTIONS.map((days) => {
              const isSelected = workoutFrequency === days;
              return (
                <TouchableOpacity
                  key={days}
                  style={[styles.frequencyButton, isSelected && styles.buttonSelected]}
                  onPress={() => setWorkoutFrequency(days)}
                >
                  <Text style={[styles.frequencyNumber, isSelected && styles.frequencyNumberSelected]}>
                    {days}
                  </Text>
                  <Text style={[styles.frequencyLabel, isSelected && styles.frequencyLabelSelected]}>
                    days
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.infoBadgeContainer}>
            <View style={styles.infoBadge}>
              <InfoIcon />
              <Text style={styles.infoText}>
                We recommend 3-5 days per week for most people
              </Text>
            </View>
          </View>
        </View>

        {/* SECTION D: SESSION DURATION */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>SESSION DURATION</Text>

          <View style={styles.durationOptions}>
            {DURATION_OPTIONS.map((option) => {
              const isSelected = sessionDuration === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.durationRadio,
                    { width: twoColumnItemWidth },
                    isSelected && styles.radioSelected,
                  ]}
                  onPress={() => setSessionDuration(option.value)}
                >
                  <View style={[styles.durationRadioCircle, isSelected && styles.durationRadioCircleSelected]}>
                    {isSelected && <View style={styles.durationRadioDot} />}
                  </View>
                  <Text style={[styles.durationText, isSelected && styles.durationTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* FOOTER (SCROLLS WITH CONTENT) */}
        <View style={styles.footerContainer}>
          <TouchableOpacity
            disabled={!canContinue}
            onPress={handleContinue}
            style={styles.primaryButton}
          >
            <LinearGradient
              colors={canContinue ? ['#00D9C0', '#00B39D'] : ['#2A2F36', '#1A1F26']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={[styles.buttonText, !canContinue && styles.buttonTextDisabled]}>
                Continue
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.hintText}>
            All fields are required
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 34,
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: 'left',
  },
  subheadline: {
    fontSize: 15,
    fontWeight: '400',
    color: '#9CA3AF',
    lineHeight: 22,
    textAlign: 'left',
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'left',
  },
  sectionDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 19,
    textAlign: 'left',
  },
  // Experience Cards
  experienceCard: {
    backgroundColor: '#1A1F26',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2A2F36',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
  },
  experienceCardSelected: {
    borderColor: '#00D9C0',
    backgroundColor: 'rgba(0, 217, 192, 0.08)',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2A2F36',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#00D9C0',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00D9C0',
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 2,
    textAlign: 'left',
  },
  cardTitleSelected: {
    color: '#00D9C0',
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    lineHeight: 20,
    textAlign: 'left',
  },
  cardDescriptionSelected: {
    color: '#B8C5C5',
  },
  // Equipment Grid
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: -8,
    marginTop: 0,
  },
  equipmentCheckbox: {
    marginLeft: 8,
    marginBottom: 8,
    backgroundColor: '#1A1F26',
    borderRadius: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: '#2A2F36',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  checkboxSelected: {
    borderColor: '#00D9C0',
    backgroundColor: 'rgba(0, 217, 192, 0.08)',
  },
  checkboxBodyweight: {
    borderColor: '#00D9C0',
    backgroundColor: 'rgba(0, 217, 192, 0.08)',
    opacity: 1,
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#2A2F36',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  squareSelected: {
    borderColor: '#00D9C0',
    backgroundColor: '#00D9C0',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E0E4E8',
    flex: 1,
    textAlign: 'left',
  },
  checkboxLabelSelected: {
    fontWeight: '600',
    color: '#00D9C0',
  },
  // Frequency Selector
  frequencySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
    backgroundColor: '#1A1F26',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#2A2F36',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 64,
  },
  buttonSelected: {
    borderColor: '#00D9C0',
    backgroundColor: 'rgba(0, 217, 192, 0.08)',
  },
  frequencyNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  frequencyNumberSelected: {
    color: '#00D9C0',
  },
  frequencyLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  frequencyLabelSelected: {
    color: '#B8C5C5',
  },
  // Info Badge
  infoBadgeContainer: {
    marginTop: 16,
  },
  infoBadge: {
    backgroundColor: 'rgba(91, 159, 255, 0.1)',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#B8C5C5',
    lineHeight: 18,
    flex: 1,
    marginLeft: 10,
    textAlign: 'left',
  },
  // Duration Options
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationRadio: {
    flex: 1,
    backgroundColor: '#1A1F26',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: '#2A2F36',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  radioSelected: {
    borderColor: '#00D9C0',
    backgroundColor: 'rgba(0, 217, 192, 0.08)',
  },
  durationRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#2A2F36',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationRadioCircleSelected: {
    borderColor: '#00D9C0',
  },
  durationRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D9C0',
  },
  durationText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#E0E4E8',
    textAlign: 'left',
  },
  durationTextSelected: {
    fontWeight: '600',
    color: '#00D9C0',
  },
  // Footer
  footerContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 0,
  },
  primaryButton: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F1419',
  },
  buttonTextDisabled: {
    color: '#6B7280',
  },
  hintText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
});
