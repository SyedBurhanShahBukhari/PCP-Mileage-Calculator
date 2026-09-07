/** Display formatting. Nothing here feeds back into a calculation. */

const milesFormatter = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });
const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** `17442.8571` -> `17,443` (UT-069). */
export function formatMiles(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return milesFormatter.format(Math.round(value));
}

/** `17442.8571` -> `17,443 miles`. */
export function formatMilesWithUnit(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const rounded = Math.round(value);
  return `${milesFormatter.format(rounded)} ${Math.abs(rounded) === 1 ? 'mile' : 'miles'}`;
}

/** Integer pence -> `£1,395.43` (UT-070). */
export function formatCurrencyFromPence(pence: number | null | undefined): string {
  if (pence === null || pence === undefined || !Number.isFinite(pence)) return '—';
  return currencyFormatter.format(pence / 100);
}

/** `38.888888` -> `38.9%` (UT-071). */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${value.toFixed(decimals)}%`;
}

/** `10.5` -> `10.5p/mile`; `8` -> `8p/mile` (UT-072). */
export function formatPence(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const trimmed = Number(value.toFixed(2));
  return `${trimmed}p/mile`;
}

/** Fractional months read better as whole months in body copy. */
export function formatMonths(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const rounded = Math.round(value);
  return `${rounded} ${rounded === 1 ? 'month' : 'months'}`;
}
