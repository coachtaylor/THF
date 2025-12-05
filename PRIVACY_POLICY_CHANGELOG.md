# Privacy Policy Changes - Detailed Changelog

This document outlines all changes made to align the privacy policy with actual app implementation.

---

## SUMMARY OF CHANGES

| Change Type | Count |
|-------------|-------|
| Removed/Modified | 8 |
| Added | 6 |
| Clarified | 4 |

---

## 🔴 REMOVED OR MODIFIED

### 1. Country/Region/Timezone Collection
**Original text (Section 2.1):**
> Country or region and time zone

**Change:** REMOVED entirely

**Reason:** App does not collect country, region, or timezone data. No fields exist in the Profile type or onboarding screens for this information.

---

### 2. Social Sign-In (Apple/Google)
**Original text (Section 2.3):**
> Authentication providers (for example Apple or Google if you sign in with them), such as your name, email address, and profile picture so we can create or update your account.

**Change:** REMOVED entirely

**Reason:** Only email/password authentication is implemented. No OAuth or social login exists in the codebase. `src/services/auth/auth.ts` only supports email/password via Supabase Auth.

---

### 3. Automatic Data Collection (Overstated)
**Original text (Section 2.2):**
> When you use the Services, we may automatically collect:
> - Usage data – screens viewed, buttons tapped, workout plans generated, workouts started and completed, session duration, crash logs, and error reports
> - Device information – device model, operating system version, app version, language, and unique device identifiers
> - Log data – IP address, approximate location based on IP, browser type, dates and times of access, and referral URLs

**New text:**
> (Section removed entirely from "Information We Collect")

**Reason:**
- No analytics SDK integrated (no Firebase Analytics, Mixpanel, Segment, Amplitude)
- No crash reporting (no Sentry, Crashlytics)
- No device telemetry or fingerprinting
- Only equipment request logging exists (user-initiated, not automatic)

---

### 4. Analytics Services
**Original text (Section 2.3):**
> Analytics or error-monitoring services, which help us understand how people use the Services and identify problems.

**Change:** REMOVED entirely

**Reason:** No third-party analytics services are integrated. The only analytics is internal equipment request logging to improve the exercise library.

---

### 5. Workout Feedback Types
**Original text (Section 2.1):**
> Feedback about workouts, for example "too easy", "too hard", "felt gender affirming", or "felt dysphoria triggering"

**Change:** REMOVED these specific feedback types

**Reason:** The session logger (`src/services/sessionLogger.ts`) collects:
- RPE (rate of perceived exertion)
- Pain flags
- Exercise swaps

But there is NO "felt gender affirming" or "felt dysphoria triggering" feedback mechanism in the current implementation.

---

### 6. Survey/Research Functionality
**Original text (Section 2.1):**
> Responses to optional surveys or research questions

**Change:** REMOVED

**Reason:** No survey functionality exists in the current codebase.

---

### 7. Payment Processing Status
**Original text (Section 2.1):**
> If you purchase a subscription or paid feature:
> Your payment is processed by a third-party provider (such as Stripe).

**New text:**
> If we offer paid features in the future, payments will be processed by a third-party provider...

**Reason:** `expo-in-app-purchases` is imported in `package.json` but completely unused. No payment processing is active. Changed to future tense.

---

### 8. Cookies Section Clarification
**Original text (Section 7):**
> On our website and, in some cases, within the app, we may use cookies...

**New text:**
> On our website, we may use cookies...
> The mobile app does not use cookies.

**Reason:** React Native mobile apps don't use cookies. Authentication is handled via secure token storage (`expo-secure-store`).

---

## 🟢 ADDED

### 1. NEW SECTION: Local-First Data Storage (Section 6)
**Added text:**
> Your data stays on your device by default. We designed the app with a local-first architecture, meaning:
> - Your profile, workout history, and session data are stored locally on your device
> - Cloud sync is optional—you control whether your data is backed up to our servers
> - If you enable cloud sync, your data is encrypted in transit and stored securely with our cloud provider (Supabase)
> - You can use the app without enabling cloud sync

**Reason:** This is a major privacy-positive feature that wasn't mentioned. The app uses SQLite for local storage with optional Supabase cloud sync controlled by `cloud_sync_enabled` flag. UI explicitly tells users "This information stays on your device."

**Code reference:** `src/services/storage/profile.ts` - `syncProfileToCloud()` function with `cloud_sync_enabled` check

---

### 2. Dysphoria Triggers Collection
**Added to Section 2.1 Profile Information:**
> Situations that may cause dysphoria (such as mirrors, crowded spaces, certain exercises), and any notes you choose to share about your comfort preferences

**Reason:** App collects detailed dysphoria triggers in `src/screens/onboarding/intake/DysphoriaTriggers.tsx`:
- Looking at chest, tight clothing, mirrors, body contact
- Crowded spaces, locker rooms, voice concerns
- Free-text `dysphoria_notes` field

This sensitive data collection was not disclosed in the original policy.

---

### 3. Workout Data Collection Details
**Added to Section 2.1:**
> Workout Data
> When you use the app, we collect:
> - Workouts generated for you and the parameters used to create them
> - Workouts you save as favorites, including any notes you add
> - Completed workout sessions, including exercises performed, sets, reps, and perceived effort (RPE)
> - Exercise modifications or swaps you make
> - Pain or discomfort flags you report during workouts

**Reason:** `src/services/sessionLogger.ts` and `src/services/storage/savedWorkouts.ts` collect this data. Important for transparency.

---

### 4. Safety Rules Audit Logging
**Added to Section 2.1:**
> Safety and Personalization Data
> To keep you safe and provide relevant workouts, we log which safety rules are applied when generating your workouts.

**Added to Section 3.2:**
> Log which safety rules are applied to your workouts to ensure our safety engine is working correctly

**Reason:** `src/services/rulesEngine/auditLogger.ts` and `src/services/workoutGeneration/databaseStorage.ts` log safety rule applications to Supabase. Users should know this data is collected.

---

### 5. Saved Workouts Cloud Sync
**Added to Section 3.1:**
> Save and sync your favorite workouts

**Reason:** `src/services/storage/savedWorkouts.ts` syncs saved workouts to Supabase with usage statistics (use count, last used date).

---

### 6. Equipment Request Analytics
**Added to Section 3.2:**
> Collect equipment requests (when you tell us about equipment we don't yet support) to improve our exercise library

**Reason:** `src/services/storage/profile.ts` contains `logEquipmentRequest()` which logs user equipment requests to Supabase's `equipment_requests` table.

---

## 🟡 CLARIFIED

### 1. Supabase as Primary Service Provider
**Original text (Section 6.1):**
> Cloud hosting and database providers (for example, managed PostgreSQL providers)

**New text:**
> Supabase – Cloud hosting, database, and authentication services

**Reason:** Be specific about the actual provider used. Supabase is the only cloud service integrated.

---

### 2. Secure Token Storage
**Added to Section 9 (Data Security):**
> Storing authentication tokens in your device's secure storage (hardware-backed where available)

**Reason:** `src/utils/supabase.ts` uses `expo-secure-store` via `SecureStoreAdapter` for token storage. This is a security-positive feature worth highlighting.

---

### 3. Row Level Security
**Added to Section 9:**
> Using authentication and access controls (Row Level Security) to protect data

**Reason:** Supabase RLS policies are configured for the database tables.

---

### 4. Binding Details
**Original text:**
> Whether you use a binder

**New text:**
> Whether you use a binder, how often, for how long, and what type

**Reason:** App collects detailed binding information:
- `binds_chest` (boolean)
- `binding_frequency` (daily, sometimes, rarely, never)
- `binding_duration_hours` (1-12 hours)
- `binder_type` (commercial, sports_bra, ace_bandage, diy, other)

---

## STRUCTURAL CHANGES

### Section Renumbering
Due to adding Section 6 (Local-First Data Storage), subsequent sections were renumbered:
- Old Section 6 (How We Share) → New Section 7
- Old Section 7 (Cookies) → New Section 8
- Old Section 8 (Data Security) → New Section 9
- Old Section 9 (Data Retention) → New Section 10
- Old Section 10 (Your Rights) → New Section 11
- Old Section 11 (Children's Privacy) → New Section 12
- Old Section 12 (International Transfers) → New Section 13
- Old Section 13 (Changes) → New Section 14
- Old Section 14 (Contact Us) → New Section 15

---

## ITEMS TO VERIFY BEFORE PUBLISHING

### 1. Account Deletion Flow
The policy mentions users can request deletion. Verify that:
- [ ] `deleteProfile()` in `src/services/storage/profile.ts` deletes local data
- [ ] Supabase data deletion is implemented (or add it)
- [ ] Auth account can be deleted via Supabase

### 2. Data Export
The policy mentions "right to data portability." Verify:
- [ ] Data export functionality exists, OR
- [ ] Add manual process documentation for how users can request exports

### 3. Email Addresses
Update placeholder emails:
- [ ] Replace `privacy@transhealthfitness.com` with actual contact email
- [ ] Ensure email is monitored

### 4. Domain
Update placeholder domain:
- [ ] Replace `transhealthfitness.com` with actual domain

### 5. Country of Operations
- [ ] Verify "United States" is correct for Section 13 (International Transfers)

---

## FILE CREATED

**New privacy policy page:** `landing/src/app/privacy/page.tsx`

This creates a route at `/privacy` on your Next.js landing site with the updated policy styled to match your site's design.

---

## RECOMMENDED FOLLOW-UP ACTIONS

1. **Legal Review:** Have a privacy attorney review the updated policy before publishing
2. **Implement Missing Features:**
   - Full account deletion (including Supabase data)
   - Data export functionality
3. **Update Contact Info:** Replace placeholder emails and domains
4. **Add Last Updated Date:** Set to actual publication date
5. **In-App Link:** Add a link to the privacy policy from within the mobile app settings
