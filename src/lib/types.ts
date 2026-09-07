/**
 * Shared domain types for the PCP mileage calculator.
 *
 * Three distinct shapes are kept deliberately separate (spec §13):
 *  - `CalculatorFormValues` – raw strings exactly as typed by the user.
 *  - `NormalisedInput`      – parsed, validated numbers/dates fed to the engine.
 *  - `CalculationResult`    – pure numeric output; formatting happens elsewhere.
 */

export type AllowanceMode = 'annual' | 'total';
export type VatMode = 'included' | 'additional' | 'unknown';
export type EndAction = 'return' | 'buy' | 'part_exchange' | 'unsure';

/** Status of the driver today, in priority order (spec §5.3, UT-056..060). */
export type MileageStatus = 'EXCEEDED_TOTAL' | 'OVER' | 'ON_TRACK' | 'UNDER';

/** Whether elapsed time came from a start date or a manual month count. */
export type ProjectionBasis = 'daily' | 'monthly';

/** Raw form state. Every field is a string so user keystrokes are preserved. */
export interface CalculatorFormValues {
  allowanceMode: AllowanceMode;
  annualAllowance: string;
  totalAllowance: string;
  contractLength: string;
  startOdometer: string;
  contractStartDate: string;
  elapsedMonths: string;
  currentOdometer: string;
  chargeRatePence: string;
  vatMode: VatMode;
  vatRatePercent: string;
  tierEnabled: boolean;
  tierThresholdMiles: string;
  tier2RatePence: string;
  endAction: EndAction;
}

/** Validated, normalised numeric input handed to the calculation engine. */
export interface NormalisedInput {
  totalAllowanceMiles: number;
  annualAllowanceMiles: number | null;
  allowanceMode: AllowanceMode;
  contractLengthMonths: number;
  startOdometerMiles: number;
  /** ISO `YYYY-MM-DD`, or null when the user is in manual-elapsed mode. */
  contractStartDate: string | null;
  elapsedMonthsManual: number | null;
  currentOdometerMiles: number;
  chargeRatePence: number | null;
  vatMode: VatMode;
  vatRatePercent: number | null;
  tierEnabled: boolean;
  tierThresholdExcessMiles: number | null;
  tier2RatePence: number | null;
  endAction: EndAction;
  /** Injected so results are deterministic in tests (spec FR-029, NFR-003). */
  asOfDate: string;
}

/** Money is carried as integer pence internally and rounded only for display. */
export interface ChargeBreakdown {
  /** Miles charged at the primary rate. */
  tier1Miles: number;
  /** Miles charged at the secondary rate (0 when tiering is off). */
  tier2Miles: number;
  basePence: number;
  vatPence: number;
  totalPence: number;
  /** True when VAT treatment is unknown, so `totalPence` excludes any VAT. */
  vatUncertain: boolean;
}

export interface ScenarioResult {
  plannedMilesPerMonth: number;
  futureMiles: number;
  endDrivenMiles: number;
  endOdometerMiles: number;
  overageMiles: number;
  charge: ChargeBreakdown | null;
  /** Positive when the plan costs less than the current pace. */
  differencePence: number | null;
}

export interface ElapsedProgress {
  /** Fraction of the term completed, clamped to 0..1. */
  ratio: number;
  /** Elapsed months (fractional in date mode). */
  elapsedMonths: number;
  /** Remaining months (fractional in date mode), never negative. */
  remainingMonths: number;
  basis: ProjectionBasis;
  /** Present only in date mode. */
  elapsedDays: number | null;
  termDays: number | null;
  remainingDays: number | null;
  contractEndDate: string | null;
  /** True once the term has fully elapsed. */
  contractComplete: boolean;
}

export interface CalculationResult {
  totalAllowanceMiles: number;
  contractLengthMonths: number;
  startOdometerMiles: number;
  currentOdometerMiles: number;
  milesDriven: number;
  progress: ElapsedProgress;
  allowanceUsedPct: number;
  allowedMilesToDate: number;
  paceVarianceMiles: number;
  /** Signed: negative once the total allowance is exceeded. */
  remainingAllowanceMiles: number;
  /** Clamped at 0 – what the "safe mileage" card may present. */
  usableRemainingMiles: number;
  safeMilesPerMonth: number | null;
  safeMilesPerWeek: number | null;
  historicalAverageMonthly: number | null;
  projectedEndDrivenMiles: number | null;
  projectedEndOdometerMiles: number | null;
  projectedOverageMiles: number | null;
  charge: ChargeBreakdown | null;
  status: MileageStatus;
  endAction: EndAction;
  asOfDate: string;
}
