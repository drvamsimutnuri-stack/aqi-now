import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAirQuality, fetchAirQualityBatch, reverseGeocode } from "./openmeteo";

const payload = { latitude: 17.4, longitude: 78.5, elevation: 500, timezone: "Asia/Kolkata" };

function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchAirQuality resilience", () => {
  it("recovers from a transient 5xx instead of failing the page", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(null, 503))
      .mockResolvedValueOnce(jsonResponse(payload));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAirQuality(17.385, 78.4867)).resolves.toMatchObject({ latitude: 17.4 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("recovers from a dropped connection", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(jsonResponse(payload));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAirQuality(17.385, 78.4867)).resolves.toMatchObject({ latitude: 17.4 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries a rate limit", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(null, 429))
      .mockResolvedValueOnce(jsonResponse(null, 429))
      .mockResolvedValueOnce(jsonResponse(payload));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAirQuality(17.385, 78.4867)).resolves.toMatchObject({ latitude: 17.4 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not waste retries on a client error", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(null, 400));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAirQuality(17.385, 78.4867)).rejects.toThrow(/HTTP 400/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gives up after exhausting attempts", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(null, 503));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAirQuality(17.385, 78.4867)).rejects.toThrow(/HTTP 503/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("requests the coordinates it was given", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(payload));
    vi.stubGlobal("fetch", fetchMock);

    await fetchAirQuality(17.385, 78.4867);
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    // Sent at 4-decimal precision, roughly 11 metres — enough to be exact for
    // our purposes without turning a user's position into a fingerprint.
    expect(Number(url.searchParams.get("latitude"))).toBe(17.385);
    expect(Number(url.searchParams.get("longitude"))).toBe(78.4867);
  });
});

/**
 * The city ranking used to ask for all 57 locations in one request, which
 * Open-Meteo either refused with HTTP 429 or took minutes to answer, breaking
 * the whole page. It is now chunked, and a failed chunk must cost only its own
 * rows — never the alignment of the rest.
 */
describe("batched city requests", () => {
  const points = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ latitude: i, longitude: i }));

  function batchStub(handler: (locations: number) => { ok: boolean; count?: number }) {
    return vi.fn(async (input: string | URL) => {
      const url = new URL(String(input));
      const locations = url.searchParams.get("latitude")!.split(",").length;
      const outcome = handler(locations);
      if (!outcome.ok) return { ok: false, status: 429, json: async () => ({}) } as Response;

      const count = outcome.count ?? locations;
      const body = Array.from({ length: count }, (_, i) => ({
        latitude: i,
        hourly: { time: ["2026-08-04T13:00"] },
      }));
      return { ok: true, status: 200, json: async () => body } as Response;
    });
  }

  it("splits a large request into chunks of at most 12 locations", async () => {
    const fetchMock = batchStub(() => ({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const results = await fetchAirQualityBatch(points(57));

    expect(results).toHaveLength(57);
    expect(fetchMock).toHaveBeenCalledTimes(5);
    for (const call of fetchMock.mock.calls) {
      const url = new URL(String(call[0]));
      expect(url.searchParams.get("latitude")!.split(",").length).toBeLessThanOrEqual(12);
    }
  });

  it("keeps a failed chunk from shifting every later city", async () => {
    // Refuse the middle chunk on every attempt, keyed by its first latitude so
    // retries cannot rescue it the way call-order would allow.
    const fetchMock = vi.fn(async (input: string | URL) => {
      const url = new URL(String(input));
      const lats = url.searchParams.get("latitude")!.split(",");
      if (lats[0] === "12.0000") {
        return { ok: false, status: 429, json: async () => ({}) } as Response;
      }
      const body = lats.map(() => ({ hourly: { time: ["2026-08-04T13:00"] } }));
      return { ok: true, status: 200, json: async () => body } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    const results = await fetchAirQualityBatch(points(36));

    // Still one entry per city, so results zip back against the input in order.
    expect(results).toHaveLength(36);
    expect(results.filter((r) => r.hourly?.time?.length).length).toBe(24);
    // The gap sits exactly where the refused chunk was, not at the end.
    expect(results.slice(12, 24).every((r) => !r.hourly)).toBe(true);
    expect(results.slice(24).every((r) => Boolean(r.hourly))).toBe(true);
  });

  it("pads a short response rather than misaligning the rest", async () => {
    const fetchMock = batchStub((locations) => ({ ok: true, count: locations - 3 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAirQualityBatch(points(24))).resolves.toHaveLength(24);
  });

  it("returns everything even when every chunk is refused", async () => {
    const fetchMock = batchStub(() => ({ ok: false }));
    vi.stubGlobal("fetch", fetchMock);

    const results = await fetchAirQualityBatch(points(24));
    expect(results).toHaveLength(24);
    expect(results.every((r) => !r.hourly)).toBe(true);
  });

  it("uses the same trailing window as the detail pages", async () => {
    const fetchMock = batchStub(() => ({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchAirQualityBatch(points(4));
    const single = new URL(String(fetchMock.mock.calls[0][0]));

    vi.mocked(fetchMock).mockClear();
    await fetchAirQuality(1, 1);
    const detail = new URL(String(fetchMock.mock.calls[0][0]));

    // A shorter window here shifts the 24-hour mean and makes a city's ranking
    // disagree with its own page.
    expect(single.searchParams.get("past_hours")).toBe(detail.searchParams.get("past_hours"));
  });

  it("does nothing when given no points", async () => {
    const fetchMock = batchStub(() => ({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchAirQualityBatch([])).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

/**
 * Place names are cosmetic, so an unreachable Nominatim must never be allowed
 * to slow a page down. This is the bug that made renders take 11 seconds.
 */
describe("reverseGeocode never blocks a page", () => {
  it("returns a name when the lookup succeeds", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ address: { city: "Hyderabad", state: "Telangana", country: "India" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(reverseGeocode(17.385, 78.4867)).resolves.toEqual({
      name: "Hyderabad",
      region: "Telangana",
      country: "India",
    });
  });

  it("caps how long it waits, rather than inheriting a 10s connect timeout", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ address: { city: "X" } }));
    vi.stubGlobal("fetch", fetchMock);

    await reverseGeocode(1, 1);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("fails soft and then stops asking, so one outage is not paid per visitor", async () => {
    const failing = vi.fn().mockRejectedValue(new Error("connect timeout"));
    vi.stubGlobal("fetch", failing);

    // Distinct coordinates prove the breaker is global, not per-location.
    await expect(reverseGeocode(51.5, -0.12)).resolves.toBeNull();
    expect(failing).toHaveBeenCalledTimes(1);

    await expect(reverseGeocode(19.07, 72.87)).resolves.toBeNull();
    await expect(reverseGeocode(28.61, 77.2)).resolves.toBeNull();
    expect(failing).toHaveBeenCalledTimes(1);
  });
});
