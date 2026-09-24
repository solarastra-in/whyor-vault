import { User } from 'firebase/auth';

export interface AuthSessionHint {
  uid: string;
  email: string | null;
  displayName: string | null;
  lastActive: number;
  hasPersistedSession: boolean;
}

const SESSION_HINT_STORAGE_KEY = 'whyor_auth_session_hint_v1';
const MAX_SESSION_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days retention

/**
 * Saves authenticated session metadata into persistent storage to preserve
 * awareness across browser refreshes, latency spikes, and IndexedDB cold boots.
 */
export function saveAuthSessionHint(user: { uid: string; email?: string | null; displayName?: string | null }): void {
  if (typeof window === 'undefined') return;
  try {
    const hint: AuthSessionHint = {
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName || null,
      lastActive: Date.now(),
      hasPersistedSession: true,
    };
    localStorage.setItem(SESSION_HINT_STORAGE_KEY, JSON.stringify(hint));
  } catch (err) {
    console.warn('[AuthPersistence] Failed to write session hint to localStorage:', err);
  }
}

/**
 * Retrieves the stored session hint if present and within retention limits.
 */
export function getAuthSessionHint(): AuthSessionHint | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_HINT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSessionHint;
    if (!parsed || !parsed.uid) return null;

    // Check expiration window
    if (Date.now() - parsed.lastActive > MAX_SESSION_AGE_MS) {
      clearAuthSessionHint();
      return null;
    }
    return parsed;
  } catch (err) {
    console.warn('[AuthPersistence] Failed to read session hint:', err);
    return null;
  }
}

/**
 * Returns true if the client was previously authenticated and is expected
 * to rehydrate its session credentials from Firebase Auth persistence.
 */
export function hasActiveSessionHint(): boolean {
  return getAuthSessionHint() !== null;
}

/**
 * Purges the session hint upon explicit user sign out.
 */
export function clearAuthSessionHint(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_HINT_STORAGE_KEY);
  } catch (err) {
    console.warn('[AuthPersistence] Failed to remove session hint:', err);
  }
}

/**
 * Utility promise-based sleep delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Verifies that the user's Firebase Auth security token is freshly fetched and
 * propagated to memory before querying protected Firestore documents.
 * Times out gracefully so it never blocks execution indefinitely.
 */
export async function waitForTokenStabilization(user: User, timeoutMs: number = 3000): Promise<string | null> {
  if (!user) return null;
  try {
    const tokenPromise = user.getIdToken(false);
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
    const token = await Promise.race([tokenPromise, timeoutPromise]);
    return token;
  } catch (err) {
    console.warn('[AuthPersistence] Token stabilization encountered warning:', err);
    return null;
  }
}

/**
 * Generic retry executor with exponential backoff for handling startup latency
 * when fetching vault configurations over transient network/Firestore connections.
 */
export async function executeWithRetry<T>(
  action: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoffFactor?: number;
    onRetry?: (attempt: number, err: any) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 2, delayMs = 400, backoffFactor = 1.5, onRetry } = options;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await action();
    } catch (err) {
      if (attempt > maxRetries) {
        throw err;
      }
      if (onRetry) {
        onRetry(attempt, err);
      }
      await delay(currentDelay);
      currentDelay = Math.round(currentDelay * backoffFactor);
    }
  }

  throw new Error('[AuthPersistence] Retry budget exhausted.');
}
