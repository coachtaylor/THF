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

## Phase 0: Stabilize Existing Work (Week 0) — COMPLETED 2026-03-18

> **Why this phase exists:** 30+ modified/new files sat uncommitted on `develop`. Nothing else could start until the codebase was committed and stable.

### 0.1 — Commit Uncommitted Changes (13 commits)
| Status | Task | Commit | Summary |
|--------|------|--------|---------|
| DONE | Security & encryption utilities | `2d21af1` | encryption.ts, rateLimiter.ts, errorMessages.ts — XOR cipher for 14 health fields, sliding-window rate limiter, error sanitizer |
| DONE | Auth service hardening | `65bc958` | Rate limiting, token validation, deep link security, Google OAuth ID token validation |
| DONE | Notification system | `739d177` | NotificationContext, useNotifications hook, notificationService — local + cloud push |
| DONE | Network context | `2325b00` | NetworkContext.tsx — offline-aware connectivity state |
| DONE | Data layer enhancements | `3f28ffe` | Encrypted profile storage, Supabase security, GDPR deletion, sync improvements |
| DONE | Context updates | `53ebdb4` | AuthContext, SubscriptionContext (RevenueCat), WorkoutContext |
| DONE | Screen & paywall changes | `bd72cd0` | Settings overhaul, paywall enhancements, workout UI fixes |
| DONE | Service updates | `df1b488` | Copilot, exercise filters, feedback, plan generator improvements |
| DONE | Config & build files | `e315cd9` | app.config.js, eas.json, package.json, .env.example, App.tsx |
| DONE | Supabase infrastructure | `4ee83bb` | Edge functions (delete-account, send-notifications), database migrations |
| DONE | iOS StoreKit config | `f8798ba` | Products.storekit — monthly/annual subscription product definitions |
| DONE | Removed obsolete files | `730e2dd` | CLAUDE.md, LAUNCH_TASKS.md, UNUSED_FILES_REPORT.md, exercise CSVs (migrated to Supabase) |
| DONE | Added task tracker | `6a22171` | This document — phased 90-day action plan mapped against codebase reality |

> **Note:** `TransFitness_Business_Plan (1).md` intentionally NOT committed — confidential investor document.

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
