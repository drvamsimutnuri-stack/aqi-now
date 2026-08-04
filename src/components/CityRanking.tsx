"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MEASURES } from "@/lib/pollutants";
import { categoryFor, STANDARDS, STANDARD_ORDER, type StandardId } from "@/lib/standards";
import type { RankedCity } from "@/lib/ranking";

type SortKey = StandardId | "name";

export function CityRanking({ cities }: { cities: RankedCity[] }) {
  const [sort, setSort] = useState<SortKey>("us");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = term
      ? cities.filter(
          (c) => c.name.toLowerCase().includes(term) || c.country.toLowerCase().includes(term),
        )
      : cities;

    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      const av = a.indices[sort];
      const bv = b.indices[sort];
      if (av === null) return 1;
      if (bv === null) return -1;
      return bv - av;
    });
  }, [cities, sort, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by city or country"
          aria-label="Filter cities"
          className="w-full rounded-xl border border-ink-600/70 bg-ink-900/80 px-3.5 py-2.5 text-sm placeholder:text-mist-400/80 focus:border-sky-400/70 focus:outline-none sm:max-w-xs"
        />
        <div className="flex items-center gap-1 rounded-lg border border-ink-700/70 bg-ink-900/70 p-1">
          <span className="px-2 text-[11px] font-semibold text-mist-400">SORT</span>
          {(["us", "eu", "in", "name"] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              aria-pressed={sort === key}
              className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition ${
                sort === key ? "bg-sky-400/15 text-sky-300" : "text-mist-400 hover:text-mist-100"
              }`}
            >
              {key === "name" ? "A–Z" : STANDARDS[key].shortName}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[42rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-700/60 text-left text-[11px] tracking-widest text-mist-400">
                <th className="px-4 py-3 font-bold">#</th>
                <th className="px-4 py-3 font-bold">CITY</th>
                {STANDARD_ORDER.map((id) => (
                  <th key={id} className="px-4 py-3 text-right font-bold">
                    {STANDARDS[id].shortName.toUpperCase()}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-bold">PM2.5</th>
                <th className="px-4 py-3 font-bold">DRIVEN BY</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((city, i) => {
                return (
                  <tr
                    key={city.slug}
                    className="border-b border-ink-800/70 transition last:border-0 hover:bg-ink-850/50"
                  >
                    <td className="tnum px-4 py-2.5 text-[13px] text-mist-400">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <Link href={`/aqi/${city.slug}`} className="group block">
                        <span className="font-semibold text-mist-100 group-hover:text-sky-300">
                          {city.name}
                        </span>
                        <span className="block text-[11px] text-mist-400">{city.country}</span>
                      </Link>
                    </td>
                    {STANDARD_ORDER.map((id) => {
                      const value = city.indices[id];
                      const c = value !== null ? categoryFor(STANDARDS[id], value) : null;
                      return (
                        <td key={id} className="tnum px-4 py-2.5 text-right">
                          <span
                            className="inline-block min-w-9 rounded-md px-2 py-0.5 text-[13px] font-bold"
                            style={{
                              color: c?.onColor,
                              backgroundColor: c?.color ?? "transparent",
                            }}
                          >
                            {value ?? "—"}
                          </span>
                        </td>
                      );
                    })}
                    <td className="tnum px-4 py-2.5 text-right text-[13px] text-mist-300">
                      {city.pm2_5 !== null ? city.pm2_5.toFixed(1) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-mist-400">
                      {city.dominant ? MEASURES[city.dominant].formula : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <p className="p-6 text-center text-sm text-mist-400">No cities match that filter.</p>
        )}
      </div>
      <p className="text-[11px] leading-relaxed text-mist-400">
        {scoredSummary(rows)} Colour shows each standard&apos;s own category, which is why a city can
        look yellow on one scale and red on another. Click a city for the full breakdown.
      </p>
    </div>
  );
}

function scoredSummary(rows: RankedCity[]): string {
  const scored = rows.filter((r) => r.indices.us !== null).length;
  return `${scored} of ${rows.length} cities scored this hour.`;
}
