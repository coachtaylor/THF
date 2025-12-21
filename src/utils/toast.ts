// Toast Utility for non-React contexts
// Provides a way for services to trigger toast notifications

import { Alert } from 'react-native';

type ToastHandler = (title: string, message?: string) => void;

// Global toast handlers that will be set by ToastProvider
let errorHandler: ToastHandler | null = null;
let successHandler: ToastHandler | null = null;
let warningHandler: ToastHandler | null = null;
let infoHandler: ToastHandler | null = null;

/**
 * Register toast handlers from ToastProvider
 * Called by ToastProvider on mount
 */
export function registerToastHandlers(handlers: {
  showError: ToastHandler;
  showSuccess: ToastHandler;
  showWarning: ToastHandler;
  showInfo: ToastHandler;
}): void {
  errorHandler = handlers.showError;
  successHandler = handlers.showSuccess;
  warningHandler = handlers.showWarning;
  infoHandler = handlers.showInfo;
}

/**
 * Unregister toast handlers
 * Called by ToastProvider on unmount
 */
export function unregisterToastHandlers(): void {
  errorHandler = null;
  successHandler = null;
  warningHandler = null;
  infoHandler = null;
}

/**
 * Show an error toast from anywhere in the app
 * Falls back to Alert if toast handlers not available
 */
export function showErrorToast(title: string, message?: string): void {
  if (errorHandler) {
    errorHandler(title, message);
  } else {
    // Fallback to Alert if ToastProvider not mounted
    Alert.alert(title, message);
  }
}

/**
 * Show a success toast from anywhere in the app
 */
export function showSuccessToast(title: string, message?: string): void {
  if (successHandler) {
    successHandler(title, message);
  } else {
    Alert.alert(title, message);
  }
}

/**
 * Show a warning toast from anywhere in the app
 */
export function showWarningToast(title: string, message?: string): void {
  if (warningHandler) {
    warningHandler(title, message);
  } else {
    Alert.alert(title, message);
  }
}

/**
 * Show an info toast from anywhere in the app
 */
export function showInfoToast(title: string, message?: string): void {
  if (infoHandler) {
    infoHandler(title, message);
  } else {
    Alert.alert(title, message);
  }
}

/**
 * Notify user of a critical error
 * Use for errors that affect app functionality
 */
export function notifyError(error: Error | string, context?: string): void {
  const message = error instanceof Error ? error.message : error;
  const title = context ? `Error: ${context}` : 'Error';
  showErrorToast(title, message);
}

/**
 * Notify user of a sync failure
 */
export function notifySyncError(): void {
  showWarningToast(
    'Sync Failed',
    'Your data will sync when connection is restored.'
  );
}

/**
 * Notify user of successful save
 */
export function notifySaveSuccess(what: string = 'Changes'): void {
  showSuccessToast(`${what} saved`, 'Your data has been saved.');
}
