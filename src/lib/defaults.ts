import type { CalculatorFormValues } from './types';

/** Blank form. Start odometer defaults to 0 — the common new-car case. */
export const EMPTY_FORM: CalculatorFormValues = {
  allowanceMode: 'annual',
  annualAllowance: '',
  totalAllowance: '',
  contractLength: '',
  startOdometer: '0',
  contractStartDate: '',
  elapsedMonths: '',
  currentOdometer: '',
  chargeRatePence: '',
  vatMode: 'included',
  vatRatePercent: '20',
  tierEnabled: false,
  tierThresholdMiles: '',
  tier2RatePence: '',
  endAction: 'unsure',
};
