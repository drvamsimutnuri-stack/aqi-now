"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Place } from "@/lib/openmeteo";

function describe(place: Place): string {
  return [place.name, place.admin1, place.country].filter(Boolean).join(", ");
}

export function LocationBar({ currentLabel }: { currentLabel: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"search" | "locate" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = query.trim();
    const controller = new AbortController();
    // All state changes happen inside the timer callback rather than in the
    // effect body, so a keystroke does not trigger a cascading render.
    const timer = setTimeout(async () => {
      if (term.length < 2) {
        setResults([]);
        setOpen(false);
        return;
      }
      setBusy("search");
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
        setError(null);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setError("Search failed. Try again.");
      } finally {
        setBusy(null);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function go(params: Record<string, string | null | undefined>) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
    setOpen(false);
    setQuery("");
    router.push(`/?${search.toString()}`);
  }

  function selectPlace(place: Place) {
    go({
      lat: place.latitude.toFixed(4),
      lon: place.longitude.toFixed(4),
      name: place.name,
      region: place.admin1,
      country: place.country,
    });
  }

  function locateMe() {
    if (!navigator.geolocation) {
      setError("This browser does not support location access.");
      return;
    }
    setBusy("locate");
    setError(null);

    async function applyCoords(coords: GeolocationCoordinates) {
      const lat = coords.latitude.toFixed(4);
      const lon = coords.longitude.toFixed(4);
      try {
        const res = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
        const data = await res.json();
        go({ lat, lon, name: data.place?.name, region: data.place?.region, country: data.place?.country });
      } catch {
        go({ lat, lon });
      } finally {
        setBusy(null);
      }
    }

    function fail(err: GeolocationPositionError) {
      setBusy(null);
      if (err.code === err.PERMISSION_DENIED) {
        setError("Location permission denied. Search for your city instead.");
      } else if (err.code === err.TIMEOUT) {
        setError("Locating timed out. Try again, or search for your city.");
      } else {
        setError("Could not get your location. Search for your city instead.");
      }
    }

    // Ask for a genuine GPS/wifi fix rather than accepting a cached, coarse
    // one: maximumAge 0 forbids a stale reading, and high accuracy is what
    // distinguishes your street from your city.
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => applyCoords(coords),
      (highAccuracyError) => {
        // Indoors or on desktop a high-accuracy fix can simply be unavailable,
        // so fall back to a coarse position rather than failing outright.
        if (highAccuracyError.code === highAccuracyError.PERMISSION_DENIED) {
          fail(highAccuracyError);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => applyCoords(coords),
          fail,
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 120000 },
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div ref={boxRef} className="relative flex-1">
          <span
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mist-400"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length && setOpen(true)}
            placeholder={`Search any city — currently showing ${currentLabel}`}
            aria-label="Search for a city"
            type="search"
            // The browser's own autofill dropdown would cover our results list.
            autoComplete="off"
            /*
             * This input always renders empty on both server and client, so any
             * mismatch here originates outside React: Chrome restores search
             * field values on reload, password managers and extensions inject
             * attributes. Suppressing is scoped to this one element and cannot
             * mask a genuine mismatch in our own markup.
             */
            suppressHydrationWarning
            className="w-full rounded-xl border border-ink-600/70 bg-ink-900/80 py-3 pl-10 pr-3 text-sm text-mist-100 placeholder:text-mist-400/80 focus:border-sky-400/70 focus:outline-none"
          />
          {busy === "search" && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-mist-400">
              searching…
            </span>
          )}

          {open && results.length > 0 && (
            <ul className="absolute z-50 mt-1.5 max-h-80 w-full overflow-auto rounded-xl border border-ink-600/70 bg-ink-900/98 py-1 shadow-2xl backdrop-blur-md">
              {results.map((place) => (
                <li key={`${place.id}-${place.latitude}`}>
                  <button
                    onClick={() => selectPlace(place)}
                    className="flex w-full items-baseline justify-between gap-3 px-3.5 py-2.5 text-left text-sm transition hover:bg-ink-800"
                  >
                    <span className="min-w-0 truncate">{describe(place)}</span>
                    {place.population ? (
                      <span className="tnum shrink-0 text-[11px] text-mist-400">
                        {(place.population / 1_000_000).toFixed(1)}M
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={locateMe}
          disabled={busy === "locate"}
          className="flex items-center justify-center gap-2 rounded-xl border border-sky-400/40 bg-sky-400/10 px-4 py-3 text-sm font-semibold text-sky-300 transition hover:bg-sky-400/20 disabled:opacity-60"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="3.2" />
            <path d="M12 2v3.2M12 18.8V22M2 12h3.2M18.8 12H22" strokeLinecap="round" />
            <circle cx="12" cy="12" r="8.4" opacity="0.5" />
          </svg>
          {busy === "locate" ? "Locating…" : "Use my location"}
        </button>
      </div>
      {error && <p className="text-xs text-amber-300">{error}</p>}
    </div>
  );
}
