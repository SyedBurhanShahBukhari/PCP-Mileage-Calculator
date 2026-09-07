import { forwardRef } from 'react';
import { AllowanceSelector } from './AllowanceSelector';
import { ChargeOptions } from './ChargeOptions';
import { ContractDetails } from './ContractDetails';
import { EndActionSelector } from './EndActionSelector';
import { ErrorSummary } from './ErrorSummary';
import { Icon } from '../ui/Icon';
import type { CalculatorFormValues } from '../../lib/types';
import type { FieldError } from '../../lib/validation';

interface CalculatorFormProps {
  values: CalculatorFormValues;
  errors: FieldError[];
  onChange: <K extends keyof CalculatorFormValues>(key: K, value: CalculatorFormValues[K]) => void;
  onSubmit: () => void;
  onReset: () => void;
  asOfDate: string;
  derivedTotalAllowance: number | null;
  errorSummaryRef: React.RefObject<HTMLDivElement>;
}

export const CalculatorForm = forwardRef<HTMLFormElement, CalculatorFormProps>(
  function CalculatorForm(
    { values, errors, onChange, onSubmit, onReset, asOfDate, derivedTotalAllowance, errorSummaryRef },
    ref,
  ) {
    const errorFor = (field: FieldError['field']) =>
      errors.find((error) => error.field === field)?.message;

    return (
      <form
        ref={ref}
        className="card calculator-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="card__header">
          <h2 className="card__title" id="calculator-form-title">
            Your PCP agreement
          </h2>
          <p className="card__subtitle">
            Use the figures from your finance agreement where possible.
          </p>
        </div>

        <ErrorSummary ref={errorSummaryRef} errors={errors} />

        <AllowanceSelector
          values={values}
          onChange={onChange}
          errorFor={errorFor}
          derivedTotalAllowance={derivedTotalAllowance}
        />

        <ContractDetails
          values={values}
          onChange={onChange}
          errorFor={errorFor}
          asOfDate={asOfDate}
        />

        <ChargeOptions values={values} onChange={onChange} errorFor={errorFor} />

        <EndActionSelector
          value={values.endAction}
          onChange={(endAction) => onChange('endAction', endAction)}
        />

        <div className="calculator-form__actions">
          <button type="submit" className="button button--primary button--large">
            <Icon name="calculator" size={20} />
            Calculate my mileage
          </button>
          <button type="button" className="button button--text" onClick={onReset}>
            Reset calculator
          </button>
        </div>
      </form>
    );
  },
);
