import { bandForUsAqi, uvAdvice } from "@/lib/health";
import { MEASURES } from "@/lib/pollutants";
import type { PollutantKey } from "@/lib/standards";

interface Props {
  usAqi: number | null;
  dominant: PollutantKey | null;
  cigarettesPerDay: number | null;
  uvIndex: number | null;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-t border-ink-700/60 py-2.5 sm:flex-row sm:gap-4">
      <dt className="shrink-0 text-[11px] font-bold tracking-widest text-mist-400 sm:w-28 sm:pt-0.5">
        {label.toUpperCase()}
      </dt>
      <dd className="text-[13px] leading-relaxed text-mist-300">{value}</dd>
    </div>
  );
}

export function HealthPanel({ usAqi, dominant, cigarettesPerDay, uvIndex }: Props) {
  if (usAqi === null) {
    return (
      <section className="card p-5 sm:p-6">
        <h3 className="text-lg font-bold tracking-tight">Health guidance</h3>
        <p className="mt-2 text-sm text-mist-400">
          Not enough valid data to give guidance for this location right now.
        </p>
      </section>
    );
  }

  const band = bandForUsAqi(usAqi);
  const dominantMeasure = dominant ? MEASURES[dominant] : null;
  const uv = uvIndex !== null ? uvAdvice(uvIndex) : null;

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-ink-700/60 p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="text-lg font-bold tracking-tight">What this air does to you</h3>
          <span className="rounded-full bg-ink-800 px-2.5 py-1 text-[11px] font-semibold text-mist-300">
            Band {band.level + 1} of 6 · {band.label}
          </span>
        </div>
        <p className="mt-2 text-base leading-relaxed text-mist-100">{band.headline}</p>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2 lg:gap-8">
        <div className="space-y-4">
          <div>
            <h4 className="text-[11px] font-bold tracking-widest text-mist-400">
              MOST PEOPLE
            </h4>
            <p className="mt-1.5 text-[13px] leading-relaxed text-mist-300">{band.everyone}</p>
          </div>
          <div>
            <h4 className="text-[11px] font-bold tracking-widest text-amber-300/90">
              CHILDREN, OVER-65s, ASTHMA, HEART &amp; LUNG DISEASE, PREGNANCY
            </h4>
            <p className="mt-1.5 text-[13px] leading-relaxed text-mist-300">{band.sensitive}</p>
          </div>

          <dl className="mt-1">
            <Row label="Exercise" value={band.exercise} />
            <Row label="Masks" value={band.mask} />
            <Row label="Windows" value={band.ventilation} />
            {uv && (
              <Row label="Sun / UV" value={`UV index ${uvIndex!.toFixed(1)} — ${uv.label}. ${uv.advice}`} />
            )}
          </dl>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-ink-700/70 bg-ink-850/50 p-4">
            <h4 className="text-[11px] font-bold tracking-widest text-mist-400">
              WHAT TO DO NOW
            </h4>
            <ol className="mt-2.5 space-y-2">
              {band.actions.map((action, i) => (
                <li key={action} className="flex gap-2.5 text-[13px] leading-relaxed text-mist-200">
                  <span className="tnum mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded bg-sky-400/15 text-[10px] font-bold text-sky-300" style={{ height: "1.125rem", width: "1.125rem" }}>
                    {i + 1}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ol>
          </div>

          {cigarettesPerDay !== null && (
            <div className="rounded-xl border border-ink-700/70 bg-ink-850/50 p-4">
              <h4 className="text-[11px] font-bold tracking-widest text-mist-400">
                CIGARETTE EQUIVALENT
              </h4>
              <p className="tnum mt-1.5 text-2xl font-bold text-mist-100">
                {cigarettesPerDay < 0.1 ? "<0.1" : cigarettesPerDay.toFixed(1)}
                <span className="ml-1.5 text-sm font-medium text-mist-400">
                  cigarettes / day
                </span>
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-mist-400">
                Breathing the last 24 hours of PM2.5 here is roughly equivalent to this many
                cigarettes, using the Berkeley Earth equivalence of one cigarette per 22 µg/m³ over
                a day. It compares particulate dose only — it says nothing about nicotine or the
                other 7,000 compounds in tobacco smoke.
              </p>
            </div>
          )}

          {dominantMeasure && (
            <div className="rounded-xl border border-ink-700/70 bg-ink-850/50 p-4">
              <h4 className="text-[11px] font-bold tracking-widest text-mist-400">
                TODAY&apos;S MAIN PROBLEM: {dominantMeasure.formula}
              </h4>
              <p className="mt-1.5 text-[13px] leading-relaxed text-mist-300">
                {dominantMeasure.what}
              </p>
              <ul className="mt-2.5 space-y-1">
                {dominantMeasure.shortTerm.slice(0, 3).map((effect) => (
                  <li key={effect} className="flex gap-2 text-[13px] leading-relaxed text-mist-300">
                    <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-mist-400/70" />
                    <span>{effect}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
