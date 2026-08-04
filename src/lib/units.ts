/**
 * Gas concentration conversions.
 *
 * Open-Meteo reports every gas in µg/m³, but the US EPA and Indian CPCB
 * breakpoint tables are defined in ppm/ppb (US) or mg/m³ (India, for CO).
 * Conversion uses the molar volume of an ideal gas at the EPA reference
 * conditions of 25 °C and 1 atm: 24.45 L/mol.
 */
const MOLAR_VOLUME_L = 24.45;

const MOLECULAR_WEIGHT: Record<string, number> = {
  ozone: 48.0,
  nitrogen_dioxide: 46.0055,
  sulphur_dioxide: 64.066,
  carbon_monoxide: 28.01,
  ammonia: 17.031,
};

export function ugm3ToPpb(ugm3: number, gas: keyof typeof MOLECULAR_WEIGHT | string): number {
  const mw = MOLECULAR_WEIGHT[gas];
  if (!mw) throw new Error(`No molecular weight known for "${gas}"`);
  return (ugm3 * MOLAR_VOLUME_L) / mw;
}

export function ugm3ToPpm(ugm3: number, gas: string): number {
  return ugm3ToPpb(ugm3, gas) / 1000;
}

export function ugm3ToMgm3(ugm3: number): number {
  return ugm3 / 1000;
}

/**
 * Reverse conversions, needed because ground stations report in whatever unit
 * their operator chose — OpenAQ commonly serves gases in ppm or ppb — while our
 * AQI engine works in µg/m³ throughout.
 */
export function ppbToUgm3(ppb: number, gas: string): number {
  const mw = MOLECULAR_WEIGHT[gas];
  if (!mw) throw new Error(`No molecular weight known for "${gas}"`);
  return (ppb * mw) / MOLAR_VOLUME_L;
}

export function ppmToUgm3(ppm: number, gas: string): number {
  return ppbToUgm3(ppm * 1000, gas);
}

export function mgm3ToUgm3(mgm3: number): number {
  return mgm3 * 1000;
}

/** Whether a gas conversion is known for this measure. */
export function isConvertibleGas(gas: string): boolean {
  return gas in MOLECULAR_WEIGHT;
}

/**
 * Normalise a station reading to µg/m³. Returns null when the unit is one we
 * cannot safely convert, which is preferable to silently reporting a number
 * that is wrong by three orders of magnitude.
 */
export function toUgm3(value: number, unit: string, gas: string): number | null {
  const u = unit.trim().toLowerCase().replace("μ", "µ");

  if (u === "µg/m³" || u === "ug/m3" || u === "µg/m3" || u === "ugm3") return value;
  if (u === "mg/m³" || u === "mg/m3") return mgm3ToUgm3(value);

  if (!isConvertibleGas(gas)) return null;
  if (u === "ppm") return ppmToUgm3(value, gas);
  if (u === "ppb") return ppbToUgm3(value, gas);

  return null;
}
