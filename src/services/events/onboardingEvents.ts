// Simple event emitter for onboarding/auth state changes
// This allows screens to signal the App component
// to switch between OnboardingNavigator and MainNavigator

type OnboardingCompleteCallback = () => void;
type LogoutCallback = () => void;

let onboardingCompleteCallback: OnboardingCompleteCallback | null = null;
let logoutCallback: LogoutCallback | null = null;

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
