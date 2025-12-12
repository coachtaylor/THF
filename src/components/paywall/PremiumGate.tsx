/**
 * PremiumGate Component
 *
 * Wraps content that requires premium access.
 * Shows upgrade prompt for free users, renders children for premium users.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Sparkles } from 'lucide-react-native';

import { useEntitlement } from '../../hooks/useEntitlement';
import { FeatureId, FEATURE_INFO } from '../../services/payments/entitlements';
import { colors, spacing, borderRadius } from '../../theme/theme';

interface PremiumGateProps {
  /**
   * The feature required to view this content
   */
  feature: FeatureId;

  /**
   * Content to show when user has access
   */
  children: React.ReactNode;

  /**
   * Optional: Custom message for the upgrade prompt
   */
  message?: string;

  /**
   * Optional: Render content in "preview" mode (blurred/teaser)
   * Default: true - shows upgrade card
   * false - renders children but can gate interactions
   */
  showUpgradeCard?: boolean;
}

/**
 * Gate content behind premium subscription
 *
 * @example
 * <PremiumGate feature="progress_charts">
 *   <ProgressCharts />
 * </PremiumGate>
 */
export function PremiumGate({
  feature,
  children,
  message,
  showUpgradeCard = true,
}: PremiumGateProps) {
  const navigation = useNavigation<any>();
  const { hasAccess, isLoading, featureInfo } = useEntitlement(feature);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingDot} />
      </View>
    );
  }

  // User has access - render content
  if (hasAccess) {
    return <>{children}</>;
  }

  // User doesn't have access - show upgrade prompt
  if (showUpgradeCard) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.upgradeCard,
          pressed && styles.upgradeCardPressed,
        ]}
        onPress={() => navigation.navigate('Paywall')}
      >
        <LinearGradient
          colors={['rgba(91, 206, 250, 0.1)', 'rgba(245, 169, 184, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.iconContainer}>
          <Lock size={24} color={colors.accent.primary} />
        </View>

        <Text style={styles.upgradeTitle}>
          {featureInfo?.title || 'Premium Feature'}
        </Text>

        <Text style={styles.upgradeMessage}>
          {message || featureInfo?.description || 'Upgrade to access this feature'}
        </Text>

        <View style={styles.upgradeButton}>
          <Sparkles size={16} color={colors.bg.primary} />
          <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
        </View>
      </Pressable>
    );
  }

  // Preview mode - render children (caller handles interactions)
  return <>{children}</>;
}

/**
 * Simple wrapper that navigates to paywall if user doesn't have access
 * Useful for buttons/actions
 */
interface PremiumActionProps {
  feature: FeatureId;
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
}

export function PremiumAction({
  feature,
  onPress,
  children,
  style,
}: PremiumActionProps) {
  const navigation = useNavigation<any>();
  const { hasAccess } = useEntitlement(feature);

  const handlePress = () => {
    if (hasAccess) {
      onPress();
    } else {
      navigation.navigate('Paywall');
    }
  };

  return (
    <Pressable style={style} onPress={handlePress}>
      {children}
    </Pressable>
  );
}

/**
 * Hook for programmatic navigation to paywall
 */
export function usePaywall() {
  const navigation = useNavigation<any>();

  const showPaywall = () => {
    navigation.navigate('Paywall');
  };

  return { showPaywall };
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent.primary,
  },
  upgradeCard: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  upgradeCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(91, 206, 250, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.s,
    textAlign: 'center',
  },
  upgradeMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accent.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: borderRadius.full,
  },
  upgradeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.bg.primary,
  },
});

export default PremiumGate;
