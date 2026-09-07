import { Icon } from '../ui/Icon';

/**
 * Compact hero (spec §9). It introduces the job to be done and hands over to
 * the calculator quickly rather than filling the first viewport with marketing.
 */
export function Hero() {
  const focusFirstInput = () => {
    const target =
      document.getElementById('annualAllowance') ?? document.getElementById('totalAllowance');
    target?.focus();
    target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  return (
    <section className="hero" aria-labelledby="hero-title">
      {/* Abstract road motif — decorative only, no vehicle photography. */}
      <svg className="hero__motif" aria-hidden="true" focusable="false" viewBox="0 0 1200 220" preserveAspectRatio="none">
        <path d="M0 190 C 260 190, 300 70, 560 70 S 900 160, 1200 40" fill="none" />
        <path d="M0 210 C 260 210, 300 90, 560 90 S 900 180, 1200 60" fill="none" strokeDasharray="10 14" />
      </svg>

      <div className="container hero__inner">
        <p className="hero__eyebrow">PCP Mileage Calculator</p>
        <h1 className="hero__title" id="hero-title">
          Are you on track with your PCP mileage?
        </h1>
        <p className="hero__lead">
          Check your current mileage pace, see how many miles you can safely drive from now, and
          estimate any potential excess mileage charge.
        </p>
        <p className="hero__trust">
          <Icon name="check" size={16} /> Free calculator
          <span aria-hidden="true">•</span> No account required
          <span aria-hidden="true">•</span> Takes under a minute
        </p>
        <button type="button" className="button button--primary button--large" onClick={focusFirstInput}>
          Check my mileage
          <Icon name="arrow-right" size={18} />
        </button>
      </div>
    </section>
  );
}
