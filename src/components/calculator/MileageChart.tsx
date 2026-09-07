import { useEffect, useMemo, useRef, useState } from 'react';
import { Disclosure } from '../ui/Disclosure';
import { buildChartModel, type ChartSeries } from '../../lib/chart';
import { formatMiles, formatMilesWithUnit } from '../../lib/format';
import { buildChartSummary } from '../../lib/summary';
import type { CalculationResult } from '../../lib/types';

interface MileageChartProps {
  result: CalculationResult;
  scenarioMonthly: number | null;
}

const MARGIN = { top: 26, right: 16, bottom: 42, left: 64 };
const LABEL_GUTTER = 92;

/** Dash patterns carry series identity so the chart never relies on colour. */
const DASH: Record<ChartSeries['style'], string | undefined> = {
  solid: undefined,
  dashed: '9 6',
  dotted: '1.5 5',
};

/**
 * A round tick step targeting ~5 gridlines. Aiming for five rather than four
 * keeps the top tick close to the data instead of leaving a band of dead space
 * above the highest line.
 */
function niceStep(range: number): number {
  const rough = range / 5;
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(rough, 1)));
  const candidates = [1, 2, 2.5, 5, 10].map((m) => m * magnitude);
  return candidates.find((c) => c >= rough) ?? magnitude * 10;
}

/**
 * Lightweight bespoke SVG chart (spec §26, §48).
 *
 * A charting dependency is not justified for a handful of straight lines, and
 * drawing it here means the keyboard cursor, tick density, the shaded excess
 * region and the text alternative all behave exactly as intended.
 *
 * The chart's real job is to make one thing obvious: the gap between the
 * contract allowance and where the current pace lands. That gap is filled, and
 * its size at the end of the term is the projected excess.
 */
export function MileageChart({ result, scenarioMonthly }: MileageChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  const [cursorMonth, setCursorMonth] = useState<number | null>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width;
      if (next && next > 0) setWidth(next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const model = useMemo(() => buildChartModel(result, scenarioMonthly), [result, scenarioMonthly]);
  const summaryLines = useMemo(
    () => buildChartSummary(result, scenarioMonthly),
    [result, scenarioMonthly],
  );

  const compact = width < 560;
  const height = compact ? 280 : 340;
  const rightMargin = compact ? MARGIN.right : MARGIN.right + LABEL_GUTTER;
  const plotWidth = Math.max(width - MARGIN.left - rightMargin, 80);
  const plotHeight = height - MARGIN.top - MARGIN.bottom;

  const step = niceStep(Math.max(model.maxMiles - model.minMiles, 1));
  const yFloor = Math.floor(model.minMiles / step) * step;
  const yMax = Math.ceil(model.maxMiles / step) * step;
  const yTicks: number[] = [];
  for (let value = yFloor; value <= yMax + 0.5; value += step) yTicks.push(value);

  const x = (month: number) => MARGIN.left + (month / Math.max(model.maxMonth, 1)) * plotWidth;
  const y = (miles: number) =>
    MARGIN.top + plotHeight - ((miles - yFloor) / Math.max(yMax - yFloor, 1)) * plotHeight;

  const monthStep = Math.max(Math.ceil(model.maxMonth / (compact ? 4 : 6)), 1);
  const xTicks: number[] = [];
  for (let month = 0; month <= model.maxMonth; month += monthStep) xTicks.push(month);
  if (xTicks.at(-1) !== model.maxMonth) xTicks.push(model.maxMonth);

  /** Interpolates a series at an arbitrary month, or null outside its span. */
  const valueAt = (series: ChartSeries, month: number): number | null => {
    const points = series.points;
    if (points.length < 2) return null;
    const first = points[0];
    const last = points[points.length - 1];
    if (month < first.month - 0.001 || month > last.month + 0.001) return null;
    const span = Math.max(last.month - first.month, 1e-9);
    return first.miles + ((month - first.month) / span) * (last.miles - first.miles);
  };

  const clampMonth = (month: number) => Math.min(Math.max(month, 0), model.maxMonth);

  const activeMonth = cursorMonth;
  const readings =
    activeMonth === null
      ? []
      : model.series
          .map((series) => ({ series, value: valueAt(series, activeMonth) }))
          .filter((entry): entry is { series: ChartSeries; value: number } => entry.value !== null);

  const handlePointer = (event: React.PointerEvent<SVGSVGElement>) => {
    if (pinned) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const relative = (event.clientX - rect.left - MARGIN.left) / plotWidth;
    setCursorMonth(clampMonth(Math.round(relative * model.maxMonth)));
  };

  const handleKey = (event: React.KeyboardEvent<SVGSVGElement>) => {
    const base = activeMonth ?? Math.round(model.todayMonth);
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      setPinned(true);
      setCursorMonth(clampMonth(base + (event.key === 'ArrowRight' ? 1 : -1)));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setPinned(true);
      setCursorMonth(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setPinned(true);
      setCursorMonth(model.maxMonth);
    } else if (event.key === 'Escape') {
      setPinned(false);
      setCursorMonth(null);
    }
  };

  /*
   * End-of-line labels, placed in the right gutter. Where two lines converge
   * their labels would collide, so the lower-priority one is dropped rather
   * than stacked — the legend and tooltip still carry it.
   */
  const endLabels = (() => {
    if (compact) return [];
    const priority: ChartSeries['id'][] = ['projection', 'scenario', 'actual', 'allowance'];
    const candidates = model.series
      .filter((series) => series.points.length >= 2)
      .filter((series) => series.points.at(-1)!.month >= model.maxMonth - 0.001)
      .map((series) => {
        const end = series.points.at(-1)!;
        return { id: series.id, label: series.label, miles: end.miles, y: y(end.miles) };
      })
      .sort((a, b) => priority.indexOf(a.id) - priority.indexOf(b.id));

    const placed: typeof candidates = [];
    for (const candidate of candidates) {
      if (placed.every((other) => Math.abs(other.y - candidate.y) >= 30)) placed.push(candidate);
    }
    return placed;
  })();

  const tooltipLeft = activeMonth === null ? 0 : x(activeMonth);
  const flipTooltip = tooltipLeft > MARGIN.left + plotWidth * 0.6;

  return (
    <section className="chart-section" aria-labelledby="chart-title">
      <div className="chart-section__head">
        <h3 className="section-heading" id="chart-title">
          Your mileage projection
        </h3>
        <p className="section-intro">
          Odometer readings across the full contract term. The shaded band is the difference
          between your contract allowance and where your current pace lands.
        </p>
      </div>

      <div className="chart" ref={containerRef}>
        <svg
          width={width}
          height={height}
          className="chart__svg"
          role="img"
          tabIndex={0}
          aria-labelledby="chart-title chart-desc"
          onPointerMove={handlePointer}
          onPointerLeave={() => {
            if (!pinned) setCursorMonth(null);
          }}
          onKeyDown={handleKey}
          onFocus={() => setCursorMonth((current) => current ?? Math.round(model.todayMonth))}
          onBlur={() => {
            setPinned(false);
            setCursorMonth(null);
          }}
        >
          <desc id="chart-desc">{summaryLines.join(' ')}</desc>

          {/* Gridlines: solid hairlines, one step off the surface. */}
          {yTicks.map((tick) => (
            <g key={`y-${tick}`}>
              <line
                className="chart__grid"
                x1={MARGIN.left}
                x2={MARGIN.left + plotWidth}
                y1={y(tick)}
                y2={y(tick)}
              />
              <text className="chart__tick" x={MARGIN.left - 12} y={y(tick) + 4} textAnchor="end">
                {formatMiles(tick)}
              </text>
            </g>
          ))}

          {xTicks.map((tick) => (
            <text
              key={`x-${tick}`}
              className="chart__tick"
              x={x(tick)}
              y={MARGIN.top + plotHeight + 24}
              textAnchor="middle"
            >
              {tick}
            </text>
          ))}
          <text
            className="chart__axis-label"
            x={MARGIN.left + plotWidth / 2}
            y={height - 6}
            textAnchor="middle"
          >
            Contract month
          </text>

          <g className="chart__marks">
            {/*
             * The gap between the allowance and the projected pace. Both lines
             * start at the same odometer reading, so the region is a triangle
             * whose height at the right edge is the projected excess.
             */}
            {model.gap && (
              <polygon
                className={`chart__gap chart__gap--${model.gap.over ? 'over' : 'under'}`}
                points={[
                  `${x(0)},${y(model.gap.startMiles)}`,
                  `${x(model.maxMonth)},${y(model.gap.projectedEndMiles)}`,
                  `${x(model.maxMonth)},${y(model.gap.allowanceEndMiles)}`,
                ].join(' ')}
              />
            )}

            {model.series.map((series) => (
              <polyline
                key={series.id}
                className={`chart__line chart__line--${series.id}`}
                points={series.points.map((p) => `${x(p.month)},${y(p.miles)}`).join(' ')}
                strokeDasharray={DASH[series.style]}
                fill="none"
              />
            ))}

            {/* Today: a labelled threshold, not a gridline. */}
            <line
              className="chart__today"
              x1={x(model.todayMonth)}
              x2={x(model.todayMonth)}
              y1={MARGIN.top - 4}
              y2={MARGIN.top + plotHeight}
            />
            <g transform={`translate(${x(model.todayMonth)}, ${MARGIN.top - 12})`}>
              <rect className="chart__today-pill" x={-24} y={-11} width={48} height={19} rx={9.5} />
              <text className="chart__today-label" textAnchor="middle" y={2}>
                Today
              </text>
            </g>

            <circle
              className="chart__point"
              cx={x(model.todayMonth)}
              cy={y(model.todayMiles)}
              r={5}
            />

            {endLabels.map((label) => (
              <text
                key={label.id}
                className={`chart__end-label chart__end-label--${label.id}`}
                x={MARGIN.left + plotWidth + 10}
                y={label.y + 4}
              >
                {formatMiles(label.miles)}
              </text>
            ))}
          </g>

          {activeMonth !== null && (
            <g className="chart__cursor-group">
              <line
                className="chart__cursor"
                x1={x(activeMonth)}
                x2={x(activeMonth)}
                y1={MARGIN.top}
                y2={MARGIN.top + plotHeight}
              />
              {readings.map((reading) => (
                <circle
                  key={reading.series.id}
                  className={`chart__cursor-dot chart__cursor-dot--${reading.series.id}`}
                  cx={x(activeMonth)}
                  cy={y(reading.value)}
                  r={4.5}
                />
              ))}
            </g>
          )}
        </svg>

        {activeMonth !== null && readings.length > 0 && (
          <div
            className={`chart-tooltip${flipTooltip ? ' chart-tooltip--flip' : ''}`}
            style={{ left: `${tooltipLeft}px` }}
            role="presentation"
          >
            <p className="chart-tooltip__title">Month {formatMiles(activeMonth)}</p>
            <ul className="chart-tooltip__list">
              {readings.map((reading) => (
                <li key={reading.series.id}>
                  <span
                    className={`chart-key chart-key--${reading.series.id} chart-key--${reading.series.style}`}
                    aria-hidden="true"
                  />
                  <span className="chart-tooltip__label">{reading.series.label}</span>
                  <span className="chart-tooltip__value tabular">
                    {formatMiles(reading.value)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Screen-reader equivalent of the tooltip. */}
        <p className="visually-hidden" role="status" aria-live="polite">
          {activeMonth === null
            ? ''
            : `Month ${Math.round(activeMonth)}. ${readings
                .map((r) => `${r.series.label} ${formatMilesWithUnit(r.value)}`)
                .join('. ')}`}
        </p>
      </div>

      <ul className="chart-legend">
        {model.series.map((series) => (
          <li key={series.id} className="chart-legend__item">
            <span
              className={`chart-key chart-key--${series.id} chart-key--${series.style}`}
              aria-hidden="true"
            />
            {series.label}
          </li>
        ))}
        {model.gap && model.gap.endMiles > 0 && (
          <li className="chart-legend__item">
            <span
              className={`chart-key chart-key--gap chart-key--gap-${model.gap.over ? 'over' : 'under'}`}
              aria-hidden="true"
            />
            {model.gap.over ? 'Projected excess' : 'Unused allowance'}{' '}
            <span className="tabular">({formatMilesWithUnit(model.gap.endMiles)})</span>
          </li>
        )}
      </ul>

      <p className="chart__hint">
        Hover the chart, or focus it and use the arrow keys, to read the figures for any month.
      </p>

      <Disclosure summary="Read the chart as text" tone="quiet">
        <ul className="chart-summary">
          {summaryLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Disclosure>
    </section>
  );
}
