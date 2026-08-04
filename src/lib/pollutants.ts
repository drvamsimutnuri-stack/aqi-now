import type { PollutantKey } from "./standards";

/** Every measurable Open-Meteo field the app surfaces, index-forming or not. */
export type MeasureKey =
  | PollutantKey
  | "dust"
  | "aerosol_optical_depth"
  | "uv_index"
  | "methane";

export interface Guideline {
  label: string;
  value: number;
  unit: string;
}

export interface Measure {
  key: MeasureKey;
  /** Short display name. */
  name: string;
  /** Chemical formula or symbol, shown as a subtitle. */
  formula: string;
  unit: string;
  /** One sentence: what this actually is. */
  what: string;
  /** Where it comes from. */
  sources: string[];
  /** Effects from hours to days of exposure. */
  shortTerm: string[];
  /** Effects from months to years of exposure. */
  longTerm: string[];
  /** WHO 2021 Air Quality Guideline levels, where one exists. */
  who: Guideline[];
  /** People who feel it first. */
  sensitive: string[];
  /** Whether this feeds any of the three indices. */
  indexForming: boolean;
  /** Accent colour for the card. */
  accent: string;
}

export const MEASURES: Record<MeasureKey, Measure> = {
  pm2_5: {
    key: "pm2_5",
    name: "Fine particulate matter",
    formula: "PM2.5",
    unit: "µg/m³",
    what: "Airborne particles under 2.5 micrometres across — roughly 1/30th the width of a human hair. They are small enough to pass through the lungs' defences, reach the alveoli, and cross into the bloodstream.",
    sources: [
      "Combustion: vehicle exhaust, coal and gas power plants, industry",
      "Wildfire and agricultural crop-residue smoke",
      "Wood, dung and kerosene cooking or heating fires",
      "Secondary formation from NOx, SO2 and ammonia reacting in the atmosphere",
      "Brake, tyre and road-surface wear",
    ],
    shortTerm: [
      "Irritated eyes, nose and throat; coughing and chest tightness",
      "Asthma attacks and COPD exacerbations within hours of a spike",
      "Measurably higher risk of heart attack and stroke on high-pollution days",
      "Reduced lung function and shortness of breath during exertion",
      "Headaches, fatigue and difficulty concentrating",
    ],
    longTerm: [
      "Accelerated decline in lung function and permanently reduced lung growth in children",
      "Ischaemic heart disease, hypertension and heart failure",
      "Lung cancer — classified carcinogenic to humans (IARC Group 1)",
      "Type 2 diabetes and systemic insulin resistance",
      "Cognitive decline and elevated dementia risk",
      "Low birth weight, preterm birth and adverse pregnancy outcomes",
      "The single largest environmental health risk factor worldwide, linked to millions of premature deaths a year",
    ],
    who: [
      { label: "24-hour", value: 15, unit: "µg/m³" },
      { label: "Annual", value: 5, unit: "µg/m³" },
    ],
    sensitive: [
      "Children and infants",
      "Adults over 65",
      "People with asthma, COPD or heart disease",
      "Pregnant people",
      "Outdoor workers and endurance athletes",
    ],
    indexForming: true,
    accent: "#ef4444",
  },

  pm10: {
    key: "pm10",
    name: "Coarse particulate matter",
    formula: "PM10",
    unit: "µg/m³",
    what: "Inhalable particles under 10 micrometres, including everything counted as PM2.5 plus coarser material like road dust, pollen fragments and construction debris. Most is filtered by the nose and upper airway, but enough reaches the bronchi to inflame them.",
    sources: [
      "Construction, demolition and unpaved roads",
      "Windblown soil, desert dust and sea salt",
      "Quarrying, mining and cement production",
      "Agricultural tilling and harvesting",
      "Pollen, mould spores and other biological fragments",
    ],
    shortTerm: [
      "Coughing, sneezing, runny nose and sore throat",
      "Bronchitis flare-ups and wheezing",
      "Aggravated asthma, especially in children",
      "Eye irritation and reduced visibility",
    ],
    longTerm: [
      "Chronic bronchitis and long-term airway remodelling",
      "Reduced lung function that does not fully recover",
      "Increased respiratory hospital admissions and mortality",
      "Silicosis and other occupational lung disease where the dust is mineral-heavy",
    ],
    who: [
      { label: "24-hour", value: 45, unit: "µg/m³" },
      { label: "Annual", value: 15, unit: "µg/m³" },
    ],
    sensitive: [
      "Children",
      "People with asthma or chronic bronchitis",
      "Older adults",
      "Construction and roadside workers",
    ],
    indexForming: true,
    accent: "#f97316",
  },

  ozone: {
    key: "ozone",
    name: "Ground-level ozone",
    formula: "O₃",
    unit: "µg/m³",
    what: "A highly reactive gas that is not emitted directly. It forms when nitrogen oxides and volatile organic compounds cook in sunlight, which is why it peaks on hot, still, sunny afternoons and collapses overnight. Useful in the stratosphere, damaging at breathing height.",
    sources: [
      "Photochemical reaction of NOx with VOCs in sunlight",
      "Traffic and industrial emissions supplying the precursors",
      "Solvents, paints, petrol vapour and refinery emissions (VOCs)",
      "Long-range transport from upwind cities",
    ],
    shortTerm: [
      "Sharp chest pain or a burning sensation on deep breaths",
      "Coughing, throat irritation and airway inflammation",
      "Measurable drop in lung function even in healthy young adults",
      "Asthma attacks and increased need for rescue inhalers",
      "Greater susceptibility to respiratory infection",
    ],
    longTerm: [
      "Permanent structural damage to lung tissue with repeated exposure",
      "Development of asthma in children exposed during active sport",
      "Increased respiratory and cardiovascular mortality",
      "Reduced crop yields and forest growth at the ecosystem level",
    ],
    who: [
      { label: "8-hour", value: 100, unit: "µg/m³" },
      { label: "Peak season", value: 60, unit: "µg/m³" },
    ],
    sensitive: [
      "People with asthma",
      "Children who play outdoors",
      "Outdoor workers",
      "Anyone exercising outside on a hot afternoon",
    ],
    indexForming: true,
    accent: "#3b82f6",
  },

  nitrogen_dioxide: {
    key: "nitrogen_dioxide",
    name: "Nitrogen dioxide",
    formula: "NO₂",
    unit: "µg/m³",
    what: "A reddish-brown, sharply acrid gas produced whenever fuel burns hot enough to oxidise the nitrogen in air. It is the best single chemical marker for traffic pollution, and concentrations fall off steeply within a few hundred metres of a busy road.",
    sources: [
      "Diesel and petrol vehicle exhaust",
      "Power generation and industrial boilers",
      "Gas stoves, gas ovens and unvented heaters indoors",
      "Shipping and off-road machinery",
    ],
    shortTerm: [
      "Airway inflammation and increased bronchial reactivity",
      "Coughing, wheezing and shortness of breath",
      "Worsened asthma symptoms within 30 minutes of exposure",
      "Reduced resistance to lung infections",
    ],
    longTerm: [
      "New-onset asthma in children — strongest evidence of any traffic pollutant",
      "Chronically reduced lung function growth",
      "Higher rates of respiratory infection and hospital admission",
      "Contributes to acid rain and to secondary PM2.5 and ozone formation",
    ],
    who: [
      { label: "24-hour", value: 25, unit: "µg/m³" },
      { label: "Annual", value: 10, unit: "µg/m³" },
    ],
    sensitive: [
      "Children living or schooling near main roads",
      "People with asthma",
      "Households cooking on unvented gas",
      "Traffic police, couriers and drivers",
    ],
    indexForming: true,
    accent: "#a855f7",
  },

  sulphur_dioxide: {
    key: "sulphur_dioxide",
    name: "Sulphur dioxide",
    formula: "SO₂",
    unit: "µg/m³",
    what: "A pungent gas released when sulphur-bearing fuel or ore is burned. It constricts airways within minutes at high concentrations and converts in the atmosphere into sulphate particles, becoming part of the PM2.5 problem.",
    sources: [
      "Coal and heavy fuel-oil combustion in power plants",
      "Metal smelting and ore processing",
      "Oil refining and petrochemical plants",
      "Ships burning high-sulphur bunker fuel",
      "Volcanic degassing",
    ],
    shortTerm: [
      "Bronchoconstriction within 10 minutes in people with asthma",
      "Burning of the nose, throat and airways",
      "Coughing, chest tightness and difficulty breathing",
      "Eye irritation and tearing",
    ],
    longTerm: [
      "Increased respiratory illness and altered lung defences",
      "Aggravation of existing cardiovascular disease",
      "Formation of secondary sulphate PM2.5, carrying its own long-term risks",
      "Acid rain, damaging soils, forests, lakes and stonework",
    ],
    who: [{ label: "24-hour", value: 40, unit: "µg/m³" }],
    sensitive: [
      "People with asthma — the most SO₂-sensitive group by a wide margin",
      "Children",
      "Smelter and refinery workers",
      "Communities downwind of coal plants",
    ],
    indexForming: true,
    accent: "#eab308",
  },

  carbon_monoxide: {
    key: "carbon_monoxide",
    name: "Carbon monoxide",
    formula: "CO",
    unit: "µg/m³",
    what: "An odourless, colourless gas from incomplete combustion. It binds to haemoglobin roughly 240 times more readily than oxygen does, so it starves tissue of oxygen without any sensation of suffocation. Outdoor levels are rarely acutely dangerous; indoor levels can be lethal.",
    sources: [
      "Vehicle exhaust, especially in tunnels, garages and congestion",
      "Faulty gas boilers, water heaters and generators",
      "Charcoal, wood and biomass stoves",
      "Wildfires",
      "Tobacco smoke",
    ],
    shortTerm: [
      "Headache, dizziness and nausea",
      "Confusion, impaired judgement and slowed reaction time",
      "Chest pain in people with angina, at lower doses than in healthy adults",
      "At high indoor concentrations: loss of consciousness and death",
    ],
    longTerm: [
      "Persistent neurological deficits after a serious poisoning",
      "Aggravation of coronary heart disease with repeated exposure",
      "Reduced oxygen delivery to a developing fetus",
    ],
    who: [
      { label: "24-hour", value: 4000, unit: "µg/m³" },
      { label: "1-hour", value: 35000, unit: "µg/m³" },
    ],
    sensitive: [
      "People with angina or coronary artery disease",
      "Pregnant people and fetuses",
      "Infants",
      "Anyone using indoor fuel-burning appliances",
    ],
    indexForming: true,
    accent: "#64748b",
  },

  ammonia: {
    key: "ammonia",
    name: "Ammonia",
    formula: "NH₃",
    unit: "µg/m³",
    what: "A sharp alkaline gas overwhelmingly agricultural in origin. Its main air quality significance is indirect: it neutralises atmospheric acids to form ammonium nitrate and sulphate, which are major components of secondary PM2.5. India's national index is the only major one that scores it directly.",
    sources: [
      "Livestock manure and slurry",
      "Urea and nitrogen fertiliser application",
      "Sewage treatment and waste decomposition",
      "Industrial refrigeration and chemical manufacture",
      "Vehicle catalytic converters, in smaller amounts",
    ],
    shortTerm: [
      "Irritation of the eyes, nose and throat",
      "Coughing and airway irritation at elevated levels",
      "Chemical burns to eyes and respiratory tract at industrial concentrations",
    ],
    longTerm: [
      "Chronic airway irritation and bronchitis in farm workers",
      "Major driver of secondary PM2.5, inheriting its full health burden",
      "Nitrogen deposition that acidifies soil and reduces biodiversity",
    ],
    who: [],
    sensitive: [
      "Livestock and poultry farm workers",
      "People living near intensive agriculture",
      "People with asthma",
    ],
    indexForming: true,
    accent: "#14b8a6",
  },

  dust: {
    key: "dust",
    name: "Saharan / mineral dust",
    formula: "Dust",
    unit: "µg/m³",
    what: "Modelled mineral dust lifted from deserts and dry soils and carried thousands of kilometres. It is already counted inside PM10 and PM2.5, but is broken out separately here because a dust event behaves differently from combustion smog and calls for a different response.",
    sources: [
      "Sahara, Arabian, Thar and Gobi desert outbreaks",
      "Dry lake beds and degraded farmland",
      "Convective dust storms and haboobs",
      "Construction and unpaved roads locally",
    ],
    shortTerm: [
      "Eye, nose and throat irritation",
      "Asthma and COPD flare-ups",
      "Sharply reduced visibility",
      "Transport of fungal spores and bacteria, and of Valley fever in endemic regions",
    ],
    longTerm: [
      "Repeated respiratory infection in high-frequency dust regions",
      "Cardiovascular strain during recurring dust seasons",
      "Meningitis risk in the African dust belt during dry season",
    ],
    who: [],
    sensitive: [
      "People with asthma or COPD",
      "Children",
      "Older adults",
      "Contact lens wearers",
    ],
    indexForming: false,
    accent: "#d97706",
  },

  aerosol_optical_depth: {
    key: "aerosol_optical_depth",
    name: "Aerosol optical depth",
    formula: "AOD 550nm",
    unit: "unitless",
    what: "How much sunlight the entire column of atmosphere above you scatters or absorbs, measured at 550 nm. Below 0.1 is a crystal-clear sky; above 0.5 is visibly hazy; above 1.0 usually means heavy smoke or dust aloft. It is the satellite proxy for haze, and unlike surface readings it sees pollution above the ground.",
    sources: [
      "Smoke plumes aloft from wildfires and crop burning",
      "Desert dust layers transported at altitude",
      "Urban and industrial haze",
      "Sea salt and volcanic sulphate",
    ],
    shortTerm: [
      "Not directly inhaled — a visibility and haze indicator",
      "High values with low surface readings often mean pollution aloft that may mix down later",
      "Reduces solar panel output and can affect aviation visibility",
    ],
    longTerm: [
      "Persistent regional haze correlates with elevated long-term PM2.5 exposure",
      "Alters local temperature and rainfall patterns",
    ],
    who: [],
    sensitive: [],
    indexForming: false,
    accent: "#8b5cf6",
  },

  uv_index: {
    key: "uv_index",
    name: "UV index",
    formula: "UVI",
    unit: "index",
    what: "Strength of sunburning ultraviolet radiation reaching the ground, on an open-ended scale where 0–2 is low and 11+ is extreme. Not an air pollutant, but it is the same sky and the same outdoor decision — and heavy haze measurably suppresses it.",
    sources: [
      "Solar elevation, so time of day and season",
      "Altitude — roughly 10 % more UV per 1000 m",
      "Stratospheric ozone thickness",
      "Cloud, haze and aerosol cover, which reduce it",
      "Reflection off snow, sand and water, which raises effective dose",
    ],
    shortTerm: [
      "Sunburn, in as little as 15 minutes at index 8+",
      "Photokeratitis — painful corneal inflammation",
      "Heat exhaustion when paired with high temperature",
      "Immune suppression in the skin",
    ],
    longTerm: [
      "Melanoma and non-melanoma skin cancer",
      "Cataracts and other eye damage",
      "Premature skin ageing, wrinkling and pigmentation",
    ],
    who: [{ label: "Protection needed above", value: 3, unit: "index" }],
    sensitive: [
      "Fair-skinned people",
      "Children",
      "Outdoor workers",
      "People on photosensitising medication",
    ],
    indexForming: false,
    accent: "#f59e0b",
  },

  methane: {
    key: "methane",
    name: "Methane",
    formula: "CH₄",
    unit: "µg/m³",
    what: "A potent greenhouse gas, harmless to breathe at ambient concentrations. It matters for air quality indirectly: methane is a precursor to background ground-level ozone, so it raises the ozone floor across whole hemispheres.",
    sources: [
      "Oil and gas extraction, processing and leakage",
      "Livestock enteric fermentation",
      "Rice paddies and wetlands",
      "Landfills and wastewater",
      "Coal mining",
    ],
    shortTerm: [
      "No health effect at ambient outdoor concentrations",
      "Asphyxiation risk only in enclosed, high-concentration spaces",
    ],
    longTerm: [
      "Roughly 80 times the warming effect of CO₂ over 20 years",
      "Raises hemispheric background ozone, worsening respiratory health everywhere",
    ],
    who: [],
    sensitive: [],
    indexForming: false,
    accent: "#6366f1",
  },
};

/** Order used across the pollutant grid. */
export const MEASURE_ORDER: MeasureKey[] = [
  "pm2_5",
  "pm10",
  "ozone",
  "nitrogen_dioxide",
  "sulphur_dioxide",
  "carbon_monoxide",
  "ammonia",
  "dust",
  "aerosol_optical_depth",
  "uv_index",
  "methane",
];

/* ------------------------------------------------------------------ */
/* Pollen                                                             */
/* ------------------------------------------------------------------ */

export type PollenKey =
  | "alder_pollen"
  | "birch_pollen"
  | "grass_pollen"
  | "mugwort_pollen"
  | "olive_pollen"
  | "ragweed_pollen";

export interface Pollen {
  key: PollenKey;
  name: string;
  season: string;
  /** Grains/m³ thresholds for low / moderate / high / very high onset. */
  thresholds: [number, number, number];
  notes: string;
}

export const POLLENS: Record<PollenKey, Pollen> = {
  alder_pollen: {
    key: "alder_pollen",
    name: "Alder",
    season: "Late winter to early spring",
    thresholds: [10, 50, 150],
    notes: "One of the earliest tree pollens of the year; cross-reacts with birch.",
  },
  birch_pollen: {
    key: "birch_pollen",
    name: "Birch",
    season: "Spring",
    thresholds: [10, 50, 150],
    notes: "A dominant spring allergen in northern Europe, and the usual cause of oral allergy syndrome with apples and stone fruit.",
  },
  grass_pollen: {
    key: "grass_pollen",
    name: "Grass",
    season: "Late spring through summer",
    thresholds: [5, 20, 50],
    notes: "The most common hay fever trigger worldwide; symptoms appear at low counts.",
  },
  mugwort_pollen: {
    key: "mugwort_pollen",
    name: "Mugwort",
    season: "Late summer to autumn",
    thresholds: [5, 25, 50],
    notes: "Cross-reacts with celery, carrot and spices in the celery–mugwort–spice syndrome.",
  },
  olive_pollen: {
    key: "olive_pollen",
    name: "Olive",
    season: "Late spring",
    thresholds: [10, 50, 200],
    notes: "A major allergen across the Mediterranean basin.",
  },
  ragweed_pollen: {
    key: "ragweed_pollen",
    name: "Ragweed",
    season: "Late summer to first frost",
    thresholds: [5, 20, 50],
    notes: "Extremely potent; a single plant releases a billion grains and they travel hundreds of kilometres.",
  },
};

export const POLLEN_ORDER: PollenKey[] = [
  "alder_pollen",
  "birch_pollen",
  "grass_pollen",
  "mugwort_pollen",
  "olive_pollen",
  "ragweed_pollen",
];

export function pollenLevel(key: PollenKey, grains: number): {
  label: string;
  color: string;
  fraction: number;
} {
  const [low, moderate, high] = POLLENS[key].thresholds;
  if (grains < low) return { label: "None / very low", color: "#22c55e", fraction: grains / low * 0.25 };
  if (grains < moderate) return { label: "Low", color: "#84cc16", fraction: 0.25 + (grains - low) / (moderate - low) * 0.25 };
  if (grains < high) return { label: "Moderate", color: "#f59e0b", fraction: 0.5 + (grains - moderate) / (high - moderate) * 0.25 };
  return { label: "High", color: "#ef4444", fraction: Math.min(1, 0.75 + (grains - high) / (high * 2) * 0.25) };
}
