import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from 'react-native-paper';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import { generatePlan } from '../../../services/planGenerator';
import { savePlan } from '../../../services/storage/plan';
import { Plan } from '../../../types';
import { palette, spacing, typography } from '../../../theme';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';
import { formatEquipmentLabel } from '../../../utils/equipment';

const GENDER_IDENTITY_LABELS: Record<string, string> = {
  mtf: 'Trans Woman / Transfeminine',
  ftm: 'Trans Man / Transmasculine',
  nonbinary: 'Nonbinary / Gender Diverse',
  questioning: 'Questioning',
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
  estrogen_blockers: 'Estrogen / Anti-Androgens',
  testosterone: 'Testosterone',
  none: 'Other / Not specified',
};

const BINDING_FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Every workout (Daily)',
  sometimes: 'Most workouts (Sometimes)',
  rarely: 'Rarely',
  never: 'Never',
};

const BINDER_TYPE_LABELS: Record<string, string> = {
  commercial: 'Commercial binder (GC2B, Underworks, etc.)',
  sports_bra: 'Sports bra',
  ace_bandage: 'Ace bandage',
  diy: 'DIY/Makeshift',
};

const SURGERY_TYPE_LABELS: Record<string, string> = {
  top_surgery: 'Top Surgery',
  bottom_surgery: 'Bottom Surgery',
  ffs: 'Facial Feminization Surgery (FFS)',
  orchiectomy: 'Orchiectomy',
  other: 'Other surgery',
};

const formatDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
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

  // Refresh profile when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshProfile();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No profile data found. Please complete onboarding.</Text>
      </View>
    );
  }

  const handleEdit = (screen: 'GenderIdentity' | 'Goals' | 'HRTAndBinding' | 'Surgery') => {
    navigation.navigate(screen);
  };

  const handleGeneratePlan = async () => {
    try {
      setGenerating(true);
      setError(null);

      // Generate plan using profile data
      const plan = await generatePlan(profile);

      console.log('✅ Plan generated:', plan);

      // Save plan to storage
      await savePlan(plan);

      // Navigate to PlanView
      setGenerating(false);
      navigation.navigate('PlanView');
    } catch (err) {
      console.error('❌ Failed to generate plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate workout plan');
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
        currentStep={5}
        totalSteps={5}
        stepLabels={['Gender Identity', 'Goals', 'HRT & Binding', 'Surgery', 'Review']}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION 1: Your Profile */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Profile</Text>
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
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.summaryBullet}>
                <Text style={styles.label}>Primary Goal: </Text>
                {PRIMARY_GOAL_LABELS[profile.primary_goal] || profile.primary_goal}
              </Text>
            </View>
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
                <Text style={styles.label}>Training Frequency: </Text>
                {profile.workout_frequency} {profile.workout_frequency === 1 ? 'day' : 'days'} per week
              </Text>
            </View>
          </View>
        </View>

        {/* SECTION 2: HRT Status (only if on_hrt = true) */}
        {profile.on_hrt && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>HRT Status</Text>
              <TouchableOpacity onPress={() => handleEdit('HRTAndBinding')} style={styles.editButton}>
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
              {profile.hrt_months_duration !== undefined && profile.hrt_months_duration > 0 && (
                <View style={styles.bulletItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.summaryBullet}>
                    <Text style={styles.label}>Duration: </Text>
                    {formatMonths(profile.hrt_months_duration)}
                  </Text>
                </View>
              )}
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.summaryBullet}>
                  Impact on Programming: We've adjusted recovery time and volume for HRT
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* SECTION 3: Binding Status (only if binds_chest = true) */}
        {profile.binds_chest && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Binding Status</Text>
              <TouchableOpacity onPress={() => handleEdit('HRTAndBinding')} style={styles.editButton}>
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
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.summaryBullet}>
                  Impact on Programming: We'll exclude chest compression exercises
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
                const isRecovering = surgery.weeks_post_op !== undefined && surgery.weeks_post_op < 12;
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
                    {surgery.weeks_post_op !== undefined && (
                      <View style={styles.bulletItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.summaryBullet}>
                          <Text style={styles.label}>Weeks Post-Op: </Text>
                          {surgery.weeks_post_op} {surgery.weeks_post_op === 1 ? 'week' : 'weeks'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.bulletItem}>
                      <View style={styles.bullet} />
                      <Text style={styles.summaryBullet}>
                        <Text style={styles.label}>Status: </Text>
                        {isRecovering ? 'Still recovering' : 'Fully healed'}
                      </Text>
                    </View>
                    {surgery.notes && (
                      <View style={styles.bulletItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.summaryBullet}>
                          <Text style={styles.label}>Notes: </Text>
                          {surgery.notes}
                        </Text>
                      </View>
                    )}
                    <View style={styles.bulletItem}>
                      <View style={styles.bullet} />
                      <Text style={styles.summaryBullet}>
                        Impact on Programming: We'll avoid exercises that stress surgical sites
                      </Text>
                    </View>
                    {index < profile.surgeries!.length - 1 && <View style={styles.surgerySeparator} />}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* SECTION 5: Equipment */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Equipment</Text>
            <TouchableOpacity onPress={() => handleEdit('Goals')} style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.summaryBullet}>
                <Text style={styles.label}>Available Equipment: </Text>
                {formatEquipment()}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.ctaContainer}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        <Button
          mode="contained"
          onPress={handleGeneratePlan}
          disabled={generating}
          style={styles.generateButton}
          contentStyle={styles.generateButtonContent}
          labelStyle={styles.generateButtonLabel}
        >
          {generating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={palette.deepBlack} style={styles.loadingSpinner} />
              <Text style={styles.generateButtonLabel}>Generating Plan...</Text>
            </View>
          ) : (
            'Generate My Plan'
          )}
        </Button>
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
    marginBottom: spacing.m,
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
    borderRadius: 20,
    padding: spacing.l,
    borderWidth: 2,
    borderColor: palette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.s,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: palette.tealPrimary,
    marginTop: 7,
    marginRight: spacing.s,
    flexShrink: 0,
  },
  summaryBullet: {
    ...typography.body,
    color: palette.lightGray,
    flex: 1,
    lineHeight: 22,
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
    backgroundColor: palette.darkerCard,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: palette.error,
  },
  generateButton: {
    borderRadius: 12,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  generateButtonContent: {
    paddingVertical: spacing.s,
    backgroundColor: palette.tealPrimary,
  },
  generateButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.deepBlack,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    marginRight: spacing.s,
  },
  errorText: {
    ...typography.bodySmall,
    color: palette.error,
    textAlign: 'center',
  },
});
