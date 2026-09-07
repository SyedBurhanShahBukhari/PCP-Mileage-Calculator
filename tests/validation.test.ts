import { describe, expect, it } from 'vitest';
import { EMPTY_FORM } from '../src/lib/defaults';
import { validateCalculatorInput, validatePlannedMileage } from '../src/lib/validation';
import type { CalculatorFormValues } from '../src/lib/types';

const AS_OF = '2026-09-07';

const form = (overrides: Partial<CalculatorFormValues> = {}): CalculatorFormValues => ({
  ...EMPTY_FORM,
  allowanceMode: 'total',
  totalAllowance: '30,000',
  contractLength: '36',
  startOdometer: '0',
  currentOdometer: '18,450',
  elapsedMonths: '14',
  chargeRatePence: '8',
  endAction: 'return',
  ...overrides,
});

const messagesFor = (values: CalculatorFormValues, field: string) => {
  const outcome = validateCalculatorInput(values, AS_OF);
  if (outcome.ok) return [];
  return outcome.errors.filter((error) => error.field === field).map((error) => error.message);
};

describe('validateCalculatorInput — happy paths', () => {
  it('normalises comma-separated values', () => {
    const outcome = validateCalculatorInput(form(), AS_OF);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.value.totalAllowanceMiles).toBe(30000);
    expect(outcome.value.currentOdometerMiles).toBe(18450);
    expect(outcome.value.chargeRatePence).toBe(8);
    expect(outcome.value.asOfDate).toBe(AS_OF);
  });

  it('IT-015 converts an annual allowance', () => {
    const outcome = validateCalculatorInput(
      form({ allowanceMode: 'annual', annualAllowance: '10,000', totalAllowance: '' }),
      AS_OF,
    );
    expect(outcome.ok && outcome.value.totalAllowanceMiles).toBe(30000);
  });

  it('IT-016 converts an annual allowance over a 42-month term', () => {
    const outcome = validateCalculatorInput(
      form({ allowanceMode: 'annual', annualAllowance: '8000', contractLength: '42', totalAllowance: '' }),
      AS_OF,
    );
    expect(outcome.ok && outcome.value.totalAllowanceMiles).toBe(28000);
  });

  it('IT-006 accepts a blank charge rate', () => {
    const outcome = validateCalculatorInput(form({ chargeRatePence: '' }), AS_OF);
    expect(outcome.ok && outcome.value.chargeRatePence).toBeNull();
  });

  it('accepts an explicit zero rate', () => {
    const outcome = validateCalculatorInput(form({ chargeRatePence: '0' }), AS_OF);
    expect(outcome.ok && outcome.value.chargeRatePence).toBe(0);
  });

  it('IT-013 prefers a start date over manual elapsed months', () => {
    const outcome = validateCalculatorInput(
      form({ contractStartDate: '2025-07-01', elapsedMonths: '' }),
      AS_OF,
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.value.contractStartDate).toBe('2025-07-01');
    expect(outcome.value.elapsedMonthsManual).toBeNull();
  });

  it('defaults a blank starting odometer to zero', () => {
    const outcome = validateCalculatorInput(form({ startOdometer: '' }), AS_OF);
    expect(outcome.ok && outcome.value.startOdometerMiles).toBe(0);
  });
});

describe('validateCalculatorInput — field rules (spec §7)', () => {
  it('requires an annual allowance in annual mode', () => {
    expect(
      messagesFor(form({ allowanceMode: 'annual', annualAllowance: '', totalAllowance: '' }), 'annualAllowance'),
    ).toContain('Enter your annual mileage allowance.');
  });

  it('rejects a zero total allowance', () => {
    expect(messagesFor(form({ totalAllowance: '0' }), 'totalAllowance')[0]).toMatch(
      /greater than 0/,
    );
  });

  it('rejects a contract length outside 1–84 months', () => {
    expect(messagesFor(form({ contractLength: '96' }), 'contractLength')).toContain(
      'Contract length must be between 1 and 84 months.',
    );
    expect(messagesFor(form({ contractLength: '0' }), 'contractLength')).toContain(
      'Contract length must be between 1 and 84 months.',
    );
  });

  it('UT-014/IT-021 rejects a current odometer below the starting odometer', () => {
    expect(
      messagesFor(form({ startOdometer: '12000', currentOdometer: '11999' }), 'currentOdometer'),
    ).toContain(
      'Current odometer cannot be lower than the odometer reading when the agreement started.',
    );
  });

  it('requires a current odometer', () => {
    expect(messagesFor(form({ currentOdometer: '' }), 'currentOdometer')).toContain(
      'Enter your current odometer reading.',
    );
  });

  it('rejects an agreement start date in the future', () => {
    expect(messagesFor(form({ contractStartDate: '2027-01-01' }), 'contractStartDate')).toContain(
      'Agreement start date cannot be in the future.',
    );
  });

  it('UT-018/IT-022 rejects elapsed months greater than the term', () => {
    expect(messagesFor(form({ elapsedMonths: '37' }), 'elapsedMonths')).toContain(
      'Months elapsed must be between 0 and your contract length of 36 months.',
    );
  });

  it('requires elapsed months when no start date is given', () => {
    expect(messagesFor(form({ elapsedMonths: '' }), 'elapsedMonths')[0]).toMatch(
      /Enter how many months have elapsed/,
    );
  });

  it('UT-005 rejects alphabetic input with a specific message', () => {
    expect(messagesFor(form({ currentOdometer: 'ten' }), 'currentOdometer')[0]).toMatch(
      /Enter your current odometer reading as a number/,
    );
  });

  it('rejects a negative charge rate', () => {
    expect(messagesFor(form({ chargeRatePence: '-2' }), 'chargeRatePence')).toContain(
      'Enter an excess mileage rate of 0p or more.',
    );
  });

  it('requires both tier fields when tiering is enabled', () => {
    const outcome = validateCalculatorInput(form({ tierEnabled: true }), AS_OF);
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.errors.map((error) => error.field)).toEqual(
      expect.arrayContaining(['tierThresholdMiles', 'tier2RatePence']),
    );
  });

  it('requires a VAT rate only when VAT is additional', () => {
    expect(
      validateCalculatorInput(form({ vatMode: 'unknown', vatRatePercent: '' }), AS_OF).ok,
    ).toBe(true);
    expect(
      messagesFor(form({ vatMode: 'additional', vatRatePercent: '' }), 'vatRatePercent')[0],
    ).toMatch(/Enter the VAT rate/);
  });

  it('orders errors to match the form', () => {
    const outcome = validateCalculatorInput(
      form({ contractLength: '', totalAllowance: '', currentOdometer: '' }),
      AS_OF,
    );
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.errors.map((error) => error.field)).toEqual([
      'totalAllowance',
      'contractLength',
      'currentOdometer',
    ]);
  });
});

describe('validatePlannedMileage', () => {
  it('accepts a blank scenario', () => {
    expect(validatePlannedMileage('')).toBeNull();
  });

  it('accepts zero', () => {
    expect(validatePlannedMileage('0')).toBeNull();
  });

  it('rejects a negative value', () => {
    expect(validatePlannedMileage('-1')?.message).toBe(
      'Enter expected miles per month of 0 or more.',
    );
  });

  it('rejects non-numeric input', () => {
    expect(validatePlannedMileage('lots')?.message).toMatch(/Enter your expected mileage/);
  });
});
