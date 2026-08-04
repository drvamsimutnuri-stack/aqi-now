import { cigaretteEquivalent, computeIndex, trailingMean, type Series, type SubIndex } from "./aqi";
import { MEASURE_ORDER, MEASURES, POLLEN_ORDER, type MeasureKey, type PollenKey } from "./pollutants";
import { fetchAirQuality, reverseGeocode, type AirQualityResponse } from "./openmeteo";
import { fetchStationSnapshot, type StationReading, type StationSnapshot } from "./openaq";
import { STANDARD_ORDER, type PollutantKey, type StandardId } from "./standards";

/** Serialisable form of an index result; the Standard itself is a shared constant. */
export interface IndexPayload {
  standardId: StandardId;
  index: number | null;
  dominant: PollutantKey | null;
  subIndices: SubIndex[];
}

/**
 * A pollutant as actually measured at a ground station, kept alongside the
 * modelled value rather than replacing it.
 *
 * Deliberately not substituted into the index: the AQI needs 24-hour means, and
 * the `latest` endpoint gives only the newest hour, so swapping one hour of
 * measured data into a modelled average would produce a number belonging to
 * neither source. Showing both, and the gap between them, is more useful and
 * more honest than a silent blend.
 */
export interface MeasuredValue {
  /** Normalised to µg/m³ to match the modelled value. */
  value: number;
  rawValue: number;
  rawUnit: string;
  stationName: string;
  provider: string | null;
  distanceKm: number | null;
  ageMinutes: number;
  /** How far the model sits from the measurement, as a percentage of it. */
  deltaPct: number | null;
}

export interface MeasureReading {
  key: MeasureKey;
  /** Value for the current hour. */
  value: number | null;
  mean24h: number | null;
  /** Percent change against the same hour yesterday, when both exist. */
  changePct: number | null;
  /** How many times the WHO 24-hour guideline the 24-hour mean is. */
  whoRatio: number | null;
  unit: string;
  /** Null when no station nearby reports this pollutant, which is common. */
  measured: MeasuredValue | null;
}

export interface PollenReading {
  key: PollenKey;
  value: number;
  peakToday: number | null;
}

export interface TrendPoint {
  time: string;
  us: number | null;
  eu: number | null;
  in: number | null;
  pm2_5: number | null;
  isPast: boolean;
  isNow: boolean;
}

export interface SnapshotLocation {
  name: string;
  region: string | null;
  country: string | null;
  /** The coordinates actually asked for — the user's position or the city centre. */
  latitude: number;
  longitude: number;
  /**
   * Centre of the CAMS grid cell the reading came from. The model resolution is
   * roughly 11 km, so this can sit a couple of kilometres away; showing it
   * separately keeps the displayed position honest without looking like the
   * app lost track of where you are.
   */
  gridLatitude: number;
  gridLongitude: number;
  gridDistanceKm: number;
  elevation: number;
  timezone: string;
}

/** Great-circle distance in kilometres. */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

export interface Snapshot {
  location: SnapshotLocation;
  /** Local time of the hour being reported. */
  observedAt: string;
  timezoneAbbreviation: string;
  indices: Record<StandardId, IndexPayload>;
  measures: MeasureReading[];
  /** Null outside the CAMS Europe domain, where pollen is not modelled. */
  pollen: PollenReading[] | null;
  trend: TrendPoint[];
  /** Open-Meteo's own index values, kept as a cross-check. */
  provider: { usAqi: number | null; europeanAqi: number | null };
  cigarettesPerDay: number | null;
  /** Reference monitors that contributed a reading, nearest first. */
  stations: StationSnapshot["stations"] | null;
  fetchedAt: string;
}

/** Pollutants that feed at least one of the three indices. */
const INDEX_POLLUTANTS: PollutantKey[] = [
  "pm2_5",
  "pm10",
  "ozone",
  "nitrogen_dioxide",
  "sulphur_dioxide",
  "carbon_monoxide",
  "ammonia",
];

/** Trailing windows ending at `hour`, long enough for a 24-hour mean. */
function seriesAt(res: AirQualityResponse, hour: number): Series {
  const series: Series = {};
  const from = Math.max(0, hour - 23);
  for (const p of INDEX_POLLUTANTS) {
    const values = res.hourly[p];
    if (values) series[p] = values.slice(from, hour + 1);
  }
  return series;
}

/**
 * Locate the hour to report. Open-Meteo's `current.time` can carry a
 * half-hour timezone offset, so take the newest hourly slot at or before it.
 */
function findNowIndex(res: AirQualityResponse): number {
  const times = res.hourly.time;
  const now = res.current?.time;
  if (now) {
    for (let i = times.length - 1; i >= 0; i--) {
      if (times[i] <= now) return i;
    }
  }
  // Fall back to the mid-point of the window rather than the far forecast edge.
  return Math.min(times.length - 1, 47);
}

function toPayload(standardId: StandardId, series: Series): IndexPayload {
  const result = computeIndex(standardId, series);
  return {
    standardId,
    index: result.index,
    dominant: result.dominant,
    subIndices: result.subIndices,
  };
}

export async function buildSnapshot(
  latitude: number,
  longitude: number,
  knownName?: { name: string; region?: string | null; country?: string | null },
): Promise<Snapshot> {
  const [res, place, stationData] = await Promise.all([
    fetchAirQuality(latitude, longitude),
    knownName ? Promise.resolve(null) : reverseGeocode(latitude, longitude),
    // Supplementary: a failure here costs provenance detail, never the page.
    fetchStationSnapshot(latitude, longitude).catch(() => null),
  ]);

  const measuredByKey = new Map<MeasureKey, StationReading>(
    (stationData?.readings ?? []).map((r) => [r.measure, r]),
  );

  const now = findNowIndex(res);
  const currentSeries = seriesAt(res, now);

  const indices = Object.fromEntries(
    STANDARD_ORDER.map((id) => [id, toPayload(id, currentSeries)]),
  ) as Record<StandardId, IndexPayload>;

  const measures: MeasureReading[] = MEASURE_ORDER.map((key) => {
    const values = res.hourly[key as keyof typeof res.hourly] as (number | null)[] | undefined;
    const value = values?.[now] ?? null;
    const window = values ? values.slice(Math.max(0, now - 23), now + 1) : [];
    const mean24h = values ? trailingMean(window, 24) : null;
    const yesterday = values?.[now - 24] ?? null;

    const who24h = MEASURES[key].who.find((g) => g.label === "24-hour");
    const station = measuredByKey.get(key);

    return {
      key,
      value,
      mean24h,
      changePct:
        value !== null && yesterday !== null && yesterday > 0
          ? ((value - yesterday) / yesterday) * 100
          : null,
      whoRatio: who24h && mean24h !== null ? mean24h / who24h.value : null,
      unit: MEASURES[key].unit,
      measured: station
        ? {
            value: station.value,
            rawValue: station.rawValue,
            rawUnit: station.rawUnit,
            stationName: station.stationName,
            provider: station.provider,
            distanceKm: station.distanceKm,
            ageMinutes: station.ageMinutes,
            deltaPct:
              value !== null && station.value > 0
                ? ((value - station.value) / station.value) * 100
                : null,
          }
        : null,
    };
  });

  const pollenReadings: PollenReading[] = [];
  for (const key of POLLEN_ORDER) {
    const values = res.hourly[key];
    const value = values?.[now];
    if (!values || value === null || value === undefined) continue;
    const today = values.slice(Math.max(0, now - 12), now + 12).filter((v): v is number => v !== null);
    pollenReadings.push({
      key,
      value,
      peakToday: today.length ? Math.max(...today) : null,
    });
  }

  // Recompute the index for every hour so the chart and the headline agree.
  const trendStart = Math.max(0, now - 24);
  const trend: TrendPoint[] = [];
  for (let h = trendStart; h < res.hourly.time.length; h++) {
    const series = seriesAt(res, h);
    trend.push({
      time: res.hourly.time[h],
      us: computeIndex("us", series).index,
      eu: computeIndex("eu", series).index,
      in: computeIndex("in", series).index,
      pm2_5: res.hourly.pm2_5?.[h] ?? null,
      isPast: h < now,
      isNow: h === now,
    });
  }

  const pm25Mean = measures.find((m) => m.key === "pm2_5")?.mean24h ?? null;

  return {
    location: {
      name: knownName?.name ?? place?.name ?? `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
      region: knownName?.region ?? place?.region ?? null,
      country: knownName?.country ?? place?.country ?? null,
      latitude,
      longitude,
      gridLatitude: res.latitude,
      gridLongitude: res.longitude,
      gridDistanceKm: haversineKm(latitude, longitude, res.latitude, res.longitude),
      elevation: res.elevation,
      timezone: res.timezone,
    },
    observedAt: res.hourly.time[now],
    timezoneAbbreviation: res.timezone_abbreviation,
    indices,
    measures,
    pollen: pollenReadings.length ? pollenReadings : null,
    trend,
    provider: {
      usAqi: res.current?.us_aqi ?? null,
      europeanAqi: res.current?.european_aqi ?? null,
    },
    cigarettesPerDay: pm25Mean !== null ? cigaretteEquivalent(pm25Mean) : null,
    stations: stationData?.stations ?? null,
    fetchedAt: new Date().toISOString(),
  };
}
