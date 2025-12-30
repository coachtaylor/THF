// SyncStatusIndicator - Small visual indicator for sync status
// Shows in header or status bar to let users know their data sync state

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSyncStatus, SyncState } from '../../contexts/SyncContext';
import { colors, spacing } from '../../theme/theme';

interface SyncStatusIndicatorProps {
  showLabel?: boolean;
  size?: 'small' | 'medium';
  onPress?: () => void;
}

export default function SyncStatusIndicator({
  showLabel = false,
  size = 'small',
  onPress,
}: SyncStatusIndicatorProps) {
  const { syncState, triggerSync, lastError } = useSyncStatus();

  const iconSize = size === 'small' ? 16 : 20;

  const handlePress = async () => {
    if (onPress) {
      onPress();
    } else if (syncState === 'error') {
      // Retry sync on error
      await triggerSync();
    }
  };

  const getIndicator = () => {
    switch (syncState) {
      case 'syncing':
        return (
          <ActivityIndicator
            size="small"
            color={colors.text.muted}
            style={styles.indicator}
          />
        );
      case 'synced':
        return (
          <MaterialCommunityIcons
            name="cloud-check"
            size={iconSize}
            color={colors.accent.success}
          />
        );
      case 'error':
        return (
          <MaterialCommunityIcons
            name="cloud-off-outline"
            size={iconSize}
            color={colors.accent.warning}
          />
        );
      default:
        return (
          <MaterialCommunityIcons
            name="cloud-outline"
            size={iconSize}
            color={colors.text.muted}
          />
        );
    }
  };

  const getLabel = (): string => {
    switch (syncState) {
      case 'syncing':
        return 'Syncing...';
      case 'synced':
        return 'Synced';
      case 'error':
        return 'Sync failed';
      default:
        return 'Ready';
    }
  };

  const Container = syncState === 'error' ? TouchableOpacity : View;
  const containerProps = syncState === 'error' ? { onPress: handlePress, activeOpacity: 0.7 } : {};

  return (
    <Container style={styles.container} {...containerProps}>
      {getIndicator()}
      {showLabel && (
        <Text style={[styles.label, syncState === 'error' && styles.errorLabel]}>
          {getLabel()}
        </Text>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  indicator: {
    width: 16,
    height: 16,
  },
  label: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: colors.text.muted,
  },
  errorLabel: {
    color: colors.accent.warning,
  },
});
