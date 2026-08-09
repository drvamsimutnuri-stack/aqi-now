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
  {
    revalidate,
    attempts = 3,
    headers,
    timeoutMs = 9000,
  }: { revalidate: number; attempts?: number; headers?: Record<string, string>; timeoutMs?: number },
): Promise<T> {
  let lastError: Error = new Error(`${label} failed`);

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      // Without a deadline an overloaded upstream can hang until the platform
      // kills the whole render. Retrying a slow request beats waiting on it.
      const res = await fetch(url, {
        next: { revalidate },
        headers,
        signal: AbortSignal.timeout(timeoutMs),
      });

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
 * Locations per upstream request.
 *
 * Open-Meteo prices a call by locations × variables × hours, so asking for all
 * 57 cities at once was expensive enough to be rate-limited (HTTP 429) and, when
 * it was accepted, slow enough to hang. Measured: 1 location ~0.9s, 4 ~1.1s,
 * 12 ~2.4s, 57 either times out or is refused. Twelve keeps each request cheap
 * and quick while needing only a handful of them.
 */
const BATCH_CHUNK = 12;

/**
 * Chunks in flight at once. The rate limit counts locations over time, not
 * connections, so running the handful of chunks together costs the same as
 * staggering them and keeps a cold render inside a serverless timeout.
 */
const BATCH_CONCURRENCY = 6;

/**
 * Must match the detail pages' window. Trimming this to 24 looked like free
 * savings, but it shifted which hours fall into the 24-hour trailing mean and
 * made Delhi read 129 here against 114 on its own page. The EU index was
 * unaffected, which is the tell: only the averaged indices moved. Chunking is
 * what solved the rate limiting, so this can stay aligned.
 */
const RANKING_PAST_HOURS = PAST_HOURS;

/**
 * Fetch many locations, in chunks.
 *
 * Chunks that fail yield empty responses rather than rejecting, so one refused
 * chunk costs a few rows of the ranking instead of the whole page. Order is
 * preserved so callers can zip the results back against their input.
 */
export async function fetchAirQualityBatch(
  points: { latitude: number; longitude: number }[],
): Promise<AirQualityResponse[]> {
  if (points.length === 0) return [];

  const chunks: { latitude: number; longitude: number }[][] = [];
  for (let i = 0; i < points.length; i += BATCH_CHUNK) {
    chunks.push(points.slice(i, i + BATCH_CHUNK));
  }

  const results: AirQualityResponse[][] = new Array(chunks.length).fill(null);
  let next = 0;

  async function worker() {
    while (next < chunks.length) {
      const index = next++;
      results[index] = await fetchChunk(chunks[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(BATCH_CONCURRENCY, chunks.length) }, worker),
  );

  return results.flat();
}

async function fetchChunk(
  points: { latitude: number; longitude: number }[],
): Promise<AirQualityResponse[]> {
  const url = new URL(AIR_QUALITY_URL);
  url.searchParams.set("latitude", points.map((p) => p.latitude.toFixed(4)).join(","));
  url.searchParams.set("longitude", points.map((p) => p.longitude.toFixed(4)).join(","));
  url.searchParams.set("hourly", RANKING_FIELDS.join(","));
  url.searchParams.set("current", "us_aqi,european_aqi");
  url.searchParams.set("past_hours", String(RANKING_PAST_HOURS));
  // forecast_days is ignored once past_hours is set — it was quietly returning
  // 216 hours per city, four times what the ranking reads. forecast_hours is
  // honoured, and ending at the current hour is all a leaderboard needs.
  url.searchParams.set("forecast_hours", "1");
  url.searchParams.set("timezone", "auto");

  try {
    const data = await fetchJson<AirQualityResponse | AirQualityResponse[]>(
      url,
      "Open-Meteo batch request",
      // An hour is ample for a leaderboard, and it cuts upstream load fourfold
      // against the 15 minutes this used to use.
      { revalidate: 3600, attempts: 2, timeoutMs: 8000 },
    );
    const list = Array.isArray(data) ? data : [data];
    // Guard against a short response silently shifting every later city.
    return list.length === points.length ? list : padTo(list, points.length);
  } catch {
    return padTo([], points.length);
  }
}

/** Placeholders keep positions aligned when a chunk fails or comes up short. */
function padTo(list: AirQualityResponse[], length: number): AirQualityResponse[] {
  const padded = list.slice(0, length);
  while (padded.length < length) padded.push({} as AirQualityResponse);
  return padded;
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
): Promise<{
  name: string;
  region: string | null;
  country: string | null;
  /** ISO 3166-1 alpha-2, upper-cased. Independent of what language the name came back in. */
  countryCode: string | null;
} | null> {
  if (Date.now() < reverseUnavailableUntil) return null;
  const url = new URL(REVERSE_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", lat.toFixed(4));
  url.searchParams.set("lon", lon.toFixed(4));
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "aqi-now/0.1 (open-source air quality viewer)",
        // Nominatim answers in the location's own language unless asked
        // otherwise, so without this a place in India can come back as
        // "भारत" — which then fails every comparison we make against it.
        "Accept-Language": "en",
      },
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
      countryCode: a.country_code ? String(a.country_code).toUpperCase() : null,
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
