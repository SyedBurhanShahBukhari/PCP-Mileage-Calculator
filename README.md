# PCP Mileage Calculator

A production-quality mileage calculator for UK PCP (personal contract purchase) customers.
It answers one question quickly — **"am I on track with my mileage?"** — and then shows what
can safely be driven from now, where the current pace lands at hand-back, and what any excess
might cost.

Everything runs in the browser. No account, no email address, no vehicle registration, and no
financial values ever leave the device.

## Getting started

```bash
npm install
npm run dev        # development server
npm run build      # type-check + production build
npm run preview    # serve the production build
npm test           # unit + integration tests (Vitest)
npm run lint       # ESLint
```

## Architecture

The calculation rules live in pure, framework-free modules so they can be unit-tested directly
and reused without touching the UI.

```
src/
  lib/
    calculations.ts   Pure engine: allowance, pace, projection, charges, VAT, scenarios
    validation.ts     Normalises raw form strings into engine input + field errors
    parse.ts          Tolerant numeric parsing ("30,000", "18 450")
    dates.ts          Calendar-month arithmetic and precise elapsed-day progress
    money.ts          Integer-pence arithmetic — no floating-point artefacts
    format.ts         Display formatting (miles, currency, percent, pence)
    presentation.ts   Status wording and end-of-agreement messaging rules
    chart.ts          Chart series builders (consumed by the SVG chart and the text summary)
    summary.ts        Text equivalents: chart summary and copy/share output
    persistence.ts    Optional localStorage adapter with an explicit clear action
    analytics.ts      Event adapter that can only emit non-sensitive categories
    types.ts          Raw form values / normalised input / result models, kept separate
  components/
    calculator/       Form groups, result cards, chart, scenario planner, breakdown
    ui/               Field, segmented control, radio cards, disclosure, icons
    sections/         Hero, how-it-works, explainer, FAQs
    layout/           Header and footer
tests/                Unit and integration suites mirroring the QA matrices
```

### Three separate data shapes

Raw form values (strings, exactly as typed), normalised input (validated numbers and dates),
and the calculation result (pure numbers) are deliberately distinct types. Formatted strings
never feed back into a calculation.

### Determinism

The engine takes an injected `asOfDate` rather than reading the clock, so a given input always
produces the same output. Tests pass a fixed date; `App` and `CalculatorSection` accept an
`asOfDate` prop for the same reason.

### Money

Currency is carried as integer pence throughout. Rates are quoted in pence per mile, so
`excessMiles × rate` is already a pence amount; rounding happens once, at the point a charge
component is finalised. Nothing like `£1395.4285680003` can reach the screen.

## Calculation model

| Quantity | Rule |
| --- | --- |
| Total allowance | Entered directly, or `annual × term / 12` in annual mode |
| Miles driven | `currentOdometer − startOdometer` — never the raw odometer |
| Elapsed progress | `elapsedDays / termDays` in date mode; `elapsedMonths / term` otherwise |
| Allowance pace to date | `totalAllowance × elapsedRatio` |
| Pace variance | `milesDriven − allowedToDate` |
| Safe monthly target | `max(remaining, 0) / remainingMonths` |
| Projection | Historical pace extrapolated over the full term |
| Projected excess | `max(projected − allowance, 0)` — never negative |
| Charge | Flat or tiered, then VAT only when the user says VAT is additional |

Edge cases handled explicitly: zero elapsed time (no projection rather than a divide by zero),
a completed contract, mileage already beyond the total allowance, a blank rate, an explicit
zero rate, and a start date past the contract end.

## Things the calculator will not do

- Substitute a "typical" pence-per-mile rate the user did not enter.
- Add VAT when the VAT treatment is unknown.
- Apply a tiered rate unless it is explicitly enabled and fully configured.
- Claim an excess charge is payable when the user plans to buy the vehicle.
- Present a part-exchange figure as an invoice.
- Send odometer readings, allowances or rates to analytics.

## Accessibility

Targets WCAG 2.2 AA: semantic landmarks and a single `h1`, persistent visible labels,
hints and errors linked with `aria-describedby`, an error summary that takes focus and links
to each field, native radios behind the segmented control and end-action cards, real
`aria-expanded` disclosures, a keyboard-navigable chart with a full text equivalent, a numeric
alternative to the scenario slider, status conveyed by text and icon as well as colour, and
`prefers-reduced-motion` support.

## Tests

192 tests across seven suites cover the unit matrix (parsing, dates, allowance conversion,
pace, projection, flat/tiered charges, VAT, status classification, scenarios, chart series,
formatting, persistence) and the integration matrix (the reference regression case, each
status journey, allowance and elapsed-time modes, charges and VAT, end-action wording,
the scenario planner, validation behaviour, reset, persistence, and accessibility checks).

The reference regression case from the specification is asserted end to end, through the real
UI: 30,000 miles over 36 months, 18,450 on the clock at month 14 at 8p/mile produces a 525
miles/month target, a 47,443-mile projection and a £1,395.43 estimate.
