// FrequencyChart component
// Shows workout consistency over time

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { FrequencyData } from '../../services/storage/stats';

interface FrequencyChartProps {
  data: FrequencyData[];
  height?: number;
}

export function FrequencyChart({ data, height = 160 }: FrequencyChartProps) {
  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No workout data yet</Text>
          <Text style={styles.emptyStateSubtext}>Start your fitness journey today</Text>
        </View>
      </View>
    );
  }

  const chartHeight = height - 50;

  // Calculate max for y-axis (max of scheduled or completed)
  const maxWorkouts = Math.max(...data.map(d => Math.max(d.completedWorkouts, d.scheduledWorkouts)), 4);

  // Calculate completion rates
  const totalCompleted = data.reduce((sum, d) => sum + d.completedWorkouts, 0);
  const totalScheduled = data.reduce((sum, d) => sum + d.scheduledWorkouts, 0);
  const overallRate = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

  // Get week label
  const getWeekLabel = (weekStart: Date, index: number): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 7) return 'This';
    if (daysDiff < 14) return 'Last';
    return `W${data.length - index}`;
  };

  return (
    <View style={[styles.container, { height }]}>
      {/* Summary stat */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{overallRate}%</Text>
          <Text style={styles.summaryLabel}>Consistency</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.accent.primary }]} />
            <Text style={styles.legendText}>Completed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.border.default }]} />
            <Text style={styles.legendText}>Scheduled</Text>
          </View>
        </View>
      </View>

      {/* Chart area */}
      <View style={[styles.chartArea, { height: chartHeight }]}>
        {data.map((item, index) => {
          const scheduledHeight = (item.scheduledWorkouts / maxWorkouts) * (chartHeight - 20);
          const completedHeight = (item.completedWorkouts / maxWorkouts) * (chartHeight - 20);
          const completionRate = item.scheduledWorkouts > 0
            ? Math.round((item.completedWorkouts / item.scheduledWorkouts) * 100)
            : 0;

          return (
            <View key={index} style={styles.weekColumn}>
              <View style={[styles.barGroup, { height: chartHeight - 20 }]}>
                {/* Scheduled bar (background) */}
                <View
                  style={[
                    styles.scheduledBar,
                    { height: Math.max(scheduledHeight, 4) },
                  ]}
                />
                {/* Completed bar (foreground) */}
                <View
                  style={[
                    styles.completedBar,
                    { height: Math.max(completedHeight, 4) },
                  ]}
                >
                  <LinearGradient
                    colors={
                      completionRate >= 100
                        ? [colors.success, 'rgba(52, 211, 153, 0.7)']
                        : completionRate >= 50
                          ? [colors.accent.primary, colors.accent.primaryDark]
                          : ['rgba(245, 169, 184, 0.8)', 'rgba(245, 169, 184, 0.4)']
                    }
                    style={StyleSheet.absoluteFill}
                  />
                </View>
              </View>
              {/* Completion indicator */}
              <Text style={[
                styles.completionText,
                completionRate >= 100 && styles.completionTextSuccess,
              ]}>
                {item.completedWorkouts}/{item.scheduledWorkouts}
              </Text>
              <Text style={styles.weekLabel}>
                {getWeekLabel(item.weekStart, index)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.s,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  emptyStateText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.xxs,
  },
  emptyStateSubtext: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: colors.text.tertiary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
    paddingHorizontal: spacing.xs,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  summaryValue: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '700',
    color: colors.accent.primary,
  },
  summaryLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: colors.text.tertiary,
  },
  legendRow: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: colors.text.tertiary,
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  weekColumn: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 50,
  },
  barGroup: {
    width: 24,
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  scheduledBar: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    backgroundColor: colors.border.default,
    borderRadius: borderRadius.s,
  },
  completedBar: {
    width: 16,
    borderRadius: borderRadius.s,
    overflow: 'hidden',
    minHeight: 4,
  },
  completionText: {
    fontFamily: 'Poppins',
    fontSize: 9,
    color: colors.text.tertiary,
    marginTop: spacing.xxs,
  },
  completionTextSuccess: {
    color: colors.success,
    fontWeight: '600',
  },
  weekLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 2,
  },
});

export default FrequencyChart;
