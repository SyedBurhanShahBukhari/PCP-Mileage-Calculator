import { formatPercent } from '../../lib/format';

interface ProgressComparisonProps {
  timeElapsedPct: number;
  allowanceUsedPct: number;
}

/**
 * A bullet-style pace meter (spec §22).
 *
 * The earlier version drew two separate bars and asked the reader to compare
 * their lengths. One track carries the comparison far better: the fill is the
 * allowance actually used, and a marker sits where the allowance *should* be by
 * now. Ahead of the marker means burning allowance faster than contract time.
 *
 * Both figures are also printed as text, and the fill changes pattern as well
 * as colour, so nothing here depends on seeing the bar or the hue.
 */
export function ProgressComparison({ timeElapsedPct, allowanceUsedPct }: ProgressComparisonProps) {
  const clamp = (value: number) => Math.min(Math.max(value, 0), 100);
  const usedWidth = clamp(allowanceUsedPct);
  const markerLeft = clamp(timeElapsedPct);

  const ahead = allowanceUsedPct > timeElapsedPct;
  const exceeded = allowanceUsedPct > 100;

  const tone = exceeded ? 'exceeded' : ahead ? 'ahead' : 'within';

  return (
    <div className="pace-meter">
      <div className="pace-meter__head">
        <span className="pace-meter__label">Mileage allowance used</span>
        <span className="pace-meter__value tabular" data-testid="allowance-used-pct">
          {formatPercent(allowanceUsedPct)}
        </span>
      </div>

      {/* Decorative: every figure below is also given as text. */}
      <div className={`pace-meter__track pace-meter__track--${tone}`} aria-hidden="true">
        <div className="pace-meter__fill" style={{ width: `${usedWidth}%` }} />
        <div className="pace-meter__marker" style={{ left: `${markerLeft}%` }} />
      </div>

      <div className="pace-meter__scale" aria-hidden="true">
        <span
          className="pace-meter__marker-label tabular"
          style={{ left: `${markerLeft}%` }}
        >
          On-pace mark
        </span>
      </div>

      <p className="pace-meter__caption">
        <span className="tabular" data-testid="time-elapsed-pct">
          {formatPercent(timeElapsedPct)}
        </span>{' '}
        of your contract time has passed.{' '}
        {exceeded
          ? 'You are past the full contract allowance.'
          : ahead
            ? 'Your mileage is being used faster than your contract time is passing.'
            : 'Your mileage is being used no faster than your contract time is passing.'}
      </p>
    </div>
  );
}
