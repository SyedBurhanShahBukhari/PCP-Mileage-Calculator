/**
 * Pure calculation engine (spec §4 and §14).
 *
 * Nothing in this file touches React, the DOM, formatting or `Date.now()`.
 * The as-of date is always injected, so a given input always produces the same
 * output (spec FR-029, NFR-003).
 */

import {
  addCalendarMonths,
  differenceInDays,
  parseIsoDate,
  toIsoDate,
} from './dates';
import { milesAtRateToPence, roundPence, vatOnPence } from './money';
import type {
  ChargeBreakdown,
  ElapsedProgress,
  CalculationResult,
  MileageStatus,
  NormalisedInput,
  ScenarioResult,
  VatMode,
} from './types';

/** Miles either side of the allowance pace that still counts as "on track". */
export const DEFAULT_PACE_TOLERANCE_MILES = 100;

const WEEKS_PER_MONTH = 52 / 12;

/* -------------------------------------------------------------------------- */
/* Allowance and mileage                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Total contract allowance. In annual mode this is `annual × term / 12`, kept
 * unrounded so a non-12-multiple term is not silently distorted (spec §7).
 */
export function calculateTotalAllowance(input: {
  allowanceMode: 'annual' | 'total';
  annualAllowanceMiles: number | null;
  totalAllowanceMiles: number | null;
  contractLengthMonths: number;
}): number {
  if (input.allowanceMode === 'annual') {
    const annual = input.annualAllowanceMiles ?? 0;
    return (annual * input.contractLengthMonths) / 12;
  }
  return input.totalAllowanceMiles ?? 0;
}

/** Miles driven under the agreement — never the raw odometer (spec §38). */
export function calculateMilesDriven(startOdometer: number, currentOdometer: number): number {
  return currentOdometer - startOdometer;
}

/* -------------------------------------------------------------------------- */
/* Elapsed progress                                                            */
/* -------------------------------------------------------------------------- */

/** Manual mode: whole/fractional months elapsed over the term (UT-015..017). */
export function calculateElapsedRatioManual(elapsedMonths: number, termMonths: number): number {
  if (termMonths <= 0) return 1;
  return Math.min(Math.max(elapsedMonths / termMonths, 0), 1);
}

/**
 * Works out where the agreement is today, in either mode.
 *
 * Date mode uses elapsed days over total contract days so the projection moves
 * smoothly instead of jumping on month boundaries (spec §4.3).
 */
export function calculateElapsedProgress(
  input: Pick<
    NormalisedInput,
    'contractStartDate' | 'contractLengthMonths' | 'elapsedMonthsManual' | 'asOfDate'
  >,
): ElapsedProgress {
  const term = input.contractLengthMonths;
  const startDate = parseIsoDate(input.contractStartDate);
  const asOf = parseIsoDate(input.asOfDate);

  if (startDate && asOf) {
    const endDate = addCalendarMonths(startDate, term);
    const termDays = Math.max(differenceInDays(endDate, startDate), 1);
    const rawElapsedDays = differenceInDays(asOf, startDate);
    const elapsedDays = Math.min(Math.max(rawElapsedDays, 0), termDays);
    const ratio = elapsedDays / termDays;
    return {
      ratio,
      elapsedMonths: ratio * term,
      remainingMonths: Math.max(term - ratio * term, 0),
      basis: 'daily',
      elapsedDays,
      termDays,
      remainingDays: termDays - elapsedDays,
      contractEndDate: toIsoDate(endDate),
      contractComplete: elapsedDays >= termDays,
    };
  }

  const elapsedMonths = Math.min(Math.max(input.elapsedMonthsManual ?? 0, 0), term);
  const ratio = calculateElapsedRatioManual(elapsedMonths, term);
  return {
    ratio,
    elapsedMonths,
    remainingMonths: Math.max(term - elapsedMonths, 0),
    basis: 'monthly',
    elapsedDays: null,
    termDays: null,
    remainingDays: null,
    contractEndDate: null,
    contractComplete: elapsedMonths >= term,
  };
}

/* -------------------------------------------------------------------------- */
/* Pace                                                                        */
/* -------------------------------------------------------------------------- */

/** Straight-line allowance the driver "should" have used by now (UT-024/025). */
export function calculateAllowedMileageToDate(totalAllowance: number, elapsedRatio: number): number {
  return totalAllowance * elapsedRatio;
}

/** Positive = ahead of pace, negative = behind pace (UT-026..028). */
export function calculatePaceVariance(milesDriven: number, allowedToDate: number): number {
  return milesDriven - allowedToDate;
}

/** Signed remaining allowance; may be negative once exceeded (UT-029..031). */
export function calculateRemainingMileage(totalAllowance: number, milesDriven: number): number {
  return totalAllowance - milesDriven;
}

/**
 * Miles per month from now that finish inside the allowance (UT-032..034).
 * Returns null when no contract time remains — there is nothing to plan.
 */
export function calculateSafeMonthlyMileage(
  remainingMiles: number,
  remainingMonths: number,
): number | null {
  if (remainingMonths <= 0) return null;
  return Math.max(remainingMiles, 0) / remainingMonths;
}

/* -------------------------------------------------------------------------- */
/* Projection                                                                  */
/* -------------------------------------------------------------------------- */

/** Historical average monthly pace, or null at zero elapsed time (UT-035/036). */
export function calculateHistoricalAverageMonthly(
  milesDriven: number,
  elapsedMonths: number,
): number | null {
  if (elapsedMonths <= 0) return null;
  return milesDriven / elapsedMonths;
}

/**
 * Projects total miles driven by the end of the term if the current pace holds.
 *
 * Returns null when there is no elapsed time to extrapolate from — the spec is
 * explicit that we must not invent a projection at month zero (spec §7).
 * A completed contract projects to exactly the miles already driven.
 */
export function calculateHistoricalProjection(
  milesDriven: number,
  progress: ElapsedProgress,
): number | null {
  if (progress.contractComplete) return milesDriven;

  if (progress.basis === 'daily' && progress.elapsedDays !== null && progress.termDays !== null) {
    if (progress.elapsedDays <= 0) return null;
    return (milesDriven / progress.elapsedDays) * progress.termDays;
  }

  if (progress.elapsedMonths <= 0) return null;
  const monthlyPace = milesDriven / progress.elapsedMonths;
  return monthlyPace * (progress.elapsedMonths + progress.remainingMonths);
}

/** Excess miles at hand-back, never negative (UT-040..042). */
export function calculateProjectedOverage(
  projectedDriven: number | null,
  totalAllowance: number,
): number | null {
  if (projectedDriven === null) return null;
  return Math.max(projectedDriven - totalAllowance, 0);
}

/* -------------------------------------------------------------------------- */
/* Charges                                                                     */
/* -------------------------------------------------------------------------- */

/** Single-rate excess charge, in integer pence (UT-043..047). */
export function calculateFlatCharge(overageMiles: number, ratePence: number | null): number | null {
  if (ratePence === null || !Number.isFinite(ratePence)) return null;
  return milesAtRateToPence(overageMiles, ratePence);
}

/**
 * Tiered excess charge (spec §4.4). Both the threshold and the second rate must
 * come from the user's agreement — nothing is ever assumed (UT-048..051).
 */
export function calculateTieredCharge(
  overageMiles: number,
  ratePence: number,
  thresholdMiles: number,
  secondRatePence: number,
): { tier1Miles: number; tier2Miles: number; basePence: number } {
  const overage = Math.max(overageMiles, 0);
  const threshold = Math.max(thresholdMiles, 0);
  const tier1Miles = Math.min(overage, threshold);
  const tier2Miles = Math.max(overage - threshold, 0);
  const basePence =
    milesAtRateToPence(tier1Miles, ratePence) + milesAtRateToPence(tier2Miles, secondRatePence);
  return { tier1Miles, tier2Miles, basePence };
}

/**
 * Applies VAT treatment (spec §4.5). When the user does not know whether VAT is
 * included, we never silently add it — the base is shown as "before any
 * additional VAT" instead (UT-052..055).
 */
export function applyVAT(
  basePence: number,
  vatMode: VatMode,
  vatRatePercent: number | null,
): { vatPence: number; totalPence: number; vatUncertain: boolean } {
  if (vatMode === 'additional') {
    const vatPence = vatOnPence(basePence, vatRatePercent ?? 0);
    return { vatPence, totalPence: basePence + vatPence, vatUncertain: false };
  }
  return { vatPence: 0, totalPence: basePence, vatUncertain: vatMode === 'unknown' };
}

/**
 * The full charge engine: tiering (if enabled) then VAT. Returns null when the
 * user has not supplied a rate — the mileage results still work without one.
 */
export function calculateCharge(
  overageMiles: number | null,
  input: Pick<
    NormalisedInput,
    | 'chargeRatePence'
    | 'vatMode'
    | 'vatRatePercent'
    | 'tierEnabled'
    | 'tierThresholdExcessMiles'
    | 'tier2RatePence'
  >,
): ChargeBreakdown | null {
  if (overageMiles === null || input.chargeRatePence === null) return null;

  const tieringUsable =
    input.tierEnabled &&
    input.tierThresholdExcessMiles !== null &&
    input.tier2RatePence !== null;

  const tiers = tieringUsable
    ? calculateTieredCharge(
        overageMiles,
        input.chargeRatePence,
        input.tierThresholdExcessMiles as number,
        input.tier2RatePence as number,
      )
    : {
        tier1Miles: Math.max(overageMiles, 0),
        tier2Miles: 0,
        basePence: milesAtRateToPence(overageMiles, input.chargeRatePence),
      };

  const vat = applyVAT(tiers.basePence, input.vatMode, input.vatRatePercent);

  return {
    tier1Miles: tiers.tier1Miles,
    tier2Miles: tiers.tier2Miles,
    basePence: tiers.basePence,
    vatPence: vat.vatPence,
    totalPence: vat.totalPence,
    vatUncertain: vat.vatUncertain,
  };
}

/* -------------------------------------------------------------------------- */
/* Status                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Classifies today's position (UT-056..060). Having already driven past the
 * *total* allowance takes priority over any pace comparison.
 */
export function classifyMileageStatus(
  paceVarianceMiles: number,
  options: { milesDriven: number; totalAllowanceMiles: number; toleranceMiles?: number },
): MileageStatus {
  if (options.milesDriven > options.totalAllowanceMiles) return 'EXCEEDED_TOTAL';
  const tolerance = options.toleranceMiles ?? DEFAULT_PACE_TOLERANCE_MILES;
  if (paceVarianceMiles > tolerance) return 'OVER';
  if (paceVarianceMiles < -tolerance) return 'UNDER';
  return 'ON_TRACK';
}

/* -------------------------------------------------------------------------- */
/* Scenario planner                                                            */
/* -------------------------------------------------------------------------- */

/**
 * "What if I drive X miles/month from now?" (spec §5.4).
 *
 * The scenario keeps the miles already driven and only replaces the *future*
 * pace — it never overwrites history.
 */
export function calculateScenario(
  plannedMilesPerMonth: number,
  base: {
    milesDriven: number;
    remainingMonths: number;
    totalAllowanceMiles: number;
    startOdometerMiles: number;
  },
  chargeInput: Parameters<typeof calculateCharge>[1],
  baselineTotalPence: number | null = null,
): ScenarioResult {
  const planned = Math.max(plannedMilesPerMonth, 0);
  const futureMiles = planned * Math.max(base.remainingMonths, 0);
  const endDrivenMiles = base.milesDriven + futureMiles;
  const overageMiles = Math.max(endDrivenMiles - base.totalAllowanceMiles, 0);
  const charge = calculateCharge(overageMiles, chargeInput);

  const differencePence =
    baselineTotalPence !== null && charge !== null
      ? roundPence(baselineTotalPence - charge.totalPence)
      : null;

  return {
    plannedMilesPerMonth: planned,
    futureMiles,
    endDrivenMiles,
    endOdometerMiles: base.startOdometerMiles + endDrivenMiles,
    overageMiles,
    charge,
    differencePence,
  };
}

/* -------------------------------------------------------------------------- */
/* Orchestration                                                               */
/* -------------------------------------------------------------------------- */

/** Runs the whole engine over already-validated input (spec §14). */
export function calculatePCPMileage(input: NormalisedInput): CalculationResult {
  const totalAllowance = input.totalAllowanceMiles;
  const milesDriven = calculateMilesDriven(input.startOdometerMiles, input.currentOdometerMiles);
  const progress = calculateElapsedProgress(input);

  const allowedMilesToDate = calculateAllowedMileageToDate(totalAllowance, progress.ratio);
  const paceVarianceMiles = calculatePaceVariance(milesDriven, allowedMilesToDate);
  const remainingAllowanceMiles = calculateRemainingMileage(totalAllowance, milesDriven);
  const usableRemainingMiles = Math.max(remainingAllowanceMiles, 0);

  const safeMilesPerMonth = calculateSafeMonthlyMileage(
    remainingAllowanceMiles,
    progress.remainingMonths,
  );

  const historicalAverageMonthly = calculateHistoricalAverageMonthly(
    milesDriven,
    progress.elapsedMonths,
  );
  const projectedEndDrivenMiles = calculateHistoricalProjection(milesDriven, progress);
  const projectedOverageMiles = calculateProjectedOverage(projectedEndDrivenMiles, totalAllowance);

  return {
    totalAllowanceMiles: totalAllowance,
    contractLengthMonths: input.contractLengthMonths,
    startOdometerMiles: input.startOdometerMiles,
    currentOdometerMiles: input.currentOdometerMiles,
    milesDriven,
    progress,
    allowanceUsedPct: totalAllowance > 0 ? (milesDriven / totalAllowance) * 100 : 0,
    allowedMilesToDate,
    paceVarianceMiles,
    remainingAllowanceMiles,
    usableRemainingMiles,
    safeMilesPerMonth,
    safeMilesPerWeek: safeMilesPerMonth === null ? null : safeMilesPerMonth / WEEKS_PER_MONTH,
    historicalAverageMonthly,
    projectedEndDrivenMiles,
    projectedEndOdometerMiles:
      projectedEndDrivenMiles === null ? null : input.startOdometerMiles + projectedEndDrivenMiles,
    projectedOverageMiles,
    charge: calculateCharge(projectedOverageMiles, input),
    status: classifyMileageStatus(paceVarianceMiles, {
      milesDriven,
      totalAllowanceMiles: totalAllowance,
    }),
    endAction: input.endAction,
    asOfDate: input.asOfDate,
  };
}
