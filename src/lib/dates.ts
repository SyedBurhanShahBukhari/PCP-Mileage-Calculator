/** Calendar maths for date mode (spec §4.3, UT-019..023). */

const MS_PER_DAY = 86_400_000;

/** Parses `YYYY-MM-DD` into a UTC-midnight Date, or null when unparseable. */
export function parseIsoDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  // Rejects impossible dates such as 2026-02-30, which would roll over.
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return date;
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Adds whole calendar months, clamping to the last valid day of the target
 * month so 31 January + 1 month is 28/29 February rather than 2/3 March.
 */
export function addCalendarMonths(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const target = new Date(Date.UTC(year, month + months, 1));
  const daysInTargetMonth = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, daysInTargetMonth));
  return target;
}

export function differenceInDays(later: Date, earlier: Date): number {
  return Math.round((later.getTime() - earlier.getTime()) / MS_PER_DAY);
}

/** Elapsed fraction of the term, clamped to 0..1 (UT-021..023). */
export function elapsedFraction(start: Date, end: Date, asOf: Date): number {
  const termDays = differenceInDays(end, start);
  if (termDays <= 0) return 1;
  const elapsedDays = differenceInDays(asOf, start);
  return Math.min(Math.max(elapsedDays / termDays, 0), 1);
}

/** e.g. `18 September 2028` — used for the contract end date readout. */
export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** Today as `YYYY-MM-DD`, used as the default injected as-of date. */
export function todayIso(): string {
  const now = new Date();
  return toIsoDate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}
