// Banner shown at the top of a generated workout when the user has any
// pain-flagged exercises on their profile. Communicates that those exercises
// were intentionally left out, and offers a tap target to manage the list
// in Settings → Pain-Flagged Exercises ("Try again").
//
// Rendered only when profile.flagged_exercise_ids?.length > 0. No counting
// of "actually substituted in this workout" — the message is plan-wide
// ("avoiding N exercises you flagged") rather than per-workout ("N swaps
// in this session") because the generator doesn't track per-workout
// substitution counts, and the truthful framing is "we don't include these
// in any workout anymore."

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing } from '../../theme';

interface FlaggedSwapsBannerProps {
  flaggedCount: number;
  onManage?: () => void;
}

const FlaggedSwapsBanner: React.FC<FlaggedSwapsBannerProps> = ({
  flaggedCount,
  onManage,
}) => {
  if (flaggedCount <= 0) return null;

  const noun = flaggedCount === 1 ? 'exercise' : 'exercises';

  return (
    <Pressable
      onPress={onManage}
      style={styles.container}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={`Avoiding ${flaggedCount} pain-flagged ${noun}. Tap to manage in Settings.`}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="shield-checkmark" size={18} color={palette.tealPrimary} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>
          Avoiding {flaggedCount} {noun} you flagged
        </Text>
        <Text style={styles.subtitle}>
          {onManage ? 'Tap to manage in Settings' : 'Manage in Settings → Pain-Flagged Exercises'}
        </Text>
      </View>
      {onManage && (
        <Ionicons name="chevron-forward" size={18} color={palette.midGray} />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    backgroundColor: palette.darkerCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: spacing.m,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.darkCard,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.lightGray,
  },
  subtitle: {
    fontSize: 12,
    color: palette.midGray,
    marginTop: 2,
  },
});

export default FlaggedSwapsBanner;
