# End-to-End Onboarding Test Checklist

**Version:** 8-Step Workflow  
**Last Updated:** 2024  
**Test Coverage:** Complete onboarding flow from start to plan generation

---

## Prerequisites

- [ ] App is installed and running
- [ ] User is logged out or has no existing profile
- [ ] Network connection is available
- [ ] Test device is ready (see device list at bottom)

---

## Happy Path (Complete Profile)

### Step 1: Gender Identity → HRTStatus

**Screen:** `GenderIdentity.tsx`  
**Progress:** Step 1 of 8

- [ ] Screen title: "How do you identify?"
- [ ] Subtitle displays correctly
- [ ] Progress indicator shows "Step 1 of 8"
- [ ] Renders 4 gender identity cards:
  - [ ] "Trans woman (MTF)" with description
  - [ ] "Trans man (FTM)" with description
  - [ ] "Non-binary" with description
  - [ ] "Questioning" with description
- [ ] Can select "Trans woman (MTF)"
- [ ] Selected card shows teal border and checkmark
- [ ] Pronouns section appears below
- [ ] Can select pronouns: "she/her"
- [ ] Can select multiple pronouns (e.g., "they/she")
- [ ] "Other" pronouns option shows text input
- [ ] Can enter custom pronouns
- [ ] Continue button is disabled until gender selected
- [ ] Continue button enabled after gender selection
- [ ] Pronouns are optional (don't block Continue)
- [ ] Click Continue → navigates to `HRTStatus`
- [ ] Profile saves `gender_identity` and `pronouns`

---

### Step 2: HRT Status → BindingInfo

**Screen:** `HRTStatus.tsx`  
**Progress:** Step 2 of 8

- [ ] Screen title: "Are you currently on Hormone Replacement Therapy?"
- [ ] Subtitle displays correctly
- [ ] Progress indicator shows "Step 2 of 8"
- [ ] Renders Yes/No question with large buttons
- [ ] Select "Yes, I'm on HRT"
- [ ] Conditional sections appear:
  - [ ] HRT Type section shows
  - [ ] Two cards: "Estrogen + Anti-androgens" and "Testosterone"
  - [ ] Can select "Estrogen + Anti-androgens"
  - [ ] HRT Start Date section shows
  - [ ] Month dropdown appears
  - [ ] Year dropdown appears
  - [ ] Calendar icon button visible
- [ ] Select start date: June 2023
  - [ ] Month dropdown: Select "June"
  - [ ] Year dropdown: Select "2023"
- [ ] Duration calculation shows: "💡 You've been on HRT for approximately 17 months"
- [ ] Validation:
  - [ ] Cannot select future date
  - [ ] Cannot select date > 15 years ago
  - [ ] Error message shows if invalid
- [ ] Continue button disabled until date selected
- [ ] Continue button enabled after valid date
- [ ] Click Continue → navigates to `BindingInfo`
- [ ] Profile saves `on_hrt`, `hrt_type`, `hrt_start_date`, `hrt_months_duration`

**Alternative Path (No HRT):**
- [ ] Select "No, I'm not on HRT"
- [ ] Conditional sections hidden
- [ ] Continue enabled immediately
- [ ] Navigates to `BindingInfo`
- [ ] Profile saves `on_hrt: false`

---

### Step 3: Binding Info → Surgery

**Screen:** `BindingInfo.tsx`  
**Progress:** Step 3 of 8

- [ ] Screen title: "Do you bind your chest during workouts?"
- [ ] Subtitle displays correctly
- [ ] Progress indicator shows "Step 3 of 8"
- [ ] Renders Yes/No question with large buttons
- [ ] Select "Yes, I bind during workouts"
- [ ] Conditional sections appear:
  - [ ] Binding Frequency section shows
  - [ ] Four cards: Daily, Sometimes, Rarely, Never
  - [ ] Can select "Every workout (Daily)"
  - [ ] Binder Type section shows (optional)
  - [ ] Four cards: Commercial, Sports bra, DIY, Other
  - [ ] Can select "Commercial binder"
  - [ ] Binding Duration section shows
  - [ ] Slider appears (0-12 hours)
  - [ ] Can adjust slider to 6 hours
  - [ ] Shows "6.0 hours" display
- [ ] Warning banner appears if duration > 8 hours:
  - [ ] "⚠️ Medical guidance recommends limiting binding to 8 hours/day"
- [ ] Continue button disabled until frequency selected
- [ ] Continue button enabled after frequency selected
- [ ] Binder type is optional (can skip)
- [ ] Duration is optional (can skip)
- [ ] Click Continue → navigates to `Surgery`
- [ ] Profile saves `binds_chest`, `binding_frequency`, `binder_type`, `binding_duration_hours`

**Alternative Path (No Binding):**
- [ ] Select "No / Not applicable"
- [ ] Conditional sections hidden
- [ ] Continue enabled immediately
- [ ] Navigates to `Surgery`
- [ ] Profile saves `binds_chest: false`

---

### Step 4: Surgery History → Goals

**Screen:** `Surgery.tsx`  
**Progress:** Step 4 of 8

- [ ] Screen title: "Have you had any gender-affirming surgeries?"
- [ ] Subtitle displays correctly
- [ ] Progress indicator shows "Step 4 of 8"
- [ ] Renders Yes/No question with large buttons
- [ ] Select "Yes, I've had surgery"
- [ ] Surgery selection appears:
  - [ ] Question: "Which surgeries have you had? (Select all that apply)"
  - [ ] Five checkbox cards:
    - [ ] "Top Surgery" with description
    - [ ] "Bottom Surgery" with description
    - [ ] "Facial Feminization Surgery (FFS)"
    - [ ] "Orchiectomy"
    - [ ] "Other surgery"
- [ ] Check "Top Surgery"
- [ ] Expandable card opens automatically
- [ ] Card header shows "Top Surgery" with ▼/▲ icon
- [ ] Expandable content shows:
  - [ ] Surgery Date section
  - [ ] Month dropdown works
  - [ ] Year dropdown works
  - [ ] Calendar icon visible
  - [ ] Status section with radio buttons
  - [ ] "Fully healed" and "Still recovering" options
  - [ ] Notes field (optional)
- [ ] Select date: June 2024
  - [ ] Month: "June"
  - [ ] Year: "2024"
- [ ] Shows calculated duration: "💡 You are approximately 20 weeks post-op (about 5 months)"
- [ ] Recovery guidance shows: "⚠️ Active Recovery Phase: We'll avoid exercises that stress surgical sites"
- [ ] Select "Still recovering" (radio button)
- [ ] Teal checkmark appears on card when complete
- [ ] Can add notes (optional)
- [ ] Can select multiple surgeries
- [ ] Each surgery has its own expandable card
- [ ] Warning banner appears if any surgery < 12 weeks:
  - [ ] "⚠️ Important: Always follow your surgeon's specific guidance..."
- [ ] Continue button disabled until all selected surgeries have dates
- [ ] Continue button enabled after dates provided
- [ ] Click Continue → navigates to `Goals`
- [ ] Profile saves `surgeries` array with dates, weeks_post_op, fully_healed

**Alternative Path (No Surgery):**
- [ ] Select "No / Not yet"
- [ ] Surgery selection hidden
- [ ] Continue enabled immediately
- [ ] Navigates to `Goals`
- [ ] Profile saves `surgeries: []`

---

### Step 5: Goals → Experience

**Screen:** `Goals.tsx`  
**Progress:** Step 5 of 8

- [ ] Screen title displays correctly
- [ ] Progress indicator shows "Step 5 of 8"
- [ ] Shows primary goal options
- [ ] **For MTF users:** "Feminization" option appears
- [ ] **For FTM users:** "Masculinization" option appears
- [ ] **For Non-binary/Questioning:** Gender-specific goals hidden
- [ ] Can select "Feminization" (if MTF)
- [ ] Shows secondary goals section
- [ ] Can select up to 2 secondary goals
- [ ] Cannot select more than 2 secondary goals
- [ ] Secondary goals are optional
- [ ] Can select "Strength" as secondary goal
- [ ] Continue button enabled after primary goal selected
- [ ] Click Continue → navigates to `Experience`
- [ ] Profile saves `primary_goal` and `secondary_goals`

---

### Step 6: Experience → DysphoriaTriggers

**Screen:** `Experience.tsx`  
**Progress:** Step 6 of 8

- [ ] Screen title: "Tell us about your fitness background"
- [ ] Subtitle displays correctly
- [ ] Progress indicator shows "Step 6 of 8"
- [ ] **Section A: Fitness Experience**
  - [ ] Question: "What's your experience level?"
  - [ ] Three large cards: Beginner, Intermediate, Advanced
  - [ ] Each card has description
  - [ ] Can select "Intermediate"
  - [ ] Selected card shows teal border and checkmark
- [ ] **Section B: Equipment Access**
  - [ ] Question: "What equipment do you have access to?"
  - [ ] Equipment grid shows 12 options
  - [ ] "Bodyweight" is pre-selected (teal)
  - [ ] Cannot unselect "Bodyweight"
  - [ ] Can select "Dumbbells"
  - [ ] Can select "Resistance Bands"
  - [ ] Selected chips show teal background
  - [ ] At least 1 equipment must be selected
- [ ] **Section C: Workout Frequency**
  - [ ] Question: "How many days per week can you train?"
  - [ ] Four buttons: 3, 4, 5, 6 days/week
  - [ ] Can select "4 days/week"
  - [ ] Guidance shows: "💡 We recommend 3-5 days/week for most people"
- [ ] **Section D: Session Duration**
  - [ ] Question: "How long is each workout session?"
  - [ ] Four buttons: 30, 45, 60, 90 minutes
  - [ ] Can select "45 minutes"
  - [ ] Guidance shows: "💡 Longer sessions aren't always better - quality over quantity!"
- [ ] Continue button disabled until all sections complete
- [ ] Continue button enabled after all required fields filled
- [ ] Click Continue → navigates to `DysphoriaTriggers`
- [ ] Profile saves `fitness_experience`, `equipment`, `workout_frequency`, `session_duration`

---

### Step 7: Dysphoria Triggers (Optional) → Review

**Screen:** `DysphoriaTriggers.tsx`  
**Progress:** Step 7 of 8

- [ ] Screen title: "Dysphoria Triggers (Optional)"
- [ ] Subtitle displays correctly
- [ ] Progress indicator shows "Step 7 of 8"
- [ ] Intro section shows:
  - [ ] "This information is entirely optional and private..."
  - [ ] Bullet points about how it helps
- [ ] **Trigger Selection (Optional)**
  - [ ] Question: "Do any of these trigger dysphoria for you? (Optional)"
  - [ ] Eight checkbox cards:
    - [ ] "Looking at chest in mirror"
    - [ ] "Tight or form-fitting clothing"
    - [ ] "Mirrors / reflective surfaces"
    - [ ] "Body contact (spotting, partner exercises)"
    - [ ] "Crowded workout spaces"
    - [ ] "Locker rooms / changing areas"
    - [ ] "Voice (grunting, heavy breathing)"
    - [ ] "Other (please specify)"
  - [ ] Can select multiple triggers
  - [ ] Can select "Looking at chest" and "Mirrors"
  - [ ] If "Other" selected, text input appears
  - [ ] Can enter custom trigger description
  - [ ] Character counter shows (max 500)
- [ ] **Additional Notes (Optional)**
  - [ ] Question: "Anything else we should know? (Optional)"
  - [ ] Large text area appears
  - [ ] Placeholder text shows examples
  - [ ] Can enter notes
  - [ ] Character counter shows "X/500"
  - [ ] Max 500 characters enforced
- [ ] Privacy reassurance shows:
  - [ ] "🔒 This information is private and encrypted..."
- [ ] **Continue button:**
  - [ ] Always enabled (no validation blocking)
  - [ ] Can continue with no selections
  - [ ] Click Continue → navigates to `Review`
- [ ] **Skip button:**
  - [ ] "Skip This Step →" button visible
  - [ ] Prominent and easy to find
  - [ ] Click Skip → navigates to `Review`
- [ ] Profile saves `dysphoria_triggers` and `dysphoria_notes` (or undefined if skipped)

---

### Step 8: Review → PlanView

**Screen:** `Review.tsx`  
**Progress:** Step 8 of 8

- [ ] Screen title: "Review Your Profile"
- [ ] Subtitle: "Check everything looks good before we generate your personalized program."
- [ ] Progress indicator shows "Step 8 of 8"
- [ ] **Summary Panel at Top:**
  - [ ] Shows "✅ Profile Complete"
  - [ ] Lists:
    - [ ] "XX exercises tailored to your equipment"
    - [ ] "X safety rules applied"
    - [ ] "X-day training split"
    - [ ] "XX-minute sessions"
- [ ] **Section 1: Identity**
  - [ ] Shows "Identity" with Edit button
  - [ ] Displays: "Gender Identity: Trans Woman (MTF)"
  - [ ] Displays: "Pronouns: she/her" (if provided)
  - [ ] Edit button navigates to `GenderIdentity`
- [ ] **Section 2: HRT Status** (only if on_hrt = true)
  - [ ] Shows "HRT Status" with Edit button
  - [ ] Displays: "Type: Estrogen + Anti-androgens"
  - [ ] Displays: "Started: June 2023"
  - [ ] Displays: "Duration: 17 months"
  - [ ] Impact box: "💡 Impact: Workout volume reduced by 15% for recovery"
  - [ ] Edit button navigates to `HRTStatus`
- [ ] **Section 3: Binding Information** (only if binds_chest = true)
  - [ ] Shows "Binding Information" with Edit button
  - [ ] Displays: "Frequency: Every workout (Daily)"
  - [ ] Displays: "Duration: 6 hours per session"
  - [ ] Displays: "Binder Type: Commercial binder" (if provided)
  - [ ] Impact box: "💡 Impact: Chest compression exercises excluded, breathing breaks added"
  - [ ] Edit button navigates to `BindingInfo`
- [ ] **Section 4: Surgery History** (only if surgeries.length > 0)
  - [ ] Shows "Surgery History" with Edit button
  - [ ] For each surgery:
    - [ ] Displays: "Type: Top Surgery"
    - [ ] Displays: "Date: June 15, 2024"
    - [ ] Displays: "Status: 20 weeks post-op" or "Fully healed"
  - [ ] Impact box: "💡 Impact: Conservative upper body exercise selection"
  - [ ] Edit button navigates to `Surgery`
- [ ] **Section 5: Goals**
  - [ ] Shows "Goals" with Edit button
  - [ ] Displays: "Primary Goal: Feminization"
  - [ ] Displays: "Secondary Goals: Strength" (if provided)
  - [ ] Impact box: "💡 Impact: Lower body exercises emphasized (60-70% volume)" (for MTF)
  - [ ] Edit button navigates to `Goals`
- [ ] **Section 6: Training Details**
  - [ ] Shows "Training Details" with Edit button
  - [ ] Displays: "Experience Level: Intermediate"
  - [ ] Displays: "Equipment: Bodyweight, Dumbbells, Resistance Bands"
  - [ ] Displays: "Frequency: 4 days per week"
  - [ ] Displays: "Session Duration: 45 minutes"
  - [ ] Impact box: "💡 Impact: 4-day split with intermediate sets/reps"
  - [ ] Edit button navigates to `Experience`
- [ ] **Section 7: Dysphoria Considerations** (only if dysphoria_triggers.length > 0)
  - [ ] Shows "Dysphoria Considerations" with Edit button
  - [ ] Displays: "Triggers: Looking at chest in mirror, Mirrors / reflective surfaces"
  - [ ] Displays: "Notes: [First 50 characters...]" (if provided)
  - [ ] Impact box: "💡 Impact: Mirror-free exercises suggested, home workout options prioritized"
  - [ ] Edit button navigates to `DysphoriaTriggers`
- [ ] **Generate Plan Button:**
  - [ ] Large, prominent button at bottom
  - [ ] Text: "Generate My Program →"
  - [ ] Teal background (`palette.tealPrimary`)
  - [ ] Button is enabled
  - [ ] Click "Generate My Program →"
  - [ ] Shows loading state: "Generating Your Program..."
  - [ ] Button disabled during generation
  - [ ] Plan generates successfully
  - [ ] Navigates to `PlanView`
  - [ ] Profile data is saved correctly

---

## Edge Cases

### Back Navigation

- [ ] Can go back from Step 2 (HRTStatus) to Step 1 (GenderIdentity)
- [ ] Can go back from Step 3 (BindingInfo) to Step 2 (HRTStatus)
- [ ] Can go back from Step 4 (Surgery) to Step 3 (BindingInfo)
- [ ] Can go back from Step 5 (Goals) to Step 4 (Surgery)
- [ ] Can go back from Step 6 (Experience) to Step 5 (Goals)
- [ ] Can go back from Step 7 (Dysphoria) to Step 6 (Experience)
- [ ] Can go back from Step 8 (Review) to Step 7 (Dysphoria)
- [ ] Data persists when going back
- [ ] Previously selected values are pre-filled
- [ ] Can edit previous answers
- [ ] Continue button still works after editing
- [ ] Progress indicator updates correctly when going back

### Validation

#### Gender Identity
- [ ] Cannot continue without selecting gender identity
- [ ] Pronouns are optional (can skip)
- [ ] Custom pronouns can be empty

#### HRT Status
- [ ] If "Yes" selected, HRT type is REQUIRED
- [ ] If "Yes" selected, start date is REQUIRED
- [ ] Cannot select future date
- [ ] Cannot select date > 15 years ago
- [ ] Error message shows for invalid date
- [ ] Continue disabled until required fields filled

#### Binding Info
- [ ] If "Yes" selected, binding frequency is REQUIRED
- [ ] Binder type is optional
- [ ] Duration is optional
- [ ] Duration must be between 0 and 12 hours
- [ ] Error message shows for invalid duration
- [ ] Continue disabled until required fields filled

#### Surgery History
- [ ] If "Yes" selected, at least one surgery type must be selected
- [ ] Each selected surgery must have a date
- [ ] Date cannot be in the future
- [ ] Date cannot be > 10 years ago
- [ ] Error message shows for invalid date
- [ ] Continue disabled until all selected surgeries have valid dates

#### Goals
- [ ] Primary goal is REQUIRED
- [ ] Secondary goals are optional
- [ ] Maximum 2 secondary goals
- [ ] Cannot select more than 2 secondary goals
- [ ] Continue disabled until primary goal selected

#### Experience
- [ ] Fitness experience is REQUIRED
- [ ] Equipment must have at least 1 item (bodyweight is default)
- [ ] Bodyweight cannot be unselected
- [ ] Workout frequency is REQUIRED (3-6)
- [ ] Session duration is REQUIRED (30, 45, 60, 90)
- [ ] Continue disabled until all required fields filled

#### Dysphoria
- [ ] Everything is optional
- [ ] Can continue with no selections
- [ ] Can skip entire step
- [ ] Notes max 500 characters enforced

### Optional Fields

- [ ] Pronouns can be skipped in Step 1
- [ ] Binder type can be skipped in Step 3
- [ ] Binding duration can be skipped in Step 3
- [ ] Surgery notes can be skipped in Step 4
- [ ] Secondary goals can be skipped in Step 5
- [ ] Entire Dysphoria step can be skipped (Step 7)
- [ ] All optional fields save as `undefined` when skipped

### Conditional Logic

#### Gender-Specific Features
- [ ] "Feminization" goal only shows for MTF users
- [ ] "Masculinization" goal only shows for FTM users
- [ ] Gender-specific goals hidden for Non-binary/Questioning
- [ ] Review impact message changes based on gender:
  - [ ] MTF: "Lower body exercises emphasized"
  - [ ] FTM: "Upper body exercises emphasized"
  - [ ] Non-binary: "Balanced exercise selection"

#### Conditional Sections
- [ ] HRT fields hidden if "No" selected in Step 2
- [ ] Binding fields hidden if "No" selected in Step 3
- [ ] Surgery details hidden if "No" selected in Step 4
- [ ] HRT section hidden in Review if `on_hrt = false`
- [ ] Binding section hidden in Review if `binds_chest = false`
- [ ] Surgery section hidden in Review if `surgeries.length = 0`
- [ ] Dysphoria section hidden in Review if `dysphoria_triggers.length = 0`

#### Dynamic Calculations
- [ ] HRT duration calculates correctly from start date
- [ ] Surgery weeks_post_op calculates correctly from date
- [ ] Recovery guidance updates based on weeks_post_op:
  - [ ] < 6 weeks: "🛑 Early Recovery Phase"
  - [ ] 6-12 weeks: "⚠️ Active Recovery Phase"
  - [ ] ≥ 12 weeks: "✅ Late Recovery Phase"
- [ ] Exercise count calculates from filtered exercises
- [ ] Safety rules count includes all applicable rules

---

## Data Persistence

### Profile Saving
- [ ] Profile saves after Step 1 (Gender Identity)
- [ ] Profile saves after Step 2 (HRT Status)
- [ ] Profile saves after Step 3 (Binding Info)
- [ ] Profile saves after Step 4 (Surgery)
- [ ] Profile saves after Step 5 (Goals)
- [ ] Profile saves after Step 6 (Experience)
- [ ] Profile saves after Step 7 (Dysphoria)
- [ ] Profile saves on Review screen load

### App Lifecycle
- [ ] Can close app after Step 1 and resume
- [ ] Can close app after Step 4 and resume
- [ ] Can close app after Step 7 and resume
- [ ] Data loads correctly on resume
- [ ] User continues from last completed step
- [ ] Previously entered data is preserved

### Data Migration
- [ ] Old profile data migrates correctly (if upgrading)
- [ ] Migration utility runs on profile load
- [ ] Old fields are preserved for backward compatibility
- [ ] New required fields are inferred from old data
- [ ] No data loss during migration

---

## Error Handling

### Network Errors
- [ ] Shows error message on profile save failure
- [ ] Error message is clear and actionable
- [ ] Allows retry on save failure
- [ ] Data not lost on network error
- [ ] Can continue after retry succeeds
- [ ] Plan generation fails gracefully
- [ ] Error banner shows on plan generation failure:
  - [ ] "❌ Plan generation failed: [error message]"
  - [ ] "Please check your internet connection and try again."
- [ ] Can retry plan generation
- [ ] Error state clears on successful retry

### Invalid Data
- [ ] Validates dates on client (before save)
- [ ] Validates required fields on client
- [ ] Shows inline error messages
- [ ] Error messages are clear and specific
- [ ] Server validation also works (if applicable)
- [ ] Client and server validation messages match

### Edge Cases
- [ ] Handles null/undefined profile gracefully
- [ ] Handles missing required fields gracefully
- [ ] Handles corrupted profile data gracefully
- [ ] App doesn't crash on invalid data
- [ ] User can recover from error states

---

## Performance

### Load Times
- [ ] Step 1 (Gender Identity) loads < 100ms
- [ ] Step 2 (HRT Status) loads < 100ms
- [ ] Step 3 (Binding Info) loads < 100ms
- [ ] Step 4 (Surgery) loads < 100ms
- [ ] Step 5 (Goals) loads < 100ms
- [ ] Step 6 (Experience) loads < 100ms
- [ ] Step 7 (Dysphoria) loads < 100ms
- [ ] Step 8 (Review) loads < 200ms (calculates exercise count)
- [ ] No janky animations
- [ ] Smooth scrolling on all screens
- [ ] Responsive touch feedback (< 50ms)

### Memory
- [ ] No memory leaks during navigation
- [ ] Large profiles don't slow down app
- [ ] Images/icons load efficiently
- [ ] No excessive re-renders
- [ ] Memory usage stays reasonable

### Calculations
- [ ] Exercise count calculation completes quickly
- [ ] Safety rules calculation is instant
- [ ] Date calculations are accurate
- [ ] No blocking operations on main thread

---

## Accessibility

### Screen Readers
- [ ] All labels are read correctly by VoiceOver/TalkBack
- [ ] Navigation is clear and logical
- [ ] Error messages are announced
- [ ] Progress is communicated ("Step 2 of 8")
- [ ] Button states are announced (enabled/disabled)
- [ ] Form fields have proper labels
- [ ] Checkboxes and radio buttons are accessible

### Touch Targets
- [ ] All buttons are >= 44x44pt (iOS) / 48x48dp (Android)
- [ ] Sufficient spacing between options (>= 8pt)
- [ ] Cards are easy to tap
- [ ] Sliders work smoothly with touch
- [ ] Dropdowns are easy to activate
- [ ] Text inputs are easy to focus

### Visual Accessibility
- [ ] Sufficient color contrast (WCAG AA minimum)
- [ ] Text is readable at default size
- [ ] Icons have text labels or descriptions
- [ ] Focus indicators are visible
- [ ] Selected states are clearly visible

---

## Device Testing

### iPhone 12 (iOS 17)
- [ ] All screens render correctly
- [ ] Safe area insets work properly
- [ ] Touch targets are appropriate
- [ ] Scrolling is smooth
- [ ] Keyboard doesn't cover inputs
- [ ] Navigation works correctly

### Pixel 5 (Android 13)
- [ ] All screens render correctly
- [ ] Safe area insets work properly
- [ ] Touch targets are appropriate
- [ ] Scrolling is smooth
- [ ] Keyboard doesn't cover inputs
- [ ] Navigation works correctly
- [ ] Back button works correctly

### iPad Pro (Large Screen)
- [ ] Layout adapts to larger screen
- [ ] Content doesn't stretch awkwardly
- [ ] Cards are appropriately sized
- [ ] Grid layouts work well
- [ ] Text is readable
- [ ] Touch targets are still appropriate

### iPhone SE (Small Screen)
- [ ] All content fits on screen
- [ ] Scrolling works smoothly
- [ ] Text is readable (may be smaller)
- [ ] Touch targets are still >= 44pt
- [ ] No content is cut off
- [ ] Safe area insets work properly

---

## Regression Testing

### Previous Workflow Compatibility
- [ ] Old profiles still load (migration works)
- [ ] Old navigation paths redirect correctly
- [ ] Deprecated fields are handled gracefully
- [ ] No breaking changes for existing users

### Integration Points
- [ ] Profile data integrates with plan generator
- [ ] Exercise filtering uses new profile fields
- [ ] Safety rules are applied correctly
- [ ] Plan generation uses all profile data

---

## Test Results Template

```
Test Date: ___________
Tester: ___________
Device: ___________
OS Version: ___________

Happy Path: ___/___ passed
Edge Cases: ___/___ passed
Validation: ___/___ passed
Error Handling: ___/___ passed
Performance: ___/___ passed
Accessibility: ___/___ passed

Issues Found:
1. ___________
2. ___________
3. ___________

Notes:
___________
```

---

## Sign-Off

- [ ] All happy path tests pass
- [ ] All edge cases handled
- [ ] All validations work
- [ ] Error handling is robust
- [ ] Performance is acceptable
- [ ] Accessibility requirements met
- [ ] Tested on all required devices
- [ ] Ready for production

**Approved by:** ___________  
**Date:** ___________

---

*This checklist ensures the new 8-step workflow is production-ready!*

