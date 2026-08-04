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
