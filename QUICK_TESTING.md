# Quick Testing Guide

## ✅ Automated Quick Tests (30 seconds)

Run this command to validate your codebase:

```bash
pnpm test:quick
```

This checks:
- ✅ TypeScript compilation (no errors in source files)
- ✅ All critical files exist
- ✅ Navigation structure is correct
- ✅ Profile storage functions exist
- ✅ Plan generator functions exist

**Result**: All 5 tests passed! ✅

## 🚀 Manual Testing (5-10 minutes)

Since automated component tests have Expo SDK 54 compatibility issues, here's the fastest manual testing approach:

### Step 1: Start the App
```bash
pnpm start
```

### Step 2: Quick Flow Test (5 minutes)

1. **WhyTransFitness** (30 sec)
   - ✅ Tap "Get Started" → Goes to Disclaimer

2. **Disclaimer** (30 sec)
   - ✅ Check checkbox → Buttons enable
   - ✅ Tap "Continue" → Goes to Goals

3. **Goals** (1 min)
   - ✅ Select "Strength" → Shows "Primary" badge
   - ✅ Select "Cardio" → Shows "Secondary" badge
   - ✅ Tap "Continue" → Goes to Constraints

4. **Constraints** (1 min)
   - ✅ Select "Heavy Binding" → Checkbox checks
   - ✅ Select "Top Surgery" → Banner appears
   - ✅ Check "Surgeon cleared" → Checks
   - ✅ Tap "Continue" → Goes to Preferences

5. **Preferences** (1 min)
   - ✅ Select "15 minutes" and "30 minutes"
   - ✅ Select "1 Week"
   - ✅ Select "Bodyweight" and "Dumbbells"
   - ✅ Tap "Continue" → Goes to Review

6. **Review** (1 min)
   - ✅ Verify labels show correctly (not variable names)
   - ✅ Tap "Generate My Plan" → Shows loading, then success

### Step 3: Check Console Logs (1 min)
Look for:
- ✅ "Profile updated" messages
- ✅ "Plan generated" messages
- ❌ Any error messages

## 📊 What Gets Tested

### Automated (Quick Test)
- Code structure and compilation
- File existence
- Function signatures

### Manual (App Testing)
- UI rendering
- User interactions
- Navigation flow
- Data persistence
- Plan generation

## ⚡ Total Time: ~10 minutes

This gives you confidence that:
- ✅ All code compiles correctly
- ✅ All screens work
- ✅ Navigation flows correctly
- ✅ Profile saves correctly
- ✅ Plan generation works

## 🔄 When to Run Tests

- **Before committing**: Run `pnpm test:quick` (30 sec)
- **After major changes**: Run full manual flow (10 min)
- **Before deployment**: Run both automated + manual

## 📝 Notes

- Automated component tests are set up but have Expo SDK 54 compatibility issues
- The quick test script validates the most critical aspects
- Manual testing is still the most reliable for UI/UX validation
- Focus on the happy path first, then edge cases

