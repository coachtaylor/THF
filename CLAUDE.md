# TransFitness - Claude Context

This is a React Native fitness app specifically designed for trans and non-binary users. The app generates personalized workout plans based on user profiles including gender identity, HRT status, binding practices, post-operative recovery status, and dysphoria triggers.

## Project Structure

- **src/services/rulesEngine/** - Safety rules engine for trans-specific considerations
- **src/services/workoutGeneration/** - Workout plan generation pipeline
- **src/screens/** - React Native screens (auth, onboarding, main app)
- **src/**tests**/** - Jest test suites

## Critical Safety Systems

The app has a trans-specific safety rules engine with categories:

- **Binding Safety (BS-01 to BS-05)** - Rules for users who bind their chest
- **Post-Operative (PO-01 to PO-24)** - Rules for surgical recovery phases
- **HRT Adjustment (HRT-E-01 to HRT-E-06, HRT-T-01 to HRT-T-06)** - Hormone-specific rules
- **Dysphoria Filtering (DYS-01 to DYS-05)** - Rules for avoiding trigger exercises

## Test Status

**See detailed checklist:** `.claude/TEST_FAILURES_CHECKLIST.md`

### Passing Tests (262 tests)

- All 35 rules engine safety tests pass
- Core workout generation logic tests pass

### Known Failing Tests (36 tests - Pre-existing)

These are NOT regressions from safety work. They existed before:

| Test Suite                | Failures | Issue                        |
| ------------------------- | -------- | ---------------------------- |
| redFlagDeflection.test.ts | 4        | Regex patterns too strict    |
| workoutGeneration.test.ts | 1        | Rule ID expectation          |
| exerciseFiltering.test.ts | 1        | Supabase mock missing        |
| WhyTransFitness.test.tsx  | Suite    | react-native-reanimated mock |
| Disclaimer.test.tsx       | Suite    | react-native-reanimated mock |
| Surgery.test.tsx          | 14       | useProfile hook mock         |
| Review.test.tsx           | 12       | UI text changed              |
| Goals.test.tsx            | 5        | UI text changed              |

## Recent Safety Fixes (Dec 28, 2025)

1. **Multiple surgeries logic** - Now uses most recent non-healed surgery
2. **Invalid surgery date handling** - Returns 0 weeks (most restrictive) instead of Infinity
3. **Missing exercise metadata** - Excludes exercises without `earliest_safe_phase` for post-op users
4. **Binding duration limits** - Enforces 30-minute max for ace bandage/DIY binder users
5. **HRT test fixes** - Corrected rule IDs (HRT-T-02, HRT-T-04)

## Key Commands

```bash
# Run all tests
npm test -- --no-coverage

# Run safety tests (should all pass)
npm test -- --testPathPattern="rulesEngine" --no-coverage

# Run specific test file
npm test -- --testPathPattern="<filename>" --no-coverage

# Start development
npx expo start
```

## Files Modified for Safety

- `src/services/rulesEngine/postOperative.ts` - Surgery date handling
- `src/services/workoutGeneration/utils.ts` - Exercise metadata filtering
- `src/services/workoutGeneration/volumeAdjustment.ts` - Duration limits
- `src/services/workoutGeneration/generateWorkoutPlan.ts` - Duration enforcement
- `src/services/rulesEngine/rules/types.ts` - Added max_workout_minutes
- `src/__tests__/services/rulesEngine.test.ts` - Safety edge case tests
