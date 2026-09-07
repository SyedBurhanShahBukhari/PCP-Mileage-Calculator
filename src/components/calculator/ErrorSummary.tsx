import { forwardRef } from 'react';
import { Icon } from '../ui/Icon';
import type { FieldError } from '../../lib/validation';

interface ErrorSummaryProps {
  errors: FieldError[];
}

/**
 * Error summary following the GOV.UK validation pattern (spec §19, [S8]).
 *
 * Focus is moved here on a failed submit; each entry links to the field it
 * describes so keyboard and screen-reader users can jump straight to it.
 */
export const ErrorSummary = forwardRef<HTMLDivElement, ErrorSummaryProps>(function ErrorSummary(
  { errors },
  ref,
) {
  if (errors.length === 0) return null;

  return (
    <div
      ref={ref}
      className="error-summary"
      role="alert"
      tabIndex={-1}
      aria-labelledby="error-summary-title"
    >
      <h3 className="error-summary__title" id="error-summary-title">
        <Icon name="alert" size={20} />
        There {errors.length === 1 ? 'is 1 problem' : `are ${errors.length} problems`} with your
        details
      </h3>
      <ul className="error-summary__list">
        {errors.map((error) => (
          <li key={`${error.field}-${error.message}`}>
            <a
              href={`#${error.field}`}
              onClick={(event) => {
                // Focus the control itself rather than only jumping the page.
                const target = document.getElementById(error.field);
                if (target) {
                  event.preventDefault();
                  target.focus();
                  target.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
              }}
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
});
