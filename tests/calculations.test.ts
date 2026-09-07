import { describe, expect, it } from 'vitest';
import {
  applyVAT,
  calculateAllowedMileageToDate,
  calculateCharge,
  calculateElapsedProgress,
  calculateElapsedRatioManual,
  calculateFlatCharge,
  calculateHistoricalAverageMonthly,
  calculateHistoricalProjection,
  calculateMilesDriven,
  calculatePCPMileage,
  calculatePaceVariance,
  calculateProjectedOverage,
  calculateRemainingMileage,
  calculateSafeMonthlyMileage,
  calculateScenario,
  calculateTieredCharge,
  calculateTotalAllowance,
  classifyMileageStatus,
} from '../src/lib/calculations';
import type { NormalisedInput } from '../src/lib/types';

const baseInput = (overrides: Partial<NormalisedInput> = {}): NormalisedInput => ({
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

describe('calculateTotalAllowance (UT-007..010)', () => {
  it('UT-007 uses the entered figure in total mode', () => {
    expect(
      calculateTotalAllowance({
        allowanceMode: 'total',
        annualAllowanceMiles: null,
        totalAllowanceMiles: 30000,
        contractLengthMonths: 36,
      }),
    ).toBe(30000);
  });

  it('UT-008 converts 10,000 a year over 36 months', () => {
    expect(
      calculateTotalAllowance({
        allowanceMode: 'annual',
        annualAllowanceMiles: 10000,
        totalAllowanceMiles: null,
        contractLengthMonths: 36,
      }),
    ).toBe(30000);
  });

  it('UT-009 converts 8,000 a year over a 42-month term', () => {
    expect(
      calculateTotalAllowance({
        allowanceMode: 'annual',
        annualAllowanceMiles: 8000,
        totalAllowanceMiles: null,
        contractLengthMonths: 42,
      }),
    ).toBe(28000);
  });

  it('does not round a non-12-multiple term before calculating', () => {
    expect(
      calculateTotalAllowance({
        allowanceMode: 'annual',
        annualAllowanceMiles: 10000,
        totalAllowanceMiles: null,
        contractLengthMonths: 30,
      }),
    ).toBe(25000);
  });
});

describe('calculateMilesDriven (UT-011..013, spec §38)', () => {
  it('UT-011 handles a zero starting odometer', () => {
    expect(calculateMilesDriven(0, 18450)).toBe(18450);
  });

  it('UT-012 subtracts a non-zero starting odometer', () => {
    expect(calculateMilesDriven(12000, 30450)).toBe(18450);
  });

  it('UT-013 returns zero for equal readings', () => {
    expect(calculateMilesDriven(12000, 12000)).toBe(0);
  });
});

describe('elapsed progress (UT-015..017, UT-021..023)', () => {
  it('UT-015 computes 14 of 36 months', () => {
    expect(calculateElapsedRatioManual(14, 36)).toBeCloseTo(0.3888888889, 10);
  });

  it('UT-016 computes zero elapsed', () => {
    expect(calculateElapsedRatioManual(0, 36)).toBe(0);
  });

  it('UT-017 computes a completed term', () => {
    expect(calculateElapsedRatioManual(36, 36)).toBe(1);
  });

  it('derives progress precisely from a start date', () => {
    const progress = calculateElapsedProgress({
      contractStartDate: '2025-01-01',
      contractLengthMonths: 36,
      elapsedMonthsManual: null,
      asOfDate: '2026-01-01',
    });
    expect(progress.basis).toBe('daily');
    expect(progress.contractEndDate).toBe('2028-01-01');
    expect(progress.elapsedDays).toBe(365);
    expect(progress.termDays).toBe(1095);
    expect(progress.ratio).toBeCloseTo(365 / 1095, 10);
    expect(progress.contractComplete).toBe(false);
  });

  it('IT-013/UT-023 clamps date mode past the contract end', () => {
    const progress = calculateElapsedProgress({
      contractStartDate: '2020-01-01',
      contractLengthMonths: 36,
      elapsedMonthsManual: null,
      asOfDate: '2026-09-07',
    });
    expect(progress.ratio).toBe(1);
    expect(progress.remainingMonths).toBe(0);
    expect(progress.contractComplete).toBe(true);
  });
});

describe('pace (UT-024..031)', () => {
  it('UT-024 computes the reference allowed mileage to date', () => {
    expect(calculateAllowedMileageToDate(30000, 14 / 36)).toBeCloseTo(11666.6667, 4);
  });

  it('UT-025 computes allowed mileage at halfway', () => {
    expect(calculateAllowedMileageToDate(30000, 0.5)).toBe(15000);
  });

  it('UT-026 reports a positive variance when over pace', () => {
    expect(calculatePaceVariance(18450, 11666.6667)).toBeCloseTo(6783.3333, 4);
  });

  it('UT-027 reports a negative variance when under pace', () => {
    expect(calculatePaceVariance(10000, 15000)).toBe(-5000);
  });

  it('UT-028 reports zero at exact pace', () => {
    expect(calculatePaceVariance(15000, 15000)).toBe(0);
  });

  it('UT-029 computes remaining mileage under the allowance', () => {
    expect(calculateRemainingMileage(30000, 18450)).toBe(11550);
  });

  it('UT-030 computes zero remaining at the allowance', () => {
    expect(calculateRemainingMileage(30000, 30000)).toBe(0);
  });

  it('UT-031 returns a raw negative remaining once exceeded', () => {
    expect(calculateRemainingMileage(30000, 31200)).toBe(-1200);
  });
});

describe('safe monthly target (UT-032..034)', () => {
  it('UT-032 matches the reference target', () => {
    expect(calculateSafeMonthlyMileage(11550, 22)).toBe(525);
  });

  it('UT-033 clamps to zero when already over the allowance', () => {
    expect(calculateSafeMonthlyMileage(-1200, 10)).toBe(0);
  });

  it('UT-034 returns null when no contract time remains', () => {
    expect(calculateSafeMonthlyMileage(1000, 0)).toBeNull();
  });
});

describe('projection (UT-035..042)', () => {
  it('UT-035 computes the reference average monthly pace', () => {
    expect(calculateHistoricalAverageMonthly(18450, 14)).toBeCloseTo(1317.8571429, 6);
  });

  it('UT-036 does not divide by zero elapsed time', () => {
    expect(calculateHistoricalAverageMonthly(0, 0)).toBeNull();
  });

  it('UT-037 projects the reference end mileage', () => {
    const progress = calculateElapsedProgress({
      contractStartDate: null,
      contractLengthMonths: 36,
      elapsedMonthsManual: 14,
      asOfDate: '2026-09-07',
    });
    expect(calculateHistoricalProjection(18450, progress)).toBeCloseTo(47442.8571, 4);
  });

  it('UT-039 projects exactly the allowance at exact pace', () => {
    const progress = calculateElapsedProgress({
      contractStartDate: null,
      contractLengthMonths: 36,
      elapsedMonthsManual: 18,
      asOfDate: '2026-09-07',
    });
    expect(calculateHistoricalProjection(15000, progress)).toBe(30000);
  });

  it('UT-076 returns no projection at zero elapsed time', () => {
    const progress = calculateElapsedProgress({
      contractStartDate: null,
      contractLengthMonths: 36,
      elapsedMonthsManual: 0,
      asOfDate: '2026-09-07',
    });
    expect(calculateHistoricalProjection(0, progress)).toBeNull();
  });

  it('IT-012 treats a completed contract as its actual mileage', () => {
    const progress = calculateElapsedProgress({
      contractStartDate: null,
      contractLengthMonths: 36,
      elapsedMonthsManual: 36,
      asOfDate: '2026-09-07',
    });
    expect(calculateHistoricalProjection(31000, progress)).toBe(31000);
  });

  it('UT-040 computes an overage', () => {
    expect(calculateProjectedOverage(47442.8571, 30000)).toBeCloseTo(17442.8571, 4);
  });

  it('UT-041/042 never returns a negative overage', () => {
    expect(calculateProjectedOverage(25000, 30000)).toBe(0);
    expect(calculateProjectedOverage(30000, 30000)).toBe(0);
  });

  it('UT-038 adds the starting odometer to the projected end reading', () => {
    const result = calculatePCPMileage(
      baseInput({ startOdometerMiles: 12000, currentOdometerMiles: 30450 }),
    );
    expect(result.projectedEndOdometerMiles).toBeCloseTo(59442.8571, 4);
  });
});

describe('charges (UT-043..051)', () => {
  it('UT-043 computes the reference charge at 8p', () => {
    expect(calculateFlatCharge(17442.857142857, 8)).toBe(139543);
  });

  it('UT-044 computes a decimal rate', () => {
    expect(calculateFlatCharge(2000, 10.5)).toBe(21000);
  });

  it('UT-045 charges nothing without an overage', () => {
    expect(calculateFlatCharge(0, 20)).toBe(0);
  });

  it('UT-046 returns null when no rate is supplied', () => {
    expect(calculateFlatCharge(2000, null)).toBeNull();
  });

  it('UT-047 honours an explicit zero rate', () => {
    expect(calculateFlatCharge(2000, 0)).toBe(0);
  });

  it('UT-048 charges the primary rate below the threshold', () => {
    expect(calculateTieredCharge(4000, 10, 5000, 15).basePence).toBe(40000);
  });

  it('UT-049 charges the primary rate at exactly the threshold', () => {
    expect(calculateTieredCharge(5000, 10, 5000, 15).basePence).toBe(50000);
  });

  it('UT-050 splits miles across both rates above the threshold', () => {
    const tiers = calculateTieredCharge(7000, 10, 5000, 15);
    expect(tiers.tier1Miles).toBe(5000);
    expect(tiers.tier2Miles).toBe(2000);
    expect(tiers.basePence).toBe(80000);
  });

  it('UT-051 uses a single rate when tiering is disabled', () => {
    const charge = calculateCharge(7000, {
      chargeRatePence: 10,
      vatMode: 'included',
      vatRatePercent: null,
      tierEnabled: false,
      tierThresholdExcessMiles: null,
      tier2RatePence: null,
    });
    expect(charge?.basePence).toBe(70000);
    expect(charge?.tier2Miles).toBe(0);
  });

  it('never applies tiering unless it is enabled and fully configured', () => {
    const charge = calculateCharge(7000, {
      chargeRatePence: 10,
      vatMode: 'included',
      vatRatePercent: null,
      tierEnabled: true,
      tierThresholdExcessMiles: null,
      tier2RatePence: 15,
    });
    expect(charge?.basePence).toBe(70000);
  });
});

describe('VAT (UT-052..055)', () => {
  it('UT-052 leaves an inclusive rate untouched', () => {
    expect(applyVAT(80000, 'included', null)).toEqual({
      vatPence: 0,
      totalPence: 80000,
      vatUncertain: false,
    });
  });

  it('UT-053 adds 20% VAT when it is additional', () => {
    expect(applyVAT(80000, 'additional', 20)).toEqual({
      vatPence: 16000,
      totalPence: 96000,
      vatUncertain: false,
    });
  });

  it('UT-054 never silently adds VAT when the treatment is unknown', () => {
    expect(applyVAT(80000, 'unknown', 20)).toEqual({
      vatPence: 0,
      totalPence: 80000,
      vatUncertain: true,
    });
  });

  it('UT-055 handles a zero VAT rate', () => {
    expect(applyVAT(80000, 'additional', 0)).toEqual({
      vatPence: 0,
      totalPence: 80000,
      vatUncertain: false,
    });
  });
});

describe('classifyMileageStatus (UT-056..060)', () => {
  const options = { milesDriven: 10000, totalAllowanceMiles: 30000, toleranceMiles: 100 };

  it('UT-056 classifies clearly over pace', () => {
    expect(classifyMileageStatus(1000, options)).toBe('OVER');
  });

  it('UT-057 treats a small positive variance as on track', () => {
    expect(classifyMileageStatus(80, options)).toBe('ON_TRACK');
  });

  it('UT-058 treats a small negative variance as on track', () => {
    expect(classifyMileageStatus(-80, options)).toBe('ON_TRACK');
  });

  it('UT-059 classifies clearly under pace', () => {
    expect(classifyMileageStatus(-1000, options)).toBe('UNDER');
  });

  it('UT-060 gives the exceeded-total state priority', () => {
    expect(
      classifyMileageStatus(-5000, { milesDriven: 31200, totalAllowanceMiles: 30000 }),
    ).toBe('EXCEEDED_TOTAL');
  });
});

describe('calculateScenario (UT-061..064)', () => {
  const chargeInput = {
    chargeRatePence: 10,
    vatMode: 'included' as const,
    vatRatePercent: null,
    tierEnabled: false,
    tierThresholdExcessMiles: null,
    tier2RatePence: null,
  };

  it('UT-061 projects 700 miles a month for 22 months', () => {
    const scenario = calculateScenario(
      700,
      { milesDriven: 18450, remainingMonths: 22, totalAllowanceMiles: 30000, startOdometerMiles: 0 },
      chargeInput,
    );
    expect(scenario.endDrivenMiles).toBe(33850);
  });

  it('UT-062 keeps miles already driven when the plan is zero', () => {
    const scenario = calculateScenario(
      0,
      { milesDriven: 18450, remainingMonths: 22, totalAllowanceMiles: 30000, startOdometerMiles: 0 },
      chargeInput,
    );
    expect(scenario.endDrivenMiles).toBe(18450);
    expect(scenario.overageMiles).toBe(0);
  });

  it('UT-063 reports no overage when the plan stays inside the allowance', () => {
    const scenario = calculateScenario(
      800,
      { milesDriven: 10000, remainingMonths: 18, totalAllowanceMiles: 30000, startOdometerMiles: 0 },
      chargeInput,
    );
    expect(scenario.endDrivenMiles).toBe(24400);
    expect(scenario.overageMiles).toBe(0);
    expect(scenario.charge?.totalPence).toBe(0);
  });

  it('UT-064 reports an overage when the plan exceeds the allowance', () => {
    const scenario = calculateScenario(
      1000,
      { milesDriven: 20000, remainingMonths: 12, totalAllowanceMiles: 30000, startOdometerMiles: 0 },
      chargeInput,
    );
    expect(scenario.endDrivenMiles).toBe(32000);
    expect(scenario.overageMiles).toBe(2000);
    expect(scenario.charge?.totalPence).toBe(20000);
  });

  it('reports the difference against the baseline charge', () => {
    const scenario = calculateScenario(
      525,
      { milesDriven: 18450, remainingMonths: 22, totalAllowanceMiles: 30000, startOdometerMiles: 0 },
      { ...chargeInput, chargeRatePence: 8 },
      139543,
    );
    expect(scenario.overageMiles).toBe(0);
    expect(scenario.charge?.totalPence).toBe(0);
    expect(scenario.differencePence).toBe(139543);
  });
});

describe('calculatePCPMileage — reference regression (spec §4.7, IT-001)', () => {
  const result = calculatePCPMileage(baseInput());

  it('computes miles driven', () => {
    expect(result.milesDriven).toBe(18450);
  });

  it('computes time elapsed as 38.89%', () => {
    expect(result.progress.ratio * 100).toBeCloseTo(38.8889, 4);
  });

  it('computes allowance used as 61.50%', () => {
    expect(result.allowanceUsedPct).toBeCloseTo(61.5, 6);
  });

  it('computes allowed mileage by now as 11,666.67', () => {
    expect(result.allowedMilesToDate).toBeCloseTo(11666.6667, 4);
  });

  it('computes over-pace variance as 6,783.33 miles', () => {
    expect(result.paceVarianceMiles).toBeCloseTo(6783.3333, 4);
  });

  it('computes a safe target of 525 miles/month', () => {
    expect(result.safeMilesPerMonth).toBeCloseTo(525, 10);
  });

  it('computes about 121 miles/week', () => {
    expect(Math.round(result.safeMilesPerWeek as number)).toBe(121);
  });

  it('projects 47,442.86 miles at the end', () => {
    expect(result.projectedEndDrivenMiles).toBeCloseTo(47442.8571, 4);
  });

  it('projects an overage of 17,442.86 miles', () => {
    expect(result.projectedOverageMiles).toBeCloseTo(17442.8571, 4);
  });

  it('estimates a charge of £1,395.43', () => {
    expect(result.charge?.totalPence).toBe(139543);
  });

  it('classifies the driver as over pace', () => {
    expect(result.status).toBe('OVER');
  });

  it('produces no NaN or Infinity anywhere in the result', () => {
    const numbers = JSON.stringify(result);
    expect(numbers).not.toMatch(/null,"charge"/);
    for (const value of Object.values(result)) {
      if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
    }
  });
});

describe('calculatePCPMileage — edge cases', () => {
  it('IT-011 clamps the safe target once the total allowance is exceeded', () => {
    const result = calculatePCPMileage(
      baseInput({ currentOdometerMiles: 31200, elapsedMonthsManual: 26 }),
    );
    expect(result.status).toBe('EXCEEDED_TOTAL');
    expect(result.remainingAllowanceMiles).toBe(-1200);
    expect(result.usableRemainingMiles).toBe(0);
    expect(result.safeMilesPerMonth).toBe(0);
  });

  it('IT-012 handles a completed contract without dividing by zero', () => {
    const result = calculatePCPMileage(
      baseInput({ elapsedMonthsManual: 36, currentOdometerMiles: 31000 }),
    );
    expect(result.progress.remainingMonths).toBe(0);
    expect(result.safeMilesPerMonth).toBeNull();
    expect(result.projectedEndDrivenMiles).toBe(31000);
    expect(result.projectedOverageMiles).toBe(1000);
  });

  it('handles zero elapsed time without projecting', () => {
    const result = calculatePCPMileage(
      baseInput({ elapsedMonthsManual: 0, currentOdometerMiles: 0 }),
    );
    expect(result.historicalAverageMonthly).toBeNull();
    expect(result.projectedEndDrivenMiles).toBeNull();
    expect(result.projectedOverageMiles).toBeNull();
    expect(result.charge).toBeNull();
    expect(result.safeMilesPerMonth).toBeCloseTo(30000 / 36, 10);
  });

  it('IT-006 produces mileage results with no rate supplied', () => {
    const result = calculatePCPMileage(baseInput({ chargeRatePence: null }));
    expect(result.projectedOverageMiles).toBeCloseTo(17442.8571, 4);
    expect(result.charge).toBeNull();
  });

  it('IT-007 adds VAT only when the user says it is additional', () => {
    const result = calculatePCPMileage(
      baseInput({
        elapsedMonthsManual: 18,
        currentOdometerMiles: 16000,
        chargeRatePence: 10,
        vatMode: 'additional',
        vatRatePercent: 20,
      }),
    );
    expect(result.projectedOverageMiles).toBeCloseTo(2000, 6);
    expect(result.charge?.basePence).toBe(20000);
    expect(result.charge?.vatPence).toBe(4000);
    expect(result.charge?.totalPence).toBe(24000);
  });

  it('IT-008 applies a tiered rate when configured', () => {
    const result = calculatePCPMileage(
      baseInput({
        elapsedMonthsManual: 18,
        currentOdometerMiles: 18500,
        chargeRatePence: 10,
        tierEnabled: true,
        tierThresholdExcessMiles: 5000,
        tier2RatePence: 15,
      }),
    );
    expect(result.projectedOverageMiles).toBeCloseTo(7000, 6);
    expect(result.charge?.basePence).toBe(80000);
  });

  it('IT-002 reports under pace with no charge', () => {
    const result = calculatePCPMileage(
      baseInput({ elapsedMonthsManual: 18, currentOdometerMiles: 10000, chargeRatePence: 10 }),
    );
    expect(result.status).toBe('UNDER');
    expect(result.projectedEndDrivenMiles).toBe(20000);
    expect(result.charge?.totalPence).toBe(0);
  });

  it('IT-003 reports on track at exact pace', () => {
    const result = calculatePCPMileage(
      baseInput({ elapsedMonthsManual: 18, currentOdometerMiles: 15000, chargeRatePence: 10 }),
    );
    expect(result.status).toBe('ON_TRACK');
    expect(result.projectedEndDrivenMiles).toBe(30000);
    expect(result.charge?.totalPence).toBe(0);
  });

  it('IT-004 reports over pace with a £1,000 base charge', () => {
    const result = calculatePCPMileage(
      baseInput({ elapsedMonthsManual: 18, currentOdometerMiles: 20000, chargeRatePence: 10 }),
    );
    expect(result.projectedEndDrivenMiles).toBe(40000);
    expect(result.projectedOverageMiles).toBe(10000);
    expect(result.charge?.totalPence).toBe(100000);
  });

  it('IT-005 uses miles driven, not the raw odometer, with a used vehicle', () => {
    const result = calculatePCPMileage(
      baseInput({
        startOdometerMiles: 12000,
        currentOdometerMiles: 32000,
        elapsedMonthsManual: 18,
      }),
    );
    expect(result.milesDriven).toBe(20000);
    expect(result.allowanceUsedPct).toBeCloseTo(66.6667, 4);
    expect(result.projectedEndOdometerMiles).toBe(52000);
  });
});
