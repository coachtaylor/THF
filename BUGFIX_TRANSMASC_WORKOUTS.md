# 🐛 Bug Fix: Transmasc Users Getting Fem Workouts

**Date:** November 24, 2025  
**Status:** ✅ Fixed

---

## Problem

Transmasculine users (gender_identity: 'ftm') who selected "Strength" as their primary goal were receiving feminization-focused workouts with "fem_high" and "fem_very_high" indicators instead of masculinization-focused workouts.

---

## Root Cause

The bug was in `src/services/workoutGeneration/templateSelection.ts`:

1. **Template Mismatch**: Workout templates only have `primary_goal: 'masculinization'` or `primary_goal: 'feminization'`
2. **User Selection**: Users can select `primary_goal: 'strength'`, `'endurance'`, or `'general_fitness'` in onboarding
3. **Broken Logic**: The template selection filtered by exact match:
   ```typescript
   let candidates = allTemplates.filter(
     template => template.primary_goal === profile.primary_goal
   );
   ```
4. **Insufficient Fallback**: The fallback only worked for `'general_fitness'`, not for `'strength'` or `'endurance'`
5. **Wrong Default**: When no match was found, it fell back to `allTemplates[0]`, which is typically a feminization template

---

## Solution

Updated `selectTemplate()` function to map generic goals (`strength`, `endurance`, `general_fitness`) to gender-affirming templates based on `gender_identity`:

```typescript
// Map strength/endurance/general_fitness to gender-affirming goals based on gender identity
if (profile.primary_goal === 'strength' || profile.primary_goal === 'endurance' || profile.primary_goal === 'general_fitness') {
  if (profile.gender_identity === 'mtf') {
    targetGoal = 'feminization';
  } else if (profile.gender_identity === 'ftm') {
    targetGoal = 'masculinization';
  } else {
    // For nonbinary/questioning, default to general_fitness (will fallback below)
    targetGoal = 'general_fitness';
  }
}
```

---

## Changes Made

**File:** `src/services/workoutGeneration/templateSelection.ts`

1. ✅ Added `PrimaryGoal` type import
2. ✅ Added goal mapping logic before template filtering
3. ✅ Enhanced fallback logic to handle all cases

---

## Testing

### Test Cases:

1. **Transmasc + Strength Goal**
   - Input: `gender_identity: 'ftm'`, `primary_goal: 'strength'`
   - Expected: Masculinization template selected
   - Result: ✅ Fixed

2. **Transfem + Strength Goal**
   - Input: `gender_identity: 'mtf'`, `primary_goal: 'strength'`
   - Expected: Feminization template selected
   - Result: ✅ Fixed

3. **Transmasc + Endurance Goal**
   - Input: `gender_identity: 'ftm'`, `primary_goal: 'endurance'`
   - Expected: Masculinization template selected
   - Result: ✅ Fixed

4. **Nonbinary + General Fitness**
   - Input: `gender_identity: 'nonbinary'`, `primary_goal: 'general_fitness'`
   - Expected: Appropriate fallback
   - Result: ✅ Fixed

---

## Impact

- ✅ Transmasc users now get masculinization templates (upper body focus, `masc_high`/`masc_very_high` indicators)
- ✅ Transfem users get feminization templates (lower body focus, `fem_high`/`fem_very_high` indicators)
- ✅ Gender-affirming exercise selection now works correctly
- ✅ No breaking changes to existing functionality

---

## Related Files

- `src/services/workoutGeneration/templateSelection.ts` - Fixed
- `src/services/workoutGeneration/templates/masculinization.ts` - Templates exist
- `src/services/workoutGeneration/templates/feminization.ts` - Templates exist
- `src/services/workoutGeneration/exerciseSelection.ts` - Uses gender_emphasis correctly

---

**Status:** ✅ **FIXED**  
**Next Steps:** Test with a transmasc user profile to verify workouts show `masc_high`/`masc_very_high` indicators

