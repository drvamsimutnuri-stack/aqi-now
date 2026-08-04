import { outdoorWindows } from "@/lib/exposure";
import { formatLocalHour } from "@/lib/format";
import { categoryFor, STANDARDS } from "@/lib/standards";
import type { TrendPoint } from "@/lib/snapshot";

/**
 * Turns "avoid outdoor exercise" into "go at 06:00 rather than 18:00", which is
 * advice someone can actually follow without giving up exercise altogether.
 */
export function BestHours({ trend }: { trend: TrendPoint[] }) {
  const windows = outdoorWindows(trend);
  if (!windows) return null;

  const flat = windows.spread < 15;

  return (
    <section className="card p-5 sm:p-6">
      <h3 className="text-lg font-bold tracking-tight">When to go outside</h3>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-mist-400">
        {flat
          ? "Air quality is fairly flat over the next 24 hours, so timing will not change your dose much. Location and intensity matter more than the clock today."
          : "Air quality swings meaningfully over the next 24 hours. Shifting when you exercise is the cheapest way to cut your dose — no mask, no gym membership, just a different hour."}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/5 p-4">
          <h4 className="text-[11px] font-bold tracking-widest text-emerald-300">
            CLEANEST HOURS AHEAD
          </h4>
          <ul className="mt-2 space-y-1.5">
            {windows.best.map((hour) => {
              const category = categoryFor(STANDARDS.us, hour.value);
              return (
                <li key={hour.time} className="tnum flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="text-mist-200">{formatLocalHour(hour.time)}</span>
                  <span className="font-bold" style={{ color: category.color }}>
                    {hour.value}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-xl border border-red-400/25 bg-red-400/5 p-4">
          <h4 className="text-[11px] font-bold tracking-widest text-red-300">
            WORST HOURS AHEAD
          </h4>
          <ul className="mt-2 space-y-1.5">
            {windows.worst.map((hour) => {
              const category = categoryFor(STANDARDS.us, hour.value);
              return (
                <li key={hour.time} className="tnum flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="text-mist-200">{formatLocalHour(hour.time)}</span>
                  <span className="font-bold" style={{ color: category.color }}>
                    {hour.value}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-mist-400">
        Typical daily rhythms: ozone builds through the afternoon in sunlight and collapses
        overnight, NO₂ peaks in rush hour, and particulates often peak in the evening and early
        morning when cool air traps them near the ground.
      </p>
    </section>
  );
}
