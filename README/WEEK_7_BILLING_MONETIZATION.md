# TransFitness - Week 7: Billing & Monetization (Detailed Roadmap)

**Date**: November 13, 2025  
**Based on**: BRD v2.2 (Code-Freeze Ready)  
**Purpose**: Complete implementation guide for monetization features

---

## Overview

**Timeline**: 1 week (Week 7)  
**Goal**: Implement complete monetization system with paywall, trials, founder offers, and in-app purchases  
**Outcome**: App can generate revenue from Day 1 of launch

**Development Approach**:
- Build paywall first (blocks Plus features)
- Implement IAP (iOS + Android)
- Add founder offer inventory system
- Test purchase flows thoroughly (critical for revenue)
- Handle edge cases (inventory race, refunds, trial cancellation)

**Estimated Effort**: 40-45 hours

---

## User Stories

### US-7.1: Paywall - Core vs Plus Tiers
**As a** user  
**I want to** see pricing options when I try to access Plus features  
**So that** I can decide whether to upgrade

**Acceptance Criteria**:
- [ ] Paywall appears when user tries to access Plus features (BYO import, advanced progression)
- [ ] Shows Free, Core, and Plus tiers side-by-side
- [ ] Each tier shows features, pricing, and CTA
- [ ] Free tier has "Always Free" badge and value bullets (v2.2)
- [ ] Plus tier has "7-Day Free Trial" badge
- [ ] Founder offers are prominently displayed (if inventory available)
- [ ] Pricing is localized (USD, EUR, GBP, etc.)
- [ ] User can dismiss paywall (returns to previous screen)

**Implementation**:
```typescript
// screens/Paywall.tsx

interface Tier {
  id: string;
  name: string;
  price: string;
  priceAnnual: string;
  features: string[];
  cta: string;
  badge?: string;
  highlighted?: boolean;
}

const tiers: Tier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    priceAnnual: '$0',
    features: [
      'Daily 5-minute workouts',
      'Safety swaps',
      '30-exercise library',
      'Basic progress tracking',
      'Community resources'
    ],
    cta: 'Current Plan',
    badge: 'Always Free'
  },
  {
    id: 'core',
    name: 'Core',
    price: '$14.99/month',
    priceAnnual: '$119/year',
    features: [
      'Everything in Free',
      'Unlimited workout lengths (5-45 min)',
      'Full 60-exercise library',
      'Personalized plans',
      'Goal-based progression',
      'Workout reminders',
      'Full workout history'
    ],
    cta: 'Get Core'
  },
  {
    id: 'plus',
    name: 'Plus',
    price: '$24.99/month',
    priceAnnual: '$199/year',
    features: [
      'Everything in Core',
      'Import your own routines (BYO)',
      'Advanced progression engine',
      'Priority support',
      'Early access to new features'
    ],
    cta: 'Start 7-Day Trial',
    badge: '7-Day Free Trial',
    highlighted: true
  }
];

// Paywall component:
export default function Paywall({ onDismiss, feature }: PaywallProps) {
  const [selectedTier, setSelectedTier] = useState('plus');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  
  return (
    <Modal visible={true} onDismiss={onDismiss}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {feature === 'byo' ? 'Import Your Routine' : 'Unlock Plus Features'}
        </Text>
        <Text style={styles.subtitle}>
          Choose the plan that's right for you
        </Text>
        <IconButton icon="close" onPress={onDismiss} />
      </View>
      
      {/* Billing period toggle */}
      <View style={styles.billingToggle}>
        <SegmentedButtons
          value={billingPeriod}
          onValueChange={setBillingPeriod}
          buttons={[
            { value: 'monthly', label: 'Monthly' },
            { value: 'annual', label: 'Annual (Save 33%)' }
          ]}
        />
      </View>
      
      {/* Founder offers banner (if available) */}
      {founderOffersAvailable && (
        <FounderOffersBanner inventory={founderInventory} />
      )}
      
      {/* Tier cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {tiers.map(tier => (
          <TierCard
            key={tier.id}
            tier={tier}
            selected={selectedTier === tier.id}
            billingPeriod={billingPeriod}
            onSelect={() => setSelectedTier(tier.id)}
          />
        ))}
      </ScrollView>
      
      {/* CTA */}
      <Button
        mode="contained"
        onPress={() => handlePurchase(selectedTier, billingPeriod)}
        style={styles.cta}
      >
        {selectedTier === 'plus' ? 'Start 7-Day Trial' : 'Get Core'}
      </Button>
      
      {/* Fine print */}
      <Text style={styles.finePrint}>
        {selectedTier === 'plus' && 
          'Trial starts today. Cancel anytime in the first 7 days at no charge. After trial, ${billingPeriod === 'monthly' ? '$24.99/month' : '$199/year'}.'}
      </Text>
      
      {/* Social proof (v2.2) */}
      <Text style={styles.socialProof}>
        Join {userCount} trans people working out safely
      </Text>
    </Modal>
  );
}
```

**Effort**: 10 hours

---

### US-7.2: Founder Offers - Inventory Display
**As a** user  
**I want to** see limited-time founder offers  
**So that** I can get the best deal as an early supporter

**Acceptance Criteria**:
- [ ] Founder offers appear prominently on paywall (if inventory available)
- [ ] Shows "Only X remaining" when inventory <100 (v2.2)
- [ ] Three founder SKUs: Founder Core Annual ($79/year), Founder Plus Annual ($149/year), Lifetime Plus ($299 one-time)
- [ ] Founder offers have "Limited Time" badge
- [ ] Inventory updates in real-time (synced from Supabase)
- [ ] When inventory hits zero, founder offers disappear from paywall

**Implementation**:
```typescript
// components/FounderOffersBanner.tsx

interface FounderOffer {
  sku: string;
  name: string;
  price: number;
  originalPrice: number;
  savings: string;
  inventory: number;
  description: string;
}

const founderOffers: FounderOffer[] = [
  {
    sku: 'founder_core_annual',
    name: 'Founder Core Annual',
    price: 79,
    originalPrice: 119,
    savings: 'Save $40',
    inventory: 300,
    description: '$79/year for life (renews at founder rate)'
  },
  {
    sku: 'founder_plus_annual',
    name: 'Founder Plus Annual',
    price: 149,
    originalPrice: 199,
    savings: 'Save $50',
    inventory: 300,
    description: '$149/year for life (renews at founder rate)'
  },
  {
    sku: 'lifetime_plus',
    name: 'Lifetime Plus',
    price: 299,
    originalPrice: 999,
    savings: 'Save $700',
    inventory: 100,
    description: 'One-time payment, yours forever'
  }
];

export default function FounderOffersBanner({ inventory }: Props) {
  const [selectedOffer, setSelectedOffer] = useState('lifetime_plus');
  
  // Real-time inventory sync
  useEffect(() => {
    const subscription = supabase
      .from('founder_offers')
      .on('UPDATE', payload => {
        updateInventory(payload.new);
      })
      .subscribe();
    
    return () => subscription.unsubscribe();
  }, []);
  
  return (
    <View style={styles.banner}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.badge}>🎉 Limited Time Founder Offers</Text>
        {inventory.lifetime_plus < 100 && (
          <Text style={styles.inventory}>
            Only {inventory.lifetime_plus} remaining
          </Text>
        )}
      </View>
      
      {/* Offer cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {founderOffers.map(offer => (
          <FounderOfferCard
            key={offer.sku}
            offer={offer}
            inventory={inventory[offer.sku]}
            selected={selectedOffer === offer.sku}
            onSelect={() => setSelectedOffer(offer.sku)}
          />
        ))}
      </ScrollView>
      
      {/* CTA */}
      <Button
        mode="contained"
        onPress={() => handleFounderPurchase(selectedOffer)}
        style={styles.cta}
      >
        Claim Founder Offer
      </Button>
      
      {/* Fine print */}
      <Text style={styles.finePrint}>
        {selectedOffer === 'lifetime_plus' 
          ? 'One-time payment. No recurring charges. Yours forever.'
          : 'Renews at founder rate for life. Price protection guaranteed.'}
      </Text>
    </View>
  );
}
```

**Effort**: 6 hours

---

### US-7.3: Founder Offers - Inventory Race Condition UX
**As a** user  
**I want** a graceful experience if founder offers sell out during purchase  
**So that** I don't feel frustrated

**Acceptance Criteria**:
- [ ] If inventory hits zero between paywall open and purchase, show fallback toast (v2.2)
- [ ] Fallback toast: "Founder offers just sold out — but you still save 33% with Annual Plus!"
- [ ] Auto-populate Annual Plus ($199/year) in purchase flow
- [ ] Highlight savings: "You're still getting a great deal 🎉"
- [ ] User can proceed with Annual Plus or cancel

**Implementation**:
```typescript
// services/purchaseHandler.ts

async function handleFounderPurchase(sku: string) {
  try {
    // 1. Check inventory before purchase
    const inventory = await checkInventory(sku);
    
    if (inventory.remaining_inventory <= 0) {
      // Inventory race condition: sold out during user flow (v2.2)
      showInventoryRaceToast();
      return;
    }
    
    // 2. Reserve inventory (optimistic lock)
    const reservation = await reserveInventory(sku);
    
    // 3. Initiate purchase
    const purchase = await initiatePurchase(sku, reservation.id);
    
    // 4. If purchase succeeds, decrement inventory
    if (purchase.success) {
      await decrementInventory(sku);
      showSuccessToast();
    } else {
      // Release reservation if purchase fails
      await releaseReservation(reservation.id);
      showErrorToast();
    }
  } catch (error) {
    if (error.code === 'INVENTORY_EXHAUSTED') {
      showInventoryRaceToast();
    } else {
      showErrorToast(error.message);
    }
  }
}

function showInventoryRaceToast() {
  // v2.2: Graceful fallback
  Toast.show({
    type: 'info',
    text1: 'Founder offers just sold out 😢',
    text2: 'But you still save 33% with Annual Plus!',
    position: 'top',
    visibilityTime: 5000,
    onPress: () => {
      // Auto-populate Annual Plus
      setSelectedTier('plus');
      setBillingPeriod('annual');
      Toast.hide();
    }
  });
}

// Inventory reservation (prevents race conditions)
async function reserveInventory(sku: string): Promise<Reservation> {
  const { data, error } = await supabase.rpc('reserve_inventory', {
    p_sku: sku,
    p_ttl_seconds: 300 // 5-minute reservation
  });
  
  if (error) throw error;
  return data;
}

// Supabase function (PostgreSQL)
// CREATE FUNCTION reserve_inventory(p_sku TEXT, p_ttl_seconds INT)
// RETURNS TABLE(id UUID, expires_at TIMESTAMPTZ) AS $$
// BEGIN
//   -- Check inventory
//   IF (SELECT remaining_inventory FROM founder_offers WHERE sku = p_sku) <= 0 THEN
//     RAISE EXCEPTION 'INVENTORY_EXHAUSTED';
//   END IF;
//   
//   -- Create reservation
//   INSERT INTO inventory_reservations (sku, expires_at)
//   VALUES (p_sku, NOW() + (p_ttl_seconds || ' seconds')::INTERVAL)
//   RETURNING id, expires_at;
// END;
// $$ LANGUAGE plpgsql;
```

**Effort**: 6 hours

---

### US-7.4: In-App Purchases - iOS (App Store)
**As an** iOS user  
**I want to** purchase Core or Plus subscriptions  
**So that** I can unlock premium features

**Acceptance Criteria**:
- [ ] IAP configured in App Store Connect (SKUs, pricing, localization)
- [ ] Purchase flow uses StoreKit (via expo-in-app-purchases)
- [ ] Supports monthly and annual subscriptions
- [ ] Supports non-renewing subscriptions (founder offers)
- [ ] Receipt validation on server (Supabase Edge Function)
- [ ] Purchase unlocks immediately after successful transaction
- [ ] Handles errors gracefully (payment declined, network error, etc.)

**Implementation**:
```typescript
// services/iap/ios.ts

import * as InAppPurchases from 'expo-in-app-purchases';

// SKUs (must match App Store Connect)
const SKUs = {
  CORE_MONTHLY: 'com.transfitness.core.monthly',
  CORE_ANNUAL: 'com.transfitness.core.annual',
  PLUS_MONTHLY: 'com.transfitness.plus.monthly',
  PLUS_ANNUAL: 'com.transfitness.plus.annual',
  FOUNDER_CORE_ANNUAL: 'com.transfitness.founder.core.annual',
  FOUNDER_PLUS_ANNUAL: 'com.transfitness.founder.plus.annual',
  LIFETIME_PLUS: 'com.transfitness.lifetime.plus'
};

// Initialize IAP
export async function initializeIAP() {
  try {
    await InAppPurchases.connectAsync();
    console.log('IAP initialized');
  } catch (error) {
    console.error('IAP initialization failed:', error);
  }
}

// Get products (with localized pricing)
export async function getProducts() {
  try {
    const { results } = await InAppPurchases.getProductsAsync(
      Object.values(SKUs)
    );
    return results;
  } catch (error) {
    console.error('Failed to get products:', error);
    return [];
  }
}

// Purchase product
export async function purchaseProduct(sku: string) {
  try {
    // 1. Initiate purchase
    await InAppPurchases.purchaseItemAsync(sku);
    
    // 2. Listen for purchase updates
    InAppPurchases.setPurchaseListener(({ responseCode, results }) => {
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        results?.forEach(purchase => {
          if (!purchase.acknowledged) {
            handlePurchaseSuccess(purchase);
          }
        });
      } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
        handlePurchaseCanceled();
      } else {
        handlePurchaseError(responseCode);
      }
    });
  } catch (error) {
    console.error('Purchase failed:', error);
    handlePurchaseError(error);
  }
}

// Handle successful purchase
async function handlePurchaseSuccess(purchase: InAppPurchases.InAppPurchase) {
  try {
    // 1. Validate receipt on server
    const validation = await validateReceipt(purchase);
    
    if (!validation.valid) {
      throw new Error('Invalid receipt');
    }
    
    // 2. Save purchase to database
    await savePurchase({
      user_id: user.id,
      sku: purchase.productId,
      price: validation.price,
      platform: 'ios',
      transaction_id: purchase.transactionId,
      purchased_at: new Date()
    });
    
    // 3. Unlock features immediately
    await unlockFeatures(purchase.productId);
    
    // 4. Acknowledge purchase (required by Apple)
    await InAppPurchases.finishTransactionAsync(purchase, true);
    
    // 5. Show success message
    showSuccessToast('Purchase successful! Features unlocked.');
    
    // 6. Navigate back to app
    navigation.goBack();
  } catch (error) {
    console.error('Failed to process purchase:', error);
    showErrorToast('Purchase failed. Please contact support.');
  }
}

// Validate receipt (Supabase Edge Function)
async function validateReceipt(purchase: InAppPurchases.InAppPurchase) {
  const { data, error } = await supabase.functions.invoke('validate-receipt', {
    body: {
      platform: 'ios',
      receipt: purchase.transactionReceipt,
      productId: purchase.productId
    }
  });
  
  if (error) throw error;
  return data;
}

// Restore purchases (required by Apple)
export async function restorePurchases() {
  try {
    const { results } = await InAppPurchases.getPurchaseHistoryAsync();
    
    for (const purchase of results) {
      await handlePurchaseSuccess(purchase);
    }
    
    showSuccessToast('Purchases restored!');
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    showErrorToast('Failed to restore purchases.');
  }
}
```

**App Store Connect Setup**:
1. Create in-app purchases in App Store Connect
2. Configure SKUs, pricing, and localization
3. Add subscription groups (Core, Plus)
4. Set up subscription levels (monthly, annual)
5. Add non-renewing subscriptions (founder offers)
6. Submit for review with app

**Effort**: 10 hours

---

### US-7.5: In-App Purchases - Android (Google Play)
**As an** Android user  
**I want to** purchase Core or Plus subscriptions  
**So that** I can unlock premium features

**Acceptance Criteria**:
- [ ] IAP configured in Google Play Console (SKUs, pricing, localization)
- [ ] Purchase flow uses Google Play Billing (via expo-in-app-purchases)
- [ ] Supports monthly and annual subscriptions
- [ ] Supports one-time purchases (founder offers)
- [ ] Receipt validation on server (Supabase Edge Function)
- [ ] Purchase unlocks immediately after successful transaction
- [ ] Handles errors gracefully (payment declined, network error, etc.)

**Implementation**:
```typescript
// services/iap/android.ts

import * as InAppPurchases from 'expo-in-app-purchases';

// SKUs (must match Google Play Console)
const SKUs = {
  CORE_MONTHLY: 'core_monthly',
  CORE_ANNUAL: 'core_annual',
  PLUS_MONTHLY: 'plus_monthly',
  PLUS_ANNUAL: 'plus_annual',
  FOUNDER_CORE_ANNUAL: 'founder_core_annual',
  FOUNDER_PLUS_ANNUAL: 'founder_plus_annual',
  LIFETIME_PLUS: 'lifetime_plus'
};

// Purchase product (Android-specific)
export async function purchaseProduct(sku: string) {
  try {
    // 1. Get product details
    const { results } = await InAppPurchases.getProductsAsync([sku]);
    const product = results[0];
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    // 2. Initiate purchase
    await InAppPurchases.purchaseItemAsync(sku);
    
    // 3. Listen for purchase updates
    InAppPurchases.setPurchaseListener(({ responseCode, results }) => {
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        results?.forEach(purchase => {
          if (purchase.purchaseState === InAppPurchases.InAppPurchaseState.PURCHASED) {
            handlePurchaseSuccess(purchase);
          }
        });
      } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
        handlePurchaseCanceled();
      } else {
        handlePurchaseError(responseCode);
      }
    });
  } catch (error) {
    console.error('Purchase failed:', error);
    handlePurchaseError(error);
  }
}

// Acknowledge purchase (required by Google)
async function acknowledgePurchase(purchase: InAppPurchases.InAppPurchase) {
  try {
    await InAppPurchases.finishTransactionAsync(purchase, true);
  } catch (error) {
    console.error('Failed to acknowledge purchase:', error);
  }
}
```

**Google Play Console Setup**:
1. Create in-app products in Google Play Console
2. Configure SKUs, pricing, and localization
3. Add subscription products (Core, Plus)
4. Set up subscription tiers (monthly, annual)
5. Add one-time products (founder offers)
6. Submit for review with app

**Effort**: 8 hours

---

### US-7.6: Plus Trial - 7-Day Free Trial
**As a** user  
**I want to** try Plus features for free  
**So that** I can decide if it's worth paying for

**Acceptance Criteria**:
- [ ] Plus trial is 7 days (starts immediately)
- [ ] Trial unlocks all Plus features (BYO import, advanced progression)
- [ ] User can cancel anytime during trial (no charge)
- [ ] After 7 days, trial converts to paid subscription (monthly or annual)
- [ ] User receives reminder 2 days before trial ends
- [ ] One-tap cancel in Settings

**Implementation**:
```typescript
// services/trial.ts

interface Trial {
  id: string;
  user_id: string;
  tier: 'plus';
  start_date: Date;
  end_date: Date;
  canceled: boolean;
  converted: boolean;
}

// Start trial
export async function startTrial(userId: string, billingPeriod: 'monthly' | 'annual') {
  try {
    // 1. Check if user already had trial
    const existingTrial = await getExistingTrial(userId);
    if (existingTrial) {
      throw new Error('Trial already used');
    }
    
    // 2. Create trial
    const trial: Trial = {
      id: generateId(),
      user_id: userId,
      tier: 'plus',
      start_date: new Date(),
      end_date: addDays(new Date(), 7),
      canceled: false,
      converted: false
    };
    
    // 3. Save trial to database
    await supabase.from('trials').insert(trial);
    
    // 4. Unlock Plus features immediately
    await unlockFeatures('plus');
    
    // 5. Schedule trial reminder (Day 5)
    await scheduleTrialReminder(userId, addDays(new Date(), 5));
    
    // 6. Schedule trial conversion (Day 7)
    await scheduleTrialConversion(userId, billingPeriod, addDays(new Date(), 7));
    
    // 7. Show success message
    showSuccessToast('7-day trial started! Enjoy Plus features.');
    
    return trial;
  } catch (error) {
    console.error('Failed to start trial:', error);
    throw error;
  }
}

// Cancel trial
export async function cancelTrial(userId: string) {
  try {
    // 1. Get active trial
    const trial = await getActiveTrial(userId);
    if (!trial) {
      throw new Error('No active trial');
    }
    
    // 2. Mark trial as canceled
    await supabase
      .from('trials')
      .update({ canceled: true })
      .eq('id', trial.id);
    
    // 3. Cancel scheduled conversion
    await cancelScheduledConversion(trial.id);
    
    // 4. Downgrade to Core (or Free) at end of trial
    await scheduleDowngrade(userId, trial.end_date);
    
    // 5. Show confirmation
    showSuccessToast('Trial canceled. You can still use Plus until ' + formatDate(trial.end_date));
    
  } catch (error) {
    console.error('Failed to cancel trial:', error);
    throw error;
  }
}

// Trial reminder (Day 5)
async function sendTrialReminder(userId: string) {
  const notification = {
    title: 'Your trial ends in 2 days',
    body: 'Enjoying Plus? Your trial converts to $24.99/month in 2 days. Cancel anytime in Settings.',
    data: { screen: 'Settings' }
  };
  
  await sendPushNotification(userId, notification);
}

// Trial conversion (Day 7)
async function convertTrial(userId: string, billingPeriod: 'monthly' | 'annual') {
  try {
    // 1. Get trial
    const trial = await getActiveTrial(userId);
    if (!trial || trial.canceled) {
      return; // Trial was canceled
    }
    
    // 2. Initiate subscription purchase
    const sku = billingPeriod === 'monthly' 
      ? SKUs.PLUS_MONTHLY 
      : SKUs.PLUS_ANNUAL;
    
    await purchaseProduct(sku);
    
    // 3. Mark trial as converted
    await supabase
      .from('trials')
      .update({ converted: true })
      .eq('id', trial.id);
    
  } catch (error) {
    console.error('Trial conversion failed:', error);
    // Downgrade to Core if payment fails
    await unlockFeatures('core');
  }
}
```

**Effort**: 8 hours

---

### US-7.7: Subscription Management
**As a** user  
**I want to** manage my subscription (cancel, change plan, view billing)  
**So that** I have control over my payments

**Acceptance Criteria**:
- [ ] User can view current subscription status in Settings
- [ ] User can cancel subscription (one-tap)
- [ ] User can change plan (upgrade/downgrade)
- [ ] User can view billing history
- [ ] User can restore purchases (iOS requirement)
- [ ] Cancellation takes effect at end of billing period (not immediately)

**Implementation**:
```typescript
// screens/SubscriptionSettings.tsx

export default function SubscriptionSettings() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  
  useEffect(() => {
    loadSubscription();
  }, []);
  
  async function loadSubscription() {
    const sub = await getCurrentSubscription(user.id);
    setSubscription(sub);
  }
  
  return (
    <ScrollView>
      {/* Current plan */}
      <Card>
        <Card.Title title="Current Plan" />
        <Card.Content>
          <Text variant="headlineSmall">{subscription?.tier}</Text>
          <Text variant="bodyMedium">
            {subscription?.billing_period === 'monthly' 
              ? `$${subscription.price}/month` 
              : `$${subscription.price}/year`}
          </Text>
          <Text variant="bodySmall">
            Renews on {formatDate(subscription?.renewal_date)}
          </Text>
        </Card.Content>
      </Card>
      
      {/* Manage subscription */}
      <List.Section>
        <List.Item
          title="Change Plan"
          description="Upgrade or downgrade"
          left={props => <List.Icon {...props} icon="swap-horizontal" />}
          onPress={() => navigation.navigate('Paywall')}
        />
        
        <List.Item
          title="Cancel Subscription"
          description="Takes effect at end of billing period"
          left={props => <List.Icon {...props} icon="cancel" />}
          onPress={handleCancelSubscription}
        />
        
        <List.Item
          title="Billing History"
          description="View past payments"
          left={props => <List.Icon {...props} icon="receipt" />}
          onPress={() => navigation.navigate('BillingHistory')}
        />
        
        {Platform.OS === 'ios' && (
          <List.Item
            title="Restore Purchases"
            description="Restore previous purchases"
            left={props => <List.Icon {...props} icon="restore" />}
            onPress={handleRestorePurchases}
          />
        )}
      </List.Section>
    </ScrollView>
  );
}

async function handleCancelSubscription() {
  Alert.alert(
    'Cancel Subscription',
    'Your subscription will remain active until the end of your billing period. Are you sure?',
    [
      { text: 'Keep Subscription', style: 'cancel' },
      { 
        text: 'Cancel', 
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelSubscription(user.id);
            showSuccessToast('Subscription canceled. Active until ' + formatDate(subscription.renewal_date));
          } catch (error) {
            showErrorToast('Failed to cancel subscription.');
          }
        }
      }
    ]
  );
}
```

**Effort**: 6 hours

---

### US-7.8: Lifetime Plus Refund Offer (v2.2)
**As a** Lifetime Plus user who wants a refund  
**I want** to downgrade to Annual Plus at founder rate  
**So that** I can keep using the app at a lower commitment

**Acceptance Criteria**:
- [ ] After refund is processed, user receives one-time downgrade offer
- [ ] Offer: Annual Plus at founder rate ($149/year, renews for life)
- [ ] Offer is shown via email or in-app notification
- [ ] User can accept or decline offer
- [ ] If accepted, user is charged $149 and gets Plus for life (at that rate)
- [ ] If declined, user is downgraded to Free

**Implementation**:
```typescript
// services/refund.ts

async function processLifetimePlusRefund(userId: string, refundReason: string) {
  try {
    // 1. Process refund via App Store/Play Store
    await processRefund(userId);
    
    // 2. Mark purchase as refunded
    await supabase
      .from('purchases')
      .update({ refunded: true, refund_reason: refundReason })
      .eq('user_id', userId)
      .eq('sku', SKUs.LIFETIME_PLUS);
    
    // 3. Downgrade to Free immediately
    await unlockFeatures('free');
    
    // 4. Send downgrade offer (v2.2)
    await sendDowngradeOffer(userId);
    
  } catch (error) {
    console.error('Refund failed:', error);
    throw error;
  }
}

async function sendDowngradeOffer(userId: string) {
  // Send email with offer
  await sendEmail({
    to: user.email,
    subject: 'We\'re sorry to see you go',
    body: `
      Hi there,
      
      We're sorry Lifetime Plus didn't work out. As a thank you for being 
      an early supporter, we'd like to offer you Annual Plus at the Founder 
      rate ($149/year, renews for life).
      
      This is a one-time offer. Click below to accept:
      [Accept Offer]
      
      If you prefer, you can continue using the Free plan.
      
      Thanks for trying TransFitness!
      The TransFitness Team
    `
  });
  
  // Also show in-app notification
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'downgrade_offer',
    title: 'Special Offer: Annual Plus at Founder Rate',
    body: 'We\'d like to offer you Annual Plus at $149/year (renews for life). [Accept Offer]',
    data: { offer_sku: 'founder_plus_annual_refund' }
  });
}

async function acceptDowngradeOffer(userId: string) {
  try {
    // 1. Create special SKU for refund downgrade
    const sku = 'founder_plus_annual_refund'; // $149/year, renews for life
    
    // 2. Purchase Annual Plus at founder rate
    await purchaseProduct(sku);
    
    // 3. Mark offer as accepted
    await supabase
      .from('notifications')
      .update({ accepted: true })
      .eq('user_id', userId)
      .eq('type', 'downgrade_offer');
    
    // 4. Show success message
    showSuccessToast('Offer accepted! You now have Annual Plus at $149/year for life.');
    
  } catch (error) {
    console.error('Failed to accept offer:', error);
    showErrorToast('Failed to accept offer. Please contact support.');
  }
}
```

**Effort**: 4 hours

---

## Week 7 Deliverables

### Screens Built
1. **Paywall.tsx** - Core vs Plus tier comparison
2. **SubscriptionSettings.tsx** - Manage subscription, cancel, billing history
3. **BillingHistory.tsx** - View past payments

### Components Built
1. **TierCard.tsx** - Individual tier card (Free, Core, Plus)
2. **FounderOffersBanner.tsx** - Founder offers with inventory display
3. **FounderOfferCard.tsx** - Individual founder offer card
4. **TrialBadge.tsx** - "7-Day Free Trial" badge
5. **SocialProofBanner.tsx** - "Join X trans people..." (v2.2)

### Services Built
1. **iap/ios.ts** - iOS in-app purchases (StoreKit)
2. **iap/android.ts** - Android in-app purchases (Google Play Billing)
3. **trial.ts** - Trial management (start, cancel, convert)
4. **subscription.ts** - Subscription management (cancel, change plan)
5. **purchaseHandler.ts** - Purchase flow orchestration
6. **inventoryManager.ts** - Founder offer inventory tracking
7. **refund.ts** - Refund processing and downgrade offers (v2.2)

### Supabase Edge Functions
1. **validate-receipt** - Receipt validation (iOS + Android)
2. **reserve-inventory** - Inventory reservation (prevents race conditions)
3. **process-refund** - Refund processing

### Database Tables
1. **purchases** - Transaction history
2. **trials** - Trial tracking
3. **subscriptions** - Active subscriptions
4. **founder_offers** - Inventory tracking
5. **inventory_reservations** - Prevent race conditions
6. **notifications** - In-app notifications (downgrade offers, etc.)

---

## Testing Checklist

### Purchase Flows
- [ ] Core monthly purchase completes successfully (iOS)
- [ ] Core annual purchase completes successfully (iOS)
- [ ] Plus monthly purchase completes successfully (iOS)
- [ ] Plus annual purchase completes successfully (iOS)
- [ ] Core monthly purchase completes successfully (Android)
- [ ] Core annual purchase completes successfully (Android)
- [ ] Plus monthly purchase completes successfully (Android)
- [ ] Plus annual purchase completes successfully (Android)

### Founder Offers
- [ ] Founder Core Annual purchase completes successfully
- [ ] Founder Plus Annual purchase completes successfully
- [ ] Lifetime Plus purchase completes successfully
- [ ] Inventory decrements correctly after purchase
- [ ] "Only X remaining" shows when inventory <100
- [ ] Founder offers disappear when inventory hits zero
- [ ] Inventory race UX shows fallback toast (v2.2)

### Trial
- [ ] Plus trial starts successfully
- [ ] Trial unlocks all Plus features immediately
- [ ] Trial reminder sent on Day 5
- [ ] Trial converts to paid subscription on Day 7
- [ ] Trial can be canceled anytime
- [ ] Canceled trial downgrades at end of 7 days

### Subscription Management
- [ ] User can view current subscription status
- [ ] User can cancel subscription (takes effect at end of period)
- [ ] User can change plan (upgrade/downgrade)
- [ ] User can view billing history
- [ ] User can restore purchases (iOS)

### Edge Cases
- [ ] Payment declined handled gracefully
- [ ] Network error during purchase handled gracefully
- [ ] Duplicate purchase prevented
- [ ] Receipt validation fails handled gracefully
- [ ] Inventory race condition handled gracefully (v2.2)
- [ ] Lifetime Plus refund offer sent correctly (v2.2)

---

## App Store / Play Store Configuration

### iOS (App Store Connect)

**Subscription Groups**:
1. **TransFitness Core**
   - Core Monthly: $14.99/month
   - Core Annual: $119/year

2. **TransFitness Plus**
   - Plus Monthly: $24.99/month (with 7-day free trial)
   - Plus Annual: $199/year (with 7-day free trial)

**Non-Renewing Subscriptions**:
- Founder Core Annual: $79/year
- Founder Plus Annual: $149/year

**Non-Consumable**:
- Lifetime Plus: $299 (one-time)

**App Store Review Notes**:
- "TransFitness is a fitness app for trans and gender-diverse people. Plus features include importing custom routines and advanced progression."
- "Test account: test@transfitness.com / password123"
- "To test Plus trial: Tap 'Import Routine' → Start 7-Day Trial"

---

### Android (Google Play Console)

**Subscription Products**:
1. **core_monthly**: $14.99/month
2. **core_annual**: $119/year
3. **plus_monthly**: $24.99/month (with 7-day free trial)
4. **plus_annual**: $199/year (with 7-day free trial)

**One-Time Products**:
1. **founder_core_annual**: $79 (non-renewing, 1-year duration)
2. **founder_plus_annual**: $149 (non-renewing, 1-year duration)
3. **lifetime_plus**: $299 (permanent)

**Play Store Review Notes**:
- "TransFitness is a fitness app for trans and gender-diverse people. Plus features include importing custom routines and advanced progression."
- "Test account: test@transfitness.com / password123"
- "To test Plus trial: Tap 'Import Routine' → Start 7-Day Trial"

---

## Revenue Projections (Week 7 Complete)

### Break-Even Analysis

**With Founder Offers**:
- 100 Lifetime Plus ($299) = $29,900
- 300 Founder Plus Annual ($149) = $44,700
- 300 Founder Core Annual ($79) = $23,700
- **Total founder revenue**: $98,300

**This funds**:
- MVP development (Weeks 1-12): ~$0 (your time)
- Operating costs (Year 1): $11.58/month × 12 = $139
- Marketing budget: $98,161 remaining
- **You're profitable from Day 1**

### Recurring Revenue (Post-Founder)

**Monthly**:
- 50 Core users × $14.99 = $749.50
- 20 Plus users × $24.99 = $499.80
- **Total MRR**: $1,249.30

**Annual**:
- 50 Core users × $119 = $5,950
- 20 Plus users × $199 = $3,980
- **Total ARR**: $9,930

**Break-even (recurring)**: 6 paid users (any tier)

---

## Security Considerations

### Receipt Validation
- **Always validate receipts server-side** (never trust client)
- Use Apple/Google official APIs
- Store validation results in database
- Handle expired/revoked receipts

### Inventory Management
- **Use optimistic locking** to prevent race conditions
- Reserve inventory before purchase
- Release reservation if purchase fails
- Set TTL on reservations (5 minutes)

### Fraud Prevention
- **Limit trial to one per user** (check email, device ID)
- **Validate purchase receipts** before unlocking features
- **Monitor for suspicious patterns** (rapid purchases, refunds)

---

## Bottom Line

**Week 7 delivers a complete monetization system** with:

✅ Paywall with Free, Core, and Plus tiers  
✅ Founder offers with inventory tracking  
✅ Inventory race UX (graceful fallback) (v2.2)  
✅ iOS in-app purchases (StoreKit)  
✅ Android in-app purchases (Google Play Billing)  
✅ Plus trial (7-day free trial)  
✅ Subscription management (cancel, change plan, billing history)  
✅ Lifetime Plus refund offer (v2.2)  
✅ Receipt validation (server-side)  
✅ Security (optimistic locking, fraud prevention)  

**Total effort**: 40-45 hours (1 week)

**Revenue potential**: $98K from founder offers + $1.2K MRR recurring

**You're ready to monetize from Day 1.** 🚀💰🏳️‍⚧️
