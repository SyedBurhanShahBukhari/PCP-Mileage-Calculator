import { Icon } from '../ui/Icon';

/** The result panel before the first calculation (spec §41). */
export function EmptyResults() {
  return (
    <div className="results-empty">
      <span className="results-empty__icon" aria-hidden="true">
        <Icon name="gauge" size={28} />
      </span>
      <h2 className="results-empty__title">Your mileage forecast will appear here</h2>
      <p className="results-empty__body">
        Enter your PCP details to see whether you&rsquo;re on track and what you can safely drive
        from now.
      </p>
      <ul className="results-empty__list">
        <li>
          <Icon name="gauge" size={18} />
          Mileage position
        </li>
        <li>
          <Icon name="target" size={18} />
          Monthly target
        </li>
        <li>
          <Icon name="pound" size={18} />
          Estimated cost
        </li>
      </ul>
    </div>
  );
}
