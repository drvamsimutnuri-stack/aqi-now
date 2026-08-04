import type { MeasureKey } from "./pollutants";
import { toUgm3 } from "./units";

/**
 * OpenAQ v3 client for ground-station readings.
 *
 * Why this exists: Open-Meteo serves the CAMS model, which is a physics
 * simulation on a roughly 11 km grid. It is genuinely good, but it is an
 * estimate. OpenAQ aggregates readings from official reference monitors — India's
 * CPCB, US AirNow, the EEA — so where a station is nearby we can show what was
 * actually measured and say so.
 *
 * v3 requires an API key (v1 and v2 are retired and return 410). Without a key
 * every function here returns null and the app falls back to model-only, which
 * is the entire point of keeping this layer separate.
 */

const OPENAQ_BASE = "https://api.openaq.org/v3";

/** Default search radius. OpenAQ caps this at 25 km. */
export const DEFAULT_RADIUS_M = 25_000;

/**
 * A reading older than this is not describing current conditions. Reference
 * monitors report hourly, and some lag, so three hours is tolerant without
 * being misleading.
 */
export const MAX_AGE_MINUTES = 180;

/** OpenAQ parameter names mapped onto our internal measure keys. */
const PARAMETER_TO_MEASURE: Record<string, MeasureKey> = {
  pm25: "pm2_5",
  "pm2.5": "pm2_5",
  pm10: "pm10",
  o3: "ozone",
  no2: "nitrogen_dioxide",
  so2: "sulphur_dioxide",
  co: "carbon_monoxide",
  nh3: "ammonia",
};

export function measureForParameter(parameter: string): MeasureKey | null {
  return PARAMETER_TO_MEASURE[parameter.trim().toLowerCase()] ?? null;
}

export function hasOpenAqKey(): boolean {
  return Boolean(process.env.OPENAQ_API_KEY);
}

interface OpenAqSensor {
  id: number;
  parameter: { id: number; name: string; units: string; displayName?: string | null };
}

interface OpenAqLocation {
  id: number;
  name: string | null;
  locality?: string | null;
  timezone?: string | null;
  country?: { code?: string | null; name?: string | null } | null;
  provider?: { id?: number; name?: string | null } | null;
  isMobile?: boolean;
  isMonitor?: boolean;
  sensors?: OpenAqSensor[];
  coordinates?: { latitude: number; longitude: number } | null;
  /** Metres from the queried point; present when searching by coordinates. */
  distance?: number | null;
  datetimeLast?: { utc?: string | null; local?: string | null } | null;
}

interface OpenAqLatest {
  datetime?: { utc?: string | null; local?: string | null } | null;
  value?: number | null;
  sensorsId?: number;
  locationsId?: number;
}

/** One pollutant, actually measured at a named station. */
export interface StationReading {
  measure: MeasureKey;
  /** Normalised to µg/m³ so it can feed the AQI engine directly. */
  value: number;
  rawValue: number;
  rawUnit: string;
  observedAtUtc: string;
  ageMinutes: number;
  stationId: number;
  stationName: string;
  provider: string | null;
  distanceKm: number | null;
}

export interface StationSnapshot {
  readings: StationReading[];
  /** Stations that contributed at least one fresh reading. */
  stations: {
    id: number;
    name: string;
    provider: string | null;
    distanceKm: number | null;
    measures: MeasureKey[];
  }[];
}

/**
 * Station data enriches the page but the page is complete without it, so it gets
 * a tight budget, no retries, and a circuit breaker. It must never be the reason
 * a render is slow — the same discipline the Nominatim lookup needed, for the
 * same reason.
 */
const REQUEST_BUDGET_MS = 2000;
const BREAKER_MS = 5 * 60_000;
let unavailableUntil = 0;

async function openAqGet<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const key = process.env.OPENAQ_API_KEY;
  if (!key) return null;
  if (Date.now() < unavailableUntil) return null;

  const url = new URL(`${OPENAQ_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  try {
    const res = await fetch(url, {
      headers: { "X-API-Key": key },
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(REQUEST_BUDGET_MS),
    });

    if (res.ok) return (await res.json()) as T;

    // A rejected key or exhausted quota will not fix itself on the next render,
    // so stop asking rather than burning the quota on every page view.
    if (res.status === 401 || res.status === 403 || res.status === 429) {
      unavailableUntil = Date.now() + BREAKER_MS;
    }
    return null;
  } catch {
    // Timed out or unreachable.
    unavailableUntil = Date.now() + BREAKER_MS;
    return null;
  }
}

/** Exposed for tests, which need a clean breaker between cases. */
export function resetOpenAqBreaker(): void {
  unavailableUntil = 0;
}

function ageMinutes(utc: string, now: number): number {
  return (now - Date.parse(utc)) / 60_000;
}

/**
 * Fixed-site reference monitors within range, nearest first.
 *
 * Mobile stations are excluded because a reading is only useful here if we know
 * where it was taken, and low-cost sensor networks are excluded via isMonitor
 * so we are not presenting an unreferenced sensor as ground truth.
 */
export async function fetchNearbyStations(
  latitude: number,
  longitude: number,
  radiusM: number = DEFAULT_RADIUS_M,
): Promise<OpenAqLocation[] | null> {
  const data = await openAqGet<{ results?: OpenAqLocation[] }>("/locations", {
    coordinates: `${latitude.toFixed(4)},${longitude.toFixed(4)}`,
    radius: String(Math.min(Math.round(radiusM), 25_000)),
    limit: "12",
  });
  if (!data?.results) return null;

  return data.results
    .filter((l) => l.isMobile !== true && l.isMonitor !== false && (l.sensors?.length ?? 0) > 0)
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
}

async function fetchLatestForLocation(id: number): Promise<OpenAqLatest[] | null> {
  const data = await openAqGet<{ results?: OpenAqLatest[] }>(`/locations/${id}/latest`, {
    limit: "100",
  });
  return data?.results ?? null;
}

/**
 * Build the measured picture for a point: for each pollutant, the reading from
 * the nearest station that has a fresh value for it.
 *
 * Per-pollutant selection matters because station coverage is patchy — the
 * closest station might report only PM2.5, while ozone comes from one 8 km
 * further out. Taking the nearest station wholesale would throw that away.
 */
export async function fetchStationSnapshot(
  latitude: number,
  longitude: number,
  radiusM: number = DEFAULT_RADIUS_M,
  now: number = Date.now(),
): Promise<StationSnapshot | null> {
  const locations = await fetchNearbyStations(latitude, longitude, radiusM);
  if (!locations || locations.length === 0) return null;

  // Only the nearest few, to bound the number of requests per render.
  const candidates = locations.slice(0, 3);
  const latestPerLocation = await Promise.all(
    candidates.map(async (location) => ({
      location,
      latest: await fetchLatestForLocation(location.id),
    })),
  );

  const best = new Map<MeasureKey, StationReading>();

  for (const { location, latest } of latestPerLocation) {
    if (!latest) continue;

    const sensorById = new Map((location.sensors ?? []).map((s) => [s.id, s]));
    const distanceKm = typeof location.distance === "number" ? location.distance / 1000 : null;
    const stationName = location.name ?? location.locality ?? `Station ${location.id}`;

    for (const entry of latest) {
      const sensor = entry.sensorsId !== undefined ? sensorById.get(entry.sensorsId) : undefined;
      if (!sensor || typeof entry.value !== "number") continue;

      const measure = measureForParameter(sensor.parameter.name);
      if (!measure) continue;

      const observedAtUtc = entry.datetime?.utc;
      if (!observedAtUtc) continue;

      const age = ageMinutes(observedAtUtc, now);
      if (!Number.isFinite(age) || age < -60 || age > MAX_AGE_MINUTES) continue;

      const value = toUgm3(entry.value, sensor.parameter.units, measure);
      if (value === null || value < 0) continue;

      const candidate: StationReading = {
        measure,
        value,
        rawValue: entry.value,
        rawUnit: sensor.parameter.units,
        observedAtUtc,
        ageMinutes: Math.max(0, age),
        stationId: location.id,
        stationName,
        provider: location.provider?.name ?? null,
        distanceKm,
      };

      const existing = best.get(measure);
      if (!existing || isCloser(candidate, existing)) best.set(measure, candidate);
    }
  }

  if (best.size === 0) return null;

  const readings = [...best.values()];
  const byStation = new Map<number, StationSnapshot["stations"][number]>();
  for (const reading of readings) {
    const entry = byStation.get(reading.stationId) ?? {
      id: reading.stationId,
      name: reading.stationName,
      provider: reading.provider,
      distanceKm: reading.distanceKm,
      measures: [],
    };
    entry.measures.push(reading.measure);
    byStation.set(reading.stationId, entry);
  }

  return {
    readings,
    stations: [...byStation.values()].sort(
      (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
    ),
  };
}

/**
 * Prefer the nearer station, but treat a much fresher reading as worth a little
 * extra distance — a current value from 9 km away beats a two-hour-old one from
 * 8 km.
 */
function isCloser(candidate: StationReading, existing: StationReading): boolean {
  const a = candidate.distanceKm ?? Infinity;
  const b = existing.distanceKm ?? Infinity;
  if (Math.abs(a - b) < 2) return candidate.ageMinutes < existing.ageMinutes;
  return a < b;
}
