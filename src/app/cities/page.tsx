import type { Metadata } from "next";
import { CityRanking } from "@/components/CityRanking";
import { DataError } from "@/components/DataError";
import { buildRanking, type RankedCity } from "@/lib/ranking";

export const revalidate = 900;

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

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Live city ranking</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mist-400">
          Every city scored from the same model output through the same three breakpoint tables, so
          the comparison is genuinely like for like. Sorted worst-first by US AQI. Updated every
          15 minutes.
        </p>
      </header>
      <CityRanking cities={cities} />
    </div>
  );
}
