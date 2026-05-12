// Simple event emitter for onboarding/auth state changes
// This allows screens to signal the App component
// to switch between OnboardingNavigator and MainNavigator

type OnboardingCompleteCallback = () => void;
type LogoutCallback = () => void;

let onboardingCompleteCallback: OnboardingCompleteCallback | null = null;
let logoutCallback: LogoutCallback | null = null;

// Pending first-workout hand-off from ProgramSetup → HomeScreen.
//
// Why this exists: ProgramSetup lives in OnboardingNavigator. Calling
// signalOnboardingComplete() unmounts the entire onboarding stack and
// mounts MainNavigator (Home as root). We can't navigate to SessionPlayer
// from ProgramSetup before that swap happens — the navigator is gone the
// moment the swap fires. So we stash the workout payload here; HomeScreen
// drains it on mount and dispatches the navigation against the new stack.
// Bonus benefit: when the user quits the workout mid-flow, the back stack
// roots at Home (MainNavigator) rather than ProgramSetup, so they land on
// the dashboard instead of going back to the onboarding screen.
type PendingFirstWorkout = {
  workout: any;
  planId: string;
  warmUp?: any;
  coolDown?: any;
  safetyCheckpoints?: any[];
};
let pendingFirstWorkout: PendingFirstWorkout | null = null;

export function setPendingFirstWorkout(payload: PendingFirstWorkout) {
  pendingFirstWorkout = payload;
}

export function consumePendingFirstWorkout(): PendingFirstWorkout | null {
  const value = pendingFirstWorkout;
  pendingFirstWorkout = null;
  return value;
}

/**
 * Register a callback to be called when onboarding completes
 * This should be called by App.tsx
 */
export function onOnboardingComplete(callback: OnboardingCompleteCallback) {
  onboardingCompleteCallback = callback;
}

/**
 * Signal that onboarding has completed
 * This should be called by the final onboarding screen (ProgramSetup)
 */
export function signalOnboardingComplete() {
  console.log('📢 Signaling onboarding complete');
  if (onboardingCompleteCallback) {
    onboardingCompleteCallback();
  } else {
    console.warn('⚠️ No onboarding complete callback registered');
  }
}

/**
 * Register a callback to be called when user logs out
 * This should be called by App.tsx
 */
export function onLogout(callback: LogoutCallback) {
  logoutCallback = callback;
}

/**
 * Signal that user has logged out
 * This should be called after logout to switch back to onboarding/auth flow
 */
export function signalLogout() {
  console.log('📢 Signaling logout');
  if (logoutCallback) {
    logoutCallback();
  } else {
    console.warn('⚠️ No logout callback registered');
  }
}

/**
 * Clean up the callbacks (optional, for memory management)
 */
export function clearOnboardingCallback() {
  onboardingCompleteCallback = null;
}

export function clearLogoutCallback() {
  logoutCallback = null;
}
