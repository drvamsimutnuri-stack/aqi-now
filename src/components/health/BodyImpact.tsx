"use client";

import { useState } from "react";
import { useHealthProfile } from "./HealthProfileContext";
import { BODY_SYSTEMS, effectsAtBand, type BodySystem } from "@/lib/body";
import { MEASURES, type MeasureKey } from "@/lib/pollutants";

interface Props {
  /** US EPA band, 0 (Good) to 5 (Hazardous). */
  band: number;
  bandLabel: string;
  /** Measures currently at or above their guideline, used to flag mechanisms. */
  elevated: MeasureKey[];
}

function DriverTags({ drivers, elevated }: { drivers: MeasureKey[]; elevated: MeasureKey[] }) {
  const active = drivers.filter((d) => elevated.includes(d));
  if (active.length === 0) return null;
  return (
    <span className="ml-1.5 inline-flex flex-wrap gap-1 align-middle">
      {active.map((d) => (
        <span
          key={d}
          title={`${MEASURES[d].name} is elevated here right now`}
          className="rounded bg-ink-700/70 px-1 py-0.5 text-[9px] font-bold tracking-wide"
          style={{ color: MEASURES[d].accent }}
        >
          {MEASURES[d].formula}
        </span>
      ))}
    </span>
  );
}

function SystemCard({
  system,
  band,
  elevated,
  showSensitive,
  defaultOpen,
}: {
  system: BodySystem;
  band: number;
  elevated: MeasureKey[];
  showSensitive: boolean;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { everyone, sensitive } = effectsAtBand(system, band);
  const isPrimary = system.emphasis === "primary";
  const relevant = everyone.length + (showSensitive ? sensitive.length : 0);

  return (
    <article
      className={`card overflow-hidden ${isPrimary ? "border-sky-400/25" : ""}`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-3 p-4 text-left transition hover:bg-ink-850/50"
      >
        <div className="min-w-0">
          <h4 className="flex flex-wrap items-center gap-2 text-base font-bold tracking-tight">
            {system.name}
            {isPrimary && (
              <span className="rounded bg-sky-400/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-sky-300">
                MOST AFFECTED
              </span>
            )}
          </h4>
          <p className="mt-1 text-[13px] leading-relaxed text-mist-400">{system.summary}</p>
        </div>
        <span className="flex shrink-0 items-center gap-2">
          {relevant > 0 && (
            <span className="tnum rounded-full bg-ink-800 px-2 py-0.5 text-[10px] font-bold text-mist-300">
              {relevant}
            </span>
          )}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={`text-mist-400 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" strokeLinecap="round" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-ink-700/60 p-4">
          <div>
            <h5 className="text-[11px] font-bold tracking-widest text-mist-400">
              HOW THE AIR GETS THERE
            </h5>
            <p className="mt-1.5 text-[13px] leading-relaxed text-mist-300">{system.route}</p>
          </div>

          <div>
            <h5 className="text-[11px] font-bold tracking-widest text-mist-400">
              WHAT TO EXPECT AT TODAY&apos;S LEVEL
            </h5>
            {everyone.length === 0 && (!showSensitive || sensitive.length === 0) ? (
              <p className="mt-1.5 text-[13px] leading-relaxed text-mist-300">
                {band === 0
                  ? "Nothing expected here — this is clean air, and a good day to be out in it."
                  : "Nothing expected for this system at the current level, though the systems above are already affected."}
              </p>
            ) : (
              <ul className="mt-1.5 space-y-1.5">
                {everyone.map((effect) => (
                  <li key={effect.text} className="flex gap-2 text-[13px] leading-relaxed text-mist-200">
                    <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-mist-300/80" />
                    <span>
                      {effect.text}
                      <DriverTags drivers={effect.drivers} elevated={elevated} />
                    </span>
                  </li>
                ))}
                {showSensitive &&
                  sensitive.map((effect) => (
                    <li
                      key={effect.text}
                      className="flex gap-2 text-[13px] leading-relaxed text-amber-100/90"
                    >
                      <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-amber-400/80" />
                      <span>
                        {effect.text}
                        <DriverTags drivers={effect.drivers} elevated={elevated} />
                      </span>
                    </li>
                  ))}
              </ul>
            )}
            {!showSensitive && sensitive.length > 0 && (
              <p className="mt-2 text-[11px] text-mist-400">
                {sensitive.length} further effect{sensitive.length === 1 ? "" : "s"} apply to at-risk
                groups — select a profile above to include them.
              </p>
            )}
          </div>

          <div>
            <h5 className="text-[11px] font-bold tracking-widest text-emerald-300/90">
              HOW TO PROTECT IT
            </h5>
            <ul className="mt-1.5 space-y-1.5">
              {system.protect.map((item) => (
                <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-mist-200">
                  <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-emerald-400/80" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-[11px] font-bold tracking-widest text-mist-400">
              OVER YEARS
            </h5>
            <p className="mt-1.5 text-[13px] leading-relaxed text-mist-300">{system.chronic}</p>
          </div>
        </div>
      )}
    </article>
  );
}

export function BodyImpact({ band, bandLabel, elevated }: Props) {
  const { profiles } = useHealthProfile();
  const showSensitive = profiles.length > 0;

  return (
    <section>
      <h3 className="text-lg font-bold tracking-tight">
        What this air is doing to your body
      </h3>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-mist-400">
        Organ by organ, at the level measured right now — {bandLabel.toLowerCase()}. Ordered by how
        directly the air reaches each one, so the lungs and eyes come first. Tags such as{" "}
        <span className="rounded bg-ink-700/70 px-1 py-0.5 text-[9px] font-bold text-red-400">
          PM2.5
        </span>{" "}
        mark which pollutant is driving an effect here today.
      </p>

      <div className="mt-4 space-y-3">
        {BODY_SYSTEMS.map((system) => (
          <SystemCard
            key={system.key}
            system={system}
            band={band}
            elevated={elevated}
            showSensitive={showSensitive}
            defaultOpen={system.emphasis === "primary"}
          />
        ))}
      </div>
    </section>
  );
}
