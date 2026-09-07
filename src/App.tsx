import { CalculatorSection } from './components/calculator/CalculatorSection';
import { SiteFooter } from './components/layout/SiteFooter';
import { SiteHeader } from './components/layout/SiteHeader';
import { Explainer } from './components/sections/Explainer';
import { Faqs } from './components/sections/Faqs';
import { Hero } from './components/sections/Hero';
import { HowItWorks } from './components/sections/HowItWorks';

interface AppProps {
  /** Overridable in tests so results never depend on the machine clock. */
  asOfDate?: string;
  persist?: boolean;
}

export default function App({ asOfDate, persist }: AppProps = {}) {
  return (
    <div id="top">
      <a className="skip-link" href="#main">
        Skip to the calculator
      </a>
      <SiteHeader />
      <main id="main">
        <Hero />
        <CalculatorSection asOfDate={asOfDate} persist={persist} />
        <HowItWorks />
        <Explainer />
        <Faqs />
      </main>
      <SiteFooter />
    </div>
  );
}
