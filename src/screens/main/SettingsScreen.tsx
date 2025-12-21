import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform, Linking, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { deleteProfile, updateProfile } from '../../services/storage/profile';
import { signalLogout } from '../../services/events/onboardingEvents';
import { generatePlan } from '../../services/planGenerator';
import { savePlan } from '../../services/storage/plan';
import { usePlan } from '../../hooks/usePlan';
import { restorePurchases } from '../../services/payments/revenueCat';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { GlassCard, GlassButton, GlassListItem, GlassList, GlassModal } from '../../components/common';
import { BetaSurveyModal, SurveyResponse } from '../../components/feedback';
import { saveSurveyResponse } from '../../services/feedback';
import {
  EditProfileModal,
  EditHRTModal,
  EditBindingModal,
  EditGoalsModal,
  EditTrainingModal,
  EditEnvironmentModal,
} from '../../components/settings';
import { getWorkoutHistory } from '../../services/storage/workoutLog';

// Settings storage keys
const SETTINGS_STORAGE_KEY = '@transfitness:app_settings';

type MainTabParamList = {
  Home: undefined;
  Workouts: undefined;
  Progress: undefined;
  Settings: undefined;
};

type SettingsScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Settings'>;

type RootStackParamList = {
  BinderSafetyGuide: undefined;
  PostOpMovementGuide: undefined;
  Copilot: undefined;
};

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp & { navigate: (screen: keyof RootStackParamList | 'Paywall') => void }>();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { logout } = useAuth();
  const { refreshPlan } = usePlan(profile?.user_id || profile?.id || 'default');
  const { isPremium, status, restore, isLoading: subscriptionLoading } = useSubscription();

  // Modal states
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Edit modal states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditHRT, setShowEditHRT] = useState(false);
  const [showEditBinding, setShowEditBinding] = useState(false);
  const [showEditGoals, setShowEditGoals] = useState(false);
  const [showEditTraining, setShowEditTraining] = useState(false);
  const [showEditEnvironment, setShowEditEnvironment] = useState(false);

  // App settings state
  const [restTimerSound, setRestTimerSound] = useState(true);
  const [units, setUnits] = useState<'lbs' | 'kg'>('lbs');

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsJson = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (settingsJson) {
          const settings = JSON.parse(settingsJson);
          if (settings.restTimerSound !== undefined) {
            setRestTimerSound(settings.restTimerSound);
          }
          if (settings.units) {
            setUnits(settings.units);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Save settings to AsyncStorage
  const saveSettings = useCallback(async (newSettings: { restTimerSound?: boolean; units?: 'lbs' | 'kg' }) => {
    try {
      const currentJson = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      const current = currentJson ? JSON.parse(currentJson) : {};
      const updated = { ...current, ...newSettings };
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, []);

  const handleEdit = (section: string) => {
    switch (section) {
      case 'profile':
        setShowEditProfile(true);
        break;
      case 'hrt':
        setShowEditHRT(true);
        break;
      case 'binding':
        setShowEditBinding(true);
        break;
      case 'surgery':
        // Surgery editing would need a more complex modal - for now show alert
        Alert.alert(
          'Edit Surgery History',
          'To update your surgery history, please use the "Reset Onboarding" option in Debug settings to go through onboarding again.',
          [{ text: 'OK' }]
        );
        break;
      case 'goals':
        setShowEditGoals(true);
        break;
      case 'training':
        setShowEditTraining(true);
        break;
      case 'environment':
        setShowEditEnvironment(true);
        break;
      default:
        console.log('Edit section:', section);
    }
  };

  const handleProfileSaved = useCallback((affectsWorkout: boolean = false) => {
    // Profile will be refreshed automatically via useProfile hook
    if (affectsWorkout && profile) {
      Alert.alert(
        'Profile Updated',
        'Your profile has been updated. Changes to HRT, binding, or fitness settings may affect your workout plan. Would you like to regenerate your plan now?',
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Regenerate',
            onPress: async () => {
              try {
                setIsRegenerating(true);
                const userId = profile.user_id || profile.id || 'default';
                const newPlan = await generatePlan(profile);
                await savePlan(newPlan, userId);
                await refreshPlan?.();
                setIsRegenerating(false);
                Alert.alert('Success', 'Your workout plan has been updated!');
              } catch (error) {
                console.error('Error regenerating plan:', error);
                setIsRegenerating(false);
                Alert.alert('Error', 'Failed to regenerate plan. Please try again.');
              }
            },
          },
        ]
      );
    } else {
      Alert.alert('Success', 'Your profile has been updated.');
    }
  }, [profile, refreshPlan]);

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const userId = profile?.user_id || profile?.id || 'default';
      const history = await getWorkoutHistory(userId, 100);

      if (history.length === 0) {
        Alert.alert('No Data', 'You have no workout history to export yet.');
        return;
      }

      // Format workout data for export
      const exportData = {
        exportDate: new Date().toISOString(),
        totalWorkouts: history.length,
        workouts: history.map((log) => ({
          date: log.workout_date.toISOString().split('T')[0],
          duration: log.duration_minutes,
          exercisesCompleted: log.exercises_completed,
          totalVolume: log.total_volume,
          averageRPE: log.average_rpe,
          rating: log.workout_rating,
        })),
      };

      const jsonString = JSON.stringify(exportData, null, 2);

      // Use Share API to share the data
      await Share.share({
        message: jsonString,
        title: 'TransFitness Workout Data',
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export workout data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteAccountModal(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      await deleteProfile();
      await logout();
      setShowDeleteAccountModal(false);
      signalLogout();
    } catch (error) {
      console.error('Delete account error:', error);
      setIsDeletingAccount(false);
      setShowDeleteAccountModal(false);
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    }
  };

  const formatGenderIdentity = (gender?: string) => {
    if (!gender) return 'Not specified';
    const map: Record<string, string> = {
      mtf: 'Transfeminine',
      ftm: 'Transmasculine',
      nonbinary: 'Non-binary',
      questioning: 'Questioning',
    };
    return map[gender] || gender;
  };

  const formatHRTType = (hrtType?: string) => {
    if (!hrtType || hrtType === 'none') return 'Not on HRT';
    if (hrtType === 'estrogen_blockers') return 'Estrogen + anti-androgens';
    if (hrtType === 'testosterone') return 'Testosterone';
    return hrtType;
  };

  const formatSurgeryType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatGoal = (goal?: string) => {
    if (!goal) return 'Not set';
    return goal
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatEnvironment = (env?: string) => {
    if (!env) return 'Not set';
    const map: Record<string, string> = {
      home: 'Home',
      gym: 'Commercial Gym',
      studio: 'Small Studio',
      outdoors: 'Outdoors / Mixed',
    };
    return map[env] || env;
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setShowLogoutModal(false);
      // Signal App.tsx to switch to OnboardingNavigator
      signalLogout();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
      setShowLogoutModal(false);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const handleResetOnboarding = () => {
    setShowResetModal(true);
  };

  const confirmResetOnboarding = async () => {
    try {
      setIsResetting(true);
      await deleteProfile();
      await logout();
      setShowResetModal(false);
      // Signal App.tsx to switch to OnboardingNavigator
      signalLogout();
    } catch (error) {
      console.error('Reset onboarding error:', error);
      setIsResetting(false);
      setShowResetModal(false);
      Alert.alert('Error', 'Failed to reset onboarding. Please try again.');
    }
  };

  const handleOpenCopilot = () => {
    navigation.navigate('Copilot');
  };

  const handleGiveFeedback = () => {
    setShowSurveyModal(true);
  };

  const handleSurveySubmit = async (response: SurveyResponse) => {
    await saveSurveyResponse(response, 'settings');
    setShowSurveyModal(false);
    Alert.alert('Thank you!', 'Your feedback helps us make TransFitness better for everyone.');
  };

  const handleSurveySkip = () => {
    setShowSurveyModal(false);
  };

  const handleRegeneratePlan = async () => {
    if (!profile) return;

    try {
      setIsRegenerating(true);
      const userId = profile.user_id || profile.id || 'default';

      // Generate new plan with current profile (uses new workout day scheduling)
      const newPlan = await generatePlan(profile);

      // Save the new plan
      await savePlan(newPlan, userId);

      // Refresh the plan in context
      await refreshPlan?.();

      setIsRegenerating(false);
      Alert.alert('Success', 'Your workout plan has been regenerated with the new scheduling!');
    } catch (error) {
      console.error('Error regenerating plan:', error);
      setIsRegenerating(false);
      Alert.alert('Error', 'Failed to regenerate plan. Please try again.');
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setIsRestoring(true);
      const restored = await restore();
      setIsRestoring(false);

      if (restored) {
        Alert.alert('Success', 'Your subscription has been restored!');
      } else {
        Alert.alert('No Subscription Found', 'No previous subscription was found for this account.');
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
      setIsRestoring(false);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    }
  };

  const handleManageSubscription = () => {
    // Open App Store subscription management
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  };

  const handleUpgrade = () => {
    navigation.navigate('Paywall');
  };

  // Format subscription status for display
  const getSubscriptionStatusText = () => {
    if (subscriptionLoading) return 'Loading...';
    if (isPremium) {
      if (status.expirationDate) {
        const expDate = new Date(status.expirationDate);
        return `Premium (renews ${expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
      }
      return 'Premium';
    }
    return 'Free';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            navigation.dispatch(
              CommonActions.navigate({ name: 'Home', params: {} })
            );
          }}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <GlassCard variant="hero" shimmer style={styles.profileCard}>
          <View style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[colors.accent.primary, colors.accent.secondary]}
                style={styles.avatarGradient}
              >
                <Ionicons name="person" size={32} color={colors.text.inverse} />
              </LinearGradient>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profilePronouns}>
                {profile?.pronouns || 'No pronouns set'}
              </Text>
              <Text style={styles.profileIdentity}>
                {formatGenderIdentity(profile?.gender_identity)}
              </Text>
            </View>
            <Pressable onPress={() => handleEdit('profile')} hitSlop={8}>
              <View style={styles.editButton}>
                <Ionicons name="pencil" size={16} color={colors.accent.primary} />
              </View>
            </Pressable>
          </View>
        </GlassCard>

        {/* Subscription */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIcon, { backgroundColor: isPremium ? colors.accent.secondaryMuted : colors.accent.primaryMuted }]}>
                <Ionicons
                  name={isPremium ? 'star' : 'star-outline'}
                  size={16}
                  color={isPremium ? colors.accent.secondary : colors.accent.primary}
                />
              </View>
              <Text style={styles.sectionTitle}>Subscription</Text>
            </View>
          </View>
          <GlassCard variant={isPremium ? 'heroPink' : 'default'}>
            <View style={styles.subscriptionContent}>
              <View style={styles.subscriptionStatus}>
                <Text style={styles.subscriptionPlanLabel}>Current Plan</Text>
                <View style={styles.subscriptionPlanRow}>
                  <Text style={[styles.subscriptionPlanName, isPremium && styles.subscriptionPlanNamePremium]}>
                    {isPremium ? 'Premium' : 'Free'}
                  </Text>
                  {isPremium && (
                    <View style={styles.premiumBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={colors.accent.secondary} />
                    </View>
                  )}
                </View>
                {isPremium && status.expirationDate && (
                  <Text style={styles.subscriptionExpiry}>
                    {status.willRenew ? 'Renews' : 'Expires'}{' '}
                    {new Date(status.expirationDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                )}
                {!isPremium && (
                  <Text style={styles.subscriptionFreeInfo}>
                    2 workouts/week • Basic features
                  </Text>
                )}
              </View>
            </View>
          </GlassCard>

          {/* Subscription Actions */}
          <View style={styles.subscriptionActions}>
            {!isPremium && (
              <GlassButton
                title="Upgrade to Premium"
                variant="primary"
                icon="sparkles"
                onPress={handleUpgrade}
              />
            )}
            {isPremium && (
              <GlassListItem
                title="Manage Subscription"
                subtitle="Update payment, cancel, or change plan"
                leftIcon="card-outline"
                onPress={handleManageSubscription}
                showChevron
              />
            )}
            <GlassListItem
              title="Restore Purchases"
              subtitle={isRestoring ? 'Restoring...' : 'Recover previous subscription'}
              leftIcon="refresh-outline"
              onPress={handleRestorePurchases}
              showChevron
            />
          </View>
        </View>

        {/* HRT Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.accent.secondaryMuted }]}>
                <Ionicons name="medical" size={16} color={colors.accent.secondary} />
              </View>
              <Text style={styles.sectionTitle}>HRT Status</Text>
            </View>
            <Pressable onPress={() => handleEdit('hrt')} hitSlop={8}>
              <Text style={styles.editLink}>Edit</Text>
            </Pressable>
          </View>
          <GlassCard variant="default">
            {profile?.on_hrt ? (
              <View style={styles.infoContent}>
                <Text style={styles.infoText}>On {formatHRTType(profile.hrt_type)}</Text>
                {profile.hrt_start_date && (
                  <Text style={styles.infoSubtext}>
                    Started {new Date(profile.hrt_start_date).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                    {profile.hrt_months_duration ? ` (${profile.hrt_months_duration} months)` : ''}
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.infoText}>Not on HRT</Text>
            )}
          </GlassCard>
        </View>

        {/* Binding */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.accent.primaryMuted }]}>
                <Ionicons name="shield-checkmark" size={16} color={colors.accent.primary} />
              </View>
              <Text style={styles.sectionTitle}>Binding</Text>
            </View>
            <Pressable onPress={() => handleEdit('binding')} hitSlop={8}>
              <Text style={styles.editLink}>Edit</Text>
            </Pressable>
          </View>
          <GlassCard variant="default">
            {profile?.binds_chest ? (
              <View style={styles.infoContent}>
                {profile.binding_frequency && (
                  <Text style={styles.infoText}>Binds {profile.binding_frequency}</Text>
                )}
                {profile.binding_duration_hours && (
                  <Text style={styles.infoSubtext}>
                    {profile.binding_duration_hours} hours per session
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.infoText}>Does not bind</Text>
            )}
          </GlassCard>
        </View>

        {/* Surgery History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.accent.primaryMuted }]}>
                <Ionicons name="bandage" size={16} color={colors.accent.primary} />
              </View>
              <Text style={styles.sectionTitle}>Surgery History</Text>
            </View>
            <Pressable onPress={() => handleEdit('surgery')} hitSlop={8}>
              <Text style={styles.editLink}>Edit</Text>
            </Pressable>
          </View>
          <GlassCard variant="default">
            {profile?.surgeries && profile.surgeries.length > 0 ? (
              <View style={styles.infoContent}>
                {profile.surgeries.map((surgery, index) => (
                  <Text key={index} style={styles.infoText}>
                    {formatSurgeryType(surgery.type)} ({new Date(surgery.date).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })})
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={styles.infoText}>No surgeries</Text>
            )}
          </GlassCard>
        </View>

        {/* Fitness Goals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.accent.successMuted }]}>
                <Ionicons name="trophy" size={16} color={colors.success} />
              </View>
              <Text style={styles.sectionTitle}>Fitness Goals</Text>
            </View>
            <Pressable onPress={() => handleEdit('goals')} hitSlop={8}>
              <Text style={styles.editLink}>Edit</Text>
            </Pressable>
          </View>
          <GlassCard variant="default">
            <View style={styles.infoContent}>
              <Text style={styles.infoText}>
                Primary: {formatGoal(profile?.primary_goal)}
              </Text>
              {profile?.secondary_goals && profile.secondary_goals.length > 0 && (
                <Text style={styles.infoSubtext}>
                  Secondary: {profile.secondary_goals.map(formatGoal).join(', ')}
                </Text>
              )}
            </View>
          </GlassCard>
        </View>

        {/* Training Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.accent.primaryMuted }]}>
                <Ionicons name="barbell" size={16} color={colors.accent.primary} />
              </View>
              <Text style={styles.sectionTitle}>Training Preferences</Text>
            </View>
            <Pressable onPress={() => handleEdit('training')} hitSlop={8}>
              <Text style={styles.editLink}>Edit</Text>
            </Pressable>
          </View>
          <GlassCard variant="default">
            <View style={styles.infoContent}>
              <Text style={styles.infoText}>
                {profile?.fitness_experience
                  ? profile.fitness_experience.charAt(0).toUpperCase() + profile.fitness_experience.slice(1)
                  : 'Not set'} level
              </Text>
              <Text style={styles.infoSubtext}>
                {profile?.workout_frequency || 0} days/week, {profile?.session_duration || 0} min sessions
              </Text>
              <Text style={styles.infoSubtext}>
                Equipment: {profile?.equipment?.join(', ') || 'None'}
              </Text>
            </View>
          </GlassCard>
        </View>

        {/* Training Environment */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.accent.primaryMuted }]}>
                <Ionicons name="location" size={16} color={colors.accent.primary} />
              </View>
              <Text style={styles.sectionTitle}>Training Environment</Text>
            </View>
            <Pressable onPress={() => handleEdit('environment')} hitSlop={8}>
              <Text style={styles.editLink}>Edit</Text>
            </Pressable>
          </View>
          <GlassCard variant="default">
            <View style={styles.infoContent}>
              <Text style={styles.infoText}>
                {formatEnvironment(profile?.training_environment)}
              </Text>
              <Text style={styles.infoSubtext}>
                {profile?.training_environment === 'home' && 'Workouts optimized for home with minimal equipment'}
                {profile?.training_environment === 'gym' && 'Full access to gym equipment and machines'}
                {profile?.training_environment === 'studio' && 'Workouts for studio environments with basic equipment'}
                {profile?.training_environment === 'outdoors' && 'Portable and bodyweight exercises for any location'}
                {!profile?.training_environment && 'Set your training environment to get customized workouts'}
              </Text>
            </View>
          </GlassCard>
        </View>

        {/* Ask Copilot */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.accent.secondaryMuted }]}>
                <Ionicons name="chatbubbles" size={16} color={colors.accent.secondary} />
              </View>
              <Text style={styles.sectionTitle}>Ask Copilot</Text>
            </View>
          </View>
          <GlassList>
            <GlassListItem
              title="Chat with Copilot"
              subtitle="Questions about binding, HRT, workouts, and more"
              leftIcon="chatbubble-ellipses-outline"
              onPress={handleOpenCopilot}
              showChevron
            />
          </GlassList>
        </View>

        {/* Education & Guides */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.accent.primaryMuted }]}>
                <Ionicons name="book" size={16} color={colors.accent.primary} />
              </View>
              <Text style={styles.sectionTitle}>Education & Guides</Text>
            </View>
          </View>
          <GlassList>
            <GlassListItem
              title="Binder Safety Basics"
              subtitle="Safe exercise while binding"
              leftIcon="shield-checkmark-outline"
              onPress={() => navigation.navigate('BinderSafetyGuide')}
              showChevron
            />
            <GlassListItem
              title="Post-Op Movement Guide"
              subtitle="Returning to training after surgery"
              leftIcon="trending-up-outline"
              onPress={() => navigation.navigate('PostOpMovementGuide')}
              showChevron
            />
          </GlassList>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.glass.bgLight }]}>
                <Ionicons name="settings" size={16} color={colors.text.secondary} />
              </View>
              <Text style={styles.sectionTitle}>App Settings</Text>
            </View>
          </View>
          <GlassList>
            <GlassListItem
              title="Notifications"
              rightIcon="chevron-forward"
              onPress={() => {
                // Open system settings for notifications
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }}
            />
            <GlassListItem
              title="Rest timer sound"
              rightValue={restTimerSound ? 'Enabled' : 'Disabled'}
              onPress={() => {
                const newValue = !restTimerSound;
                setRestTimerSound(newValue);
                saveSettings({ restTimerSound: newValue });
              }}
            />
            <GlassListItem
              title="Units"
              rightValue={units}
              onPress={() => {
                const newUnits = units === 'lbs' ? 'kg' : 'lbs';
                setUnits(newUnits);
                saveSettings({ units: newUnits });
              }}
            />
            <GlassListItem
              title="Theme"
              subtitle="Coming soon"
              rightValue="Dark"
            />
          </GlassList>
        </View>

        {/* Data & Privacy */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.glass.bgLight }]}>
                <Ionicons name="shield" size={16} color={colors.text.secondary} />
              </View>
              <Text style={styles.sectionTitle}>Data & Privacy</Text>
            </View>
          </View>
          <GlassList>
            <GlassListItem
              title="Export workout data"
              subtitle={isExporting ? 'Exporting...' : undefined}
              leftIcon="download-outline"
              onPress={handleExportData}
              showChevron
            />
            <GlassListItem
              title="Delete account"
              leftIcon="trash-outline"
              variant="danger"
              onPress={handleDeleteAccount}
              showChevron
            />
            <GlassListItem
              title="Privacy policy"
              leftIcon="document-text-outline"
              onPress={() => Linking.openURL('https://transfitness.app/privacy')}
              showChevron
            />
          </GlassList>
        </View>

        {/* Debug Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.accent.warningMuted }]}>
                <Ionicons name="bug" size={16} color={colors.warning} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.warning }]}>Debug</Text>
            </View>
          </View>
          <GlassList>
            <GlassListItem
              title="Regenerate Plan"
              subtitle={isRegenerating ? "Regenerating..." : "Create new plan with current settings"}
              leftIcon="sync-outline"
              onPress={handleRegeneratePlan}
              showChevron
            />
            <GlassListItem
              title="Reset Onboarding"
              subtitle="Delete profile and restart"
              leftIcon="refresh-outline"
              variant="danger"
              onPress={handleResetOnboarding}
              showChevron
            />
          </GlassList>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIcon, { backgroundColor: colors.glass.bgLight }]}>
                <Ionicons name="help-circle" size={16} color={colors.text.secondary} />
              </View>
              <Text style={styles.sectionTitle}>Support</Text>
            </View>
          </View>
          <GlassList>
            <GlassListItem
              title="Contact support"
              leftIcon="mail-outline"
              onPress={() => {
                Linking.openURL('mailto:support@transfitness.app?subject=TransFitness Support Request');
              }}
              showChevron
            />
            <GlassListItem
              title="Report a bug"
              leftIcon="bug-outline"
              onPress={() => {
                Linking.openURL('mailto:support@transfitness.app?subject=TransFitness Bug Report&body=Please describe the bug you encountered:%0A%0ADevice: ' + Platform.OS + '%0AApp Version: 1.0.0');
              }}
              showChevron
            />
            <GlassListItem
              title="Give feedback"
              subtitle="Help us improve TransFitness"
              leftIcon="star-outline"
              onPress={handleGiveFeedback}
              showChevron
            />
          </GlassList>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <GlassButton
            title="Log Out"
            variant="danger"
            icon="log-out-outline"
            onPress={handleLogout}
          />
        </View>

        {/* Version */}
        <Text style={styles.versionText}>TransFitness v1.0.0</Text>
      </ScrollView>

      {/* Logout Modal */}
      <GlassModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Log Out"
        message="Are you sure you want to log out? You'll need to sign in again to access your workouts."
        icon="log-out-outline"
        iconColor={colors.error}
        actions={[
          {
            label: 'Log Out',
            onPress: confirmLogout,
            variant: 'danger',
            loading: isLoggingOut,
          },
          {
            label: 'Cancel',
            onPress: () => setShowLogoutModal(false),
            variant: 'secondary',
          },
        ]}
      />

      {/* Reset Onboarding Modal */}
      <GlassModal
        visible={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Everything"
        message="This will delete your profile, workout history, and log you out. You'll start fresh with onboarding. This cannot be undone."
        icon="warning-outline"
        iconColor={colors.warning}
        actions={[
          {
            label: 'Reset & Log Out',
            onPress: confirmResetOnboarding,
            variant: 'danger',
            loading: isResetting,
          },
          {
            label: 'Cancel',
            onPress: () => setShowResetModal(false),
            variant: 'secondary',
          },
        ]}
      />

      {/* Beta Survey Modal */}
      <BetaSurveyModal
        visible={showSurveyModal}
        onSubmit={handleSurveySubmit}
        onSkip={handleSurveySkip}
      />

      {/* Delete Account Modal */}
      <GlassModal
        visible={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        title="Delete Account"
        message="This will permanently delete your account, profile, and all workout data. This action cannot be undone."
        icon="trash-outline"
        iconColor={colors.error}
        actions={[
          {
            label: 'Delete Account',
            onPress: confirmDeleteAccount,
            variant: 'danger',
            loading: isDeletingAccount,
          },
          {
            label: 'Cancel',
            onPress: () => setShowDeleteAccountModal(false),
            variant: 'secondary',
          },
        ]}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        profile={profile}
        onSave={handleProfileSaved}
      />

      {/* Edit HRT Modal - affects workouts */}
      <EditHRTModal
        visible={showEditHRT}
        onClose={() => setShowEditHRT(false)}
        profile={profile}
        onSave={() => handleProfileSaved(true)}
      />

      {/* Edit Binding Modal - affects workouts */}
      <EditBindingModal
        visible={showEditBinding}
        onClose={() => setShowEditBinding(false)}
        profile={profile}
        onSave={() => handleProfileSaved(true)}
      />

      {/* Edit Goals Modal - affects workouts */}
      <EditGoalsModal
        visible={showEditGoals}
        onClose={() => setShowEditGoals(false)}
        profile={profile}
        onSave={() => handleProfileSaved(true)}
      />

      {/* Edit Training Modal - affects workouts */}
      <EditTrainingModal
        visible={showEditTraining}
        onClose={() => setShowEditTraining(false)}
        profile={profile}
        onSave={() => handleProfileSaved(true)}
      />

      {/* Edit Environment Modal - affects workouts */}
      <EditEnvironmentModal
        visible={showEditEnvironment}
        onClose={() => setShowEditEnvironment(false)}
        profile={profile}
        onSave={() => handleProfileSaved(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.m,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    marginBottom: spacing.xl,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.l,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profilePronouns: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  profileIdentity: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
    marginTop: 2,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glass.bgHero,
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionContent: {
    gap: spacing.m,
  },
  subscriptionStatus: {
    gap: spacing.xs,
  },
  subscriptionPlanLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subscriptionPlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  subscriptionPlanName: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  subscriptionPlanNamePremium: {
    color: colors.accent.secondary,
  },
  premiumBadge: {
    marginTop: 2,
  },
  subscriptionExpiry: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  subscriptionFreeInfo: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  subscriptionActions: {
    marginTop: spacing.m,
    gap: spacing.s,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.m,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  editLink: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '500',
    color: colors.accent.primary,
  },
  infoContent: {
    gap: spacing.xs,
  },
  infoText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  infoSubtext: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: colors.text.secondary,
  },
  logoutSection: {
    marginTop: spacing.m,
    marginBottom: spacing.l,
  },
  versionText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});
