import { describe, expect, it } from 'vitest';
import {
  formatCurrencyFromPence,
  formatMiles,
  formatMilesWithUnit,
  formatMonths,
  formatPence,
  formatPercent,
} from '../src/lib/format';
import { milesAtRateToPence, roundPence, vatOnPence } from '../src/lib/money';

describe('formatting (UT-069..072, NFR-004)', () => {
  it('UT-069 rounds mileage to the nearest whole mile with separators', () => {
    expect(formatMiles(17442.8571)).toBe('17,443');
    expect(formatMilesWithUnit(17442.8571)).toBe('17,443 miles');
  });

  it('uses the singular for one mile', () => {
    expect(formatMilesWithUnit(1)).toBe('1 mile');
  });

  it('UT-070 formats currency to two decimals with no float artefacts', () => {
    expect(formatCurrencyFromPence(139543)).toBe('£1,395.43');
    expect(formatCurrencyFromPence(0)).toBe('£0.00');
  });

  it('UT-071 formats a percentage to one decimal', () => {
    expect(formatPercent(38.888888)).toBe('38.9%');
    expect(formatPercent(61.5)).toBe('61.5%');
  });

  it('UT-072 formats a pence-per-mile rate', () => {
    expect(formatPence(10.5)).toBe('10.5p/mile');
    expect(formatPence(8)).toBe('8p/mile');
  });

  it('formats months', () => {
    expect(formatMonths(22)).toBe('22 months');
    expect(formatMonths(1)).toBe('1 month');
  });

  it('renders a dash rather than NaN for missing values', () => {
    expect(formatMiles(null)).toBe('—');
    expect(formatCurrencyFromPence(undefined)).toBe('—');
    expect(formatPercent(Number.NaN)).toBe('—');
  });
});

describe('money arithmetic', () => {
  it('keeps charges in integer pence', () => {
    expect(milesAtRateToPence(17442.857142857, 8)).toBe(139543);
    expect(milesAtRateToPence(2000, 10.5)).toBe(21000);
  });

  it('never returns a negative charge', () => {
    expect(milesAtRateToPence(-500, 10)).toBe(0);
  });

  it('rounds VAT to whole pence', () => {
    expect(vatOnPence(20000, 20)).toBe(4000);
    expect(vatOnPence(139543, 20)).toBe(27909);
  });

  it('rounds half away from zero', () => {
    expect(roundPence(0.5)).toBe(1);
    expect(roundPence(1.4999)).toBe(1);
    expect(roundPence(2.5)).toBe(3);
  });
});
