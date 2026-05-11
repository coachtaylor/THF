# TestFlight Release Runbook

How to ship a TestFlight beta build of TransFitness to founding athletes.
First time you run this, expect ~2 hours of one-time setup. Subsequent
builds are `eas build` + `eas submit` — usually 20-30 minutes wall time.

---

## Prerequisites

- Active Apple Developer Program membership ($99/yr). Verify at
  https://developer.apple.com/account
- Apple ID with two-factor authentication on
- EAS CLI installed and logged in: `npx eas-cli login`
- You're in the main repo working tree (not a worktree) — Metro
  considerations don't apply for builds, but keep things simple

---

## Phase 1 — One-time Apple setup

### 1.1 Register the bundle ID

1. Sign in to https://developer.apple.com/account
2. Certificates, Identifiers & Profiles → Identifiers → "+" to register
   a new App ID
3. Bundle ID: `com.transfitness.app` (must match `app.config.js`
   `ios.bundleIdentifier`)
4. Capabilities to enable:
   - Push Notifications (required by `aps-environment: production` in
     `app.config.js`)
   - Associated Domains (required by `applinks:transfitness.app`)
   - Sign In with Apple (only if you're enabling Apple Sign-In; not
     wired today, so skip)

### 1.2 Create the App Store Connect record

1. Sign in to https://appstoreconnect.apple.com
2. My Apps → "+" → New App
3. Fill in:
   - Platform: iOS
   - Name: "Trans Health & Fitness" (must be unique on the store; if
     taken try "Trans Health Fitness — Beta")
   - Primary Language: English (U.S.)
   - Bundle ID: select `com.transfitness.app` from the dropdown
   - SKU: any internal identifier you choose, e.g. `thf-ios-001`
   - User Access: Full
4. Once created, note the **Apple App ID** (a 10-digit numeric value
   shown in the URL: `https://appstoreconnect.apple.com/apps/{APPLE_APP_ID}`).
   You'll need this in Phase 2.

### 1.3 Find your Apple Team ID

1. https://developer.apple.com/account → Membership Details
2. Copy "Team ID" — a 10-character alphanumeric string.

### 1.4 Generate APNs auth key (push notifications)

1. https://developer.apple.com/account → Keys → "+"
2. Name: "TransFitness APNs"
3. Enable: Apple Push Notifications service (APNs)
4. Continue → Register → Download the `.p8` file (you can only
   download it ONCE; save it somewhere safe)
5. Note the Key ID (10 characters) shown on the registration page

You'll upload this to EAS when EAS prompts for it during the first
push-enabled build.

---

## Phase 2 — Configure local environment

### 2.1 Set EAS submit env vars

Create or edit `.env.local` (gitignored) at the repo root:

```sh
EAS_SUBMIT_IOS_APPLE_ID=your-apple-id@example.com
EAS_SUBMIT_IOS_ASC_APP_ID=1234567890       # the 10-digit Apple App ID from 1.2
EAS_SUBMIT_IOS_APPLE_TEAM_ID=ABCDE12345    # 10-character team ID from 1.3
```

EAS reads these when resolving `eas.json` placeholders at submit time.

> **Why env vars, not hard-coded?** The values are personal/team
> identifiers that don't belong in the public repo. EAS supports
> `$VAR` substitution in `eas.json` exactly for this.

### 2.2 Confirm bundle metadata

Open `app.config.js` and verify:

- `version` reflects the build (e.g. `"1.0.0"` for the first TestFlight
  drop)
- `ios.bundleIdentifier === "com.transfitness.app"` — matches what you
  registered in 1.1
- `ios.buildNumber` is `"1"` for the first build. EAS auto-increments
  from here on subsequent builds (because `eas.json` has
  `autoIncrement: true` on the `preview` profile).

---

## Phase 3 — Build for TestFlight

### 3.1 Trigger the build

From the repo root:

```sh
npx eas-cli build --profile preview --platform ios
```

What happens:

1. EAS uploads the source archive
2. First time only: prompts for iOS credentials
   - Recommended: "Let Expo handle the process for you" — EAS generates
     and stores a distribution certificate + provisioning profile for
     `com.transfitness.app` linked to your team
   - When prompted for APNs key, upload the `.p8` from 1.4 with the
     Key ID and Team ID
3. EAS runs `eas-build-pre-install` (copies file secrets — see
   `scripts/eas-prebuild-secrets.js`)
4. Build runs on macOS Sonoma + Xcode 15.4 (per `eas.json`)
5. Output: a `.ipa` artifact downloadable from
   https://expo.dev/accounts/{account}/projects/transfitness/builds

Typical build time: 15-25 minutes.

### 3.2 Verify the build before submit

Before pushing to TestFlight, sanity check:

- Build status is "Finished" (not "Failed" or "Errored")
- Click into the build page in the EAS dashboard, verify version and
  buildNumber match expectations

---

## Phase 4 — Submit to TestFlight

### 4.1 Submit

```sh
npx eas-cli submit --profile preview --platform ios --latest
```

`--latest` picks the most recent finished build for the profile.
Alternative: pass `--id <build-id>` to submit a specific build.

EAS uses the env vars from 2.1 to:

1. Authenticate to App Store Connect with `appleId`
2. Upload the `.ipa` to App Store Connect via `ascAppId`
3. Associate with your team via `appleTeamId`

If 2FA is enabled (it must be), EAS will prompt for a one-time code or
trigger an Apple device approval.

### 4.2 Process in App Store Connect

After submit succeeds:

1. The build appears in App Store Connect → My Apps → TransFitness →
   TestFlight tab within 10-30 minutes
2. While processing, status shows "Processing"
3. Once processed, status becomes "Ready to Submit" — you can now
   distribute to testers

### 4.3 Compliance questions

First time only, App Store Connect asks:

- **Export Compliance**: Does your app use encryption?
  - Your app uses HTTPS for Supabase and Sentry — this counts. Answer
    "Yes" then "Does your app use any encryption beyond what's exempt?"
    → "No" (standard HTTPS is exempt under Annotation 1 to Category 5,
    Part 2).
- **Content Rights**: Do you have rights to all content? → Yes
- **Advertising Identifier (IDFA)**: Does your app use it? → No (you
  don't use IDFA)

These answers persist for future builds on the same major version.

### 4.4 Add testers

1. App Store Connect → TransFitness → TestFlight tab
2. **Internal Testers** (up to 100; no Beta App Review needed)
   - Internal Testing group → "+" → add by Apple ID email
   - These are users in your App Store Connect team. Best for
     friends/dev partners.
3. **External Testers** (up to 10,000; requires Beta App Review)
   - External Testing → create a group ("Founding Athletes")
   - Add testers by email (they don't need to be on your team)
   - Submit the build for Beta App Review (~24-hour first review,
     faster subsequent)
   - Once approved, testers get an invite email and install via the
     TestFlight app

### 4.5 What testers see

Testers get an email:

> "You've been invited to test Trans Health & Fitness on TestFlight."

They:

1. Tap the link → opens TestFlight app on iOS
2. Tap "Install" → app downloads
3. Open the app → it's just like the App Store version, but with a
   TestFlight badge

---

## Common gotchas

### "Bundle ID not found" during EAS build

The bundle ID isn't registered or doesn't have the capabilities your
app declares. Re-check 1.1 — make sure Push Notifications and
Associated Domains are enabled on the App ID.

### "Provisioning profile doesn't include the aps-environment entitlement"

APNs key wasn't uploaded, or the App ID doesn't have Push Notifications
enabled. Re-run 1.4 and during the next `eas build`, let EAS re-fetch
credentials when it prompts.

### "ITMS-90000: Missing Info.plist value (NSUserTrackingUsageDescription)"

Apple wants this string if you use any tracking. The current analytics
implementation uses an anonymized per-install ID (no IDFA), which
typically doesn't require ATT. If Apple flags this at review, add to
`app.config.js` `ios.infoPlist`:

```js
NSUserTrackingUsageDescription: "We don't track you across apps. This
permission is only here because Apple requires the disclosure string."
```

(But try without first — most non-IDFA analytics setups don't trigger
this.)

### "Build succeeded but submit fails with 401 / Two-factor required"

Your `EAS_SUBMIT_IOS_APPLE_ID` account either doesn't have 2FA on, or
the 2FA flow timed out. Run `npx eas-cli submit` interactively and
approve the prompt on your Apple device.

### "App rejected — missing privacy policy URL"

App Store Connect → App Information → Privacy Policy URL must point
to a live page. Use https://transfitness.app/privacy (already exists
in the landing site).

### "App rejected — health claims need clinical sourcing"

If reviewers flag Guideline 4.5.4 / 5.1.1 (health claims), strengthen
the Disclaimer screen language and consider adding a "this is not
medical advice" footer to the home screen.

---

## Build cadence going forward

- Each new TestFlight drop: `eas build --profile preview --platform ios`
  then `eas submit --profile preview --platform ios --latest`
- EAS auto-increments `buildNumber` per the `eas.json` `autoIncrement`
  setting
- Bump `version` in `app.config.js` for major releases (e.g. `1.0.0` →
  `1.1.0` when you ship a meaningful feature set)
- External testers are auto-promoted to new builds within their group;
  you don't need to re-invite

---

## When you're ready for the public App Store

This runbook covers TestFlight only. Public release additionally
requires:

- App Store metadata (description, keywords, screenshots in all
  required device sizes, optional preview video)
- Privacy nutrition labels (declare every category of data collected)
- Age rating questionnaire
- Demo account credentials for App Review
- Submit via `eas submit --profile production --platform ios`
- Apple App Review (1-3 days typical; 2 round trips realistic for
  health/fitness apps)

That's a separate sprint. Don't start it until you have signal from
the TestFlight cohort that the product loop is working.
