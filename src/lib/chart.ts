/**
 * Chart data builders (spec FR-014, UT-073..076).
 *
 * These return plain numbers only. The SVG component consumes this model and
 * the accessible text summary is generated from the very same data, so the
 * chart is never the only route to the information (FR-015).
 */

import type { CalculationResult } from './types';

export interface SeriesPoint {
  month: number;
  /** Odometer reading, so a non-zero start mileage is visible on the chart. */
  miles: number;
}

export type SeriesStyle = 'solid' | 'dashed' | 'dotted';

export interface ChartSeries {
  id: 'allowance' | 'actual' | 'projection' | 'scenario';
  label: string;
  style: SeriesStyle;
  points: SeriesPoint[];
}

export interface ChartModel {
  series: ChartSeries[];
  todayMonth: number;
  todayMiles: number;
  maxMonth: number;
  maxMiles: number;
  /** Odometer at month 0 — the chart's y-axis baseline. */
  minMiles: number;
  /**
   * The region between the allowance line and the projected pace, which is the
   * projected excess (or the unused headroom) made visible. Null when there is
   * no projection to compare against.
   */
  gap: {
    startMiles: number;
    allowanceEndMiles: number;
    projectedEndMiles: number;
    /** True when the projection finishes above the allowance. */
    over: boolean;
    /** Size of the gap at the end of the term, in miles. */
    endMiles: number;
  } | null;
}

/** Straight-line contract allowance from month 0 to the end of the term. */
export function buildAllowanceSeries(
  totalAllowance: number,
  termMonths: number,
  startOdometer: number,
): SeriesPoint[] {
  if (termMonths <= 0) return [{ month: 0, miles: startOdometer }];
  return [
    { month: 0, miles: startOdometer },
    { month: termMonths, miles: startOdometer + totalAllowance },
  ];
}

/** The miles actually driven so far: month 0 to today. */
export function buildActualSeries(
  startOdometer: number,
  todayMonth: number,
  currentOdometer: number,
): SeriesPoint[] {
  if (todayMonth <= 0) return [];
  return [
    { month: 0, miles: startOdometer },
    { month: todayMonth, miles: currentOdometer },
  ];
}

/**
 * Where the current pace lands by the end of the term. Returns an empty series
 * when there is no elapsed time to extrapolate from (UT-076).
 */
export function buildProjectionSeries(
  startOdometer: number,
  averageMonthly: number | null,
  termMonths: number,
): SeriesPoint[] {
  if (averageMonthly === null) return [];
  return [
    { month: 0, miles: startOdometer },
    { month: termMonths, miles: startOdometer + averageMonthly * termMonths },
  ];
}

/** From today onwards at a planned pace, anchored to the miles already driven. */
export function buildScenarioSeries(
  todayMonth: number,
  todayOdometer: number,
  plannedMonthly: number,
  termMonths: number,
): SeriesPoint[] {
  const remainingMonths = Math.max(termMonths - todayMonth, 0);
  if (remainingMonths <= 0) return [];
  return [
    { month: todayMonth, miles: todayOdometer },
    { month: termMonths, miles: todayOdometer + plannedMonthly * remainingMonths },
  ];
}

/** Assembles every series plus the axis bounds the SVG needs. */
export function buildChartModel(
  result: CalculationResult,
  scenarioMonthly: number | null = null,
): ChartModel {
  const term = result.contractLengthMonths;
  const start = result.startOdometerMiles;
  const todayMonth = result.progress.elapsedMonths;
  const allowanceEnd = start + result.totalAllowanceMiles;

  const series: ChartSeries[] = [
    {
      id: 'allowance',
      label: 'Contract allowance pace',
      style: 'solid',
      points: buildAllowanceSeries(result.totalAllowanceMiles, term, start),
    },
  ];

  const actual = buildActualSeries(start, todayMonth, result.currentOdometerMiles);
  if (actual.length > 0) {
    series.push({ id: 'actual', label: 'Your mileage so far', style: 'solid', points: actual });
  }

  /*
   * Only the part of the pace line beyond today is a projection, so only that
   * part is drawn as a dashed line. Everything to the left really happened.
   */
  const projectedEnd = result.projectedEndOdometerMiles;
  if (projectedEnd !== null && term - todayMonth > 0) {
    series.push({
      id: 'projection',
      label: 'Projected at your current pace',
      style: 'dashed',
      points: [
        { month: todayMonth, miles: result.currentOdometerMiles },
        { month: term, miles: projectedEnd },
      ],
    });
  }

  if (scenarioMonthly !== null) {
    const scenario = buildScenarioSeries(
      todayMonth,
      result.currentOdometerMiles,
      scenarioMonthly,
      term,
    );
    if (scenario.length > 0) {
      series.push({ id: 'scenario', label: 'Your plan from now', style: 'dotted', points: scenario });
    }
  }

  const allMiles = series.flatMap((s) => s.points.map((p) => p.miles));
  allMiles.push(result.currentOdometerMiles, allowanceEnd);

  return {
    series,
    todayMonth,
    todayMiles: result.currentOdometerMiles,
    maxMonth: term,
    maxMiles: Math.max(...allMiles),
    minMiles: Math.min(...allMiles, start),
    gap:
      projectedEnd === null
        ? null
        : {
            startMiles: start,
            allowanceEndMiles: allowanceEnd,
            projectedEndMiles: projectedEnd,
            over: projectedEnd > allowanceEnd,
            endMiles: Math.abs(projectedEnd - allowanceEnd),
          },
  };
}
