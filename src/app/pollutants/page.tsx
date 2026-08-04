import type { Metadata } from "next";
import { MEASURES, MEASURE_ORDER, POLLENS, POLLEN_ORDER } from "@/lib/pollutants";

export const metadata: Metadata = {
  title: "Every air pollutant, and what it does to you",
  description:
    "Reference guide to PM2.5, PM10, ozone, nitrogen dioxide, sulphur dioxide, carbon monoxide, ammonia, dust, aerosol optical depth, UV and methane: sources, short-term and long-term health effects, WHO guideline levels and who is most at risk.",
};

function Bullets({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-[11px] font-bold tracking-widest text-mist-400">{title}</h3>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-mist-300">
            <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-mist-400/70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PollutantsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          The pollutants, and what they do to you
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mist-400">
          An air quality index compresses all of this into one number. That number is useful for a
          quick decision and useless for understanding what you are actually breathing — the
          difference between an ozone day and a woodsmoke day changes what helps. Here is each
          measure on its own terms.
        </p>
      </header>

      <nav aria-label="Jump to pollutant" className="card p-4">
        <ul className="flex flex-wrap gap-2">
          {MEASURE_ORDER.map((key) => (
            <li key={key}>
              <a
                href={`#${key}`}
                className="inline-block rounded-lg border border-ink-700/70 bg-ink-850/50 px-2.5 py-1.5 text-[13px] transition hover:border-sky-400/50"
                style={{ color: MEASURES[key].accent }}
              >
                {MEASURES[key].formula}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {MEASURE_ORDER.map((key) => {
        const measure = MEASURES[key];
        return (
          <section key={key} id={key} className="card scroll-mt-20 p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-xl font-bold tracking-tight" style={{ color: measure.accent }}>
                {measure.formula}
              </h2>
              <p className="text-sm text-mist-300">{measure.name}</p>
              <span className="rounded bg-ink-800 px-2 py-0.5 text-[10px] font-bold tracking-wide text-mist-400">
                {measure.indexForming ? "SCORED IN AN AQI" : "CONTEXT ONLY"}
              </span>
            </div>

            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-mist-200">{measure.what}</p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Bullets title="WHERE IT COMES FROM" items={measure.sources} />
              <Bullets title="WHO FEELS IT FIRST" items={measure.sensitive} />
              <Bullets title="SHORT-TERM EFFECTS (HOURS TO DAYS)" items={measure.shortTerm} />
              <Bullets title="LONG-TERM EFFECTS (MONTHS TO YEARS)" items={measure.longTerm} />
            </div>

            {measure.who.length > 0 && (
              <div className="mt-5 border-t border-ink-700/60 pt-4">
                <h3 className="text-[11px] font-bold tracking-widest text-mist-400">
                  WHO 2021 AIR QUALITY GUIDELINE
                </h3>
                <ul className="tnum mt-2 flex flex-wrap gap-2">
                  {measure.who.map((g) => (
                    <li
                      key={g.label}
                      className="rounded-lg border border-ink-700/70 bg-ink-850/60 px-3 py-1.5 text-[13px] text-mist-300"
                    >
                      {g.label}{" "}
                      <span className="font-bold text-mist-100">
                        {g.value.toLocaleString("en-US")}
                      </span>{" "}
                      {g.unit}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        );
      })}

      <section className="card p-5 sm:p-6">
        <h2 className="text-xl font-bold tracking-tight">Pollen</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mist-300">
          Biological rather than chemical, and absent from every major AQI, but a leading cause of
          the symptoms people blame on pollution. Counts are grains per cubic metre; the thresholds
          at which people react vary by species, which is why grass at 20 grains/m³ can feel worse
          than birch at 80.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {POLLEN_ORDER.map((key) => {
            const p = POLLENS[key];
            return (
              <li key={key} className="rounded-xl border border-ink-700/70 bg-ink-850/40 p-4">
                <h3 className="text-sm font-bold">{p.name}</h3>
                <p className="mt-0.5 text-[11px] text-mist-400">{p.season}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-mist-300">{p.notes}</p>
                <p className="tnum mt-2 text-[11px] text-mist-400">
                  Low from {p.thresholds[0]} · moderate from {p.thresholds[1]} · high from{" "}
                  {p.thresholds[2]} grains/m³
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
