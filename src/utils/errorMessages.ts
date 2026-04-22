/**
 * Error Message Sanitization Utility
 *
 * SECURITY: This module prevents internal error details from being exposed to users.
 * Raw error messages from Supabase, network calls, or internal systems may contain:
 * - Database structure information
 * - Internal error codes
 * - Stack traces
 * - Implementation details
 *
 * All user-facing error messages should be sanitized through this utility.
 */

// Map of known error messages to user-friendly alternatives
const errorMessageMap: Record<string, string> = {
  // Authentication errors
  'Invalid login credentials': 'Email or password is incorrect. Please try again.',
  'Email not confirmed': 'Please verify your email address before signing in.',
  'User already registered': 'An account with this email already exists.',
  'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
  'Signup requires a valid password': 'Please enter a valid password.',
  'User not found': 'No account found with this email address.',
  'Invalid email or password': 'Email or password is incorrect. Please try again.',

  // Session/token errors
  'JWT expired': 'Your session has expired. Please sign in again.',
  'Invalid token': 'Your session is invalid. Please sign in again.',
  'Session expired': 'Your session has expired. Please sign in again.',
  'Refresh token not found': 'Please sign in again.',
  'Invalid refresh token': 'Please sign in again.',

  // Rate limiting
  'Rate limit exceeded': 'Too many attempts. Please wait a moment and try again.',
  'Too many requests': 'Too many attempts. Please wait a moment and try again.',
  'For security purposes, you can only request this once every 60 seconds':
    'Please wait a moment before requesting another email.',

  // Network errors
  'Network request failed': 'Unable to connect. Please check your internet connection.',
  'Failed to fetch': 'Unable to connect. Please check your internet connection.',
  'Network Error': 'Unable to connect. Please check your internet connection.',
  'timeout': 'The request timed out. Please try again.',

  // Email verification
  'Email link is invalid or has expired': 'This link has expired. Please request a new one.',
  'Token has expired or is invalid': 'This link has expired. Please request a new one.',
  'otp_expired': 'This verification link has expired. Please request a new one.',

  // Password reset
  'Password recovery requires an email': 'Please enter your email address.',
  'Unable to validate email address: invalid format': 'Please enter a valid email address.',

  // Account lockout
  'Account locked': 'Your account has been temporarily locked. Please try again later.',

  // Generic database errors (should never show internal details)
  'Database error': 'Something went wrong. Please try again.',
  'relation "users" does not exist': 'Something went wrong. Please try again.',
  'column "password" does not exist': 'Something went wrong. Please try again.',
  'duplicate key value violates unique constraint': 'This information already exists.',

  // Supabase specific
  'new row violates row-level security policy': 'You do not have permission to perform this action.',
  'permission denied': 'You do not have permission to perform this action.',
};

// Error categories for logging purposes (not shown to users)
type ErrorCategory = 'auth' | 'network' | 'database' | 'validation' | 'unknown';

/**
 * Sanitize an error message for user display.
 * Maps known error messages to user-friendly alternatives.
 * Returns a generic message for unknown errors to prevent information leakage.
 *
 * @param error - The error object or message string
 * @returns A user-friendly error message safe to display
 */
export function sanitizeErrorMessage(error: Error | string | unknown): string {
  const message = getErrorMessage(error);

  // Check for exact match first
  if (errorMessageMap[message]) {
    return errorMessageMap[message];
  }

  // Check for partial matches (error messages that contain key phrases)
  for (const [key, userMessage] of Object.entries(errorMessageMap)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return userMessage;
    }
  }

  // Log the original error for debugging (only in development)
  if (__DEV__) {
    console.warn('🔒 Unsanitized error (add to errorMessages.ts if common):', message);
  }

  // Return generic message for unknown errors
  return 'Something went wrong. Please try again.';
}

/**
 * Extract the error message string from various error types
 */
function getErrorMessage(error: Error | string | unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    // Handle Supabase error format
    if ('message' in error && typeof (error as any).message === 'string') {
      return (error as any).message;
    }
    // Handle error_description format
    if ('error_description' in error && typeof (error as any).error_description === 'string') {
      return (error as any).error_description;
    }
  }

  return 'Unknown error';
}

/**
 * Categorize an error for analytics/logging purposes.
 * This helps identify patterns without exposing details.
 */
export function categorizeError(error: Error | string | unknown): ErrorCategory {
  const message = getErrorMessage(error).toLowerCase();

  if (
    message.includes('login') ||
    message.includes('password') ||
    message.includes('email') ||
    message.includes('token') ||
    message.includes('session') ||
    message.includes('auth')
  ) {
    return 'auth';
  }

  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    message.includes('connection')
  ) {
    return 'network';
  }

  if (
    message.includes('database') ||
    message.includes('relation') ||
    message.includes('column') ||
    message.includes('constraint')
  ) {
    return 'database';
  }

  if (
    message.includes('invalid') ||
    message.includes('required') ||
    message.includes('format')
  ) {
    return 'validation';
  }

  return 'unknown';
}

/**
 * Log an error safely for debugging/analytics.
 * In development, logs full details. In production, logs only category.
 */
export function logError(context: string, error: Error | string | unknown): void {
  const category = categorizeError(error);

  if (__DEV__) {
    console.error(`❌ [${context}] Error (${category}):`, error);
  } else {
    // In production, only log the category to prevent PII leakage
    console.error(`❌ [${context}] Error category: ${category}`);
  }
}
