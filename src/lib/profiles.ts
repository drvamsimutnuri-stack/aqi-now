import type { MeasureKey } from "./pollutants";

/**
 * Risk profiles. Air quality guidance is written for a population, but the
 * population is not who reads it — the number at which someone should change
 * their plans differs enormously between a healthy 30-year-old and a child with
 * asthma. Selecting a profile shifts every threshold in the app.
 */

export interface RiskProfile {
  key: string;
  label: string;
  /** Shown when selected, explaining why this group is different. */
  why: string;
  /**
   * US AQI at which this group should start changing behaviour. The general
   * population's threshold is 101; sensitive groups act earlier.
   */
  actionThreshold: number;
  /** Measures this group is disproportionately affected by. */
  keyPollutants: MeasureKey[];
  /** Specific, concrete advice for this group. */
  advice: string[];
}

export const RISK_PROFILES: RiskProfile[] = [
  {
    key: "asthma",
    label: "Asthma",
    why: "Asthmatic airways are already inflamed and hyper-reactive, so they constrict in response to concentrations that a healthy airway shrugs off. Sulphur dioxide can trigger bronchoconstriction within ten minutes, and ozone lowers the threshold for every other trigger you have.",
    actionThreshold: 76,
    keyPollutants: ["ozone", "sulphur_dioxide", "nitrogen_dioxide", "pm2_5"],
    advice: [
      "Carry your reliever inhaler whenever you go out, not just when you feel symptoms",
      "Take your preventer/controller medication exactly as prescribed — it is what buys you margin on days like this",
      "Pre-medicate before unavoidable outdoor exertion if your action plan allows it",
      "Treat rising reliever use as the early warning it is, and contact your clinician before it becomes an attack",
      "Ozone peaks mid-afternoon, so shift activity to early morning",
    ],
  },
  {
    key: "copd",
    label: "COPD or chronic lung disease",
    why: "With reduced reserve capacity, there is no spare lung function to absorb an insult. Exacerbations triggered by pollution spikes are a leading cause of admission, and each one can permanently lower your baseline.",
    actionThreshold: 76,
    keyPollutants: ["pm2_5", "pm10", "nitrogen_dioxide", "ozone"],
    advice: [
      "Stay indoors with filtered air on elevated days; this is not over-caution, it prevents admissions",
      "Keep your rescue pack and action plan accessible",
      "Watch for the early signs of an exacerbation: more sputum, a change in its colour, or more breathlessness than usual",
      "Do not skip pulmonary rehab exercises — do them indoors instead",
    ],
  },
  {
    key: "heart",
    label: "Heart disease or high blood pressure",
    why: "Cardiovascular events are the largest share of pollution-attributable deaths, and the risk rises within hours of a spike rather than over years. Fine particles raise blood pressure, promote clotting and can provoke arrhythmia.",
    actionThreshold: 76,
    keyPollutants: ["pm2_5", "carbon_monoxide"],
    advice: [
      "Avoid outdoor exertion when levels are elevated — exertion plus pollution is the risky combination",
      "Keep taking blood pressure and cardiac medication as prescribed",
      "Treat chest pain, unusual breathlessness or palpitations as urgent, and do not attribute them to the air",
      "Be especially careful of carbon monoxide indoors from gas or charcoal appliances",
    ],
  },
  {
    key: "pregnant",
    label: "Pregnant",
    why: "Particles trigger inflammation that crosses the placenta, and exposure is linked to low birth weight and preterm birth. What matters here is cumulative exposure across the pregnancy, so consistently reducing ordinary days matters more than reacting to one bad one.",
    actionThreshold: 51,
    keyPollutants: ["pm2_5", "carbon_monoxide", "nitrogen_dioxide"],
    advice: [
      "Focus on lowering your everyday baseline, not just avoiding spikes — cumulative dose is what counts",
      "Run a HEPA purifier in the bedroom; you spend a third of the pregnancy there",
      "Avoid cooking on unvented gas without extraction, and never use charcoal or a generator indoors",
      "Choose walking routes away from busy roads, even if slightly longer",
      "Mention air quality exposure to your midwife or obstetrician if you live somewhere heavily polluted",
    ],
  },
  {
    key: "child",
    label: "Young child in the household",
    why: "Children breathe far more air per kilogram of body weight than adults, spend more time outdoors being active, and are growing lungs that only get built once. Damage in childhood shows up as permanently lower lung capacity in adulthood.",
    actionThreshold: 51,
    keyPollutants: ["pm2_5", "nitrogen_dioxide", "ozone"],
    advice: [
      "Move outdoor play indoors on elevated days, or shift it to early morning",
      "Push for a school route away from heavy traffic, and avoid waiting at the roadside at pickup",
      "Standard masks rarely seal on small faces — rely on avoidance and indoor filtration instead",
      "Never idle a car engine with children inside or nearby",
      "Take a new or worsening night cough seriously; it is often the first sign of pollution-driven asthma",
    ],
  },
  {
    key: "older",
    label: "Over 65",
    why: "Lung function and cardiovascular reserve decline with age, and existing conditions are more common. Older adults show the steepest rise in hospital admissions and mortality on high-pollution days of any group.",
    actionThreshold: 76,
    keyPollutants: ["pm2_5", "ozone", "nitrogen_dioxide"],
    advice: [
      "Keep errands and walks to the cleanest hours of the day",
      "Maintain indoor air with a HEPA purifier in the room you use most",
      "Stay hydrated and keep taking regular medication",
      "Do not stop exercising — move it indoors, since inactivity carries its own serious risks",
    ],
  },
  {
    key: "athlete",
    label: "I exercise outdoors regularly",
    why: "This is the group most often caught out. Hard exercise raises the air you move through your lungs roughly tenfold and shifts you to mouth breathing, bypassing the nose's filtration. An hour of hard running in moderate air can deliver a bigger dose than a whole day at rest in bad air.",
    actionThreshold: 101,
    keyPollutants: ["ozone", "pm2_5", "nitrogen_dioxide"],
    advice: [
      "Time sessions rather than skipping them: ozone bottoms out in the early morning and peaks late afternoon",
      "Route away from traffic — moving a few streets off a main road cuts NO₂ substantially",
      "Lower the intensity rather than the duration when air is poor; ventilation rises steeply with effort",
      "Take hard interval sessions indoors on elevated days and keep easy ones outside",
      "Masks do not work for hard training; they restrict airflow when you need it most",
    ],
  },
  {
    key: "outdoor_worker",
    label: "I work outdoors",
    why: "Long shifts remove the option of waiting for cleaner hours, and the exposure is often at moderate exertion beside traffic, machinery or dust — meaning both concentration and breathing rate are elevated for hours at a stretch.",
    actionThreshold: 76,
    keyPollutants: ["pm2_5", "pm10", "dust", "nitrogen_dioxide", "ozone"],
    advice: [
      "A properly fitted N95/FFP2 is worth it for whole shifts; fit matters more than the rating",
      "Take breaks indoors or in a filtered cab rather than at the roadside",
      "For dust work, wet-cutting and extraction reduce exposure far more than any mask",
      "Ask about your employer's occupational exposure duties — this is a workplace hazard, not just weather",
    ],
  },
];

export function profileByKey(key: string): RiskProfile | undefined {
  return RISK_PROFILES.find((p) => p.key === key);
}

/**
 * The lowest action threshold across the selected profiles, since guidance
 * should follow the most vulnerable person in the household.
 */
export function effectiveThreshold(selectedKeys: string[]): number {
  const thresholds = selectedKeys
    .map((key) => profileByKey(key)?.actionThreshold)
    .filter((t): t is number => typeof t === "number");
  return thresholds.length ? Math.min(...thresholds) : 101;
}
