import { computeIndex, type Series } from "./aqi";
import { CITIES, type City } from "./cities";
import { fetchAirQualityBatch, type AirQualityResponse } from "./openmeteo";
import type { PollutantKey, StandardId } from "./standards";

export interface RankedCity {
  slug: string;
  name: string;
  country: string;
  indices: Record<StandardId, number | null>;
  dominant: PollutantKey | null;
  pm2_5: number | null;
  pm10: number | null;
  observedAt: string;
}

const POLLUTANTS: PollutantKey[] = [
  "pm2_5",
  "pm10",
  "ozone",
  "nitrogen_dioxide",
  "sulphur_dioxide",
  "carbon_monoxide",
  "ammonia",
];

function nowIndexOf(res: AirQualityResponse): number {
  const times = res.hourly?.time ?? [];
  const now = res.current?.time;
  if (now) {
    for (let i = times.length - 1; i >= 0; i--) if (times[i] <= now) return i;
  }
  return Math.max(0, times.length - 1);
}

function seriesAt(res: AirQualityResponse, hour: number): Series {
  const series: Series = {};
  const from = Math.max(0, hour - 23);
  for (const p of POLLUTANTS) {
    const values = res.hourly?.[p];
    if (values) series[p] = values.slice(from, hour + 1);
  }
  return series;
}

/** Live index for every curated city, from one batched upstream request. */
export async function buildRanking(cities: City[] = CITIES): Promise<RankedCity[]> {
  const responses = await fetchAirQualityBatch(cities);

  return cities.map((city, i) => {
    const res = responses[i];
    if (!res?.hourly?.time?.length) {
      return {
        slug: city.slug,
        name: city.name,
        country: city.country,
        indices: { us: null, eu: null, in: null },
        dominant: null,
        pm2_5: null,
        pm10: null,
        observedAt: "",
      };
    }

    const now = nowIndexOf(res);
    const series = seriesAt(res, now);
    const us = computeIndex("us", series);

    return {
      slug: city.slug,
      name: city.name,
      country: city.country,
      indices: {
        us: us.index,
        eu: computeIndex("eu", series).index,
        in: computeIndex("in", series).index,
      },
      dominant: us.dominant,
      pm2_5: res.hourly.pm2_5?.[now] ?? null,
      pm10: res.hourly.pm10?.[now] ?? null,
      observedAt: res.hourly.time[now],
    };
  });
}
