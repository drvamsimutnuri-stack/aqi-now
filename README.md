# AQI Now

Live air quality for any point on Earth, scored on three national standards, with the health effects
of every pollutant it reports.

The premise: a single AQI number is a compressed summary that hides both *what* you are breathing and
*whose* scale it was measured against. This app shows the number, then unpacks it — every pollutant,
its own sub-index, the averaging window behind it, and what it does to your body.

## What it does

- **Instant AQI on three standards.** US EPA (0–500), European EAQI (0–120) and India's CPCB National
  AQI (0–500), computed side by side from one set of concentrations.
- **Every index-forming pollutant.** PM2.5, PM10, ozone, NO₂, SO₂, CO and ammonia, each with its own
  sub-index, concentration, averaging window and category.
- **Additional atmospheric measures.** Saharan/mineral dust, aerosol optical depth, UV index and
  methane — not part of any AQI, but they change what you should do.
- **Pollen.** Alder, birch, grass, mugwort, olive and ragweed counts where they are modelled.
- **Dominant pollutant.** Which pollutant actually set the headline number.
- **Health effects.** Per-band activity, mask and ventilation guidance, plus per-pollutant short-term
  and long-term effects, sources, WHO 2021 guideline levels and who is affected first.
- **Cigarette equivalent.** The 24-hour PM2.5 dose expressed in cigarettes.
- **24-hour history and 3-day hourly forecast**, recomputed hour by hour with the same engine as the
  headline number.
- **Live ranking** of 57 major cities from a single batched upstream request.
- **Location by search or GPS**, with shareable URLs and pre-rendered pages for each curated city.

## How the index is calculated

Not a passthrough of someone else's AQI field. Concentrations come in as µg/m³ and go through the
published breakpoint tables in `src/lib/standards.ts`:

1. **Average over the window the standard requires** — 24 hours for PM, 8 hours for ozone and CO,
   1 hour for NO₂ and SO₂ — requiring the EPA's 75 % data completeness before reporting anything.
2. **Convert to the table's unit** — ppm/ppb for the EPA, mg/m³ for India's CO table — using the
   ideal-gas molar volume of 24.45 L/mol at 25 °C, then truncate to the specified precision.
3. **Interpolate within the breakpoint row**, and take the worst pollutant as the overall index.

Two details worth calling out:

- **The EPA NowCast.** Current-hour particulates use the EPA's NowCast: a 12-hour weighted average
  whose weight factor `w = 1 − (max − min) / max` (floored at 0.5) shrinks the influence of older
  hours as conditions destabilise. In steady air it behaves like a 12-hour mean; when smoke arrives
  it tracks the most recent hour. This is what AirNow publishes as "current AQI", and it is the
  honest answer to "what is the AQI *right now*" given that the underlying health thresholds are
  24-hour averages.
- **2024 PM2.5 breakpoints.** The EPA's February 2024 revision moved the 50-point boundary from
  12.0 to 9.0 µg/m³. Many services still use the old table; this one does not, which is why our US
  AQI can read several points higher than theirs on a low-PM day.

The breakpoint tables, category bands and full method are also rendered for readers at `/standards`.

## Data sources

| Data | Source |
| --- | --- |
| Pollutant concentrations, pollen, UV | [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api), serving Copernicus CAMS |
| City search | Open-Meteo Geocoding |
| Reverse geocoding | OpenStreetMap Nominatim |
| Ground-station readings (optional) | [OpenAQ v3](https://docs.openaq.org/) — official reference monitors (CPCB, AirNow, EEA) |

CAMS is a global model at roughly 11 km resolution, not a street-corner sensor, so its readings are a
well-informed estimate for an area. Where OpenAQ has a reference monitor nearby, the app shows what was
actually measured next to what the model predicted, and names the station and its distance.

The headline AQI stays model-derived even when station data is present. The index needs 24-hour averages
while OpenAQ's `latest` endpoint returns single hours, so substituting one into the other would produce a
number belonging to neither source.

## Getting started

Requires Node.js 20 or newer.

```bash
npm install
npm run dev          # http://localhost:3001
```

Everything works without any API key; the station comparison simply stays hidden. To enable it, register
for a free key at [openaq.org](https://openaq.org/register) and add it to `.env.local`:

```bash
OPENAQ_API_KEY=your_key_here
```

OpenAQ v3 requires a key — the older keyless v1 and v2 endpoints are retired and return `410 Gone`. The
client fails soft in every direction: no key, a rejected key, a timeout or no nearby station all fall back
to model-only rather than degrading the page.

```bash
npm test             # AQI engine tests against published EPA/EAQI/CPCB reference values
npm run build        # production build, pre-renders every curated city page
npm run lint
```

## Project layout

```
src/lib/
  standards.ts    breakpoint tables and category bands for US / EU / India
  aqi.ts          averaging (incl. NowCast), unit conversion, interpolation, index selection
  units.ts        µg/m³ to ppm / ppb / mg/m³
  pollutants.ts   pollutant knowledge base: sources, health effects, WHO guidelines
  health.ts       guidance bands, UV advice
  openmeteo.ts    upstream API clients, single and batched
  snapshot.ts     composes one location's full reading
  ranking.ts      batched multi-city index
  cities.ts       curated cities with pre-rendered pages
src/app/
  page.tsx            home; location from ?lat&lon&name, defaults to Delhi
  aqi/[slug]/         pre-rendered page per curated city
  cities/             live ranking table
  standards/          how the indices are calculated
  pollutants/         pollutant reference
  api/snapshot/       JSON reading for a coordinate
  api/geocode/        forward and reverse geocoding
```

Upstream responses are cached for 10 minutes (15 for the ranking), so traffic scales without
hammering the source.

## Scaling notes

Deliberate choices that make this straightforward to grow into a public site:

- Every page is server-rendered with real content, so pollutant and city pages are indexable.
- Curated city pages are statically generated with incremental revalidation.
- Arbitrary locations use shareable `?lat&lon` URLs and go through the same view.
- The AQI engine is pure and dependency-free, so it also runs in a worker, a cron job or an API.
- Timestamps are formatted as wall-clock without timezone conversion, so a UTC server and a browser
  anywhere agree.

Sensible next steps: fold in ground-station data (OpenAQ or WAQI) and reconcile it with the model
where a monitor is nearby; add historical charts and per-city seasonal context; push notifications
when a threshold is crossed.

## Health information

Guidance is drawn from EPA AirNow activity recommendations and the WHO 2021 Air Quality Guidelines.
It is general information, not medical advice.
