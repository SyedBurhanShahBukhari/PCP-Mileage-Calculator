/**
 * Segmented control built from native radios inside a fieldset.
 *
 * Native radios give arrow-key navigation, grouping and screen-reader
 * semantics for free; the visual treatment is purely CSS on the label.
 */

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  name: string;
  legend: string;
  hint?: string;
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  name,
  legend,
  hint,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  const hintId = hint ? `${name}-hint` : undefined;
  return (
    <fieldset className="segmented" aria-describedby={hintId}>
      <legend className="segmented__legend">{legend}</legend>
      {hint && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      <div className="segmented__options">
        {options.map((option) => (
          <label
            key={option.value}
            className={`segmented__option${value === option.value ? ' is-selected' : ''}`}
            htmlFor={`${name}-${option.value}`}
          >
            <input
              className="segmented__input"
              type="radio"
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className="segmented__label">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
