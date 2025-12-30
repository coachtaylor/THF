// PRCelebrationModal component
// Celebratory overlay shown when user achieves a new personal record

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, borderRadius } from "../../theme/theme";
import { PRDetectionResult } from "../../types/personalRecords";
import {
  formatPRType,
  formatPRValue,
  getPRTypeIcon,
} from "../../services/storage/personalRecords";

interface PRCelebrationModalProps {
  prResult: PRDetectionResult;
  visible: boolean;
  onDismiss: () => void;
}

export function PRCelebrationModal({
  prResult,
  visible,
  onDismiss,
}: PRCelebrationModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const trophyBounce = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.7);
      trophyBounce.setValue(0);
      shimmerAnim.setValue(0);

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Trophy bounce animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(trophyBounce, {
              toValue: -8,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(trophyBounce, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ).start();

        // Shimmer effect
        Animated.loop(
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ).start();
      });

      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(onDismiss);
  };

  if (!visible || !prResult.is_pr) return null;

  const exerciseName = prResult.exercise_name || "Exercise";

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} />

      <LinearGradient
        colors={["rgba(0, 0, 0, 0.95)", "rgba(0, 0, 0, 0.9)"]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Trophy icon with glow and bounce */}
        <Animated.View
          style={[
            styles.trophyContainer,
            {
              transform: [{ translateY: trophyBounce }],
            },
          ]}
        >
          <View style={styles.trophyGlow} />
          <Ionicons name="trophy" size={64} color={colors.accent.warning} />
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>NEW PR!</Text>

        {/* Exercise name */}
        <Text style={styles.exerciseName}>{exerciseName}</Text>

        {/* PR records list */}
        <View style={styles.prList}>
          {prResult.records.map((record) => (
            <View key={record.pr_type} style={styles.prRow}>
              <View style={styles.prTypeContainer}>
                <Ionicons
                  name={
                    getPRTypeIcon(
                      record.pr_type,
                    ) as keyof typeof Ionicons.glyphMap
                  }
                  size={18}
                  color={colors.accent.secondary}
                />
                <Text style={styles.prType}>
                  {formatPRType(record.pr_type)}
                </Text>
              </View>
              <View style={styles.prValueContainer}>
                <Text style={styles.prValue}>{formatPRValue(record)}</Text>
                {record.improvement_percent !== null &&
                  record.improvement_percent > 0 && (
                    <View style={styles.improvementBadge}>
                      <Ionicons
                        name="arrow-up"
                        size={12}
                        color={colors.accent.success}
                      />
                      <Text style={styles.improvementText}>
                        {record.improvement_percent.toFixed(1)}%
                      </Text>
                    </View>
                  )}
              </View>
            </View>
          ))}
        </View>

        {/* Context info */}
        {prResult.records[0] && (
          <Text style={styles.contextText}>
            {prResult.records[0].weight} lbs x {prResult.records[0].reps} reps
          </Text>
        )}

        {/* Tap to dismiss hint */}
        <Text style={styles.dismissHint}>Tap anywhere to continue</Text>
      </Animated.View>

      {/* Decorative particles/confetti effect */}
      <View style={styles.particlesContainer}>
        {[...Array(12)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                left: `${10 + (i % 4) * 25}%`,
                top: `${20 + Math.floor(i / 4) * 25}%`,
                backgroundColor:
                  i % 2 === 0 ? colors.accent.primary : colors.accent.secondary,
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.6],
                }),
                transform: [
                  {
                    scale: scaleAnim.interpolate({
                      inputRange: [0.7, 1],
                      outputRange: [0, 1 + (i % 3) * 0.2],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    backgroundColor: colors.bg.elevated,
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing.l,
    borderWidth: 1,
    borderColor: colors.accent.warning + "40",
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.warning,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
      },
      android: { elevation: 16 },
    }),
  },
  trophyContainer: {
    marginBottom: spacing.m,
  },
  trophyGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accent.warning,
    opacity: 0.2,
    top: -18,
    left: -18,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.warning,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
      },
    }),
  },
  title: {
    fontFamily: "Poppins",
    fontSize: 36,
    fontWeight: "700",
    color: colors.accent.warning,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  exerciseName: {
    fontFamily: "Poppins",
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing.l,
    textAlign: "center",
  },
  prList: {
    width: "100%",
    gap: spacing.m,
    marginBottom: spacing.m,
  },
  prRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.m,
  },
  prTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s,
  },
  prType: {
    fontFamily: "Poppins",
    fontSize: 14,
    color: colors.text.secondary,
  },
  prValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s,
  },
  prValue: {
    fontFamily: "Poppins",
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  improvementBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accent.successMuted,
    paddingHorizontal: spacing.s,
    paddingVertical: 2,
    borderRadius: borderRadius.s,
    gap: 2,
  },
  improvementText: {
    fontFamily: "Poppins",
    fontSize: 12,
    fontWeight: "600",
    color: colors.accent.success,
  },
  contextText: {
    fontFamily: "Poppins",
    fontSize: 14,
    color: colors.text.tertiary,
    marginBottom: spacing.m,
  },
  dismissHint: {
    fontFamily: "Poppins",
    fontSize: 12,
    color: colors.text.disabled,
    marginTop: spacing.s,
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: "none",
  },
  particle: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default PRCelebrationModal;
