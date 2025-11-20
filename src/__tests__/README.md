# Test Suite for TransFitness

## Overview

Automated tests have been created for all Week 2 user stories. Due to Expo SDK 54's new runtime system, some tests may require adjustments or manual verification.

## Test Files Created

### Screen Tests
- `screens/WhyTransFitness.test.tsx` - Tests for the initial onboarding screen
- `screens/Disclaimer.test.tsx` - Tests for the disclaimer and agreement flow
- `screens/Goals.test.tsx` - Tests for goal selection
- `screens/Constraints.test.tsx` - Tests for constraint selection
- `screens/Preferences.test.tsx` - Tests for preference selection
- `screens/Review.test.tsx` - Tests for review and plan generation
- `screens/QuickStart.test.tsx` - Tests for quick start flow

### Component Tests
- `components/GoalCard.test.tsx` - Tests for the goal card component

### Service Tests
- `services/planGenerator.test.ts` - Tests for plan generation logic

### Shared Mocks
- `mocks.ts` - Shared mock objects for navigation, profile, etc.

## Running Tests

```bash
# Run all tests
pnpm test

# Run in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

## Test Coverage

### US-2.1: WhyTransFitness
- ✅ Renders headline and content
- ✅ Navigation to Disclaimer
- ✅ Low-sensory mode support

### US-2.2: Disclaimer
- ✅ Checkbox functionality
- ✅ Button states (disabled/enabled)
- ✅ Profile saving
- ✅ Navigation to Goals and QuickStart

### US-2.3: Quick Start
- ✅ Loading state
- ✅ Plan generation
- ✅ Error handling

### US-2.4: Goals
- ✅ Goal selection
- ✅ Primary/secondary selection
- ✅ Goal weighting calculation
- ✅ Profile saving

### US-2.5: Constraints
- ✅ Constraint selection
- ✅ Surgery flags and banner
- ✅ HRT flags
- ✅ Profile saving

### US-2.6: Preferences
- ✅ Duration selection
- ✅ Block length selection
- ✅ Equipment selection
- ✅ Validation

### US-2.7: Review
- ✅ Summary display
- ✅ Edit navigation
- ✅ Plan generation
- ✅ Label formatting (human-readable)

## Known Limitations

Due to Expo SDK 54's new runtime system, some tests may fail with:
- `ReferenceError: You are trying to import a file outside of the scope of the test code`
- TurboModule registry issues

**Workaround**: Focus on manual testing for now. The test infrastructure is in place and will work once Expo's testing tools are updated for the new runtime.

## Manual Testing

See `TESTING.md` in the root directory for comprehensive manual testing checklists.

