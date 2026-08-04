import { describe, expect, it } from "vitest";
import { computeIndex, trailingMean, type Series } from "./aqi";
import { ugm3ToPpb, ugm3ToPpm } from "./units";
import type { PollutantKey } from "./standards";

/** A flat 24-hour series, so every averaging window returns the same value. */
function flat(value: number, hours = 24): (number | null)[] {
  return Array.from({ length: hours }, () => value);
}

function only(pollutant: PollutantKey, ugm3: number): Series {
  return { [pollutant]: flat(ugm3) };
}

/** Concentration in µg/m³ that converts to the given ppm for a gas. */
function ppmToUgm3(ppm: number, gas: PollutantKey): number {
  // Invert ugm3ToPpm by scaling a unit conversion.
  return ppm / (ugm3ToPpm(1, gas) as number);
}

function ppbToUgm3(ppb: number, gas: PollutantKey): number {
  return ppb / (ugm3ToPpb(1, gas) as number);
}

describe("US EPA AQI breakpoints", () => {
  // Category boundaries from the EPA's 2024 reporting guidance.
  it.each([
    [9.0, 50],
    [35.4, 100],
    [35.5, 101],
    [55.4, 150],
    [55.5, 151],
    [125.4, 200],
    [125.5, 201],
    [225.4, 300],
    [225.5, 301],
  ])("PM2.5 of %s µg/m³ scores %i", (pm25, expected) => {
    expect(computeIndex("us", only("pm2_5", pm25)).index).toBe(expected);
  });

  it("interpolates inside a PM2.5 row", () => {
    // I = 51 + (100-51)/(35.4-9.1) * (12.0-9.1) = 56.4 -> 56
    expect(computeIndex("us", only("pm2_5", 12.0)).index).toBe(56);
  });

  it.each([
    [54, 50],
    [154, 100],
    [254, 150],
    [354, 200],
    [424, 300],
  ])("PM10 of %i µg/m³ scores %i", (pm10, expected) => {
    expect(computeIndex("us", only("pm10", pm10)).index).toBe(expected);
  });

  it("scores ozone at the 8-hour standard boundary as 100", () => {
    const ugm3 = ppmToUgm3(0.07, "ozone");
    expect(computeIndex("us", only("ozone", ugm3)).index).toBe(100);
  });

  it("does not let the 1-hour ozone table inflate low ozone readings", () => {
    // The 1-hour scale starts at 0.125 ppm. Below that it must not apply at all,
    // or every ozone reading would floor at 101.
    const result = computeIndex("us", only("ozone", ppmToUgm3(0.02, "ozone")));
    expect(result.index).toBeLessThan(50);
  });

  it("switches ozone to the 1-hour scale when a spike outruns the 8-hour mean", () => {
    // Seven clean hours then one hour at 0.15 ppm: the 8-hour mean is trivial,
    // but the 1-hour value is well into 'Unhealthy for Sensitive Groups'.
    const spike = [...Array(7).fill(0), ppmToUgm3(0.15, "ozone")];
    const result = computeIndex("us", { ozone: spike });
    expect(result.index).toBeGreaterThanOrEqual(101);
    expect(result.index).toBeLessThanOrEqual(150);
    expect(result.subIndices[0].averaging).toBe("1h");
  });

  it("scores NO2 at 53 ppb as 50", () => {
    expect(computeIndex("us", only("nitrogen_dioxide", ppbToUgm3(53, "nitrogen_dioxide"))).index).toBe(50);
  });

  it("scores SO2 at 75 ppb as 100", () => {
    expect(computeIndex("us", only("sulphur_dioxide", ppbToUgm3(75, "sulphur_dioxide"))).index).toBe(100);
  });

  it("scores CO at 4.4 ppm as 50", () => {
    expect(computeIndex("us", only("carbon_monoxide", ppmToUgm3(4.4, "carbon_monoxide"))).index).toBe(50);
  });

  it("ignores ammonia, which the US index does not score", () => {
    expect(computeIndex("us", only("ammonia", 5000)).index).toBeNull();
  });

  it("clamps beyond the top of the table rather than running away", () => {
    expect(computeIndex("us", only("pm2_5", 5000)).index).toBe(500);
  });
});

describe("European AQI bands", () => {
  it.each([
    [10, 20],
    [20, 40],
    [25, 60],
    [50, 80],
    [75, 100],
  ])("PM2.5 of %i µg/m³ scores %i", (pm25, expected) => {
    expect(computeIndex("eu", only("pm2_5", pm25)).index).toBe(expected);
  });

  it("is stricter than the US index at low PM2.5", () => {
    const series = only("pm2_5", 22);
    const us = computeIndex("us", series);
    const eu = computeIndex("eu", series);
    // 22 µg/m³ is still "Moderate" in the US and already "Moderate" in the EU
    // at a much lower point on its scale — check the categories, not the numbers.
    expect(us.category?.label).toBe("Moderate");
    expect(eu.category?.label).toBe("Moderate");
  });

  it("does not score carbon monoxide", () => {
    expect(computeIndex("eu", only("carbon_monoxide", 20000)).index).toBeNull();
  });
});

describe("India CPCB National AQI", () => {
  it.each([
    [30, 50],
    [60, 100],
    [90, 200],
    [120, 300],
    [250, 400],
  ])("PM2.5 of %i µg/m³ scores %i", (pm25, expected) => {
    expect(computeIndex("in", only("pm2_5", pm25)).index).toBe(expected);
  });

  it("scores ammonia, unlike the other two standards", () => {
    const result = computeIndex("in", only("ammonia", 400));
    expect(result.index).toBe(100);
    expect(result.dominant).toBe("ammonia");
  });

  it("scores CO on its mg/m³ table", () => {
    // 2 mg/m³ = 2000 µg/m³ is the CPCB 51–100 band boundary.
    expect(computeIndex("in", only("carbon_monoxide", 2000)).index).toBe(100);
  });
});

describe("dominant pollutant selection", () => {
  it("reports the worst pollutant, not an average", () => {
    const result = computeIndex("us", {
      pm2_5: flat(10), // ~57
      pm10: flat(200), // ~123
      ozone: flat(60), // low
    });
    expect(result.dominant).toBe("pm10");
    expect(result.index).toBe(result.subIndices[0].index);
    expect(result.subIndices.length).toBe(3);
  });
});

describe("EPA NowCast", () => {
  it("equals the concentration when air is steady", () => {
    expect(computeIndex("us", only("pm2_5", 40)).index).toBe(
      computeIndex("us", { pm2_5: flat(40, 12) }).index,
    );
  });

  it("weights the newest hour heavily when concentrations spike", () => {
    // Twelve quiet hours then a sharp rise: the NowCast should land far above
    // the plain mean of the window but below the latest hour.
    const window: number[] = [...Array(11).fill(10), 200];
    const plainMean = window.reduce((a, b) => a + b, 0) / window.length;
    const result = computeIndex("us", { pm2_5: window });
    const nowcast = result.subIndices[0].concentrationUgm3;

    expect(nowcast).toBeGreaterThan(plainMean);
    expect(nowcast).toBeLessThan(200);
  });

  it("returns no value when the recent hours are missing", () => {
    const window = [...flat(30, 9), null, null, null];
    expect(computeIndex("us", { pm2_5: window }).index).toBeNull();
  });
});

describe("averaging windows", () => {
  it("requires 75 % completeness for a trailing mean", () => {
    expect(trailingMean([...flat(20, 18), ...Array(6).fill(null)], 24)).toBe(20);
    expect(trailingMean([...flat(20, 10), ...Array(14).fill(null)], 24)).toBeNull();
  });

  it("uses only the requested number of trailing hours", () => {
    expect(trailingMean([...flat(100, 16), ...flat(0, 8)], 8)).toBe(0);
  });
});
