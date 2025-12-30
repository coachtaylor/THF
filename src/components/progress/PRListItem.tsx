// PRListItem component
// Displays a single personal record entry

import React from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius } from "../../theme/theme";
import { PRWithExercise, PRType } from "../../types/personalRecords";
import {
  formatPRType,
  formatPRValue,
  getPRTypeIcon,
} from "../../services/storage/personalRecords";

interface PRListItemProps {
  pr: PRWithExercise;
  compact?: boolean;
  onPress?: () => void;
}

export function PRListItem({ pr, compact = false, onPress }: PRListItemProps) {
  const formattedDate = new Date(pr.achieved_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const iconName = getPRTypeIcon(pr.pr_type) as keyof typeof Ionicons.glyphMap;

  if (compact) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.compactContainer,
          pressed && onPress && styles.pressed,
        ]}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={styles.compactIconContainer}>
          <Ionicons name="trophy" size={14} color={colors.accent.warning} />
        </View>
        <View style={styles.compactContent}>
          <Text style={styles.compactExerciseName} numberOfLines={1}>
            {pr.exercise_name}
          </Text>
          <Text style={styles.compactValue}>{formatPRValue(pr)}</Text>
        </View>
        <Text style={styles.compactDate}>{formattedDate}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && onPress && styles.pressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      {/* Trophy/Type Icon */}
      <View style={styles.iconContainer}>
        <View style={styles.trophyGlow} />
        <Ionicons name="trophy" size={24} color={colors.accent.warning} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.exerciseName} numberOfLines={1}>
          {pr.exercise_name}
        </Text>
        <View style={styles.prTypeRow}>
          <Ionicons name={iconName} size={14} color={colors.text.tertiary} />
          <Text style={styles.prType}>{formatPRType(pr.pr_type)}</Text>
        </View>
      </View>

      {/* Value and Improvement */}
      <View style={styles.valueContainer}>
        <Text style={styles.value}>{formatPRValue(pr)}</Text>
        {pr.improvement_percent !== null && pr.improvement_percent > 0 && (
          <View style={styles.improvementBadge}>
            <Ionicons name="arrow-up" size={10} color={colors.accent.success} />
            <Text style={styles.improvementText}>
              {pr.improvement_percent.toFixed(1)}%
            </Text>
          </View>
        )}
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.m,
    gap: spacing.m,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.warningMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  trophyGlow: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.warning,
    opacity: 0.15,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  exerciseName: {
    fontFamily: "Poppins",
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.primary,
  },
  prTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  prType: {
    fontFamily: "Poppins",
    fontSize: 12,
    fontWeight: "500",
    color: colors.text.tertiary,
  },
  valueContainer: {
    alignItems: "flex-end",
    gap: 2,
  },
  value: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.primary,
  },
  improvementBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent.successMuted,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: borderRadius.s,
    gap: 2,
  },
  improvementText: {
    fontFamily: "Poppins",
    fontSize: 10,
    fontWeight: "600",
    color: colors.accent.success,
  },
  date: {
    fontFamily: "Poppins",
    fontSize: 11,
    fontWeight: "400",
    color: colors.text.tertiary,
  },
  // Compact styles
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.s,
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.s,
    gap: spacing.s,
  },
  compactIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent.warningMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  compactContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s,
  },
  compactExerciseName: {
    fontFamily: "Poppins",
    fontSize: 13,
    fontWeight: "500",
    color: colors.text.primary,
    flex: 1,
  },
  compactValue: {
    fontFamily: "Poppins",
    fontSize: 13,
    fontWeight: "600",
    color: colors.accent.warning,
  },
  compactDate: {
    fontFamily: "Poppins",
    fontSize: 11,
    fontWeight: "400",
    color: colors.text.tertiary,
  },
});

export default PRListItem;
