import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from 'react-native-paper';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import { generatePlan } from '../../../services/planGenerator';
import { savePlan } from '../../../services/storage/plan';
import { Plan, Profile } from '../../../types';
import { palette, spacing, typography } from '../../../theme';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';
import { formatEquipmentLabel } from '../../../utils/equipment';
import { filterExercisesByConstraints } from '../../../services/data/exerciseFilters';
import { fetchAllExercises } from '../../../services/exerciseService';
import type { Exercise } from '../../../types';

const GENDER_IDENTITY_LABELS: Record<string, string> = {
  mtf: 'Trans Woman (MTF)',
  ftm: 'Trans Man (FTM)',
  nonbinary: 'Non-binary',
  questioning: 'Questioning',
};

const DYSPHORIA_TRIGGER_LABELS: Record<string, string> = {
  looking_at_chest: 'Looking at chest in mirror',
  tight_clothing: 'Tight or form-fitting clothing',
  mirrors: 'Mirrors / reflective surfaces',
  body_contact: 'Body contact (spotting, partner exercises)',
  crowded_spaces: 'Crowded workout spaces',
  locker_rooms: 'Locker rooms / changing areas',
  voice: 'Voice (grunting, heavy breathing)',
  other: 'Other triggers',
};

const PRIMARY_GOAL_LABELS: Record<string, string> = {
  feminization: 'Feminization',
  masculinization: 'Masculinization',
  general_fitness: 'General Fitness',
  strength: 'Strength',
  endurance: 'Endurance',
};

const FITNESS_EXPERIENCE_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const HRT_TYPE_LABELS: Record<string, string> = {
  estrogen_blockers: 'Estrogen + Anti-androgens',
  testosterone: 'Testosterone',
  none: 'Other / Not specified',
};

const BINDING_FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Every workout (Daily)',
  sometimes: 'Most workouts (Sometimes)',
  rarely: 'Occasionally (Rarely)',
  never: 'Testing it out (Never yet)',
};

const BINDER_TYPE_LABELS: Record<string, string> = {
  commercial: 'Commercial binder',
  sports_bra: 'Sports bra',
  diy: 'DIY / Makeshift',
  other: 'Other / Prefer not to say',
};

const SURGERY_TYPE_LABELS: Record<string, string> = {
  top_surgery: 'Top Surgery',
  bottom_surgery: 'Bottom Surgery',
  ffs: 'Facial Feminization Surgery (FFS)',
  orchiectomy: 'Orchiectomy',
  other: 'Other surgery',
};

const formatDate = (date: Date): string => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

const formatHRTStartDate = (date: Date): string => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${year}`;
};

const formatMonths = (months: number): string => {
  if (months === 0) return '0 months';
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'}`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) {
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }
  return `${years} ${years === 1 ? 'year' : 'years'}, ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
};

export default function Review({ navigation }: OnboardingScreenProps<'Review'>) {
  const { profile, refreshProfile } = useProfile();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < 375;

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exerciseCount, setExerciseCount] = useState<number>(0);
  const [safetyRulesCount, setSafetyRulesCount] = useState<number>(0);

  // Calculate available exercises and safety rules
  const calculateAvailableExercises = async (profile: Profile): Promise<number> => {
    try {
      const allExercises = await fetchAllExercises();
      const filtered = filterExercisesByConstraints(allExercises, profile);
      return filtered.length;
    } catch (error) {
      console.error('Error calculating exercises:', error);
      // Fallback estimate
      const exercisesPerSession = profile.fitness_experience === 'beginner' ? 8 : 
                                   profile.fitness_experience === 'intermediate' ? 10 : 12;
      return exercisesPerSession * profile.workout_frequency;
    }
  };

  const calculateApplicableRules = (profile: Profile): number => {
    let count = 0;
    if (profile.on_hrt) count++;
    if (profile.binds_chest) count++;
    if (profile.surgeries && profile.surgeries.length > 0) {
      count += profile.surgeries.length;
    }
    if (profile.dysphoria_triggers && profile.dysphoria_triggers.length > 0) count++;
    return count;
  };

  // Refresh profile when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshProfile();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // Calculate counts when profile changes
  useEffect(() => {
    if (profile) {
      calculateAvailableExercises(profile).then(setExerciseCount);
      setSafetyRulesCount(calculateApplicableRules(profile));
    }
  }, [profile]);

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No profile data found. Please complete onboarding.</Text>
      </View>
    );
  }

  const handleEdit = (screen: 'GenderIdentity' | 'HRTStatus' | 'BindingInfo' | 'Surgery' | 'Goals' | 'Experience' | 'DysphoriaTriggers') => {
    navigation.navigate(screen);
  };

  const handleGeneratePlan = async () => {
    try {
      setGenerating(true);
      setError(null);

      // Ensure block_length is set to 4 for 4-week program
      const profileWithBlockLength = {
        ...profile,
        block_length: 4,
      };

      // Call Phase 2 workout generation
      const plan = await generatePlan(profileWithBlockLength);

      console.log('✅ Plan generated:', plan);

      // Save plan to storage
      await savePlan(plan);

      // Navigate to PlanView
      setGenerating(false);
      navigation.navigate('PlanView');
    } catch (err) {
      console.error('❌ Failed to generate plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
      setGenerating(false);
    }
  };

  // Helper function to format equipment
  const formatEquipment = (): string => {
    const equipment = profile.equipment || [];
    if (equipment.length === 0) return 'No equipment selected';
    return equipment.map((e) => formatEquipmentLabel(e)).join(', ');
  };


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
        <Text style={[styles.headline, isSmall && styles.headlineSmall]}>Review Your Profile</Text>
        <Text style={[styles.subheadline, isSmall && styles.subheadlineSmall]}>
          Review your selections and generate your plan
        </Text>
      </View>

      <ProgressIndicator
        currentStep={8}
        totalSteps={8}
        stepLabels={['Gender Identity', 'HRT Status', 'Binding Info', 'Surgery History', 'Goals', 'Experience', 'Dysphoria', 'Review']}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Panel */}
        <View style={styles.summaryPanel}>
          <View style={styles.summaryHeader}>
            <Text style={styles.checkmarkIcon}>✅</Text>
            <Text style={styles.summaryTitle}>Profile Complete</Text>
          </View>
          <Text style={styles.summarySubtitle}>
            Your personalized program will include:
          </Text>
          <View style={styles.summaryList}>
            <View style={styles.summaryListItem}>
              <Text style={styles.summaryBullet}>•</Text>
              <Text style={styles.summaryText}>
                {exerciseCount || '...'} exercises tailored to your equipment
              </Text>
            </View>
            <View style={styles.summaryListItem}>
              <Text style={styles.summaryBullet}>•</Text>
              <Text style={styles.summaryText}>
                {safetyRulesCount} safety {safetyRulesCount === 1 ? 'rule' : 'rules'} applied
              </Text>
            </View>
            <View style={styles.summaryListItem}>
              <Text style={styles.summaryBullet}>•</Text>
              <Text style={styles.summaryText}>
                {profile.workout_frequency}-day training split
              </Text>
            </View>
            <View style={styles.summaryListItem}>
              <Text style={styles.summaryBullet}>•</Text>
              <Text style={styles.summaryText}>
                {profile.session_duration}-minute sessions
              </Text>
            </View>
          </View>
        </View>

        {/* SECTION 1: Identity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Identity</Text>
            <TouchableOpacity onPress={() => handleEdit('GenderIdentity')} style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.summaryBullet}>
                <Text style={styles.label}>Gender Identity: </Text>
                {GENDER_IDENTITY_LABELS[profile.gender_identity] || profile.gender_identity}
              </Text>
            </View>
            {profile.pronouns && (
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.summaryBullet}>
                  <Text style={styles.label}>Pronouns: </Text>
                  {profile.pronouns}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* SECTION 2: HRT Status (only if on_hrt = true) */}
        {profile.on_hrt && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>HRT Status</Text>
              <TouchableOpacity onPress={() => handleEdit('HRTStatus')} style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.summaryCard}>
              {profile.hrt_type && (
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.summaryBullet}>
                    <Text style={styles.label}>Type: </Text>
                    {HRT_TYPE_LABELS[profile.hrt_type] || profile.hrt_type}
                  </Text>
                </View>
              )}
              {profile.hrt_start_date && (
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.summaryBullet}>
                    <Text style={styles.label}>Started: </Text>
                    {formatHRTStartDate(new Date(profile.hrt_start_date))}
                  </Text>
                </View>
              )}
              {profile.hrt_months_duration !== undefined && profile.hrt_months_duration > 0 && (
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.summaryBullet}>
                    <Text style={styles.label}>Duration: </Text>
                    {profile.hrt_months_duration} {profile.hrt_months_duration === 1 ? 'month' : 'months'}
                  </Text>
                </View>
              )}
              <View style={styles.impactBox}>
                <Text style={styles.impactIcon}>💡</Text>
                <Text style={styles.impactText}>
                  Impact: Workout volume reduced by 15% for recovery
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* SECTION 3: Binding Information (only if binds_chest = true) */}
        {profile.binds_chest && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Binding Information</Text>
              <TouchableOpacity onPress={() => handleEdit('BindingInfo')} style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.summaryCard}>
              {profile.binding_frequency && (
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.summaryBullet}>
                    <Text style={styles.label}>Frequency: </Text>
                    {BINDING_FREQUENCY_LABELS[profile.binding_frequency] || profile.binding_frequency}
                  </Text>
                </View>
              )}
              {profile.binding_duration_hours !== undefined && profile.binding_duration_hours > 0 && (
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.summaryBullet}>
                    <Text style={styles.label}>Duration: </Text>
                    {profile.binding_duration_hours} {profile.binding_duration_hours === 1 ? 'hour' : 'hours'} per session
                  </Text>
                </View>
              )}
              {profile.binder_type && (
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.summaryBullet}>
                    <Text style={styles.label}>Binder Type: </Text>
                    {BINDER_TYPE_LABELS[profile.binder_type] || profile.binder_type}
                  </Text>
                </View>
              )}
              <View style={styles.impactBox}>
                <Text style={styles.impactIcon}>💡</Text>
                <Text style={styles.impactText}>
                  Impact: Chest compression exercises excluded, breathing breaks added
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* SECTION 4: Surgery History (only if surgeries.length > 0) */}
        {profile.surgeries && profile.surgeries.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Surgery History</Text>
              <TouchableOpacity onPress={() => handleEdit('Surgery')} style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.summaryCard}>
              {profile.surgeries.map((surgery, index) => {
                const status = surgery.fully_healed 
                  ? 'Fully healed'
                  : surgery.weeks_post_op !== undefined 
                    ? `${surgery.weeks_post_op} ${surgery.weeks_post_op === 1 ? 'week' : 'weeks'} post-op`
                    : 'Status unknown';
                return (
                  <View key={index} style={styles.surgeryItem}>
                    <View style={styles.bulletItem}>
                      <View style={styles.bullet} />
                      <Text style={styles.summaryBullet}>
                        <Text style={styles.label}>Type: </Text>
                        {SURGERY_TYPE_LABELS[surgery.type] || surgery.type}
                      </Text>
                    </View>
                    <View style={styles.bulletItem}>
                      <View style={styles.bullet} />
                      <Text style={styles.summaryBullet}>
                        <Text style={styles.label}>Date: </Text>
                        {formatDate(surgery.date)}
                      </Text>
                    </View>
                    <View style={styles.bulletItem}>
                      <View style={styles.bullet} />
                      <Text style={styles.summaryBullet}>
                        <Text style={styles.label}>Status: </Text>
                        {status}
                      </Text>
                    </View>
                    <View style={styles.impactBox}>
                      <Text style={styles.impactIcon}>💡</Text>
                      <Text style={styles.impactText}>
                        Impact: Conservative upper body exercise selection
                      </Text>
                    </View>
                    {index < profile.surgeries!.length - 1 && <View style={styles.surgerySeparator} />}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* SECTION 5: Goals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Goals</Text>
            <TouchableOpacity onPress={() => handleEdit('Goals')} style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.summaryBullet}>
                <Text style={styles.label}>Primary Goal: </Text>
                {PRIMARY_GOAL_LABELS[profile.primary_goal] || profile.primary_goal}
              </Text>
            </View>
            {profile.secondary_goals && profile.secondary_goals.length > 0 && (
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.summaryBullet}>
                  <Text style={styles.label}>Secondary Goals: </Text>
                  {profile.secondary_goals.map(g => PRIMARY_GOAL_LABELS[g] || g).join(', ')}
                </Text>
              </View>
            )}
            <View style={styles.impactBox}>
              <Text style={styles.impactIcon}>💡</Text>
              <Text style={styles.impactText}>
                Impact: {profile.gender_identity === 'mtf' 
                  ? 'Lower body exercises emphasized (60-70% volume)'
                  : profile.gender_identity === 'ftm'
                  ? 'Upper body exercises emphasized (60-70% volume)'
                  : 'Balanced exercise selection'}
              </Text>
            </View>
          </View>
        </View>

        {/* SECTION 6: Training Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Training Details</Text>
            <TouchableOpacity onPress={() => handleEdit('Experience')} style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.summaryBullet}>
                <Text style={styles.label}>Experience Level: </Text>
                {FITNESS_EXPERIENCE_LABELS[profile.fitness_experience] || profile.fitness_experience}
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.summaryBullet}>
                <Text style={styles.label}>Equipment: </Text>
                {formatEquipment()}
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.summaryBullet}>
                <Text style={styles.label}>Frequency: </Text>
                {profile.workout_frequency} {profile.workout_frequency === 1 ? 'day' : 'days'} per week
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.summaryBullet}>
                <Text style={styles.label}>Session Duration: </Text>
                {profile.session_duration} minutes
              </Text>
            </View>
            <View style={styles.impactBox}>
              <Text style={styles.impactIcon}>💡</Text>
              <Text style={styles.impactText}>
                Impact: {profile.workout_frequency}-day split with {profile.fitness_experience} sets/reps
              </Text>
            </View>
          </View>
        </View>

        {/* SECTION 7: Dysphoria Considerations (only if dysphoria_triggers.length > 0) */}
        {profile.dysphoria_triggers && profile.dysphoria_triggers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Dysphoria Considerations</Text>
              <TouchableOpacity onPress={() => handleEdit('DysphoriaTriggers')} style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.summaryCard}>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.summaryBullet}>
                  <Text style={styles.label}>Triggers: </Text>
                  {profile.dysphoria_triggers
                    .map(t => DYSPHORIA_TRIGGER_LABELS[t] || t)
                    .join(', ')}
                </Text>
              </View>
              {profile.dysphoria_notes && (
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.summaryBullet}>
                    <Text style={styles.label}>Notes: </Text>
                    {profile.dysphoria_notes.length > 50 
                      ? `${profile.dysphoria_notes.substring(0, 50)}...`
                      : profile.dysphoria_notes}
                  </Text>
                </View>
              )}
              <View style={styles.impactBox}>
                <Text style={styles.impactIcon}>💡</Text>
                <Text style={styles.impactText}>
                  Impact: Mirror-free exercises suggested, home workout options prioritized
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.ctaContainer}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>❌</Text>
            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>Plan generation failed: {error}</Text>
              <Text style={styles.errorMessage}>
                Please check your internet connection and try again.
              </Text>
            </View>
          </View>
        )}
        <TouchableOpacity
          onPress={handleGeneratePlan}
          disabled={generating}
          style={[
            styles.generateButton,
            generating && styles.generateButtonDisabled,
          ]}
          activeOpacity={0.8}
        >
          {generating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={palette.deepBlack} style={styles.loadingSpinner} />
              <Text style={styles.generateButtonLabel}>Generating Your Program...</Text>
            </View>
          ) : (
            <Text style={styles.generateButtonLabel}>Generate My Program →</Text>
          )}
        </TouchableOpacity>
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
    letterSpacing: -0.5,
  },
  headlineSmall: {
    fontSize: 24,
  },
  subheadline: {
    ...typography.body,
    textAlign: 'left',
    color: palette.midGray,
    lineHeight: 20,
  },
  subheadlineSmall: {
    fontSize: 14,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.l,
    paddingBottom: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  sectionTitle: {
    ...typography.h3,
    color: palette.white,
    letterSpacing: -0.3,
  },
  editButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.s,
  },
  editButtonText: {
    ...typography.bodySmall,
    color: palette.tealPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.l,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.m,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.tealPrimary,
    marginTop: 8,
    marginRight: spacing.m,
    flexShrink: 0,
  },
  label: {
    fontWeight: '600',
    color: palette.white,
  },
  surgeryItem: {
    marginBottom: spacing.m,
  },
  surgerySeparator: {
    height: 1,
    backgroundColor: palette.border,
    marginTop: spacing.m,
    marginBottom: spacing.m,
  },
  ctaContainer: {
    marginTop: spacing.s,
    paddingTop: spacing.m,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  errorContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 1.5,
    borderColor: palette.error,
    gap: spacing.s,
  },
  errorIcon: {
    fontSize: 20,
    flexShrink: 0,
  },
  errorContent: {
    flex: 1,
  },
  errorTitle: {
    ...typography.body,
    color: palette.error,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  errorMessage: {
    ...typography.bodySmall,
    color: palette.lightGray,
    lineHeight: 18,
  },
  errorText: {
    ...typography.body,
    color: palette.midGray,
    textAlign: 'center',
    padding: spacing.l,
  },
  generateButton: {
    backgroundColor: palette.tealPrimary,
    borderRadius: 12,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonLabel: {
    ...typography.h3,
    fontSize: 16,
    fontWeight: '700',
    color: palette.deepBlack,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
  },
  loadingSpinner: {
    marginRight: 0,
  },
  impactBox: {
    marginTop: spacing.l,
    padding: spacing.m,
    backgroundColor: 'rgba(0, 204, 204, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: palette.tealPrimary,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  impactText: {
    ...typography.bodySmall,
    color: palette.tealPrimary,
    lineHeight: 18,
    flex: 1,
  },
  impactIcon: {
    fontSize: 16,
    marginTop: 2,
  },
  summaryPanel: {
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.l,
    borderWidth: 1.5,
    borderColor: palette.border,
    marginBottom: spacing.xl,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  checkmarkIcon: {
    fontSize: 24,
  },
  summaryTitle: {
    ...typography.h3,
    color: palette.white,
    fontWeight: '600',
  },
  summarySubtitle: {
    ...typography.body,
    color: palette.lightGray,
    marginBottom: spacing.m,
    lineHeight: 22,
  },
  summaryList: {
    gap: spacing.s,
  },
  summaryListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s,
  },
  summaryBullet: {
    ...typography.body,
    color: palette.tealPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  summaryText: {
    ...typography.body,
    color: palette.lightGray,
    flex: 1,
    lineHeight: 22,
  },
});
