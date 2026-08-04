/**
 * Breakpoint tables and category definitions for the three air quality
 * standards this app reports.
 *
 * Sources:
 *  - US EPA: Technical Assistance Document for the Reporting of Daily Air
 *    Quality (May 2024), which includes the revised PM2.5 breakpoints from the
 *    February 2024 PM NAAQS final rule.
 *  - EU: European Environment Agency, European Air Quality Index (2022 update).
 *  - India: CPCB National Air Quality Index (2014).
 */

export type StandardId = "us" | "eu" | "in";

export type PollutantKey =
  | "pm2_5"
  | "pm10"
  | "ozone"
  | "nitrogen_dioxide"
  | "sulphur_dioxide"
  | "carbon_monoxide"
  | "ammonia";

/** Averaging window a standard requires before a concentration enters the index. */
export type Averaging = "nowcast" | "1h" | "8h" | "24h";

export interface Breakpoint {
  /** Lower concentration bound, in the unit named by `unit`. */
  cLow: number;
  /** Upper concentration bound. */
  cHigh: number;
  /** Lower index value this concentration range maps to. */
  iLow: number;
  /** Upper index value. */
  iHigh: number;
}

export interface PollutantScale {
  pollutant: PollutantKey;
  /** Unit the breakpoints are expressed in. */
  unit: "ug/m3" | "mg/m3" | "ppb" | "ppm";
  averaging: Averaging;
  breakpoints: Breakpoint[];
  /**
   * Decimal places the standard truncates the concentration to before
   * interpolating. EPA requires truncation, which changes edge results.
   */
  truncate?: number;
}

export interface Category {
  /** Index value at which this category starts. */
  min: number;
  max: number;
  label: string;
  /** Tailwind-independent hex, used for gauges and chart fills. */
  color: string;
  /** Text colour that stays legible on `color`. */
  onColor: string;
}

export interface Standard {
  id: StandardId;
  name: string;
  shortName: string;
  authority: string;
  region: string;
  scaleMax: number;
  description: string;
  categories: Category[];
  scales: PollutantScale[];
}

/* ------------------------------------------------------------------ */
/* United States — EPA AQI                                            */
/* ------------------------------------------------------------------ */

const US_CATEGORIES: Category[] = [
  { min: 0, max: 50, label: "Good", color: "#00e400", onColor: "#0a2e0a" },
  { min: 51, max: 100, label: "Moderate", color: "#ffff00", onColor: "#3d3d00" },
  { min: 101, max: 150, label: "Unhealthy for Sensitive Groups", color: "#ff7e00", onColor: "#3d1e00" },
  { min: 151, max: 200, label: "Unhealthy", color: "#ff0000", onColor: "#ffffff" },
  { min: 201, max: 300, label: "Very Unhealthy", color: "#8f3f97", onColor: "#ffffff" },
  { min: 301, max: 500, label: "Hazardous", color: "#7e0023", onColor: "#ffffff" },
];

const US_SCALES: PollutantScale[] = [
  {
    pollutant: "pm2_5",
    unit: "ug/m3",
    averaging: "nowcast",
    truncate: 1,
    breakpoints: [
      { cLow: 0.0, cHigh: 9.0, iLow: 0, iHigh: 50 },
      { cLow: 9.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
      { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
      { cLow: 55.5, cHigh: 125.4, iLow: 151, iHigh: 200 },
      { cLow: 125.5, cHigh: 225.4, iLow: 201, iHigh: 300 },
      { cLow: 225.5, cHigh: 325.4, iLow: 301, iHigh: 500 },
    ],
  },
  {
    pollutant: "pm10",
    unit: "ug/m3",
    averaging: "nowcast",
    truncate: 0,
    breakpoints: [
      { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
      { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
      { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
      { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
      { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
      { cLow: 425, cHigh: 604, iLow: 301, iHigh: 500 },
    ],
  },
  {
    pollutant: "ozone",
    unit: "ppm",
    averaging: "8h",
    truncate: 3,
    breakpoints: [
      { cLow: 0.0, cHigh: 0.054, iLow: 0, iHigh: 50 },
      { cLow: 0.055, cHigh: 0.07, iLow: 51, iHigh: 100 },
      { cLow: 0.071, cHigh: 0.085, iLow: 101, iHigh: 150 },
      { cLow: 0.086, cHigh: 0.105, iLow: 151, iHigh: 200 },
      { cLow: 0.106, cHigh: 0.2, iLow: 201, iHigh: 300 },
    ],
  },
  {
    pollutant: "nitrogen_dioxide",
    unit: "ppb",
    averaging: "1h",
    truncate: 0,
    breakpoints: [
      { cLow: 0, cHigh: 53, iLow: 0, iHigh: 50 },
      { cLow: 54, cHigh: 100, iLow: 51, iHigh: 100 },
      { cLow: 101, cHigh: 360, iLow: 101, iHigh: 150 },
      { cLow: 361, cHigh: 649, iLow: 151, iHigh: 200 },
      { cLow: 650, cHigh: 1249, iLow: 201, iHigh: 300 },
      { cLow: 1250, cHigh: 2049, iLow: 301, iHigh: 500 },
    ],
  },
  {
    pollutant: "sulphur_dioxide",
    unit: "ppb",
    averaging: "1h",
    truncate: 0,
    breakpoints: [
      { cLow: 0, cHigh: 35, iLow: 0, iHigh: 50 },
      { cLow: 36, cHigh: 75, iLow: 51, iHigh: 100 },
      { cLow: 76, cHigh: 185, iLow: 101, iHigh: 150 },
      { cLow: 186, cHigh: 304, iLow: 151, iHigh: 200 },
      { cLow: 305, cHigh: 604, iLow: 201, iHigh: 300 },
      { cLow: 605, cHigh: 1004, iLow: 301, iHigh: 500 },
    ],
  },
  {
    pollutant: "carbon_monoxide",
    unit: "ppm",
    averaging: "8h",
    truncate: 1,
    breakpoints: [
      { cLow: 0.0, cHigh: 4.4, iLow: 0, iHigh: 50 },
      { cLow: 4.5, cHigh: 9.4, iLow: 51, iHigh: 100 },
      { cLow: 9.5, cHigh: 12.4, iLow: 101, iHigh: 150 },
      { cLow: 12.5, cHigh: 15.4, iLow: 151, iHigh: 200 },
      { cLow: 15.5, cHigh: 30.4, iLow: 201, iHigh: 300 },
      { cLow: 30.5, cHigh: 50.4, iLow: 301, iHigh: 500 },
    ],
  },
];

/**
 * EPA reports ozone on whichever of the 8-hour or 1-hour scales is worse, and
 * the 1-hour scale only applies at or above 0.125 ppm.
 */
export const US_OZONE_1H: PollutantScale = {
  pollutant: "ozone",
  unit: "ppm",
  averaging: "1h",
  truncate: 3,
  breakpoints: [
    { cLow: 0.125, cHigh: 0.164, iLow: 101, iHigh: 150 },
    { cLow: 0.165, cHigh: 0.204, iLow: 151, iHigh: 200 },
    { cLow: 0.205, cHigh: 0.404, iLow: 201, iHigh: 300 },
    { cLow: 0.405, cHigh: 0.604, iLow: 301, iHigh: 500 },
  ],
};

/* ------------------------------------------------------------------ */
/* Europe — EAQI                                                      */
/* ------------------------------------------------------------------ */

const EU_CATEGORIES: Category[] = [
  { min: 0, max: 20, label: "Good", color: "#50f0e6", onColor: "#0b3b38" },
  { min: 20, max: 40, label: "Fair", color: "#50ccaa", onColor: "#0b3329" },
  { min: 40, max: 60, label: "Moderate", color: "#f0e641", onColor: "#3b3705" },
  { min: 60, max: 80, label: "Poor", color: "#ff5050", onColor: "#ffffff" },
  { min: 80, max: 100, label: "Very Poor", color: "#960032", onColor: "#ffffff" },
  { min: 100, max: 120, label: "Extremely Poor", color: "#7d2181", onColor: "#ffffff" },
];

/** EAQI bands are equal-width index steps of 20 over unequal concentration bands. */
function eaqiScale(
  pollutant: PollutantKey,
  averaging: Averaging,
  bounds: [number, number, number, number, number, number],
): PollutantScale {
  const edges = [0, ...bounds];
  return {
    pollutant,
    unit: "ug/m3",
    averaging,
    breakpoints: edges.slice(0, 6).map((cLow, i) => ({
      cLow,
      cHigh: edges[i + 1],
      iLow: i * 20,
      iHigh: (i + 1) * 20,
    })),
  };
}

const EU_SCALES: PollutantScale[] = [
  eaqiScale("pm2_5", "24h", [10, 20, 25, 50, 75, 800]),
  eaqiScale("pm10", "24h", [20, 40, 50, 100, 150, 1200]),
  eaqiScale("nitrogen_dioxide", "1h", [40, 90, 120, 230, 340, 1000]),
  eaqiScale("ozone", "1h", [50, 100, 130, 240, 380, 800]),
  eaqiScale("sulphur_dioxide", "1h", [100, 200, 350, 500, 750, 1250]),
];

/* ------------------------------------------------------------------ */
/* India — CPCB National AQI                                          */
/* ------------------------------------------------------------------ */

const IN_CATEGORIES: Category[] = [
  { min: 0, max: 50, label: "Good", color: "#00b050", onColor: "#ffffff" },
  { min: 51, max: 100, label: "Satisfactory", color: "#92d050", onColor: "#1e3300" },
  { min: 101, max: 200, label: "Moderate", color: "#ffff00", onColor: "#3d3d00" },
  { min: 201, max: 300, label: "Poor", color: "#ff9900", onColor: "#3d2400" },
  { min: 301, max: 400, label: "Very Poor", color: "#ff0000", onColor: "#ffffff" },
  { min: 401, max: 500, label: "Severe", color: "#c00000", onColor: "#ffffff" },
];

/** CPCB sub-indices all share the same index steps: 50/100/200/300/400/500. */
function cpcbScale(
  pollutant: PollutantKey,
  averaging: Averaging,
  unit: PollutantScale["unit"],
  bounds: [number, number, number, number, number, number],
): PollutantScale {
  const indexEdges = [0, 50, 100, 200, 300, 400, 500];
  const edges = [0, ...bounds];
  return {
    pollutant,
    unit,
    averaging,
    breakpoints: edges.slice(0, 6).map((cLow, i) => ({
      cLow,
      cHigh: edges[i + 1],
      iLow: indexEdges[i],
      iHigh: indexEdges[i + 1],
    })),
  };
}

const IN_SCALES: PollutantScale[] = [
  cpcbScale("pm2_5", "24h", "ug/m3", [30, 60, 90, 120, 250, 500]),
  cpcbScale("pm10", "24h", "ug/m3", [50, 100, 250, 350, 430, 600]),
  cpcbScale("nitrogen_dioxide", "24h", "ug/m3", [40, 80, 180, 280, 400, 600]),
  cpcbScale("ozone", "8h", "ug/m3", [50, 100, 168, 208, 748, 1000]),
  cpcbScale("carbon_monoxide", "8h", "mg/m3", [1, 2, 10, 17, 34, 50]),
  cpcbScale("sulphur_dioxide", "24h", "ug/m3", [40, 80, 380, 800, 1600, 2000]),
  cpcbScale("ammonia", "24h", "ug/m3", [200, 400, 800, 1200, 1800, 2400]),
];

export const STANDARDS: Record<StandardId, Standard> = {
  us: {
    id: "us",
    name: "US EPA Air Quality Index",
    shortName: "US AQI",
    authority: "United States Environmental Protection Agency",
    region: "United States (used worldwide as a de facto standard)",
    scaleMax: 500,
    description:
      "A 0–500 scale where 100 marks the national air quality standard for each pollutant. Current-hour values use the EPA NowCast weighting for particulates, so the number reacts quickly when smoke or dust rolls in.",
    categories: US_CATEGORIES,
    scales: US_SCALES,
  },
  eu: {
    id: "eu",
    name: "European Air Quality Index",
    shortName: "EU AQI",
    authority: "European Environment Agency",
    region: "Europe",
    scaleMax: 120,
    description:
      "A band index from Good to Extremely Poor, anchored on WHO-aligned concentration thresholds. It is stricter than the US AQI at low concentrations: 25 µg/m³ of PM2.5 is already 'Moderate' here.",
    categories: EU_CATEGORIES,
    scales: EU_SCALES,
  },
  in: {
    id: "in",
    name: "India National Air Quality Index",
    shortName: "India AQI",
    authority: "Central Pollution Control Board",
    region: "India",
    scaleMax: 500,
    description:
      "A 0–500 scale on six categories from Good to Severe. It is the only major index that includes ammonia, and its PM2.5 bands are wider than the US EPA's above 100.",
    categories: IN_CATEGORIES,
    scales: IN_SCALES,
  },
};

export const STANDARD_ORDER: StandardId[] = ["us", "eu", "in"];

export function categoryFor(standard: Standard, index: number): Category {
  const categories = standard.categories;
  for (const c of categories) {
    if (index <= c.max) return c;
  }
  return categories[categories.length - 1];
}
