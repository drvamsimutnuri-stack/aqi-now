import { pollenLevel, POLLENS } from "@/lib/pollutants";
import type { PollenReading } from "@/lib/snapshot";

export function PollenPanel({ pollen }: { pollen: PollenReading[] }) {
  const anyActive = pollen.some((p) => pollenLevel(p.key, p.value).label !== "None / very low");

  return (
    <section className="card p-5 sm:p-6">
      <h3 className="text-lg font-bold tracking-tight">Pollen</h3>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-mist-400">
        Airborne allergen counts in grains per cubic metre. Pollen is not part of any AQI, but it
        drives the same symptoms — and on a high-pollen, high-PM day the two compound each other,
        because particulates inflame the airways that pollen then irritates.
      </p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pollen.map((reading) => {
          const info = POLLENS[reading.key];
          const level = pollenLevel(reading.key, reading.value);
          return (
            <li key={reading.key} className="rounded-xl border border-ink-700/70 bg-ink-850/40 p-3.5">
              <div className="flex items-baseline justify-between gap-2">
                <h4 className="text-sm font-bold">{info.name}</h4>
                <span className="tnum text-sm font-bold" style={{ color: level.color }}>
                  {reading.value.toFixed(1)}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-700/70">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(2, level.fraction * 100)}%`, backgroundColor: level.color }}
                />
              </div>
              <p className="mt-1.5 text-[11px] font-semibold" style={{ color: level.color }}>
                {level.label}
                {reading.peakToday !== null && (
                  <span className="tnum font-normal text-mist-400">
                    {" "}
                    · peak today {reading.peakToday.toFixed(0)} grains/m³
                  </span>
                )}
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-mist-400">
                {info.season}. {info.notes}
              </p>
            </li>
          );
        })}
      </ul>

      {anyActive && (
        <p className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/5 p-3 text-[12px] leading-relaxed text-amber-100/90">
          Pollen is in the air. If you get hay fever: keep windows shut in the morning when counts
          peak, shower and change after being outdoors, and start antihistamines before symptoms
          build rather than after.
        </p>
      )}
    </section>
  );
}
