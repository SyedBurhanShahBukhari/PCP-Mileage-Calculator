import { useEffect, useMemo, useRef, useState } from 'react';
import { Disclosure } from '../ui/Disclosure';
import { buildChartModel, type ChartSeries } from '../../lib/chart';
import { formatMiles } from '../../lib/format';
import { buildChartSummary } from '../../lib/summary';
import type { CalculationResult } from '../../lib/types';

interface MileageChartProps {
  result: CalculationResult;
  scenarioMonthly: number | null;
}

const MARGIN = { top: 20, right: 18, bottom: 40, left: 62 };

/** Dash patterns carry series identity so the chart never relies on colour. */
const DASH: Record<ChartSeries['style'], string | undefined> = {
  solid: undefined,
  dashed: '8 5',
  dotted: '2 5',
};

function niceStep(range: number): number {
  const rough = range / 4;
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(rough, 1)));
  const candidates = [1, 2, 2.5, 5, 10].map((m) => m * magnitude);
  return candidates.find((c) => c >= rough) ?? magnitude * 10;
}

/**
 * Lightweight bespoke SVG chart (spec §26, §48). Two or three straight lines do
 * not justify a charting dependency, and drawing it ourselves means the
 * keyboard cursor, tick density and text alternative all behave properly.
 */
export function MileageChart({ result, scenarioMonthly }: MileageChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [cursorMonth, setCursorMonth] = useState<number | null>(null);

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

  const model = useMemo(
    () => buildChartModel(result, scenarioMonthly),
    [result, scenarioMonthly],
  );
  const summaryLines = useMemo(
    () => buildChartSummary(result, scenarioMonthly),
    [result, scenarioMonthly],
  );

  const compact = width < 520;
  const height = compact ? 260 : 320;
  const plotWidth = Math.max(width - MARGIN.left - MARGIN.right, 80);
  const plotHeight = height - MARGIN.top - MARGIN.bottom;

  const yMin = model.minMiles;
  const step = niceStep(Math.max(model.maxMiles - yMin, 1));
  const yMax = Math.ceil(model.maxMiles / step) * step;
  const yTicks: number[] = [];
  for (let value = Math.floor(yMin / step) * step; value <= yMax + 0.5; value += step) {
    yTicks.push(value);
  }
  const yFloor = yTicks[0];

  const x = (month: number) => MARGIN.left + (month / Math.max(model.maxMonth, 1)) * plotWidth;
  const y = (miles: number) =>
    MARGIN.top + plotHeight - ((miles - yFloor) / Math.max(yMax - yFloor, 1)) * plotHeight;

  const monthStep = compact ? Math.max(Math.ceil(model.maxMonth / 4), 1) : Math.max(Math.ceil(model.maxMonth / 6), 1);
  const xTicks: number[] = [];
  for (let month = 0; month <= model.maxMonth; month += monthStep) xTicks.push(month);
  if (xTicks.at(-1) !== model.maxMonth) xTicks.push(model.maxMonth);

  /** Interpolates a series at an arbitrary month for the readout. */
  const valueAt = (series: ChartSeries, month: number): number | null => {
    const points = series.points;
    if (points.length < 2) return null;
    const [first, last] = [points[0], points[points.length - 1]];
    if (month < first.month || month > last.month) return null;
    const t = (month - first.month) / Math.max(last.month - first.month, 1);
    return first.miles + t * (last.miles - first.miles);
  };

  const activeMonth = cursorMonth;
  const readout =
    activeMonth === null
      ? null
      : model.series
          .map((series) => ({ label: series.label, value: valueAt(series, activeMonth) }))
          .filter((entry): entry is { label: string; value: number } => entry.value !== null);

  const clampMonth = (month: number) => Math.min(Math.max(month, 0), model.maxMonth);

  const handlePointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const relative = (event.clientX - rect.left - MARGIN.left) / plotWidth;
    setCursorMonth(clampMonth(Math.round(relative * model.maxMonth)));
  };

  const handleKey = (event: React.KeyboardEvent<SVGSVGElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const base = activeMonth ?? Math.round(model.todayMonth);
      setCursorMonth(clampMonth(base + (event.key === 'ArrowRight' ? 1 : -1)));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setCursorMonth(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setCursorMonth(model.maxMonth);
    } else if (event.key === 'Escape') {
      setCursorMonth(null);
    }
  };

  return (
    <section className="chart-section" aria-labelledby="chart-title">
      <h3 className="section-heading" id="chart-title">
        Your mileage projection
      </h3>
      <p className="section-intro">
        Odometer readings across the full contract term. Each line uses a different pattern as well
        as a different colour.
      </p>

      <div className="chart" ref={containerRef}>
        <svg
          width={width}
          height={height}
          className="chart__svg"
          role="img"
          tabIndex={0}
          aria-labelledby="chart-title chart-desc"
          onPointerMove={handlePointer}
          onPointerLeave={() => setCursorMonth(null)}
          onKeyDown={handleKey}
          onBlur={() => setCursorMonth(null)}
        >
          <desc id="chart-desc">{summaryLines.join(' ')}</desc>

          {yTicks.map((tick) => (
            <g key={`y-${tick}`}>
              <line
                className="chart__grid"
                x1={MARGIN.left}
                x2={MARGIN.left + plotWidth}
                y1={y(tick)}
                y2={y(tick)}
              />
              <text className="chart__tick" x={MARGIN.left - 10} y={y(tick) + 4} textAnchor="end">
                {formatMiles(tick)}
              </text>
            </g>
          ))}

          {xTicks.map((tick) => (
            <text
              key={`x-${tick}`}
              className="chart__tick"
              x={x(tick)}
              y={MARGIN.top + plotHeight + 22}
              textAnchor="middle"
            >
              {tick}
            </text>
          ))}
          <text
            className="chart__axis-label"
            x={MARGIN.left + plotWidth / 2}
            y={height - 4}
            textAnchor="middle"
          >
            Contract month
          </text>

          {/* Today marker */}
          <line
            className="chart__today"
            x1={x(model.todayMonth)}
            x2={x(model.todayMonth)}
            y1={MARGIN.top}
            y2={MARGIN.top + plotHeight}
          />
          <text
            className="chart__today-label"
            x={x(model.todayMonth)}
            y={MARGIN.top - 6}
            textAnchor={model.todayMonth / model.maxMonth > 0.85 ? 'end' : 'middle'}
          >
            Today
          </text>

          {model.series.map((series) => (
            <polyline
              key={series.id}
              className={`chart__line chart__line--${series.id}`}
              points={series.points.map((p) => `${x(p.month)},${y(p.miles)}`).join(' ')}
              strokeDasharray={DASH[series.style]}
              fill="none"
            />
          ))}

          <circle
            className="chart__point"
            cx={x(model.todayMonth)}
            cy={y(model.todayMiles)}
            r={5}
          />

          {activeMonth !== null && (
            <line
              className="chart__cursor"
              x1={x(activeMonth)}
              x2={x(activeMonth)}
              y1={MARGIN.top}
              y2={MARGIN.top + plotHeight}
            />
          )}
        </svg>

        <div className="chart__readout" role="status" aria-live="polite">
          {readout && readout.length > 0 ? (
            <>
              <strong>Month {activeMonth}</strong>
              {readout.map((entry) => (
                <span key={entry.label} className="tabular">
                  {entry.label}: {formatMiles(entry.value)} miles
                </span>
              ))}
            </>
          ) : (
            <span className="chart__readout-hint">
              Hover the chart, or focus it and use the arrow keys, to read the figures for any month.
            </span>
          )}
        </div>
      </div>

      <ul className="chart-legend">
        {model.series.map((series) => (
          <li key={series.id} className={`chart-legend__item chart-legend__item--${series.id}`}>
            <svg width="26" height="10" aria-hidden="true" focusable="false">
              <line
                x1="1"
                y1="5"
                x2="25"
                y2="5"
                strokeDasharray={DASH[series.style]}
                className={`chart__line chart__line--${series.id}`}
              />
            </svg>
            {series.label}
          </li>
        ))}
        <li className="chart-legend__item chart-legend__item--today">
          <svg width="26" height="10" aria-hidden="true" focusable="false">
            <line x1="13" y1="0" x2="13" y2="10" strokeDasharray="3 3" className="chart__today" />
          </svg>
          Today
        </li>
      </ul>

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
