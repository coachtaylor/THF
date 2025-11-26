import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import type { OnboardingScreenProps } from '../../../types/onboarding';
import { useProfile } from '../../../hooks/useProfile';
import { generatePlan } from '../../../services/planGenerator';
import { savePlan } from '../../../services/storage/plan';
import { Profile } from '../../../types';
import ProgressIndicator from '../../../components/onboarding/ProgressIndicator';
import { formatEquipmentLabel } from '../../../utils/equipment';
import { filterExercisesByConstraints } from '../../../services/data/exerciseFilters';
import { fetchAllExercises } from '../../../services/exerciseService';

// Label mappings
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
  body_contact: 'Body contact (spotting, partner work)',
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

// Date formatting functions
const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return 'Not specified';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = months[dateObj.getMonth()];
  const day = dateObj.getDate();
  const year = dateObj.getFullYear();
  return `${month} ${day}, ${year}`;
};

const formatHRTStartDate = (date: Date | string | null | undefined): string => {
  if (!date) return 'Not specified';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${month} ${year}`;
};

// SVG Components
const SuccessCheckmarkSVG = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path
      d="M3 9 L7 13 L15 5"
      stroke="#0F1419"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function Review({ navigation }: OnboardingScreenProps<'Review'>) {
  const { profile, refreshProfile } = useProfile();
  const insets = useSafeAreaInsets();

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
      const exercisesPerSession = profile.fitness_experience === 'beginner' ? 8 : 
                                   profile.fitness_experience === 'intermediate' ? 10 : 12;
      return exercisesPerSession * (profile.workout_frequency || 3);
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
    }, [refreshProfile])
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

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);

      const profileWithBlockLength = {
        ...profile,
        block_length: 4,
      };

      const plan = await generatePlan(profileWithBlockLength);
      await savePlan(plan);
      
      setGenerating(false);
      navigation.navigate('PlanView');
    } catch (err) {
      console.error('Failed to generate plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
      setGenerating(false);
    }
  };

  const formatEquipment = (): string => {
    const equipment = profile.equipment || [];
    if (equipment.length === 0) return 'No equipment selected';
    return equipment.map((e) => formatEquipmentLabel(e)).join(', ');
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <ProgressIndicator currentStep={8} totalSteps={8} />
          <Text style={styles.headline}>Review Your Profile</Text>
          <Text style={styles.subheadline}>
            Everything looks good? Generate your program
          </Text>
        </View>

        {/* SUCCESS SUMMARY */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.successBadge}>
              <View style={styles.successIconContainer}>
                <SuccessCheckmarkSVG />
              </View>
              <Text style={styles.successTitle}>Profile Complete!</Text>
            </View>
            
            <Text style={styles.summaryDescription}>
              Your personalized program will include:
            </Text>
            
            <View style={styles.highlightList}>
              <View style={styles.highlightItem}>
                <View style={styles.highlightDot} />
                <Text style={styles.highlightText}>
                  {exerciseCount || '...'} exercises tailored to your equipment
                </Text>
              </View>
              <View style={styles.highlightItem}>
                <View style={styles.highlightDot} />
                <Text style={styles.highlightText}>
                  {safetyRulesCount} safety {safetyRulesCount === 1 ? 'rule' : 'rules'} for your needs
                </Text>
              </View>
              <View style={styles.highlightItem}>
                <View style={styles.highlightDot} />
                <Text style={styles.highlightText}>
                  {profile.workout_frequency || 3}-day training split
                </Text>
              </View>
              <View style={styles.highlightItem}>
                <View style={styles.highlightDot} />
                <Text style={styles.highlightText}>
                  {profile.session_duration || 30}-minute sessions
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* IDENTITY SECTION */}
        {(profile.gender_identity || profile.pronouns) && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Identity</Text>
                <TouchableOpacity style={styles.editButton} onPress={() => handleEdit('GenderIdentity')}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.sectionContent}>
                {profile.gender_identity && (
                  <View style={styles.dataItem}>
                    <View style={styles.dataDot} />
                    <Text style={styles.dataValue}>
                      <Text style={styles.dataLabel}>Gender: </Text>
                      {GENDER_IDENTITY_LABELS[profile.gender_identity] || profile.gender_identity}
                    </Text>
                  </View>
                )}
                {profile.pronouns && (
                  <View style={styles.dataItem}>
                    <View style={styles.dataDot} />
                    <Text style={styles.dataValue}>
                      <Text style={styles.dataLabel}>Pronouns: </Text>
                      {profile.pronouns}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* HRT STATUS SECTION */}
        {profile.on_hrt && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>HRT Status</Text>
                <TouchableOpacity style={styles.editButton} onPress={() => handleEdit('HRTStatus')}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.sectionContent}>
                {profile.hrt_type && (
                  <View style={styles.dataItem}>
                    <View style={styles.dataDot} />
                    <Text style={styles.dataValue}>
                      <Text style={styles.dataLabel}>Type: </Text>
                      {HRT_TYPE_LABELS[profile.hrt_type] || profile.hrt_type}
                    </Text>
                  </View>
                )}
                {profile.hrt_start_date && (
                  <View style={styles.dataItem}>
                    <View style={styles.dataDot} />
                    <Text style={styles.dataValue}>
                      <Text style={styles.dataLabel}>Started: </Text>
                      {formatHRTStartDate(profile.hrt_start_date)}
                    </Text>
                  </View>
                )}
                {profile.hrt_months_duration !== undefined && profile.hrt_months_duration > 0 && (
                  <View style={styles.dataItem}>
                    <View style={styles.dataDot} />
                    <Text style={styles.dataValue}>
                      <Text style={styles.dataLabel}>Duration: </Text>
                      {profile.hrt_months_duration} {profile.hrt_months_duration === 1 ? 'month' : 'months'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* BINDING SECTION */}
        {profile.binds_chest && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Binding Information</Text>
                <TouchableOpacity style={styles.editButton} onPress={() => handleEdit('BindingInfo')}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.sectionContent}>
                {profile.binding_frequency && (
                  <View style={styles.dataItem}>
                    <View style={styles.dataDot} />
                    <Text style={styles.dataValue}>
                      <Text style={styles.dataLabel}>Frequency: </Text>
                      {BINDING_FREQUENCY_LABELS[profile.binding_frequency] || profile.binding_frequency}
                    </Text>
                  </View>
                )}
                {profile.binding_duration_hours !== undefined && profile.binding_duration_hours > 0 && (
                  <View style={styles.dataItem}>
                    <View style={styles.dataDot} />
                    <Text style={styles.dataValue}>
                      <Text style={styles.dataLabel}>Duration: </Text>
                      {profile.binding_duration_hours} {profile.binding_duration_hours === 1 ? 'hour' : 'hours'} per session
                    </Text>
                  </View>
                )}
                {profile.binder_type && (
                  <View style={styles.dataItem}>
                    <View style={styles.dataDot} />
                    <Text style={styles.dataValue}>
                      <Text style={styles.dataLabel}>Binder Type: </Text>
                      {BINDER_TYPE_LABELS[profile.binder_type] || profile.binder_type}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* SURGERY SECTION */}
        {profile.surgeries && profile.surgeries.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Surgery History</Text>
                <TouchableOpacity style={styles.editButton} onPress={() => handleEdit('Surgery')}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.sectionContent}>
                {profile.surgeries.map((surgery, index) => {
                  const status = surgery.fully_healed 
                    ? 'Fully healed'
                    : surgery.weeks_post_op !== undefined 
                      ? `${surgery.weeks_post_op} ${surgery.weeks_post_op === 1 ? 'week' : 'weeks'} post-op`
                      : 'Status unknown';
                  return (
                    <View key={index} style={[styles.dataItem, index < profile.surgeries!.length - 1 && styles.dataItemWithMargin]}>
                      <View style={styles.dataDot} />
                      <View style={styles.dataValueContainer}>
                        <Text style={styles.dataValue}>
                          <Text style={styles.dataLabel}>Type: </Text>
                          {SURGERY_TYPE_LABELS[surgery.type] || surgery.type}
                        </Text>
                        {surgery.date && (
                          <Text style={styles.dataValue}>
                            <Text style={styles.dataLabel}>Date: </Text>
                            {formatDate(surgery.date)}
                          </Text>
                        )}
                        <Text style={styles.dataValue}>
                          <Text style={styles.dataLabel}>Status: </Text>
                          {status}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* GOALS SECTION */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Goals</Text>
              <TouchableOpacity style={styles.editButton} onPress={() => handleEdit('Goals')}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sectionContent}>
              {profile.primary_goal && (
                <View style={styles.dataItem}>
                  <View style={styles.dataDot} />
                  <Text style={styles.dataValue}>
                    <Text style={styles.dataLabel}>Primary Goal: </Text>
                    {PRIMARY_GOAL_LABELS[profile.primary_goal] || profile.primary_goal}
                  </Text>
                </View>
              )}
              {profile.secondary_goals && profile.secondary_goals.length > 0 && (
                <View style={styles.dataItem}>
                  <View style={styles.dataDot} />
                  <Text style={styles.dataValue}>
                    <Text style={styles.dataLabel}>Secondary Goals: </Text>
                    {profile.secondary_goals.map(g => PRIMARY_GOAL_LABELS[g] || g).join(', ')}
                  </Text>
                </View>
              )}
              {profile.body_focus_prefer && profile.body_focus_prefer.length > 0 && (
                <View style={styles.dataItem}>
                  <View style={styles.dataDot} />
                  <Text style={styles.dataValue}>
                    <Text style={styles.dataLabel}>Focus More On: </Text>
                    {profile.body_focus_prefer.join(', ')}
                  </Text>
                </View>
              )}
              {profile.body_focus_soft_avoid && profile.body_focus_soft_avoid.length > 0 && (
                <View style={styles.dataItem}>
                  <View style={styles.dataDot} />
                  <Text style={styles.dataValue}>
                    <Text style={styles.dataLabel}>Go Gently With: </Text>
                    {profile.body_focus_soft_avoid.join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* EXPERIENCE & TRAINING SECTION */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Experience & Training</Text>
              <TouchableOpacity style={styles.editButton} onPress={() => handleEdit('Experience')}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sectionContent}>
              {profile.fitness_experience && (
                <View style={styles.dataItem}>
                  <View style={styles.dataDot} />
                  <Text style={styles.dataValue}>
                    <Text style={styles.dataLabel}>Experience Level: </Text>
                    {FITNESS_EXPERIENCE_LABELS[profile.fitness_experience] || profile.fitness_experience}
                  </Text>
                </View>
              )}
              {profile.equipment && profile.equipment.length > 0 && (
                <View style={styles.dataItem}>
                  <View style={styles.dataDot} />
                  <Text style={styles.dataValue}>
                    <Text style={styles.dataLabel}>Equipment: </Text>
                    {formatEquipment()}
                  </Text>
                </View>
              )}
              {profile.workout_frequency && (
                <View style={styles.dataItem}>
                  <View style={styles.dataDot} />
                  <Text style={styles.dataValue}>
                    <Text style={styles.dataLabel}>Frequency: </Text>
                    {profile.workout_frequency} {profile.workout_frequency === 1 ? 'day' : 'days'} per week
                  </Text>
                </View>
              )}
              {profile.session_duration && (
                <View style={styles.dataItem}>
                  <View style={styles.dataDot} />
                  <Text style={styles.dataValue}>
                    <Text style={styles.dataLabel}>Session Duration: </Text>
                    {profile.session_duration} minutes
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* DYSPHORIA SECTION */}
        {profile.dysphoria_triggers && profile.dysphoria_triggers.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Dysphoria Triggers</Text>
                <TouchableOpacity style={styles.editButton} onPress={() => handleEdit('DysphoriaTriggers')}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.dataItem}>
                  <View style={styles.dataDot} />
                  <Text style={styles.dataValue}>
                    <Text style={styles.dataLabel}>Triggers: </Text>
                    {profile.dysphoria_triggers.map(t => DYSPHORIA_TRIGGER_LABELS[t] || t).join(', ')}
                  </Text>
                </View>
                {profile.dysphoria_notes && (
                  <View style={styles.dataItem}>
                    <View style={styles.dataDot} />
                    <Text style={styles.dataValue}>
                      <Text style={styles.dataLabel}>Notes: </Text>
                      {profile.dysphoria_notes.length > 100 
                        ? `${profile.dysphoria_notes.substring(0, 100)}...` 
                        : profile.dysphoria_notes}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* FOOTER (SCROLLS WITH CONTENT) */}
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={[styles.generateButton, generating && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={generating}
          >
            <LinearGradient
              colors={['#00D9C0', '#00B39D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              {generating ? (
                <View style={styles.buttonContentContainer}>
                  <ActivityIndicator color="#0F1419" size="small" />
                  <Text style={styles.loadingText}>Generating Your Program...</Text>
                </View>
              ) : (
                <View style={styles.buttonContentContainer}>
                  <Text style={styles.buttonMainText}>Generate Your Program</Text>
                  <Text style={styles.buttonSubText}>Personalized for your needs</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
          
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          
          <Text style={styles.hintText}>
            This will take about 10 seconds
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
  summaryContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  summaryCard: {
    backgroundColor: 'rgba(0, 217, 192, 0.08)',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#00D9C0',
    borderLeftWidth: 4,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  successIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00D9C0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00D9C0',
    textAlign: 'left',
  },
  summaryDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#B8C5C5',
    lineHeight: 21,
    marginBottom: 16,
    textAlign: 'left',
  },
  highlightList: {
    // No bullets, clean list
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  highlightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00D9C0',
    marginRight: 12,
    marginTop: 7,
  },
  highlightText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E0E4E8',
    flex: 1,
    lineHeight: 21,
    textAlign: 'left',
  },
  sectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionCard: {
    backgroundColor: '#1A1F26',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2A2F36',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2F36',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'left',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 217, 192, 0.12)',
    borderWidth: 1,
    borderColor: '#00D9C0',
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00D9C0',
  },
  sectionContent: {
    // List of data items
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  dataItemWithMargin: {
    marginBottom: 16,
  },
  dataDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#00D9C0',
    marginRight: 12,
    marginTop: 7,
    flexShrink: 0,
  },
  dataValueContainer: {
    flex: 1,
  },
  dataLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E0E4E8',
    flex: 1,
    lineHeight: 21,
    textAlign: 'left',
  },
  footerContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 0,
  },
  generateButton: {
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#00D9C0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContentContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  buttonMainText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F1419',
    marginBottom: 2,
  },
  buttonSubText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(15, 20, 25, 0.7)',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F1419',
    marginTop: 8,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 8,
  },
});
