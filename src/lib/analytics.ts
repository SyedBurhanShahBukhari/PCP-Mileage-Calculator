/**
 * Analytics adapter (spec §11, IT-030).
 *
 * Only categorical, non-sensitive properties are ever emitted. Odometer
 * readings, allowances and pence-per-mile rates are deliberately unreachable
 * from this module's public surface.
 */

export type AnalyticsEvent =
  | { name: 'calculator_view' }
  | { name: 'calculator_submit' }
  | { name: 'calculator_validation_error'; fields: string[] }
  | { name: 'rate_added' }
  | { name: 'vat_mode_selected'; mode: 'included' | 'additional' | 'unknown' }
  | { name: 'tier_enabled'; enabled: boolean }
  | { name: 'end_action_selected'; action: string }
  | { name: 'scenario_used' }
  | { name: 'result_share' }
  | { name: 'clear_data' };

type Sink = (event: AnalyticsEvent) => void;

let sink: Sink | null = null;

/** Host apps opt in by registering a sink; by default nothing is sent. */
export function setAnalyticsSink(next: Sink | null): void {
  sink = next;
}

export function track(event: AnalyticsEvent): void {
  if (!sink) return;
  try {
    sink(event);
  } catch {
    /* Analytics must never interfere with the calculator. */
  }
}
