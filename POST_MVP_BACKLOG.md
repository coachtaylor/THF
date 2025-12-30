# TransFitness Post-MVP Backlog

> Features and enhancements planned for after initial launch.
> Last Updated: 2025-12-28

---

## Quick Reference

| Category           | Items |
| ------------------ | ----- |
| Progress & Stats   | 2     |
| Workout Experience | 3     |
| Community Feedback | TBD   |
| Technical Debt     | 4     |

---

## PROGRESS & STATS ENHANCEMENTS

### PR History Screen

- **Status**: Designed, not yet implemented
- **Priority**: High
- **Description**: Full PR history view with filtering by type
- **Features**:
  - [ ] Filter tabs: All / Max Weight / Max Reps / Volume / 1RM
  - [ ] Group PRs by exercise
  - [ ] Show achievement date, value, improvement %
- **Files to create**: `src/screens/main/PRHistoryScreen.tsx`
- **Dependencies**: PR tracking MVP (completed)

### Goal-Specific Targets

- **Status**: Backlog
- **Priority**: Medium
- **Description**: Allow users to set specific strength goals (e.g., "bench 200 lbs")
- **Features**:
  - [ ] Goal creation UI
  - [ ] Progress tracking toward goal
  - [ ] Celebration when goal achieved
  - [ ] Goal history

---

## WORKOUT EXPERIENCE

### Exercise Demo Videos

- **Status**: Placeholder implemented
- **Priority**: Medium
- **Description**: Add video demonstrations for exercises
- **Current**: ExerciseDemoPlaceholder component shows static image

### Exercise Swaps

- **Status**: Data incomplete
- **Priority**: Low
- **Description**: Allow users to swap exercises for alternatives
- **Blocker**: `swaps` array empty in exercise data

### Coaching Cues

- **Status**: Data incomplete
- **Priority**: Low
- **Description**: Show form cues and breathing instructions
- **Blocker**: `neutral_cues`, `breathing_cues` arrays empty

---

## TECHNICAL DEBT

### Test Fixes (Pre-existing)

- **Status**: Documented in .claude/TEST_FAILURES_CHECKLIST.md
- **Priority**: Low (not blocking launch)
- **Items**:
  - [ ] Fix redFlagDeflection regex patterns (4 tests)
  - [ ] Fix react-native-reanimated mock (2 test suites)
  - [ ] Update screen test UI expectations (31 tests)

### Type Safety

- **Status**: Backlog
- **Priority**: Medium
- **Items**:
  - [ ] Replace `any` types with proper interfaces
  - [ ] Fix navigation typing in MainNavigator.tsx

### Error Tracking

- **Status**: Not started
- **Priority**: High (post-launch)
- **Description**: Add Sentry or Bugsnag for production monitoring

### Offline Support

- **Status**: Not started
- **Priority**: Medium
- **Items**:
  - [ ] Add offline detection and user messaging
  - [ ] Queue failed operations for retry when online

---

## COMMUNITY-REQUESTED FEATURES

(Add items here based on user feedback after launch)

---

## HOW TO ADD NEW ITEMS

When adding a new backlog item:

1. Choose appropriate category
2. Include: Status, Priority, Description
3. List specific features/tasks as checkboxes
4. Note any dependencies or blockers
5. Update the Quick Reference table counts
