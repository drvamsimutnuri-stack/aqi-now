"use client";

import { useState } from "react";
import {
  ACTIVITIES,
  cigarettesPerDay,
  inhaledMicrograms,
  lifeExpectancyYearsLost,
  UGM3_DAY_PER_CIGARETTE,
} from "@/lib/exposure";

interface Props {
  /** Current-hour PM2.5 in µg/m³. */
  pm25Now: number | null;
  /** 24-hour mean PM2.5 in µg/m³. */
  pm25Mean: number | null;
}

/**
 * Concentration is an abstraction; dose is what harms you. This panel converts
 * one into the other, because "how much did I actually breathe in" is the
 * question people are really asking.
 */
export function ExposurePanel({ pm25Now, pm25Mean }: Props) {
  const [activityKey, setActivityKey] = useState("walk");
  const activity = ACTIVITIES.find((a) => a.key === activityKey) ?? ACTIVITIES[2];

  if (pm25Now === null) {
    return (
      <section className="card p-5 sm:p-6">
        <h3 className="text-lg font-bold tracking-tight">Your dose</h3>
        <p className="mt-2 text-sm text-mist-400">
          No PM2.5 data available for this location right now.
        </p>
      </section>
    );
  }

  const perHour = inhaledMicrograms(pm25Now, activity.litresPerMinute, 60);
  const restingPerHour = inhaledMicrograms(pm25Now, ACTIVITIES[1].litresPerMinute, 60);
  const multiplier = perHour / restingPerHour;
  const cigs = pm25Mean !== null ? cigarettesPerDay(pm25Mean) : null;
  const yearsLost = pm25Mean !== null ? lifeExpectancyYearsLost(pm25Mean) : null;

  return (
    <section className="card p-5 sm:p-6">
      <h3 className="text-lg font-bold tracking-tight">Your dose, not just the number</h3>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-mist-400">
        The AQI describes the air. What harms you is how much of it ends up inside your lungs — and
        that depends as much on how hard you are breathing as on how dirty the air is.
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {ACTIVITIES.map((option) => (
          <button
            key={option.key}
            onClick={() => setActivityKey(option.key)}
            aria-pressed={option.key === activityKey}
            className={`rounded-lg border px-2.5 py-1.5 text-[12px] transition ${
              option.key === activityKey
                ? "border-sky-400/60 bg-sky-400/15 font-semibold text-sky-200"
                : "border-ink-700/70 bg-ink-850/50 text-mist-300 hover:text-mist-100"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-ink-700/70 bg-ink-850/50 p-4">
          <p className="text-[11px] font-bold tracking-widest text-mist-400">
            ONE HOUR OF {activity.label.toUpperCase()}
          </p>
          <p className="tnum mt-1.5 text-2xl font-bold text-mist-100">
            {perHour < 10 ? perHour.toFixed(1) : Math.round(perHour)}
            <span className="ml-1.5 text-sm font-medium text-mist-400">µg inhaled</span>
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-mist-400">
            At {pm25Now.toFixed(1)} µg/m³, moving {activity.litresPerMinute} litres of air a minute.
            That is{" "}
            <span className="font-semibold text-mist-200">{multiplier.toFixed(1)}×</span> what you
            would take in sitting still.
          </p>
        </div>

        {cigs !== null && (
          <div className="rounded-xl border border-ink-700/70 bg-ink-850/50 p-4">
            <p className="text-[11px] font-bold tracking-widest text-mist-400">
              CIGARETTE EQUIVALENT
            </p>
            <p className="tnum mt-1.5 text-2xl font-bold text-mist-100">
              {cigs < 0.1 ? "<0.1" : cigs.toFixed(1)}
              <span className="ml-1.5 text-sm font-medium text-mist-400">per day</span>
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-mist-400">
              Berkeley Earth&apos;s equivalence: {UGM3_DAY_PER_CIGARETTE} µg/m³ breathed for a day is
              about one cigarette&apos;s worth of particulate. It compares particulate dose only —
              not nicotine, tar or the rest of tobacco smoke.
            </p>
          </div>
        )}

        {yearsLost !== null && (
          <div className="rounded-xl border border-ink-700/70 bg-ink-850/50 p-4">
            <p className="text-[11px] font-bold tracking-widest text-mist-400">
              IF THIS WERE YOUR AVERAGE
            </p>
            <p className="tnum mt-1.5 text-2xl font-bold text-mist-100">
              {yearsLost < 0.05 ? "~0" : yearsLost.toFixed(1)}
              <span className="ml-1.5 text-sm font-medium text-mist-400">years of life</span>
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-mist-400">
              Air Quality Life Index: each sustained 10 µg/m³ above the WHO guideline of 5 µg/m³
              costs roughly 0.98 years. This assumes today&apos;s level is your lifelong average,
              which one day&apos;s data cannot tell you — read it as the stake, not a prediction.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
