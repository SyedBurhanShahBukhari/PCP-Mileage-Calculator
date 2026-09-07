/** Numeric input parsing (spec FR-018, UT-001..006). */

export type ParseResult =
  | { ok: true; value: number }
  | { ok: true; value: null; empty: true }
  | { ok: false; reason: 'invalid' };

/** Characters we accept as thousands separators in pasted values. */
const SEPARATORS = /[,'\s]/g;

/**
 * Parses a user-entered number, tolerating the separators people actually
 * paste — `30,000`, `18 450`, `1 234.5`. Returns `{ value: null, empty: true }`
 * for blank input so optional fields can distinguish "blank" from "zero".
 */
export function parseNumber(raw: string | number | null | undefined): ParseResult {
  if (raw === null || raw === undefined) return { ok: true, value: null, empty: true };
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? { ok: true, value: raw } : { ok: false, reason: 'invalid' };
  }

  const trimmed = raw.trim();
  if (trimmed === '') return { ok: true, value: null, empty: true };

  const cleaned = trimmed.replace(SEPARATORS, '');
  // Reject anything that is not a plain (optionally signed) decimal number.
  if (!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(cleaned)) return { ok: false, reason: 'invalid' };

  const value = Number(cleaned);
  if (!Number.isFinite(value)) return { ok: false, reason: 'invalid' };
  return { ok: true, value };
}

/** Convenience wrapper: the parsed number, or null when blank/invalid. */
export function parseNumberOrNull(raw: string | number | null | undefined): number | null {
  const result = parseNumber(raw);
  return result.ok ? result.value : null;
}

/**
 * Formats a number back into the input field with thousands separators, so the
 * value the user sees matches the value they would have typed.
 */
export function formatNumberForInput(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '';
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 4 }).format(value);
}
