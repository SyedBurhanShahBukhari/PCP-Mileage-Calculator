/**
 * Money helpers (spec §40, NFR-004).
 *
 * All currency is carried as **integer pence** so no floating-point artefact
 * such as `£1395.4285680003` can ever reach the UI. Excess-mileage rates are
 * quoted in pence per mile, so `miles × rate` is already a pence amount.
 */

/**
 * Rounds to the nearest integer, half away from zero, with a tiny epsilon
 * nudge so values such as `0.145 * 100` land on the intuitive side.
 */
export function roundPence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);
  return sign * Math.round(abs + Number.EPSILON * abs);
}

/** Excess miles at a pence-per-mile rate, as integer pence. */
export function milesAtRateToPence(miles: number, ratePence: number): number {
  if (!Number.isFinite(miles) || !Number.isFinite(ratePence)) return 0;
  return roundPence(Math.max(miles, 0) * Math.max(ratePence, 0));
}

/** Applies a VAT percentage to a pence amount, returning integer pence. */
export function vatOnPence(basePence: number, vatRatePercent: number): number {
  if (!Number.isFinite(vatRatePercent) || vatRatePercent <= 0) return 0;
  return roundPence((basePence * vatRatePercent) / 100);
}

export function penceToPounds(pence: number): number {
  return pence / 100;
}
