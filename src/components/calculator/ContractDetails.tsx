import { DateField } from '../ui/DateField';
import { NumberField } from '../ui/NumberField';
import { addCalendarMonths, formatLongDate, parseIsoDate } from '../../lib/dates';
import { parseNumberOrNull } from '../../lib/parse';
import type { CalculatorFormValues } from '../../lib/types';
import type { FieldError } from '../../lib/validation';

interface ContractDetailsProps {
  values: CalculatorFormValues;
  onChange: <K extends keyof CalculatorFormValues>(key: K, value: CalculatorFormValues[K]) => void;
  errorFor: (field: FieldError['field']) => string | undefined;
  asOfDate: string;
}

/**
 * Groups 2 and 3: when the agreement started, and where the car is today.
 *
 * Start date and manual months-elapsed are mutually exclusive (FR-005/FR-006):
 * entering a date switches the form to precise date mode and removes the
 * months field, so the user is never asked for the same fact twice.
 */
export function ContractDetails({ values, onChange, errorFor, asOfDate }: ContractDetailsProps) {
  const startDate = parseIsoDate(values.contractStartDate);
  const term = parseNumberOrNull(values.contractLength);
  const endDate =
    startDate && term && Number.isInteger(term) && term > 0
      ? addCalendarMonths(startDate, term)
      : null;

  return (
    <>
      <section className="form-group" aria-labelledby="group-start">
        <h3 className="form-group__title" id="group-start">
          When your agreement started
        </h3>

        <NumberField
          id="startOdometer"
          label="Odometer when the agreement started"
          value={values.startOdometer}
          onChange={(value) => onChange('startOdometer', value)}
          error={errorFor('startOdometer')}
          hint="For a new car this is usually close to zero."
          placeholder="0"
          suffix="miles"
        />

        <DateField
          id="contractStartDate"
          label="Agreement start date"
          optional
          value={values.contractStartDate}
          onChange={(value) => onChange('contractStartDate', value)}
          error={errorFor('contractStartDate')}
          max={asOfDate}
          hint="Add this for a more precise result. Without it, tell us how many months have passed instead."
          supporting={
            endDate ? (
              <>
                Agreement ends: <strong>{formatLongDate(endDate)}</strong>
              </>
            ) : undefined
          }
        />

        {!values.contractStartDate.trim() && (
          <NumberField
            id="elapsedMonths"
            label="Months elapsed"
            value={values.elapsedMonths}
            onChange={(value) => onChange('elapsedMonths', value)}
            error={errorFor('elapsedMonths')}
            hint="How many months of the agreement have already passed."
            placeholder="14"
            suffix="months"
          />
        )}
      </section>

      <section className="form-group form-group--emphasis" aria-labelledby="group-today">
        <h3 className="form-group__title" id="group-today">
          Where you are today
        </h3>
        <NumberField
          id="currentOdometer"
          label="Current odometer reading"
          value={values.currentOdometer}
          onChange={(value) => onChange('currentOdometer', value)}
          error={errorFor('currentOdometer')}
          hint="The mileage showing on your dashboard right now."
          placeholder="18,450"
          suffix="miles"
          size="large"
        />
      </section>
    </>
  );
}
