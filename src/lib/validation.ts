/**
 * Input validation and normalisation (spec §7).
 *
 * Every message names the field and says how to fix it — never "Invalid value".
 * Validation runs on submit, not on every keystroke (spec §10.2), and the raw
 * form values are never mutated, so nothing the user typed is lost.
 */

import { parseIsoDate } from './dates';
import { parseNumber } from './parse';
import { calculateTotalAllowance } from './calculations';
import type { CalculatorFormValues, NormalisedInput } from './types';

export type FieldId =
  | 'annualAllowance'
  | 'totalAllowance'
  | 'contractLength'
  | 'startOdometer'
  | 'contractStartDate'
  | 'elapsedMonths'
  | 'currentOdometer'
  | 'chargeRatePence'
  | 'vatRatePercent'
  | 'tierThresholdMiles'
  | 'tier2RatePence'
  | 'plannedMilesPerMonth';

export interface FieldError {
  field: FieldId;
  message: string;
}

export type ValidationOutcome =
  | { ok: true; value: NormalisedInput }
  | { ok: false; errors: FieldError[] };

export const MAX_CONTRACT_MONTHS = 84;
export const MAX_ODOMETER_MILES = 1_000_000;
export const MAX_ALLOWANCE_MILES = 1_000_000;

/** Field order used by the error summary so it mirrors the form (spec §10.1). */
const FIELD_ORDER: FieldId[] = [
  'annualAllowance',
  'totalAllowance',
  'contractLength',
  'startOdometer',
  'contractStartDate',
  'elapsedMonths',
  'currentOdometer',
  'chargeRatePence',
  'vatRatePercent',
  'tierThresholdMiles',
  'tier2RatePence',
  'plannedMilesPerMonth',
];

function sortErrors(errors: FieldError[]): FieldError[] {
  return [...errors].sort((a, b) => FIELD_ORDER.indexOf(a.field) - FIELD_ORDER.indexOf(b.field));
}

interface NumericFieldOptions {
  required: boolean;
  integer?: boolean;
  min?: number;
  max?: number;
  exclusiveMin?: number;
  requiredMessage: string;
  invalidMessage: string;
  rangeMessage: string;
  integerMessage?: string;
}

/** Parses one numeric field, pushing a specific error rather than throwing. */
function readNumber(
  raw: string,
  field: FieldId,
  errors: FieldError[],
  options: NumericFieldOptions,
): number | null {
  const parsed = parseNumber(raw);

  if (!parsed.ok) {
    errors.push({ field, message: options.invalidMessage });
    return null;
  }
  if (parsed.value === null) {
    if (options.required) errors.push({ field, message: options.requiredMessage });
    return null;
  }

  const value = parsed.value;

  if (options.integer && !Number.isInteger(value)) {
    errors.push({
      field,
      message: options.integerMessage ?? 'Enter a whole number.',
    });
    return null;
  }
  if (options.exclusiveMin !== undefined && value <= options.exclusiveMin) {
    errors.push({ field, message: options.rangeMessage });
    return null;
  }
  if (options.min !== undefined && value < options.min) {
    errors.push({ field, message: options.rangeMessage });
    return null;
  }
  if (options.max !== undefined && value > options.max) {
    errors.push({ field, message: options.rangeMessage });
    return null;
  }

  return value;
}

/**
 * Validates the raw form and, when everything passes, returns the normalised
 * input the calculation engine consumes.
 */
export function validateCalculatorInput(
  values: CalculatorFormValues,
  asOfDate: string,
): ValidationOutcome {
  const errors: FieldError[] = [];

  /* --- Contract length is needed first: other rules depend on the term. --- */
  const contractLength = readNumber(values.contractLength, 'contractLength', errors, {
    required: true,
    integer: true,
    min: 1,
    max: MAX_CONTRACT_MONTHS,
    requiredMessage: 'Enter your contract length in months.',
    invalidMessage: 'Enter your contract length as a number of months, for example 36.',
    rangeMessage: `Contract length must be between 1 and ${MAX_CONTRACT_MONTHS} months.`,
    integerMessage: 'Enter your contract length as a whole number of months.',
  });

  /* --- Allowance --------------------------------------------------------- */
  let annualAllowance: number | null = null;
  let totalAllowance: number | null = null;

  if (values.allowanceMode === 'annual') {
    annualAllowance = readNumber(values.annualAllowance, 'annualAllowance', errors, {
      required: true,
      integer: true,
      exclusiveMin: 0,
      max: MAX_ALLOWANCE_MILES,
      requiredMessage: 'Enter your annual mileage allowance.',
      invalidMessage: 'Enter your annual mileage allowance as a number, for example 10,000.',
      rangeMessage: `Enter an annual mileage allowance greater than 0 and no more than ${MAX_ALLOWANCE_MILES.toLocaleString('en-GB')} miles.`,
      integerMessage: 'Enter your annual mileage allowance as a whole number of miles.',
    });
  } else {
    totalAllowance = readNumber(values.totalAllowance, 'totalAllowance', errors, {
      required: true,
      integer: true,
      exclusiveMin: 0,
      max: MAX_ALLOWANCE_MILES,
      requiredMessage: 'Enter your total contract mileage allowance.',
      invalidMessage: 'Enter your total contract mileage allowance as a number, for example 30,000.',
      rangeMessage: `Enter a total mileage allowance greater than 0 and no more than ${MAX_ALLOWANCE_MILES.toLocaleString('en-GB')} miles.`,
      integerMessage: 'Enter your total mileage allowance as a whole number of miles.',
    });
  }

  /* --- Odometers --------------------------------------------------------- */
  const startOdometerParsed = parseNumber(values.startOdometer);
  let startOdometer = 0;
  if (!startOdometerParsed.ok) {
    errors.push({
      field: 'startOdometer',
      message: 'Enter the odometer reading when the agreement started as a number, for example 0.',
    });
  } else if (startOdometerParsed.value !== null) {
    if (!Number.isInteger(startOdometerParsed.value)) {
      errors.push({
        field: 'startOdometer',
        message: 'Enter the starting odometer as a whole number of miles.',
      });
    } else if (startOdometerParsed.value < 0 || startOdometerParsed.value > MAX_ODOMETER_MILES) {
      errors.push({
        field: 'startOdometer',
        message: `Enter a starting odometer between 0 and ${MAX_ODOMETER_MILES.toLocaleString('en-GB')} miles.`,
      });
    } else {
      startOdometer = startOdometerParsed.value;
    }
  }

  const currentOdometer = readNumber(values.currentOdometer, 'currentOdometer', errors, {
    required: true,
    integer: true,
    min: 0,
    max: MAX_ODOMETER_MILES,
    requiredMessage: 'Enter your current odometer reading.',
    invalidMessage: 'Enter your current odometer reading as a number, for example 18,450.',
    rangeMessage: `Enter a current odometer between 0 and ${MAX_ODOMETER_MILES.toLocaleString('en-GB')} miles.`,
    integerMessage: 'Enter your current odometer as a whole number of miles.',
  });

  if (currentOdometer !== null && currentOdometer < startOdometer) {
    errors.push({
      field: 'currentOdometer',
      message:
        'Current odometer cannot be lower than the odometer reading when the agreement started.',
    });
  }

  /* --- Elapsed time: start date OR manual months, never both ------------- */
  let contractStartDate: string | null = null;
  let elapsedMonthsManual: number | null = null;
  const startDateRaw = values.contractStartDate.trim();

  if (startDateRaw !== '') {
    const parsedDate = parseIsoDate(startDateRaw);
    const asOf = parseIsoDate(asOfDate);
    if (!parsedDate) {
      errors.push({
        field: 'contractStartDate',
        message: 'Enter an agreement start date in the format DD/MM/YYYY.',
      });
    } else if (asOf && parsedDate.getTime() > asOf.getTime()) {
      errors.push({
        field: 'contractStartDate',
        message: 'Agreement start date cannot be in the future.',
      });
    } else {
      contractStartDate = startDateRaw;
    }
  } else {
    elapsedMonthsManual = readNumber(values.elapsedMonths, 'elapsedMonths', errors, {
      required: true,
      integer: true,
      min: 0,
      max: contractLength ?? MAX_CONTRACT_MONTHS,
      requiredMessage:
        'Enter how many months have elapsed, or add your agreement start date instead.',
      invalidMessage: 'Enter the months elapsed as a number, for example 14.',
      rangeMessage: contractLength
        ? `Months elapsed must be between 0 and your contract length of ${contractLength} months.`
        : 'Months elapsed must be between 0 and your contract length.',
      integerMessage: 'Enter the months elapsed as a whole number.',
    });
  }

  /* --- Charge rate, VAT and tiering -------------------------------------- */
  const chargeRatePence = readNumber(values.chargeRatePence, 'chargeRatePence', errors, {
    required: false,
    min: 0,
    max: 1000,
    requiredMessage: 'Enter your excess mileage rate.',
    invalidMessage: 'Enter your excess mileage rate in pence per mile, for example 8 or 10.5.',
    rangeMessage: 'Enter an excess mileage rate of 0p or more.',
  });

  let vatRatePercent: number | null = null;
  if (values.vatMode === 'additional') {
    vatRatePercent = readNumber(values.vatRatePercent, 'vatRatePercent', errors, {
      required: true,
      min: 0,
      max: 100,
      requiredMessage: 'Enter the VAT rate that applies to your excess mileage charge.',
      invalidMessage: 'Enter the VAT rate as a percentage, for example 20.',
      rangeMessage: 'Enter a VAT rate between 0% and 100%.',
    });
  }

  let tierThresholdMiles: number | null = null;
  let tier2RatePence: number | null = null;
  if (values.tierEnabled) {
    tierThresholdMiles = readNumber(values.tierThresholdMiles, 'tierThresholdMiles', errors, {
      required: true,
      integer: true,
      exclusiveMin: 0,
      max: MAX_ALLOWANCE_MILES,
      requiredMessage: 'Enter the number of excess miles where the higher rate starts.',
      invalidMessage: 'Enter the higher-rate threshold as a number of miles, for example 5,000.',
      rangeMessage: 'Enter a higher-rate threshold greater than 0 miles.',
      integerMessage: 'Enter the higher-rate threshold as a whole number of miles.',
    });
    tier2RatePence = readNumber(values.tier2RatePence, 'tier2RatePence', errors, {
      required: true,
      min: 0,
      max: 1000,
      requiredMessage: 'Enter the higher pence-per-mile rate.',
      invalidMessage: 'Enter the higher rate in pence per mile, for example 15.',
      rangeMessage: 'Enter a higher rate of 0p or more.',
    });
  }

  if (errors.length > 0 || contractLength === null || currentOdometer === null) {
    return { ok: false, errors: sortErrors(errors) };
  }

  const resolvedTotalAllowance = calculateTotalAllowance({
    allowanceMode: values.allowanceMode,
    annualAllowanceMiles: annualAllowance,
    totalAllowanceMiles: totalAllowance,
    contractLengthMonths: contractLength,
  });

  return {
    ok: true,
    value: {
      totalAllowanceMiles: resolvedTotalAllowance,
      annualAllowanceMiles: annualAllowance,
      allowanceMode: values.allowanceMode,
      contractLengthMonths: contractLength,
      startOdometerMiles: startOdometer,
      contractStartDate,
      elapsedMonthsManual,
      currentOdometerMiles: currentOdometer,
      chargeRatePence,
      vatMode: values.vatMode,
      vatRatePercent,
      tierEnabled: values.tierEnabled,
      tierThresholdExcessMiles: tierThresholdMiles,
      tier2RatePence,
      endAction: values.endAction,
      asOfDate,
    },
  };
}

/** Standalone rule for the scenario planner, which validates independently. */
export function validatePlannedMileage(raw: string): FieldError | null {
  const parsed = parseNumber(raw);
  if (!parsed.ok) {
    return {
      field: 'plannedMilesPerMonth',
      message: 'Enter your expected mileage as a number, for example 700.',
    };
  }
  if (parsed.value === null) return null;
  if (parsed.value < 0) {
    return { field: 'plannedMilesPerMonth', message: 'Enter expected miles per month of 0 or more.' };
  }
  if (parsed.value > 20_000) {
    return {
      field: 'plannedMilesPerMonth',
      message: 'Enter expected miles per month of 20,000 or less.',
    };
  }
  return null;
}
