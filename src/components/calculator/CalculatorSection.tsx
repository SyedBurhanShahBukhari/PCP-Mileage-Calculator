import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalculatorForm } from './CalculatorForm';
import { MileageChart } from './MileageChart';
import { ResultsPanel } from './ResultsPanel';
import { ScenarioPlanner } from './ScenarioPlanner';
import { Icon } from '../ui/Icon';
import { track } from '../../lib/analytics';
import { calculatePCPMileage, calculateScenario, calculateTotalAllowance } from '../../lib/calculations';
import { todayIso } from '../../lib/dates';
import { EMPTY_FORM } from '../../lib/defaults';
import { describeStatus } from '../../lib/presentation';
import { parseNumber, parseNumberOrNull } from '../../lib/parse';
import { clearSavedForm, loadSavedForm, saveForm } from '../../lib/persistence';
import type {
  CalculationResult,
  CalculatorFormValues,
  NormalisedInput,
  ScenarioResult,
} from '../../lib/types';
import { validateCalculatorInput, validatePlannedMileage, type FieldError } from '../../lib/validation';

interface CalculatorSectionProps {
  /** Injected so tests are deterministic (spec FR-029, NFR-003). */
  asOfDate?: string;
  /** Disabled in tests so a shared store cannot leak between cases. */
  persist?: boolean;
  initialValues?: CalculatorFormValues;
}

export function CalculatorSection({
  asOfDate = todayIso(),
  persist = true,
  initialValues,
}: CalculatorSectionProps) {
  const [values, setValues] = useState<CalculatorFormValues>(
    () => initialValues ?? (persist ? loadSavedForm() : null) ?? EMPTY_FORM,
  );
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [input, setInput] = useState<NormalisedInput | null>(null);
  const [scenarioRaw, setScenarioRaw] = useState('');
  const [hasCalculated, setHasCalculated] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [focusErrorSummary, setFocusErrorSummary] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [hasSavedData, setHasSavedData] = useState(false);

  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    track({ name: 'calculator_view' });
    if (persist) setHasSavedData(loadSavedForm() !== null);
  }, [persist]);

  useEffect(() => {
    if (persist) saveForm(values);
  }, [values, persist]);

  /* Live-derived total allowance so annual mode never asks users to convert. */
  const derivedTotalAllowance = useMemo(() => {
    if (values.allowanceMode !== 'annual') return null;
    const annual = parseNumberOrNull(values.annualAllowance);
    const term = parseNumberOrNull(values.contractLength);
    if (!annual || !term || annual <= 0 || term <= 0) return null;
    return calculateTotalAllowance({
      allowanceMode: 'annual',
      annualAllowanceMiles: annual,
      totalAllowanceMiles: null,
      contractLengthMonths: term,
    });
  }, [values.allowanceMode, values.annualAllowance, values.contractLength]);

  const handleChange = useCallback(
    <K extends keyof CalculatorFormValues>(key: K, value: CalculatorFormValues[K]) => {
      setValues((previous) => {
        const next = { ...previous, [key]: value };

        if (key === 'vatMode') track({ name: 'vat_mode_selected', mode: next.vatMode });
        if (key === 'tierEnabled') track({ name: 'tier_enabled', enabled: next.tierEnabled });
        if (key === 'endAction') track({ name: 'end_action_selected', action: next.endAction });

        return next;
      });
    },
    [],
  );

  /*
   * Once the user has submitted, errors already on screen clear as they are
   * fixed, but typing never raises *new* errors (spec §10.2). Live
   * recalculation of the result starts only after the first successful
   * calculation, so an invalid intermediate state cannot produce a figure.
   */
  useEffect(() => {
    if (!hasSubmitted) return;
    const outcome = validateCalculatorInput(values, asOfDate);
    if (outcome.ok) {
      setErrors([]);
      if (hasCalculated) {
        setInput(outcome.value);
        setResult(calculatePCPMileage(outcome.value));
      }
    } else {
      setErrors((current) =>
        current.length === 0
          ? current
          : current.filter((error) =>
              outcome.errors.some(
                (next) => next.field === error.field && next.message === error.message,
              ),
            ),
      );
    }
  }, [values, asOfDate, hasSubmitted, hasCalculated]);

  /* Focus the summary only after it has actually rendered. */
  useEffect(() => {
    if (!focusErrorSummary) return;
    errorSummaryRef.current?.focus();
    setFocusErrorSummary(false);
  }, [focusErrorSummary, errors]);

  const handleSubmit = useCallback(() => {
    const outcome = validateCalculatorInput(values, asOfDate);
    setHasSubmitted(true);

    if (!outcome.ok) {
      setErrors(outcome.errors);
      track({
        name: 'calculator_validation_error',
        fields: outcome.errors.map((error) => error.field),
      });
      // Focus the summary so keyboard and screen-reader users land on it.
      setFocusErrorSummary(true);
      return;
    }

    const nextResult = calculatePCPMileage(outcome.value);
    setErrors([]);
    setInput(outcome.value);
    setResult(nextResult);
    setHasCalculated(true);
    setAnnouncement(`Results updated. ${describeStatus(nextResult).headline}.`);
    track({ name: 'calculator_submit' });
    if (outcome.value.chargeRatePence !== null) track({ name: 'rate_added' });
    if (persist) setHasSavedData(true);

    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  }, [values, asOfDate, persist]);

  const handleReset = useCallback(() => {
    setValues(EMPTY_FORM);
    setErrors([]);
    setResult(null);
    setInput(null);
    setScenarioRaw('');
    setHasCalculated(false);
    setHasSubmitted(false);
    setAnnouncement('Calculator reset.');
  }, []);

  const handleClearData = useCallback(() => {
    clearSavedForm();
    setHasSavedData(false);
    track({ name: 'clear_data' });
    handleReset();
  }, [handleReset]);

  /* --- Scenario planner ------------------------------------------------- */
  const scenarioError = useMemo(
    () => validatePlannedMileage(scenarioRaw)?.message,
    [scenarioRaw],
  );

  const scenarioMonthly = useMemo(() => {
    if (scenarioError) return null;
    const parsed = parseNumber(scenarioRaw);
    return parsed.ok ? parsed.value : null;
  }, [scenarioRaw, scenarioError]);

  const scenario: ScenarioResult | null = useMemo(() => {
    if (!result || !input || scenarioMonthly === null) return null;
    return calculateScenario(
      scenarioMonthly,
      {
        milesDriven: result.milesDriven,
        remainingMonths: result.progress.remainingMonths,
        totalAllowanceMiles: result.totalAllowanceMiles,
        startOdometerMiles: result.startOdometerMiles,
      },
      input,
      result.charge?.totalPence ?? null,
    );
  }, [result, input, scenarioMonthly]);

  const handleScenarioChange = useCallback((next: string) => {
    setScenarioRaw(next);
    track({ name: 'scenario_used' });
  }, []);

  return (
    <section className="calculator" id="calculator" aria-labelledby="calculator-title">
      <div className="container">
        <div className="calculator__intro">
          <h2 className="section-heading" id="calculator-title">
            PCP mileage calculator
          </h2>
          <p className="section-intro">
            Everything stays in your browser. No account, no email address, no vehicle registration.
          </p>
        </div>

        <div className="calculator__layout">
          <div className="calculator__form-column">
            <CalculatorForm
              values={values}
              errors={errors}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onReset={handleReset}
              asOfDate={asOfDate}
              derivedTotalAllowance={derivedTotalAllowance}
              errorSummaryRef={errorSummaryRef}
            />

            {hasSavedData && (
              <p className="privacy-note">
                <Icon name="info" size={16} />
                Your entries are saved in this browser only.{' '}
                <button type="button" className="button button--link" onClick={handleClearData}>
                  Clear saved calculator data
                </button>
              </p>
            )}
          </div>

          <div className="calculator__results-column" ref={resultsRef}>
            <ResultsPanel result={result} input={input} scenario={scenario} />
          </div>
        </div>

        {result && input && (
          <div className="calculator__wide">
            <MileageChart result={result} scenarioMonthly={scenarioMonthly} />
            <ScenarioPlanner
              result={result}
              scenario={scenario}
              value={scenarioRaw}
              error={scenarioError}
              onChange={handleScenarioChange}
            />
          </div>
        )}
      </div>

      {/* Announced once per calculation, not on every keystroke. */}
      <p className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}
