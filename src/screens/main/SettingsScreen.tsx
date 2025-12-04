import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useProfile } from '../../hooks/useProfile';
import { logout } from '../../services/auth/auth';
import { clearSession } from '../../services/auth/session';
import { deleteProfile } from '../../services/storage/profile';
import { palette, spacing, typography } from '../../theme';

type MainTabParamList = {
  Home: undefined;
  Workouts: undefined;
  Progress: undefined;
  Settings: undefined;
};

type SettingsScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();

  const handleEdit = (section: string) => {
    // Navigate to edit screens (reuse onboarding screens)
    // navigation.navigate('EditProfile', { section });
    console.log('Edit section:', section);
  };

  const handleExportData = async () => {
    // TODO: Implement data export
    console.log('Export data');
  };

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion
    console.log('Delete account');
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
    if (hrtType === 'estrogen_blockers') return 'estrogen + anti-androgens';
    if (hrtType === 'testosterone') return 'testosterone';
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

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              await clearSession();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will delete your profile and reset onboarding. You\'ll need to restart the app to see the onboarding screens again. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProfile();
              Alert.alert(
                'Profile Deleted',
                'Your profile has been deleted. Please restart the app to see the onboarding screens again.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Reset onboarding error:', error);
              Alert.alert('Error', 'Failed to reset onboarding. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            console.log('Back button pressed - navigating to Home');
            // Use CommonActions to ensure navigation works
            navigation.dispatch(
              CommonActions.navigate({
                name: 'Home',
                params: {},
              })
            );
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={28} color={palette.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>👤 Profile</Text>
            <TouchableOpacity onPress={() => handleEdit('profile')}>
              <Text style={styles.editButton}>[Edit]</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionText}>
              {profile?.pronouns || 'No pronouns set'} • {formatGenderIdentity(profile?.gender_identity)}
            </Text>
          </View>
        </View>

        {/* HRT Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💊 HRT Status</Text>
            <TouchableOpacity onPress={() => handleEdit('hrt')}>
              <Text style={styles.editButton}>[Edit]</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionCard}>
            {profile?.on_hrt ? (
              <>
                <Text style={styles.sectionText}>
                  • On {formatHRTType(profile.hrt_type)}
                </Text>
                {profile.hrt_start_date && (
                  <Text style={styles.sectionText}>
                    • Started {new Date(profile.hrt_start_date).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                    {profile.hrt_months_duration
                      ? ` (${profile.hrt_months_duration} months)`
                      : ''}
                  </Text>
                )}
              </>
            ) : (
              <Text style={styles.sectionText}>• Not on HRT</Text>
            )}
          </View>
        </View>

        {/* Binding */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔒 Binding</Text>
            <TouchableOpacity onPress={() => handleEdit('binding')}>
              <Text style={styles.editButton}>[Edit]</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionCard}>
            {profile?.binds_chest ? (
              <>
                {profile.binding_frequency && (
                  <Text style={styles.sectionText}>
                    • Binds {profile.binding_frequency}
                  </Text>
                )}
                {profile.binding_duration_hours && (
                  <Text style={styles.sectionText}>
                    • {profile.binding_duration_hours} hours per session
                  </Text>
                )}
              </>
            ) : (
              <Text style={styles.sectionText}>• Does not bind</Text>
            )}
          </View>
        </View>

        {/* Surgery History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏥 Surgery History</Text>
            <TouchableOpacity onPress={() => handleEdit('surgery')}>
              <Text style={styles.editButton}>[Edit]</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionCard}>
            {profile?.surgeries && profile.surgeries.length > 0 ? (
              profile.surgeries.map((surgery, index) => (
                <Text key={index} style={styles.sectionText}>
                  • {formatSurgeryType(surgery.type)} (
                  {new Date(surgery.date).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                  {surgery.weeks_post_op ? `, ${surgery.weeks_post_op} weeks post-op` : ''})
                </Text>
              ))
            ) : (
              <Text style={styles.sectionText}>• No surgeries</Text>
            )}
          </View>
        </View>

        {/* Fitness Goals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎯 Fitness Goals</Text>
            <TouchableOpacity onPress={() => handleEdit('goals')}>
              <Text style={styles.editButton}>[Edit]</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionText}>
              • Primary: {formatGoal(profile?.primary_goal)}
            </Text>
            {profile?.secondary_goals && profile.secondary_goals.length > 0 && (
              <Text style={styles.sectionText}>
                • Secondary: {profile.secondary_goals.map(formatGoal).join(', ')}
              </Text>
            )}
          </View>
        </View>

        {/* Training Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💪 Training Preferences</Text>
            <TouchableOpacity onPress={() => handleEdit('training')}>
              <Text style={styles.editButton}>[Edit]</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionText}>
              • {profile?.fitness_experience
                ? profile.fitness_experience.charAt(0).toUpperCase() +
                  profile.fitness_experience.slice(1)
                : 'Not set'}{' '}
              level
            </Text>
            <Text style={styles.sectionText}>
              • {profile?.workout_frequency || 0} days/week, {profile?.session_duration || 0} min
              sessions
            </Text>
            <Text style={styles.sectionText}>
              • Equipment: {profile?.equipment?.join(', ') || 'None'}
            </Text>
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ App Settings</Text>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Notifications</Text>
            <Text style={styles.settingValue}>[Edit]</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Rest timer sound</Text>
            <Text style={styles.settingValue}>✓ Enabled</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Metric system</Text>
            <Text style={styles.settingValue}>lbs / kg</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Theme</Text>
            <Text style={styles.settingValue}>Dark</Text>
          </TouchableOpacity>
        </View>

        {/* Data & Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Data & Privacy</Text>

          <TouchableOpacity style={styles.settingItem} onPress={handleExportData}>
            <Text style={styles.settingText}>Export workout data</Text>
            <Ionicons name="download-outline" size={20} color={palette.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
            <Text style={[styles.settingText, styles.dangerText]}>Delete account</Text>
            <Ionicons name="trash-outline" size={20} color={palette.error} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Privacy policy</Text>
            <Ionicons name="open-outline" size={20} color={palette.white} />
          </TouchableOpacity>
        </View>

        {/* DEBUG: Reset Onboarding - TEMPORARY */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.warning || palette.error }]}>
            🧪 DEBUG: Reset Onboarding
          </Text>
          <TouchableOpacity style={[styles.settingItem, { borderColor: palette.error + '40' }]} onPress={handleResetOnboarding}>
            <Text style={[styles.settingText, styles.dangerText]}>Reset Onboarding (Delete Profile)</Text>
            <Ionicons name="refresh-outline" size={20} color={palette.error} />
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💬 Support</Text>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Contact support</Text>
            <Ionicons name="mail-outline" size={20} color={palette.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Report a bug</Text>
            <Ionicons name="bug-outline" size={20} color={palette.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Give feedback</Text>
            <Ionicons name="chatbubble-outline" size={20} color={palette.white} />
          </TouchableOpacity>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color={palette.error} />
            <Text style={styles.logoutButtonText}>Log Out</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerTitle: {
    ...typography.h2,
    color: palette.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginTop: spacing.xl,
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
  },
  editButton: {
    ...typography.body,
    color: palette.tealPrimary,
  },
  sectionCard: {
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    gap: spacing.xs,
  },
  sectionText: {
    ...typography.body,
    color: palette.lightGray,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  settingText: {
    ...typography.body,
    color: palette.white,
  },
  settingValue: {
    ...typography.body,
    color: palette.midGray,
  },
  dangerText: {
    color: palette.error,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.m,
    backgroundColor: palette.darkCard,
    borderRadius: 12,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: palette.error + '40',
    marginTop: spacing.xl,
  },
  logoutButtonText: {
    ...typography.button,
    color: palette.error,
    fontSize: 18,
  },
});
