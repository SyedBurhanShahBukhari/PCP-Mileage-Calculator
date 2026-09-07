import { forwardRef } from 'react';

/**
 * Text input for numeric entry (spec §36, FR-018/FR-019).
 *
 * Uses `type="text"` with `inputMode` rather than `type="number"`, so pasted
 * values such as `30,000` and `18 450` survive, mobile keyboards are right, and
 * scroll-wheel/spinner mishaps can't silently change a figure.
 *
 * Label, hint and error are wired with `aria-describedby`; the error id is
 * listed first so it is announced before the hint.
 */

export interface NumberFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: React.ReactNode;
  error?: string;
  suffix?: string;
  placeholder?: string;
  mode?: 'numeric' | 'decimal';
  optional?: boolean;
  /** Additional description rendered under the field (e.g. derived totals). */
  supporting?: React.ReactNode;
  autoComplete?: string;
  size?: 'default' | 'large';
}

export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField(
  {
    id,
    label,
    value,
    onChange,
    hint,
    error,
    suffix,
    placeholder,
    mode = 'numeric',
    optional = false,
    supporting,
    autoComplete = 'off',
    size = 'default',
  },
  ref,
) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const supportingId = supporting ? `${id}-supporting` : undefined;
  const describedBy = [errorId, hintId, supportingId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
        {optional && <span className="field__optional"> (optional)</span>}
      </label>
      {hint && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={errorId}>
          <span className="visually-hidden">Error: </span>
          {error}
        </p>
      )}
      <div className={`field__control${suffix ? ' field__control--suffixed' : ''}`}>
        <input
          ref={ref}
          id={id}
          name={id}
          className={`field__input${size === 'large' ? ' field__input--large' : ''}`}
          type="text"
          inputMode={mode}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix && (
          <span className="field__suffix" aria-hidden="true">
            {suffix}
          </span>
        )}
      </div>
      {supporting && (
        <p className="field__supporting" id={supportingId}>
          {supporting}
        </p>
      )}
    </div>
  );
});
