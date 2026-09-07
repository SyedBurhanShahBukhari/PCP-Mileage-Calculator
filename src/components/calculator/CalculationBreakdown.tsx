import { Disclosure } from '../ui/Disclosure';
import {
  formatCurrencyFromPence,
  formatMiles,
  formatMilesWithUnit,
  formatMonths,
  formatPence,
  formatPercent,
} from '../../lib/format';
import { formatLongDate, parseIsoDate } from '../../lib/dates';
import type { CalculationResult, NormalisedInput } from '../../lib/types';

interface Row {
  label: string;
  value: string;
}

/** Secondary detail (spec §28). Nobody should need this to get their answer. */
export function CalculationBreakdown({
  result,
  input,
}: {
  result: CalculationResult;
  input: NormalisedInput;
}) {
  const endDate = parseIsoDate(result.progress.contractEndDate);

  const rows: Row[] = [
    { label: 'Miles driven since the agreement started', value: formatMilesWithUnit(result.milesDriven) },
    {
      label: 'Time elapsed',
      value: `${formatPercent(result.progress.ratio * 100)} (${formatMonths(result.progress.elapsedMonths)} of ${formatMonths(result.contractLengthMonths)})`,
    },
    { label: 'Allowance expected by now', value: formatMilesWithUnit(result.allowedMilesToDate) },
    {
      label: 'Difference against allowance pace',
      value: `${result.paceVarianceMiles >= 0 ? '+' : '−'}${formatMilesWithUnit(Math.abs(result.paceVarianceMiles))}`,
    },
    { label: 'Allowance used', value: formatPercent(result.allowanceUsedPct) },
    {
      label: 'Historical average pace',
      value:
        result.historicalAverageMonthly === null
          ? 'Not enough elapsed time yet'
          : `${formatMiles(result.historicalAverageMonthly)} miles/month`,
    },
    {
      label: 'Remaining allowance',
      value:
        result.remainingAllowanceMiles < 0
          ? `${formatMilesWithUnit(Math.abs(result.remainingAllowanceMiles))} over the allowance`
          : formatMilesWithUnit(result.remainingAllowanceMiles),
    },
    { label: 'Remaining contract time', value: formatMonths(result.progress.remainingMonths) },
    {
      label: 'Projected miles driven at the end',
      value:
        result.projectedEndDrivenMiles === null
          ? 'Not projected'
          : formatMilesWithUnit(result.projectedEndDrivenMiles),
    },
    {
      label: 'Projected end odometer',
      value:
        result.projectedEndOdometerMiles === null
          ? 'Not projected'
          : formatMilesWithUnit(result.projectedEndOdometerMiles),
    },
    {
      label: 'Projected excess miles',
      value:
        result.projectedOverageMiles === null
          ? 'Not projected'
          : formatMilesWithUnit(result.projectedOverageMiles),
    },
  ];

  if (endDate) {
    rows.splice(2, 0, { label: 'Agreement end date', value: formatLongDate(endDate) });
  }

  if (input.chargeRatePence !== null) {
    rows.push({ label: 'Excess mileage rate', value: formatPence(input.chargeRatePence) });
  } else {
    rows.push({ label: 'Excess mileage rate', value: 'Not supplied — no charge estimated' });
  }

  if (result.charge) {
    if (input.tierEnabled && input.tier2RatePence !== null) {
      rows.push(
        {
          label: `Excess miles at ${formatPence(input.chargeRatePence)}`,
          value: formatMilesWithUnit(result.charge.tier1Miles),
        },
        {
          label: `Excess miles at ${formatPence(input.tier2RatePence)}`,
          value: formatMilesWithUnit(result.charge.tier2Miles),
        },
      );
    }
    rows.push({ label: 'Base charge', value: formatCurrencyFromPence(result.charge.basePence) });
    rows.push({
      label: 'VAT',
      value:
        input.vatMode === 'additional'
          ? `${formatCurrencyFromPence(result.charge.vatPence)} at ${input.vatRatePercent}%`
          : input.vatMode === 'included'
            ? 'Included in the rate you entered'
            : 'Unconfirmed — not added',
    });
    rows.push({
      label: 'Estimated total',
      value: formatCurrencyFromPence(result.charge.totalPence),
    });
  }

  return (
    <Disclosure summary="How we calculated this">
      <table className="breakdown-table">
        <caption className="visually-hidden">
          Step-by-step figures behind your mileage estimate
        </caption>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td className="tabular">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="breakdown-note">
        Straight-line allowance means your {formatMilesWithUnit(result.totalAllowanceMiles)} is
        spread evenly across {formatMonths(result.contractLengthMonths)}. Your projection assumes
        your driving so far is representative of the rest of the agreement.
      </p>
    </Disclosure>
  );
}
