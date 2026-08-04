import type { Metadata } from "next";
import { CityRanking } from "@/components/CityRanking";
import { DataError } from "@/components/DataError";
import { buildRanking, type RankedCity } from "@/lib/ranking";

// Matches the upstream cache for this page's data. A leaderboard does not need
// minute-level freshness, and refetching 57 cities often is what got us
// rate-limited in the first place.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Live city air quality ranking",
  description:
    "Compare live air quality across major world cities on the US EPA, European and Indian air quality indices, with PM2.5 levels and the dominant pollutant for each.",
};

export default async function CitiesPage() {
  let cities: RankedCity[];
  try {
    cities = await buildRanking();
  } catch (error) {
    return <DataError message={error instanceof Error ? error.message : "Unknown error"} />;
  }

  // Chunks now fail individually, so a partial result is normal rather than an
  // error. Only an empty board means we genuinely have nothing to show.
  const scored = cities.filter((c) => c.indices.us !== null);
  if (scored.length === 0) {
    return <DataError message="No city data came back from the forecast service." />;
  }
  const missing = cities.length - scored.length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Live city ranking</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mist-400">
          Every city scored from the same model output through the same three breakpoint tables, so
          the comparison is genuinely like for like. Sorted worst-first by US AQI. Updated hourly.
        </p>
        {missing > 0 && (
          <p className="mt-2 text-[12px] text-amber-200/80">
            {missing} of {cities.length} cities are missing from this update — the forecast service
            declined part of the request. They should reappear within the hour.
          </p>
        )}
      </header>
      <CityRanking cities={scored} />
    </div>
  );
}
