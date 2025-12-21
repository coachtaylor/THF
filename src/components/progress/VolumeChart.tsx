// VolumeChart component
// Simple bar chart showing weekly volume

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { WeeklyVolumeData } from '../../services/storage/stats';

interface VolumeChartProps {
  data: WeeklyVolumeData[];
  height?: number;
}

export function VolumeChart({ data, height = 180 }: VolumeChartProps) {
  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No volume data yet</Text>
          <Text style={styles.emptyStateSubtext}>Complete workouts to see your progress</Text>
        </View>
      </View>
    );
  }

  // Find max value for scaling
  const maxVolume = Math.max(...data.map(d => d.totalVolume), 1);
  const chartHeight = height - 60; // Leave room for labels

  // Format volume for display
  const formatVolume = (vol: number): string => {
    if (vol >= 1000) {
      return `${(vol / 1000).toFixed(1)}k`;
    }
    return vol.toString();
  };

  // Get week label (e.g., "W1", "W2")
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
      {/* Y-axis labels */}
      <View style={styles.yAxisLabels}>
        <Text style={styles.yAxisLabel}>{formatVolume(maxVolume)}</Text>
        <Text style={styles.yAxisLabel}>{formatVolume(Math.round(maxVolume / 2))}</Text>
        <Text style={styles.yAxisLabel}>0</Text>
      </View>

      {/* Chart area */}
      <View style={styles.chartArea}>
        {/* Grid lines */}
        <View style={[styles.gridLine, { top: 0 }]} />
        <View style={[styles.gridLine, { top: chartHeight / 2 }]} />
        <View style={[styles.gridLine, { top: chartHeight }]} />

        {/* Bars */}
        <View style={[styles.barsContainer, { height: chartHeight }]}>
          {data.map((item, index) => {
            const barHeight = (item.totalVolume / maxVolume) * chartHeight;
            const isCurrentWeek = index === data.length - 1;

            return (
              <View key={index} style={styles.barWrapper}>
                <View style={[styles.bar, { height: Math.max(barHeight, 4) }]}>
                  <LinearGradient
                    colors={isCurrentWeek
                      ? [colors.accent.primary, colors.accent.primaryDark]
                      : ['rgba(91, 206, 250, 0.6)', 'rgba(91, 206, 250, 0.3)']
                    }
                    style={StyleSheet.absoluteFill}
                  />
                </View>
                {/* Workout count indicator */}
                {item.workoutCount > 0 && (
                  <View style={styles.workoutCountBadge}>
                    <Text style={styles.workoutCountText}>{item.workoutCount}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* X-axis labels */}
        <View style={styles.xAxisLabels}>
          {data.map((item, index) => (
            <Text key={index} style={styles.xAxisLabel}>
              {getWeekLabel(item.weekStart, index)}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
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
  yAxisLabels: {
    width: 40,
    justifyContent: 'space-between',
    paddingBottom: 24,
    alignItems: 'flex-end',
    paddingRight: spacing.xs,
  },
  yAxisLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: colors.text.tertiary,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border.default,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xs,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 40,
  },
  bar: {
    width: 20,
    borderRadius: borderRadius.s,
    overflow: 'hidden',
    minHeight: 4,
  },
  workoutCountBadge: {
    marginTop: spacing.xxs,
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.xs,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  workoutCountText: {
    fontFamily: 'Poppins',
    fontSize: 8,
    color: colors.text.tertiary,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  xAxisLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: colors.text.tertiary,
    flex: 1,
    maxWidth: 40,
    textAlign: 'center',
  },
});

export default VolumeChart;
