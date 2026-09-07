import { Icon, type IconName } from './Icon';

export interface RadioCardOption<T extends string> {
  value: T;
  label: string;
  description: string;
  icon?: IconName;
}

interface RadioCardGroupProps<T extends string> {
  name: string;
  legend: string;
  hint?: string;
  value: T;
  options: RadioCardOption<T>[];
  onChange: (value: T) => void;
}

/** Selectable cards, again backed by native radios for full keyboard support. */
export function RadioCardGroup<T extends string>({
  name,
  legend,
  hint,
  value,
  options,
  onChange,
}: RadioCardGroupProps<T>) {
  const hintId = hint ? `${name}-hint` : undefined;
  return (
    <fieldset className="radio-cards" aria-describedby={hintId}>
      <legend className="field__label field__label--legend">{legend}</legend>
      {hint && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      <div className="radio-cards__grid">
        {options.map((option) => (
          <label
            key={option.value}
            className={`radio-card${value === option.value ? ' is-selected' : ''}`}
            htmlFor={`${name}-${option.value}`}
          >
            <input
              className="radio-card__input"
              type="radio"
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className="radio-card__marker" aria-hidden="true" />
            <span className="radio-card__body">
              <span className="radio-card__label">
                {option.icon && <Icon name={option.icon} size={18} />}
                {option.label}
              </span>
              <span className="radio-card__description">{option.description}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
