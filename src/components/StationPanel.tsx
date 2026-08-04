import { MEASURES } from "@/lib/pollutants";
import { formatMeasure } from "@/lib/format";
import type { MeasureReading, Snapshot } from "@/lib/snapshot";

function agreement(deltaPct: number | null) {
  if (deltaPct === null) return { label: "no comparison", tone: "#94a3b8" };
  const size = Math.abs(deltaPct);
  if (size <= 20) return { label: "model agrees", tone: "#34d399" };
  if (size <= 50) return { label: "model differs", tone: "#fbbf24" };
  return { label: "model well off", tone: "#f87171" };
}

function age(minutes: number) {
  if (minutes < 90) return `${Math.round(minutes)} min old`;
  return `${(minutes / 60).toFixed(1)} h old`;
}

/**
 * Where a reference monitor is nearby, show what it actually measured next to
 * what the model estimated. The headline AQI stays model-derived — see the note
 * in the panel — so this is a provenance and confidence tool rather than a
 * second, competing number.
 */
export function StationPanel({ snapshot }: { snapshot: Snapshot }) {
  const measured = snapshot.measures.filter(
    (m): m is MeasureReading & { measured: NonNullable<MeasureReading["measured"]> } =>
      m.measured !== null,
  );

  if (!snapshot.stations || measured.length === 0) return null;

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold tracking-tight">Measured at the nearest monitors</h3>
        <span className="rounded bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-300">
          GROUND TRUTH
        </span>
      </div>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-mist-400">
        Everything else on this page comes from the CAMS model, which is a simulation on a roughly
        11 km grid. These are readings from official reference monitors via OpenAQ — real
        instruments at known locations. Where the two disagree, the monitor is the better guide to
        the air immediately around it.
      </p>

      <div className="mt-4 overflow-x-auto scroll-thin">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="border-b border-ink-700/60 text-[11px] font-bold tracking-widest text-mist-400">
              <th className="py-2 pr-3 font-bold">POLLUTANT</th>
              <th className="py-2 pr-3 text-right font-bold">MEASURED</th>
              <th className="py-2 pr-3 text-right font-bold">MODELLED</th>
              <th className="py-2 pr-3 font-bold">AGREEMENT</th>
              <th className="py-2 font-bold">STATION</th>
            </tr>
          </thead>
          <tbody>
            {measured.map((m) => {
              const meta = MEASURES[m.key];
              const verdict = agreement(m.measured.deltaPct);
              return (
                <tr key={m.key} className="border-b border-ink-800/60 last:border-0 align-top">
                  <td className="py-2.5 pr-3">
                    <span className="font-semibold" style={{ color: meta.accent }}>
                      {meta.formula}
                    </span>
                  </td>
                  <td className="tnum py-2.5 pr-3 text-right font-bold text-mist-100">
                    {formatMeasure(m.measured.value, meta.unit)}
                    {m.measured.rawUnit.toLowerCase() !== meta.unit.toLowerCase() && (
                      <span
                        className="ml-1 text-[10px] font-medium text-mist-400"
                        title={`Reported by the station as ${m.measured.rawValue} ${m.measured.rawUnit}`}
                      >
                        conv.
                      </span>
                    )}
                  </td>
                  <td className="tnum py-2.5 pr-3 text-right text-mist-300">
                    {m.value === null ? "—" : formatMeasure(m.value, meta.unit)}
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className="text-[12px] font-semibold" style={{ color: verdict.tone }}>
                      {verdict.label}
                    </span>
                    {m.measured.deltaPct !== null && (
                      <span className="tnum ml-1.5 text-[11px] text-mist-400">
                        {m.measured.deltaPct > 0 ? "+" : ""}
                        {Math.round(m.measured.deltaPct)}%
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-[12px] text-mist-300">
                    {m.measured.stationName}
                    <span className="block text-[11px] text-mist-400">
                      {m.measured.distanceKm !== null && `${m.measured.distanceKm.toFixed(1)} km · `}
                      {age(m.measured.ageMinutes)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-mist-400">
        The headline AQI above stays model-derived on purpose: the index needs 24-hour averages,
        and these are single latest hours, so blending them would produce a number belonging to
        neither source. Stations contributing:{" "}
        {snapshot.stations
          .map(
            (s) =>
              `${s.name}${s.provider ? ` (${s.provider})` : ""}${
                s.distanceKm !== null ? `, ${s.distanceKm.toFixed(1)} km` : ""
              }`,
          )
          .join("; ")}
        .
      </p>
    </section>
  );
}
