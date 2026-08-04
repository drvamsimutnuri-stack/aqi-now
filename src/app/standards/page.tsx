import type { Metadata } from "next";
import { averagingLabel } from "@/lib/aqi";
import { formatConcentration, unitLabel } from "@/lib/format";
import { HEALTH_BANDS } from "@/lib/health";
import { MEASURES } from "@/lib/pollutants";
import { STANDARDS, STANDARD_ORDER } from "@/lib/standards";

export const metadata: Metadata = {
  title: "How the air quality indices are calculated",
  description:
    "The US EPA AQI, European Air Quality Index and Indian CPCB National AQI compared: breakpoint tables, averaging periods, the EPA NowCast algorithm, and why the same air scores differently on each scale.",
};

export default function StandardsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          How the numbers are calculated
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-mist-400">
          Nothing here is a black box. Every index on this site is computed in the browser-visible
          source from published breakpoint tables. This page is the whole method.
        </p>
      </header>

      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-bold tracking-tight">The three-step recipe</h2>
        <ol className="mt-3 space-y-3">
          {[
            {
              title: "Average each pollutant over the window its standard requires",
              body: "You cannot score PM2.5 the way you score ozone. The EPA defines PM on a 24-hour average, ozone on 8 hours, and NO₂ and SO₂ on 1 hour, because that is the exposure duration each pollutant's health evidence is based on. We hold 48 hours of hourly model output to build these windows properly, and require 75 % data completeness before reporting an average.",
            },
            {
              title: "Convert to the unit the table is written in",
              body: "The source data is in µg/m³ for everything. The EPA tables are in ppm and ppb, and India's CO table is in mg/m³. Gas conversion uses the ideal-gas molar volume of 24.45 L/mol at 25 °C and 1 atm, then the value is truncated to the decimal places the standard specifies — truncation, not rounding, because that is what the EPA method says.",
            },
            {
              title: "Interpolate inside the breakpoint row, then take the worst pollutant",
              body: "Each averaged concentration lands in one row of the table and is linearly interpolated between that row's index endpoints. The overall AQI is the highest of the sub-indices, and the pollutant that produced it is the 'dominant' pollutant. Nothing is averaged across pollutants — an index is a worst-case statement, by design.",
            },
          ].map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="tnum mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-sky-400/15 text-xs font-bold text-sky-300">
                {i + 1}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-mist-100">{step.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-mist-300">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-bold tracking-tight">The NowCast, and why &ldquo;instant&rdquo; AQI is subtle</h2>
        <div className="mt-3 space-y-3 text-[13px] leading-relaxed text-mist-300">
          <p>
            There is a real tension in asking for an instant AQI. The health thresholds behind the
            index are 24-hour averages, so a strict reading of the standard means you cannot know
            today&apos;s AQI until tomorrow. But if you just score the latest hour as though it were
            a full day, the number becomes wildly jumpy and overstates brief spikes.
          </p>
          <p>
            The EPA&apos;s answer, which this app implements, is the <strong>NowCast</strong>: a
            weighted average of the last 12 hours where the weight given to older hours shrinks as
            conditions become less stable. The weight factor is{" "}
            <code className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[12px]">
              w = 1 − (max − min) / max
            </code>{" "}
            over the 12-hour window, floored at 0.5, and hour <em>i</em> back gets weight{" "}
            <code className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[12px]">wⁱ</code>.
          </p>
          <p>
            In steady air, w approaches 1 and the NowCast behaves like a plain 12-hour mean. When
            smoke arrives and concentrations swing, w drops to its 0.5 floor and the most recent hour
            dominates — so the number moves within an hour instead of being diluted across a day.
            This is what AirNow publishes as the current AQI, and it is why our value can differ
            slightly from providers that simply score the latest hourly concentration.
          </p>
        </div>
      </section>

      {STANDARD_ORDER.map((id) => {
        const standard = STANDARDS[id];
        const edges = [0, ...standard.categories.map((c) => c.max)];
        return (
          <section key={id} className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-xl font-bold tracking-tight">{standard.name}</h2>
              <span className="rounded bg-ink-800 px-2 py-0.5 text-[10px] font-bold tracking-wide text-mist-400">
                0–{standard.scaleMax}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-mist-400">
              {standard.authority} · {standard.region}
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-mist-200">
              {standard.description}
            </p>

            <h3 className="mt-5 text-[11px] font-bold tracking-widest text-mist-400">CATEGORIES</h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {standard.categories.map((c, i) => (
                <li
                  key={c.label}
                  className="flex items-center gap-2.5 rounded-lg border border-ink-700/70 bg-ink-850/40 px-3 py-2"
                >
                  <span
                    className="tnum shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold"
                    style={{ backgroundColor: c.color, color: c.onColor }}
                  >
                    {edges[i]}–{c.max}
                  </span>
                  <span className="text-[13px] text-mist-200">{c.label}</span>
                </li>
              ))}
            </ul>

            <h3 className="mt-5 text-[11px] font-bold tracking-widest text-mist-400">
              BREAKPOINT TABLE
            </h3>
            <div className="scroll-thin mt-2 overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-ink-700/60 text-left text-[10px] tracking-widest text-mist-400">
                    <th className="py-2 pr-3 font-bold">POLLUTANT</th>
                    <th className="py-2 pr-3 font-bold">AVERAGING</th>
                    <th className="py-2 pr-3 font-bold">UNIT</th>
                    <th className="py-2 font-bold">
                      CONCENTRATION → INDEX
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {standard.scales.map((scale) => (
                    <tr key={scale.pollutant} className="border-b border-ink-800/70 align-top last:border-0">
                      <td className="py-2.5 pr-3 font-semibold" style={{ color: MEASURES[scale.pollutant].accent }}>
                        {MEASURES[scale.pollutant].formula}
                      </td>
                      <td className="py-2.5 pr-3 text-mist-400">{averagingLabel(scale.averaging)}</td>
                      <td className="py-2.5 pr-3 text-mist-400">{unitLabel(scale.unit)}</td>
                      <td className="tnum py-2.5">
                        <div className="flex flex-wrap gap-1.5">
                          {scale.breakpoints.map((bp) => (
                            <span
                              key={bp.iLow}
                              className="rounded border border-ink-700/70 bg-ink-850/50 px-1.5 py-0.5 text-[11px] text-mist-300"
                            >
                              {formatConcentration(bp.cLow, scale.unit)}–
                              {formatConcentration(bp.cHigh, scale.unit)}
                              <span className="mx-1 text-mist-400/60">→</span>
                              {bp.iLow}–{bp.iHigh}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-bold tracking-tight">Health guidance by band</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-mist-400">
          Guidance on this site is keyed to the six US EPA bands, the most widely recognised set,
          and drawn from EPA AirNow activity guidance and the WHO Air Quality Guidelines.
        </p>
        <div className="mt-4 space-y-3">
          {HEALTH_BANDS.map((band, i) => (
            <div key={band.label} className="rounded-xl border border-ink-700/70 bg-ink-850/40 p-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span
                  className="tnum rounded px-2 py-0.5 text-[11px] font-bold"
                  style={{
                    backgroundColor: STANDARDS.us.categories[i].color,
                    color: STANDARDS.us.categories[i].onColor,
                  }}
                >
                  {[0, ...STANDARDS.us.categories.map((c) => c.max)][i]}–
                  {STANDARDS.us.categories[i].max}
                </span>
                <h3 className="text-sm font-bold">{band.label}</h3>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-mist-200">{band.headline}</p>
              <dl className="mt-2.5 grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2">
                <div>
                  <dt className="text-[10px] font-bold tracking-widest text-mist-400">EXERCISE</dt>
                  <dd className="leading-relaxed text-mist-300">{band.exercise}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold tracking-widest text-mist-400">MASKS</dt>
                  <dd className="leading-relaxed text-mist-300">{band.mask}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
