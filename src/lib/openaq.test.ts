import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchStationSnapshot,
  hasOpenAqKey,
  measureForParameter,
  resetOpenAqBreaker,
} from "./openaq";
import { toUgm3, ppmToUgm3, ppbToUgm3 } from "./units";

/**
 * Shaped from the documented OpenAQ v3 responses: /v3/locations returns
 * stations with a `sensors` array, and /v3/locations/{id}/latest returns values
 * keyed by `sensorsId`, so the two must be joined to know what a value means.
 */
const NOW = Date.parse("2026-08-04T14:00:00Z");

function locationsResponse() {
  return {
    meta: { name: "openaq-api", page: 1, limit: 12 },
    results: [
      {
        id: 8118,
        name: "US Diplomatic Post: New Delhi",
        provider: { id: 119, name: "AirNow" },
        isMobile: false,
        isMonitor: true,
        coordinates: { latitude: 28.5983, longitude: 77.1889 },
        distance: 3200,
        sensors: [
          { id: 3920, name: "pm25 µg/m³", parameter: { id: 2, name: "pm25", units: "µg/m³" } },
          { id: 3917, name: "o3 ppm", parameter: { id: 10, name: "o3", units: "ppm" } },
        ],
      },
      {
        id: 9999,
        name: "CPCB Anand Vihar",
        provider: { id: 4, name: "CPCB" },
        isMobile: false,
        isMonitor: true,
        coordinates: { latitude: 28.6469, longitude: 77.3162 },
        distance: 11800,
        sensors: [
          { id: 5001, name: "pm25 µg/m³", parameter: { id: 2, name: "pm25", units: "µg/m³" } },
          { id: 5002, name: "no2 ppb", parameter: { id: 7, name: "no2", units: "ppb" } },
          { id: 5003, name: "pm10 µg/m³", parameter: { id: 1, name: "pm10", units: "µg/m³" } },
        ],
      },
      {
        id: 7777,
        name: "Mobile van",
        provider: { name: "Research" },
        isMobile: true,
        isMonitor: true,
        distance: 900,
        sensors: [
          { id: 6001, name: "pm25 µg/m³", parameter: { id: 2, name: "pm25", units: "µg/m³" } },
        ],
      },
    ],
  };
}

const fresh = { utc: "2026-08-04T13:00:00Z", local: "2026-08-04T18:30:00+05:30" };
const stale = { utc: "2026-08-03T02:00:00Z", local: "2026-08-03T07:30:00+05:30" };

function latestFor(id: number) {
  if (id === 8118) {
    return {
      results: [
        { datetime: fresh, value: 82.4, sensorsId: 3920, locationsId: 8118 },
        { datetime: fresh, value: 0.031, sensorsId: 3917, locationsId: 8118 },
      ],
    };
  }
  if (id === 9999) {
    return {
      results: [
        { datetime: fresh, value: 61.2, sensorsId: 5001, locationsId: 9999 },
        { datetime: fresh, value: 24.5, sensorsId: 5002, locationsId: 9999 },
        { datetime: stale, value: 140, sensorsId: 5003, locationsId: 9999 },
      ],
    };
  }
  return { results: [] };
}

function stubApi() {
  const fetchMock = vi.fn(async (input: string | URL) => {
    const url = new URL(String(input));
    const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response;

    if (url.pathname === "/v3/locations") return ok(locationsResponse());

    const match = url.pathname.match(/^\/v3\/locations\/(\d+)\/latest$/);
    if (match) return ok(latestFor(Number(match[1])));

    return { ok: false, status: 404, json: async () => ({}) } as Response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  resetOpenAqBreaker();
  process.env.OPENAQ_API_KEY = "test-key";
});

afterEach(() => {
  delete process.env.OPENAQ_API_KEY;
  vi.restoreAllMocks();
});

describe("parameter mapping", () => {
  it("maps OpenAQ names onto our measure keys", () => {
    expect(measureForParameter("pm25")).toBe("pm2_5");
    expect(measureForParameter("PM25")).toBe("pm2_5");
    expect(measureForParameter("o3")).toBe("ozone");
    expect(measureForParameter("no2")).toBe("nitrogen_dioxide");
    expect(measureForParameter("so2")).toBe("sulphur_dioxide");
    expect(measureForParameter("co")).toBe("carbon_monoxide");
  });

  it("ignores parameters we do not model", () => {
    expect(measureForParameter("nox")).toBeNull();
    expect(measureForParameter("bc")).toBeNull();
    expect(measureForParameter("relativehumidity")).toBeNull();
  });
});

describe("unit normalisation", () => {
  it("passes µg/m³ through untouched, including the ASCII spelling", () => {
    expect(toUgm3(82.4, "µg/m³", "pm2_5")).toBe(82.4);
    expect(toUgm3(82.4, "ug/m3", "pm2_5")).toBe(82.4);
  });

  it("converts ppm and ppb for gases", () => {
    // 0.031 ppm ozone is roughly 61 µg/m³ at EPA reference conditions.
    expect(ppmToUgm3(0.031, "ozone")).toBeCloseTo(60.9, 0);
    expect(ppbToUgm3(24.5, "nitrogen_dioxide")).toBeCloseTo(46.1, 0);
  });

  it("round-trips against the forward conversion", () => {
    expect(ppmToUgm3(0.07, "ozone")).toBeCloseTo(137.4, 0);
    expect(toUgm3(1.5, "mg/m³", "carbon_monoxide")).toBe(1500);
  });

  it("refuses a unit it cannot convert rather than guessing", () => {
    expect(toUgm3(5, "ppm", "pm2_5")).toBeNull();
    expect(toUgm3(5, "particles/cm³", "pm2_5")).toBeNull();
  });
});

describe("station snapshot", () => {
  it("returns nothing without a key, so the app stays model-only", async () => {
    delete process.env.OPENAQ_API_KEY;
    const fetchMock = stubApi();
    expect(hasOpenAqKey()).toBe(false);
    await expect(fetchStationSnapshot(28.6139, 77.209, 25000, NOW)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the key as a header and never in the query string", async () => {
    const fetchMock = stubApi();
    await fetchStationSnapshot(28.6139, 77.209, 25000, NOW);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(String(url)).not.toContain("test-key");
    expect((init.headers as Record<string, string>)["X-API-Key"]).toBe("test-key");
  });

  it("picks the nearest station per pollutant, not the nearest station overall", async () => {
    stubApi();
    const snap = await fetchStationSnapshot(28.6139, 77.209, 25000, NOW);

    const pm25 = snap!.readings.find((r) => r.measure === "pm2_5");
    // Both stations report PM2.5; the 3.2 km one must win over the 11.8 km one.
    expect(pm25?.stationName).toBe("US Diplomatic Post: New Delhi");
    expect(pm25?.value).toBe(82.4);

    // NO2 exists only at the further station, so it should still be included.
    const no2 = snap!.readings.find((r) => r.measure === "nitrogen_dioxide");
    expect(no2?.stationName).toBe("CPCB Anand Vihar");
  });

  it("converts gas units into µg/m³ while keeping the original for display", async () => {
    stubApi();
    const snap = await fetchStationSnapshot(28.6139, 77.209, 25000, NOW);

    const ozone = snap!.readings.find((r) => r.measure === "ozone");
    expect(ozone?.rawValue).toBe(0.031);
    expect(ozone?.rawUnit).toBe("ppm");
    expect(ozone?.value).toBeCloseTo(60.9, 0);
  });

  it("drops readings too old to describe current conditions", async () => {
    stubApi();
    const snap = await fetchStationSnapshot(28.6139, 77.209, 25000, NOW);
    // PM10 is present but over a day old.
    expect(snap!.readings.some((r) => r.measure === "pm10")).toBe(false);
  });

  it("excludes mobile stations, whose location is not meaningful", async () => {
    stubApi();
    const snap = await fetchStationSnapshot(28.6139, 77.209, 25000, NOW);
    expect(snap!.stations.some((s) => s.name === "Mobile van")).toBe(false);
  });

  it("reports distance and age so the UI can show provenance", async () => {
    stubApi();
    const snap = await fetchStationSnapshot(28.6139, 77.209, 25000, NOW);

    const pm25 = snap!.readings.find((r) => r.measure === "pm2_5")!;
    expect(pm25.distanceKm).toBeCloseTo(3.2, 1);
    expect(pm25.ageMinutes).toBe(60);
    expect(pm25.provider).toBe("AirNow");
  });

  it("groups contributing stations nearest first", async () => {
    stubApi();
    const snap = await fetchStationSnapshot(28.6139, 77.209, 25000, NOW);
    expect(snap!.stations.map((s) => s.distanceKm)).toEqual([3.2, 11.8]);
  });

  it("fails soft when the key is rejected, and stops asking", async () => {
    const fetchMock = vi.fn(
      async () => ({ ok: false, status: 401, json: async () => ({}) }) as Response,
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchStationSnapshot(28.6139, 77.209, 25000, NOW)).resolves.toBeNull();
    await expect(fetchStationSnapshot(19.076, 72.877, 25000, NOW)).resolves.toBeNull();
    // Breaker means the second location costs no request at all.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fails soft when there are no stations in range", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ results: [] }) }) as Response),
    );
    await expect(fetchStationSnapshot(0, 0, 25000, NOW)).resolves.toBeNull();
  });

  it("caps the radius at the 25 km the API allows", async () => {
    const fetchMock = stubApi();
    await fetchStationSnapshot(28.6139, 77.209, 90000, NOW);
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.searchParams.get("radius")).toBe("25000");
  });
});
