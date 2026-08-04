import {
  categoryFor,
  STANDARDS,
  US_OZONE_1H,
  type Averaging,
  type Category,
  type PollutantKey,
  type PollutantScale,
  type Standard,
  type StandardId,
} from "./standards";
import { ugm3ToMgm3, ugm3ToPpb, ugm3ToPpm } from "./units";

export type Series = Partial<Record<PollutantKey, (number | null)[]>>;

export interface SubIndex {
  pollutant: PollutantKey;
  /** Reported index value for this pollutant alone. */
  index: number;
  /** Concentration that entered the table, in the standard's own unit. */
  concentration: number;
  unit: PollutantScale["unit"];
  /** Same concentration in µg/m³, for cross-standard comparison. */
  concentrationUgm3: number;
  averaging: Averaging;
  category: Category;
  /** Position on the full index scale, 0–1, for drawing bars. */
  fractionOfScale: number;
}

export interface IndexResult {
  standard: Standard;
  /** null when no pollutant had enough valid hours to report. */
  index: number | null;
  category: Category | null;
  /** The pollutant whose sub-index set the overall value. */
  dominant: PollutantKey | null;
  subIndices: SubIndex[];
}

const AVERAGING_LABEL: Record<Averaging, string> = {
  nowcast: "NowCast (12 h weighted)",
  "1h": "1-hour",
  "8h": "8-hour mean",
  "24h": "24-hour mean",
};

export function averagingLabel(a: Averaging): string {
  return AVERAGING_LABEL[a];
}

/* ------------------------------------------------------------------ */
/* Averaging                                                          */
/* ------------------------------------------------------------------ */

/**
 * EPA NowCast for particulates: a weighted 12-hour average that leans hard on
 * the most recent hour when concentrations are changing fast, and behaves like
 * a plain 12-hour mean when they are steady. This is what AirNow shows as the
 * "current" AQI, and it is why a smoke plume registers within an hour instead
 * of being diluted across a full day.
 */
function nowcast(window: (number | null)[]): number | null {
  const newestFirst = window.slice(-12).reverse();
  const present = newestFirst.filter((v): v is number => v !== null);
  // EPA requires two of the three most recent hours to be valid.
  if (newestFirst.slice(0, 3).filter((v) => v !== null).length < 2) return null;
  if (present.length === 0) return null;

  const max = Math.max(...present);
  const min = Math.min(...present);
  if (max <= 0) return 0;

  const weight = Math.max(0.5, 1 - (max - min) / max);

  let numerator = 0;
  let denominator = 0;
  newestFirst.forEach((value, hoursAgo) => {
    if (value === null) return;
    const w = Math.pow(weight, hoursAgo);
    numerator += w * value;
    denominator += w;
  });

  return denominator > 0 ? numerator / denominator : null;
}

/** Trailing mean over `hours`, requiring EPA's 75 % data completeness. */
export function trailingMean(window: (number | null)[], hours: number): number | null {
  const slice = window.slice(-hours);
  const present = slice.filter((v): v is number => v !== null);
  if (present.length < Math.ceil(hours * 0.75)) return null;
  return present.reduce((a, b) => a + b, 0) / present.length;
}

/**
 * Average a µg/m³ series according to what the standard requires.
 * `window` runs oldest → newest and must end at the hour being reported.
 */
function averageFor(window: (number | null)[], averaging: Averaging): number | null {
  switch (averaging) {
    case "nowcast":
      return nowcast(window);
    case "1h":
      return window.length ? window[window.length - 1] : null;
    case "8h":
      return trailingMean(window, 8);
    case "24h":
      return trailingMean(window, 24);
  }
}

/* ------------------------------------------------------------------ */
/* Sub-index maths                                                    */
/* ------------------------------------------------------------------ */

function convert(ugm3: number, scale: PollutantScale): number {
  switch (scale.unit) {
    case "ug/m3":
      return ugm3;
    case "mg/m3":
      return ugm3ToMgm3(ugm3);
    case "ppb":
      return ugm3ToPpb(ugm3, scale.pollutant);
    case "ppm":
      return ugm3ToPpm(ugm3, scale.pollutant);
  }
}

function truncate(value: number, decimals: number | undefined): number {
  if (decimals === undefined) return value;
  const factor = Math.pow(10, decimals);
  // Absorb floating-point noise from the unit conversion before flooring.
  // Without this, a value that is mathematically on a breakpoint boundary —
  // 0.070 ppm of ozone arriving as 0.06999999999 — gets knocked a whole
  // truncation step down and lands in the wrong row.
  const scaled = Number((value * factor).toPrecision(12));
  return Math.floor(scaled) / factor;
}

/** Linear interpolation inside the matching breakpoint row. */
function interpolate(scale: PollutantScale, concentration: number): number | null {
  const rows = scale.breakpoints;
  const top = rows[rows.length - 1];
  if (concentration > top.cHigh) return top.iHigh;
  // A table with a floor above zero — the EPA's 1-hour ozone scale — simply
  // does not apply below it, and must not be clamped up into its lowest row.
  if (concentration < rows[0].cLow) return null;

  for (const row of rows) {
    if (concentration <= row.cHigh) {
      const c = Math.max(concentration, row.cLow);
      const span = row.cHigh - row.cLow;
      if (span <= 0) return row.iLow;
      return row.iLow + ((row.iHigh - row.iLow) * (c - row.cLow)) / span;
    }
  }
  return null;
}

function subIndexFor(
  standard: Standard,
  scale: PollutantScale,
  window: (number | null)[],
): SubIndex | null {
  const averaged = averageFor(window, scale.averaging);
  if (averaged === null || !Number.isFinite(averaged) || averaged < 0) return null;

  const converted = truncate(convert(averaged, scale), scale.truncate);
  const raw = interpolate(scale, converted);
  if (raw === null) return null;

  const index = Math.round(raw);
  return {
    pollutant: scale.pollutant,
    index,
    concentration: converted,
    unit: scale.unit,
    concentrationUgm3: averaged,
    averaging: scale.averaging,
    category: categoryFor(standard, index),
    fractionOfScale: Math.min(1, index / standard.scaleMax),
  };
}

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Compute one standard's index from hourly µg/m³ series.
 * Every series must run oldest → newest and end at the hour being reported.
 */
export function computeIndex(standardId: StandardId, series: Series): IndexResult {
  const standard = STANDARDS[standardId];
  const subIndices: SubIndex[] = [];

  for (const scale of standard.scales) {
    const window = series[scale.pollutant];
    if (!window || window.length === 0) continue;

    let sub = subIndexFor(standard, scale, window);

    // EPA reports ozone on the harsher of the 8-hour and 1-hour scales.
    if (standardId === "us" && scale.pollutant === "ozone") {
      const oneHour = subIndexFor(standard, US_OZONE_1H, window);
      if (oneHour && (!sub || oneHour.index > sub.index)) sub = oneHour;
    }

    if (sub) subIndices.push(sub);
  }

  subIndices.sort((a, b) => b.index - a.index);
  const worst = subIndices[0];

  return {
    standard,
    index: worst ? worst.index : null,
    category: worst ? worst.category : null,
    dominant: worst ? worst.pollutant : null,
    subIndices,
  };
}

export function computeAllIndices(series: Series): Record<StandardId, IndexResult> {
  return {
    us: computeIndex("us", series),
    eu: computeIndex("eu", series),
    in: computeIndex("in", series),
  };
}

/**
 * Cigarette-equivalent exposure, using the Berkeley Earth equivalence of one
 * cigarette per 22 µg/m³ of PM2.5 breathed for 24 hours.
 */
export function cigaretteEquivalent(pm25Ugm3: number): number {
  return pm25Ugm3 / 22;
}
