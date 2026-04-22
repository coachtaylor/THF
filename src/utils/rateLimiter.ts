/**
 * Client-side rate limiter for security-sensitive operations
 *
 * Provides protection against:
 * - Brute force attacks on login/signup
 * - Automated password reset abuse
 * - Deep link verification spam
 *
 * Uses a sliding window algorithm with exponential backoff.
 * State is persisted to AsyncStorage to survive app restarts.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const RATE_LIMIT_STORAGE_KEY = '@transfitness/rate_limits';
let persistenceInitialized = false;

interface RateLimitEntry {
  attempts: number;
  windowStart: number;
  lockedUntil: number | null;
}

interface RateLimitConfig {
  /** Maximum attempts allowed in the time window */
  maxAttempts: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Lockout duration in milliseconds after exceeding limit */
  lockoutMs: number;
  /** Enable exponential backoff on repeated lockouts */
  exponentialBackoff: boolean;
}

const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  // Authentication operations
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    lockoutMs: 5 * 60 * 1000, // 5 minute lockout
    exponentialBackoff: true,
  },
  signup: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutMs: 30 * 60 * 1000, // 30 minute lockout
    exponentialBackoff: false,
  },
  passwordReset: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutMs: 60 * 60 * 1000, // 1 hour lockout
    exponentialBackoff: false,
  },
  // Deep link verification
  emailVerification: {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
    lockoutMs: 15 * 60 * 1000, // 15 minute lockout
    exponentialBackoff: false,
  },
  magicLink: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    lockoutMs: 15 * 60 * 1000, // 15 minute lockout
    exponentialBackoff: false,
  },
  // API operations
  profileSync: {
    maxAttempts: 30,
    windowMs: 60 * 1000, // 1 minute
    lockoutMs: 60 * 1000, // 1 minute lockout
    exponentialBackoff: false,
  },
  feedbackSubmit: {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutMs: 60 * 60 * 1000, // 1 hour lockout
    exponentialBackoff: false,
  },
};

// In-memory storage for rate limit entries
const rateLimitStore = new Map<string, RateLimitEntry>();

// Track consecutive lockouts for exponential backoff
const lockoutCounts = new Map<string, number>();

/**
 * Generate a unique key for rate limiting
 */
function getKey(operation: string, identifier?: string): string {
  return identifier ? `${operation}:${identifier}` : operation;
}

/**
 * Load persisted rate limits from AsyncStorage on app start
 * Only restores entries that are still in lockout (active)
 */
async function loadPersistedRateLimits(): Promise<void> {
  if (persistenceInitialized) return;

  try {
    const stored = await AsyncStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const now = Date.now();

      // Restore rate limit entries that are still locked
      if (parsed.store) {
        for (const [key, entry] of Object.entries(parsed.store)) {
          const e = entry as RateLimitEntry;
          // Only restore if still locked out
          if (e.lockedUntil && e.lockedUntil > now) {
            rateLimitStore.set(key, e);
          }
        }
      }

      // Restore lockout counts
      if (parsed.lockouts) {
        for (const [key, count] of Object.entries(parsed.lockouts)) {
          lockoutCounts.set(key, count as number);
        }
      }

      if (__DEV__) {
        console.log(`[RateLimiter] Restored ${rateLimitStore.size} active lockouts`);
      }
    }
  } catch (error) {
    if (__DEV__) console.error('[RateLimiter] Failed to load persisted state:', error);
  }

  persistenceInitialized = true;
}

/**
 * Persist rate limits to AsyncStorage
 * Called after modifications to ensure lockouts survive app restart
 */
async function persistRateLimits(): Promise<void> {
  try {
    const data = {
      store: Object.fromEntries(rateLimitStore),
      lockouts: Object.fromEntries(lockoutCounts),
      savedAt: Date.now(),
    };
    await AsyncStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    if (__DEV__) console.error('[RateLimiter] Failed to persist state:', error);
  }
}

// Initialize persistence on module load
loadPersistedRateLimits();

/**
 * Clean up expired entries from the store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    // Remove entries where both the window and lockout have expired
    const windowExpired = now - entry.windowStart > DEFAULT_CONFIGS.login.windowMs * 2;
    const lockoutExpired = !entry.lockedUntil || now > entry.lockedUntil;

    if (windowExpired && lockoutExpired) {
      rateLimitStore.delete(key);
      lockoutCounts.delete(key);
    }
  }
}

/**
 * Check if an operation is rate limited
 *
 * @param operation - The operation type (login, signup, etc.)
 * @param identifier - Optional identifier (e.g., email, IP)
 * @returns Object with allowed status and retry info
 */
export function checkRateLimit(
  operation: keyof typeof DEFAULT_CONFIGS,
  identifier?: string
): { allowed: boolean; retryAfterMs?: number; remainingAttempts?: number } {
  // Run cleanup occasionally
  if (Math.random() < 0.1) {
    cleanupExpiredEntries();
  }

  const config = DEFAULT_CONFIGS[operation];
  if (!config) {
    console.warn(`Unknown rate limit operation: ${operation}`);
    return { allowed: true };
  }

  const key = getKey(operation, identifier);
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Check if currently locked out
  if (entry?.lockedUntil && now < entry.lockedUntil) {
    return {
      allowed: false,
      retryAfterMs: entry.lockedUntil - now,
    };
  }

  // Check if within rate limit window
  if (entry) {
    const windowElapsed = now - entry.windowStart;

    // Window expired, reset
    if (windowElapsed > config.windowMs) {
      rateLimitStore.set(key, {
        attempts: 0,
        windowStart: now,
        lockedUntil: null,
      });
      return { allowed: true, remainingAttempts: config.maxAttempts };
    }

    // Check if at limit
    if (entry.attempts >= config.maxAttempts) {
      // Calculate lockout duration with exponential backoff if enabled
      let lockoutDuration = config.lockoutMs;
      if (config.exponentialBackoff) {
        const consecutiveLockouts = lockoutCounts.get(key) || 0;
        lockoutDuration = config.lockoutMs * Math.pow(2, Math.min(consecutiveLockouts, 5));
        lockoutCounts.set(key, consecutiveLockouts + 1);
      }

      const lockedUntil = now + lockoutDuration;
      rateLimitStore.set(key, { ...entry, lockedUntil });

      return {
        allowed: false,
        retryAfterMs: lockoutDuration,
      };
    }

    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - entry.attempts,
    };
  }

  // No entry exists, create one
  rateLimitStore.set(key, {
    attempts: 0,
    windowStart: now,
    lockedUntil: null,
  });

  return { allowed: true, remainingAttempts: config.maxAttempts };
}

/**
 * Record an attempt for rate limiting
 * Call this AFTER checking the rate limit
 *
 * @param operation - The operation type
 * @param identifier - Optional identifier
 * @param success - Whether the attempt was successful (resets on success)
 */
export function recordAttempt(
  operation: keyof typeof DEFAULT_CONFIGS,
  identifier?: string,
  success: boolean = false
): void {
  const key = getKey(operation, identifier);
  const entry = rateLimitStore.get(key);

  if (success) {
    // Successful attempt - clear the rate limit
    rateLimitStore.delete(key);
    lockoutCounts.delete(key);
    persistRateLimits(); // Persist after clearing
    return;
  }

  if (entry) {
    rateLimitStore.set(key, {
      ...entry,
      attempts: entry.attempts + 1,
    });
  } else {
    rateLimitStore.set(key, {
      attempts: 1,
      windowStart: Date.now(),
      lockedUntil: null,
    });
  }

  // Persist after recording failed attempt
  persistRateLimits();
}

/**
 * Clear rate limit for a specific operation/identifier
 * Use after successful authentication to reset lockouts
 */
export function clearRateLimit(
  operation: keyof typeof DEFAULT_CONFIGS,
  identifier?: string
): void {
  const key = getKey(operation, identifier);
  rateLimitStore.delete(key);
  lockoutCounts.delete(key);
  persistRateLimits(); // Persist after clearing
}

/**
 * Format retry time for user display
 */
export function formatRetryTime(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours !== 1 ? 's' : ''}`;
}

/**
 * Rate limiter wrapper for async operations
 * Automatically handles checking, recording, and error messages
 */
export async function withRateLimit<T>(
  operation: keyof typeof DEFAULT_CONFIGS,
  identifier: string | undefined,
  fn: () => Promise<T>
): Promise<{ success: true; result: T } | { success: false; error: string; retryAfterMs: number }> {
  const check = checkRateLimit(operation, identifier);

  if (!check.allowed) {
    const retryTime = formatRetryTime(check.retryAfterMs!);
    return {
      success: false,
      error: `Too many attempts. Please try again in ${retryTime}.`,
      retryAfterMs: check.retryAfterMs!,
    };
  }

  try {
    const result = await fn();
    recordAttempt(operation, identifier, true);
    return { success: true, result };
  } catch (error) {
    recordAttempt(operation, identifier, false);
    throw error;
  }
}

/**
 * Get current rate limit status (for debugging/display)
 */
export function getRateLimitStatus(
  operation: keyof typeof DEFAULT_CONFIGS,
  identifier?: string
): {
  attempts: number;
  maxAttempts: number;
  isLocked: boolean;
  lockedUntil: Date | null;
  windowResets: Date;
} {
  const config = DEFAULT_CONFIGS[operation];
  const key = getKey(operation, identifier);
  const entry = rateLimitStore.get(key);
  const now = Date.now();

  if (!entry) {
    return {
      attempts: 0,
      maxAttempts: config.maxAttempts,
      isLocked: false,
      lockedUntil: null,
      windowResets: new Date(now + config.windowMs),
    };
  }

  return {
    attempts: entry.attempts,
    maxAttempts: config.maxAttempts,
    isLocked: entry.lockedUntil !== null && now < entry.lockedUntil,
    lockedUntil: entry.lockedUntil ? new Date(entry.lockedUntil) : null,
    windowResets: new Date(entry.windowStart + config.windowMs),
  };
}
