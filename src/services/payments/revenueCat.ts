/**
 * RevenueCat Service
 *
 * Handles all in-app purchase operations via RevenueCat SDK.
 * This provides a clean abstraction over platform-specific IAP implementations.
 */

import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOfferings,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys - These are public keys safe to include in client code
const REVENUECAT_API_KEY_IOS = 'test_mcyttscsPxbPBPFSLrnSahepHKI';
const REVENUECAT_API_KEY_ANDROID = 'test_mcyttscsPxbPBPFSLrnSahepHKI';

// Entitlement identifier - matches what you set up in RevenueCat dashboard
export const ENTITLEMENT_ID = 'premium';

// Product identifiers for App Store Connect / Google Play Console
export const PRODUCT_IDS = {
  MONTHLY: 'transfitness_premium_monthly',
  ANNUAL: 'transfitness_premium_annual',
} as const;

export type ProductId = typeof PRODUCT_IDS[keyof typeof PRODUCT_IDS];

export interface SubscriptionStatus {
  isSubscribed: boolean;
  tier: 'free' | 'premium';
  expirationDate: Date | null;
  willRenew: boolean;
  productId: ProductId | null;
  isLifetime: boolean;
}

let isInitialized = false;

/**
 * Initialize RevenueCat SDK
 * Should be called once at app startup, after user auth
 */
export async function initializeRevenueCat(userId?: string): Promise<void> {
  if (isInitialized) {
    if (__DEV__) console.log('[RevenueCat] Already initialized');
    return;
  }

  try {
    const apiKey = Platform.OS === 'ios'
      ? REVENUECAT_API_KEY_IOS
      : REVENUECAT_API_KEY_ANDROID;

    // Enable debug logs in development
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    await Purchases.configure({ apiKey });

    // If we have a user ID, identify them to RevenueCat
    // This links purchases to your user system
    if (userId) {
      await Purchases.logIn(userId);
    }

    isInitialized = true;
    if (__DEV__) console.log('[RevenueCat] Initialized successfully');
  } catch (error) {
    console.error('[RevenueCat] Initialization failed:', error);
    throw error;
  }
}

/**
 * Identify user to RevenueCat (call after login)
 * This associates purchases with your user ID
 */
export async function identifyUser(userId: string): Promise<CustomerInfo> {
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    if (__DEV__) console.log('[RevenueCat] User identified:', userId);
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Failed to identify user:', error);
    throw error;
  }
}

/**
 * Log out user from RevenueCat (call after logout)
 * Creates anonymous user for next session
 */
export async function logoutUser(): Promise<CustomerInfo | null> {
  try {
    // Check if user is already anonymous before attempting logout
    const customerInfo = await Purchases.getCustomerInfo();
    if (customerInfo.originalAppUserId.startsWith('$RCAnonymousID:')) {
      if (__DEV__) console.log('[RevenueCat] User is already anonymous, skipping logout');
      return customerInfo;
    }

    const loggedOutInfo = await Purchases.logOut();
    if (__DEV__) console.log('[RevenueCat] User logged out');
    return loggedOutInfo;
  } catch (error) {
    // Handle the case where logout is called on an anonymous user
    if (error instanceof Error && error.message.includes('anonymous')) {
      if (__DEV__) console.log('[RevenueCat] User was already anonymous');
      return null;
    }
    console.error('[RevenueCat] Failed to logout user:', error);
    throw error;
  }
}

/**
 * Get current subscription status
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return parseCustomerInfo(customerInfo);
  } catch (error) {
    console.error('[RevenueCat] Failed to get subscription status:', error);
    // Return free tier on error to not block the app
    return {
      isSubscribed: false,
      tier: 'free',
      expirationDate: null,
      willRenew: false,
      productId: null,
      isLifetime: false,
    };
  }
}

/**
 * Get available subscription packages (offerings)
 */
export async function getOfferings(): Promise<PurchasesOfferings | null> {
  try {
    const offerings = await Purchases.getOfferings();

    if (!offerings.current) {
      console.warn('[RevenueCat] No current offering configured');
      return null;
    }

    return offerings;
  } catch (error) {
    console.error('[RevenueCat] Failed to get offerings:', error);
    return null;
  }
}

/**
 * Get packages from the current offering
 */
export async function getPackages(): Promise<PurchasesPackage[]> {
  try {
    const offerings = await getOfferings();

    if (!offerings?.current?.availablePackages) {
      return [];
    }

    return offerings.current.availablePackages;
  } catch (error) {
    console.error('[RevenueCat] Failed to get packages:', error);
    return [];
  }
}

/**
 * Purchase a subscription package
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{ success: boolean; customerInfo: CustomerInfo | null; error?: string }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);

    const isSubscribed = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

    if (__DEV__) console.log('[RevenueCat] Purchase completed, subscribed:', isSubscribed);

    return {
      success: isSubscribed,
      customerInfo,
    };
  } catch (error: unknown) {
    // Handle user cancellation gracefully
    if (error && typeof error === 'object' && 'userCancelled' in error && error.userCancelled) {
      if (__DEV__) console.log('[RevenueCat] User cancelled purchase');
      return {
        success: false,
        customerInfo: null,
        error: 'cancelled',
      };
    }

    console.error('[RevenueCat] Purchase failed:', error);
    return {
      success: false,
      customerInfo: null,
      error: error instanceof Error ? error.message : 'Purchase failed',
    };
  }
}

/**
 * Restore previous purchases
 * Useful for users who reinstall the app or switch devices
 */
export async function restorePurchases(): Promise<{
  success: boolean;
  isSubscribed: boolean;
  error?: string;
}> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const isSubscribed = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

    if (__DEV__) console.log('[RevenueCat] Restore completed, subscribed:', isSubscribed);

    return {
      success: true,
      isSubscribed,
    };
  } catch (error) {
    console.error('[RevenueCat] Restore failed:', error);
    return {
      success: false,
      isSubscribed: false,
      error: error instanceof Error ? error.message : 'Restore failed',
    };
  }
}

/**
 * Add listener for customer info updates
 * Returns cleanup function
 */
export function addCustomerInfoListener(
  listener: (customerInfo: CustomerInfo) => void
): () => void {
  Purchases.addCustomerInfoUpdateListener(listener);

  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
}

/**
 * Parse CustomerInfo into our SubscriptionStatus type
 */
function parseCustomerInfo(customerInfo: CustomerInfo): SubscriptionStatus {
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

  if (!entitlement) {
    return {
      isSubscribed: false,
      tier: 'free',
      expirationDate: null,
      willRenew: false,
      productId: null,
      isLifetime: false,
    };
  }

  return {
    isSubscribed: true,
    tier: 'premium',
    expirationDate: entitlement.expirationDate
      ? new Date(entitlement.expirationDate)
      : null,
    willRenew: entitlement.willRenew,
    productId: entitlement.productIdentifier as ProductId,
    isLifetime: entitlement.expirationDate === null,
  };
}

/**
 * Check if user has premium access (convenience function)
 */
export async function hasPremiumAccess(): Promise<boolean> {
  const status = await getSubscriptionStatus();
  return status.isSubscribed;
}

/**
 * Get customer info directly (for debugging/advanced use)
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error('[RevenueCat] Failed to get customer info:', error);
    return null;
  }
}
