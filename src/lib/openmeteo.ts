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

export async function fetchAirQuality(lat: number, lon: number): Promise<AirQualityResponse> {
  const url = new URL(AIR_QUALITY_URL);
  url.searchParams.set("latitude", lat.toFixed(4));
  url.searchParams.set("longitude", lon.toFixed(4));
  url.searchParams.set("hourly", HOURLY_FIELDS.join(","));
  url.searchParams.set("current", "us_aqi,european_aqi");
  url.searchParams.set("past_hours", String(PAST_HOURS));
  url.searchParams.set("forecast_days", String(FORECAST_DAYS));
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) {
    throw new Error(`Open-Meteo air quality request failed (${res.status})`);
  }
  return res.json();
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

  const res = await fetch(url, { next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`Open-Meteo batch request failed (${res.status})`);

  const data = await res.json();
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

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Geocoding request failed (${res.status})`);

  const data = await res.json();
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
 * Turn coordinates into a place name. Nominatim asks that callers identify
 * themselves and cache aggressively, hence the User-Agent and long revalidate.
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<{ name: string; region: string | null; country: string | null } | null> {
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
    });
    if (!res.ok) return null;

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
