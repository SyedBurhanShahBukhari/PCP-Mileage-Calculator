import { describe, expect, it } from 'vitest';
import { calculatePCPMileage } from '../src/lib/calculations';
import { buildAllowanceSeries, buildChartModel, buildProjectionSeries, buildScenarioSeries } from '../src/lib/chart';
import { describeEndAction, describeSafeMileage, describeStatus } from '../src/lib/presentation';
import { buildChartSummary, buildShareSummary } from '../src/lib/summary';
import { clearSavedForm, parseStoredState, saveForm, loadSavedForm, STORAGE_KEY } from '../src/lib/persistence';
import { EMPTY_FORM } from '../src/lib/defaults';
import type { NormalisedInput } from '../src/lib/types';

const input = (overrides: Partial<NormalisedInput> = {}): NormalisedInput => ({
  totalAllowanceMiles: 30000,
  annualAllowanceMiles: null,
  allowanceMode: 'total',
  contractLengthMonths: 36,
  startOdometerMiles: 0,
  contractStartDate: null,
  elapsedMonthsManual: 14,
  currentOdometerMiles: 18450,
  chargeRatePence: 8,
  vatMode: 'included',
  vatRatePercent: null,
  tierEnabled: false,
  tierThresholdExcessMiles: null,
  tier2RatePence: null,
  endAction: 'return',
  asOfDate: '2026-09-07',
  ...overrides,
});

describe('describeEndAction (UT-065..068)', () => {
  it('UT-065 shows the charge prominently when returning', () => {
    const presentation = describeEndAction('return');
    expect(presentation.emphasis).toBe('prominent');
    expect(presentation.chargeLabel).toBe('Estimated excess charge');
  });

  it('UT-066 de-emphasises the charge when buying, without claiming it is payable', () => {
    const presentation = describeEndAction('buy');
    expect(presentation.emphasis).toBe('deemphasised');
    expect(presentation.note).toMatch(/may not be charged in the same way/);
    expect(presentation.note).not.toMatch(/you will pay/i);
  });

  it('UT-067 labels part-exchange as a comparison, not an invoice', () => {
    const presentation = describeEndAction('part_exchange');
    expect(presentation.emphasis).toBe('comparison');
    expect(presentation.note).toMatch(/rather than a guaranteed invoice/);
    expect(presentation.chargeLabel).toBe('Return-equivalent estimate');
  });

  it('UT-068 shows a neutral return-based estimate when unsure', () => {
    const presentation = describeEndAction('unsure');
    expect(presentation.emphasis).toBe('prominent');
    expect(presentation.note).toMatch(/planning estimate/);
  });

  it('gives materially different wording for each end action', () => {
    const notes = (['return', 'buy', 'part_exchange', 'unsure'] as const).map(
      (action) => describeEndAction(action).note,
    );
    expect(new Set(notes).size).toBe(4);
  });
});

describe('describeStatus', () => {
  it('describes an over-pace driver with a text label as well as a tone', () => {
    const status = describeStatus(calculatePCPMileage(input()));
    expect(status.status).toBe('OVER');
    expect(status.label).toBe('Over pace');
    expect(status.headline).toContain('6,783 miles');
  });

  it('describes an under-pace driver', () => {
    const status = describeStatus(
      calculatePCPMileage(input({ elapsedMonthsManual: 18, currentOdometerMiles: 10000 })),
    );
    expect(status.label).toBe('Under pace');
    expect(status.headline).toContain('5,000 miles');
  });

  it('describes an on-track driver', () => {
    const status = describeStatus(
      calculatePCPMileage(input({ elapsedMonthsManual: 18, currentOdometerMiles: 15000 })),
    );
    expect(status.label).toBe('On track');
  });

  it('describes an already-exceeded allowance and never offers usable mileage', () => {
    const result = calculatePCPMileage(input({ currentOdometerMiles: 31200, elapsedMonthsManual: 26 }));
    const status = describeStatus(result);
    expect(status.label).toBe('Allowance exceeded');
    expect(status.headline).toContain('1,200 miles');
    expect(describeSafeMileage(result).exceeded).toBe(true);
  });
});

describe('chart series (UT-073..076)', () => {
  it('UT-073 spans month 0 to the term at the allowance', () => {
    const series = buildAllowanceSeries(30000, 36, 0);
    expect(series[0]).toEqual({ month: 0, miles: 0 });
    expect(series.at(-1)).toEqual({ month: 36, miles: 30000 });
  });

  it('UT-074 offsets the series by a non-zero starting odometer', () => {
    const series = buildAllowanceSeries(30000, 36, 12000);
    expect(series[0]).toEqual({ month: 0, miles: 12000 });
    expect(series.at(-1)).toEqual({ month: 36, miles: 42000 });
  });

  it('UT-075 projects the reference end mileage', () => {
    const series = buildProjectionSeries(0, 18450 / 14, 36);
    expect(series.at(-1)?.miles).toBeCloseTo(47442.8571, 4);
  });

  it('UT-076 omits the projection when there is no historical pace', () => {
    expect(buildProjectionSeries(0, null, 36)).toEqual([]);
  });

  it('anchors the scenario series to today', () => {
    const series = buildScenarioSeries(14, 18450, 525, 36);
    expect(series[0]).toEqual({ month: 14, miles: 18450 });
    expect(series.at(-1)?.miles).toBeCloseTo(30000, 6);
  });

  it('builds a model with allowance, projection and scenario series', () => {
    const model = buildChartModel(calculatePCPMileage(input()), 525);
    expect(model.series.map((series) => series.id)).toEqual([
      'allowance',
      'projection',
      'scenario',
    ]);
    // Each series is distinguishable without colour.
    expect(new Set(model.series.map((series) => series.style)).size).toBe(3);
  });
});

describe('text equivalents (FR-015, FR-027)', () => {
  it('IT-025 describes every chart series in text', () => {
    const lines = buildChartSummary(calculatePCPMileage(input()), 525);
    expect(lines).toHaveLength(4);
    expect(lines.join(' ')).toContain('47,443 miles');
    expect(lines.join(' ')).toContain('30,000 miles');
  });

  it('builds a shareable summary with no personal data and a disclaimer', () => {
    const summary = buildShareSummary(calculatePCPMileage(input()));
    expect(summary).toContain('£1,395.43');
    expect(summary).toContain('525 miles/month');
    expect(summary).toContain('not financial advice');
  });
});

describe('local persistence (UT-078..080)', () => {
  it('UT-078 restores a valid stored state', () => {
    const values = { ...EMPTY_FORM, totalAllowance: '30000', allowanceMode: 'total' as const };
    expect(parseStoredState(JSON.stringify(values))).toEqual(values);
  });

  it('UT-079 ignores corrupt stored state', () => {
    expect(parseStoredState('{not json')).toBeNull();
    expect(parseStoredState(null)).toBeNull();
  });

  it('discards stored keys of the wrong type', () => {
    const restored = parseStoredState(JSON.stringify({ totalAllowance: 30000, tierEnabled: 'yes' }));
    expect(restored?.totalAllowance).toBe(EMPTY_FORM.totalAllowance);
    expect(restored?.tierEnabled).toBe(false);
  });

  it('UT-080 clears stored data', () => {
    saveForm({ ...EMPTY_FORM, totalAllowance: '30000' });
    expect(loadSavedForm()).not.toBeNull();
    clearSavedForm();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(loadSavedForm()).toBeNull();
  });
});
