/**
 * Text equivalents of the visual results (spec FR-015, FR-027, IT-025).
 *
 * The same builders back the chart's screen-reader summary and the
 * copy-to-clipboard action, so the two can never drift apart. No personally
 * identifying data is included.
 */

import { buildChartModel } from './chart';
import {
  formatCurrencyFromPence,
  formatMiles,
  formatMilesWithUnit,
  formatMonths,
  formatPercent,
} from './format';
import { describeStatus } from './presentation';
import type { CalculationResult, ScenarioResult } from './types';

/** Sentence-per-series description of the projection chart. */
export function buildChartSummary(
  result: CalculationResult,
  scenarioMonthly: number | null = null,
): string[] {
  const model = buildChartModel(result, scenarioMonthly);
  const lines: string[] = [
    `Contract allowance pace rises in a straight line from ${formatMilesWithUnit(result.startOdometerMiles)} at month 0 to ${formatMilesWithUnit(result.startOdometerMiles + result.totalAllowanceMiles)} at month ${result.contractLengthMonths}.`,
    `Today, at month ${formatMiles(model.todayMonth)}, your odometer reads ${formatMilesWithUnit(result.currentOdometerMiles)} against an allowance pace of ${formatMilesWithUnit(result.startOdometerMiles + result.allowedMilesToDate)}.`,
  ];

  if (result.projectedEndOdometerMiles !== null) {
    lines.push(
      `At your current pace of about ${formatMilesWithUnit(result.historicalAverageMonthly ?? 0)} per month, the projection reaches ${formatMilesWithUnit(result.projectedEndOdometerMiles)} at month ${result.contractLengthMonths}.`,
    );
  } else {
    lines.push(
      'There is not yet enough elapsed contract time to project a pace from your driving so far.',
    );
  }

  if (scenarioMonthly !== null) {
    const scenarioSeries = model.series.find((s) => s.id === 'scenario');
    const end = scenarioSeries?.points.at(-1);
    if (end) {
      lines.push(
        `Your plan of ${formatMilesWithUnit(scenarioMonthly)} per month from now reaches ${formatMilesWithUnit(end.miles)} at month ${result.contractLengthMonths}.`,
      );
    }
  }

  return lines;
}

/** Plain-text result summary for the copy/share action. */
export function buildShareSummary(
  result: CalculationResult,
  scenario: ScenarioResult | null = null,
): string {
  const status = describeStatus(result);
  const lines = [
    'PCP mileage estimate',
    '',
    `Status: ${status.label} — ${status.headline}`,
    `Miles driven under the agreement: ${formatMilesWithUnit(result.milesDriven)}`,
    `Contract allowance: ${formatMilesWithUnit(result.totalAllowanceMiles)}`,
    `Time elapsed: ${formatPercent(result.progress.ratio * 100)}`,
    `Allowance used: ${formatPercent(result.allowanceUsedPct)}`,
  ];

  if (result.safeMilesPerMonth !== null) {
    lines.push(
      `To stay within the allowance: ${formatMiles(result.safeMilesPerMonth)} miles/month (about ${formatMiles(result.safeMilesPerWeek)} miles/week) for ${formatMonths(result.progress.remainingMonths)}.`,
    );
  }

  if (result.projectedEndDrivenMiles !== null) {
    lines.push(
      `Projected mileage at the end of the agreement: ${formatMilesWithUnit(result.projectedEndDrivenMiles)}`,
      `Projected excess: ${formatMilesWithUnit(result.projectedOverageMiles ?? 0)}`,
    );
  }

  if (result.charge) {
    lines.push(
      `Estimated excess charge: ${formatCurrencyFromPence(result.charge.totalPence)}${result.charge.vatUncertain ? ' (before any additional VAT)' : ''}`,
    );
  }

  if (scenario?.charge) {
    lines.push(
      `If you drive ${formatMilesWithUnit(scenario.plannedMilesPerMonth)} per month from now: ${formatCurrencyFromPence(scenario.charge.totalPence)}`,
    );
  }

  lines.push(
    '',
    'Estimate only. Your PCP agreement determines your actual allowance, excess mileage rate and VAT treatment. This is not financial advice.',
  );

  return lines.join('\n');
}
