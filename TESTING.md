# Testing Guide for TransFitness

## Setup

Tests are configured using Jest and React Native Testing Library. The test infrastructure is set up, but due to Expo SDK 54's new runtime system, some tests may need adjustments.

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run a specific test file
pnpm test WhyTransFitness.test.tsx
```

## Test Structure

Tests are located in `src/__tests__/` directory:
- `src/__tests__/screens/` - Screen component tests
- `src/__tests__/components/` - Component tests
- `src/__tests__/services/` - Service/utility tests
- `src/__tests__/mocks.ts` - Shared mocks

## Manual Testing Checklist

Since automated tests may have compatibility issues with Expo SDK 54, here's a comprehensive manual testing guide:

### US-2.1: WhyTransFitness Screen
- [ ] Headline displays correctly
- [ ] All 3 bullet points visible
- [ ] "Get Started" button navigates to Disclaimer
- [ ] "Skip" link navigates to Disclaimer
- [ ] Hero image displays (or hidden in low-sensory mode)
- [ ] Layout fits on screen without scrolling

### US-2.2: Disclaimer Screen
- [ ] Checkbox toggles on/off
- [ ] "Continue" disabled until checkbox checked
- [ ] "Quick Start" disabled until checkbox checked
- [ ] Tapping "Continue" saves to profile and navigates to Goals
- [ ] Tapping "Quick Start" navigates to QuickStart

### US-2.3: Quick Start
- [ ] Loading spinner displays
- [ ] Plan generates successfully
- [ ] Success message shows after generation

### US-2.4: Goals Screen
- [ ] All 4 goal cards display
- [ ] Cards are same size
- [ ] Selecting goal shows "Primary" badge
- [ ] Selecting second goal shows "Secondary" badge
- [ ] "Continue" disabled until goal selected
- [ ] Saves goals and navigates to Constraints

### US-2.5: Constraints Screen
- [ ] All constraint sections display
- [ ] Checkboxes toggle correctly
- [ ] Surgeon banner appears when surgery flags selected
- [ ] Saves constraints and navigates to Preferences

### US-2.6: Preferences Screen
- [ ] Duration checkboxes work
- [ ] Block length selection works
- [ ] Equipment selection works
- [ ] Bodyweight cannot be removed if only option
- [ ] Saves preferences and navigates to Review

### US-2.7: Review Screen
- [ ] All sections display with correct labels (not variable names)
- [ ] Edit buttons navigate to correct screens
- [ ] "Generate My Plan" button works
- [ ] Plan generates successfully

## End-to-End Flow Test

1. Start app → WhyTransFitness
2. Tap "Get Started" → Disclaimer
3. Check agreement → Continue → Goals
4. Select primary goal → Select secondary goal → Continue → Constraints
5. Select constraints → Continue → Preferences
6. Select preferences → Continue → Review
7. Review selections → Generate Plan → Success

## Profile Persistence Test

1. Complete onboarding flow
2. Close app completely
3. Reopen app
4. Verify profile data persists (check console logs)

## Known Issues

- Expo SDK 54's new runtime system may cause test execution issues
- Some tests may need to be run manually until Expo testing infrastructure is updated
- Focus on manual testing for now, automated tests will be refined as Expo testing matures

