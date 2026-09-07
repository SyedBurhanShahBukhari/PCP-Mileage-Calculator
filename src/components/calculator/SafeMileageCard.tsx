import { Icon } from '../ui/Icon';
import { formatMiles, formatMilesWithUnit, formatPercent } from '../../lib/format';
import { describeSafeMileage } from '../../lib/presentation';
import type { CalculationResult } from '../../lib/types';

/**
 * Result card 2 — the most actionable number on the page (spec §23).
 *
 * When the total allowance is already gone we show 0 remaining rather than a
 * negative figure dressed up as usable mileage.
 */
export function SafeMileageCard({ result }: { result: CalculationResult }) {
  const { exceeded, supporting } = describeSafeMileage(result);

  const heading = (
    <h3 className="result-card__eyebrow" id="result-safe-title">
      <Icon name="target" size={16} />
      To stay within your allowance
    </h3>
  );

  if (exceeded) {
    return (
      <section
        className="result-card result-card--safe tone-negative"
        aria-labelledby="result-safe-title"
      >
        <div className="result-card__body">
          {heading}
          <p className="metric-primary tabular" data-testid="safe-monthly">
            0 miles remaining
          </p>
          <p className="result-card__supporting">{supporting}</p>
        </div>
      </section>
    );
  }

  if (result.safeMilesPerMonth === null) {
    return (
      <section className="result-card result-card--safe" aria-labelledby="result-safe-title">
        <div className="result-card__body">
          {heading}
          <p className="metric-primary tabular" data-testid="safe-monthly">
            {formatMiles(result.usableRemainingMiles)} miles left
          </p>
          <p className="result-card__supporting">{supporting}</p>
        </div>
      </section>
    );
  }

  const usedPct = Math.min(Math.max(result.allowanceUsedPct, 0), 100);

  return (
    <section className="result-card result-card--safe" aria-labelledby="result-safe-title">
      <div className="result-card__body">
        {heading}

        <p className="metric-primary" data-testid="safe-monthly">
          {formatMiles(result.safeMilesPerMonth)}
          <span className="metric-primary__unit"> miles/month</span>
        </p>
        <p className="metric-secondary tabular" data-testid="safe-weekly">
          or about {formatMiles(result.safeMilesPerWeek)} miles a week
        </p>

        {/* Remaining-allowance meter; the same figures follow as text. */}
        <div className="remaining-meter">
          <div className="remaining-meter__track" aria-hidden="true">
            <div className="remaining-meter__used" style={{ width: `${usedPct}%` }} />
          </div>
          <div className="remaining-meter__legend">
            <span className="tabular">{formatMilesWithUnit(result.milesDriven)} used</span>
            <span className="tabular">
              {formatMilesWithUnit(result.remainingAllowanceMiles)} left (
              {formatPercent(100 - result.allowanceUsedPct)})
            </span>
          </div>
        </div>

        <p className="result-card__supporting">{supporting}</p>
      </div>
    </section>
  );
}
