# Weeks 8-10: Polish, Testing & QA - Implementation Guide

**Goal**: Polish features, implement engagement/retention, ensure quality  
**Estimated Effort**: 60-80 hours  
**Status**: [ ] Not Started | [ ] In Progress | [ ] Complete

---

## Week 8: Engagement & Retention (20-25 hours)

### 🎯 US-8.1: Push Reminders (Workout Notifications)

**Estimated Time**: 8 hours

**Implementation**:

```typescript
// src/services/pushNotifications.ts
import * as Notifications from 'expo-notifications';

export async function scheduleDailyWorkoutReminder(time: { hour: number; minute: number }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time for your workout! 💪",
      body: "Your body is ready. Let's do this.",
    },
    trigger: {
      hour: time.hour,
      minute: time.minute,
      repeats: true,
    },
  });
}

export async function sendStreakReminder(streak: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${streak}-day streak! 🔥`,
      body: "Don't break it now. Quick 5-min workout?",
    },
    trigger: null, // Send immediately
  });
}

export async function sendTrialReminder(daysLeft: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Your trial ends in ${daysLeft} days`,
      body: "Enjoying Plus? Your trial converts to $24.99/month soon. Cancel anytime in Settings.",
    },
    trigger: null,
  });
}
```

**Settings Integration**:

```typescript
// src/screens/Settings.tsx
<List.Item
  title="Workout Reminders"
  description={remindersEnabled ? "Daily at 6:00 PM" : "Off"}
  left={props => <List.Icon {...props} icon="bell" />}
  onPress={() => navigation.navigate('ReminderSettings')}
/>
```

**Checklist**:
- [ ] Push notifications permission requested
- [ ] Daily workout reminder scheduled
- [ ] Streak reminder sent when appropriate
- [ ] Trial reminder sent on Day 5
- [ ] Reminders default to OFF (v2.2)
- [ ] User can enable/disable in Settings
- [ ] User can set reminder time
- [ ] Notifications work on iOS and Android

---

### 🎯 US-8.2: Feedback Button (In-App)

**Estimated Time**: 4 hours

**Implementation**:

```typescript
// src/components/FeedbackButton.tsx
import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Button, Dialog, Portal } from 'react-native-paper';

export default function FeedbackButton() {
  const [visible, setVisible] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async () => {
    // Send to Supabase or email
    await submitFeedback(feedback);
    setVisible(false);
    setFeedback('');
    showSuccessToast('Feedback sent! Thank you.');
  };

  return (
    <>
      <Button icon="message" onPress={() => setVisible(true)}>
        Send Feedback
      </Button>

      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)}>
          <Dialog.Title>Send Feedback</Dialog.Title>
          <Dialog.Content>
            <TextInput
              multiline
              numberOfLines={5}
              value={feedback}
              onChangeText={setFeedback}
              placeholder="Tell us what you think..."
              style={styles.textInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisible(false)}>Cancel</Button>
            <Button onPress={handleSubmit}>Send</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}
```

**Checklist**:
- [ ] Feedback button in Settings
- [ ] Dialog opens with text input
- [ ] Feedback submits to Supabase
- [ ] Success toast shows
- [ ] Email sent to support@transfitness.com

---

### 🎯 US-8.3: Community Resources Link

**Estimated Time**: 2 hours

**Implementation**:

```typescript
// src/screens/Settings.tsx
<List.Item
  title="Community Resources"
  description="Trans fitness guides, support groups, and more"
  left={props => <List.Icon {...props} icon="heart" />}
  onPress={() => Linking.openURL('https://transfitness.com/resources')}
/>
```

**Resources Page** (on landing site):
- Trans-affirming gyms directory
- Online support groups (Reddit, Discord)
- Trans health resources
- Fitness guides

**Checklist**:
- [ ] Community Resources link in Settings
- [ ] Opens browser to resources page
- [ ] Resources page created on landing site

---

### 🎯 US-8.4: Share Progress (Private)

**Estimated Time**: 6 hours

**Implementation**:

```typescript
// src/services/shareProgress.ts
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

export async function shareProgress(sessionId: string, viewRef: any) {
  try {
    // Capture screenshot of progress card
    const uri = await captureRef(viewRef, {
      format: 'png',
      quality: 0.8,
    });

    // Generate share text
    const text = `Just completed a workout with TransFitness! 💪🏳️‍⚧️`;

    // Share (native share sheet)
    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: 'Share your progress',
    });
  } catch (error) {
    console.error('Share failed:', error);
  }
}
```

**Checklist**:
- [ ] Share button on Completion Screen
- [ ] Captures screenshot of progress card
- [ ] Opens native share sheet
- [ ] No personal data in screenshot (privacy-first)
- [ ] Works on iOS and Android

---

## Week 9: Privacy & Data (20-25 hours)

### 🎯 US-9.1: Cloud Sync Toggle

**Estimated Time**: 8 hours

**Implementation**:

```typescript
// src/screens/Settings.tsx
<List.Item
  title="Cloud Sync"
  description={cloudSyncEnabled ? "Enabled" : "Disabled (Local only)"}
  left={props => <List.Icon {...props} icon="cloud" />}
  right={props => (
    <Switch
      value={cloudSyncEnabled}
      onValueChange={handleToggleCloudSync}
    />
  )}
/>
```

**Privacy Model** (from BRD v2.2):
- **Local-first**: All data stored in SQLite by default
- **Optional cloud sync**: User can enable to sync to Supabase
- **Hybrid model**: Local + optional cloud backup

**Checklist**:
- [ ] Cloud sync toggle in Settings
- [ ] Default: OFF (local-first)
- [ ] When enabled: syncs profile, plans, sessions to Supabase
- [ ] When disabled: data stays local only
- [ ] Sync status indicator ("Last synced: 2 min ago")

---

### 🎯 US-9.2: Delete All Data Flow

**Estimated Time**: 6 hours

**Implementation**:

```typescript
// src/screens/Settings.tsx
<List.Item
  title="Delete All Data"
  description="Permanently delete all your data"
  left={props => <List.Icon {...props} icon="delete-forever" />}
  onPress={handleDeleteAllData}
/>

async function handleDeleteAllData() {
  Alert.alert(
    'Delete All Data',
    'This will permanently delete all your data (profile, workouts, progress). This cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Everything',
        style: 'destructive',
        onPress: async () => {
          await deleteAllData(user.id);
          showSuccessToast('All data deleted. Contact support@transfitness.com if you need help.'); // v2.2
          navigation.navigate('Onboarding');
        },
      },
    ]
  );
}
```

**Checklist**:
- [ ] "Delete All Data" button in Settings
- [ ] Confirmation dialog with warning
- [ ] Deletes from SQLite (all tables)
- [ ] Deletes from Supabase (if cloud sync enabled)
- [ ] Success toast with support link (v2.2)
- [ ] Navigates to Onboarding after deletion

---

### 🎯 US-9.3: Export Data (JSON/CSV)

**Already implemented in Week 5 (US-5.5)**

**Checklist**:
- [ ] Export JSON works
- [ ] Export CSV works
- [ ] Native share sheet opens
- [ ] Files contain all user data

---

### 🎯 US-9.4: GDPR/CCPA Compliance

**Estimated Time**: 6 hours

**Implementation**:

1. **Privacy Policy** (on landing site)
   - Data collection practices
   - Data retention policies
   - User rights (access, deletion, portability)
   - Cookie policy

2. **Terms of Service** (on landing site)
   - User agreement
   - Liability disclaimers
   - Subscription terms

3. **In-App Compliance**:
   - Privacy policy link in Settings
   - Terms of service link in Settings
   - Data export (already implemented)
   - Data deletion (already implemented)

**Checklist**:
- [ ] Privacy policy written and published
- [ ] Terms of service written and published
- [ ] Privacy policy link in Settings
- [ ] Terms of service link in Settings
- [ ] Data export available
- [ ] Data deletion available
- [ ] GDPR-compliant (EU users)
- [ ] CCPA-compliant (CA users)

---

## Week 10: Testing & QA (20-30 hours)

### 🎯 US-10.1: Unit Tests (Critical Paths)

**Estimated Time**: 10 hours

**Test Coverage**:

```typescript
// __tests__/services/planGenerator.test.ts
describe('Plan Generator', () => {
  it('generates 7 days for 1-week block', () => {
    const plan = generatePlan({
      profile: testProfile,
      blockLength: 1,
      startDate: new Date(),
    });
    expect(plan.days.length).toBe(7);
  });

  it('filters exercises by constraints', () => {
    const profile = { ...testProfile, constraints: ['binder_aware'] };
    const plan = generatePlan({ profile, blockLength: 1, startDate: new Date() });
    // All exercises should be binder-aware
    plan.days.forEach(day => {
      Object.values(day.variants).forEach(workout => {
        if (workout) {
          workout.exercises.forEach(ex => {
            const exercise = exerciseLibrary.find(e => e.id === ex.exerciseId);
            expect(exercise?.binder_aware).toBe(true);
          });
        }
      });
    });
  });
});

// __tests__/services/streakTracker.test.ts
describe('Streak Tracker', () => {
  it('increments streak on consecutive days', async () => {
    const streak1 = await updateStreak('user1', new Date('2025-11-13'));
    const streak2 = await updateStreak('user1', new Date('2025-11-14'));
    expect(streak2.currentStreak).toBe(2);
  });

  it('uses grace day when 1 day missed', async () => {
    const streak1 = await updateStreak('user1', new Date('2025-11-13'));
    const streak2 = await updateStreak('user1', new Date('2025-11-15')); // Missed 11-14
    expect(streak2.currentStreak).toBe(2); // Streak stays alive
    expect(streak2.graceDaysUsedThisWeek).toBe(1);
  });

  it('resets streak when >1 day missed', async () => {
    const streak1 = await updateStreak('user1', new Date('2025-11-13'));
    const streak2 = await updateStreak('user1', new Date('2025-11-16')); // Missed 11-14, 11-15
    expect(streak2.currentStreak).toBe(1); // Streak reset
  });
});
```

**Checklist**:
- [ ] Plan generator tests pass
- [ ] Streak tracker tests pass
- [ ] Text parser tests pass
- [ ] Session logger tests pass
- [ ] Purchase flow tests pass (mocked IAP)

---

### 🎯 US-10.2: Performance Testing

**Estimated Time**: 6 hours

**Benchmarks** (from BRD v2.2):
- Cold start ≤2.5s
- Cached tap response ≤150ms
- Plan generation ≤2s
- Video cache hit rate ≥80%

**Tools**:
- React Native Performance Monitor
- Flipper
- Xcode Instruments (iOS)
- Android Profiler (Android)

**Checklist**:
- [ ] Cold start measured on iPhone 12
- [ ] Cold start measured on Pixel 5
- [ ] Cold start ≤2.5s on both devices
- [ ] Cached tap response ≤150ms
- [ ] Plan generation ≤2s
- [ ] Video cache hit rate ≥80%
- [ ] No memory leaks detected
- [ ] No excessive re-renders

---

### 🎯 US-10.3: Accessibility Testing

**Estimated Time**: 6 hours

**Requirements** (from BRD v2.2):
- Dynamic type support (text scales with system settings)
- Screen reader support (VoiceOver/TalkBack)
- Color contrast (WCAG AA)
- Touch target size ≥44x44

**Checklist**:
- [ ] Dynamic type tested (smallest to largest)
- [ ] VoiceOver tested (iOS)
- [ ] TalkBack tested (Android)
- [ ] All interactive elements have accessibility labels
- [ ] Color contrast ≥4.5:1 (WCAG AA)
- [ ] Touch targets ≥44x44 pixels
- [ ] Keyboard navigation works (if applicable)

---

### 🎯 US-10.4: Safety Lint CI Gate

**Estimated Time**: 8 hours

**Implementation**:

```yaml
# .github/workflows/safety-lint.yml
name: Safety Lint

on: [pull_request]

jobs:
  safety-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: node scripts/safety-lint.js
```

```javascript
// scripts/safety-lint.js
const fs = require('fs');
const path = require('path');

// Load forbidden phrases
const forbiddenPhrases = JSON.parse(
  fs.readFileSync('config/forbidden-phrases.json', 'utf8')
);

// Load required flags
const requiredFlags = JSON.parse(
  fs.readFileSync('config/required-flags.json', 'utf8')
);

// Check exercise library
const exerciseLibrary = JSON.parse(
  fs.readFileSync('src/data/exercises.json', 'utf8')
);

let errors = 0;

exerciseLibrary.forEach((exercise, index) => {
  // Check for forbidden phrases
  const allText = [
    exercise.name,
    ...exercise.neutral_cues,
    ...exercise.breathing_cues,
    exercise.trans_notes.binder,
    exercise.trans_notes.pelvic_floor,
  ].join(' ').toLowerCase();

  forbiddenPhrases.forEach(phrase => {
    if (allText.includes(phrase.toLowerCase())) {
      console.error(`❌ Exercise ${index + 1} (${exercise.name}) contains forbidden phrase: "${phrase}"`);
      errors++;
    }
  });

  // Check for required flags
  requiredFlags.forEach(flag => {
    if (exercise[flag] === undefined) {
      console.error(`❌ Exercise ${index + 1} (${exercise.name}) missing required flag: "${flag}"`);
      errors++;
    }
  });
});

if (errors > 0) {
  console.error(`\n❌ Safety lint failed with ${errors} errors`);
  process.exit(1);
} else {
  console.log('✅ Safety lint passed');
  process.exit(0);
}
```

**Config Files**:

```json
// config/forbidden-phrases.json
[
  "ladies",
  "girls",
  "guys",
  "men",
  "women",
  "female",
  "male",
  "feminine",
  "masculine",
  "bikini body",
  "beach body"
]
```

```json
// config/required-flags.json
[
  "binder_aware",
  "heavy_binding_safe",
  "pelvic_floor_aware"
]
```

**Checklist**:
- [ ] safety-lint.js script created
- [ ] forbidden-phrases.json created
- [ ] required-flags.json created
- [ ] GitHub Actions workflow created
- [ ] CI gate blocks PRs with safety violations
- [ ] All exercises pass safety lint

---

## 📝 Weeks 8-10 Summary Checklist

### Week 8: Engagement & Retention
- [ ] Push reminders implemented (default OFF)
- [ ] Feedback button in Settings
- [ ] Community resources link
- [ ] Share progress (private)

### Week 9: Privacy & Data
- [ ] Cloud sync toggle (default OFF)
- [ ] Delete all data flow (with support link)
- [ ] Export data (JSON/CSV)
- [ ] GDPR/CCPA compliance (privacy policy, terms)

### Week 10: Testing & QA
- [ ] Unit tests (critical paths)
- [ ] Performance benchmarks met
- [ ] Accessibility requirements met
- [ ] Safety lint CI gate

### Ready for Week 11
- [ ] All Weeks 8-10 user stories complete
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Code committed and pushed to Git

---

**End of Weeks 8-10 README**
