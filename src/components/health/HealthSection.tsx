import { BestHours } from "./BestHours";
import { BodyImpact } from "./BodyImpact";
import { ExposurePanel } from "./ExposurePanel";
import { HealthProfileProvider } from "./HealthProfileContext";
import { PersonalVerdict } from "./PersonalVerdict";
import { HealthPanel } from "../HealthPanel";
import { bandForUsAqi } from "@/lib/health";
import { MEASURES, type MeasureKey } from "@/lib/pollutants";
import type { Snapshot } from "@/lib/snapshot";

/**
 * Measures worth naming as a cause right now: either above the WHO 24-hour
 * guideline, or already scoring above 50 on any of the three indices.
 */
function elevatedPollutants(snapshot: Snapshot): MeasureKey[] {
  const elevated = new Set<MeasureKey>();

  for (const measure of snapshot.measures) {
    if (measure.whoRatio !== null && measure.whoRatio > 1) {
      elevated.add(measure.key as MeasureKey);
    }
  }

  for (const payload of Object.values(snapshot.indices)) {
    for (const sub of payload.subIndices) {
      if (sub.index > 50) elevated.add(sub.pollutant);
    }
  }

  // Always name the pollutant setting the headline, even in clean air.
  const dominant = snapshot.indices.us.dominant ?? snapshot.indices.in.dominant;
  if (dominant) elevated.add(dominant);

  return [...elevated].filter((key) => key in MEASURES);
}

export function HealthSection({ snapshot }: { snapshot: Snapshot }) {
  const usAqi = snapshot.indices.us.index;
  const band = usAqi !== null ? bandForUsAqi(usAqi) : null;
  const uv = snapshot.measures.find((m) => m.key === "uv_index")?.value ?? null;
  const pm25 = snapshot.measures.find((m) => m.key === "pm2_5");
  const dominant = snapshot.indices.us.dominant ?? snapshot.indices.in.dominant;

  return (
    <HealthProfileProvider>
      <div className="space-y-6">
        <HealthPanel
          usAqi={usAqi}
          dominant={dominant}
          cigarettesPerDay={snapshot.cigarettesPerDay}
          uvIndex={uv}
        />

        <PersonalVerdict usAqi={usAqi} dominant={dominant} />

        {band && (
          <BodyImpact
            band={band.level}
            bandLabel={band.label}
            elevated={elevatedPollutants(snapshot)}
          />
        )}

        <ExposurePanel pm25Now={pm25?.value ?? null} pm25Mean={pm25?.mean24h ?? null} />

        <BestHours trend={snapshot.trend} />
      </div>
    </HealthProfileProvider>
  );
}
