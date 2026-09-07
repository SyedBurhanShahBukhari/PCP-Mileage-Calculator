import { forwardRef } from 'react';

interface DateFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: React.ReactNode;
  error?: string;
  supporting?: React.ReactNode;
  max?: string;
  optional?: boolean;
}

/** Native date input — the platform picker is the most accessible option here. */
export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(function DateField(
  { id, label, value, onChange, hint, error, supporting, max, optional = false },
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
      <div className="field__control">
        <input
          ref={ref}
          id={id}
          name={id}
          className="field__input"
          type="date"
          value={value}
          max={max}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      {supporting && (
        <p className="field__supporting" id={supportingId}>
          {supporting}
        </p>
      )}
    </div>
  );
});
