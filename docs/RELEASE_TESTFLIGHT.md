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

### 2.1 Submit credentials in `eas.json`

The submit profile in `eas.json` carries three Apple identifiers:

```json
"submit": {
  "preview": {
    "ios": {
      "appleId": "taylorpa04@gmail.com",
      "ascAppId": "6756504481",
      "appleTeamId": "SDNX536873"
    }
  }
}
```

**These are hardcoded, not env vars — intentionally.**

> **Why?** Two reasons:
>
> 1. **EAS CLI 18.11.0 doesn't substitute `$VAR` in submit fields.** Earlier
>    versions of this runbook documented `$EAS_SUBMIT_IOS_APPLE_ID` style
>    placeholders. Don't use that — they pass through to App Store Connect
>    literally and the submit fails authentication. This may change in a
>    future CLI release; for now, hardcode.
> 2. **None of these are secrets.** The Apple ID email is on the App Store
>    listing once you ship. The ASC App ID is in the appstoreconnect.com
>    URL. The Team ID is visible in any signed binary anyone can download.
>    The actual auth secret (the App Store Connect API key) is managed by
>    EAS on its servers — see 4.2 below.

### 2.2 Confirm bundle metadata

Open `app.config.js` and verify:

- `version` reflects the build (e.g. `"1.0.0"` for the first TestFlight
  drop)
- `ios.bundleIdentifier === "com.transfitness.app"` — matches what you
  registered in 1.1
- `ios.buildNumber` is `"1"` for the first build. EAS auto-increments
  from here on subsequent builds (because `eas.json` has
  `autoIncrement: true` on the `preview` profile).

### 2.3 The `eas-build-pre-install` hook

`package.json` defines an `eas-build-pre-install` script that runs on
the EAS build VM **before** `pod install` and Xcode compilation. It
does two jobs in order:

1. **iOS-only: download the Metal Toolchain.** Xcode 26+ unbundled the
   Metal compiler into a separately-downloadable component. EAS's
   `macos-sequoia-15.6-xcode-26.0` image ships Xcode itself but not
   the toolchain. Without this step, the build fails compiling
   `react-native-svg`'s `.metal` shader files (Core Image SVG filters)
   with `cannot execute tool 'metal' due to missing Metal Toolchain`.
2. **All platforms: copy EAS file secrets into place.** Some files
   referenced by the bundler are gitignored because they're proprietary
   IP. `scripts/eas-prebuild-secrets.js` copies them from the EAS file
   secret location to the path the bundler expects.

The full hook line in `package.json`:

```json
"eas-build-pre-install": "if [ \"$EAS_BUILD_PLATFORM\" = \"ios\" ]; then sudo xcodebuild -downloadComponent MetalToolchain -quiet; fi && node scripts/eas-prebuild-secrets.js"
```

**Don't remove the Metal Toolchain step** unless you've moved to an
EAS image that includes it (verify before removing — Apple keeps
shrinking the default Xcode bundle, so this need will persist for the
foreseeable future). Downloading the toolchain adds ~2-5 min to build
time, one-time per build VM.

### 2.4 Register EAS file secrets

Some files referenced by the bundler are gitignored because they're
proprietary IP. `scripts/eas-prebuild-secrets.js` (wired into
`eas-build-pre-install`) copies them into place at build time, but
only if EAS knows where the secret content lives.

Register the secrets ONCE per project. The script self-documents the
list to keep in sync; today it's:

```sh
eas secret:create --scope project --type file \
  --name RECOVERY_PHASES_TS \
  --value ./src/data/recoveryPhases.ts
```

If you skip this, builds fail at bundle time with `Unable to resolve
"./recoveryPhases"` (or similar) because the file the import points
to doesn't exist on EAS's filesystem.

To audit what's registered:

```sh
eas secret:list
```

To rotate the value (e.g. after editing the local file):

```sh
eas secret:delete --name RECOVERY_PHASES_TS
eas secret:create --scope project --type file \
  --name RECOVERY_PHASES_TS \
  --value ./src/data/recoveryPhases.ts
```

> **When to add new secrets here:** any time `scripts/eas-prebuild-secrets.js`'s
> `secrets` array grows. The script no-ops cleanly when the env var
> isn't set, so local dev is unaffected even before you register —
> only EAS builds break.

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
3. EAS runs `eas-build-pre-install` (downloads Metal Toolchain on iOS,
   copies file secrets — see 2.3)
4. Build runs on macOS Sequoia + Xcode 26.0 (per `eas.json`). Apple's
   minimum SDK floor moves every few months; if a future submit gets
   rejected with ITMS-90725 ("must be built with iOS X SDK or later"),
   bump the image string in all three `eas.json` profiles to the
   current `sdk-*` image from
   https://docs.expo.dev/build-reference/infrastructure/
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

EAS uses the hardcoded credentials from 2.1 plus an App Store Connect
API key it manages to:

1. Authenticate to App Store Connect (via the cached API key, see 4.2)
2. Upload the `.ipa` to App Store Connect via `ascAppId`
3. Associate with your team via `appleTeamId`

### 4.2 EAS-managed App Store Connect API key

On your **first** `eas submit`, EAS auto-creates an App Store Connect
API key (visible at App Store Connect → Users and Access → Integrations
→ Keys, named like `[Expo] EAS Submit <random>`). EAS stores the key
on its servers.

Implications:

- **Future submits skip the 2FA prompt.** No Apple ID password, no
  one-time code, no device approval. Just runs.
- **Don't delete that key in App Store Connect** unless you also remove
  the matching credential on EAS, otherwise future submits fail with
  401 / "Invalid credentials." If that happens, run `eas credentials`
  → iOS → Manage submission credentials → Remove, then re-submit (EAS
  will create a new key on the next run).
- The key has admin-tier access to your App Store Connect account.
  This is normal for submission tooling. It's stored on EAS, not in
  your repo.

### 4.3 Process in App Store Connect

After submit succeeds:

1. The build appears in App Store Connect → My Apps → TransFitness →
   TestFlight tab within 10-30 minutes
2. While processing, status shows "Processing"
3. Once processed, status becomes "Ready to Submit" — you can now
   distribute to testers

### 4.4 Compliance questions

`app.config.js` sets `ITSAppUsesNonExemptEncryption: false` in
`ios.infoPlist`, which **bypasses the export compliance dialog** for
all future builds. The first build before this flag was added did go
through the dialog manually; here's what was answered, for reference:

- **App Encryption Documentation: type of encryption?**
  → "Standard encryption algorithms instead of, or in addition to,
     using or accessing the encryption within Apple's operating system"
  → Rationale: TransFitness uses HTTPS (TLS), SQLCipher (AES-256),
    `@noble/ciphers` (AES-GCM), and iOS Keychain via `expo-secure-store`.
    All are standard, internationally-recognized algorithms — no custom
    or proprietary crypto.

- **App available for distribution in France?** → **No** for beta.
  France requires an annual self-classification report filed with the
  French government (ANSSI), even for standard algorithms. Not worth
  the paperwork for a US-focused beta. Re-evaluate before public launch.

- **Content Rights**: Do you have rights to all content? → Yes
- **Advertising Identifier (IDFA)**: Does your app use it? → No (you
  don't use IDFA)

If you ever need to revisit the encryption answer — e.g., adding a
crypto library that's not on the standard-algorithms list — delete the
`ITSAppUsesNonExemptEncryption` line from `app.config.js` and Apple
will resume asking on every upload.

### 4.5 Add testers

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

### 4.6 What testers see

Testers get an email:

> "You've been invited to test Trans Health & Fitness on TestFlight."

They:

1. Tap the link → opens TestFlight app on iOS
2. Tap "Install" → app downloads
3. Open the app → it's just like the App Store version, but with a
   TestFlight badge

---

## Common gotchas

### Build fails with `Unable to resolve "./recoveryPhases"` or similar gitignored module

You haven't registered the EAS file secret. See 2.3 — run
`eas secret:create --scope project --type file --name RECOVERY_PHASES_TS --value ./src/data/recoveryPhases.ts`
(or whichever secret `scripts/eas-prebuild-secrets.js` is waiting on).

### Build fails with `pod ... not found` or pod install errors

`ios/Podfile.lock` in `git HEAD` doesn't match `package.json`. Someone
changed JS deps without re-running `pod install` + committing the
resulting iOS files. Recovery:

```sh
cd ios && pod install && cd ..
git add ios/Podfile.lock ios/TransFitness.xcodeproj/project.pbxproj \
        ios/TransFitness/PrivacyInfo.xcprivacy
git commit -m "Sync iOS pods with current JS deps"
git push origin develop
```

Then retry the build.

### Build fails with `Unsupported macOS image` or Xcode version mismatch

EAS deprecates older macOS/Xcode images on a rolling schedule. Update
all three profiles in `eas.json`'s `build` section. As of this writing
the working image is `macos-sequoia-15.6-xcode-26.0` (required by
Apple's iOS 26 SDK floor as of late 2026). Check
https://docs.expo.dev/build-reference/infrastructure/ for the current
supported list. Always pick the image labeled with your current Expo
SDK version (e.g. `sdk-54`).

### Build fails with `cannot execute tool 'metal' due to missing Metal Toolchain`

Xcode 26+ unbundled the Metal compiler from the default Xcode install.
The fix is wired into `eas-build-pre-install` (see 2.3) — verify
`package.json`'s script still contains the
`sudo xcodebuild -downloadComponent MetalToolchain -quiet` step. If
someone removed it thinking it was dead config, restore it. Without
this, any package that ships `.metal` shaders (today:
`react-native-svg`) fails the Xcode compile step.

### Apple rejects submitted build with ITMS-90725

Apple message: "App was built with iOS X.X SDK. Must be built with
iOS Y SDK or later (Xcode Z+)." Apple bumps the minimum SDK every few
months. Fix: update all three `eas.json` image strings to the current
`sdk-*` image from
https://docs.expo.dev/build-reference/infrastructure/, then rebuild and
resubmit. The previous build is dead — no way to make it accepted; you
must produce a new IPA on the newer toolchain.

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

### "Build succeeded but submit fails with 401 / Invalid credentials"

EAS's cached ASC API key (see 4.2) was revoked or deleted in App Store
Connect → Users and Access → Integrations → Keys. Run
`eas credentials` → iOS → Manage submission credentials → Remove, then
re-run `eas submit`. EAS will auto-create a new key on the next run.

### Submit field placeholders pass through literally (`$EAS_SUBMIT_IOS_APPLE_ID`)

EAS CLI 18.11.0 does NOT substitute `$VAR` placeholders in `eas.json`
submit fields (only in `build.env` fields). If your submit fails with
"Invalid Apple ID format" or auth errors and the dashboard shows the
literal `$VAR` string, your `eas.json` is using env vars where it
should be using hardcoded values. See 2.1.

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
