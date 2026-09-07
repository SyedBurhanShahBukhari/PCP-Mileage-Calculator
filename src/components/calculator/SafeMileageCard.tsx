import { Icon } from '../ui/Icon';
import { formatMiles } from '../../lib/format';
import { describeSafeMileage } from '../../lib/presentation';
import type { CalculationResult } from '../../lib/types';

/**
 * Result card 2 — the most actionable number on the page (spec §23).
 * When the total allowance is already gone we show 0 remaining rather than a
 * negative figure dressed up as usable mileage.
 */
export function SafeMileageCard({ result }: { result: CalculationResult }) {
  const { exceeded, supporting } = describeSafeMileage(result);

  if (exceeded) {
    return (
      <section className="result-card result-card--safe tone-negative" aria-labelledby="result-safe-title">
        <h3 className="result-card__eyebrow" id="result-safe-title">
          <Icon name="target" size={18} />
          To stay within your allowance
        </h3>
        <p className="metric-primary tabular" data-testid="safe-monthly">
          0 miles remaining
        </p>
        <p className="result-card__supporting">{supporting}</p>
      </section>
    );
  }

  if (result.safeMilesPerMonth === null) {
    return (
      <section className="result-card result-card--safe" aria-labelledby="result-safe-title">
        <h3 className="result-card__eyebrow" id="result-safe-title">
          <Icon name="target" size={18} />
          To stay within your allowance
        </h3>
        <p className="metric-primary tabular">{formatMiles(result.usableRemainingMiles)} miles left</p>
        <p className="result-card__supporting">{supporting}</p>
      </section>
    );
  }

  return (
    <section className="result-card result-card--safe" aria-labelledby="result-safe-title">
      <h3 className="result-card__eyebrow" id="result-safe-title">
        <Icon name="target" size={18} />
        To stay within your allowance
      </h3>
      <p className="metric-primary tabular" data-testid="safe-monthly">
        {formatMiles(result.safeMilesPerMonth)}
        <span className="metric-primary__unit"> miles/month</span>
      </p>
      <p className="metric-secondary tabular" data-testid="safe-weekly">
        About {formatMiles(result.safeMilesPerWeek)} miles/week
      </p>
      <p className="result-card__supporting">{supporting}</p>
    </section>
  );
}
