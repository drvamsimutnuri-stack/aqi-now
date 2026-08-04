/**
 * Health guidance bands.
 *
 * Keyed to the six US EPA AQI categories, which are the most widely recognised
 * bands, and phrased from EPA AirNow activity guidance plus WHO advice.
 */

export interface HealthBand {
  /** 0 = Good … 5 = Hazardous, matching the US category order. */
  level: number;
  label: string;
  headline: string;
  /** What most people will notice, if anything. */
  everyone: string;
  /** What at-risk groups should do. */
  sensitive: string;
  /** Concrete actions, in priority order. */
  actions: string[];
  /** Whether a respirator is worth wearing outdoors. */
  mask: string;
  /** Rough outdoor-exercise guidance. */
  exercise: string;
  /** Whether windows should be open or shut. */
  ventilation: string;
}

export const HEALTH_BANDS: HealthBand[] = [
  {
    level: 0,
    label: "Good",
    headline: "Air quality poses little or no risk.",
    everyone: "No symptoms expected. This is air you can breathe deeply without thinking about it.",
    sensitive: "Even people with asthma or heart disease are unlikely to notice any effect.",
    actions: [
      "Open the windows and air the place out",
      "A good day for outdoor exercise of any intensity",
    ],
    mask: "Not needed.",
    exercise: "Unrestricted, including long or high-intensity sessions.",
    ventilation: "Open windows freely.",
  },
  {
    level: 1,
    label: "Moderate",
    headline: "Acceptable for most people, with a caveat for the unusually sensitive.",
    everyone: "No effects expected for the general population.",
    sensitive: "A small number of unusually sensitive people — some with asthma, some older adults — may notice mild throat irritation or shortness of breath on long outdoor exertion.",
    actions: [
      "Carry on as normal if you are healthy",
      "If you are unusually sensitive, consider shortening very long outdoor workouts",
      "Keep rescue inhalers to hand if you have asthma",
    ],
    mask: "Not needed for most people.",
    exercise: "Fine for everyone; the unusually sensitive may want to ease off marathon-length efforts.",
    ventilation: "Open windows; prefer times of day away from rush hour.",
  },
  {
    level: 2,
    label: "Unhealthy for Sensitive Groups",
    headline: "At-risk groups will start to feel this. Most others will not.",
    everyone: "The general public is not likely to be affected, though some may notice mild irritation during heavy exertion.",
    sensitive: "People with asthma, COPD or heart disease, children, older adults and pregnant people are likely to experience symptoms: coughing, chest tightness, wheezing or breathlessness.",
    actions: [
      "Sensitive groups: cut back on prolonged or heavy outdoor exertion",
      "Move workouts indoors or to early morning, when levels are usually lowest",
      "Keep asthma medication accessible and take controller medication as prescribed",
      "Run an air purifier on a HEPA filter indoors",
    ],
    mask: "Sensitive groups benefit from a well-fitted N95/FFP2 outdoors; a cloth or surgical mask does very little for PM2.5.",
    exercise: "Healthy adults: fine. Sensitive groups: keep it short and light outdoors, or go indoors.",
    ventilation: "Keep windows closed during peak hours; ventilate when levels dip.",
  },
  {
    level: 3,
    label: "Unhealthy",
    headline: "Everyone may begin to notice health effects.",
    everyone: "Expect eye, nose and throat irritation, coughing and reduced comfort during exertion. Healthy people can experience measurable short-term drops in lung function.",
    sensitive: "Serious effects are likely: asthma attacks, COPD exacerbations, angina and a real increase in heart attack and stroke risk on days like this.",
    actions: [
      "Everyone: avoid prolonged or heavy exertion outdoors",
      "Sensitive groups: stay indoors and keep activity light",
      "Close windows and run HEPA purifiers; recirculate air in the car",
      "Wear a fitted N95/FFP2 for any necessary time outside",
      "Do not add indoor smoke — no candles, incense, frying or vacuuming without HEPA",
    ],
    mask: "A well-fitted N95/FFP2 is genuinely worth wearing outdoors.",
    exercise: "Take it indoors. If you must be outside, keep the effort low — hard breathing multiplies your dose.",
    ventilation: "Windows closed. Filter and recirculate.",
  },
  {
    level: 4,
    label: "Very Unhealthy",
    headline: "A health alert. Risk is elevated for the entire population.",
    everyone: "Significant respiratory and cardiovascular effects across the whole population, not just at-risk groups. Headache, fatigue and aggravated breathing are common.",
    sensitive: "High risk of severe events: hospitalisation for asthma or COPD, heart attack, arrhythmia and stroke. Symptoms can escalate quickly.",
    actions: [
      "Everyone: avoid all outdoor physical activity",
      "Sensitive groups: remain indoors with filtered air",
      "Seal gaps around windows and doors; create one well-filtered clean-air room",
      "N95/FFP2 mandatory for any outdoor exposure",
      "Seek medical help for chest pain, severe breathlessness or a fast heartbeat",
    ],
    mask: "N95/FFP2 for any time outdoors, without exception.",
    exercise: "None outdoors. Reduce intensity even indoors unless the air is filtered.",
    ventilation: "Fully sealed with mechanical filtration.",
  },
  {
    level: 5,
    label: "Hazardous",
    headline: "Emergency conditions. The entire population is at serious risk.",
    everyone: "Serious effects for everyone regardless of health status. Breathing this for a day is a meaningful acute health insult, not a nuisance.",
    sensitive: "Life-threatening for people with heart or lung disease. Expect a sharp rise in emergency admissions and excess deaths.",
    actions: [
      "Stay indoors, sealed, with filtration running continuously",
      "Avoid going outside at all; if unavoidable, keep it to minutes with an N95/FFP2",
      "Relocate to cleaner air if you can, particularly with children or a chronic condition",
      "Follow official emergency and school-closure guidance",
      "Get urgent medical care for chest pain, confusion or severe breathing difficulty",
    ],
    mask: "N95/FFP2 minimum; a properly sealed respirator if exposure is unavoidable.",
    exercise: "None. Any exertion substantially raises your inhaled dose.",
    ventilation: "Sealed. Filtered clean-air room. No outdoor air exchange.",
  },
];

/** Map a US AQI value to its guidance band. */
export function bandForUsAqi(aqi: number): HealthBand {
  if (aqi <= 50) return HEALTH_BANDS[0];
  if (aqi <= 100) return HEALTH_BANDS[1];
  if (aqi <= 150) return HEALTH_BANDS[2];
  if (aqi <= 200) return HEALTH_BANDS[3];
  if (aqi <= 300) return HEALTH_BANDS[4];
  return HEALTH_BANDS[5];
}

export const UV_ADVICE: { max: number; label: string; advice: string; color: string }[] = [
  { max: 2, label: "Low", advice: "No protection needed for most people.", color: "#22c55e" },
  { max: 5, label: "Moderate", advice: "Seek shade at midday; sunscreen and a hat if out for a while.", color: "#eab308" },
  { max: 7, label: "High", advice: "SPF 30+, hat and sunglasses. Reduce midday sun exposure.", color: "#f97316" },
  { max: 10, label: "Very high", advice: "Skin burns quickly. Avoid sun 10am–4pm; SPF 50, cover up.", color: "#ef4444" },
  { max: Infinity, label: "Extreme", advice: "Unprotected skin can burn in minutes. Stay indoors at midday.", color: "#8b5cf6" },
];

export function uvAdvice(uv: number) {
  return UV_ADVICE.find((b) => uv <= b.max) ?? UV_ADVICE[UV_ADVICE.length - 1];
}
