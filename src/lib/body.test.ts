import { describe, expect, it } from "vitest";
import { BODY_SYSTEMS, effectsAtBand } from "./body";
import { MEASURES } from "./pollutants";

describe("body systems", () => {
  it("puts lungs first and eyes second, as the directly exposed organs", () => {
    expect(BODY_SYSTEMS[0].key).toBe("lungs");
    expect(BODY_SYSTEMS[1].key).toBe("eyes");
    expect(BODY_SYSTEMS[0].emphasis).toBe("primary");
    expect(BODY_SYSTEMS[1].emphasis).toBe("primary");
  });

  it("gives the two primary systems the deepest coverage", () => {
    const primary = BODY_SYSTEMS.filter((s) => s.emphasis === "primary");
    const others = BODY_SYSTEMS.filter((s) => s.emphasis !== "primary");
    const fewestPrimary = Math.min(...primary.map((s) => s.effects.length));
    const mostOther = Math.max(...others.map((s) => s.effects.length));
    expect(fewestPrimary).toBeGreaterThanOrEqual(mostOther);
  });

  it("names only real measures as drivers", () => {
    for (const system of BODY_SYSTEMS) {
      for (const effect of system.effects) {
        for (const driver of effect.drivers) {
          expect(MEASURES[driver], `${system.key}: ${driver}`).toBeDefined();
        }
      }
    }
  });

  it("gives every system chronic context and protective advice", () => {
    for (const system of BODY_SYSTEMS) {
      expect(system.chronic.length, system.key).toBeGreaterThan(40);
      expect(system.protect.length, system.key).toBeGreaterThan(0);
      expect(system.effects.length, system.key).toBeGreaterThan(0);
    }
  });

  it("only surfaces effects once their band is reached", () => {
    const lungs = BODY_SYSTEMS[0];
    const good = effectsAtBand(lungs, 0);
    const hazardous = effectsAtBand(lungs, 5);
    expect(good.everyone.length + good.sensitive.length).toBe(0);
    expect(hazardous.everyone.length + hazardous.sensitive.length).toBe(lungs.effects.length);
  });

  it("separates general-population effects from at-risk-only ones", () => {
    const { everyone, sensitive } = effectsAtBand(BODY_SYSTEMS[0], 3);
    expect(everyone.every((e) => !e.sensitiveOnly)).toBe(true);
    expect(sensitive.every((e) => e.sensitiveOnly)).toBe(true);
    expect(sensitive.length).toBeGreaterThan(0);
  });

  it("escalates monotonically — bands never lose effects", () => {
    for (const system of BODY_SYSTEMS) {
      let previous = 0;
      for (let band = 0; band <= 5; band++) {
        const { everyone, sensitive } = effectsAtBand(system, band);
        const total = everyone.length + sensitive.length;
        expect(total, `${system.key} band ${band}`).toBeGreaterThanOrEqual(previous);
        previous = total;
      }
    }
  });
});
