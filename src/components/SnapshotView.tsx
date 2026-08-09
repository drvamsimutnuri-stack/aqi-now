import Link from "next/link";
import { HealthSection } from "./health/HealthSection";
import { IndexPanel } from "./IndexPanel";
import { StationPanel } from "./StationPanel";
import { LocationBar } from "./LocationBar";
import { PollenPanel } from "./PollenPanel";
import { PollutantGrid } from "./PollutantGrid";
import { TrendChart } from "./TrendChart";
import { formatLocalHour, placeLine } from "@/lib/format";
import { CITIES, FEATURED_SLUGS } from "@/lib/cities";
import { categoryFor, STANDARDS, STANDARD_ORDER, type StandardId } from "@/lib/standards";
import type { Snapshot } from "@/lib/snapshot";

/**
 * Rough bounds of the Indian subcontinent.
 *
 * Only consulted when we never learned the country: a reverse lookup that timed
 * out, or a location shared as bare coordinates. Showing someone standing in
 * Delhi the US index is a worse error than occasionally defaulting a
 * neighbouring country to CPCB, and the tab is switchable either way.
 */
function looksIndian(latitude: number, longitude: number): boolean {
  return latitude >= 6.5 && latitude <= 35.5 && longitude >= 68 && longitude <= 97.5;
}

/** Pick the standard a visitor at this location is most likely to recognise. */
function defaultStandard(snapshot: Snapshot): StandardId {
  const { country, countryCode, latitude, longitude } = snapshot.location;

  // The code is the reliable signal; the name depends on what language the
  // geocoder felt like answering in.
  if (countryCode === "IN" || country === "India") return "in";

  // Pollen is only modelled inside the CAMS Europe domain, so its presence
  // is a reliable signal that we are in Europe.
  if (snapshot.pollen) return "eu";

  // Passing a place name without a country skips the reverse lookup entirely,
  // which is how an Indian city ended up scored on the US index.
  if (!country && !countryCode && looksIndian(latitude, longitude)) return "in";

  return "us";
}

const featured = FEATURED_SLUGS.map((slug) => CITIES.find((c) => c.slug === slug)).filter(
  (c): c is (typeof CITIES)[number] => Boolean(c),
);

export function SnapshotView({ snapshot }: { snapshot: Snapshot }) {
  const label = placeLine(snapshot.location);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <LocationBar currentLabel={snapshot.location.name} />

      <header className="animate-rise">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{label}</h1>
        <p className="tnum mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-mist-400">
          <span>
            {snapshot.location.latitude.toFixed(4)}°, {snapshot.location.longitude.toFixed(4)}°
          </span>
          <span aria-hidden>·</span>
          <span>{Math.round(snapshot.location.elevation)} m elevation</span>
          <span aria-hidden>·</span>
          <span>
            Hour of {formatLocalHour(snapshot.observedAt)} {snapshot.timezoneAbbreviation}
          </span>
          <span aria-hidden>·</span>
          <span
            title={`Model grid cell centre: ${snapshot.location.gridLatitude.toFixed(3)}°, ${snapshot.location.gridLongitude.toFixed(3)}°`}
          >
            Nearest CAMS cell {snapshot.location.gridDistanceKm < 1
              ? "under 1 km"
              : `${snapshot.location.gridDistanceKm.toFixed(1)} km`}{" "}
            away
          </span>
        </p>
      </header>

      <IndexPanel indices={snapshot.indices} initialStandard={defaultStandard(snapshot)} />

      <section className="card p-5 sm:p-6">
        <h3 className="text-lg font-bold tracking-tight">The same air on three standards</h3>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-mist-400">
          One set of concentrations, three national scoring systems. They disagree because they were
          written with different averaging periods, different thresholds and different policy goals —
          which is exactly why a single number quoted without its standard is close to meaningless.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {STANDARD_ORDER.map((id) => {
            const payload = snapshot.indices[id];
            const standard = STANDARDS[id];
            const category = payload.index !== null ? categoryFor(standard, payload.index) : null;
            return (
              <div key={id} className="rounded-xl border border-ink-700/70 bg-ink-850/40 p-4">
                <p className="text-[11px] font-bold tracking-widest text-mist-400">
                  {standard.shortName.toUpperCase()}
                </p>
                <p className="tnum mt-1 text-3xl font-bold" style={{ color: category?.color }}>
                  {payload.index ?? "—"}
                  <span className="ml-1 text-xs font-medium text-mist-400">
                    / {standard.scaleMax}
                  </span>
                </p>
                <p className="mt-0.5 text-[13px] font-semibold" style={{ color: category?.color }}>
                  {category?.label ?? "No data"}
                </p>
                <p className="mt-1.5 text-[11px] text-mist-400">{standard.authority}</p>
              </div>
            );
          })}
        </div>
        {snapshot.provider.usAqi !== null && (
          <p className="tnum mt-4 border-t border-ink-700/60 pt-3 text-[11px] leading-relaxed text-mist-400">
            Cross-check: Open-Meteo&apos;s own US AQI for this hour is{" "}
            <span className="font-semibold text-mist-300">{snapshot.provider.usAqi}</span>
            {snapshot.provider.europeanAqi !== null && (
              <>
                {" "}
                and its European AQI is{" "}
                <span className="font-semibold text-mist-300">{snapshot.provider.europeanAqi}</span>
              </>
            )}
            . Differences from the numbers above are expected and deliberate. This app applies the
            EPA NowCast weighting and the full 8- and 24-hour averaging windows rather than scoring a
            single instantaneous hour, and it uses the PM2.5 breakpoints from the EPA&apos;s February
            2024 revision, which set the 50-point boundary at 9.0 µg/m³ instead of the older
            12.0 µg/m³. On a low-PM day that revision alone moves the US AQI by several points.
          </p>
        )}
      </section>

      <StationPanel snapshot={snapshot} />

      <HealthSection snapshot={snapshot} />

      <TrendChart trend={snapshot.trend} />

      <PollutantGrid measures={snapshot.measures} />

      {snapshot.pollen && <PollenPanel pollen={snapshot.pollen} />}

      <section className="card p-5 sm:p-6">
        <h3 className="text-lg font-bold tracking-tight">Compare another city</h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          {featured.map((city) => (
            <li key={city.slug}>
              <Link
                href={`/aqi/${city.slug}`}
                className="inline-block rounded-lg border border-ink-700/70 bg-ink-850/50 px-3 py-1.5 text-[13px] text-mist-300 transition hover:border-sky-400/50 hover:text-mist-100"
              >
                {city.name}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/cities"
              className="inline-block rounded-lg border border-sky-400/40 bg-sky-400/10 px-3 py-1.5 text-[13px] font-semibold text-sky-300 transition hover:bg-sky-400/20"
            >
              All cities →
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
