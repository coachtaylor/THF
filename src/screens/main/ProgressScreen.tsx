import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, typography } from '../../theme';

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress</Text>
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
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerTitle: {
    ...typography.h2,
    color: palette.white,
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
