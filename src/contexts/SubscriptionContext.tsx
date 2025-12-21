/**
 * Subscription Context
 *
 * Provides global subscription state throughout the app.
 * Wraps RevenueCat operations and caches subscription status.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import {
  initializeRevenueCat,
  identifyUser,
  logoutUser,
  getSubscriptionStatus,
  getPackages,
  purchasePackage,
  restorePurchases,
  addCustomerInfoListener,
  SubscriptionStatus,
} from '../services/payments/revenueCat';
import {
  SubscriptionTier,
  FeatureId,
  hasFeature,
  FREE_TIER_LIMITS,
} from '../services/payments/entitlements';
import { useAuth } from './AuthContext';

interface SubscriptionContextValue {
  // Subscription state
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  isLoading: boolean;
  error: string | null;

  // Package info for paywall
  packages: PurchasesPackage[];
  packagesLoading: boolean;

  // Actions
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;

  // Convenience helpers
  isPremium: boolean;
  canAccess: (feature: FeatureId) => boolean;
  freeTierLimits: typeof FREE_TIER_LIMITS;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(
  undefined
);

const DEFAULT_STATUS: SubscriptionStatus = {
  isSubscribed: false,
  tier: 'free',
  expirationDate: null,
  willRenew: false,
  productId: null,
  isLifetime: false,
};

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuth();

  const [status, setStatus] = useState<SubscriptionStatus>(DEFAULT_STATUS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);

  // Initialize RevenueCat when auth state changes
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Initialize SDK
        await initializeRevenueCat(user?.id);

        // If user is authenticated, identify them
        if (isAuthenticated && user?.id) {
          await identifyUser(user.id);
        }

        // Get initial subscription status
        const currentStatus = await getSubscriptionStatus();
        setStatus(currentStatus);

        console.log('[Subscription] Initialized, tier:', currentStatus.tier);
      } catch (err) {
        console.error('[Subscription] Init error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize');
        // Default to free tier on error
        setStatus(DEFAULT_STATUS);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [isAuthenticated, user?.id]);

  // Listen for subscription changes
  useEffect(() => {
    const handleCustomerInfoUpdate = (customerInfo: CustomerInfo) => {
      console.log('[Subscription] Customer info updated');
      // Re-fetch status to get our parsed format
      getSubscriptionStatus().then(setStatus);
    };

    const cleanup = addCustomerInfoListener(handleCustomerInfoUpdate);
    return cleanup;
  }, []);

  // Handle logout - reset to anonymous user
  useEffect(() => {
    if (!isAuthenticated) {
      logoutUser().catch(console.error);
      setStatus(DEFAULT_STATUS);
    }
  }, [isAuthenticated]);

  // Load packages for paywall
  const loadPackages = useCallback(async () => {
    setPackagesLoading(true);
    try {
      const availablePackages = await getPackages();
      setPackages(availablePackages);
    } catch (err) {
      console.error('[Subscription] Failed to load packages:', err);
    } finally {
      setPackagesLoading(false);
    }
  }, []);

  // Load packages on mount
  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  // Purchase a package
  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    setError(null);

    const result = await purchasePackage(pkg);

    if (result.success) {
      // Refresh status after successful purchase
      const newStatus = await getSubscriptionStatus();
      setStatus(newStatus);
      return true;
    }

    if (result.error && result.error !== 'cancelled') {
      setError(result.error);
    }

    return false;
  }, []);

  // Restore purchases
  const restore = useCallback(async (): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await restorePurchases();

      if (result.success) {
        const newStatus = await getSubscriptionStatus();
        setStatus(newStatus);
        return result.isSubscribed;
      }

      if (result.error) {
        setError(result.error);
      }

      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh subscription status
  const refreshStatus = useCallback(async () => {
    try {
      const currentStatus = await getSubscriptionStatus();
      setStatus(currentStatus);
    } catch (err) {
      console.error('[Subscription] Refresh failed:', err);
    }
  }, []);

  // Memoized helpers
  const tier: SubscriptionTier = status.tier;
  const isPremium = status.isSubscribed;

  const canAccess = useCallback(
    (feature: FeatureId): boolean => {
      return hasFeature(tier, feature);
    },
    [tier]
  );

  const value = useMemo(
    () => ({
      status,
      tier,
      isLoading,
      error,
      packages,
      packagesLoading,
      purchase,
      restore,
      refreshStatus,
      isPremium,
      canAccess,
      freeTierLimits: FREE_TIER_LIMITS,
    }),
    [
      status,
      tier,
      isLoading,
      error,
      packages,
      packagesLoading,
      purchase,
      restore,
      refreshStatus,
      isPremium,
      canAccess,
    ]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

/**
 * Hook to access subscription context
 */
export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
