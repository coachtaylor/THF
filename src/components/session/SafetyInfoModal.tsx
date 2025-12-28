import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Platform, Animated, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { spacing, colors } from '../../theme';

type Severity = 'low' | 'medium' | 'high';

interface SafetyInfoModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  severity?: Severity;
  onDismiss?: () => void;
  onClose?: () => void;
  // New props for rules display
  rulesApplied?: string[];
  hrtAdjusted?: boolean;
  excludedCount?: number;
}

const SEVERITY_CONFIG: Record<Severity, {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  glowColors: [string, string, string];
}> = {
  low: {
    icon: 'information-circle',
    color: colors.accent.primary,
    glowColors: ['rgba(91, 206, 250, 0.2)', 'rgba(91, 206, 250, 0.08)', 'transparent'],
  },
  medium: {
    icon: 'alert-circle',
    color: colors.warning,
    glowColors: ['rgba(251, 191, 36, 0.2)', 'rgba(251, 191, 36, 0.08)', 'transparent'],
  },
  high: {
    icon: 'warning',
    color: colors.error,
    glowColors: ['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.08)', 'transparent'],
  },
};

// Helper to parse rule ID into category
function getRuleCategory(ruleId: string): string {
  if (ruleId.startsWith('PO-')) return 'post_op';
  if (ruleId.startsWith('HRT-')) return 'hrt_adjustment';
  if (ruleId.startsWith('BSF-')) return 'binding';
  if (ruleId.startsWith('DYS-')) return 'dysphoria';
  return 'other';
}

// Category display info
const CATEGORY_INFO: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  post_op: { label: 'Post-Op Recovery', icon: 'medical', color: colors.warning },
  hrt_adjustment: { label: 'HRT Optimized', icon: 'flask', color: colors.accent.primary },
  binding: { label: 'Binding-Safe', icon: 'shield-checkmark', color: colors.success },
  dysphoria: { label: 'Comfort-Adjusted', icon: 'heart', color: colors.cyan[400] },
  other: { label: 'Safety Adjusted', icon: 'shield', color: colors.text.secondary },
};

export default function SafetyInfoModal({
  visible,
  title,
  message,
  severity = 'medium',
  onDismiss,
  onClose,
  rulesApplied,
  hrtAdjusted,
  excludedCount,
}: SafetyInfoModalProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const config = SEVERITY_CONFIG[severity];
  const handleClose = onClose || onDismiss;

  // If rulesApplied is provided, show rules view instead of simple message
  const isRulesView = rulesApplied !== undefined;

  // Group rules by category
  const rulesByCategory = React.useMemo(() => {
    if (!rulesApplied) return {};
    const grouped: Record<string, string[]> = {};
    for (const ruleId of rulesApplied) {
      const category = getRuleCategory(ruleId);
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(ruleId);
    }
    return grouped;
  }, [rulesApplied]);

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [visible]);

  // Rules view for showing safety adjustments
  if (isRulesView) {
    const categories = Object.keys(rulesByCategory);

    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <LinearGradient
              colors={['rgba(35, 30, 25, 0.98)', 'rgba(25, 22, 18, 0.99)']}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['rgba(91, 206, 250, 0.15)', 'rgba(91, 206, 250, 0.05)', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.6 }}
              style={styles.severityGlow}
            />
            <View style={styles.glassHighlight} />

            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconContainer, { borderColor: `${colors.cyan[400]}40` }]}>
                <LinearGradient
                  colors={[`${colors.cyan[400]}30`, `${colors.cyan[400]}10`]}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="shield-checkmark" size={32} color={colors.cyan[400]} />
              </View>
              <Text style={styles.title}>Safety Adjustments</Text>
            </View>

            <Text style={styles.rulesSubtitle}>
              This workout has been personalized based on your profile:
            </Text>

            {/* Categories */}
            <ScrollView style={styles.categoriesScroll} showsVerticalScrollIndicator={false}>
              {categories.map((category) => {
                const info = CATEGORY_INFO[category] || CATEGORY_INFO.other;
                const count = rulesByCategory[category].length;
                return (
                  <View key={category} style={styles.categoryRow}>
                    <View style={[styles.categoryIcon, { backgroundColor: `${info.color}20` }]}>
                      <Ionicons name={info.icon} size={16} color={info.color} />
                    </View>
                    <View style={styles.categoryText}>
                      <Text style={[styles.categoryLabel, { color: info.color }]}>{info.label}</Text>
                      <Text style={styles.categoryCount}>{count} rule{count > 1 ? 's' : ''} applied</Text>
                    </View>
                  </View>
                );
              })}

              {hrtAdjusted && (
                <View style={styles.infoRow}>
                  <Ionicons name="fitness" size={14} color={colors.text.tertiary} />
                  <Text style={styles.infoText}>Volume adjusted for hormone therapy</Text>
                </View>
              )}

              {excludedCount !== undefined && excludedCount > 0 && (
                <View style={styles.infoRow}>
                  <Ionicons name="remove-circle" size={14} color={colors.text.tertiary} />
                  <Text style={styles.infoText}>{excludedCount} exercises excluded for safety</Text>
                </View>
              )}
            </ScrollView>

            {/* Dismiss Button */}
            <Pressable
              style={({ pressed }) => [styles.dismissButton, pressed && styles.buttonPressed]}
              onPress={handleClose}
            >
              <LinearGradient
                colors={[colors.accent.primary, colors.accent.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.buttonGlassOverlay} />
              <Text style={styles.dismissButtonText}>Got It</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  // Original simple message view
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Glass background */}
          <LinearGradient
            colors={['rgba(35, 30, 25, 0.98)', 'rgba(25, 22, 18, 0.99)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Severity glow */}
          <LinearGradient
            colors={config.glowColors}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.6 }}
            style={styles.severityGlow}
          />

          {/* Glass highlight */}
          <View style={styles.glassHighlight} />

          {/* Header */}
          <View style={styles.header}>
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale: pulseAnim }],
                  borderColor: `${config.color}40`,
                },
              ]}
            >
              <LinearGradient
                colors={[`${config.color}30`, `${config.color}10`]}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name={config.icon} size={32} color={config.color} />
            </Animated.View>
            <Text style={styles.title}>{title}</Text>
          </View>

          <Text style={styles.message}>{message}</Text>

          {/* Dismiss Button */}
          <Pressable
            style={({ pressed }) => [
              styles.dismissButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleClose}
          >
            <LinearGradient
              colors={[colors.accent.primary, colors.accent.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.buttonGlassOverlay} />
            <Ionicons name="checkmark" size={18} color={colors.text.inverse} />
            <Text style={styles.dismissButtonText}>Got It</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  modal: {
    borderRadius: 24,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 40,
      },
      android: { elevation: 24 },
    }),
  },
  severityGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: spacing.m,
    borderWidth: 1,
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  dismissButton: {
    borderRadius: 14,
    padding: spacing.l,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexDirection: 'row',
    gap: 8,
  },
  buttonGlassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  dismissButtonText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  rulesSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.l,
    lineHeight: 20,
  },
  categoriesScroll: {
    maxHeight: 200,
    marginBottom: spacing.l,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    marginBottom: spacing.s,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    flex: 1,
  },
  categoryLabel: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryCount: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.tertiary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingVertical: spacing.xs,
  },
  infoText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '400',
    color: colors.text.tertiary,
  },
});
