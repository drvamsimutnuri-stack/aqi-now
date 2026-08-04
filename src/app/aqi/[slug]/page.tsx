import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SnapshotView } from "@/components/SnapshotView";
import { DataError } from "@/components/DataError";
import { buildSnapshot, type Snapshot } from "@/lib/snapshot";
import { CITIES, findCity } from "@/lib/cities";

export const revalidate = 600;

export function generateStaticParams() {
  return CITIES.map((city) => ({ slug: city.slug }));
}

export async function generateMetadata({ params }: PageProps<"/aqi/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const city = findCity(slug);
  if (!city) return { title: "Location not found" };

  return {
    title: `${city.name} air quality index — live AQI and PM2.5`,
    description: `Live air quality in ${city.name}, ${city.country}: AQI on the US EPA, European and Indian scales, PM2.5, PM10, ozone, NO₂, SO₂ and CO levels, plus the health effects of each pollutant.`,
    alternates: { canonical: `/aqi/${city.slug}` },
  };
}

export default async function CityPage({ params }: PageProps<"/aqi/[slug]">) {
  const { slug } = await params;
  const city = findCity(slug);
  if (!city) notFound();

  let snapshot: Snapshot;
  try {
    snapshot = await buildSnapshot(city.latitude, city.longitude, {
      name: city.name,
      region: city.region ?? null,
      country: city.country,
    });
  } catch (error) {
    return <DataError message={error instanceof Error ? error.message : "Unknown error"} />;
  }

  return <SnapshotView snapshot={snapshot} />;
}
