import { Disclosure } from '../ui/Disclosure';
import { Icon } from '../ui/Icon';
import {
  formatCurrencyFromPence,
  formatMiles,
  formatMilesWithUnit,
  formatPence,
} from '../../lib/format';
import { describeEndAction } from '../../lib/presentation';
import type { CalculationResult, NormalisedInput } from '../../lib/types';

interface ForecastCardProps {
  result: CalculationResult;
  input: NormalisedInput;
}

/** Result card 3 — where the current pace lands, and what it might cost (§24). */
export function ForecastCard({ result, input }: ForecastCardProps) {
  const endAction = describeEndAction(result.endAction);
  const charge = result.charge;

  if (result.projectedEndDrivenMiles === null) {
    return (
      <section className="result-card" aria-labelledby="result-forecast-title">
        <h3 className="result-card__eyebrow" id="result-forecast-title">
          <Icon name="chart" size={18} />
          End-of-contract forecast
        </h3>
        <p className="result-card__supporting">
          Your agreement has not started running yet, so there is no driving history to project
          from. Use the planner below to model how much you expect to drive each month.
        </p>
      </section>
    );
  }

  return (
    <section className="result-card result-card--forecast" aria-labelledby="result-forecast-title">
      <h3
        className="result-card__eyebrow"
        id="result-forecast-title"
        data-testid="forecast-heading"
      >
        <Icon name="chart" size={18} />
        {result.progress.contractComplete
          ? 'At the end of your agreement'
          : 'If you keep driving at your current pace'}
      </h3>

      <dl className="forecast-grid">
        <div>
          <dt>Projected end mileage</dt>
          <dd className="tabular" data-testid="projected-end-mileage">
            {formatMilesWithUnit(result.projectedEndDrivenMiles)}
          </dd>
        </div>
        <div>
          <dt>Contract allowance</dt>
          <dd className="tabular">{formatMilesWithUnit(result.totalAllowanceMiles)}</dd>
        </div>
        <div>
          <dt>Projected excess</dt>
          <dd className="tabular" data-testid="projected-excess">
            {formatMilesWithUnit(result.projectedOverageMiles ?? 0)}
          </dd>
        </div>
      </dl>

      {charge ? (
        <div
          className={`charge-panel charge-panel--${endAction.emphasis}`}
          data-testid="charge-panel"
        >
          <p className="charge-panel__label">
            {endAction.chargeLabel}
            <span className="tag">Estimate only</span>
          </p>
          <p className="charge-panel__amount tabular" data-testid="estimated-charge">
            {formatCurrencyFromPence(charge.totalPence)}
          </p>

          {charge.vatUncertain && (
            <p className="charge-panel__note" data-testid="vat-uncertain-note">
              Shown before any additional VAT. We have not added VAT because your agreement&rsquo;s
              VAT treatment is unconfirmed.
            </p>
          )}

          {charge.vatPence > 0 && (
            <dl className="charge-breakdown" data-testid="vat-breakdown">
              <div>
                <dt>Base charge</dt>
                <dd className="tabular">{formatCurrencyFromPence(charge.basePence)}</dd>
              </div>
              <div>
                <dt>VAT at {input.vatRatePercent}%</dt>
                <dd className="tabular">{formatCurrencyFromPence(charge.vatPence)}</dd>
              </div>
              <div className="charge-breakdown__total">
                <dt>Estimated total</dt>
                <dd className="tabular">{formatCurrencyFromPence(charge.totalPence)}</dd>
              </div>
            </dl>
          )}

          {charge.tier2Miles > 0 && input.tier2RatePence !== null && (
            <Disclosure summary="See charge breakdown" tone="quiet">
              <dl className="charge-breakdown" data-testid="tier-breakdown">
                <div>
                  <dt>
                    First {formatMiles(charge.tier1Miles)} excess miles at{' '}
                    {formatPence(input.chargeRatePence)}
                  </dt>
                  <dd className="tabular">
                    {formatCurrencyFromPence(
                      Math.round(charge.tier1Miles * (input.chargeRatePence ?? 0)),
                    )}
                  </dd>
                </div>
                <div>
                  <dt>
                    Remaining {formatMiles(charge.tier2Miles)} excess miles at{' '}
                    {formatPence(input.tier2RatePence)}
                  </dt>
                  <dd className="tabular">
                    {formatCurrencyFromPence(Math.round(charge.tier2Miles * input.tier2RatePence))}
                  </dd>
                </div>
                <div className="charge-breakdown__total">
                  <dt>Base charge</dt>
                  <dd className="tabular">{formatCurrencyFromPence(charge.basePence)}</dd>
                </div>
              </dl>
            </Disclosure>
          )}

          <p className="charge-panel__note">{endAction.note}</p>
        </div>
      ) : (
        <div className="charge-panel charge-panel--empty">
          <p className="charge-panel__label">Estimated excess charge</p>
          <p className="charge-panel__prompt">
            Add your contract rate above to estimate your potential charge. We never assume a
            typical rate on your behalf.
          </p>
        </div>
      )}
    </section>
  );
}
