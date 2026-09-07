import { Icon, type IconName } from '../ui/Icon';
import { ProgressComparison } from './ProgressComparison';
import { formatMilesWithUnit } from '../../lib/format';
import { describeStatus } from '../../lib/presentation';
import type { CalculationResult } from '../../lib/types';

const STATUS_ICON: Record<string, IconName> = {
  ON_TRACK: 'check',
  UNDER: 'check',
  OVER: 'alert',
  EXCEEDED_TOTAL: 'exceeded',
};

/** Result card 1 — the answer to "am I on track?" (spec §21). */
export function MileageStatusCard({ result }: { result: CalculationResult }) {
  const status = describeStatus(result);

  return (
    <section className={`result-card result-card--status tone-${status.tone}`} aria-labelledby="result-status-title">
      <h3 className="result-card__eyebrow" id="result-status-title">
        Your mileage position
      </h3>

      <p className="status-badge">
        <Icon name={STATUS_ICON[status.status]} size={18} />
        <span>{status.label}</span>
      </p>

      <p className="status-headline" data-testid="status-headline">
        {status.headline}
      </p>
      <p className="status-detail">{status.detail}</p>

      <ProgressComparison
        timeElapsedPct={result.progress.ratio * 100}
        allowanceUsedPct={result.allowanceUsedPct}
      />

      <dl className="stat-row">
        <div>
          <dt>Miles driven so far</dt>
          <dd className="tabular">{formatMilesWithUnit(result.milesDriven)}</dd>
        </div>
        <div>
          <dt>Allowance pace by now</dt>
          <dd className="tabular">{formatMilesWithUnit(result.allowedMilesToDate)}</dd>
        </div>
      </dl>
    </section>
  );
}
