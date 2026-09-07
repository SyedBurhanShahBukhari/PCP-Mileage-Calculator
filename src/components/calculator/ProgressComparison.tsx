import { formatPercent } from '../../lib/format';

interface ProgressComparisonProps {
  timeElapsedPct: number;
  allowanceUsedPct: number;
}

interface BarProps {
  label: string;
  value: number;
  variant: 'time' | 'mileage';
  ahead: boolean;
}

function Bar({ label, value, variant, ahead }: BarProps) {
  const width = Math.min(Math.max(value, 0), 100);
  const overflow = value > 100;
  return (
    <div className="progress-bar">
      <div className="progress-bar__head">
        <span className="progress-bar__label">{label}</span>
        <span className="progress-bar__value tabular">{formatPercent(value)}</span>
      </div>
      {/* Bars are decorative: the same figures appear as text above. */}
      <div className={`progress-bar__track progress-bar__track--${variant}`} aria-hidden="true">
        <div
          className={`progress-bar__fill${ahead ? ' progress-bar__fill--ahead' : ''}${
            overflow ? ' progress-bar__fill--overflow' : ''
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

/**
 * The single clearest picture of pace: how much of the term has passed against
 * how much of the allowance is gone. Pattern and text carry the meaning, so the
 * comparison still reads without colour (spec §21/§22).
 */
export function ProgressComparison({ timeElapsedPct, allowanceUsedPct }: ProgressComparisonProps) {
  const ahead = allowanceUsedPct > timeElapsedPct;
  return (
    <div className="progress-comparison">
      <Bar label="Contract time elapsed" value={timeElapsedPct} variant="time" ahead={false} />
      <Bar label="Mileage allowance used" value={allowanceUsedPct} variant="mileage" ahead={ahead} />
      <p className="progress-comparison__note">
        {ahead
          ? 'Your mileage is being used faster than your contract time is passing.'
          : 'Your mileage is being used no faster than your contract time is passing.'}
      </p>
    </div>
  );
}
