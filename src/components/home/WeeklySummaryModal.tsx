import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { colors, spacing, borderRadius } from '../../theme/theme';
import { WeeklySummaryData, formatVolume, getAchievements } from '../../services/storage/weeklySummary';
import { formatDateRange } from '../../services/storage/weeklyTransition';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface WeeklySummaryModalProps {
  visible: boolean;
  summaryData: WeeklySummaryData | null;
  onGeneratePlan: () => Promise<void>;
  isGenerating: boolean;
}

// Progress ring component
function ProgressRing({
  progress = 0,
  size = 64,
  strokeWidth = 3,
  color,
}: {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
}) {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: Math.min(progress, 1),
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <Svg width={size} height={size} style={styles.progressRing}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255, 255, 255, 0.08)"
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}

// Stat card component
function StatCard({
  icon,
  value,
  label,
  progress,
  color = colors.accent.primary,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  progress?: number;
  color?: string;
}) {
  const bgColor = color === colors.accent.primary
    ? 'rgba(91, 206, 250, 0.08)'
    : color === colors.accent.secondary
      ? 'rgba(245, 169, 184, 0.08)'
      : 'rgba(255, 255, 255, 0.05)';

  return (
    <View style={styles.statCard}>
      <LinearGradient
        colors={['#141418', '#0A0A0C']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.statIconContainer}>
        {progress !== undefined ? (
          <>
            <ProgressRing progress={progress} size={44} strokeWidth={3} color={color} />
            <View style={[styles.statIconOverlay, { backgroundColor: bgColor }]}>
              <Ionicons name={icon} size={16} color={color} />
            </View>
          </>
        ) : (
          <View style={[styles.statIconCircle, { backgroundColor: bgColor }]}>
            <Ionicons name={icon} size={18} color={color} />
          </View>
        )}
      </View>

      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function WeeklySummaryModal({
  visible,
  summaryData,
  onGeneratePlan,
  isGenerating,
}: WeeklySummaryModalProps) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  if (!summaryData) {
    return null;
  }

  const achievements = getAchievements(summaryData);
  const completionRate = summaryData.workoutsScheduled > 0
    ? summaryData.workoutsCompleted / summaryData.workoutsScheduled
    : 0;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['rgba(10, 10, 12, 0.95)', 'rgba(10, 10, 12, 0.98)']}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View
          style={[
            styles.container,
            {
              paddingTop: insets.top + spacing.xl,
              paddingBottom: insets.bottom + spacing.xl,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.trophyContainer}>
                <LinearGradient
                  colors={[colors.accent.primaryMuted, colors.glass.bg]}
                  style={styles.trophyBg}
                />
                <Ionicons name="trophy" size={48} color={colors.accent.primary} />
              </View>

              <Text style={styles.title}>Week in Review</Text>
              <Text style={styles.dateRange}>
                {formatDateRange(summaryData.weekStart, summaryData.weekEnd)}
              </Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard
                icon="fitness"
                value={`${summaryData.workoutsCompleted}/${summaryData.workoutsScheduled}`}
                label="Workouts"
                progress={completionRate}
                color={colors.accent.primary}
              />
              <StatCard
                icon="barbell"
                value={formatVolume(summaryData.totalVolume)}
                label="Volume (lbs)"
                color={colors.accent.primary}
              />
              <StatCard
                icon="speedometer"
                value={summaryData.averageRPE.toFixed(1)}
                label="Avg RPE"
                progress={summaryData.averageRPE / 10}
                color={colors.accent.secondary}
              />
              <StatCard
                icon="flame"
                value={summaryData.streakAtEndOfWeek.toString()}
                label="Streak"
                progress={Math.min(summaryData.streakAtEndOfWeek / 7, 1)}
                color={colors.warning}
              />
            </View>

            {/* Achievements */}
            {achievements.length > 0 && (
              <View style={styles.achievementsCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="medal" size={20} color={colors.accent.primary} />
                  <Text style={styles.sectionTitle}>Achievements</Text>
                </View>

                {achievements.map((achievement, index) => (
                  <View key={index} style={styles.achievementItem}>
                    <View style={styles.achievementIcon}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    </View>
                    <Text style={styles.achievementText}>{achievement}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Additional Stats */}
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Workout Time</Text>
                <Text style={styles.detailValue}>{summaryData.totalWorkoutMinutes} min</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Exercises Completed</Text>
                <Text style={styles.detailValue}>{summaryData.exercisesCompleted}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Sets</Text>
                <Text style={styles.detailValue}>{summaryData.totalSets}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Reps</Text>
                <Text style={styles.detailValue}>{summaryData.totalReps.toLocaleString()}</Text>
              </View>
            </View>

            {/* Motivational Message */}
            <View style={styles.messageCard}>
              <Text style={styles.messageText}>
                {summaryData.workoutsCompleted === 0
                  ? "Ready to start fresh this week? Let's build your new plan!"
                  : summaryData.workoutsCompleted >= summaryData.workoutsScheduled
                    ? "Amazing week! Keep the momentum going!"
                    : "Every workout counts. Let's make this week even better!"}
              </Text>
            </View>
          </ScrollView>

          {/* Generate Button */}
          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.generateButton,
                pressed && styles.buttonPressed,
                isGenerating && styles.buttonDisabled,
              ]}
              onPress={onGeneratePlan}
              disabled={isGenerating}
            >
              <LinearGradient
                colors={[colors.accent.primary, colors.accent.primaryDark]}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.2)', 'transparent']}
                style={styles.buttonGlassOverlay}
              />

              {isGenerating ? (
                <>
                  <ActivityIndicator size="small" color={colors.text.inverse} />
                  <Text style={styles.generateButtonText}>Generating...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={22} color={colors.text.inverse} />
                  <Text style={styles.generateButtonText}>Generate This Week's Plan</Text>
                </>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  trophyContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.l,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
      },
      android: { elevation: 8 },
    }),
  },
  trophyBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 50,
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  dateRange: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '47%',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.m,
    alignItems: 'center',
    overflow: 'hidden',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  progressRing: {
    position: 'absolute',
  },
  statIconOverlay: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.xxs,
  },
  statLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  achievementsCard: {
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.glass.borderCyan,
    padding: spacing.l,
    marginBottom: spacing.l,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    paddingVertical: spacing.s,
  },
  achievementIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
  },
  detailsCard: {
    backgroundColor: colors.glass.bg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.l,
    marginBottom: spacing.l,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  detailLabel: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.tertiary,
  },
  detailValue: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  messageCard: {
    backgroundColor: colors.accent.primaryMuted,
    borderRadius: borderRadius.xl,
    padding: spacing.l,
    marginBottom: spacing.l,
  },
  messageText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '500',
    color: colors.accent.primary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    paddingTop: spacing.m,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.l,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  buttonGlassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  generateButtonText: {
    fontFamily: 'Poppins',
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
