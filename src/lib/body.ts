import type { MeasureKey } from "./pollutants";

/**
 * What air pollution does to each body system, ordered by how directly the air
 * reaches it: lungs first, then eyes, then everything downstream.
 *
 * `fromBand` is the lowest US EPA AQI band (0 = Good … 5 = Hazardous) at which
 * an effect becomes a realistic expectation for the general population, so the
 * app can show only what is relevant right now. Effects that appear only in
 * at-risk groups are marked `sensitiveOnly`, so a healthy reader is not told
 * they should be feeling something they are not.
 *
 * Content is drawn from the WHO Air Quality Guidelines (2021), the EPA
 * Integrated Science Assessments for particulate matter and ozone, and reviews
 * of ocular and cardiovascular effects of air pollution.
 */

export interface BodyEffect {
  fromBand: number;
  text: string;
  /**
   * Measures that drive this effect; used to explain today's mechanism. Not
   * limited to index-forming pollutants, since dust matters a great deal to
   * eyes without appearing in any AQI.
   */
  drivers: MeasureKey[];
  sensitiveOnly?: boolean;
}

export interface BodySystem {
  key: string;
  name: string;
  /** One line on why this system is affected at all. */
  summary: string;
  /** Plain-language mechanism: how pollution physically reaches this system. */
  route: string;
  /** Depth of coverage — the lungs and eyes get the full treatment. */
  emphasis: "primary" | "secondary" | "standard";
  effects: BodyEffect[];
  /** Concrete things that protect this specific organ. */
  protect: string[];
  /** What sustained exposure over years does. */
  chronic: string;
}

export const BODY_SYSTEMS: BodySystem[] = [
  {
    key: "lungs",
    name: "Lungs and airways",
    summary:
      "The organ that takes the full dose. Everything else in this list is downstream of what happens here.",
    route:
      "You move roughly 11,000 litres of air through your lungs a day, and every particle in it gets a chance to land. Where it lands is decided by size: PM10 is mostly caught in the nose and throat, PM2.5 reaches the bronchioles, and the finest fraction settles in the alveoli — the 300 million air sacs where the barrier to your bloodstream is a single cell thick. Reactive gases work differently: ozone does not need to be deposited, it chemically oxidises the airway lining on contact, which is why it hurts to breathe deeply on a high-ozone afternoon.",
    emphasis: "primary",
    effects: [
      {
        fromBand: 1,
        text: "Slight airway irritation during long or hard outdoor exertion",
        drivers: ["ozone", "pm2_5"],
        sensitiveOnly: true,
      },
      {
        fromBand: 1,
        text: "Inflammatory changes begin in the airway lining before you feel anything at all",
        drivers: ["pm2_5", "ozone"],
      },
      {
        fromBand: 2,
        text: "Coughing, throat irritation and a tight chest",
        drivers: ["pm2_5", "ozone", "nitrogen_dioxide"],
      },
      {
        fromBand: 2,
        text: "A sharp or burning sensation when you breathe in deeply",
        drivers: ["ozone"],
      },
      {
        fromBand: 2,
        text: "Asthma symptoms flaring and more reliever-inhaler use",
        drivers: ["pm2_5", "nitrogen_dioxide", "sulphur_dioxide", "ozone"],
        sensitiveOnly: true,
      },
      {
        fromBand: 2,
        text: "Bronchoconstriction within about ten minutes of exposure",
        drivers: ["sulphur_dioxide"],
        sensitiveOnly: true,
      },
      {
        fromBand: 3,
        text: "Measurable drop in lung function — less air moved per breath — even in healthy adults",
        drivers: ["ozone", "pm2_5"],
      },
      {
        fromBand: 3,
        text: "Shortness of breath and wheezing during ordinary activity, not just exercise",
        drivers: ["pm2_5", "ozone"],
      },
      {
        fromBand: 3,
        text: "The cilia that sweep mucus and debris out of your airways work less effectively",
        drivers: ["ozone", "pm2_5", "sulphur_dioxide"],
      },
      {
        fromBand: 3,
        text: "COPD exacerbation: more sputum, a change in its colour, and worse breathlessness",
        drivers: ["pm2_5", "pm10", "nitrogen_dioxide"],
        sensitiveOnly: true,
      },
      {
        fromBand: 4,
        text: "Airway inflammation severe enough to trigger hospital admission for asthma or COPD",
        drivers: ["pm2_5", "ozone", "nitrogen_dioxide"],
      },
      {
        fromBand: 4,
        text: "Weakened defence against respiratory infection for days afterwards, so a cold that follows hits harder",
        drivers: ["ozone", "nitrogen_dioxide", "pm2_5"],
      },
      {
        fromBand: 5,
        text: "Acute respiratory distress in people with existing lung disease; a day of this is a genuine medical insult, not a nuisance",
        drivers: ["pm2_5", "pm10", "ozone"],
      },
    ],
    protect: [
      "A well-fitted N95/FFP2 is the only mask that meaningfully filters PM2.5 — cloth and surgical masks do very little, and fit matters more than the rating printed on it",
      "Breathe through your nose when you can: it filters and humidifies air that mouth breathing sends straight down",
      "Lower intensity rather than cutting duration — ventilation rises steeply with effort, so an easy hour costs your lungs far less than a hard twenty minutes",
      "Run a HEPA purifier in the bedroom; eight hours of clean air a night is the single biggest reduction in daily dose available to most people",
      "Do not add indoor smoke on a bad day — no frying without extraction, no candles or incense, and vacuum only with a HEPA filter",
      "If you use a preventer inhaler, take it as prescribed; it is what gives your airways margin when the air is poor",
    ],
    chronic:
      "Years of exposure accelerate the natural decline in lung function, and in children stunt lung growth so they never reach full capacity — a deficit that does not recover in adulthood. It causes chronic bronchitis and COPD, and outdoor particulate pollution is classified by IARC as a Group 1 human carcinogen, causing lung cancer in people who have never smoked. Traffic-related NO₂ has the strongest evidence of any pollutant for causing new-onset asthma in children.",
  },
  {
    key: "eyes",
    name: "Eyes and vision",
    summary:
      "The only internal surface you expose to the air directly, with no filter in front of it.",
    route:
      "Your cornea and conjunctiva sit in the airstream with nothing between them and the atmosphere. Particles land on and abrade the tear film — the thin layer that keeps the surface smooth and optically clear — while reactive gases such as ozone, sulphur dioxide and formaldehyde dissolve straight into it. Because the tear film is your first defence and also your outermost lens, damaging it causes both irritation and genuinely blurred vision. Contact lenses make this markedly worse: they destabilise the tear film, hold deposits against the cornea and reduce the flushing effect of blinking.",
    emphasis: "primary",
    effects: [
      {
        fromBand: 1,
        text: "Dryness, grittiness and a vague feeling of something in the eye",
        drivers: ["pm10", "pm2_5", "dust"],
      },
      {
        fromBand: 1,
        text: "Contact lenses feel less comfortable and dry out sooner than usual",
        drivers: ["pm2_5", "pm10", "dust", "ozone"],
        sensitiveOnly: true,
      },
      {
        fromBand: 2,
        text: "Itching, redness and watering — the eye flushing itself in response to irritants",
        drivers: ["pm10", "pm2_5", "dust", "sulphur_dioxide"],
      },
      {
        fromBand: 2,
        text: "Tear film breaks up faster, causing vision that blurs between blinks",
        drivers: ["pm2_5", "ozone"],
      },
      {
        fromBand: 2,
        text: "Allergic conjunctivitis worsening, since particulates inflame the surface that pollen then irritates",
        drivers: ["pm2_5", "pm10"],
        sensitiveOnly: true,
      },
      {
        fromBand: 3,
        text: "Stinging and burning, with a strong urge to rub — which drives particles further into the surface and can scratch the cornea",
        drivers: ["ozone", "sulphur_dioxide", "pm2_5"],
      },
      {
        fromBand: 3,
        text: "Eyelid margin inflammation and crusting (blepharitis) flaring up",
        drivers: ["pm2_5", "pm10"],
      },
      {
        fromBand: 4,
        text: "Painful photophobia and swollen lids; enough surface damage to raise the risk of infection and corneal abrasion",
        drivers: ["ozone", "sulphur_dioxide", "pm2_5", "dust"],
      },
      {
        fromBand: 4,
        text: "Contact lens wear becomes genuinely inadvisable until the air clears",
        drivers: ["pm2_5", "dust"],
      },
    ],
    protect: [
      "Switch from contact lenses to glasses on poor-air days — glasses also act as a partial physical shield",
      "Do not rub. Flush instead: clean water or preservative-free saline, from the inner corner outwards",
      "Preservative-free artificial tears restore the tear film and physically wash irritants away; the preservatives in cheaper drops can add to the irritation",
      "Wraparound sunglasses on dusty or windy days block a surprising amount of particulate from reaching the surface",
      "Blink deliberately when on screens in polluted air — reduced blink rate and a damaged tear film compound each other",
      "See a clinician for pain, light sensitivity or vision that stays blurred after flushing, rather than waiting it out",
    ],
    chronic:
      "Sustained exposure is associated with chronic dry eye disease and chronic conjunctivitis, and studies in high-pollution cities find measurably higher rates of both. There is growing evidence linking long-term particulate exposure to glaucoma and to age-related macular degeneration, likely through the same oxidative stress and microvascular damage that drives its effects elsewhere in the body.",
  },
  {
    key: "nose_skin",
    name: "Nose, throat and skin",
    summary: "Your filters and your largest organ, both in direct contact with the air.",
    route:
      "The nose is designed to catch what the lungs should not receive, so it takes the coarse fraction and the water-soluble gases first. Skin is exposed across its whole area, and particles small enough to enter hair follicles can provoke inflammation and oxidative damage in the layers beneath.",
    emphasis: "standard",
    effects: [
      {
        fromBand: 1,
        text: "Dry or stuffy nose and a mildly scratchy throat",
        drivers: ["pm10", "dust"],
      },
      {
        fromBand: 2,
        text: "Blocked or runny nose, sneezing and sore throat",
        drivers: ["pm10", "dust", "sulphur_dioxide"],
      },
      {
        fromBand: 2,
        text: "Hoarseness and throat clearing that will not settle",
        drivers: ["ozone", "sulphur_dioxide"],
      },
      {
        fromBand: 3,
        text: "Sinus congestion and pressure; nosebleeds in dry, dusty conditions",
        drivers: ["pm10", "dust", "pm2_5"],
      },
      {
        fromBand: 3,
        text: "Eczema, rosacea and acne flaring; skin feeling tight, itchy or reactive",
        drivers: ["pm2_5", "nitrogen_dioxide", "ozone"],
      },
    ],
    protect: [
      "Rinse your face and eyes and change clothes when you come in from bad air, rather than carrying it around the house",
      "A saline nasal rinse clears trapped particulate and helps a blocked nose more than decongestant sprays",
      "Moisturise to support the skin barrier, and use an antioxidant serum if you already do — barrier damage is the main mechanism",
      "Wash pillowcases often; particulate accumulates where your face spends the night",
    ],
    chronic:
      "Long-term exposure is linked to chronic rhinitis and sinusitis, and to accelerated skin ageing: pigmentation, loss of elasticity and wrinkling, with the clearest evidence for traffic-related particulate and NO₂.",
  },
  {
    key: "heart",
    name: "Heart and circulation",
    summary:
      "The largest share of deaths caused by air pollution are cardiovascular, not respiratory.",
    route:
      "Fine particles cross from the alveoli into the bloodstream within minutes. They also trigger nerve reflexes in the lung that change heart rate and blood pressure before any particle has travelled anywhere at all.",
    emphasis: "standard",
    effects: [
      {
        fromBand: 2,
        text: "Small rises in blood pressure and heart rate, and reduced heart-rate variability",
        drivers: ["pm2_5"],
      },
      {
        fromBand: 2,
        text: "Angina brought on at lower effort than usual",
        drivers: ["pm2_5", "carbon_monoxide"],
        sensitiveOnly: true,
      },
      {
        fromBand: 3,
        text: "Blood becomes measurably more prone to clotting",
        drivers: ["pm2_5"],
      },
      {
        fromBand: 3,
        text: "A real, measurable rise in heart attack and stroke risk on days like this — the effect appears within hours, not years",
        drivers: ["pm2_5"],
      },
      {
        fromBand: 4,
        text: "Arrhythmias and decompensation of existing heart failure",
        drivers: ["pm2_5", "carbon_monoxide"],
      },
      {
        fromBand: 5,
        text: "Sharp rise in cardiac emergency admissions and excess deaths across the population",
        drivers: ["pm2_5"],
      },
    ],
    protect: [
      "Avoid the combination of exertion and polluted air; either one alone is far less risky than both together",
      "Keep taking blood pressure and cardiac medication as prescribed",
      "Treat chest pain, unusual breathlessness or palpitations as urgent — do not write them off as 'just the air'",
      "Watch carbon monoxide indoors from gas, charcoal or generators, which is the acute danger rather than outdoor levels",
    ],
    chronic:
      "Sustained exposure drives atherosclerosis, hypertension, ischaemic heart disease and heart failure.",
  },
  {
    key: "blood",
    name: "Blood and oxygen delivery",
    summary: "How pollution reaches organs the air never touches.",
    route:
      "Carbon monoxide binds haemoglobin around 240 times more readily than oxygen, displacing it. Ultrafine particles enter the circulation directly and provoke body-wide inflammation.",
    emphasis: "standard",
    effects: [
      { fromBand: 1, text: "Systemic inflammatory markers begin to rise", drivers: ["pm2_5"] },
      {
        fromBand: 3,
        text: "Reduced oxygen-carrying capacity, felt as fatigue and breathlessness on stairs",
        drivers: ["carbon_monoxide", "pm2_5"],
      },
      {
        fromBand: 4,
        text: "Oxidative stress and blood vessel dysfunction throughout the body",
        drivers: ["pm2_5", "nitrogen_dioxide"],
      },
    ],
    protect: [
      "Never run a generator, charcoal burner or unvented heater indoors or in a garage",
      "Fit a carbon monoxide alarm if you have any fuel-burning appliance",
      "Keep gas hobs and ovens properly extracted",
    ],
    chronic:
      "Chronic low-grade inflammation is the common mechanism linking air pollution to insulin resistance, type 2 diabetes and chronic kidney disease.",
  },
  {
    key: "brain",
    name: "Brain and nervous system",
    summary: "Particles reach the brain directly, along the nerve that gives you your sense of smell.",
    route:
      "Ultrafine particles travel to the brain along the olfactory nerve from the nose and through the bloodstream across the blood-brain barrier. Reduced blood oxygen from carbon monoxide compounds the effect.",
    emphasis: "standard",
    effects: [
      {
        fromBand: 2,
        text: "Headache, tiredness and difficulty concentrating",
        drivers: ["pm2_5", "carbon_monoxide"],
      },
      {
        fromBand: 3,
        text: "Measurably slower reaction time and worse performance on cognitive tasks",
        drivers: ["pm2_5", "carbon_monoxide"],
      },
      {
        fromBand: 3,
        text: "Worse sleep quality and more disturbed breathing at night",
        drivers: ["pm2_5", "nitrogen_dioxide"],
      },
      {
        fromBand: 4,
        text: "Dizziness and confusion; higher risk of stroke",
        drivers: ["carbon_monoxide", "pm2_5"],
      },
    ],
    protect: [
      "Filter the bedroom — sleep is when you can most easily cut your daily dose",
      "Do not dismiss a persistent headache indoors; rule out a carbon monoxide source",
    ],
    chronic:
      "Long-term exposure is linked to faster cognitive decline, higher dementia risk, and to depression and anxiety.",
  },
  {
    key: "pregnancy",
    name: "Pregnancy and children",
    summary: "The two groups for whom exposure has consequences that last a lifetime.",
    route:
      "Particles and the inflammation they cause cross the placenta. Children breathe more air per kilogram of body weight than adults, spend more time outdoors, and have lungs and brains still under construction.",
    emphasis: "standard",
    effects: [
      {
        fromBand: 1,
        text: "Cumulative exposure during pregnancy matters even at low daily levels — there is no threshold below which it is entirely safe",
        drivers: ["pm2_5"],
        sensitiveOnly: true,
      },
      {
        fromBand: 2,
        text: "Children develop symptoms sooner and more intensely than adults at the same level",
        drivers: ["pm2_5", "ozone", "nitrogen_dioxide"],
        sensitiveOnly: true,
      },
      {
        fromBand: 3,
        text: "Raised risk of low birth weight and preterm birth with sustained exposure at this level",
        drivers: ["pm2_5"],
        sensitiveOnly: true,
      },
      {
        fromBand: 3,
        text: "School absence, reduced physical performance and more infections in children",
        drivers: ["pm2_5", "ozone"],
        sensitiveOnly: true,
      },
    ],
    protect: [
      "Lower the everyday baseline rather than reacting to spikes — cumulative dose is what counts here",
      "Filter the bedroom and the room a child spends most time in",
      "Choose routes and schools away from heavy traffic where you have any choice",
      "Standard masks rarely seal on small faces; rely on avoidance and indoor filtration instead",
    ],
    chronic:
      "Childhood exposure causes permanently reduced lung capacity, new-onset asthma, and measurable effects on cognitive development and school attainment.",
  },
];

/** Effects worth showing at a given band, split by who they apply to. */
export function effectsAtBand(system: BodySystem, band: number) {
  const active = system.effects.filter((e) => e.fromBand <= band);
  return {
    everyone: active.filter((e) => !e.sensitiveOnly),
    sensitive: active.filter((e) => e.sensitiveOnly),
  };
}
