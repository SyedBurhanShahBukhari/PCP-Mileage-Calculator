/**
 * Optional local persistence (spec FR-026, NFR-005).
 *
 * Inputs never leave the browser. Storage is best-effort: a corrupt or blocked
 * store falls back to defaults rather than breaking the calculator (UT-079).
 */

import { EMPTY_FORM } from './defaults';
import type { CalculatorFormValues } from './types';

export const STORAGE_KEY = 'pcp-mileage-calculator/v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Merges stored values over the defaults, keeping only expected key types. */
export function parseStoredState(raw: string | null): CalculatorFormValues | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;

  const restored: CalculatorFormValues = { ...EMPTY_FORM };
  for (const key of Object.keys(EMPTY_FORM) as (keyof CalculatorFormValues)[]) {
    const stored = parsed[key];
    const expected = typeof EMPTY_FORM[key];
    if (typeof stored === expected) {
      // Widening once here keeps the loop readable; the type check above guards it.
      (restored as unknown as Record<string, unknown>)[key] = stored;
    }
  }
  return restored;
}

export function loadSavedForm(storage: Storage | undefined = safeStorage()): CalculatorFormValues | null {
  if (!storage) return null;
  try {
    return parseStoredState(storage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function saveForm(
  values: CalculatorFormValues,
  storage: Storage | undefined = safeStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {
    /* Private browsing or a full quota must never break the calculator. */
  }
}

export function clearSavedForm(storage: Storage | undefined = safeStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    /* Ignored for the same reason as above. */
  }
}

function safeStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}
