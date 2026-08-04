import type { PollutantScale } from "./standards";

const UNIT_LABEL: Record<PollutantScale["unit"], string> = {
  "ug/m3": "µg/m³",
  "mg/m3": "mg/m³",
  ppb: "ppb",
  ppm: "ppm",
};

export function unitLabel(unit: PollutantScale["unit"]): string {
  return UNIT_LABEL[unit];
}

/** Significant-figure-aware formatting so small gas values stay readable. */
export function formatConcentration(value: number, unit: PollutantScale["unit"]): string {
  switch (unit) {
    case "ppm":
      return value.toFixed(3);
    case "mg/m3":
      return value.toFixed(2);
    case "ppb":
      return value >= 100 ? value.toFixed(0) : value.toFixed(1);
    case "ug/m3":
      return value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2);
  }
}

export function formatMeasure(value: number, unit: string): string {
  if (unit === "unitless" || unit === "index") {
    return value.toFixed(2);
  }
  if (Math.abs(value) >= 1000) return Math.round(value).toLocaleString("en-US");
  if (Math.abs(value) >= 100) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Open-Meteo timestamps are wall-clock time in the location's own timezone with
 * no offset attached ("2026-08-04T18:00"). Parsing them with `new Date` would
 * reinterpret them in the runtime's timezone, which differs between a UTC server
 * and the visitor's browser and would produce hydration mismatches. So read the
 * fields directly and never convert.
 */
function parseWallClock(isoLocal: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(isoLocal);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number) as unknown as number[];
  // getUTCDay on a UTC-constructed date is timezone-independent.
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return { year, month, day, hour, minute, weekday };
}

/** "Tue 4 Aug, 18:00" — as the clock reads at the location itself. */
export function formatLocalHour(isoLocal: string): string {
  const t = parseWallClock(isoLocal);
  if (!t) return isoLocal;
  const hh = String(t.hour).padStart(2, "0");
  const mm = String(t.minute).padStart(2, "0");
  return `${t.weekday} ${t.day} ${MONTHS[t.month - 1]}, ${hh}:${mm}`;
}

export function formatHourShort(isoLocal: string): string {
  const t = parseWallClock(isoLocal);
  if (!t) return isoLocal;
  return `${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")}`;
}

export function formatDayShort(isoLocal: string): string {
  const t = parseWallClock(isoLocal);
  if (!t) return isoLocal;
  return `${t.weekday} ${t.day}`;
}

export function placeLine(location: {
  name: string;
  region: string | null;
  country: string | null;
}): string {
  return [location.name, location.region, location.country]
    .filter((part, i, all) => part && all.indexOf(part) === i)
    .join(", ");
}
