// ExerciseProgressChart component
// Line chart showing progress for a specific exercise

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { ExerciseProgressData } from '../../services/storage/stats';

interface ExerciseProgressChartProps {
  data: ExerciseProgressData | null;
  height?: number;
}

export function ExerciseProgressChart({ data, height = 160 }: ExerciseProgressChartProps) {
  if (!data || data.dataPoints.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.emptyState}>
          <Ionicons name="trending-up-outline" size={32} color={colors.text.tertiary} />
          <Text style={styles.emptyStateText}>No data for this exercise</Text>
          <Text style={styles.emptyStateSubtext}>Log sets to track your progress</Text>
        </View>
      </View>
    );
  }

  const chartHeight = height - 60;
  const chartWidth = 280; // Will be scaled to fit

  // Calculate points for line chart
  const points = data.dataPoints;
  const values = points.map(p => p.value);
  const minValue = Math.min(...values) * 0.9;
  const maxValue = Math.max(...values) * 1.1;
  const valueRange = maxValue - minValue || 1;

  // Generate SVG path
  const getPathD = (): string => {
    if (points.length < 2) {
      // Single point - just return empty (we'll show the dot)
      return '';
    }

    const xStep = chartWidth / (points.length - 1);
    let d = '';

    points.forEach((point, index) => {
      const x = index * xStep;
      const y = chartHeight - ((point.value - minValue) / valueRange) * chartHeight;

      if (index === 0) {
        d += `M ${x} ${y}`;
      } else {
        // Smooth curve using quadratic bezier
        const prevX = (index - 1) * xStep;
        const prevY = chartHeight - ((points[index - 1].value - minValue) / valueRange) * chartHeight;
        const cpX = (prevX + x) / 2;
        d += ` Q ${cpX} ${prevY} ${cpX} ${(prevY + y) / 2} Q ${cpX} ${y} ${x} ${y}`;
      }
    });

    return d;
  };

  // Get positions for data point circles
  const getPointPosition = (index: number) => {
    const xStep = chartWidth / (Math.max(points.length - 1, 1));
    const x = index * xStep;
    const y = chartHeight - ((points[index].value - minValue) / valueRange) * chartHeight;
    return { x, y };
  };

  return (
    <View style={[styles.container, { height }]}>
      {/* Header with improvement */}
      <View style={styles.header}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{data.exerciseName}</Text>
          <Text style={styles.currentMax}>{data.currentMax} lbs max</Text>
        </View>
        {data.percentImprovement !== 0 && (
          <View style={[
            styles.improvementBadge,
            data.percentImprovement > 0 ? styles.improvementPositive : styles.improvementNegative,
          ]}>
            <Ionicons
              name={data.percentImprovement > 0 ? 'trending-up' : 'trending-down'}
              size={14}
              color={data.percentImprovement > 0 ? colors.success : colors.accent.secondary}
            />
            <Text style={[
              styles.improvementText,
              data.percentImprovement > 0 ? styles.improvementTextPositive : styles.improvementTextNegative,
            ]}>
              {data.percentImprovement > 0 ? '+' : ''}{data.percentImprovement}%
            </Text>
          </View>
        )}
      </View>

      {/* Chart */}
      <View style={[styles.chartWrapper, { height: chartHeight }]}>
        <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {/* Grid lines */}
          <Line
            x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight}
            stroke={colors.border.default} strokeWidth="1"
          />
          <Line
            x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2}
            stroke={colors.border.default} strokeWidth="1" strokeDasharray="4,4"
          />

          {/* Line path */}
          {points.length >= 2 && (
            <Path
              d={getPathD()}
              stroke={colors.accent.primary}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points */}
          {points.map((_, index) => {
            const pos = getPointPosition(index);
            const isLast = index === points.length - 1;
            return (
              <Circle
                key={index}
                cx={pos.x}
                cy={pos.y}
                r={isLast ? 5 : 3}
                fill={isLast ? colors.accent.primary : colors.bg.primary}
                stroke={colors.accent.primary}
                strokeWidth={isLast ? 2 : 1.5}
              />
            );
          })}
        </Svg>
      </View>

      {/* X-axis labels */}
      <View style={styles.xAxisLabels}>
        {points.length <= 6 ? (
          points.map((point, index) => (
            <Text key={index} style={styles.xAxisLabel}>
              {point.label}
            </Text>
          ))
        ) : (
          // Show first, middle, and last labels only for many points
          <>
            <Text style={styles.xAxisLabel}>{points[0].label}</Text>
            <Text style={styles.xAxisLabel}>{points[Math.floor(points.length / 2)].label}</Text>
            <Text style={styles.xAxisLabel}>{points[points.length - 1].label}</Text>
          </>
        )}
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
    gap: spacing.xs,
  },
  emptyStateText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.secondary,
  },
  emptyStateSubtext: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: colors.text.tertiary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  currentMax: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: colors.text.tertiary,
  },
  improvementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
  },
  improvementPositive: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  improvementNegative: {
    backgroundColor: 'rgba(245, 169, 184, 0.15)',
  },
  improvementText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
  },
  improvementTextPositive: {
    color: colors.success,
  },
  improvementTextNegative: {
    color: colors.accent.secondary,
  },
  chartWrapper: {
    overflow: 'hidden',
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  xAxisLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    color: colors.text.tertiary,
  },
});

export default ExerciseProgressChart;
