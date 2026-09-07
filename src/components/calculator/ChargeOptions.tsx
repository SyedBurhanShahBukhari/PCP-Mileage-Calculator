import { Disclosure } from '../ui/Disclosure';
import { NumberField } from '../ui/NumberField';
import type { CalculatorFormValues, VatMode } from '../../lib/types';
import type { FieldError } from '../../lib/validation';

interface ChargeOptionsProps {
  values: CalculatorFormValues;
  onChange: <K extends keyof CalculatorFormValues>(key: K, value: CalculatorFormValues[K]) => void;
  errorFor: (field: FieldError['field']) => string | undefined;
}

const VAT_OPTIONS: { value: VatMode; label: string; description: string }[] = [
  {
    value: 'included',
    label: 'Included in my rate',
    description: 'The pence-per-mile figure in your agreement is the amount you would pay.',
  },
  {
    value: 'additional',
    label: 'Added to my rate',
    description: 'Your agreement quotes the rate excluding VAT, so VAT is added on top.',
  },
  {
    value: 'unknown',
    label: "I'm not sure",
    description: 'We will show the charge before any additional VAT and will not add VAT for you.',
  },
];

/**
 * Group 4. The rate is genuinely optional — every mileage result still works
 * without it, and we never substitute a "typical" rate (spec §7, DoD).
 */
export function ChargeOptions({ values, onChange, errorFor }: ChargeOptionsProps) {
  const hasRate = values.chargeRatePence.trim() !== '';

  return (
    <section className="form-group" aria-labelledby="group-charge">
      <h3 className="form-group__title" id="group-charge">
        Excess mileage charge
      </h3>
      <p className="form-group__intro">
        Optional. Your mileage forecast works without this — adding it lets us estimate a cost.
      </p>

      <NumberField
        id="chargeRatePence"
        label="Excess mileage rate"
        optional
        value={values.chargeRatePence}
        onChange={(value) => onChange('chargeRatePence', value)}
        error={errorFor('chargeRatePence')}
        hint="You'll normally find this in your PCP agreement. Leave it blank if you're unsure."
        placeholder="10"
        suffix="p / mile"
        mode="decimal"
      />

      {!hasRate && (
        <p className="derived-note derived-note--muted">
          Add your contract rate to estimate your potential charge.
        </p>
      )}

      <Disclosure summary="Advanced charge options" tone="quiet">
        <fieldset className="radio-list">
          <legend className="field__label field__label--legend">VAT treatment</legend>
          <p className="field__hint" id="vatMode-hint">
            Some lenders quote the pence-per-mile rate excluding VAT.
          </p>
          <div className="radio-list__options" aria-describedby="vatMode-hint">
            {VAT_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`radio-list__option${values.vatMode === option.value ? ' is-selected' : ''}`}
                htmlFor={`vatMode-${option.value}`}
              >
                <input
                  type="radio"
                  id={`vatMode-${option.value}`}
                  name="vatMode"
                  value={option.value}
                  checked={values.vatMode === option.value}
                  onChange={() => onChange('vatMode', option.value)}
                />
                <span className="radio-list__body">
                  <span className="radio-list__label">{option.label}</span>
                  <span className="radio-list__description">{option.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {values.vatMode === 'additional' && (
          <NumberField
            id="vatRatePercent"
            label="VAT rate"
            value={values.vatRatePercent}
            onChange={(value) => onChange('vatRatePercent', value)}
            error={errorFor('vatRatePercent')}
            hint="Change this only if your agreement states a different rate."
            suffix="%"
            mode="decimal"
          />
        )}

        <div className="checkbox">
          <input
            type="checkbox"
            id="tierEnabled"
            checked={values.tierEnabled}
            onChange={(event) => onChange('tierEnabled', event.target.checked)}
            aria-describedby="tierEnabled-hint"
          />
          <div>
            <label htmlFor="tierEnabled" className="checkbox__label">
              My agreement has a higher mileage rate after a threshold
            </label>
            <p className="field__hint" id="tierEnabled-hint">
              Only tick this if your agreement actually says so — we never assume a tiered rate.
            </p>
          </div>
        </div>

        {values.tierEnabled && (
          <div className="form-row">
            <NumberField
              id="tierThresholdMiles"
              label="Higher rate starts after"
              value={values.tierThresholdMiles}
              onChange={(value) => onChange('tierThresholdMiles', value)}
              error={errorFor('tierThresholdMiles')}
              placeholder="5,000"
              suffix="excess miles"
            />
            <NumberField
              id="tier2RatePence"
              label="Higher rate"
              value={values.tier2RatePence}
              onChange={(value) => onChange('tier2RatePence', value)}
              error={errorFor('tier2RatePence')}
              placeholder="15"
              suffix="p / mile"
              mode="decimal"
            />
          </div>
        )}
      </Disclosure>
    </section>
  );
}
