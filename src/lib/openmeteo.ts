import type { MeasureKey, PollenKey } from "./pollutants";

const AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

/** Open-Meteo hourly field names, in the order they are requested. */
export const HOURLY_FIELDS = [
  "pm2_5",
  "pm10",
  "ozone",
  "nitrogen_dioxide",
  "sulphur_dioxide",
  "carbon_monoxide",
  "ammonia",
  "dust",
  "aerosol_optical_depth",
  "uv_index",
  "methane",
  "us_aqi",
  "european_aqi",
  "alder_pollen",
  "birch_pollen",
  "grass_pollen",
  "mugwort_pollen",
  "olive_pollen",
  "ragweed_pollen",
] as const;

export type HourlyField = (typeof HOURLY_FIELDS)[number];

export interface AirQualityResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  timezone_abbreviation: string;
  utc_offset_seconds: number;
  current: { time: string; interval: number } & Partial<Record<"us_aqi" | "european_aqi", number | null>>;
  hourly: { time: string[] } & Partial<Record<HourlyField, (number | null)[]>>;
  hourly_units: Record<string, string>;
}

export interface Place {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string | null;
  countryCode: string | null;
  admin1: string | null;
  admin2: string | null;
  timezone: string | null;
  population: number | null;
}

/** How many trailing hours the 24-hour averages need, with margin. */
export const PAST_HOURS = 48;
export const FORECAST_DAYS = 3;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch JSON with retries and backoff.
 *
 * A single transient upstream hiccup used to blank the whole page, because a
 * thrown fetch takes the server component down with it. Client errors are not
 * retried — a 400 will still be a 400 — but 5xx, 429 and network faults are.
 */
async function fetchJson<T>(
  url: URL,
  label: string,
  { revalidate, attempts = 3, headers }: { revalidate: number; attempts?: number; headers?: Record<string, string> },
): Promise<T> {
  let lastError: Error = new Error(`${label} failed`);

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url, { next: { revalidate }, headers });

      if (res.ok) return (await res.json()) as T;

      const retryable = res.status >= 500 || res.status === 429;
      lastError = new Error(`${label} failed (HTTP ${res.status})`);
      if (!retryable) throw lastError;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      // A non-retryable HTTP status was rethrown above; stop immediately.
      if (/HTTP 4\d\d/.test(lastError.message)) throw lastError;
    }

    if (attempt < attempts) await delay(250 * 2 ** (attempt - 1));
  }

  throw lastError;
}

export async function fetchAirQuality(lat: number, lon: number): Promise<AirQualityResponse> {
  const url = new URL(AIR_QUALITY_URL);
  url.searchParams.set("latitude", lat.toFixed(4));
  url.searchParams.set("longitude", lon.toFixed(4));
  url.searchParams.set("hourly", HOURLY_FIELDS.join(","));
  url.searchParams.set("current", "us_aqi,european_aqi");
  url.searchParams.set("past_hours", String(PAST_HOURS));
  url.searchParams.set("forecast_days", String(FORECAST_DAYS));
  url.searchParams.set("timezone", "auto");

  return fetchJson<AirQualityResponse>(url, "Open-Meteo air quality request", {
    revalidate: 600,
  });
}

/** Pollutant fields needed to score an index, without the chart extras. */
const RANKING_FIELDS = [
  "pm2_5",
  "pm10",
  "ozone",
  "nitrogen_dioxide",
  "sulphur_dioxide",
  "carbon_monoxide",
  "ammonia",
] as const;

/**
 * Fetch many locations in one request. Open-Meteo accepts comma-separated
 * coordinates and returns an array in the same order, which keeps the city
 * ranking to a single upstream call.
 */
export async function fetchAirQualityBatch(
  points: { latitude: number; longitude: number }[],
): Promise<AirQualityResponse[]> {
  if (points.length === 0) return [];

  const url = new URL(AIR_QUALITY_URL);
  url.searchParams.set("latitude", points.map((p) => p.latitude.toFixed(4)).join(","));
  url.searchParams.set("longitude", points.map((p) => p.longitude.toFixed(4)).join(","));
  url.searchParams.set("hourly", RANKING_FIELDS.join(","));
  url.searchParams.set("current", "us_aqi,european_aqi");
  url.searchParams.set("past_hours", String(PAST_HOURS));
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("timezone", "auto");

  const data = await fetchJson<AirQualityResponse | AirQualityResponse[]>(
    url,
    "Open-Meteo batch request",
    { revalidate: 900 },
  );
  return Array.isArray(data) ? data : [data];
}

export async function searchPlaces(query: string, count = 8): Promise<Place[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", trimmed);
  url.searchParams.set("count", String(count));
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const data = await fetchJson<{ results?: Record<string, unknown>[] }>(
    url,
    "Geocoding request",
    { revalidate: 86400 },
  );
  const results: Record<string, unknown>[] = data.results ?? [];
  return results.map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    country: (r.country as string) ?? null,
    countryCode: (r.country_code as string) ?? null,
    admin1: (r.admin1 as string) ?? null,
    admin2: (r.admin2 as string) ?? null,
    timezone: (r.timezone as string) ?? null,
    population: r.population ? Number(r.population) : null,
  }));
}

/**
 * How long a page will wait for a place name before giving up and showing
 * coordinates. Nominatim's own connect timeout is 10 seconds, which is far too
 * long to stall a render for a cosmetic label.
 */
const REVERSE_BUDGET_MS = 2500;
const REVERSE_BREAKER_MS = 5 * 60_000;

/**
 * Set when a lookup fails, so an unreachable Nominatim costs one slow request
 * rather than one per visitor. Cheap circuit breaker: process-local and
 * time-based, which is all this needs — the fallback is merely a coordinate
 * label, so failing open again after a few minutes is harmless.
 */
let reverseUnavailableUntil = 0;

/**
 * Turn coordinates into a place name. Nominatim asks that callers identify
 * themselves and cache aggressively, hence the User-Agent and long revalidate.
 *
 * Always fails soft: the caller falls back to showing coordinates, so no
 * failure here should ever be visible as anything worse than a missing name.
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<{ name: string; region: string | null; country: string | null } | null> {
  if (Date.now() < reverseUnavailableUntil) return null;
  const url = new URL(REVERSE_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", lat.toFixed(4));
  url.searchParams.set("lon", lon.toFixed(4));
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "aqi-now/0.1 (open-source air quality viewer)" },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(REVERSE_BUDGET_MS),
    });
    if (!res.ok) {
      // Being rate-limited or refused is a reason to back off, not to retry.
      if (res.status === 429 || res.status >= 500) {
        reverseUnavailableUntil = Date.now() + REVERSE_BREAKER_MS;
      }
      return null;
    }

    const data = await res.json();
    const a = data.address ?? {};
    const name =
      a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? a.state_district ?? data.name;
    if (!name) return null;

    return {
      name: String(name),
      region: a.state ?? a.state_district ?? null,
      country: a.country ?? null,
    };
  } catch {
    // Timed out or unreachable; stop asking for a while.
    reverseUnavailableUntil = Date.now() + REVERSE_BREAKER_MS;
    return null;
  }
}

/** Fields that are pollutants or environmental measures rather than pollen. */
export function isMeasureField(field: HourlyField): field is HourlyField & MeasureKey {
  return !field.endsWith("_pollen") && field !== "us_aqi" && field !== "european_aqi";
}

export function isPollenField(field: HourlyField): field is HourlyField & PollenKey {
  return field.endsWith("_pollen");
}
