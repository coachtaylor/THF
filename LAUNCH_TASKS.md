# TransFitness Launch Readiness - Master Task List

> **IMPORTANT**: This file is the source of truth for launch tasks.
> When starting a new chat session, tell Claude: "Read LAUNCH_TASKS.md and continue from where we left off"
> Last Updated: 2024-12-20

---

## Quick Status Summary

| Category | Total | Done | Remaining |
|----------|-------|------|-----------|
| Critical Blockers | 5 | 4 | 1 |
| High Priority | 5 | 5 | 0 |
| Medium Priority | 5 | 0 | 5 |
| App Store Requirements | 12 | 3 | 9 |
| Testing Checklist | 19 | 2 | 17 |

**Current Phase**: Google OAuth complete, need RevenueCat verification + Deep Link Testing

---

## PHASE 1: CRITICAL BLOCKERS

### 1.1 Security: Remove Exposed API Keys
- [x] **COMPLETED** - Removed from `.env` on 2024-12-18
- Removed: `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RAPIDAPI_KEY`
- Added placeholders for Google OAuth and RevenueCat keys

### 1.2 Google OAuth Credentials
- [x] **COMPLETED** - Fixed on 2024-12-19
- **Implementation**:
  - Installed `@react-native-google-signin/google-signin` for native iOS sign-in
  - Configured `app.config.js` with iosUrlScheme and iosClientId
  - Rewrote `src/services/auth/googleAuth.ts` to use native SDK + `signInWithIdToken`
  - Enabled "Skip nonce check" in Supabase Google provider
  - iOS popup now shows "Google" instead of "supabase.co"
- **Credentials configured**:
  - [x] Web Client ID (for Supabase server verification)
  - [x] iOS Client ID
  - [x] Android Client ID
- **Testing**:
  - [x] Google Sign-In on iOS - Working
  - [ ] Google Sign-In on Android - Needs testing

### 1.3 RevenueCat Verification
- [ ] **NEEDS TESTING**
- **Status**: Code has test API keys, needs production keys and testing
- **Files**: `src/services/payments/revenueCat.ts`
- **Steps**:
  1. [ ] Verify RevenueCat dashboard has products configured
  2. [ ] Add production API keys to `.env`:
     ```
     REVENUECAT_API_KEY_IOS=xxx
     REVENUECAT_API_KEY_ANDROID=xxx
     ```
  3. [ ] Test purchase flow in sandbox (iOS)
  4. [ ] Test purchase flow in sandbox (Android)
  5. [ ] Test restore purchases
  6. [ ] Verify entitlements unlock premium features

### 1.4 Deep Link Testing
- [ ] **NEEDS TESTING**
- **Status**: Code implemented, needs device testing
- **Steps**:
  1. [ ] Update Supabase email templates with `transfitness://` URLs
  2. [ ] Test email verification link on iOS device
  3. [ ] Test email verification link on Android device
  4. [ ] Test password reset link on iOS device
  5. [ ] Test password reset link on Android device

### 1.5 Production Console Logging
- [x] **COMPLETED** - Fixed on 2024-12-18
- Files fixed:
  - [x] `src/utils/supabase.ts` - Wrapped in `__DEV__`
  - [x] `App.tsx` - Wrapped in `__DEV__`
  - [x] `src/services/payments/revenueCat.ts` - Wrapped in `__DEV__`

---

## PHASE 2: HIGH PRIORITY CODE FIXES

### 2.1 WorkoutContext Error Notifications
- [x] **COMPLETED** - Fixed on 2024-12-18
- **File**: `src/contexts/WorkoutContext.tsx`
- **Change**: Added `notifyError()` call when session backup fails

### 2.2 SessionPlayer Input Validation
- [x] **COMPLETED** - Fixed on 2024-12-18
- **File**: `src/screens/SessionPlayer.tsx`
- **Change**: Added validation for reps >= 1, weight >= 0, RPE 1-10

### 2.3 SessionPlayer Video Loading Bug
- [x] **COMPLETED** - Fixed on 2024-12-18
- **File**: `src/screens/SessionPlayer.tsx:306-307`
- **Change**: Added explicit parentheses for operator precedence

### 2.4 Stats Volume Calculation
- [x] **COMPLETED** - Fixed on 2024-12-18
- **Files**:
  - `src/services/storage/stats.ts` - Uses `set.weight ?? 10` now
  - `src/services/sessionLogger.ts` - Added `weight` field to session data

### 2.5 Incomplete Exercise Data
- [ ] **LOW PRIORITY** - Can launch without
- **File**: `src/data/exercises.ts`
- **Missing**: `neutral_cues`, `breathing_cues`, `swaps` arrays are empty
- **Impact**: Exercise swap feature limited, no coaching cues shown

---

## PHASE 3: MEDIUM PRIORITY (Post-Launch)

### 3.1 Error Tracking Service
- [ ] Add Sentry or Bugsnag for production error monitoring

### 3.2 Offline Support
- [ ] Add offline detection and user messaging
- [ ] Queue failed operations for retry when online

### 3.3 Type Safety Improvements
- [ ] Replace `any` types with proper interfaces
- [ ] Fix navigation typing in MainNavigator.tsx

### 3.4 Session Corruption Recovery
- [ ] Add backup mechanism for saved sessions
- [ ] Add recovery UI for corrupted sessions

### 3.5 Configurable Session Timeout
- [ ] Make 24-hour timeout configurable
- [ ] Add user notification before session expires

---

## PHASE 4: APP STORE REQUIREMENTS

### iOS App Store
- [x] App icon (1024x1024) exists at `assets/icon.png` - Verified 2024-12-20 (1024x1024 8-bit RGBA PNG)
- [x] PrivacyInfo.xcprivacy configured - 2024-12-20 (Email, Fitness, Health, UserID data types declared)
- [ ] Screenshots for iPhone 6.7" (1290x2796) - iPhone 15 Pro Max
- [ ] Screenshots for iPhone 6.5" (1284x2778) - iPhone 14 Plus
- [ ] Screenshots for iPhone 5.5" (1242x2208) - iPhone 8 Plus (if supporting older devices)
- [x] Privacy Policy URL hosted and accessible - at landing/src/app/privacy/page.tsx
- [ ] App Privacy nutrition labels in App Store Connect (must match PrivacyInfo.xcprivacy)
- [ ] Build tested on TestFlight with 3+ testers

### Google Play Store
- [ ] Feature graphic (1024x500)
- [ ] Screenshots for phones (1080x1920 min)
- [ ] Screenshots for tablets (if supporting)
- [ ] Privacy Policy URL
- [ ] Data safety form completed
- [ ] App signing configured with upload key
- [ ] Build tested on internal testing track

---

## PHASE 5: END-TO-END TESTING

### Authentication Flow
- [x] Email signup flow (confirmed working)
- [ ] Email verification deep link
- [ ] Login with email/password
- [x] Google Sign-In (iOS) - Working as of 2024-12-19
- [ ] Google Sign-In (Android)
- [ ] Password reset email sends
- [ ] Password reset deep link works
- [ ] Logout clears all data and returns to welcome

### Onboarding Flow
- [ ] Complete onboarding start to finish
- [ ] Gender identity saves correctly
- [ ] HRT status saves correctly
- [ ] Goals save correctly
- [ ] Experience level saves correctly
- [ ] Workout days save correctly
- [ ] Plan generates successfully
- [ ] Profile persists after app restart

### Workout Flow
- [ ] Start a workout from home screen
- [ ] Exercise video loads (if available)
- [ ] Complete sets with reps/weight/RPE logging
- [ ] Rest timer counts down correctly
- [ ] Skip rest timer works
- [ ] Session persists when app is backgrounded
- [ ] Resume interrupted session works
- [ ] Complete workout shows summary
- [ ] Workout data appears in history/stats

### Payments (if enabled)
- [ ] Paywall displays on premium features
- [ ] Purchase flow completes in sandbox
- [ ] Entitlements applied immediately after purchase
- [ ] Restore purchases restores entitlements
- [ ] Free tier limits enforced

---

## ENVIRONMENT VARIABLES STATUS

```env
# ✅ CONFIGURED
SUPABASE_URL=https://xqcwywoqumblogoyzkhf.supabase.co
SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_SUPABASE_URL=https://xqcwywoqumblogoyzkhf.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# ✅ CONFIGURED - Google OAuth (2024-12-19)
GOOGLE_WEB_CLIENT_ID=590532149610-4o8ummmenngdprtbm71pr13bsakev3ps.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=590532149610-c7k0i9bp5b2uom336v5ishq7to834nbe.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=590532149610-sa5o2oitntrl40rsk8q986c9nkc7jbnf.apps.googleusercontent.com

# ❓ NEEDS CONFIGURATION - RevenueCat
REVENUECAT_API_KEY_IOS=
REVENUECAT_API_KEY_ANDROID=

# ✅ REMOVED (Security)
# OPENAI_API_KEY - removed
# SUPABASE_SERVICE_ROLE_KEY - removed
# RAPIDAPI_KEY - removed
```

---

## FILES MODIFIED IN THIS SESSION

| File | Status | Changes Made |
|------|--------|--------------|
| `.env` | ✅ Fixed | Removed sensitive keys, added OAuth placeholders |
| `src/services/payments/revenueCat.ts` | ✅ Fixed | All logs wrapped in `__DEV__` |
| `src/utils/supabase.ts` | ✅ Fixed | All logs wrapped in `__DEV__` |
| `App.tsx` | ✅ Fixed | All logs wrapped in `__DEV__` |
| `src/contexts/WorkoutContext.tsx` | ✅ Fixed | Added error notification on save failure |
| `src/screens/SessionPlayer.tsx` | ✅ Fixed | Input validation, video loading fix |
| `src/services/storage/stats.ts` | ✅ Fixed | Volume uses actual weight |
| `src/services/sessionLogger.ts` | ✅ Fixed | Added weight field to session data |

---

## NEXT STEPS (In Order)

1. ~~**YOU**: Set up Google OAuth credentials~~ ✅ DONE
2. ~~**CLAUDE**: Test Google Sign-In integration~~ ✅ DONE (iOS working)
3. **YOU**: Verify RevenueCat products in dashboard
4. **YOU**: Add RevenueCat API keys to `.env`
5. **CLAUDE**: Help test purchase flow
6. **YOU**: Update Supabase email templates with deep link URLs (`transfitness://`)
7. **BOTH**: Test deep links on physical devices
8. **YOU**: Create App Store/Play Store assets
9. **YOU**: Submit for review

---

## HOW TO CONTINUE IN A NEW SESSION

Copy and paste this to Claude:

```
Read LAUNCH_TASKS.md and continue helping me with the TransFitness launch. Pick up from where we left off.
```

Or simply say: "Continue with TransFitness launch tasks"
