# Quick Testing Flow (5-10 minutes)

## Fastest Way to Test Everything

### Step 1: Run Quick Validation (30 seconds)
```bash
node scripts/quick-test.js
```
This validates:
- ✅ TypeScript compiles without errors
- ✅ All critical files exist
- ✅ Navigation is properly configured
- ✅ Required functions exist

### Step 2: Start App & Test Flow (5-10 minutes)
```bash
pnpm start
```

Then in the simulator/device, quickly test:

1. **WhyTransFitness** (30 sec)
   - Tap "Get Started" → Should go to Disclaimer

2. **Disclaimer** (30 sec)
   - Check the checkbox → Both buttons should enable
   - Tap "Continue" → Should go to Goals
   - (Or tap "Quick Start" → Should generate plan)

3. **Goals** (1 min)
   - Tap "Strength" → Should show "Primary" badge
   - Tap "Cardio" → Should show "Secondary" badge
   - Tap "Continue" → Should go to Constraints

4. **Constraints** (1 min)
   - Select "Heavy Binding" → Checkbox should check
   - Select "Top Surgery" → Banner should appear
   - Check "Surgeon cleared" → Should check
   - Tap "Continue" → Should go to Preferences

5. **Preferences** (1 min)
   - Select "15 minutes" and "30 minutes"
   - Select "1 Week"
   - Select "Bodyweight" and "Dumbbells"
   - Tap "Continue" → Should go to Review

6. **Review** (1 min)
   - Verify all selections show with labels (not variable names)
   - Tap "Generate My Plan" → Should show loading, then success

### Step 3: Check Console Logs (1 min)
Look for:
- ✅ Profile updated messages
- ✅ Plan generated messages
- ❌ Any error messages

### Step 4: Test Profile Persistence (1 min)
1. Close app completely
2. Reopen app
3. Check console for profile loading

## Total Time: ~10 minutes

This gives you confidence that:
- ✅ All screens work
- ✅ Navigation flows correctly
- ✅ Profile saves correctly
- ✅ Plan generation works
- ✅ Data persists

