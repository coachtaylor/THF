/**
 * Paywall Screen
 *
 * Premium subscription offering with feature highlights.
 * Follows TransFitness design system with trans pride colors.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { PurchasesPackage, PACKAGE_TYPE } from 'react-native-purchases';
import { Check, X, Sparkles, Shield, Dumbbell, LineChart, MessageCircle } from 'lucide-react-native';

import { useSubscription } from '../../contexts/SubscriptionContext';
import { FEATURE_INFO, FeatureId } from '../../services/payments/entitlements';
import { colors, spacing, borderRadius, typography } from '../../theme/theme';

// Features to highlight on the paywall
const PREMIUM_FEATURES: { id: FeatureId; icon: React.ReactNode }[] = [
  { id: 'unlimited_workouts', icon: <Dumbbell size={20} color={colors.accent.primary} /> },
  { id: 'full_exercise_library', icon: <Sparkles size={20} color={colors.accent.secondary} /> },
  { id: 'copilot_unlimited', icon: <MessageCircle size={20} color={colors.accent.primary} /> },
  { id: 'progress_charts', icon: <LineChart size={20} color={colors.accent.secondary} /> },
  { id: 'weight_suggestions', icon: <Shield size={20} color={colors.accent.primary} /> },
];

export default function PaywallScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < 375;
  const { packages, packagesLoading, purchase, restore, isLoading } = useSubscription();

  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Find monthly and annual packages (with fallback for custom identifiers)
  const monthlyPackage = packages.find((p) =>
    p.packageType === PACKAGE_TYPE.MONTHLY ||
    p.identifier.toLowerCase().includes('monthly')
  );
  const annualPackage = packages.find((p) =>
    p.packageType === PACKAGE_TYPE.ANNUAL ||
    p.identifier.toLowerCase().includes('annual')
  );

  // Debug logging
  if (__DEV__) {
    console.log('[Paywall] packages:', packages.length);
    console.log('[Paywall] packageTypes:', packages.map(p => ({ id: p.identifier, type: p.packageType })));
    console.log('[Paywall] monthlyPackage:', monthlyPackage?.identifier);
    console.log('[Paywall] annualPackage:', annualPackage?.identifier);
  }

  // Default to annual if available
  React.useEffect(() => {
    if (annualPackage && !selectedPackage) {
      setSelectedPackage(annualPackage);
    } else if (monthlyPackage && !selectedPackage) {
      setSelectedPackage(monthlyPackage);
    }
  }, [packages, annualPackage, monthlyPackage, selectedPackage]);

  const handlePurchase = useCallback(async () => {
    if (!selectedPackage || purchasing) return;

    setPurchasing(true);
    try {
      const success = await purchase(selectedPackage);
      if (success) {
        // Navigate back or to success screen
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert(
        'Purchase Failed',
        'There was an error processing your purchase. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setPurchasing(false);
    }
  }, [selectedPackage, purchase, navigation, purchasing]);

  const handleRestore = useCallback(async () => {
    if (restoring) return;

    setRestoring(true);
    try {
      const restored = await restore();
      if (restored) {
        Alert.alert('Success', 'Your purchase has been restored!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert(
          'No Purchases Found',
          'We couldn\'t find any previous purchases to restore.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setRestoring(false);
    }
  }, [restore, navigation, restoring]);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Calculate savings for annual
  const monthlyPrice = monthlyPackage?.product.price ?? 9.99;
  const annualPrice = annualPackage?.product.price ?? 79.99;
  const annualMonthly = annualPrice / 12;
  const savingsPercent = Math.round((1 - annualMonthly / monthlyPrice) * 100);

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#0A0A0A', '#000000']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative glow */}
      <LinearGradient
        colors={['rgba(91, 206, 250, 0.15)', 'transparent']}
        style={styles.topGlow}
      />

      {/* Close button */}
      <Pressable
        style={[styles.closeButton, { top: insets.top + 8 }]}
        onPress={handleClose}
        hitSlop={16}
      >
        <X size={24} color={colors.text.secondary} />
      </Pressable>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, isSmall && styles.titleSmall]}>Unlock Premium</Text>
          <Text style={[styles.subtitle, isSmall && styles.subtitleSmall]}>
            Get the full TransFitness experience
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          {PREMIUM_FEATURES.map((feature) => (
            <View key={feature.id} style={styles.featureRow}>
              <View style={styles.featureIcon}>{feature.icon}</View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>
                  {FEATURE_INFO[feature.id].title}
                </Text>
                <Text style={styles.featureDescription}>
                  {FEATURE_INFO[feature.id].description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Package Selection */}
        {packagesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.accent.primary} />
          </View>
        ) : (
          <View style={styles.packagesContainer}>
            {/* Annual Option */}
            {annualPackage && (
              <Pressable
                style={({ pressed }) => [
                  styles.packageCard,
                  selectedPackage?.identifier === annualPackage.identifier &&
                    styles.packageCardSelected,
                  pressed && styles.packageCardPressed,
                ]}
                onPress={() => {
                  if (__DEV__) console.log('[Paywall] Annual tapped');
                  setSelectedPackage(annualPackage);
                }}
              >
                {/* Best Value Badge */}
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>BEST VALUE</Text>
                </View>

                <View style={styles.packageContent}>
                  <View style={styles.packageHeader}>
                    <Text style={styles.packageName}>Annual</Text>
                    <Text style={styles.packageSavings}>Save {savingsPercent}%</Text>
                  </View>
                  <View style={styles.packagePricing}>
                    <Text style={styles.packagePrice}>
                      {annualPackage.product.priceString}
                    </Text>
                    <Text style={styles.packagePeriod}>/year</Text>
                  </View>
                  <Text style={styles.packageMonthly}>
                    ${annualMonthly.toFixed(2)}/month
                  </Text>
                </View>

                {/* Selection indicator */}
                <View
                  style={[
                    styles.selectionIndicator,
                    selectedPackage?.identifier === annualPackage.identifier &&
                      styles.selectionIndicatorSelected,
                  ]}
                >
                  {selectedPackage?.identifier === annualPackage.identifier && (
                    <Check size={14} color={colors.bg.primary} />
                  )}
                </View>
              </Pressable>
            )}

            {/* Monthly Option */}
            {monthlyPackage && (
              <Pressable
                style={({ pressed }) => [
                  styles.packageCard,
                  selectedPackage?.identifier === monthlyPackage.identifier &&
                    styles.packageCardSelected,
                  pressed && styles.packageCardPressed,
                ]}
                onPress={() => {
                  if (__DEV__) console.log('[Paywall] Monthly tapped');
                  setSelectedPackage(monthlyPackage);
                }}
              >
                <View style={styles.packageContent}>
                  <Text style={styles.packageName}>Monthly</Text>
                  <View style={styles.packagePricing}>
                    <Text style={styles.packagePrice}>
                      {monthlyPackage.product.priceString}
                    </Text>
                    <Text style={styles.packagePeriod}>/month</Text>
                  </View>
                </View>

                {/* Selection indicator */}
                <View
                  style={[
                    styles.selectionIndicator,
                    selectedPackage?.identifier === monthlyPackage.identifier &&
                      styles.selectionIndicatorSelected,
                  ]}
                >
                  {selectedPackage?.identifier === monthlyPackage.identifier && (
                    <Check size={14} color={colors.bg.primary} />
                  )}
                </View>
              </Pressable>
            )}
          </View>
        )}

        {/* Purchase Button */}
        <Pressable
          style={({ pressed }) => [
            styles.purchaseButton,
            pressed && styles.purchaseButtonPressed,
            (purchasing || isLoading) && styles.purchaseButtonDisabled,
          ]}
          onPress={handlePurchase}
          disabled={purchasing || isLoading || !selectedPackage}
        >
          <LinearGradient
            colors={[colors.accent.primary, colors.accent.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {purchasing ? (
            <ActivityIndicator color={colors.bg.primary} />
          ) : (
            <Text style={styles.purchaseButtonText}>
              Start Premium
            </Text>
          )}
        </Pressable>

        {/* Restore Purchases */}
        <Pressable
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={restoring}
        >
          {restoring ? (
            <ActivityIndicator color={colors.text.secondary} size="small" />
          ) : (
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          )}
        </Pressable>

        {/* Legal Text */}
        <Text style={styles.legalText}>
          Payment will be charged to your {Platform.OS === 'ios' ? 'Apple ID' : 'Google Play'} account.
          Subscription automatically renews unless canceled at least 24 hours before the end of the current period.
        </Text>

        {/* Safety Note */}
        <View style={styles.safetyNote}>
          <Shield size={16} color={colors.accent.secondary} />
          <Text style={styles.safetyNoteText}>
            Safety guides are always free
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  titleSmall: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  subtitleSmall: {
    fontSize: 14,
  },
  featuresContainer: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  packagesContainer: {
    gap: 12,
    marginBottom: 24,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.border.default,
  },
  packageCardSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: 'rgba(91, 206, 250, 0.08)',
  },
  packageCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    left: 16,
    backgroundColor: colors.accent.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.bg.primary,
    letterSpacing: 0.5,
  },
  packageContent: {
    flex: 1,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  packageSavings: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent.success,
  },
  packagePricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  packagePrice: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
  },
  packagePeriod: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginLeft: 4,
  },
  packageMonthly: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionIndicatorSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  purchaseButton: {
    height: 56,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  purchaseButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.bg.primary,
    letterSpacing: -0.2,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  restoreButtonText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  legalText: {
    fontSize: 11,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  safetyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: 'rgba(245, 169, 184, 0.1)',
    borderRadius: borderRadius.md,
  },
  safetyNoteText: {
    fontSize: 13,
    color: colors.accent.secondary,
    fontWeight: '500',
  },
});
