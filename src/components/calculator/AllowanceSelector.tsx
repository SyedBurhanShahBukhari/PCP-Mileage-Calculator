import { NumberField } from '../ui/NumberField';
import { SegmentedControl } from '../ui/SegmentedControl';
import { formatMilesWithUnit } from '../../lib/format';
import type { AllowanceMode, CalculatorFormValues } from '../../lib/types';
import type { FieldError } from '../../lib/validation';

interface AllowanceSelectorProps {
  values: CalculatorFormValues;
  onChange: <K extends keyof CalculatorFormValues>(
    key: K,
    value: CalculatorFormValues[K],
  ) => void;
  errorFor: (field: FieldError['field']) => string | undefined;
  /** Live-derived total allowance, so users never convert by hand (FR-002). */
  derivedTotalAllowance: number | null;
}

const MODE_OPTIONS: { value: AllowanceMode; label: string }[] = [
  { value: 'annual', label: 'Annual allowance' },
  { value: 'total', label: 'Total contract allowance' },
];

export function AllowanceSelector({
  values,
  onChange,
  errorFor,
  derivedTotalAllowance,
}: AllowanceSelectorProps) {
  return (
    <section className="form-group" aria-labelledby="group-allowance">
      <h3 className="form-group__title" id="group-allowance">
        Your mileage allowance
      </h3>

      <SegmentedControl
        name="allowanceMode"
        legend="How is your mileage allowance shown?"
        hint="Most agreements quote a mileage limit per year, but some quote the total for the whole term."
        value={values.allowanceMode}
        options={MODE_OPTIONS}
        onChange={(mode) => onChange('allowanceMode', mode)}
      />

      <div className="form-row">
        {values.allowanceMode === 'annual' ? (
          <NumberField
            id="annualAllowance"
            label="Annual mileage allowance"
            value={values.annualAllowance}
            onChange={(value) => onChange('annualAllowance', value)}
            error={errorFor('annualAllowance')}
            placeholder="10,000"
            suffix="miles/year"
          />
        ) : (
          <NumberField
            id="totalAllowance"
            label="Total contract mileage allowance"
            value={values.totalAllowance}
            onChange={(value) => onChange('totalAllowance', value)}
            error={errorFor('totalAllowance')}
            placeholder="30,000"
            suffix="miles"
          />
        )}

        <NumberField
          id="contractLength"
          label="Contract length"
          value={values.contractLength}
          onChange={(value) => onChange('contractLength', value)}
          error={errorFor('contractLength')}
          placeholder="36"
          suffix="months"
        />
      </div>

      {values.allowanceMode === 'annual' && derivedTotalAllowance !== null && (
        <p className="derived-note" data-testid="derived-total-allowance">
          Total contract allowance:{' '}
          <strong className="tabular">{formatMilesWithUnit(derivedTotalAllowance)}</strong>
        </p>
      )}
    </section>
  );
}
