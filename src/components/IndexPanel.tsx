"use client";

import { useState } from "react";
import { AqiGauge } from "./AqiGauge";
import { CategoryScale } from "./CategoryScale";
import { averagingLabel } from "@/lib/aqi";
import { formatConcentration, unitLabel } from "@/lib/format";
import { MEASURES } from "@/lib/pollutants";
import { categoryFor, STANDARDS, STANDARD_ORDER, type StandardId } from "@/lib/standards";
import type { IndexPayload } from "@/lib/snapshot";

interface Props {
  indices: Record<StandardId, IndexPayload>;
  /** Preselected tab; India defaults in for Indian locations. */
  initialStandard?: StandardId;
}

export function IndexPanel({ indices, initialStandard = "us" }: Props) {
  const [selected, setSelected] = useState<StandardId>(initialStandard);
  const payload = indices[selected];
  const standard = STANDARDS[selected];
  const dominant = payload.dominant;
  const category = payload.index !== null ? categoryFor(standard, payload.index) : null;

  return (
    <section className="card overflow-hidden">
      <div
        role="tablist"
        aria-label="Air quality standard"
        className="flex border-b border-ink-700/60"
      >
        {STANDARD_ORDER.map((id) => {
          const s = STANDARDS[id];
          const value = indices[id].index;
          const isActive = id === selected;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelected(id)}
              className={`flex-1 px-3 py-3 text-left transition sm:px-5 ${
                isActive ? "bg-ink-800/70" : "hover:bg-ink-850/60"
              }`}
            >
              <span
                className={`block text-[11px] font-semibold tracking-wide ${
                  isActive ? "text-sky-400" : "text-mist-400"
                }`}
              >
                {s.shortName.toUpperCase()}
              </span>
              <span className="tnum block text-lg font-bold leading-tight text-mist-100">
                {value ?? "—"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[auto_1fr] lg:gap-8">
        <div className="mx-auto flex flex-col items-center gap-4 lg:mx-0">
          <AqiGauge standard={standard} value={payload.index} caption={standard.shortName} />
        </div>

        <div className="min-w-0 space-y-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              {category ? category.label : "No data for this standard"}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-mist-300">
              {dominant ? (
                <>
                  Driven by{" "}
                  <span className="font-semibold text-mist-100">
                    {MEASURES[dominant].formula}
                  </span>{" "}
                  — {MEASURES[dominant].name.toLowerCase()}. That is the pollutant currently
                  furthest above its guideline here, so it sets the headline number.
                </>
              ) : (
                "None of this standard's pollutants had enough valid hours to score."
              )}
            </p>
          </div>

          <CategoryScale standard={standard} value={payload.index} />

          <div>
            <h3 className="mb-2.5 text-xs font-semibold tracking-widest text-mist-400">
              SUB-INDEX BY POLLUTANT
            </h3>
            <ul className="space-y-2">
              {payload.subIndices.map((sub) => {
                const measure = MEASURES[sub.pollutant];
                const isDominant = sub.pollutant === dominant;
                return (
                  <li
                    key={sub.pollutant}
                    className={`rounded-lg border px-3 py-2.5 transition ${
                      isDominant
                        ? "border-ink-600 bg-ink-800/60"
                        : "border-transparent bg-ink-850/40"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="flex min-w-0 items-baseline gap-2">
                        <span className="truncate text-sm font-semibold">{measure.formula}</span>
                        {isDominant && (
                          <span className="shrink-0 rounded bg-sky-400/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-sky-300">
                            DOMINANT
                          </span>
                        )}
                      </span>
                      <span className="tnum shrink-0 text-sm font-bold" style={{ color: sub.category.color }}>
                        {sub.index}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-700/70">
                      <div
                        className="h-full rounded-full transition-[width] duration-500"
                        style={{
                          width: `${Math.max(1.5, sub.fractionOfScale * 100)}%`,
                          backgroundColor: sub.category.color,
                        }}
                      />
                    </div>
                    <p className="tnum mt-1.5 text-[11px] text-mist-400">
                      {formatConcentration(sub.concentration, sub.unit)} {unitLabel(sub.unit)} ·{" "}
                      {averagingLabel(sub.averaging)} · {sub.category.label}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="border-t border-ink-700/60 pt-4 text-xs leading-relaxed text-mist-400">
            {standard.description}
          </p>
        </div>
      </div>
    </section>
  );
}
