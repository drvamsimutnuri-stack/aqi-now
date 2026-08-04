"use client";

import { useMemo, useRef, useState } from "react";
import { formatDayShort, formatHourShort, formatLocalHour } from "@/lib/format";
import { categoryFor, STANDARDS, STANDARD_ORDER, type StandardId } from "@/lib/standards";
import type { TrendPoint } from "@/lib/snapshot";

const W = 900;
const H = 300;
const PAD = { top: 18, right: 46, bottom: 30, left: 8 };

export function TrendChart({ trend }: { trend: TrendPoint[] }) {
  const [standardId, setStandardId] = useState<StandardId>("us");
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const standard = STANDARDS[standardId];

  const points = useMemo(
    () => trend.map((p) => ({ ...p, value: p[standardId] })),
    [trend, standardId],
  );

  const yMax = useMemo(() => {
    const max = Math.max(0, ...points.map((p) => p.value ?? 0));
    const boundary = standard.categories.find((c) => c.max >= max * 1.08);
    return boundary ? boundary.max : standard.scaleMax;
  }, [points, standard]);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / Math.max(1, points.length - 1)) * innerW;
  const y = (v: number) => PAD.top + innerH - (Math.min(v, yMax) / yMax) * innerH;

  const nowIndex = points.findIndex((p) => p.isNow);
  const valid = points.map((p, i) => ({ ...p, i })).filter((p) => p.value !== null);

  const areaPath = valid.length
    ? `M ${x(valid[0].i)} ${y(valid[0].value!)} ` +
      valid.slice(1).map((p) => `L ${x(p.i)} ${y(p.value!)}`).join(" ") +
      ` L ${x(valid[valid.length - 1].i)} ${PAD.top + innerH} L ${x(valid[0].i)} ${PAD.top + innerH} Z`
    : "";

  const gridLines = standard.categories.filter((c) => c.max <= yMax);

  // Label the first hour of each local day along the x-axis.
  const dayTicks = points
    .map((p, i) => ({ i, time: p.time }))
    .filter(({ time }) => time.endsWith("T00:00"));

  function handleMove(event: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    const svgX = ratio * W;
    const i = Math.round(((svgX - PAD.left) / innerW) * (points.length - 1));
    setHover(Math.min(points.length - 1, Math.max(0, i)));
  }

  const active = hover !== null ? points[hover] : null;
  const activeCategory =
    active?.value != null ? categoryFor(standard, active.value) : null;

  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold tracking-tight">Last 24 hours and 3-day forecast</h3>
          <p className="mt-1 text-sm text-mist-400">
            Recomputed hour by hour from the same breakpoint tables, so the curve and the headline
            number are the same calculation.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-ink-700/70 bg-ink-900/70 p-1">
          {STANDARD_ORDER.map((id) => (
            <button
              key={id}
              onClick={() => setStandardId(id)}
              aria-pressed={id === standardId}
              className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition ${
                id === standardId
                  ? "bg-sky-400/15 text-sky-300"
                  : "text-mist-400 hover:text-mist-100"
              }`}
            >
              {STANDARDS[id].shortName}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-pan-y"
          style={{ height: "auto" }}
          onPointerMove={handleMove}
          onMouseMove={handleMove}
          onPointerLeave={() => setHover(null)}
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label={`${standard.shortName} over time`}
        >
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {gridLines.map((c) => (
            <g key={c.label}>
              <line
                x1={PAD.left}
                x2={PAD.left + innerW}
                y1={y(c.max)}
                y2={y(c.max)}
                stroke={c.color}
                strokeOpacity="0.22"
                strokeDasharray="3 5"
              />
              <text
                x={PAD.left + innerW + 6}
                y={y(c.max) + 3.5}
                style={{ fontSize: 11, fill: c.color, fillOpacity: 0.8 }}
                className="tnum"
              >
                {c.max}
              </text>
            </g>
          ))}

          {/* Forecast side gets a subtle wash so past and future read differently. */}
          {nowIndex >= 0 && (
            <rect
              x={x(nowIndex)}
              y={PAD.top}
              width={PAD.left + innerW - x(nowIndex)}
              height={innerH}
              fill="#8fa1c0"
              fillOpacity="0.035"
            />
          )}

          {areaPath && <path d={areaPath} fill="url(#areaFill)" />}

          {valid.slice(1).map((p, idx) => {
            const prev = valid[idx];
            const color = categoryFor(standard, p.value!).color;
            return (
              <line
                key={p.i}
                x1={x(prev.i)}
                y1={y(prev.value!)}
                x2={x(p.i)}
                y2={y(p.value!)}
                stroke={color}
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            );
          })}

          {dayTicks.map(({ i, time }) => (
            <g key={time}>
              <line
                x1={x(i)}
                x2={x(i)}
                y1={PAD.top}
                y2={PAD.top + innerH}
                stroke="#33405e"
                strokeOpacity="0.55"
              />
              <text
                x={x(i) + 5}
                y={PAD.top + innerH + 18}
                style={{ fontSize: 11, fill: "#8fa1c0" }}
              >
                {formatDayShort(time)}
              </text>
            </g>
          ))}

          {nowIndex >= 0 && (
            <>
              <line
                x1={x(nowIndex)}
                x2={x(nowIndex)}
                y1={PAD.top - 6}
                y2={PAD.top + innerH}
                stroke="#e6ecf6"
                strokeWidth="1.4"
                strokeDasharray="4 4"
              />
              <text
                x={x(nowIndex) + 5}
                y={PAD.top - 8}
                style={{ fontSize: 11, fill: "#e6ecf6", fontWeight: 700 }}
              >
                NOW
              </text>
            </>
          )}

          {active?.value != null && (
            <>
              <line
                x1={x(hover!)}
                x2={x(hover!)}
                y1={PAD.top}
                y2={PAD.top + innerH}
                stroke="#e6ecf6"
                strokeOpacity="0.35"
              />
              <circle
                cx={x(hover!)}
                cy={y(active.value)}
                r="5"
                fill={activeCategory?.color}
                stroke="#070a12"
                strokeWidth="2"
              />
            </>
          )}
        </svg>

        {active?.value != null && (
          <div
            className="pointer-events-none absolute top-1 max-w-[15rem] rounded-lg border border-ink-600 bg-ink-900/97 px-3 py-2 text-xs shadow-xl"
            style={{
              left: `${(x(hover!) / W) * 100}%`,
              transform: hover! > points.length * 0.6 ? "translateX(-105%)" : "translateX(8px)",
            }}
          >
            <p className="tnum font-semibold text-mist-100">
              {formatLocalHour(active.time)}
            </p>
            <p className="tnum mt-0.5 text-base font-bold" style={{ color: activeCategory?.color }}>
              {active.value}{" "}
              <span className="text-[11px] font-medium text-mist-400">{standard.shortName}</span>
            </p>
            <p className="text-[11px]" style={{ color: activeCategory?.color }}>
              {activeCategory?.label}
            </p>
            {active.pm2_5 !== null && (
              <p className="tnum mt-1 text-[11px] text-mist-400">
                PM2.5 {active.pm2_5.toFixed(1)} µg/m³
              </p>
            )}
            <p className="mt-1 text-[10px] uppercase tracking-wide text-mist-400/70">
              {active.isPast ? "Observed" : active.isNow ? "Current hour" : "Forecast"}
            </p>
          </div>
        )}
      </div>

      <p className="mt-3 text-[11px] text-mist-400">
        Hover or drag across the chart for any hour. Times are local to the location shown
        {points.length > 0 && ` (${formatHourShort(points[0].time)} onward)`}.
      </p>
    </section>
  );
}
