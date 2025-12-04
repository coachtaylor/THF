# Unused Files Report

This report identifies files that are not currently being used in the codebase.

## 🗑️ Files That Can Be Safely Deleted

### 1. Empty/Unused Files
- **`src/screens/onboarding/intake/ProgramGeneratedScreen.tsx`** - Empty file (0 lines), never imported
- **`checkmarkIcon.tsx`** (root level) - Not imported anywhere in the codebase
- **`useAnimations.ts`** (root level) - Not imported anywhere in the codebase

### 2. Duplicate Files
- **`src/screens/auth/SplashScreen.tsx`** - Duplicate. A new splash screen exists at `src/screens/onboarding/SplashScreen.tsx` which is the one actually used in navigation
- **`src/components/SafetyCheckpointModal.tsx`** - Duplicate. The version at `src/components/session/SafetyCheckpointModal.tsx` is the one actually imported and used (SessionPlayer imports from session folder)

## ⚠️ Potentially Unused Files (Verify Before Deleting)

### 3. Auth Screens (Not in Navigation)
All these auth screens exist but are NOT imported in any navigation files:
- **`src/screens/auth/WelcomeScreen.tsx`** - Not imported
- **`src/screens/auth/LoginScreen.tsx`** - Not imported  
- **`src/screens/auth/SignupScreen.tsx`** - Not imported
- **`src/screens/auth/ForgotPasswordScreen.tsx`** - Not imported
- **`src/screens/auth/ResetPasswordScreen.tsx`** - Not imported
- **`src/screens/auth/EmailVerificationScreen.tsx`** - Not imported

**Note:** These might be planned for future use or part of a feature that hasn't been integrated yet. The app currently uses a simple onboarding flow without authentication.

### 4. Other Potentially Unused Files
- **`src/screens/onboarding/intake/BodyFocus.tsx`** - Not imported in navigation files. May be part of a feature that wasn't fully implemented.
- **`src/screens/DevTestScreen.tsx`** - Test/dev screen, likely only used during development. Check if this is still needed.

## 📊 Summary

### Safe to Delete (5 files):
1. `src/screens/onboarding/intake/ProgramGeneratedScreen.tsx` - Empty file
2. `checkmarkIcon.tsx` - Not imported
3. `useAnimations.ts` - Not imported
4. `src/screens/auth/SplashScreen.tsx` - Duplicate (old version)
5. `src/components/SafetyCheckpointModal.tsx` - Duplicate (use session/SafetyCheckpointModal.tsx instead)

### Needs Review (8 files):
1. `src/screens/auth/WelcomeScreen.tsx`
2. `src/screens/auth/LoginScreen.tsx`
3. `src/screens/auth/SignupScreen.tsx`
4. `src/screens/auth/ForgotPasswordScreen.tsx`
5. `src/screens/auth/ResetPasswordScreen.tsx`
6. `src/screens/auth/EmailVerificationScreen.tsx`
7. `src/screens/onboarding/intake/BodyFocus.tsx`
8. `src/screens/DevTestScreen.tsx`

## 🔍 Verification Commands

To verify these files aren't used, you can run:
```bash
# Check for imports of specific files
grep -r "from.*ProgramGeneratedScreen" src/
grep -r "import.*checkmarkIcon" src/
grep -r "import.*useAnimations" src/
grep -r "from.*auth/SplashScreen" src/
grep -r "BodyFocus" src/navigation/

# Check auth screens
grep -r "WelcomeScreen\|LoginScreen\|SignupScreen" src/navigation/
```

## 📝 Recommendations

1. **Delete immediately**: The 5 files marked as "Safe to Delete" - these are either empty, unused, or duplicates
2. **Review before deleting**: Files marked as "Potentially Unused" - check if they're part of planned features:
   - Auth screens: If you plan to add authentication later, keep them. Otherwise, remove.
   - BodyFocus: Check if this feature is still planned
   - DevTestScreen: Keep if you're still in active development, remove if production-ready
3. **Keep for now**: Any files that might be used conditionally or are part of features in progress

## 🚀 Quick Cleanup Script

To delete the safe-to-delete files, run:
```bash
rm src/screens/onboarding/intake/ProgramGeneratedScreen.tsx
rm checkmarkIcon.tsx
rm useAnimations.ts
rm src/screens/auth/SplashScreen.tsx
rm src/components/SafetyCheckpointModal.tsx
```
