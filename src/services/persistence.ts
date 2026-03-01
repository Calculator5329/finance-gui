const STORAGE_PREFIX = 'finance-gui';

function getKey(key: string): string {
  return `${STORAGE_PREFIX}:${key}`;
}

/**
 * Save a value to localStorage as JSON.
 */
export function save<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(getKey(key), serialized);
  } catch (error) {
    console.warn(`[Persistence] Failed to save "${key}":`, error);
  }
}

/**
 * Load a value from localStorage, parsing as JSON.
 * Returns the fallback if the key doesn't exist or parsing fails.
 */
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(getKey(key));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`[Persistence] Failed to load "${key}":`, error);
    return fallback;
  }
}

/**
 * Remove a value from localStorage.
 */
export function remove(key: string): void {
  localStorage.removeItem(getKey(key));
}

/**
 * Clear all finance-gui keys from localStorage.
 */
export function clearAll(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}
