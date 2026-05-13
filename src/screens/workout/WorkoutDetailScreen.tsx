import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { GlassCard } from '../../components/common';
import { FlaggedSwapsBanner } from '../../components/workout';
import { useProfile } from '../../hooks/useProfile';
import { getSessionById, SessionData } from '../../services/sessionLogger';
import type { MainStackParamList } from '../../types/navigation';

type WorkoutDetailNavigationProp = StackNavigationProp<MainStackParamList, 'WorkoutDetail'>;
type WorkoutDetailRouteProp = RouteProp<MainStackParamList, 'WorkoutDetail'>;

type AggregateStats = {
  totalVolume: number;
  averageRPE: number | null;
  totalSets: number;
  totalReps: number;
};

function computeStats(session: SessionData): AggregateStats {
  let totalVolume = 0;
  let rpeSum = 0;
  let rpeCount = 0;
  let totalSets = 0;
  let totalReps = 0;

  for (const exercise of session.exercises) {
    for (const set of exercise.sets) {
      totalSets += 1;
      totalReps += set.reps;
      if (typeof set.weight === 'number') {
        totalVolume += set.weight * set.reps;
      }
      if (typeof set.rpe === 'number') {
        rpeSum += set.rpe;
        rpeCount += 1;
      }
    }
  }

  return {
    totalVolume: Math.round(totalVolume),
    averageRPE: rpeCount > 0 ? Math.round((rpeSum / rpeCount) * 10) / 10 : null,
    totalSets,
    totalReps,
  };
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes < 1) return '<1 min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function formatDate(completedAt: string): string {
  const d = new Date(completedAt);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <GlassCard variant="default" style={styles.statTile}>
      <Text style={styles.statTileValue}>{value}</Text>
      <Text style={styles.statTileLabel}>{label}</Text>
    </GlassCard>
  );
}

export default function WorkoutDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<WorkoutDetailNavigationProp>();
  const route = useRoute<WorkoutDetailRouteProp>();
  const { profile } = useProfile();

  const sessionId = route.params.sessionId;
  const userId = profile?.user_id || profile?.id || 'default';

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getSessionById(sessionId, userId);
        if (cancelled) return;
        if (!result) {
          setNotFound(true);
        } else {
          setSession(result);
        }
      } catch (error) {
        console.error('Failed to load session detail:', error);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, userId]);

  const stats = useMemo<AggregateStats | null>(
    () => (session ? computeStats(session) : null),
    [session]
  );

  const header = (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
      </Pressable>
      <Text style={styles.headerTitle}>Workout Details</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.accent.primary} />
        </View>
      </View>
    );
  }

  if (notFound || !session || !stats) {
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.text.tertiary} />
          <Text style={styles.emptyText}>Workout not found.</Text>
        </View>
      </View>
    );
  }

  const workoutName = session.workoutName?.trim() || 'Workout';

  return (
    <View style={styles.container}>
      {header}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard variant="default" style={styles.heroCard}>
          <Text style={styles.heroDate}>{formatDate(session.completedAt)}</Text>
          <Text style={styles.heroName}>{workoutName}</Text>
          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaItem}>
              <Ionicons name="time-outline" size={14} color={colors.text.tertiary} />
              <Text style={styles.heroMetaText}>{formatDuration(session.durationMinutes)}</Text>
            </View>
            <View style={styles.heroMetaItem}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={[styles.heroMetaText, { color: colors.success }]}>Completed</Text>
            </View>
          </View>
        </GlassCard>

        <View style={styles.statsGrid}>
          <StatTile label="Volume (lbs)" value={stats.totalVolume.toLocaleString()} />
          <StatTile label="Avg RPE" value={stats.averageRPE !== null ? stats.averageRPE.toString() : '—'} />
          <StatTile label="Total Sets" value={stats.totalSets.toString()} />
          <StatTile label="Total Reps" value={stats.totalReps.toString()} />
        </View>

        <FlaggedSwapsBanner
          flaggedCount={profile?.flagged_exercise_ids?.length ?? 0}
          onManage={() => navigation.navigate('Settings' as never)}
        />

        <Text style={styles.sectionTitle}>Exercises</Text>
        {session.exercises.length === 0 ? (
          <GlassCard variant="default" style={styles.emptyCard}>
            <Text style={styles.emptyText}>No exercises recorded for this workout.</Text>
          </GlassCard>
        ) : (
          session.exercises.map((exercise, idx) => {
            const exerciseName = exercise.name?.trim() || `Exercise ${idx + 1}`;
            return (
              <GlassCard
                key={`${exercise.exerciseId}-${idx}`}
                variant="default"
                style={styles.exerciseCard}
              >
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseName}>{exerciseName}</Text>
                  <View style={styles.exerciseBadges}>
                    {exercise.swappedTo && (
                      <View style={styles.swapBadge}>
                        <Ionicons name="swap-horizontal" size={12} color={colors.accent.primary} />
                        <Text style={styles.swapText}>Swapped</Text>
                      </View>
                    )}
                    {exercise.painFlagged && (
                      <View style={styles.flagBadge}>
                        <Ionicons name="flag" size={12} color={colors.warning} />
                        <Text style={styles.flagText}>Pain-flagged</Text>
                      </View>
                    )}
                  </View>
                </View>

                {exercise.sets.length === 0 ? (
                  <Text style={styles.emptySetText}>No sets recorded.</Text>
                ) : (
                  <View style={styles.setsTable}>
                    <View style={styles.setRowHeader}>
                      <Text style={[styles.setCol, styles.setColIndex, styles.setHeaderText]}>Set</Text>
                      <Text style={[styles.setCol, styles.setColReps, styles.setHeaderText]}>Reps</Text>
                      <Text style={[styles.setCol, styles.setColWeight, styles.setHeaderText]}>Weight</Text>
                      <Text style={[styles.setCol, styles.setColRPE, styles.setHeaderText]}>RPE</Text>
                    </View>
                    {exercise.sets.map((set, setIdx) => (
                      <View key={setIdx} style={styles.setRow}>
                        <Text style={[styles.setCol, styles.setColIndex, styles.setCellText]}>
                          {setIdx + 1}
                        </Text>
                        <Text style={[styles.setCol, styles.setColReps, styles.setCellText]}>
                          {set.reps}
                        </Text>
                        <Text style={[styles.setCol, styles.setColWeight, styles.setCellText]}>
                          {typeof set.weight === 'number' ? `${set.weight} lbs` : '—'}
                        </Text>
                        <Text style={[styles.setCol, styles.setColRPE, styles.setCellText]}>
                          {typeof set.rpe === 'number' ? set.rpe.toFixed(1) : '—'}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </GlassCard>
            );
          })
        )}
      </ScrollView>
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
    paddingBottom: spacing.m,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 32,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.m,
  },
  heroCard: {
    marginBottom: spacing.l,
  },
  heroDate: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  heroName: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.4,
    marginBottom: spacing.s,
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: spacing.l,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroMetaText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
    marginBottom: spacing.xl,
  },
  statTile: {
    flexBasis: '47%',
    flexGrow: 1,
    alignItems: 'flex-start',
  },
  statTileValue: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  statTileLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: spacing.xxs,
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: -0.2,
    marginBottom: spacing.m,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  exerciseCard: {
    marginBottom: spacing.m,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  exerciseName: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  exerciseBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  flagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.glass.bgLight,
  },
  flagText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: colors.warning,
  },
  swapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.glass.bgLight,
  },
  swapText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: colors.accent.primary,
  },
  emptySetText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  setsTable: {
    gap: spacing.xxs,
  },
  setRowHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
  },
  setCol: {
    fontFamily: 'Poppins',
    fontSize: 13,
  },
  setColIndex: {
    width: 36,
  },
  setColReps: {
    flex: 1,
  },
  setColWeight: {
    flex: 1.4,
  },
  setColRPE: {
    flex: 1,
    textAlign: 'right',
  },
  setHeaderText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  setCellText: {
    fontWeight: '500',
    color: colors.text.primary,
  },
});
