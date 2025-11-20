# Weeks 11-12: App Store Submission & Launch - Implementation Guide

**Goal**: Submit to App Store/Play Store and launch publicly  
**Estimated Effort**: 40-60 hours  
**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete

---

## Week 11: App Store Submission (20-30 hours)

### 🎯 US-11.1: App Store Connect Setup (iOS)

**Estimated Time**: 8 hours

**Steps**:

1. **Create App in App Store Connect**
   - Log in to [App Store Connect](https://appstoreconnect.apple.com)
   - Click "My Apps" → "+" → "New App"
   - Platform: iOS
   - Name: TransFitness
   - Primary Language: English (U.S.)
   - Bundle ID: com.transfitness.app
   - SKU: transfitness-ios

2. **App Information**
   - **Name**: TransFitness
   - **Subtitle**: Safety-first workouts for trans bodies
   - **Category**: Health & Fitness
   - **Content Rights**: You own or have the rights to use all content

3. **Pricing and Availability**
   - **Price**: Free (with in-app purchases)
   - **Availability**: All countries

4. **App Privacy**
   - **Privacy Policy URL**: https://transfitness.com/privacy
   - **Data Collection**: 
     - Email (for account)
     - Workout data (optional cloud sync)
     - Purchase history
   - **Data Use**: Personalization, analytics
   - **Data Sharing**: None

5. **In-App Purchases**
   - Create all 7 IAP products (see Week 7 README)
   - Core Monthly: $14.99/month
   - Core Annual: $119/year
   - Plus Monthly: $24.99/month (7-day trial)
   - Plus Annual: $199/year (7-day trial)
   - Founder Core Annual: $79/year
   - Founder Plus Annual: $149/year
   - Lifetime Plus: $299 one-time

**Checklist**:
- [ ] App created in App Store Connect
- [ ] App information filled out
- [ ] Pricing set to Free
- [ ] Privacy policy URL added
- [ ] All 7 IAP products created
- [ ] IAP products approved

---

### 🎯 US-11.2: Google Play Console Setup (Android)

**Estimated Time**: 6 hours

**Steps**:

1. **Create App in Google Play Console**
   - Log in to [Google Play Console](https://play.google.com/console)
   - Click "Create app"
   - App name: TransFitness
   - Default language: English (United States)
   - App or game: App
   - Free or paid: Free

2. **Store Listing**
   - **Short description**: Safety-first workouts for trans and gender-diverse people
   - **Full description**: (see below)
   - **App icon**: 512x512 PNG
   - **Feature graphic**: 1024x500 PNG
   - **Screenshots**: 5 screenshots (see US-11.3)

3. **Content Rating**
   - Use Google Play's content rating questionnaire
   - Category: Health & Fitness
   - Target audience: 13+

4. **Pricing & Distribution**
   - **Price**: Free (with in-app purchases)
   - **Countries**: All countries

5. **In-App Products**
   - Create all 7 IAP products (see Week 7 README)

**Checklist**:
- [ ] App created in Google Play Console
- [ ] Store listing filled out
- [ ] Content rating completed
- [ ] Pricing set to Free
- [ ] All 7 IAP products created

---

### 🎯 US-11.3: Screenshots (5 per platform)

**Estimated Time**: 6 hours

**Required Screenshots**:

1. **Onboarding** - "Why TransFitness?" screen
2. **Plan View** - Weekly calendar with time variants
3. **Session Player** - Exercise display with video
4. **Progress** - Streak and weekly stats
5. **BYO Import** - Parsed preview (Plus feature)

**iOS Sizes**:
- iPhone 6.7" (1290x2796) - iPhone 14 Pro Max
- iPhone 6.5" (1242x2688) - iPhone 11 Pro Max
- iPhone 5.5" (1242x2208) - iPhone 8 Plus

**Android Sizes**:
- Phone: 1080x1920 (16:9)
- Tablet: 1920x1080 (16:9)

**Tools**:
- Figma (design mockups)
- Screenshot Framer (add device frames)
- Expo (capture in-app screenshots)

**Checklist**:
- [ ] 5 screenshots designed
- [ ] iOS screenshots exported (all sizes)
- [ ] Android screenshots exported (all sizes)
- [ ] Screenshots uploaded to App Store Connect
- [ ] Screenshots uploaded to Google Play Console

---

### 🎯 US-11.4: App Store Description

**Estimated Time**: 4 hours

**App Store Description**:

```
TransFitness: Safety-first workouts for trans and gender-diverse people

DESIGNED FOR TRANS BODIES
• Binder-aware exercises with safe alternatives
• Heavy binding mode (prioritizes lower body & core)
• Pelvic floor-aware movements
• Neutral language (no gendered cues)
• Privacy-first (your data stays on your device)

FLEXIBLE WORKOUTS
• 5-45 minute options for any energy level
• Personalized plans based on your goals
• 60-exercise library (bodyweight, dumbbells, bands)
• Import your own routines (Plus)

PROGRESS TRACKING
• Streak tracking with forgiveness (1 grace day/week)
• Weekly stats and workout history
• RPE-based progression
• Pain flags for auto-regression

FREE FEATURES
• Daily 5-minute workouts
• Safety swaps
• 30-exercise library
• Basic progress tracking
• Community resources

PLUS FEATURES ($24.99/month, 7-day free trial)
• Unlimited workout lengths (5-45 min)
• Full 60-exercise library
• Import your own routines (BYO)
• Advanced progression engine
• Priority support

PRIVACY-FIRST
• Local-first storage (data stays on your device)
• Optional cloud sync
• No ads, no tracking
• GDPR/CCPA compliant

FOUNDED BY TRANS PEOPLE, FOR TRANS PEOPLE
TransFitness was created by trans people who understand the unique challenges of working out while binding, on HRT, or post-surgery. We're here to make fitness safe, accessible, and affirming.

DISCLAIMER
TransFitness is not medical advice. Always consult your doctor or surgeon before starting any exercise program.

---

Subscription Terms:
• Payment charged to Apple ID at confirmation of purchase
• Subscription automatically renews unless canceled at least 24 hours before the end of the current period
• Account charged for renewal within 24 hours prior to the end of the current period
• Subscriptions managed in Account Settings after purchase
• Any unused portion of free trial forfeited when purchasing subscription

Privacy Policy: https://transfitness.com/privacy
Terms of Service: https://transfitness.com/terms
```

**Checklist**:
- [ ] App Store description written
- [ ] Google Play description written
- [ ] Keywords optimized (trans, fitness, workout, LGBTQ, etc.)
- [ ] Subscription terms included
- [ ] Privacy policy link included
- [ ] Terms of service link included

---

### 🎯 US-11.5: Privacy Policy & Terms of Service

**Estimated Time**: 6 hours

**Privacy Policy** (key sections):

1. **Information We Collect**
   - Email address (for account)
   - Workout data (optional cloud sync)
   - Purchase history
   - Analytics (anonymized)

2. **How We Use Information**
   - Personalization (workout plans)
   - Analytics (improve app)
   - Support (respond to feedback)

3. **Data Sharing**
   - We do NOT share your data with third parties
   - Supabase (cloud storage, if enabled)
   - Mixpanel (analytics, anonymized)
   - Sentry (error tracking, anonymized)

4. **Your Rights**
   - Access your data (export JSON/CSV)
   - Delete your data (one-tap in Settings)
   - Opt-out of cloud sync

5. **GDPR/CCPA Compliance**
   - Right to access
   - Right to deletion
   - Right to portability
   - Right to opt-out

**Terms of Service** (key sections):

1. **Acceptance of Terms**
2. **Description of Service**
3. **User Responsibilities**
4. **Subscription Terms**
5. **Disclaimers** (not medical advice)
6. **Limitation of Liability**
7. **Termination**
8. **Governing Law**

**Checklist**:
- [ ] Privacy policy written
- [ ] Terms of service written
- [ ] Published on landing site (transfitness.com/privacy, /terms)
- [ ] Links added to App Store/Play Store listings
- [ ] Links added to app Settings

---

### 🎯 US-11.6: Submit for Review

**Estimated Time**: 2 hours

**iOS Submission**:

1. **Build and Upload**
   ```bash
   eas build --platform ios --profile production
   ```

2. **TestFlight**
   - Upload build to TestFlight
   - Add internal testers (5-10 people)
   - Test for 1-2 weeks
   - Fix critical bugs

3. **Submit for Review**
   - Select build in App Store Connect
   - Add App Review Information:
     - Demo account: test@transfitness.com / password123
     - Notes: "TransFitness is a fitness app for trans and gender-diverse people. To test Plus features, tap 'Import Routine' → Start 7-Day Trial."
   - Submit for review

**Android Submission**:

1. **Build and Upload**
   ```bash
   eas build --platform android --profile production
   ```

2. **Internal Testing**
   - Upload AAB to Google Play Console
   - Create internal testing track
   - Add testers (5-10 people)
   - Test for 1-2 weeks

3. **Submit for Review**
   - Promote to production
   - Submit for review

**Checklist**:
- [ ] iOS build uploaded to TestFlight
- [ ] TestFlight beta tested (1-2 weeks)
- [ ] iOS submitted for review
- [ ] Android build uploaded to Internal Testing
- [ ] Internal testing complete (1-2 weeks)
- [ ] Android submitted for review
- [ ] Demo account created
- [ ] App review notes added

---

## Week 12: Launch & Marketing (20-30 hours)

### 🎯 US-12.1: Beta Testing (50-100 users)

**Estimated Time**: 10 hours (ongoing)

**Beta Channels**:
- TestFlight (iOS)
- Internal Testing (Android)
- Discord server
- Reddit (r/ftm, r/NonBinary, r/trans)

**Feedback Collection**:
- In-app feedback button
- Discord #feedback channel
- Email: beta@transfitness.com

**Checklist**:
- [ ] 50-100 beta testers recruited
- [ ] Beta testing period: 2-4 weeks
- [ ] Feedback collected and prioritized
- [ ] Critical bugs fixed
- [ ] Beta testers thanked (Founder offer discount?)

---

### 🎯 US-12.2: Founder Offer Launch

**Estimated Time**: 6 hours

**Launch Strategy**:

1. **Email Beta Testers**
   ```
   Subject: TransFitness is live! 🎉 (Founder offer inside)

   Hi [Name],

   TransFitness is now live on the App Store and Google Play!

   As a thank you for being an early supporter, we're offering you a special Founder rate:

   • Lifetime Plus: $299 (normally $999) - Only 100 available
   • Founder Plus Annual: $149/year (normally $199/year) - Only 300 available
   • Founder Core Annual: $79/year (normally $119/year) - Only 300 available

   These rates renew for life. Once they're gone, they're gone.

   [Download TransFitness]

   Thank you for believing in us.
   The TransFitness Team
   ```

2. **Reddit Posts**
   - r/ftm: "I built a fitness app for trans people (with binder-aware exercises)"
   - r/NonBinary: "TransFitness: Safety-first workouts for gender-diverse bodies"
   - r/trans: "Fitness app designed by trans people, for trans people"

3. **Discord Announcements**
   - LGBTQ+ fitness servers
   - Trans support servers

**Checklist**:
- [ ] Email sent to beta testers
- [ ] Reddit posts published (r/ftm, r/NonBinary, r/trans)
- [ ] Discord announcements posted
- [ ] Founder offer inventory enabled (100 Lifetime, 300 Annual)
- [ ] Founder offer sales tracked

---

### 🎯 US-12.3: Landing Page (Next.js + Vercel)

**Estimated Time**: 8 hours

**Landing Page Sections**:

1. **Hero**
   - Headline: "Safety-first workouts for trans bodies"
   - Subheadline: "Binder-aware exercises. Privacy-first. Built by trans people."
   - CTA: "Download Free" (App Store + Google Play badges)

2. **Features**
   - Binder-aware exercises
   - Heavy binding mode
   - 5-45 minute workouts
   - Privacy-first
   - Import your own routines (Plus)

3. **Pricing**
   - Free tier
   - Core: $14.99/month or $119/year
   - Plus: $24.99/month or $199/year (7-day trial)
   - Founder offers (limited time)

4. **FAQ**
   - "Is this safe for binding?"
   - "Do I need equipment?"
   - "Can I import my own routines?"
   - "Is my data private?"
   - "Why this swap?" (v2.2)

5. **Footer**
   - Privacy Policy
   - Terms of Service
   - Community Resources
   - Contact: support@transfitness.com

**Tech Stack**:
- Next.js 14
- Tailwind CSS
- Vercel (hosting)

**Checklist**:
- [ ] Landing page designed (Figma)
- [ ] Landing page built (Next.js + Tailwind)
- [ ] Deployed to Vercel (transfitness.com)
- [ ] App Store badges added
- [ ] Google Play badges added
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Community resources page published
- [ ] FAQ page published (with "Why this swap?" section)

---

### 🎯 US-12.4: Social Media Setup

**Estimated Time**: 4 hours

**Platforms**:
- Twitter/X: @TransFitness
- Instagram: @transfitness
- TikTok: @transfitness (optional)

**Content Strategy**:
- Workout tips
- Trans fitness stories
- App updates
- Community highlights

**Launch Posts**:
```
🎉 TransFitness is live!

Safety-first workouts for trans and gender-diverse people.

✅ Binder-aware exercises
✅ 5-45 minute workouts
✅ Privacy-first
✅ Import your own routines

Download free: [link]

Built by trans people, for trans people. 💪🏳️‍⚧️
```

**Checklist**:
- [ ] Twitter account created
- [ ] Instagram account created
- [ ] Bio and profile picture set
- [ ] Launch post published
- [ ] 5-10 initial posts scheduled

---

### 🎯 US-12.5: Community Seeding

**Estimated Time**: 6 hours

**Channels**:
- Reddit (r/ftm, r/NonBinary, r/trans, r/fitness)
- Discord (LGBTQ+ fitness servers)
- Facebook groups (trans support groups)
- Twitter (trans fitness community)

**Seeding Strategy**:
- Share personal story (why you built this)
- Ask for feedback (not just promotion)
- Offer Founder discounts to early supporters
- Engage with comments and questions

**Example Reddit Post**:
```
Title: I built a fitness app for trans people (with binder-aware exercises)

Hey everyone,

I'm a trans developer and I just launched TransFitness - a fitness app designed specifically for trans and gender-diverse people.

The problem: Most fitness apps assume cisgender bodies. They don't account for binding, HRT, surgery recovery, or dysphoria.

The solution: TransFitness has:
• Binder-aware exercises with safe alternatives
• Heavy binding mode (prioritizes lower body & core)
• Neutral language (no gendered cues)
• Privacy-first (data stays on your device)
• 5-45 minute workouts

It's free to download with a 7-day trial for Plus features.

I'd love your feedback! What features would you want in a trans-specific fitness app?

[App Store link] [Google Play link]
```

**Checklist**:
- [ ] Reddit posts published (3-5 subreddits)
- [ ] Discord announcements posted (5-10 servers)
- [ ] Facebook posts published (3-5 groups)
- [ ] Twitter engagement (reply to trans fitness tweets)
- [ ] Respond to all comments within 24 hours

---

## 📝 Weeks 11-12 Summary Checklist

### Week 11: App Store Submission
- [ ] App Store Connect setup (iOS)
- [ ] Google Play Console setup (Android)
- [ ] Screenshots created (5 per platform)
- [ ] App Store description written
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] iOS submitted for review
- [ ] Android submitted for review

### Week 12: Launch & Marketing
- [ ] Beta testing (50-100 users)
- [ ] Founder offer launch (email, Reddit, Discord)
- [ ] Landing page deployed (transfitness.com)
- [ ] Social media setup (Twitter, Instagram)
- [ ] Community seeding (Reddit, Discord, Facebook)

### Post-Launch (Week 13+)
- [ ] Monitor crash-free rate (≥99.5%)
- [ ] Monitor trial conversion (5-7% Month 1)
- [ ] Respond to user feedback
- [ ] Fix critical bugs within 24h
- [ ] Iterate based on data

---

## 🎉 Launch Day Checklist

### Morning (9am)
- [ ] App approved on App Store ✅
- [ ] App approved on Google Play ✅
- [ ] Founder offers enabled (inventory: 100 Lifetime, 300 Annual)
- [ ] Landing page live (transfitness.com)
- [ ] Social media accounts ready

### Midday (12pm)
- [ ] Email sent to beta testers
- [ ] Reddit posts published (r/ftm, r/NonBinary, r/trans)
- [ ] Discord announcements posted
- [ ] Twitter launch post published
- [ ] Instagram launch post published

### Evening (6pm)
- [ ] Respond to all comments and questions
- [ ] Monitor crash-free rate
- [ ] Monitor Founder offer sales
- [ ] Celebrate! 🎉

---

## 📊 Success Metrics (First 30 Days)

### User Acquisition
- [ ] 500 downloads (Week 1)
- [ ] 1,000 downloads (Week 2)
- [ ] 2,000 downloads (Week 4)

### Revenue
- [ ] 50 Founder offers sold (Week 1)
- [ ] 100 Founder offers sold (Week 2)
- [ ] 6 paid users (break-even)
- [ ] 50 paid users ($500 MRR)

### Engagement
- [ ] 40-50% D7 retention
- [ ] 25-35% D30 retention
- [ ] 5-7% trial conversion (Month 1)

### Quality
- [ ] Crash-free rate ≥99.5%
- [ ] Average rating ≥4.5 stars
- [ ] <5% refund rate

---

**End of Weeks 11-12 README**

**You're ready to launch! 🚀💪🏳️‍⚧️**
