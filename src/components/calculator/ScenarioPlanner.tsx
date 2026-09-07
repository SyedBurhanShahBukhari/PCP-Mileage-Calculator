import { Icon } from '../ui/Icon';
import { formatCurrencyFromPence, formatMiles, formatMilesWithUnit } from '../../lib/format';
import type { CalculationResult, ScenarioResult } from '../../lib/types';

interface ScenarioPlannerProps {
  result: CalculationResult;
  scenario: ScenarioResult | null;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

const SLIDER_MAX = 3000;

/**
 * "What if you change how much you drive?" (spec §27, FR-024).
 *
 * The numeric input is the source of truth; the slider is an optional
 * companion, satisfying WCAG 2.2's requirement for a non-dragging alternative.
 */
export function ScenarioPlanner({ result, scenario, value, error, onChange }: ScenarioPlannerProps) {
  const baseline = result.charge;
  const sliderValue = Math.min(Math.max(Number(value.replace(/[^0-9.]/g, '')) || 0, 0), SLIDER_MAX);
  const describedBy = ['scenario-hint', error ? 'plannedMilesPerMonth-error' : null]
    .filter(Boolean)
    .join(' ');

  return (
    <section className="scenario" aria-labelledby="scenario-title">
      <h3 className="section-heading" id="scenario-title">
        What if you change how much you drive?
      </h3>
      <p className="section-intro">
        Adjust your expected monthly mileage to see how it could affect your end-of-contract
        position. This keeps the miles you have already driven and only changes your future pace.
      </p>

      <div className="scenario__controls">
        <div className={`field${error ? ' field--error' : ''}`}>
          <label className="field__label" htmlFor="plannedMilesPerMonth">
            Expected mileage from now
          </label>
          <p className="field__hint" id="scenario-hint">
            Your recent average is about{' '}
            {formatMiles(result.historicalAverageMonthly ?? 0)} miles/month.
          </p>
          {error && (
            <p className="field__error" id="plannedMilesPerMonth-error">
              <span className="visually-hidden">Error: </span>
              {error}
            </p>
          )}
          <div className="field__control field__control--suffixed">
            <input
              id="plannedMilesPerMonth"
              name="plannedMilesPerMonth"
              className="field__input"
              type="text"
              inputMode="numeric"
              value={value}
              placeholder="700"
              aria-describedby={describedBy || undefined}
              aria-invalid={error ? true : undefined}
              onChange={(event) => onChange(event.target.value)}
            />
            <span className="field__suffix" aria-hidden="true">
              miles/month
            </span>
          </div>
        </div>

        <div className="scenario__slider">
          <label className="field__label" htmlFor="plannedMilesSlider">
            Or drag to adjust
          </label>
          <input
            id="plannedMilesSlider"
            className="slider"
            type="range"
            min={0}
            max={SLIDER_MAX}
            step={25}
            value={sliderValue}
            onChange={(event) => onChange(event.target.value)}
          />
          <div className="scenario__slider-scale tabular" aria-hidden="true">
            <span>0</span>
            <span>{formatMiles(SLIDER_MAX)}</span>
          </div>
        </div>
      </div>

      {scenario && (
        <div className="scenario__comparison" data-testid="scenario-comparison">
          <div className="comparison-card">
            <p className="comparison-card__eyebrow">Current pace</p>
            <p className="comparison-card__value tabular">
              {baseline ? formatCurrencyFromPence(baseline.totalPence) : formatMilesWithUnit(result.projectedOverageMiles ?? 0)}
            </p>
            <p className="comparison-card__meta tabular">
              {formatMilesWithUnit(result.projectedEndDrivenMiles ?? result.milesDriven)} at the end
            </p>
          </div>

          <div className="comparison-arrow" aria-hidden="true">
            <Icon name="arrow-right" size={20} />
          </div>

          <div className="comparison-card comparison-card--plan">
            <p className="comparison-card__eyebrow">Your plan</p>
            <p className="comparison-card__value tabular" data-testid="scenario-charge">
              {scenario.charge
                ? formatCurrencyFromPence(scenario.charge.totalPence)
                : formatMilesWithUnit(scenario.overageMiles)}
            </p>
            <p className="comparison-card__meta tabular" data-testid="scenario-end-mileage">
              {formatMilesWithUnit(scenario.endDrivenMiles)} at the end
            </p>
          </div>
        </div>
      )}

      {scenario && (
        <dl className="scenario__stats">
          <div>
            <dt>Projected excess with your plan</dt>
            <dd className="tabular" data-testid="scenario-excess">
              {formatMilesWithUnit(scenario.overageMiles)}
            </dd>
          </div>
          {scenario.differencePence !== null && (
            <div>
              <dt>Potential difference based on your estimate</dt>
              <dd className="tabular" data-testid="scenario-difference">
                {scenario.differencePence === 0
                  ? 'No change'
                  : `${formatCurrencyFromPence(Math.abs(scenario.differencePence))} ${
                      scenario.differencePence > 0 ? 'less' : 'more'
                    }`}
              </dd>
            </div>
          )}
        </dl>
      )}

      {scenario ? (
        <p className="scenario__caveat">
          Based on the mileage you expect to drive. It is a planning estimate, not a quote.
        </p>
      ) : (
        <p className="scenario__empty">
          Enter the mileage you expect to drive each month to compare it with your current pace.
        </p>
      )}
    </section>
  );
}
