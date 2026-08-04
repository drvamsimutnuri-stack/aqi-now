"use client";

import { useState } from "react";
import { formatMeasure } from "@/lib/format";
import { MEASURES, type MeasureKey } from "@/lib/pollutants";
import type { MeasureReading } from "@/lib/snapshot";

function whoTone(ratio: number): { color: string; label: string } {
  if (ratio <= 1) return { color: "#22c55e", label: "within WHO guideline" };
  if (ratio <= 2) return { color: "#eab308", label: "above WHO guideline" };
  if (ratio <= 5) return { color: "#f97316", label: "well above WHO guideline" };
  return { color: "#ef4444", label: "far above WHO guideline" };
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h5 className="mb-1.5 text-[11px] font-bold tracking-widest text-mist-400">
        {title.toUpperCase()}
      </h5>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-mist-300">
            <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-mist-400/70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MeasureCard({ reading }: { reading: MeasureReading }) {
  const [open, setOpen] = useState(false);
  const measure = MEASURES[reading.key];
  const available = reading.value !== null;
  const tone = reading.whoRatio !== null ? whoTone(reading.whoRatio) : null;

  return (
    <article
      className={`card flex flex-col p-4 transition ${available ? "" : "opacity-55"}`}
      style={open ? { borderColor: `${measure.accent}66` } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="flex items-center gap-2 text-base font-bold leading-none">
            <span style={{ color: measure.accent }}>{measure.formula}</span>
            {!measure.indexForming && (
              <span className="rounded bg-ink-700/70 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-mist-400">
                CONTEXT
              </span>
            )}
          </h4>
          <p className="mt-1 truncate text-xs text-mist-400">{measure.name}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="tnum text-xl font-bold leading-none">
            {available ? formatMeasure(reading.value!, measure.unit) : "—"}
          </p>
          <p className="mt-1 text-[10px] text-mist-400">
            {measure.unit === "unitless" ? "AOD" : measure.unit}
          </p>
        </div>
      </div>

      {available ? (
        <dl className="tnum mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <dt className="text-mist-400">24-h mean</dt>
          <dd className="text-right text-mist-300">
            {reading.mean24h !== null ? formatMeasure(reading.mean24h, measure.unit) : "—"}
          </dd>
          {reading.changePct !== null && (
            <>
              <dt className="text-mist-400">vs 24 h ago</dt>
              <dd
                className="text-right"
                style={{ color: reading.changePct > 5 ? "#f87171" : reading.changePct < -5 ? "#4ade80" : "#b3c1d8" }}
              >
                {reading.changePct > 0 ? "+" : ""}
                {reading.changePct.toFixed(0)}%
              </dd>
            </>
          )}
        </dl>
      ) : (
        <p className="mt-3 text-[11px] leading-relaxed text-mist-400">
          Not modelled at this location. Ammonia and pollen are only available inside the CAMS
          Europe domain.
        </p>
      )}

      {tone && reading.whoRatio !== null && (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-ink-700/70">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (reading.whoRatio / 5) * 100)}%`,
                backgroundColor: tone.color,
              }}
            />
          </div>
          <p className="tnum mt-1.5 text-[11px]" style={{ color: tone.color }}>
            {reading.whoRatio.toFixed(1)}× WHO 24-hour guideline
          </p>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-ink-700/70 px-2.5 py-2 text-left text-[11px] font-semibold text-mist-300 transition hover:border-ink-600 hover:text-mist-100"
      >
        {open ? "Hide health effects" : "Health effects & sources"}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="mt-3 space-y-3.5 border-t border-ink-700/60 pt-3.5">
          <p className="text-[13px] leading-relaxed text-mist-300">{measure.what}</p>
          <DetailList title="Where it comes from" items={measure.sources} />
          <DetailList title="Short-term effects (hours to days)" items={measure.shortTerm} />
          <DetailList title="Long-term effects (months to years)" items={measure.longTerm} />
          <DetailList title="Who feels it first" items={measure.sensitive} />
          {measure.who.length > 0 && (
            <div>
              <h5 className="mb-1.5 text-[11px] font-bold tracking-widest text-mist-400">
                WHO 2021 GUIDELINE
              </h5>
              <ul className="tnum flex flex-wrap gap-2">
                {measure.who.map((g) => (
                  <li
                    key={g.label}
                    className="rounded-md border border-ink-700/70 bg-ink-850/60 px-2 py-1 text-[11px] text-mist-300"
                  >
                    {g.label}: <span className="font-semibold text-mist-100">{g.value}</span> {g.unit}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export function PollutantGrid({ measures }: { measures: MeasureReading[] }) {
  const indexForming = measures.filter((m) => MEASURES[m.key].indexForming);
  const context = measures.filter((m) => !MEASURES[m.key].indexForming);

  return (
    <div className="space-y-6">
      <Group
        title="Index-forming pollutants"
        blurb="These seven are what the world's air quality indices actually score. Each card expands into what the pollutant is, where it comes from, and what it does to your body."
        readings={indexForming}
      />
      <Group
        title="Additional atmospheric measures"
        blurb="Not part of any AQI, but they change how the air feels and what you should do about it."
        readings={context}
      />
    </div>
  );
}

function Group({
  title,
  blurb,
  readings,
}: {
  title: string;
  blurb: string;
  readings: MeasureReading[];
}) {
  if (readings.length === 0) return null;
  return (
    <div>
      <h3 className="text-lg font-bold tracking-tight">{title}</h3>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-mist-400">{blurb}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {readings.map((reading) => (
          <MeasureCard key={reading.key} reading={reading} />
        ))}
      </div>
    </div>
  );
}

export type { MeasureKey };
