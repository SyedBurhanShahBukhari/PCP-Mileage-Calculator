import { Icon } from '../ui/Icon';

export function SiteHeader() {
  return (
    <header className="site-header no-print">
      <div className="container site-header__inner">
        <a className="brand" href="#top">
          <span className="brand__mark" aria-hidden="true">
            <Icon name="gauge" size={20} />
          </span>
          <span className="brand__name">PCP Mileage</span>
        </a>
        <nav aria-label="Primary">
          <ul className="site-nav">
            <li>
              <a href="#calculator">Calculator</a>
            </li>
            <li>
              <a href="#how-it-works">How it works</a>
            </li>
            <li>
              <a href="#faqs">FAQs</a>
            </li>
            <li className="site-nav__aside">
              <a href="#mileage-guide">Mileage guide</a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
