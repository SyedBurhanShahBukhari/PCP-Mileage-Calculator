import { describe, expect, it } from 'vitest';
import {
  addCalendarMonths,
  differenceInDays,
  elapsedFraction,
  formatLongDate,
  parseIsoDate,
  toIsoDate,
} from '../src/lib/dates';

const iso = (value: string) => parseIsoDate(value) as Date;

describe('date helpers (UT-019..023)', () => {
  it('UT-019 adds calendar months to a normal date', () => {
    expect(toIsoDate(addCalendarMonths(iso('2026-01-15'), 36))).toBe('2029-01-15');
  });

  it('UT-020 clamps a month-end date to the shorter target month', () => {
    expect(toIsoDate(addCalendarMonths(iso('2026-01-31'), 1))).toBe('2026-02-28');
  });

  it('handles a leap-year month end', () => {
    expect(toIsoDate(addCalendarMonths(iso('2028-01-31'), 1))).toBe('2028-02-29');
  });

  it('UT-021 reports zero elapsed at the start date', () => {
    const start = iso('2026-01-15');
    expect(elapsedFraction(start, addCalendarMonths(start, 36), start)).toBe(0);
  });

  it('UT-022 reports a full term at the end date', () => {
    const start = iso('2026-01-15');
    const end = addCalendarMonths(start, 36);
    expect(elapsedFraction(start, end, end)).toBe(1);
  });

  it('UT-023 clamps past the end date', () => {
    const start = iso('2026-01-15');
    const end = addCalendarMonths(start, 36);
    expect(elapsedFraction(start, end, iso('2030-06-01'))).toBe(1);
  });

  it('clamps before the start date rather than going negative', () => {
    const start = iso('2026-01-15');
    expect(elapsedFraction(start, addCalendarMonths(start, 36), iso('2025-01-01'))).toBe(0);
  });

  it('rejects impossible and malformed dates', () => {
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('15/01/2026')).toBeNull();
    expect(parseIsoDate('')).toBeNull();
    expect(parseIsoDate(null)).toBeNull();
  });

  it('counts whole days between dates', () => {
    expect(differenceInDays(iso('2026-01-31'), iso('2026-01-01'))).toBe(30);
  });

  it('formats a long UK date', () => {
    expect(formatLongDate(iso('2028-09-18'))).toBe('18 September 2028');
  });
});
