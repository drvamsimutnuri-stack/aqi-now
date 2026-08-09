import type { Metadata } from "next";
import { SnapshotView } from "@/components/SnapshotView";
import { DataError } from "@/components/DataError";
import { buildSnapshot, type Snapshot } from "@/lib/snapshot";
import { findCity } from "@/lib/cities";

export const revalidate = 600;

/** Shown before the visitor picks a location or shares their own. */
const DEFAULT_CITY = findCity("delhi")!;

function coerce(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({
  searchParams,
}: PageProps<"/">): Promise<Metadata> {
  const params = await searchParams;
  const name = coerce(params.name) ?? DEFAULT_CITY.name;
  return {
    title: `Air quality in ${name} — live AQI, PM2.5 and health effects`,
    description: `Current air quality index for ${name} on the US EPA, European and Indian scales, with PM2.5, PM10, ozone, NO₂, SO₂, CO and ammonia levels and the health effects of each.`,
  };
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const lat = Number(coerce(params.lat));
  const lon = Number(coerce(params.lon));
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;

  const target = hasCoords
    ? {
        latitude: lat,
        longitude: lon,
        name: coerce(params.name),
        region: coerce(params.region) ?? null,
        country: coerce(params.country) ?? null,
        countryCode: coerce(params.cc) ?? null,
      }
    : {
        latitude: DEFAULT_CITY.latitude,
        longitude: DEFAULT_CITY.longitude,
        name: DEFAULT_CITY.name,
        region: DEFAULT_CITY.region ?? null,
        country: DEFAULT_CITY.country,
        countryCode: null,
      };

  // Resolve the data first; JSX is built outside the try so that render-time
  // errors reach the error boundary instead of being swallowed here.
  let snapshot: Snapshot;
  try {
    snapshot = await buildSnapshot(
      target.latitude,
      target.longitude,
      target.name
        ? {
            name: target.name,
            region: target.region,
            country: target.country,
            countryCode: target.countryCode,
          }
        : undefined,
    );
  } catch (error) {
    return <DataError message={error instanceof Error ? error.message : "Unknown error"} />;
  }

  return <SnapshotView snapshot={snapshot} />;
}
