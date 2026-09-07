import { describe, expect, it } from 'vitest';
import { formatNumberForInput, parseNumber, parseNumberOrNull } from '../src/lib/parse';

describe('parseNumber (UT-001..006, IT-020)', () => {
  it('UT-001 parses a plain integer', () => {
    expect(parseNumber('30000')).toEqual({ ok: true, value: 30000 });
  });

  it('UT-002 parses a comma-separated value', () => {
    expect(parseNumber('30,000')).toEqual({ ok: true, value: 30000 });
  });

  it('UT-003 parses a value with surrounding spaces', () => {
    expect(parseNumber(' 18450 ')).toEqual({ ok: true, value: 18450 });
  });

  it('IT-020 parses a value with an internal space separator', () => {
    expect(parseNumber('18 450')).toEqual({ ok: true, value: 18450 });
  });

  it('parses a non-breaking-space separator', () => {
    expect(parseNumber('18 450')).toEqual({ ok: true, value: 18450 });
  });

  it('UT-004 parses a decimal rate', () => {
    expect(parseNumber('10.5')).toEqual({ ok: true, value: 10.5 });
  });

  it('UT-005 rejects alphabetic input', () => {
    expect(parseNumber('ten')).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects partially numeric input', () => {
    expect(parseNumber('30000 miles')).toEqual({ ok: false, reason: 'invalid' });
    expect(parseNumber('1.2.3')).toEqual({ ok: false, reason: 'invalid' });
  });

  it('UT-006 treats an empty optional value as not supplied', () => {
    expect(parseNumber('')).toEqual({ ok: true, value: null, empty: true });
    expect(parseNumber('   ')).toEqual({ ok: true, value: null, empty: true });
  });

  it('never returns NaN or Infinity', () => {
    expect(parseNumberOrNull('Infinity')).toBeNull();
    expect(parseNumberOrNull('NaN')).toBeNull();
  });

  it('formats values back into an input field', () => {
    expect(formatNumberForInput(30000)).toBe('30,000');
    expect(formatNumberForInput(null)).toBe('');
  });
});
