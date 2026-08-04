"use client";

import { useHealthProfile } from "./HealthProfileContext";
import { MEASURES } from "@/lib/pollutants";
import { RISK_PROFILES } from "@/lib/profiles";
import type { PollutantKey } from "@/lib/standards";

interface Props {
  usAqi: number | null;
  dominant: PollutantKey | null;
}

/** Verdict wording for how the current level sits against the reader's threshold. */
function verdict(usAqi: number, threshold: number) {
  const margin = usAqi - threshold;
  if (margin >= 50)
    return {
      tone: "#ef4444",
      title: "Well past your threshold",
      body: "This is materially risky for you, not just unpleasant. Treat outdoor time as something to justify rather than something to shorten.",
    };
  if (margin >= 0)
    return {
      tone: "#f97316",
      title: "Above your threshold",
      body: "You are in the range where people in your situation start getting symptoms. Act now rather than waiting to feel it.",
    };
  if (margin >= -20)
    return {
      tone: "#eab308",
      title: "Close to your threshold",
      body: "Fine for now, but there is not much headroom. Worth checking the forecast before committing to a long stretch outside.",
    };
  return {
    tone: "#22c55e",
    title: "Comfortably below your threshold",
    body: "Nothing here needs you to change your plans today.",
  };
}

export function PersonalVerdict({ usAqi, dominant }: Props) {
  const { profiles, selected, toggle, clear, threshold } = useHealthProfile();

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold tracking-tight">Make this about you</h3>
        {selected.length > 0 && (
          <button
            onClick={clear}
            className="text-[11px] font-semibold text-mist-400 transition hover:text-mist-100"
          >
            Clear selection
          </button>
        )}
      </div>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-mist-400">
        Official guidance is written for a whole population, but the level at which you personally
        should change plans varies enormously. Tell the app who is breathing this and every threshold
        below adjusts. Stored only in this browser — nothing is sent anywhere.
      </p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {RISK_PROFILES.map((profile) => {
          const isOn = selected.includes(profile.key);
          return (
            <li key={profile.key}>
              <button
                onClick={() => toggle(profile.key)}
                aria-pressed={isOn}
                className={`rounded-lg border px-3 py-1.5 text-[13px] transition ${
                  isOn
                    ? "border-sky-400/60 bg-sky-400/15 font-semibold text-sky-200"
                    : "border-ink-700/70 bg-ink-850/50 text-mist-300 hover:border-ink-600 hover:text-mist-100"
                }`}
              >
                {profile.label}
              </button>
            </li>
          );
        })}
      </ul>

      {profiles.length > 0 && usAqi !== null && (
        <div className="mt-5 space-y-4 border-t border-ink-700/60 pt-5">
          {(() => {
            const v = verdict(usAqi, threshold);
            return (
              <div className="rounded-xl border p-4" style={{ borderColor: `${v.tone}55`, backgroundColor: `${v.tone}0f` }}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="text-base font-bold" style={{ color: v.tone }}>
                    {v.title}
                  </h4>
                  <span className="tnum text-[11px] text-mist-400">
                    Now {usAqi} · your threshold {threshold}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-mist-200">{v.body}</p>
              </div>
            );
          })()}

          {profiles.map((profile) => {
            const dominantIsKey = dominant ? profile.keyPollutants.includes(dominant) : false;
            return (
              <div key={profile.key}>
                <h4 className="flex flex-wrap items-baseline gap-2 text-sm font-bold">
                  {profile.label}
                  {dominantIsKey && dominant && (
                    <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-amber-300">
                      TODAY&apos;S MAIN POLLUTANT AFFECTS YOU DIRECTLY: {MEASURES[dominant].formula}
                    </span>
                  )}
                </h4>
                <p className="mt-1.5 text-[13px] leading-relaxed text-mist-300">{profile.why}</p>
                <ul className="mt-2 space-y-1.5">
                  {profile.advice.map((item) => (
                    <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-mist-200">
                      <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-sky-400/80" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          <p className="text-[11px] leading-relaxed text-mist-400">
            General information based on published guidance, not medical advice. It does not replace
            your own action plan or your clinician&apos;s instructions.
          </p>
        </div>
      )}
    </section>
  );
}
