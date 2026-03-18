# TransFitness — Pre-Launch Task Tracker

> **Purpose:** Single source of truth for what's been done, what's in progress, and what remains before launch.
> **Created:** 2026-03-18 | **Branch:** `develop` | **Owner:** Taylor Pangilinan
> **Business Plan Reference:** `TransFitness_Business_Plan (1).md`

---

## How to Read This Document

- **DONE** = Completed and verified
- **IN PROGRESS** = Actively being worked on
- **TODO** = Not yet started
- **DEFERRED** = Intentionally pushed to post-launch
- Each task includes **why** it matters and **what files** are involved

---

## Phase 0: Stabilize Existing Work (Week 0 — NOW)

> **Why this phase exists:** 30+ modified/new files sit uncommitted on `develop`. Losing this work would set the project back weeks. Nothing else matters until the codebase is committed and stable.

### 0.1 — Commit Uncommitted Changes
| Status | Task | Files | Why |
|--------|------|-------|-----|
| TODO | Review and commit security & encryption system | `src/utils/encryption.ts` (new), `src/utils/rateLimiter.ts` (new), `src/utils/errorMessages.ts` (new) | Core security infrastructure — XOR encryption for 14 sensitive health fields, rate limiting on auth ops, error sanitization |
| TODO | Review and commit auth service changes | `src/services/auth/auth.ts`, `src/services/auth/deepLinking.ts`, `src/services/auth/googleAuth.ts`, `src/services/auth/session.ts`, `src/services/auth/tokens.ts` | Token management, Google OAuth validation, deep link security, rate-limited auth |
| TODO | Review and commit notification system | `src/contexts/NotificationContext.tsx` (new), `src/hooks/useNotifications.ts` (new), `src/services/notifications/` (new dir) | Full push notification infrastructure — local scheduling + cloud delivery via Expo |
| TODO | Review and commit network context | `src/contexts/NetworkContext.tsx` (new) | Offline-aware connectivity state for the offline-first architecture |
| TODO | Review and commit data layer changes | `src/utils/database.ts`, `src/utils/supabase.ts`, `src/services/storage/onboarding.ts`, `src/services/storage/profile.ts`, `src/services/storage/sync.ts` | Database schema, Supabase config, encrypted profile storage, sync service |
| TODO | Review and commit context updates | `src/contexts/AuthContext.tsx`, `src/contexts/SubscriptionContext.tsx`, `src/contexts/WorkoutContext.tsx` | Auth state, RevenueCat subscription management, workout state |
| TODO | Review and commit screen & service changes | `src/screens/main/SavedWorkoutsScreen.tsx`, `src/screens/main/SettingsScreen.tsx`, `src/screens/main/WorkoutsScreen.tsx`, `src/screens/paywall/PaywallScreen.tsx` | UI updates, paywall, settings |
| TODO | Review and commit remaining services | `src/services/copilot/responseGenerator.ts`, `src/services/data/exerciseFilters.ts`, `src/services/feedback/feedbackReport.ts`, `src/services/feedback/survey.ts`, `src/services/init.ts`, `src/services/planGenerator.ts` | Copilot, exercise filtering, feedback, app init, plan generation |
| TODO | Review and commit config & build files | `app.config.js`, `eas.json`, `package.json`, `package-lock.json`, `.env.example`, `App.tsx` | Build config, dependencies, env template, app entry point |
| TODO | Review and commit Supabase infrastructure | `supabase/` (new dir), `scripts/migrations/001_create_missing_tables.sql`, `scripts/migrations/002_setup_notification_cron.sql` | Edge functions (send-notifications, delete-account), database migrations |
| TODO | Review and commit iOS StoreKit config | `ios/TransFitness/Products.storekit` (new) | In-app purchase product definitions for App Store |
| TODO | Handle deleted files | `CLAUDE.md`, `LAUNCH_TASKS.md`, `UNUSED_FILES_REPORT.md`, `exercisedb-not-found.csv`, `exercisedb-rejected.csv`, `exercises_rows (17).csv`, `replacement-review.csv` | Confirm these deletions are intentional — old task tracking files and CSV data that migrated to Supabase |

---

## Phase 1: Security Hardening (Weeks 1–2)

> **Why:** TransFitness stores HRT status, surgery history, binding habits, and dysphoria data for a vulnerable population. The business plan correctly identifies encryption as the #1 pre-launch requirement. Current XOR cipher works but isn't industry standard.

| Status | Task | Files | Why |
|--------|------|-------|-----|
| TODO | Upgrade XOR cipher → AES-256-GCM | `src/utils/encryption.ts` | XOR with device-stored keys isn't trivially broken, but AES-256-GCM is the standard for health data. Infrastructure exists — swap the cipher algorithm + add HMAC for tamper detection |
| TODO | Run full test suite, fix failures | `src/__tests__/` (15 test files) | Business plan said "zero tests" — actually 15 exist. Need to verify they pass on current Expo SDK 54 runtime |
| TODO | Add edge case tests for safety rules | `src/__tests__/services/rulesEngine.test.ts` | Cover: ace bandage + heavy cardio block, early post-op chest exercise block, multi-surgery overlap scenarios |
| TODO | Security audit — no plaintext health data | `src/services/storage/profile.ts`, `src/utils/encryption.ts` | Verify all 14 sensitive fields encrypted at rest, no plaintext leakage in logs or sync |

---

## Phase 2: Analytics + Polish (Weeks 3–4)

> **Why:** Local analytics exist (34+ event types) but there's no way to see dashboards, funnels, or retention data. Can't optimize what you can't measure. Also cleaning up UI signals of incompleteness.

| Status | Task | Files | Why |
|--------|------|-------|-----|
| TODO | Integrate remote analytics (PostHog free tier) | `src/services/analytics/analytics.ts`, `package.json` | Wire 34 existing local event types to PostHog for remote dashboards. Free tier covers 1M events/mo |
| TODO | Rebrand "Coming Soon" → "On Our Roadmap" | `src/screens/main/ProgressScreen.tsx:479-480`, `src/components/workout/ExerciseDemoPlaceholder.tsx:54-55`, `src/screens/main/SettingsScreen.tsx:897` | Taylor's decision: keep features visible as planned, rebrand to signal intentional roadmap rather than incompleteness |
| TODO | Update landing page — fix stale date | `landing/src/components/Hero.tsx:35-38` | Currently says "Coming Soon — January 5th, 2026" — needs current launch messaging |
| TODO | Verify database migrations applied to prod Supabase | `scripts/migrations/`, `supabase/` | Deleted CSVs suggest exercise data migrated to Supabase — confirm it's complete and accessible |
| TODO | Verify exercise database completeness | `src/services/data/exerciseFilters.ts` | Confirm exercise library is fully populated — this is the foundation for workout generation |

---

## Phase 3: Beta Testing (Weeks 5–6)

> **Why:** The business plan's beta timeline was too tight (2 weeks beta → 2 weeks to launch). Real beta needs at least 2 iteration cycles with actual trans users.

| Status | Task | Files | Why |
|--------|------|-------|-----|
| TODO | Recruit 50–100 trans beta users | N/A (Reddit, Discord) | Target: r/FTMFitness (~35K), r/ftm (~129K), r/MtF (~131K), trans Discord servers |
| TODO | Build mood/dysphoria check-in feature | New screens/components | Pre-workout: "How are you feeling about your body?" (1-5 scale). Post-workout: same. Research shows body satisfaction mediates dysphoria-exercise relationship. Becomes retention metric + marketing proof point |
| TODO | Add Discord server link in-app | `src/screens/main/SettingsScreen.tsx` or new | Minimal community MVP — link to Discord from within app. Community is #1 retention driver for niche fitness apps |
| TODO | Collect and analyze structured beta feedback | N/A | Weekly survey + in-app feedback. Key metrics: onboarding completion (>70%), Day 1 retention (>40%), workout completion (>60%) |

---

## Phase 4: App Store Submission (Weeks 7–8)

> **Why:** Apple review takes 1-2 weeks. Submit early, iterate during review.

| Status | Task | Files | Why |
|--------|------|-------|-----|
| TODO | Submit to Apple App Store | `eas.json`, `app.config.js` | Production build via EAS, App Store Connect submission |
| TODO | Submit to Google Play | `eas.json`, `app.config.js` | Production build via EAS, Play Console submission |
| TODO | Prepare launch assets — home-first positioning | App Store screenshots, descriptions | Lead with home workout scenes, not gym. Copy: "Work out at home. Safe. Private. Yours." |
| TODO | Set up founder pricing ($4.99/mo for first 100) | RevenueCat dashboard | Ongoing monthly rate (NOT lifetime) — rewards early adopters while protecting MRR |

---

## Phase 5: Public Launch (Weeks 9–10)

| Status | Task | Files | Why |
|--------|------|-------|-----|
| TODO | Go live on both stores | N/A | Coordinated launch after app store approval |
| TODO | Reddit AMAs in r/FTMFitness and r/MtF | N/A | "I built the first trans-specific fitness app — AMA." Authentic, vulnerable, community-first |
| TODO | TikTok content push (3-5 videos) | N/A | Binding-safe exercises, HRT workout tips — all filmed at home |
| TODO | Press outreach | N/A | Out Magazine, Them, The Advocate, Healthline, Autostraddle |
| TODO | Email waitlist with launch announcement | N/A | First month free for waitlist members |

---

## Phase 6: Iterate (Weeks 11–12)

| Status | Task | Files | Why |
|--------|------|-------|-----|
| TODO | Analyze retention/conversion data from PostHog | N/A | Calculate actual CAC, Day 7/30 retention, free-to-paid conversion |
| TODO | Address top 3 user-reported issues | TBD | Data-driven prioritization from beta + launch feedback |
| TODO | Evaluate trans femme programming gaps | `src/services/rulesEngine/`, exercise data | Business plan flags that features skew transmasc. Trans women exercise at 24.3% rate — they need the app most |

---

## Deferred — Post-Launch (Month 4+)

> **Why deferred:** These are real needs but premature without retention data, user volume, or revenue to justify the investment.

| Status | Task | Why Deferred |
|--------|------|-------------|
| DEFERRED | B2B/ERG outreach to employers | Need retention data + case studies first. Cold-emailing Google ERGs with <100 users is a credibility risk |
| DEFERRED | LLM copilot upgrade | Current retrieval-based copilot works. LLM integration is high-effort and the current "Safety Guide" framing is honest |
| DEFERRED | Certificate pinning | Requires custom Expo build (`expo prebuild`). HTTPS/TLS provides adequate transit security for launch |
| DEFERRED | Encryption key rotation strategy | AES-256-GCM first, then key rotation. One step at a time |
| DEFERRED | Personal Records (PR tracking) | On the roadmap. Post-launch feature based on user demand |
| DEFERRED | Body composition tracking | On the roadmap. Sensitive feature that needs careful dysphoria-aware UX design |
| DEFERRED | Exercise video demos | On the roadmap. Current text tips + ExRx links provide value. Video production is expensive |
| DEFERRED | Theme selection (light mode) | On the roadmap. Dark mode is the right default for this audience |
| DEFERRED | International expansion | UK, Canada, EU — triples addressable population but requires localization |

---

## Context: What the Business Plan Got Wrong

The Perplexity-generated business plan (March 2026) was working from a stale codebase snapshot. Key corrections:

| Business Plan Claim | Actual Codebase State |
|--------------------|-----------------------|
| "Zero tests on safety-critical code" | 15 test files exist — rules engine, plan generation, exercise filtering, screens |
| "17-screen onboarding, add Quick Start" | QuickStart.tsx already exists as screen #2 |
| "No analytics or event tracking" | 34+ event types tracked locally in SQLite. Missing: remote sync |
| "Coming Soon everywhere" | Only 4 locations — rebranding to "On Our Roadmap" |
| "Product is ~40% built" | Codebase is ~75% built — auth, payments, notifications, encryption, rules engine all functional |
