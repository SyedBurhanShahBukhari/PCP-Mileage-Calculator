import { useState } from 'react';
import { CalculationBreakdown } from './CalculationBreakdown';
import { CalculatorDisclaimer } from './CalculatorDisclaimer';
import { EmptyResults } from './EmptyResults';
import { ForecastCard } from './ForecastCard';
import { MileageStatusCard } from './MileageStatusCard';
import { SafeMileageCard } from './SafeMileageCard';
import { Icon } from '../ui/Icon';
import { track } from '../../lib/analytics';
import { buildShareSummary } from '../../lib/summary';
import type { CalculationResult, NormalisedInput, ScenarioResult } from '../../lib/types';

interface ResultsPanelProps {
  result: CalculationResult | null;
  input: NormalisedInput | null;
  scenario: ScenarioResult | null;
}

export function ResultsPanel({ result, input, scenario }: ResultsPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!result || !input) {
    return (
      <div className="results-panel" id="results">
        <EmptyResults />
      </div>
    );
  }

  const handleCopy = async () => {
    const summary = buildShareSummary(result, scenario);
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      track({ name: 'result_share' });
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="results-panel" id="results">
      <h2 className="results-panel__title">Your results</h2>

      <MileageStatusCard result={result} />
      <SafeMileageCard result={result} />
      <ForecastCard result={result} input={input} />

      <CalculatorDisclaimer />

      <CalculationBreakdown result={result} input={input} />

      <div className="results-panel__actions no-print">
        <button type="button" className="button button--secondary" onClick={handleCopy}>
          <Icon name="copy" size={18} />
          {copied ? 'Summary copied' : 'Copy result summary'}
        </button>
        <button type="button" className="button button--text" onClick={() => window.print()}>
          Print result
        </button>
      </div>
    </div>
  );
}
