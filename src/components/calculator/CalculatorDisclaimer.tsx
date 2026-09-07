import { Icon } from '../ui/Icon';

/** Sits directly beneath the cost estimate (spec §29, FR-020). */
export function CalculatorDisclaimer() {
  return (
    <aside className="notice" aria-labelledby="notice-title">
      <Icon name="info" size={20} className="notice__icon" />
      <div>
        <h3 className="notice__title" id="notice-title">
          About this estimate
        </h3>
        <p>
          This calculator is for planning purposes only. Your PCP agreement determines your actual
          mileage allowance, excess mileage rate, VAT treatment and any other charges. Always check
          your agreement or contact your finance provider before relying on the estimate.
        </p>
      </div>
    </aside>
  );
}
