/**
 * Tier Selection Screen
 *
 * Allows users to choose between Free and Premium tiers
 * during onboarding, after email verification.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { Shield, Dumbbell, Sparkles, MessageCircle, LineChart } from 'lucide-react-native';
import { PurchasesPackage, PACKAGE_TYPE } from 'react-native-purchases';

import { useSubscription } from '../../contexts/SubscriptionContext';
import { useToast } from '../../contexts/ToastContext';
import { setTierSelectionCompleted } from '../../services/storage/tierSelection';
import { FREE_TIER_LIMITS } from '../../services/payments/entitlements';
import { colors, spacing, borderRadius } from '../../theme/theme';
import type { OnboardingStackParamList } from '../../types/onboarding';

type TierSelectionScreenNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  'TierSelection'
>;

interface TierSelectionScreenProps {
  navigation: TierSelectionScreenNavigationProp;
}

const FREE_FEATURES = [
  { text: `${FREE_TIER_LIMITS.WORKOUTS_PER_WEEK} workouts per week`, icon: Dumbbell },
  { text: 'Basic exercise library', icon: Sparkles },
  { text: 'Safety guides included', icon: Shield },
];

const PREMIUM_FEATURES = [
  { text: 'Unlimited workouts', icon: Dumbbell },
  { text: '200+ exercises with guidance', icon: Sparkles },
  { text: 'AI Copilot unlimited', icon: MessageCircle },
  { text: 'Progress charts', icon: LineChart },
  { text: 'Smart weight suggestions', icon: Shield },
];

export default function TierSelectionScreen({ navigation }: TierSelectionScreenProps) {
  const insets = useSafeAreaInsets();
  const { packages, packagesLoading, purchase, isLoading } = useSubscription();
  const { showInfo } = useToast();

  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [purchasing, setPurchasing] = useState(false);

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
    console.log('[TierSelection] packages:', packages.length);
    console.log('[TierSelection] packageTypes:', packages.map(p => ({ id: p.identifier, type: p.packageType })));
    console.log('[TierSelection] monthlyPackage:', monthlyPackage?.identifier);
    console.log('[TierSelection] annualPackage:', annualPackage?.identifier);
  }

  // Default to annual if available
  useEffect(() => {
    if (annualPackage && !selectedPackage) {
      setSelectedPackage(annualPackage);
    } else if (monthlyPackage && !selectedPackage) {
      setSelectedPackage(monthlyPackage);
    }
  }, [packages, annualPackage, monthlyPackage, selectedPackage]);

  // Calculate savings for annual
  const monthlyPrice = monthlyPackage?.product.price ?? 9.99;
  const annualPrice = annualPackage?.product.price ?? 79.99;
  const annualMonthly = annualPrice / 12;
  const savingsPercent = Math.round((1 - annualMonthly / monthlyPrice) * 100);

  const handleContinueFree = async () => {
    await setTierSelectionCompleted();
    showInfo('Free Plan Selected', 'You can upgrade anytime from Settings');
    navigation.replace('WhyTransFitness');
  };

  const handleStartPremium = async () => {
    if (!selectedPackage || purchasing) return;

    setPurchasing(true);
    try {
      const success = await purchase(selectedPackage);
      if (success) {
        await setTierSelectionCompleted();
        navigation.replace('WhyTransFitness');
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
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bg.primary, colors.bg.secondary]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>Start your fitness journey</Text>
        </View>

        {/* Free Tier Card */}
        <View style={styles.tierCard}>
          <View style={styles.tierHeader}>
            <Text style={styles.tierName}>FREE</Text>
          </View>

          <View style={styles.featuresList}>
            {FREE_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <feature.icon size={16} color={colors.text.secondary} />
                </View>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.freeButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleContinueFree}
          >
            <Text style={styles.freeButtonText}>Continue Free</Text>
          </Pressable>
        </View>

        {/* Premium Tier Card */}
        <View style={[styles.tierCard, styles.premiumCard]}>
          <LinearGradient
            colors={['rgba(91, 206, 250, 0.1)', 'rgba(91, 206, 250, 0.02)']}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.tierHeader}>
            <Text style={[styles.tierName, styles.premiumTierName]}>PREMIUM</Text>
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>BEST VALUE</Text>
            </View>
          </View>

          <View style={styles.featuresList}>
            {PREMIUM_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={[styles.featureIcon, styles.premiumFeatureIcon]}>
                  <feature.icon size={16} color={colors.accent.primary} />
                </View>
                <Text style={[styles.featureText, styles.premiumFeatureText]}>
                  {feature.text}
                </Text>
              </View>
            ))}
          </View>

          {/* Package Selection */}
          {packagesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.accent.primary} />
            </View>
          ) : (
            <View style={styles.packageSelection}>
              {/* Annual Option */}
              {annualPackage && (
                <Pressable
                  style={({ pressed }) => [
                    styles.packageOption,
                    selectedPackage?.identifier === annualPackage.identifier &&
                      styles.packageOptionSelected,
                    pressed && styles.packageOptionPressed,
                  ]}
                  onPress={() => {
                    if (__DEV__) console.log('[TierSelection] Annual tapped');
                    setSelectedPackage(annualPackage);
                  }}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      selectedPackage?.identifier === annualPackage.identifier &&
                        styles.radioCircleSelected,
                    ]}
                  >
                    {selectedPackage?.identifier === annualPackage.identifier && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <View style={styles.packageInfo}>
                    <Text style={styles.packageName}>Annual</Text>
                    <Text style={styles.packagePrice}>
                      {annualPackage.product.priceString}/yr
                    </Text>
                  </View>
                  <Text style={styles.packageSavings}>Save {savingsPercent}%</Text>
                </Pressable>
              )}

              {/* Monthly Option */}
              {monthlyPackage && (
                <Pressable
                  style={({ pressed }) => [
                    styles.packageOption,
                    selectedPackage?.identifier === monthlyPackage.identifier &&
                      styles.packageOptionSelected,
                    pressed && styles.packageOptionPressed,
                  ]}
                  onPress={() => {
                    if (__DEV__) console.log('[TierSelection] Monthly tapped');
                    setSelectedPackage(monthlyPackage);
                  }}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      selectedPackage?.identifier === monthlyPackage.identifier &&
                        styles.radioCircleSelected,
                    ]}
                  >
                    {selectedPackage?.identifier === monthlyPackage.identifier && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <View style={styles.packageInfo}>
                    <Text style={styles.packageName}>Monthly</Text>
                    <Text style={styles.packagePrice}>
                      {monthlyPackage.product.priceString}/mo
                    </Text>
                  </View>
                </Pressable>
              )}
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.premiumButton,
              pressed && styles.buttonPressed,
              (purchasing || isLoading) && styles.buttonDisabled,
            ]}
            onPress={handleStartPremium}
            disabled={purchasing || isLoading || !selectedPackage}
          >
            <LinearGradient
              colors={[colors.accent.primary, colors.accent.primaryDark]}
              style={StyleSheet.absoluteFill}
            />
            {purchasing ? (
              <ActivityIndicator color={colors.bg.primary} />
            ) : (
              <Text style={styles.premiumButtonText}>Start Premium</Text>
            )}
          </Pressable>
        </View>

        {/* Safety Note */}
        <View style={styles.safetyNote}>
          <Shield size={16} color={colors.accent.secondary} />
          <Text style={styles.safetyNoteText}>Safety guides are always free</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: 'Poppins',
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    color: colors.text.secondary,
  },
  tierCard: {
    backgroundColor: colors.bg.tertiary,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  premiumCard: {
    borderColor: colors.accent.primary,
    borderWidth: 2,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  tierName: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: 1,
  },
  premiumTierName: {
    color: colors.accent.primary,
  },
  bestValueBadge: {
    marginLeft: spacing.sm,
    backgroundColor: colors.accent.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestValueText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '700',
    color: colors.bg.primary,
    letterSpacing: 0.5,
  },
  featuresList: {
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  premiumFeatureIcon: {
    backgroundColor: 'rgba(91, 206, 250, 0.1)',
  },
  featureText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: colors.text.secondary,
  },
  premiumFeatureText: {
    color: colors.text.primary,
  },
  freeButton: {
    height: 48,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeButtonText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  loadingContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  packageSelection: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  packageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  packageOptionSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: 'rgba(91, 206, 250, 0.08)',
  },
  packageOptionPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  radioCircleSelected: {
    borderColor: colors.accent.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent.primary,
  },
  packageInfo: {
    flex: 1,
  },
  packageName: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  packagePrice: {
    fontFamily: 'Poppins',
    fontSize: 12,
    color: colors.text.secondary,
  },
  packageSavings: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent.success,
  },
  premiumButton: {
    height: 52,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
  premiumButtonText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: colors.bg.primary,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  safetyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.m,
  },
  safetyNoteText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    color: colors.accent.secondary,
    fontWeight: '500',
  },
});
