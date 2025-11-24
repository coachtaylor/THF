# Onboarding Flow - Manual Testing Checklist

This document provides a comprehensive checklist for testing the complete onboarding flow end-to-end.

**Last Updated:** 2025-01-XX  
**Tested By:** _______________  
**Date Tested:** _______________  
**Platform:** iOS / Android / Both  
**App Version:** _______________

---

## 🎯 HAPPY PATH

### Initial Screens
- [ ] **WhyTransFitness screen loads**
  - [ ] Screen displays correctly
  - [ ] All text is visible and readable
  - [ ] "Get Started" button is visible and tappable

- [ ] **Tap "Get Started" → goes to Disclaimer**
  - [ ] Navigation is smooth
  - [ ] Disclaimer screen loads correctly
  - [ ] All disclaimer text is visible

- [ ] **Check disclaimer → "Complete Profile" becomes active**
  - [ ] Checkbox is initially unchecked
  - [ ] "Complete Profile" button is disabled initially
  - [ ] Tapping checkbox enables "Complete Profile" button
  - [ ] Button styling changes when enabled

### Gender Identity Screen
- [ ] **Tap "Complete Profile" → goes to GenderIdentity**
  - [ ] Navigation works correctly
  - [ ] Progress indicator shows "Step 1/5"
  - [ ] Screen title: "Your Gender Identity"
  - [ ] Subtitle displays correctly

- [ ] **Select "Trans Woman / Transfeminine" → Continue**
  - [ ] Card highlights with teal border when selected
  - [ ] Continue button becomes enabled
  - [ ] Tap Continue → navigates to Goals screen
  - [ ] Profile saves `gender_identity: 'mtf'`

### Goals Screen
- [ ] **Select "Feminization" goal → Continue**
  - [ ] "Feminization" option appears when gender_identity is 'mtf'
  - [ ] Goal card highlights when selected
  - [ ] Continue button enabled after selection
  - [ ] Navigation to next screen works
  - [ ] Profile saves `primary_goal: 'feminization'`, `goals` array, and `goal_weighting`

- [ ] **Select "Intermediate" experience → Continue**
  - [ ] Experience level options display correctly
  - [ ] Selection highlights properly
  - [ ] Profile saves `fitness_experience: 'intermediate'`

- [ ] **Select "4 days/week" frequency → Continue**
  - [ ] Frequency selector works correctly
  - [ ] Profile saves `workout_frequency: 4`

- [ ] **Select equipment (at least 1) → Continue → goes to HRTAndBinding**
  - [ ] Equipment options display correctly
  - [ ] Multiple equipment can be selected
  - [ ] At least one equipment required to continue
  - [ ] Profile saves equipment array
  - [ ] Navigation to HRTAndBinding works

### HRT & Binding Screen
- [ ] **Select "Yes, I'm on HRT" → Choose "Estrogen / Anti-Androgens" → Set months**
  - [ ] HRT question displays correctly
  - [ ] "Yes" button highlights when selected
  - [ ] HRT type options appear after selecting Yes
  - [ ] Type options filtered correctly (MTF sees Estrogen, not Testosterone)
  - [ ] Duration input works (months/years formatting)
  - [ ] Profile saves `on_hrt: true`, `hrt_type: 'estrogen_blockers'`, `hrt_months_duration`

- [ ] **Select "Yes, I bind" → Choose frequency → Continue → goes to Surgery**
  - [ ] Binding question displays correctly
  - [ ] "Yes" button highlights when selected
  - [ ] Binding frequency options appear
  - [ ] Duration input works (hours)
  - [ ] Warning appears if duration > 8 hours
  - [ ] Binder type selection works (optional)
  - [ ] Profile saves `binds_chest: true`, `binding_frequency`, `binding_duration_hours`
  - [ ] Navigation to Surgery screen works

### Surgery Screen
- [ ] **Select "Yes" to surgery → Check "Top Surgery" → Set date**
  - [ ] Surgery question displays correctly
  - [ ] "Yes" button highlights when selected
  - [ ] Surgery type checkboxes appear
  - [ ] Multiple surgeries can be selected
  - [ ] Date input works (YYYY-MM-DD format)
  - [ ] Weeks post-op calculates automatically
  - [ ] Context message displays based on weeks (< 6, 6-12, 12+)
  - [ ] Warning banner appears if any surgery < 12 weeks
  - [ ] Notes field works (optional)
  - [ ] Profile saves surgeries array with correct structure

- [ ] **Continue → goes to Review**
  - [ ] Navigation works correctly
  - [ ] All required fields validated before navigation

### Review Screen
- [ ] **Review shows all correct information**
  - [ ] Progress indicator shows "Step 5/5"
  - [ ] "Your Profile" section displays:
    - [ ] Gender Identity (correct label)
    - [ ] Primary Goal (correct label)
    - [ ] Experience Level
    - [ ] Training Frequency
  - [ ] "HRT Status" section displays (if on_hrt = true):
    - [ ] HRT Type
    - [ ] Duration (formatted correctly)
    - [ ] Impact message
  - [ ] "Binding Status" section displays (if binds_chest = true):
    - [ ] Frequency
    - [ ] Duration
    - [ ] Binder Type
    - [ ] Impact message
  - [ ] "Surgery History" section displays (if surgeries.length > 0):
    - [ ] Surgery type for each
    - [ ] Date (MM/DD/YYYY format)
    - [ ] Weeks post-op
    - [ ] Status (Still recovering / Fully healed)
    - [ ] Notes (if provided)
    - [ ] Impact message
  - [ ] "Equipment" section displays:
    - [ ] All selected equipment listed

- [ ] **Tap "Generate Plan" → Plan generates successfully**
  - [ ] Button is enabled
  - [ ] Loading state displays ("Generating Plan...")
  - [ ] Plan generates without errors
  - [ ] Navigation to PlanView works
  - [ ] Plan displays correctly

---

## 🔄 EDGE CASES

### Navigation
- [ ] **Back navigation works at each step**
  - [ ] Back button works on all screens
  - [ ] Swipe back gesture works (iOS)
  - [ ] Data persists when navigating back
  - [ ] Previously selected options remain selected

### Data Persistence
- [ ] **Profile persists if app is closed and reopened**
  - [ ] Close app during onboarding
  - [ ] Reopen app
  - [ ] Profile data is still present
  - [ ] Can continue from last completed step
  - [ ] All entered data is preserved

### Validation
- [ ] **Validation prevents skipping required fields**
  - [ ] Continue button disabled when required fields missing
  - [ ] Error messages display appropriately
  - [ ] Cannot proceed without:
    - [ ] Gender identity selected
    - [ ] Primary goal selected
    - [ ] Fitness experience selected
    - [ ] Workout frequency set
    - [ ] At least one equipment selected
    - [ ] HRT question answered (Yes/No)
    - [ ] Binding question answered (Yes/No)
    - [ ] Surgery question answered (Yes/No)
    - [ ] If surgery Yes: at least one surgery type with date

### Date Picker
- [ ] **Date picker works on iOS and Android**
  - [ ] iOS: Native date picker displays correctly
  - [ ] Android: Date input works correctly
  - [ ] Date format (YYYY-MM-DD) is accepted
  - [ ] Invalid dates are rejected
  - [ ] Future dates are handled appropriately
  - [ ] Date parsing works correctly

### Progress Indicator
- [ ] **Progress indicator updates correctly**
  - [ ] Step 1/5 on GenderIdentity
  - [ ] Step 2/5 on Goals
  - [ ] Step 3/5 on HRTAndBinding
  - [ ] Step 4/5 on Surgery
  - [ ] Step 5/5 on Review
  - [ ] Progress bar fills correctly
  - [ ] Step labels are accurate

### Migration
- [ ] **Old profile data migrates correctly**
  - [ ] Create profile with old structure (goals, constraints, surgery_flags, hrt_flags)
  - [ ] Load profile in app
  - [ ] Migration runs automatically
  - [ ] New fields are populated from old data:
    - [ ] primary_goal inferred from goals
    - [ ] on_hrt inferred from hrt_flags
    - [ ] binds_chest inferred from constraints
    - [ ] surgeries created from surgery_flags
    - [ ] fitness_experience mapped from fitness_level
  - [ ] Old fields preserved for backwards compatibility
  - [ ] No data loss during migration

---

## ♿ ACCESSIBILITY

### Visual
- [ ] **All text is readable**
  - [ ] Font sizes are appropriate
  - [ ] Text is not cut off
  - [ ] Text wraps correctly on small screens
  - [ ] No overlapping text

- [ ] **Touch targets are large enough**
  - [ ] All buttons are at least 44x44 points (iOS) / 48x48 dp (Android)
  - [ ] Cards are easily tappable
  - [ ] Checkboxes are large enough
  - [ ] Input fields are easily accessible

### Screen Reader
- [ ] **Screen reader announces content correctly**
  - [ ] Screen titles are announced
  - [ ] Button labels are descriptive
  - [ ] Form fields have proper labels
  - [ ] Error messages are announced
  - [ ] Progress indicator is announced
  - [ ] Selected states are announced

### Color Contrast
- [ ] **Color contrast meets WCAG standards**
  - [ ] Text on dark backgrounds has sufficient contrast (WCAG AA: 4.5:1)
  - [ ] Text on light backgrounds has sufficient contrast
  - [ ] Interactive elements have clear visual feedback
  - [ ] Selected states are clearly visible
  - [ ] Disabled states are distinguishable

---

## 💾 DATA VALIDATION

### Profile Storage
- [ ] **Profile saved to SQLite correctly**
  - [ ] Profile data persists in database
  - [ ] Can retrieve profile after save
  - [ ] No SQL errors in console
  - [ ] Database schema is correct

- [ ] **All new fields present in saved profile**
  - [ ] `user_id` is present
  - [ ] `gender_identity` is present
  - [ ] `primary_goal` is present
  - [ ] `on_hrt` is boolean
  - [ ] `hrt_type` is present (if on_hrt = true)
  - [ ] `hrt_months_duration` is present (if on_hrt = true)
  - [ ] `binds_chest` is boolean
  - [ ] `binding_frequency` is present (if binds_chest = true)
  - [ ] `binding_duration_hours` is present (if binds_chest = true)
  - [ ] `binder_type` is present (if binds_chest = true, optional)
  - [ ] `surgeries` is array
  - [ ] `fitness_experience` is present
  - [ ] `workout_frequency` is number
  - [ ] `session_duration` is number
  - [ ] `equipment` is array
  - [ ] `created_at` is Date
  - [ ] `updated_at` is Date

- [ ] **Old fields preserved for backwards compatibility**
  - [ ] `goals` array is present
  - [ ] `constraints` array is present
  - [ ] `surgery_flags` array is present
  - [ ] `hrt_flags` array is present
  - [ ] `fitness_level` is present
  - [ ] `goal_weighting` object is present

### Data Types
- [ ] **Dates stored as ISO strings**
  - [ ] `created_at` is valid Date or ISO string
  - [ ] `updated_at` is valid Date or ISO string
  - [ ] `hrt_start_date` is valid Date or ISO string (if present)
  - [ ] Surgery dates are valid Date objects

- [ ] **weeks_post_op calculated correctly**
  - [ ] Calculation: `Math.floor((now - surgeryDate) / (7 * 24 * 60 * 60 * 1000))`
  - [ ] Returns correct number of weeks
  - [ ] Handles edge cases (same day = 0 weeks)
  - [ ] Handles future dates appropriately
  - [ ] Updates when surgery date changes

### Surgery Data Structure
- [ ] **Surgery objects have correct structure**
  - [ ] Each surgery has `type` field
  - [ ] Each surgery has `date` field (Date object)
  - [ ] Each surgery has `weeks_post_op` field (number or undefined)
  - [ ] Each surgery has `notes` field (string or undefined)
  - [ ] Empty surgeries array when "No" selected
  - [ ] Multiple surgeries can be saved

---

## 🐛 KNOWN ISSUES

_List any bugs or issues discovered during testing:_

1. 
2. 
3. 

---

## ✅ TEST COMPLETION

**Overall Status:** ⬜ Pass ⬜ Fail ⬜ Partial

**Critical Issues:** ⬜ None ⬜ Found (see Known Issues)

**Ready for Production:** ⬜ Yes ⬜ No

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## 📝 TESTING NOTES

_Additional observations, suggestions, or comments:_

_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

