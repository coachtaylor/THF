import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { palette, spacing, typography } from '../../theme';

type MainTabParamList = {
  Home: undefined;
  Workouts: undefined;
  Progress: undefined;
  Settings: undefined;
};

type ProgressScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Progress'>;

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ProgressScreenNavigationProp>();

  const handleProfilePress = () => {
    navigation.navigate('Settings');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress</Text>
        <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
          <Ionicons name="person-circle-outline" size={28} color={palette.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.comingSoonText}>📊 Coming Soon</Text>
        <Text style={styles.descriptionText}>
          Progress tracking, charts, PRs, and body composition tracking will be available in Phase 6.
        </Text>
      </View>
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
  profileButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  comingSoonText: {
    ...typography.h1,
    color: palette.white,
    marginBottom: spacing.m,
  },
  descriptionText: {
    ...typography.body,
    color: palette.midGray,
    textAlign: 'center',
  },
});
