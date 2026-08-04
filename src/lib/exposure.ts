import type { TrendPoint } from "./snapshot";

/**
 * Turning concentrations into something a person can feel the size of.
 *
 * Concentration answers "how dirty is the air". Dose answers "how much of it
 * ended up inside me", which is the number that actually tracks harm — and it
 * is why exertion matters so much: breathing hard multiplies your intake of
 * identical air by an order of magnitude.
 */

export interface Activity {
  key: string;
  label: string;
  /** Minute ventilation in litres per minute, from the EPA Exposure Factors Handbook (adult). */
  litresPerMinute: number;
  note: string;
}

export const ACTIVITIES: Activity[] = [
  { key: "sleep", label: "Sleeping", litresPerMinute: 5, note: "Lowest intake of the day" },
  { key: "rest", label: "Sitting / desk work", litresPerMinute: 7, note: "Resting baseline" },
  { key: "walk", label: "Walking", litresPerMinute: 16, note: "Around 2× resting intake" },
  { key: "moderate", label: "Brisk walk / easy cycling", litresPerMinute: 35, note: "Around 5× resting" },
  { key: "vigorous", label: "Running / hard cycling", litresPerMinute: 70, note: "Around 10× resting" },
];

/** Micrograms of PM2.5 inhaled over `minutes` of an activity at a given concentration. */
export function inhaledMicrograms(
  concentrationUgm3: number,
  litresPerMinute: number,
  minutes: number,
): number {
  const cubicMetres = (litresPerMinute / 1000) * minutes;
  return concentrationUgm3 * cubicMetres;
}

/**
 * Berkeley Earth's equivalence: breathing 22 µg/m³ of PM2.5 for 24 hours is
 * roughly one cigarette's worth of particulate exposure. It is a concentration
 * heuristic for intuition, not a claim about nicotine or tar.
 */
export const UGM3_DAY_PER_CIGARETTE = 22;

export function cigarettesPerDay(pm25Ugm3: number): number {
  return pm25Ugm3 / UGM3_DAY_PER_CIGARETTE;
}

/**
 * Air Quality Life Index (Energy Policy Institute, University of Chicago):
 * every sustained 10 µg/m³ of PM2.5 above the WHO guideline costs about
 * 0.98 years of life expectancy. Only meaningful as "if this level were your
 * long-term average", which is a much stronger assumption than one day's data.
 */
export const AQLI_YEARS_PER_10_UGM3 = 0.98;
export const WHO_ANNUAL_PM25 = 5;

export function lifeExpectancyYearsLost(sustainedPm25Ugm3: number): number {
  const excess = Math.max(0, sustainedPm25Ugm3 - WHO_ANNUAL_PM25);
  return (excess / 10) * AQLI_YEARS_PER_10_UGM3;
}

export interface HourWindow {
  time: string;
  value: number;
}

export interface OutdoorWindows {
  /** Cleanest upcoming hours, best first. */
  best: HourWindow[];
  /** Worst upcoming hours, worst first. */
  worst: HourWindow[];
  /** How much the index varies across the coming day. */
  spread: number;
}

/**
 * Find the cleanest and dirtiest hours still ahead, so "avoid outdoor exercise"
 * can become "go at 6am instead of 6pm". Only looks at the next `hours` so the
 * advice is actionable today rather than theoretical.
 */
export function outdoorWindows(trend: TrendPoint[], hours = 24): OutdoorWindows | null {
  const nowIndex = trend.findIndex((p) => p.isNow);
  if (nowIndex < 0) return null;

  const upcoming = trend
    .slice(nowIndex, nowIndex + hours + 1)
    .filter((p): p is TrendPoint & { us: number } => p.us !== null);

  if (upcoming.length < 4) return null;

  const sorted = [...upcoming].sort((a, b) => a.us - b.us);
  const values = upcoming.map((p) => p.us);

  return {
    best: sorted.slice(0, 3).map((p) => ({ time: p.time, value: p.us })),
    worst: sorted.slice(-3).reverse().map((p) => ({ time: p.time, value: p.us })),
    spread: Math.max(...values) - Math.min(...values),
  };
}
