import { CalculatorSection } from './calculator/CalculatorSection';
import { Explainer } from './sections/Explainer';
import { Faqs } from './sections/Faqs';
import { HowItWorks } from './sections/HowItWorks';

export interface EmbeddedCalculatorProps {
  /** `calculator` embeds the tool alone; `full` adds the explanatory content. */
  sections?: 'calculator' | 'full';
  /** Optional heading rendered above the calculator by the host page. */
  heading?: string;
  persist?: boolean;
  faqSchema?: boolean;
  /** Injected as-of date, mainly so the host can pin it for testing. */
  asOfDate?: string;
}

/**
 * Embeddable root used by the WordPress plugin (and any other host page).
 *
 * Deliberately omits the site header, hero and footer: the host page supplies
 * its own chrome and its own `h1`, so this tree starts at heading level 2.
 */
export function EmbeddedCalculator({
  sections = 'calculator',
  heading,
  persist = true,
  faqSchema = false,
  asOfDate,
}: EmbeddedCalculatorProps) {
  return (
    <div className="pcp-mc">
      {heading && <h2 className="embed-heading">{heading}</h2>}
      <CalculatorSection asOfDate={asOfDate} persist={persist} />
      {sections === 'full' && (
        <>
          <HowItWorks />
          <Explainer />
          <Faqs includeSchema={faqSchema} />
        </>
      )}
    </div>
  );
}
